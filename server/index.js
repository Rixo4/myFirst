require('dotenv').config();
const express = require('express');
const cors = require('cors');

const Profile = require('./models/Profile');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Get Learning Profile
app.get('/api/profile/:userId', async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.params.userId });

    if (!profile) {
      // Create default if it doesn't exist
      profile = await Profile.create({ userId: req.params.userId });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Update Learning Profile (After Search/Feedback)
app.post('/api/profile/:userId/update', async (req, res) => {
  try {
    const { action, topic, newInsight } = req.body;
    let profile = await Profile.findOne({ userId: req.params.userId });

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    profile.interactions += 1;

    // Simulate AI updating the profile dynamically
    if (action === 'search' && !profile.preferredTopics.includes(topic)) {
      profile.preferredTopics.push(topic);
    }

    if (newInsight) {
      // Add new insight to the top of the array
      profile.recentLearnings.unshift(newInsight);
      if (profile.recentLearnings.length > 5) {
        profile.recentLearnings.pop(); // Keep only last 5 insights
      }
    }

    // If feedback is thumbs up/down
    if (action === 'feedback_up') {
      profile.feedbackScore = Math.min(100, profile.feedbackScore + 2);
    } else if (action === 'feedback_down') {
      profile.feedbackScore = Math.max(0, profile.feedbackScore - 2);
    }

    await profile.save();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. ArXiv Proxy to bypass CORS natively
app.get('/api/search', async (req, res) => {
  try {
    const arxivQuery = req.query.q;
    const arxivUrl = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(arxivQuery)}&start=0&max_results=10`;
    
    // Fetch directly from Node (no CORS!)
    const response = await fetch(arxivUrl);
    if (!response.ok) throw new Error("ArXiv API failed");
    
    const text = await response.text();
    res.send(text); // Send raw XML back to the frontend
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Web Proxy via Serper API
app.post('/api/web-search', async (req, res) => {
  try {
    const { query } = req.body;
    const serperKey = process.env.SERPER_API_KEY;
    
    if (!serperKey) {
      return res.status(500).json({ error: "SERPER_API_KEY is missing in backend .env" });
    }

    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": serperKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q: query, num: 5 })
    });

    if (!response.ok) throw new Error("Serper API request failed");
    
    const data = await response.json();
    let mixedResults = [];
    
    // Aggregate results across all media types returned by Google
    if (data.organic) mixedResults = [...mixedResults, ...data.organic];
    if (data.news) mixedResults = [...mixedResults, ...data.news];
    if (data.videos) mixedResults = [...mixedResults, ...data.videos];
    
    res.json(mixedResults);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. Dynamic Research via Gemini LLM
app.post('/api/research', async (req, res) => {
  try {
    const { userId, query } = req.body;
    let profile = await Profile.findOne({ userId });

    if (!profile) {
      profile = { interactions: 0, preferredTopics: [], recentLearnings: [] };
    }

    // Construct the persona prompt based on the Neural Profile
    const systemPrompt = `You are an elite AI research assistant. 
The user is researching: "${query}".
User Profile Context: 
- They have interacted with you ${profile.interactions} times. 
- Their preferred topics are: ${profile.preferredTopics.join(', ')}.
- Recent system learnings about this user: ${profile.recentLearnings.join('; ')}.

Instructions: 
Using the above context, adapt your depth, tone, and complexity perfectly for this user. 
Do not mention that you are reading their profile, just act on it. 
Provide a clear, highly personalized research summary of the topic. Keep it concise but dense with value.`;

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is missing in the backend .env file" });
    }

    // Call Google Gemini API using official SDK
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    try {
      const result = await model.generateContent(`${systemPrompt}\n\nTask: Based on the context, provide the requested output.`);
      const responseText = result.response.text();

      res.json({
        title: `Research Analysis: ${query}`,
        content: responseText.trim(),
        insights: `Generated dynamically using Gemini 1.5 Flash, adapted to your ${profile.interactions} past interactions.`,
        recommendations: ["Analyze underlying assumptions", "Investigate recent breakthroughs"]
      });
    } catch (apiError) {
      console.warn("Gemini API Error (likely quota exceeded). Falling back to free Pollinations AI...", apiError.message);
      
      // FALLBACK MECHANISM: Use completely free Pollinations AI API
      try {
        const fallbackResponse = await fetch('https://text.pollinations.ai/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Task: ${query}\nProvide the requested output perfectly without extra chat.` }
            ],
            model: 'openai'
          })
        });
        
        const responseText = await fallbackResponse.text();
        
        res.json({
          title: `AI Analysis (Pollinations API)`,
          content: responseText.trim(),
          insights: `Generated using a free fallback AI model because your Gemini quota was exceeded.`,
          recommendations: ["Review Gemini Quota", "Upgrade API Tier"]
        });
      } catch (fallbackError) {
        console.error("Fallback AI failed:", fallbackError);
        res.status(500).json({ error: "Both Primary and Fallback AI APIs failed." });
      }
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

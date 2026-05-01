require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

const Profile = require('./models/Profile');

const app = express();

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), env: !!process.env.SERPER_API_KEY ? 'Serper Key Present' : 'Serper Key Missing' });
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

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
    res.send(text);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Document: Upload, Extract Text & AI Summary
app.post('/api/document/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const ext = path.extname(req.file.originalname).toLowerCase();
    let text = '';

    if (ext === '.pdf') {
      const parser = new PDFParse({ data: req.file.buffer });
      const data = await parser.getText();
      text = data.text;
      await parser.destroy();
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    } else if (ext === '.txt') {
      text = req.file.buffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Use PDF, DOCX, or TXT.' });
    }

    // Truncate for AI (max ~8000 chars)
    const truncated = text.slice(0, 8000);

    // Generate AI summary
    let summary = "Summary unavailable due to AI service interruption.";
    try {
      const aiRes = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a document analyst. Give a clear, structured summary of the document in 3-5 sentences covering its main topic, key points, and purpose.' },
            { role: 'user', content: `Summarize this document:\n\n${truncated}` }
          ],
          model: 'openai', seed: 42
        })
      });
      if (aiRes.ok) {
        const aiText = await aiRes.text();
        if (aiText && !aiText.includes('<!DOCTYPE html>')) {
          summary = aiText.trim();
        }
      }
    } catch (e) { console.error("Summary error:", e); }

    res.json({ filename: req.file.originalname, size: req.file.size, ext, text: truncated, summary, wordCount: text.split(/\s+/).length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Document: Q&A Chat with document context
app.post('/api/document/chat', async (req, res) => {
  try {
    const { messages, documentText } = req.body;
    const aiRes = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: `You are a helpful AI assistant. The user has uploaded a document. Answer their questions based on the document content below. Be conversational, accurate, and cite relevant parts when helpful.\n\n--- DOCUMENT ---\n${documentText}\n--- END DOCUMENT ---` },
          ...messages
        ],
        model: 'openai', seed: 42
      })
    });
    
    if (!aiRes.ok) {
      return res.status(502).json({ error: "AI service is temporarily unavailable. Please try again later." });
    }
    
    const reply = await aiRes.text();
    if (reply.includes('<!DOCTYPE html>')) {
       return res.status(502).json({ error: "AI service returned an error page. Please try again later." });
    }
    
    res.json({ reply: reply.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// 5. Knowledge Graph Generation via AI
app.post('/api/knowledge-graph', async (req, res) => {
  try {
    const { query } = req.body;
    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a knowledge graph generator. ALWAYS return ONLY valid JSON. No markdown, no explanation, no code fences. Just the raw JSON object.'
          },
          {
            role: 'user',
            content: `Generate a knowledge graph for the research topic: "${query}".
Return ONLY this JSON structure with 8-12 nodes and 10-15 edges:
{
  "nodes": [
    {"id": "1", "label": "MainTopic", "type": "topic", "description": "brief description"},
    {"id": "2", "label": "SubConcept", "type": "concept", "description": "brief description"}
  ],
  "edges": [
    {"from": "1", "to": "2", "label": "includes"}
  ]
}
Node types must be one of: topic, method, concept, dataset, author
Make node id "1" the central topic. Be accurate and comprehensive.`
          }
        ],
        model: 'openai',
        seed: 42
      })
    });

    if (!response.ok) {
       throw new Error("AI service unavailable for Knowledge Graph generation.");
    }

    const text = await response.text();
    if (text.includes('<!DOCTYPE html>')) {
       throw new Error("AI service returned an error page.");
    }

    // Robust JSON extraction: strip markdown fences, grab largest {...} block
    let cleaned = text
      .replace(/```json/gi, '').replace(/```/g, '')  // strip code fences
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')  // strip control chars
      .trim();

    // Find the outermost { ... }
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON object found in AI response');
    cleaned = cleaned.slice(start, end + 1);

    let graphData;
    try {
      graphData = JSON.parse(cleaned);
    } catch {
      // Fallback: return a minimal sample graph so UI doesn't break
      graphData = {
        nodes: [
          { id: '1', label: query, type: 'topic', description: 'Central topic' },
          { id: '2', label: 'Core Concept', type: 'concept', description: 'Key idea' },
          { id: '3', label: 'Method A', type: 'method', description: 'Main technique' },
          { id: '4', label: 'Method B', type: 'method', description: 'Alternative technique' },
          { id: '5', label: 'Dataset', type: 'dataset', description: 'Benchmark dataset' },
        ],
        edges: [
          { from: '1', to: '2', label: 'includes' },
          { from: '1', to: '3', label: 'uses' },
          { from: '1', to: '4', label: 'uses' },
          { from: '2', to: '5', label: 'trained on' },
        ]
      };
    }

    res.json(graphData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    // messages = [{role: 'user'|'assistant', content: '...'}]

    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are Nexus, a friendly, witty, and highly intelligent AI assistant. 
You talk naturally and conversationally like a real person — not like a report generator. 
Keep responses concise and engaging unless the user explicitly asks for detail.
Use casual language, be warm, direct, and helpful. 
You can answer anything: general knowledge, science, coding, opinions, jokes, advice, etc.
Never format responses as bullet points or sections unless specifically asked.`
          },
          ...messages
        ],
        model: 'openai',
        seed: 42
      })
    });

    if (!response.ok) {
      return res.status(502).json({ error: "AI service is currently unavailable. Please try again later." });
    }

    const text = await response.text();
    if (text.includes('<!DOCTYPE html>')) {
      return res.status(502).json({ error: "AI service returned an invalid response. Please try again later." });
    }

    res.json({ reply: text.trim() });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

const PORT = process.env.PORT || 5002;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { app, server };

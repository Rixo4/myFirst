import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, BrainCircuit, Sparkles, ThumbsUp, ThumbsDown, 
  ChevronRight, Activity, BookOpen, UserCircle, Target,
  RefreshCw, Bot, Lightbulb, MessageSquare, Compass, Tag, Brain, Filter, MousePointerClick, ListOrdered,
  LayoutDashboard, FileText, Share2, TrendingUp, Users, User, BarChart2, Settings, UploadCloud
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Dashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [learningProfile, setLearningProfile] = useState(null);
  const [user, setUser] = useState(null);
  
  // Track which result has an active explanation/summary
  const [activeAction, setActiveAction] = useState({ id: null, type: null });
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('Smart Search');
  const [searchIntent, setSearchIntent] = useState(null);
  const [filteredCount, setFilteredCount] = useState(0);
  const [mediaTypeFilter, setMediaTypeFilter] = useState('All');

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      // DEV BYPASS CHECK
      if (localStorage.getItem('dev_bypass') === 'true') {
        setUser({ id: 'dev-user-bypass' });
        setLearningProfile({
          interactions: 42,
          feedbackScore: 98,
          preferredTopics: ["Machine Learning", "Quantum Computing", "Neuromorphic Engineering"],
          recentLearnings: ["Dev Bypass Active.", "Bypassed Supabase authentication."]
        });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      
      setUser(session.user);
      
      // Fetch their personalized neural profile from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (data) {
        setLearningProfile({
          interactions: data.interactions || 0,
          feedbackScore: data.feedback_score || 88,
          preferredTopics: data.preferred_topics || ["Machine Learning", "Quantum Computing"],
          recentLearnings: data.recent_learnings || ["Profile initialized."]
        });
      } else {
        // If profile doesn't exist yet (or RLS blocked it), initialize a default one in memory
        console.warn("Profile not found or blocked by RLS. Initializing default.");
        setLearningProfile({
          interactions: 0,
          feedbackScore: 88,
          preferredTopics: ["Machine Learning", "Optimization", "Materials Science"],
          recentLearnings: ["New profile initialized."]
        });
        
        // Try to insert it into DB just in case
        await supabase.from('profiles').insert([{ id: session.user.id }]);
      }
    };

    fetchUserAndProfile().then(() => {
      // Check if they came from the landing page search bar
      const initialSearch = localStorage.getItem('initial_search');
      if (initialSearch) {
        setQuery(initialSearch);
        localStorage.removeItem('initial_search');
        // Need a slight delay to let state and components mount before executing fetch
        setTimeout(() => {
          executeSearch(initialSearch);
        }, 100);
      }
    });
  }, [navigate]);

  const updateProfileInDB = async (updates) => {
    if (!user) return;
    
    // Optimistic UI Update
    setLearningProfile(prev => ({ ...prev, ...updates }));
    
    // DB Update
    const { error } = await supabase
      .from('profiles')
      .update({
        interactions: updates.interactions,
        feedback_score: updates.feedbackScore,
        preferred_topics: updates.preferredTopics,
        recent_learnings: updates.recentLearnings
      })
      .eq('id', user.id);
      
    if (error) console.error("Error updating profile in DB:", error);
  };

  const executeSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchIntent(simulateIntentDetection(searchQuery));
    setFilteredCount(Math.floor(Math.random() * 20) + 12); 
    
    // Fetch exclusively from the Live Web (Google/Serper)
    const webResults = await fetchFromWeb(searchQuery);
    
    if (webResults.length > 0) {
      setResults(webResults);
      
      if (learningProfile) {
        updateProfileInDB({
          ...learningProfile,
          interactions: learningProfile.interactions + 1,
          recentLearnings: [`Explored live web results for "${searchQuery}".`, ...learningProfile.recentLearnings.slice(0, 2)]
        });
      }
    } else {
      setResults([]);
    }
    
    setIsSearching(false);
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    executeSearch(query);
  };

  const handlePredictiveSearch = (topic) => {
    setQuery(topic);
    executeSearch(topic);
  };

  const simulateIntentDetection = (userQuery) => {
    const lowerQ = userQuery.toLowerCase();
    if (lowerQ.includes('cancer') || lowerQ.includes('medical')) {
      return "Medical applications of AI in oncology (Prioritizing clinical validation)";
    }
    if (lowerQ.includes('quantum')) {
      return "Quantum computation architectures (Prioritizing fault-tolerance)";
    }
    return `Deep technical exploration of ${userQuery}`;
  };

  const fetchFromWeb = async (searchQuery) => {
    try {
      const response = await fetch('http://localhost:5001/api/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      
      if (!response.ok) throw new Error("Web search failed");
      const data = await response.json();
      
      return data.map((item, index) => {
        // Determine media type based on object properties to match the new UI tabs
        let mediaType = "blog"; // default to blog instead of web content
        if (item.title.toLowerCase().includes('pdf') || item.link?.includes('.pdf') || item.link?.includes('arxiv.org') || item.link?.includes('doi.org')) mediaType = "paper";
        if (item.title.toLowerCase().includes('survey') || item.title.toLowerCase().includes('review')) mediaType = "survey";
        if (item.title.toLowerCase().includes('dataset') || item.link?.includes('kaggle') || item.link?.includes('huggingface.co/datasets')) mediaType = "dataset";
        if (item.link?.includes('patents.google') || item.title.toLowerCase().includes('patent')) mediaType = "patent";

        const validLink = item.link || item.url || `https://google.com/search?q=${encodeURIComponent(item.title)}`;

        return {
          id: `web-${index}-${Date.now()}`,
          topic: mediaType,
          title: item.title,
          content: item.snippet || item.date || "Media content available at source.",
          link: validLink,
          authors: item.source || item.channel || new URL(validLink).hostname.replace('www.', ''),
          published: item.date || "Recent",
          insights: `Live ${mediaType.toLowerCase()} matching your search.`,
          recommendations: [`Open ${mediaType}`, "Explore related topics"],
          feedbackGiven: null,
          explanation: null,
          summary: null,
          isWeb: true
        };
      });
    } catch (err) {
      console.warn("Web search failed", err);
      return [];
    }
  };

  const handleAIAction = async (resultId, actionType) => {
    setIsGenerating(true);
    setActiveAction({ id: resultId, type: actionType });
    
    try {
      const targetResult = results.find(r => r.id === resultId);
      let promptQuery = '';
      if (actionType === 'explain') {
        promptQuery = `Explain this research abstract in simple terms for a beginner: ${targetResult.content}`;
      } else if (actionType === 'summarize') {
        promptQuery = `Summarize this research abstract into 3 concise bullet points: ${targetResult.content}`;
      } else if (actionType === 'counter') {
        promptQuery = `Act as a critical reviewer. Identify potential counter-arguments or opposing views to the claims made in this abstract: ${targetResult.content}`;
      } else if (actionType === 'limitations') {
        promptQuery = `Analyze this abstract and identify potential methodological limitations, biases, or gaps in the research: ${targetResult.content}`;
      }

      const response = await fetch('http://localhost:5001/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'default_user_1',
          query: promptQuery
        })
      });

      if (!response.ok) throw new Error('Failed to fetch from backend');
      const data = await response.json();

      setResults(results.map(r => {
        if (r.id === resultId) {
          if (actionType === 'explain') return { ...r, explanation: data.content };
          if (actionType === 'summarize') return { ...r, summary: data.content };
          if (actionType === 'counter') return { ...r, explanation: data.content }; // Using explanation field to display
          if (actionType === 'limitations') return { ...r, summary: data.content }; // Using summary field to display
        }
        return r;
      }));
    } catch (err) {
      console.error(err);
      setResults(results.map(r => {
        if (r.id === resultId) {
          const errMsg = "Error: Could not generate response. Please check if your backend and Gemini API are working.";
          if (actionType === 'explain') return { ...r, explanation: errMsg };
          if (actionType === 'summarize') return { ...r, summary: errMsg };
        }
        return r;
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFeedback = (resultId, type) => {
    // Rule 4: Learn from User Behavior
    setResults(results.map(r => 
      r.id === resultId ? { ...r, feedbackGiven: type } : r
    ));

    if (learningProfile) {
      updateProfileInDB({
        ...learningProfile,
        feedbackScore: type === 'up' ? Math.min(100, learningProfile.feedbackScore + 2) : Math.max(0, learningProfile.feedbackScore - 2),
        recentLearnings: [
          type === 'up' ? "Reinforced preference for this insight style" : "Adjusting algorithm to avoid similar recommendations",
          ...learningProfile.recentLearnings.slice(0, 2)
        ]
      });
    }
  };

  const trackClick = (topic) => {
    // Rule 4: Learn from clicks and time spent
    if (learningProfile) {
      updateProfileInDB({
        ...learningProfile,
        interactions: learningProfile.interactions + 1,
        recentLearnings: [`User clicked full paper on ${topic} - logging interest.`, ...learningProfile.recentLearnings.slice(0, 2)]
      });
    }
  };

  const handleRecommendationClick = (result, recommendation) => {
    if (recommendation.toLowerCase().startsWith("open ")) {
      trackClick(result.topic);
      window.open(result.link, '_blank');
    } else {
      // Automate a follow-up search or explanation based on the recommendation
      const newQuery = `${recommendation} regarding ${result.title}`;
      setQuery(newQuery);
      executeSearch(newQuery);
      // Ensure the screen scrolls to the top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar - Learning Profile (Original) */}
      <aside className="sidebar glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <BrainCircuit size={28} className="text-gradient" />
          <h2>Nexus AI</h2>
        </div>
        
        <p style={{ fontSize: '0.9rem', marginTop: '-12px', marginBottom: '24px' }}>
          Your continuously adapting research assistant.
        </p>

        {!learningProfile ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="pulse" style={{ margin: '0 auto 10px' }} />
            <p>Connecting to Neural DB...</p>
          </div>
        ) : (
          <>
            <div className="profile-section">
              <h3><UserCircle size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }}/> Neural Profile</h3>
              <div className="profile-stat">
                <span className="stat-label"><Activity size={16}/> Interactions Logged</span>
                <span className="stat-value">{learningProfile.interactions}</span>
              </div>
              <div className="profile-stat">
                <span className="stat-label"><Target size={16}/> Precision Score</span>
                <span className="stat-value text-gradient">{learningProfile.feedbackScore}%</span>
              </div>
            </div>

            <div className="profile-section">
              <h3><Tag size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }}/> Monitored Interests</h3>
              <div>
                {learningProfile.preferredTopics.map(topic => (
                  <span key={topic} className="topic-tag">{topic}</span>
                ))}
              </div>
            </div>

            <div className="profile-section" style={{ flex: 1 }}>
              <h3><Bot size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }}/> Evolution Log</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {learningProfile.recentLearnings.map((learning, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                    <Sparkles size={14} style={{ color: 'var(--accent-color)', flexShrink: 0, marginTop: '2px' }}/>
                    <span>{learning}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Feature Tabs Row */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '0' }}>
          {[
            { id: 'Smart Search', icon: Search },
            { id: 'Documents', icon: FileText },
            { id: 'AI Assistant', icon: Bot },
            { id: 'Knowledge Graph', icon: Share2 },
            { id: 'Analytics', icon: BarChart2 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-color)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--accent-color)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: activeTab === tab.id ? '600' : 'normal',
                transition: 'all 0.2s',
                marginBottom: '-1px',
              }}
            >
              <tab.icon size={16} />
              {tab.id}
            </button>
          ))}
        </div>


        {activeTab === 'Smart Search' && (
          <>
            {/* Search & Predictive Suggestions */}
            <div style={{ marginBottom: '16px' }}>
              <form onSubmit={handleSearch} className="search-container" style={{ marginBottom: '16px' }}>
                <Search size={20} className="search-icon" />
                <input 
                  type="text" 
                  className="search-input glass-panel"
                  placeholder="Search concepts, questions, or ideas (e.g. 'AI for cancer detection')..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isSearching}
                />
                <button type="submit" className="search-button" disabled={isSearching}>
                  {isSearching ? <RefreshCw size={20} className="pulse" /> : <ChevronRight size={20} />}
                </button>
              </form>

          {/* Suggestions & Filters Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {!searchIntent && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <Sparkles size={16} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Try these searches</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {["transformer attention mechanism", "reinforcement learning agents", "knowledge graph embedding", "RAG retrieval generation", "multimodal AI models"].map(topic => (
                    <button 
                      key={topic} 
                      onClick={() => handlePredictiveSearch(topic)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '999px',
                        padding: '6px 14px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filters Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
              <ListOrdered size={18} style={{ color: 'var(--text-secondary)' }} />
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {['All', 'paper', 'survey', 'blog', 'dataset', 'patent'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setMediaTypeFilter(f)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '999px',
                      border: `1px solid ${mediaTypeFilter === f ? 'transparent' : 'rgba(255, 255, 255, 0.08)'}`,
                      background: mediaTypeFilter === f ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: mediaTypeFilter === f ? '#a5b4fc' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: mediaTypeFilter === f ? '600' : 'normal',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {searchIntent && (
            <div className="predictive-suggestions" style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', marginTop: '16px' }}>
              <Brain size={16} style={{ color: '#34d399' }} />
              <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>Intent Detected:</span>
              <span style={{ fontSize: '0.85rem', color: '#e5e7eb' }}>{searchIntent}</span>
            </div>
          )}
        </div>

        <div className="results-container">
          {results.length === 0 && !isSearching && (
            <div className="empty-state">
              <Sparkles size={48} className="empty-icon" />
              <h2>Ready to explore</h2>
              <p>My responses are tailored to your past preferences. <br/>Search the web directly to begin.</p>
            </div>
          )}

          {results.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              <Filter size={16} /> 
              <span>Filtered out {filteredCount} low-relevance results. Displaying top meaningful content.</span>
            </div>
          )}

          {results.filter(r => mediaTypeFilter === 'All' || r.topic === mediaTypeFilter).map((result) => (
            <div key={result.id} className="result-card glass-panel">
              <div className="result-header">
                <h3 className="result-title">
                  <a href={result.link} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} onClick={() => trackClick(result.topic)}>
                    {result.title}
                  </a>
                </h3>
              </div>
              
              <div className="paper-meta">
                <span className="paper-tag">{result.topic}</span>
                <span><UserCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> {result.authors}</span>
                <span>•</span>
                <span>{result.published}</span>
                <span>•</span>
                <a 
                  href={result.link} 
                  target="_blank" 
                  rel="noreferrer" 
                  onClick={() => trackClick(result.topic)}
                  style={{ color: 'var(--accent-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
                >
                  <MousePointerClick size={14} /> Open {result.topic}
                </a>
              </div>
              
              <p className="result-content" style={{ fontSize: '0.95rem' }}>{result.content}</p>
              
              {/* Feature: Dynamic Ranking & Personalization */}
              <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', borderLeft: '3px solid var(--accent-color)' }}>
                <strong><Target size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/> Personalized Ranking:</strong> {result.insights}
              </div>

              {/* Agentic Interface: Allow users to ask for deeper insights */}
              <div className="ai-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button 
                  className="ai-btn" 
                  onClick={() => handleAIAction(result.id, 'summarize')}
                  disabled={isGenerating}
                >
                  {isGenerating && activeAction.id === result.id && activeAction.type === 'summarize' ? <RefreshCw size={14} className="pulse" /> : <ListOrdered size={14} />} 
                  Summarize
                </button>
                <button 
                  className="ai-btn" 
                  onClick={() => handleAIAction(result.id, 'explain')}
                  disabled={isGenerating}
                >
                  {isGenerating && activeAction.id === result.id && activeAction.type === 'explain' ? <RefreshCw size={14} className="pulse" /> : <Lightbulb size={14} />} 
                  Explain Simple
                </button>
                <button 
                  className="ai-btn btn-outline" 
                  onClick={() => handleAIAction(result.id, 'counter')}
                  disabled={isGenerating}
                >
                  {isGenerating && activeAction.id === result.id && activeAction.type === 'counter' ? <RefreshCw size={14} className="pulse" /> : <Bot size={14} />} 
                  Find Counter-Arguments
                </button>
                <button 
                  className="ai-btn btn-outline" 
                  onClick={() => handleAIAction(result.id, 'limitations')}
                  disabled={isGenerating}
                >
                  {isGenerating && activeAction.id === result.id && activeAction.type === 'limitations' ? <RefreshCw size={14} className="pulse" /> : <Target size={14} />} 
                  Identify Limitations
                </button>
              </div>

              {/* Display LLM Generated Output */}
              {(result.explanation || result.summary) && (
                <div className="ai-explanation">
                  {result.explanation || result.summary}
                </div>
              )}

              {/* Rule 7: Suggest What User Needs Next */}
              <div className="recommendations" style={{ marginTop: '20px' }}>
                <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>Suggested Next Steps:</strong>
                {result.recommendations.map((rec, i) => (
                  <div 
                    key={i} 
                    className="recommendation-item"
                    onClick={() => handleRecommendationClick(result, rec)}
                  >
                    <ChevronRight size={14} /> {rec}
                  </div>
                ))}
              </div>

              <div className="feedback-actions" style={{ marginTop: '24px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: 'auto' }}>
                  Rule 4: Was this ranking accurate? (Teaches the AI)
                </span>
                <button 
                  className={`btn btn-icon ${result.feedbackGiven === 'up' ? 'active' : ''}`}
                  onClick={() => handleFeedback(result.id, 'up')}
                >
                  <ThumbsUp size={16} />
                </button>
                <button 
                  className={`btn btn-icon ${result.feedbackGiven === 'down' ? 'active' : ''}`}
                  onClick={() => handleFeedback(result.id, 'down')}
                >
                  <ThumbsDown size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        </>
        )}

        {activeTab === 'Documents' && (
          <div style={{ display: 'flex', gap: '32px', height: '100%', alignItems: 'stretch' }}>
            {/* Left Column: Upload */}
            <div style={{ flex: '1.2', paddingTop: '12px' }}>
              <h2 style={{ marginBottom: '8px', color: '#818cf8', fontSize: '1.8rem' }}>Documents</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>0 papers in your knowledge base</p>
              
              <div style={{
                border: '1px dashed rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '48px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                marginBottom: '32px',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                e.currentTarget.style.borderColor = 'var(--accent-color)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}>
                <UploadCloud size={32} style={{ color: 'var(--accent-color)', marginBottom: '16px', margin: '0 auto' }} />
                <h4 style={{ color: '#fff', marginBottom: '8px', fontSize: '1.1rem' }}>Drop or click to upload</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>PDF, DOCX, TXT supported</p>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '6px 16px', borderRadius: '999px', border: '1px solid transparent', fontSize: '0.85rem' }}>All</button>
              </div>
              
              <div className="search-container" style={{ background: 'rgba(255,255,255,0.03)', border: 'none', marginBottom: '0' }}>
                 <Search size={16} className="search-icon" style={{ left: '16px' }} />
                 <input type="text" className="search-input" placeholder="Filter by title or author..." style={{ background: 'transparent', paddingLeft: '48px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
              </div>
            </div>
            
            {/* Right Column: Empty State */}
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingLeft: '32px' }}>
              <div style={{ opacity: 0.4, textAlign: 'center' }}>
                <FileText size={64} style={{ color: 'var(--text-secondary)', marginBottom: '24px', margin: '0 auto' }} />
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1.2rem', fontWeight: '500' }}>Select a document to analyze</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>AI-powered summaries, citations, entities & insights</p>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'Smart Search' && activeTab !== 'Documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            <Sparkles size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h2>{activeTab}</h2>
            <p>This module is currently being calibrated.</p>
          </div>
        )}

      </main>
    </div>
  );
}

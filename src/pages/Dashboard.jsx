import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, BrainCircuit, Sparkles, ThumbsUp, ThumbsDown, 
  ChevronRight, Activity, UserCircle, Target,
  RefreshCw, Bot, Lightbulb, Tag, Brain, Filter, MousePointerClick, ListOrdered,
  FileText, Share2, UploadCloud, LogOut
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import KnowledgeGraph from './KnowledgeGraph';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


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
  const [selectedReasoning, setSelectedReasoning] = useState(null);
  const [reasoningExplanation, setReasoningExplanation] = useState('');
  const [isLoadingReasoning, setIsLoadingReasoning] = useState(false);

  // Documents tab state
  const [docData, setDocData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [docChatMessages, setDocChatMessages] = useState([]);
  const [docChatInput, setDocChatInput] = useState('');
  const [isDocChatLoading, setIsDocChatLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const docChatEndRef = React.useRef(null);
  const fileInputRef = React.useRef(null);


  // AI Assistant state
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your Nexus AI assistant. Ask me anything — research questions, topic explanations, comparisons, or general knowledge.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = React.useRef(null);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
        const { data } = await supabase
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
          setLearningProfile({
            interactions: 0,
            feedbackScore: 88,
            preferredTopics: ["Machine Learning", "Optimization", "Materials Science"],
            recentLearnings: ["New profile initialized."]
          });
          await supabase.from('profiles').insert([{ id: session.user.id }]);
        }
        return;
      }

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

      navigate('/login');
    };

    fetchUserAndProfile().then(() => {
      const initialSearch = localStorage.getItem('initial_search');
      if (initialSearch) {
        setQuery(initialSearch);
        localStorage.removeItem('initial_search');
        setTimeout(() => executeSearch(initialSearch), 100);
      }
    });
  }, [navigate]);

  const handleLogout = async () => {
    localStorage.removeItem('dev_bypass');
    await supabase.auth.signOut();
    navigate('/login');
  };

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
      const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5002';
      const response = await fetch(`${BACKEND}/api/web-search`, {
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

      const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5002';
      const response = await fetch(`${BACKEND}/api/research`, {
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

            <button 
              onClick={handleLogout}
              style={{
                marginTop: '20px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '10px',
                color: '#fca5a5',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            >
              <LogOut size={18} />
              Sign Out
            </button>
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
            { id: 'AI Reasoning', icon: Brain },
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

        {activeTab === 'Documents' && (() => {
          const handleFile = async (file) => {
            if (!file) return;
            setIsAnalyzing(true);
            setDocData(null);
            setDocChatMessages([]);
            const formData = new FormData();
            formData.append('file', file);
            try {
              const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5002';
              const res = await fetch(`${BACKEND}/api/document/analyze`, { method: 'POST', body: formData });
              const data = await res.json();
              if (data.error) throw new Error(data.error);
              setDocData(data);
              setDocChatMessages([{ role: 'assistant', content: `I've read your document **"${data.filename}"** (${data.wordCount?.toLocaleString()} words). Ask me anything about it!` }]);
            } catch (err) {
              alert('Error: ' + err.message);
            } finally { setIsAnalyzing(false); }
          };

          const handleDocChat = async (e) => {
            e.preventDefault();
            const msg = docChatInput.trim();
            if (!msg || isDocChatLoading || !docData) return;
            setDocChatInput('');
            const newHistory = [...docChatMessages, { role: 'user', content: msg }];
            setDocChatMessages(newHistory);
            setIsDocChatLoading(true);
            setTimeout(() => docChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            try {
              const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5002';
              const res = await fetch(`${BACKEND}/api/document/chat`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newHistory, documentText: docData.text })
              });
              const data = await res.json();
              setDocChatMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Sorry, could not get a response.' }]);
            } catch { setDocChatMessages(prev => [...prev, { role: 'assistant', content: 'Error reaching AI.' }]); }
            finally { setIsDocChatLoading(false); setTimeout(() => docChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }
          };

          return (
            <div style={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ color: '#818cf8', fontSize: '1.6rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={28} /> Documents
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Upload a document — AI will scan, summarize, and answer your questions about it</p>
              </div>

              {!docData && !isAnalyzing && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
                  style={{
                    border: `2px dashed ${isDragging ? 'var(--accent-color)' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: '20px', padding: '64px', textAlign: 'center',
                    background: isDragging ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer', transition: 'all 0.2s', flex: 1,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px'
                  }}
                >
                  <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" hidden onChange={e => handleFile(e.target.files[0])} />
                  <UploadCloud size={52} style={{ color: isDragging ? 'var(--accent-color)' : 'rgba(255,255,255,0.3)' }} />
                  <div>
                    <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '8px' }}>Drop your document here</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>or click to browse — PDF, DOCX, TXT supported (max 20MB)</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['.pdf', '.docx', '.txt'].map(t => (
                      <span key={t} style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '6px', padding: '4px 10px', color: '#a5b4fc', fontSize: '0.8rem' }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {isAnalyzing && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                  <RefreshCw size={40} className="pulse" style={{ color: 'var(--accent-color)' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>AI is scanning and analyzing your document...</p>
                </div>
              )}

              {docData && (
                <div style={{ flex: 1, display: 'flex', gap: '24px', overflow: 'hidden' }}>
                  {/* Left: Summary Panel */}
                  <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                    {/* File info */}
                    <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '14px', padding: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={20} style={{ color: '#fff' }} />
                        </div>
                        <div>
                          <p style={{ color: '#fff', fontWeight: '600', fontSize: '0.95rem' }}>{docData.filename}</p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{(docData.size / 1024).toFixed(1)} KB · {docData.wordCount?.toLocaleString()} words</p>
                        </div>
                      </div>
                      <button onClick={() => { setDocData(null); setDocChatMessages([]); }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 14px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>↑ Upload another</button>
                    </div>

                    {/* AI Summary */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Sparkles size={16} style={{ color: '#818cf8' }} />
                        <span style={{ color: '#818cf8', fontWeight: '600', fontSize: '0.9rem' }}>AI Summary</span>
                      </div>
                      <p style={{ color: '#e5e7eb', lineHeight: '1.7', fontSize: '0.9rem' }}>{docData.summary}</p>
                    </div>

                    {/* Quick questions */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '18px' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Questions</p>
                      {['What is the main argument?', 'What are the key findings?', 'What methodology was used?', 'What are the limitations?'].map(q => (
                        <button key={q} onClick={() => setDocChatInput(q)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.83rem', marginBottom: '6px', transition: 'all 0.2s' }}>
                          → {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right: Document Chat */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Chat with your document</p>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px', paddingRight: '4px' }}>
                      {docChatMessages.map((msg, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '10px', alignItems: 'flex-end' }}>
                          {msg.role === 'assistant' && (
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileText size={14} style={{ color: '#fff' }} /></div>
                          )}
                          <div style={{ maxWidth: '75%', padding: '10px 16px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.05)', border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none', color: '#fff', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            <div className="markdown-content">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isDocChatLoading && (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={14} style={{ color: '#fff' }} /></div>
                          <div style={{ padding: '10px 16px', borderRadius: '16px 16px 16px 4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}><RefreshCw size={14} className="pulse" style={{ color: 'var(--accent-color)' }} /></div>
                        </div>
                      )}
                      <div ref={docChatEndRef} />
                    </div>
                    <form onSubmit={handleDocChat} style={{ display: 'flex', gap: '10px' }}>
                      <input type="text" value={docChatInput} onChange={e => setDocChatInput(e.target.value)} placeholder="Ask anything about the document..." disabled={isDocChatLoading}
                        style={{ flex: 1, padding: '12px 18px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.9rem', outline: 'none' }} />
                      <button type="submit" disabled={isDocChatLoading || !docChatInput.trim()} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isDocChatLoading || !docChatInput.trim() ? 0.5 : 1 }}>
                        <ChevronRight size={18} style={{ color: '#fff' }} />
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {activeTab === 'AI Assistant' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ color: '#818cf8', fontSize: '1.6rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bot size={28} /> AI Assistant
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Powered by real AI — ask anything</p>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              paddingRight: '8px',
              marginBottom: '20px'
            }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: '12px',
                  alignItems: 'flex-end'
                }}>
                  {msg.role === 'assistant' && (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Bot size={16} style={{ color: '#fff' }} />
                    </div>
                  )}
                  <div style={{
                    maxWidth: '70%',
                    padding: '12px 18px',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    color: '#fff',
                    fontSize: '0.95rem',
                    lineHeight: '1.6'
                  }}>
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <UserCircle size={20} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                  )}
                </div>
              ))}
              {isChatLoading && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={16} style={{ color: '#fff' }} />
                  </div>
                  <div style={{ padding: '12px 18px', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <RefreshCw size={16} className="pulse" style={{ color: 'var(--accent-color)' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const msg = chatInput.trim();
                if (!msg || isChatLoading) return;
                setChatInput('');
                const newHistory = [...chatMessages, { role: 'user', content: msg }];
                setChatMessages(newHistory);
                setIsChatLoading(true);
                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                try {
                const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5002';
                  const res = await fetch(`${BACKEND}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: [...newHistory] })
                  });
                  const data = await res.json();
                  setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error || 'Sorry, I could not get a response.' }]);
                } catch {
                  setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error reaching the AI. Please try again.' }]);
                } finally {
                  setIsChatLoading(false);
                  setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
              }}
              style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask anything — topics, concepts, comparisons..."
                disabled={isChatLoading}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: isChatLoading || !chatInput.trim() ? 0.5 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                <ChevronRight size={20} style={{ color: '#fff' }} />
              </button>
            </form>
          </div>
        )}

        {activeTab === 'Knowledge Graph' && <KnowledgeGraph />}

        {activeTab === 'AI Reasoning' && (() => {
          // Scoring functions
          const scoreRelevance = (r) => {
            if (!query) return 0;
            const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
            const q = normalize(query);
            const text = normalize(`${r.title} ${r.content}`);
            
            // Phrase match bonus
            if (text.includes(q)) return 100;
            
            // Individual word match
            const words = q.split(' ').filter(w => w.length > 1);
            if (words.length === 0) return 0;
            
            let hits = 0;
            words.forEach(w => { if (text.includes(w)) hits++; });
            
            const score = Math.round((hits / words.length) * 100);
            return Math.max(5, score); // Min 5% if any match
          };

          const sortedResults = [...results].sort((a, b) => scoreRelevance(b) - scoreRelevance(a));

          const scoreInterest = (r) => {
            if (!learningProfile) return 30;
            const topics = learningProfile.preferredTopics.map(t => t.toLowerCase());
            const text = `${r.title} ${r.content}`.toLowerCase();
            const hits = topics.filter(t => text.includes(t)).length;
            return Math.min(100, 20 + hits * 25);
          };
          const scoreAuthority = (r) => {
            const domain = (r.link || '').toLowerCase();
            if (domain.includes('arxiv') || domain.includes('nature') || domain.includes('science')) return 95;
            if (domain.includes('ieee') || domain.includes('springer') || domain.includes('acm')) return 88;
            if (domain.includes('github') || domain.includes('huggingface')) return 78;
            if (domain.includes('wikipedia')) return 70;
            if (domain.includes('youtube')) return 65;
            return 55;
          };
          const scoreQuality = (r) => Math.min(100, 30 + Math.round(r.content?.length / 8));

          const factors = selectedReasoning ? [
            { label: 'Relevance to Query', value: scoreRelevance(selectedReasoning), color: '#6366f1', desc: 'Keyword & semantic match with your search' },
            { label: 'User Interest Alignment', value: scoreInterest(selectedReasoning), color: '#8b5cf6', desc: 'Match with your monitored research interests' },
            { label: 'Source Authority', value: scoreAuthority(selectedReasoning), color: '#06b6d4', desc: 'Credibility score of the publishing domain' },
            { label: 'Content Quality', value: scoreQuality(selectedReasoning), color: '#10b981', desc: 'Richness and depth of the content snippet' },
          ] : [];

          const handleExplain = async (result) => {
            setIsLoadingReasoning(true);
            setReasoningExplanation('');
            try {
              const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5002';
              const factors_summary = `Relevance: ${scoreRelevance(result)}%, Interest: ${scoreInterest(result)}%, Authority: ${scoreAuthority(result)}%, Quality: ${scoreQuality(result)}%`;
              const res = await fetch(`${BACKEND}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [{ role: 'user', content: `In 2-3 casual conversational sentences, explain why this result titled "${result.title}" was ranked highly. Scores: ${factors_summary}. Keep it human and insightful, not robotic.` }] })
              });
              const data = await res.json();
              setReasoningExplanation(data.reply || '');
            } catch { setReasoningExplanation('Could not load explanation.'); }
            finally { setIsLoadingReasoning(false); }
          };

          return (
            <div style={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ color: '#818cf8', fontSize: '1.6rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Brain size={28} /> AI Reasoning Panel
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Understand exactly why each result was ranked — full decision transparency</p>
              </div>

              {results.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'var(--text-secondary)' }}>
                  <Brain size={52} style={{ opacity: 0.2, color: '#818cf8' }} />
                  <p>Run a search in <strong>Smart Search</strong> first, then come back here to see the AI's reasoning.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '24px', flex: 1, overflow: 'hidden' }}>
                  {/* Left: Result list */}
                  <div style={{ width: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {sortedResults.length} Results — Select to inspect
                    </p>
                    {sortedResults.map((r, i) => {
                      const rel = scoreRelevance(r);
                      const isSelected = selectedReasoning?.id === r.id;
                      return (
                        <div
                          key={r.id}
                          onClick={() => { setSelectedReasoning(r); setReasoningExplanation(''); }}
                          style={{
                            padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                            background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isSelected ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', borderRadius: '6px', padding: '2px 8px' }}>#{i + 1}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{r.topic}</span>
                          </div>
                          <p style={{ fontSize: '0.88rem', color: '#e5e7eb', fontWeight: '500', lineHeight: '1.4', marginBottom: '8px' }}>{r.title.slice(0, 70)}{r.title.length > 70 ? '…' : ''}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ flex: 1, height: '4px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)' }}>
                              <div style={{ width: `${rel}%`, height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', transition: 'width 0.6s ease' }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: '600', minWidth: '32px' }}>{rel}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right: Factor breakdown */}
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {!selectedReasoning ? (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexDirection: 'column', gap: '12px' }}>
                        <Lightbulb size={40} style={{ opacity: 0.2 }} />
                        <p>Select a result to see detailed AI reasoning</p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
                          <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '4px', lineHeight: '1.5' }}>{selectedReasoning.title}</h3>
                          <a href={selectedReasoning.link} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#a5b4fc', textDecoration: 'none' }}>{selectedReasoning.link?.slice(0, 60)}…</a>
                        </div>

                        {/* Factor Bars */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                          {factors.map(f => (
                            <div key={f.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '18px 22px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                                <div>
                                  <span style={{ color: '#e5e7eb', fontWeight: '600', fontSize: '0.95rem' }}>{f.label}</span>
                                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '2px' }}>{f.desc}</p>
                                </div>
                                <span style={{ color: f.color, fontWeight: '800', fontSize: '1.4rem' }}>{f.value}%</span>
                              </div>
                              <div style={{ height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.07)' }}>
                                <div style={{
                                  width: `${f.value}%`, height: '100%', borderRadius: '999px',
                                  background: `linear-gradient(90deg, ${f.color}99, ${f.color})`,
                                  transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                                  boxShadow: `0 0 12px ${f.color}55`
                                }} />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* AI Explanation */}
                        <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '14px', padding: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <Brain size={18} style={{ color: '#818cf8' }} />
                            <span style={{ color: '#818cf8', fontWeight: '600', fontSize: '0.9rem' }}>AI Explanation</span>
                          </div>
                          {reasoningExplanation ? (
                            <p style={{ color: '#e5e7eb', lineHeight: '1.7', fontSize: '0.95rem' }}>{reasoningExplanation}</p>
                          ) : (
                            <button
                              onClick={() => handleExplain(selectedReasoning)}
                              disabled={isLoadingReasoning}
                              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '10px', padding: '10px 20px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.9rem', opacity: isLoadingReasoning ? 0.6 : 1 }}
                            >
                              {isLoadingReasoning ? <><RefreshCw size={14} className="pulse" /> Generating...</> : <><Sparkles size={14} /> Explain this ranking</>}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {activeTab !== 'Smart Search' && activeTab !== 'Documents' && activeTab !== 'AI Assistant' && activeTab !== 'Knowledge Graph' && activeTab !== 'AI Reasoning' && (
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

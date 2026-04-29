import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BrainCircuit, Sparkles, ArrowRight, Zap, Target, Shield, CheckCircle2, MessageSquare, 
  Layers, LineChart, Search, Book, Brain, Lightbulb, RefreshCw, BarChart, ListOrdered, Compass, Tag
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="nav-logo">
          <BrainCircuit className="text-gradient" size={32} />
          <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Nexus AI</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn btn-outline" onClick={() => navigate('/login')}>Login</button>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Get Started</button>
        </div>
      </nav>

      <main className="landing-main">
        {/* Hero Section */}
        <section className="hero-section" style={{ minHeight: '80vh', justifyContent: 'center', paddingTop: '80px', paddingBottom: '80px' }}>
          <div className="badge-pill">
            <Sparkles size={14} className="text-gradient" />
            <span>Introducing the ultimate research companion</span>
          </div>
          
          <h1 className="hero-title">
            Research that <span className="text-gradient">Adapts</span> to You.
          </h1>
          
          <p className="hero-subtitle">
            Nexus AI is the first intelligent assistant that actually learns how you think. It continuously refines its insights, bypasses introductory fluff, and personalizes recommendations to match your exact expertise level over time.
          </p>

          <div className="hero-cta" style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const q = e.target.elements.q.value;
                if (q) {
                  localStorage.setItem('initial_search', q);
                  localStorage.setItem('dev_bypass', 'true'); // Auto bypass login for seamless demo
                  navigate('/dashboard');
                }
              }}
              style={{ position: 'relative', display: 'flex', width: '100%' }}
            >
              <input 
                name="q"
                type="text" 
                placeholder="Ask any research question (e.g. 'Latest AI models')..." 
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(10, 10, 15, 0.8)',
                  color: 'white',
                  fontSize: '1.1rem',
                  paddingRight: '160px'
                }}
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ 
                  position: 'absolute', 
                  right: '6px', 
                  top: '6px', 
                  bottom: '6px', 
                  borderRadius: '999px',
                  padding: '0 24px'
                }}
              >
                Search <ArrowRight size={18} style={{ marginLeft: '8px' }}/>
              </button>
            </form>
          </div>
        </section>

        {/* What Our Agent Will Do (Capabilities) */}
        <section style={{ padding: '80px 24px', width: '100%', maxWidth: '1200px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>What our agent will do for you</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
              Unlike a standard chatbot, Nexus deploys autonomous agents to handle the heavy lifting of academic and technical research.
            </p>
          </div>
          
          <div className="capabilities-grid">
            <div className="capability-card">
              <div className="capability-icon-wrapper">
                <Layers size={24} />
              </div>
              <h3 className="capability-title">Automated Literature Reviews</h3>
              <p className="capability-desc">
                Feed Nexus a topic, and it will autonomously read, analyze, and synthesize dozens of academic papers into a single, comprehensive literature review document, highlighting key consensus and ongoing debates.
              </p>
            </div>
            
            <div className="capability-card">
              <div className="capability-icon-wrapper">
                <Target size={24} />
              </div>
              <h3 className="capability-title">Contradiction Analysis</h3>
              <p className="capability-desc">
                The Analyst agent specifically hunts for conflicting data across your sources. It cross-references claims from different studies and automatically flags methodological differences or opposing conclusions.
              </p>
            </div>
            
            <div className="capability-card">
              <div className="capability-icon-wrapper">
                <LineChart size={24} />
              </div>
              <h3 className="capability-title">Adaptive Code Generation</h3>
              <p className="capability-desc">
                When researching computer science or physics, Nexus doesn't just give you math. It translates complex equations and architectures from research papers directly into optimized, ready-to-run Python or C++ code.
              </p>
            </div>
          </div>
        </section>

        {/* Advanced Features Bento Grid */}
        <section className="features-section" style={{ padding: '80px 24px', width: '100%', maxWidth: '1200px' }}>
          <div className="bento-grid">
            
            {/* Multi-Agent Research Pipeline */}
            <div className="bento-card glass-panel" style={{ gridColumn: '1 / -1' }}>
              <span className="bento-label"><BrainCircuit size={16} /> Feature</span>
              <h3 className="bento-title">Multi-agent research pipeline</h3>
              <p className="bento-desc" style={{ maxWidth: '800px' }}>
                Five specialized agents work in parallel: Planner decomposes your query, Retriever searches across vectors, graphs, and live web, Analyst identifies contradictions, Synthesis generates structured responses, and Critic ensures quality — automatically re-running if faithfulness drops below 75%.
              </p>
              <div className="bento-visual">
                <div className="agent-badges">
                  <span className="agent-badge">Planning ✓</span>
                  <span className="agent-badge">Retrieving ✓</span>
                  <span className="agent-badge">Synthesising ✓</span>
                </div>
                <p style={{ fontFamily: 'monospace', color: '#e5e7eb', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                  **FlashAttention-2** achieves exact attention computation in O(n) memory by restructuring SRAM utilization — enabling 100K+ token context win<span style={{ animation: 'pulse 1s infinite' }}>█</span>
                </p>
              </div>
            </div>

            {/* Living Knowledge Graph */}
            <div className="bento-card glass-panel">
              <span className="bento-label"><Target size={16} /> Feature</span>
              <h3 className="bento-title">Living knowledge graph</h3>
              <p className="bento-desc">
                Every entity, topic, and relationship you explore becomes a node in your personal knowledge graph. Navigate your research universe visually — explore connections, insights, and adjacent topics you haven't discovered yet.
              </p>
              <div className="bento-visual">
                <div className="kg-tags">
                  <span className="kg-tag">Transformers</span>
                  <span className="kg-tag">RLHF</span>
                  <span className="kg-tag">Alignment</span>
                  <span className="kg-tag">Diffusion</span>
                  <span className="kg-tag">Quantum</span>
                  <span className="kg-tag">AlphaFold</span>
                  <span className="kg-tag">Scaling Laws</span>
                </div>
              </div>
            </div>

            {/* The Evolver - Adaptive Intelligence */}
            <div className="bento-card glass-panel">
              <span className="bento-label"><Zap size={16} /> Feature</span>
              <h3 className="bento-title">The Evolver — adaptive intelligence</h3>
              <p className="bento-desc">
                Nexus learns from every thumbs up, thumbs down, scroll depth, and follow-up query. It adjusts retrieval weights across vector search, knowledge graph, and live web in real time.
              </p>
              <div className="bento-visual">
                <div className="evolver-bar">
                  <div className="evolver-bar-header">
                    <span>Vector Search</span>
                    <span>62%</span>
                  </div>
                  <div className="evolver-track">
                    <div className="evolver-fill" style={{ width: '62%', background: '#6366f1' }}></div>
                  </div>
                </div>
                <div className="evolver-bar">
                  <div className="evolver-bar-header">
                    <span>Knowledge Graph</span>
                    <span>28%</span>
                  </div>
                  <div className="evolver-track">
                    <div className="evolver-fill" style={{ width: '28%', background: '#10b981' }}></div>
                  </div>
                </div>
                <div className="evolver-bar">
                  <div className="evolver-bar-header">
                    <span>Live Web</span>
                    <span>10%</span>
                  </div>
                  <div className="evolver-track">
                    <div className="evolver-fill" style={{ width: '10%', background: '#f59e0b' }}></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* How It Works */}
        <section className="how-it-works" style={{ padding: '80px 24px', width: '100%', maxWidth: '1200px', marginTop: '40px' }}>
          <div className="how-it-works-container glass-panel" style={{ padding: '60px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>How It Works</h2>
              <p style={{ color: 'var(--text-secondary)' }}>A seamless flow from curiosity to expertise.</p>
            </div>
            
            <div className="steps-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginTop: '20px' }}>
              <div className="step-item" style={{ textAlign: 'center' }}>
                <div className="step-number glass-panel" style={{ width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 auto 20px', background: 'var(--accent-glow)', color: 'var(--accent-color)' }}>1</div>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Query & Explore</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Ask your initial research question. Nexus retrieves high-level foundational knowledge just like a standard tool.</p>
              </div>
              <div className="step-item" style={{ textAlign: 'center' }}>
                <div className="step-number glass-panel" style={{ width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 auto 20px', background: 'var(--accent-glow)', color: 'var(--accent-color)' }}>2</div>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Provide Feedback</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>React to the insights. Tell the AI if it was too simple, too complex, or exactly what you needed using one-click feedback.</p>
              </div>
              <div className="step-item" style={{ textAlign: 'center' }}>
                <div className="step-number glass-panel" style={{ width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 auto 20px', background: 'var(--accent-glow)', color: 'var(--accent-color)' }}>3</div>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Evolve & Deepen</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>On subsequent searches, Nexus bypasses the basics. It drops you directly into deep mathematical proofs, code, or advanced theory.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="testimonials" style={{ padding: '100px 24px', width: '100%', maxWidth: '1200px' }}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '60px' }}>What Researchers Say</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            <div className="testimonial-card glass-panel" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', gap: '2px', color: '#fbbf24', marginBottom: '16px' }}>★★★★★</div>
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '24px', lineHeight: 1.6 }}>"I was tired of reading the same 'Intro to Machine Learning' paragraphs on every search. Nexus AI noticed I was an expert after two queries and started showing me O(N log N) architecture optimizations immediately."</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}></div>
                <div>
                  <h4 style={{ fontSize: '1rem', margin: 0 }}>Dr. Sarah Jenkins</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Lead ML Engineer</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card glass-panel" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', gap: '2px', color: '#fbbf24', marginBottom: '16px' }}>★★★★★</div>
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '24px', lineHeight: 1.6 }}>"The Learning Profile feature is incredible. It tracks exactly what topics I'm engaging with and pre-filters noise before I even ask. It saves me about 15 hours of literature review a week."</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)' }}></div>
                <div>
                  <h4 style={{ fontSize: '1rem', margin: 0 }}>Marcus Chen</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Quantum Physics PhD</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bottom-cta glass-panel" style={{ width: '100%', maxWidth: '1000px', padding: '60px', textAlign: 'center', marginBottom: '80px', background: 'var(--accent-glow)', border: '1px solid var(--accent-color)' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Ready to upgrade your research?</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
            Join thousands of academics, engineers, and scientists who have stopped searching and started learning.
          </p>
          <button className="btn btn-primary btn-large" onClick={() => navigate('/login')} style={{ fontSize: '1.2rem', padding: '16px 40px' }}>
            Create Your Free Account
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer" style={{ borderTop: '1px solid var(--panel-border)', padding: '60px 48px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px', backgroundColor: 'rgba(5, 5, 8, 0.9)' }}>
        <div className="footer-brand" style={{ maxWidth: '300px' }}>
          <div className="nav-logo" style={{ marginBottom: '16px' }}>
            <BrainCircuit className="text-gradient" size={28} />
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Nexus AI</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Building the next generation of adaptive artificial intelligence for researchers, scientists, and deep-thinkers globally.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          <div className="footer-links">
            <h4 style={{ marginBottom: '16px', fontSize: '1rem' }}>Product</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Features</a></li>
              <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Pricing</a></li>
              <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Case Studies</a></li>
              <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Reviews</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4 style={{ marginBottom: '16px', fontSize: '1rem' }}>Company</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>About Us</a></li>
              <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Careers</a></li>
              <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Blog</a></li>
              <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Contact</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4 style={{ marginBottom: '16px', fontSize: '1rem' }}>Legal</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Privacy Policy</a></li>
              <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Terms of Service</a></li>
              <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Security</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

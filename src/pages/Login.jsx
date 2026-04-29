import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Lock, Mail, ArrowRight, Loader } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const navigate = useNavigate();
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (isLoginView) {
        // Log in existing user
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        // Sign up new user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // Supabase might require email confirmation, but for now we navigate
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Supabase error:", error);
      setErrorMsg(error.message || "Failed to authenticate.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthProvider = async (provider) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error(`${provider} auth error:`, error);
      setErrorMsg(error.message || `Failed to sign in with ${provider}.`);
      setIsLoading(false);
    }
  };

  return (
    <div className="login-split">
      {/* Left Side: Hero / Brand */}
      <div className="login-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BrainCircuit size={32} className="text-gradient" />
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Nexus AI</span>
        </div>
        
        <div style={{ marginTop: 'auto', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 700, color: '#fff', marginBottom: '16px', lineHeight: 1.1 }}>
            Accelerate your<br/>research pipeline.
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255, 255, 255, 0.7)', maxWidth: '400px' }}>
            Join thousands of academics and engineers who have stopped searching and started learning with adaptive AI.
          </p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="login-form-side">
        <div className="login-card">
          <div className="login-header">
            <h2>{isLoginView ? 'Welcome back' : 'Create an account'}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              {isLoginView ? 'Enter your credentials to access your profile.' : 'Initialize your personalized neural profile.'}
            </p>
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '8px', color: '#fca5a5', fontSize: '0.9rem', marginBottom: '24px' }}>
              {errorMsg}
            </div>
          )}

          <div className="social-logins">
            <button className="social-login-btn" onClick={() => handleOAuthProvider('github')} disabled={isLoading}>
              <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub" style={{ width: '18px', height: '18px', filter: 'invert(1)' }} />
              Continue with GitHub
            </button>
            <button className="social-login-btn" onClick={() => handleOAuthProvider('google')} disabled={isLoading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="divider">or continue with email</div>

          <form className="login-form" onSubmit={handleAuth}>
            <div className="input-group">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                placeholder="Academic or Work Email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            
            <div className="input-group">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                placeholder="Encryption Key (Password)" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px', padding: '14px' }} disabled={isLoading}>
              {isLoading ? <Loader className="spin" size={18} /> : (isLoginView ? 'Authenticate' : 'Create Profile')} 
              {!isLoading && <ArrowRight size={18} />}
            </button>

            <button 
              type="button" 
              onClick={() => {
                localStorage.setItem('dev_bypass', 'true');
                navigate('/dashboard');
              }}
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                color: '#fff', 
                borderRadius: '8px', 
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              Dev Mode: Bypass Login
            </button>
          </form>

          <div className="login-footer">
            <p>
              {isLoginView ? "Don't have a profile yet? " : "Already have an account? "}
              <a href="#" onClick={(e) => {
                e.preventDefault();
                setIsLoginView(!isLoginView);
                setErrorMsg('');
              }}>
                {isLoginView ? "Sign up" : "Log in"}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

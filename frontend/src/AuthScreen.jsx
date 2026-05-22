import React, { useState } from 'react';
import { Mail, Lock, UserPlus, LogIn, AlertTriangle, Check, User } from 'lucide-react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';

function AuthScreen({ setIsRegistering }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please enter both email and password.");
      return;
    }
    if (!isLogin && !name.trim()) {
      showToast("Please enter your name.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        // App.jsx will automatically detect the auth state change and hide this screen.
      } else {
        if (setIsRegistering) setIsRegistering(true);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Set the display name on the newly created user profile
        await updateProfile(userCredential.user, { displayName: name.trim() });
        // Sign out to force the user to log in manually
        await auth.signOut();
        showToast("Account created successfully! Please log in.", "success");
        setIsLogin(true);
        return; // Prevent further execution that might clear loading too early if we wanted to
      }
    } catch (error) {
      console.error("Auth Error:", error);
      // Clean up Firebase error messages
      const errorMessages = {
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Check your connection.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/operation-not-allowed': 'Email/password sign-in is not enabled. Please enable it in Firebase Console.',
      };
      const message = errorMessages[error.code] || error.message || "Authentication failed.";
      showToast(message);
    } finally {
      setLoading(false);
      if (setIsRegistering) setIsRegistering(false);
    }
  };

  return (
    <div className={`app-wrapper welcome-screen ${localStorage.getItem('zenjob_theme') === 'light' ? 'light-theme' : ''}`} style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: 'var(--body-bg)' }}>

      <div className="toast-stack" style={{ top: '24px', right: '24px', bottom: 'auto' }}>
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'error' ? <AlertTriangle size={20} /> : <Check size={20} />}
            </div>
            <div className="toast-content">
              <div className="toast-message">{toast.message}</div>
            </div>
            <div className="toast-progress-container">
              <div
                className="toast-progress-bar"
                style={{ animation: 'progress-drain 4s linear forwards' }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel fade-in" style={{ maxWidth: '450px', width: '100%', textAlign: 'center', padding: '3rem 2rem', position: 'relative', overflow: 'hidden' }}>
        <div className="glow-effect" style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            {isLogin ? 'Welcome Back' : 'Initialize Account'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '2rem', lineHeight: '1.6' }}>
            {isLogin ? 'Authenticate to access your ZenJob portal.' : 'Create a secure Firebase instance for your data.'}
          </p>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left', marginBottom: '2rem' }}>
            {/* Name field - only shown on Register */}
            {!isLogin && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Full Name</label>
                <div className="input-group">
                  <div className="input-icon"><User size={18} /></div>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Email Access</label>
              <div className="input-group">
                <div className="input-icon"><Mail size={18} /></div>
                <input
                  type="email"
                  placeholder="commander@protocol.net"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Secure Passphrase</label>
              <div className="input-group">
                <div className="input-icon"><Lock size={18} /></div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength="6"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1.05rem', justifyContent: 'center', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? (
                <span className="spin" style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}></span>
              ) : isLogin ? (
                <><LogIn size={20} /> Establish Uplink</>
              ) : (
                <><UserPlus size={20} /> Create Instance</>
              )}
            </button>
          </form>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
            {isLogin ? "Don't have an instance yet?" : "Already have an uplink?"}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'none', border: 'none', color: '#818cf8', fontWeight: '600', cursor: 'pointer', marginLeft: '0.5rem' }}
            >
              {isLogin ? 'Register Here' : 'Login Here'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;


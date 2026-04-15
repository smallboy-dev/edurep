import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MonitorPlay, Users, ArrowRight, Play } from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { motion } from 'framer-motion';

export default function Landing() {
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [joinError, setJoinError] = useState('');
  const navigate = useNavigate();
  const { createSession } = useSession();

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const { id, adminKey } = await createSession({
        title: "New Presentation Session",
        currentUrl: "https://jephthahfestus.com.ng",
        isLocked: false,
        forceFullscreen: true,
      });
      
      // Store host credentials
      const adminSessions = JSON.parse(localStorage.getItem('livelock_admin_sessions') || '{}');
      adminSessions[id] = adminKey;
      localStorage.setItem('livelock_admin_sessions', JSON.stringify(adminSessions));

      navigate(`/admin/${id}`);
    } catch (err) {
      console.error("Session creation failed:", err);
      alert("CRITICAL ERROR: Failed to communicate with Firebase.\n\nError: " + err.message + "\n\nPlease check your network connection or Firebase Project settings.");
      setIsCreating(false);
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    setJoinError('');
    
    const code = joinCode.trim().toUpperCase();
    
    // Validate session code format
    if (!code) {
      setJoinError('Please enter a session code');
      return;
    }
    
    if (code.length !== 6) {
      setJoinError('Session code must be exactly 6 characters');
      return;
    }
    
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setJoinError('Session code must contain only letters and numbers');
      return;
    }
    
    console.log("Attempting to join session with code:", code);
    navigate(`/viewer/${code}`);
  };

  return (
    <div className="main-container">
      {/* Background Decor */}
      <div className="bg-decor decor-1"></div>
      <div className="bg-decor decor-2"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="content-wrapper text-center"
      >
        <div className="relative z-10">
          <div className="badge">
            <MonitorPlay size={18} />
            LiveLock Presentation System
          </div>
          <h1 className="hero-title">
            Sync your slides, <span className="highlight">control the room.</span>
          </h1>
          <p className="hero-subtitle">
            Broadcasting live content to your audience with enforced focus and real-time synchronization.
          </p>
        </div>

        <div className="card-grid">

          {/* Host Session Card */}
          <div className="card card-light">
            <div className="icon-box icon-box-primary">
              <Play size={32} />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold">Host a Session</h2>
              <p className="text-muted">Start a new broadcast. Control navigation and enforce focus across all devices.</p>
            </div>
            <button 
              onClick={handleCreate}
              disabled={isCreating}
              className="btn btn-primary"
            >
              {isCreating ? 'Initializing...' : 'Create Admin Session'}
              <ArrowRight size={20} />
            </button>
          </div>

          {/* Join Session Card */}
          <div className="card card-dark">
            <div className="icon-box icon-box-white">
              <Users size={32} />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold">Join Session</h2>
              <p className="text-light opacity-60">Enter the 6-character session code provided by your instructor.</p>
            </div>
            <form onSubmit={handleJoin} className="form-inline">
              <input 
                type="text" 
                placeholder="ABC123"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinError(''); // Clear error when typing
                }}
                className={`input-modern ${joinError ? 'border-red-500' : ''}`}
                maxLength={6}
                style={{textTransform: 'uppercase'}}
              />
              <button type="submit" className="btn btn-white" style={{width: 'auto', padding: '1rem'}}>
                Join
              </button>
            </form>
            {joinError && (
              <p className="text-red-400 text-sm mt-2" style={{color: '#E04545', fontSize: '0.875rem', marginTop: '0.5rem'}}>
                {joinError}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

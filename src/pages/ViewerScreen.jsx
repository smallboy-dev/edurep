import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { useFullscreen } from '../hooks/useFullscreen';
import { MonitorPlay, ShieldAlert, Maximize, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebRTCViewer } from '../hooks/useWebRTCViewer';
import { useRef } from 'react';
import '../components/ViewerMobile.css';

export default function ViewerScreen() {
  const { sessionId } = useParams();
  const { sessionData, loading, error, joinSession } = useSession(sessionId);
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();
  const [hasStarted, setHasStarted] = useState(false);
  const { remoteStream, connectionState } = useWebRTCViewer(hasStarted ? sessionId : null);
  const videoRef = useRef(null);

  // Connect remote stream to video element
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
      console.log('Connected remote stream to video element');
    }
  }, [remoteStream]);

  const [showQuitModal, setShowQuitModal] = useState(false);
  const [quitPasswordInput, setQuitPasswordInput] = useState('');
  const [quitError, setQuitError] = useState('');
  const [hasUnlockedLocal, setHasUnlockedLocal] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  // Hardcore Trap: If they forcibly broke Fullscreen via browser long-press override
  const isForcedExit = hasStarted && sessionData?.isLocked && !isFullscreen && !hasUnlockedLocal;
  const isQuitModeActive = showQuitModal || isForcedExit;

  // SEB Key Interceptor
  useEffect(() => {
    if (!hasStarted || !sessionData?.isLocked || hasUnlockedLocal) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Meta' || (e.altKey && e.key === 'Tab')) {
        e.preventDefault();
        e.stopPropagation();
        setShowQuitModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [hasStarted, sessionData?.isLocked, hasUnlockedLocal]);

  // Tab Close / Browser Close Trap
  useEffect(() => {
    if (!hasStarted || !sessionData?.isLocked || hasUnlockedLocal) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ''; // Required for Chrome to show native prompt
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasStarted, sessionData?.isLocked, hasUnlockedLocal]);

  // Electron Detection
  useEffect(() => {
    setIsElectron(window.electron?.isElectron?.() || false);
  }, []);

  // Hardware Lock/Unlock Bridge for Electron
  useEffect(() => {
    if (!isElectron || !hasStarted) return;

    const handleHardwareLock = async () => {
      try {
        if (sessionData?.isLocked && !hasUnlockedLocal) {
          await window.electron.lockMachine();
        } else {
          await window.electron.unlockMachine();
        }
      } catch (error) {
        console.error('Hardware lock/unlock failed:', error);
      }
    };

    handleHardwareLock();
  }, [isElectron, hasStarted, sessionData?.isLocked, hasUnlockedLocal]);

  const handleQuitSubmit = async (e) => {
    e.preventDefault();
    if (quitPasswordInput.trim() === sessionData?.quitPassword) {
      setShowQuitModal(false);
      setHasUnlockedLocal(true);
      exitFullscreen();
      
      // Unlock hardware in Electron
      if (isElectron) {
        try {
          await window.electron.unlockMachine();
        } catch (error) {
          console.error('Failed to unlock hardware:', error);
        }
      }
    } else {
      setQuitError('Invalid Quit Password');
      setTimeout(() => setQuitError(''), 2000);
    }
  };

  const handleQuitCancel = () => {
    if (isForcedExit) {
      enterFullscreen(true);
    } else {
      setShowQuitModal(false);
    }
  };

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Auto-enforce logic and join logic
  useEffect(() => {
    if (hasStarted) {
      joinSession();
    }
  }, [hasStarted, sessionId]);

  const safeSessionData = sessionData || {};

  // EARLY RETURNS
  if (loading) {
    return (
      <div className="main-container bg-[#0B2140] flex items-center justify-center text-white/50 font-medium h-screen">
        <div className="animate-pulse">Connecting to Session...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-container bg-[#0B2140] flex items-center justify-center text-red-400 font-bold h-screen">
        {error}
      </div>
    );
  }

  // Waiting for Host state
  if (safeSessionData.status === 'ready') {
    return (
      <div className="main-container bg-dark h-screen overflow-hidden waiting-screen-card" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)'}}>
        <div className="bg-decor decor-1"></div>
        <div className="bg-decor decor-2"></div>
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card card-dark"
          style={{maxWidth: '450px', width: '90%', textAlign: 'center'}}
        >
          <div className="icon-box" style={{margin: '0 auto', background: 'var(--primary)', color: 'white', width: '80px', height: '80px', borderRadius: '50%'}}>
            <MonitorPlay size={40} />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold tracking-tight mt-6">Hang Tight!</h1>
            <p className="text-light opacity-60">The presenter is preparing the content.</p>
            <div className="flex items-center justify-center gap-3 mt-4" style={{display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center'}}>
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="main-container bg-dark h-screen overflow-hidden join-session-card" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)'}}>
        <div className="bg-decor decor-1"></div>
        <div className="bg-decor decor-2"></div>
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card card-dark"
          style={{maxWidth: '450px', width: '90%', textAlign: 'center'}}
        >
          <div className="icon-box" style={{margin: '0 auto', background: 'rgba(255,255,255,0.1)', color: 'white', width: '80px', height: '80px', borderRadius: '50%'}}>
            <MonitorPlay size={40} />
          </div>
          <div className="space-y-4 mt-6">
            <h1 className="text-3xl font-extrabold tracking-tight">Ready to Join?</h1>
            <p className="text-light opacity-60">Session Code: <span className="highlight session-code" style={{fontWeight: 800}}>{sessionId}</span></p>
          </div>
          <button 
            onClick={() => {
              setHasStarted(true);
              enterFullscreen(safeSessionData.isLocked);
            }}
            className="btn btn-white"
            style={{marginTop: '2rem', width: '100%'}}
          >
            <Maximize size={24} />
            Enter Fullscreen Session
          </button>
        </motion.div>
      </div>
    );
  }

  if (safeSessionData.status === 'ended') {
    return (
      <div className="main-container bg-dark h-screen overflow-hidden" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)'}}>
        <div className="card card-dark" style={{maxWidth: '450px', width: '90%', textAlign: 'center'}}>
          <h1 className="text-3xl font-extrabold tracking-tight">Session Ended</h1>
          <button onClick={() => window.location.href = '/'} className="btn btn-white mt-6" style={{marginTop: '1.5rem'}}>Return Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative viewer-content-container" style={{width: '100vw', height: '100vh', background: 'black', overflow: 'hidden'}}>
      {/* Content Frame */}
      {remoteStream ? (
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          style={{width: '100%', height: '100%', objectFit: 'contain', background: 'black'}}
        />
      ) : (
        <div className="main-container bg-dark h-full flex flex-col items-center justify-center">
            <p className="text-2xl font-bold tracking-widest text-white opacity-20">WAITING FOR SCREEN SHARE</p>
            <p className="text-white opacity-40 mt-4" style={{fontSize: '0.875rem'}}>
              Host will start sharing soon...
            </p>
        </div>
      )}

      {/* Floating Status */}
      <div className="absolute top-6 left-6 pointer-events-none z-50 viewer-status-badge">
        <div className="badge shadow-xl" style={{background: 'rgba(11, 33, 64, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: 'white'}}>
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse mr-2 status-dot" style={{width: '8px', height: '8px', background: 'var(--secondary)', borderRadius: '50%'}}></div>
          LIVE SCREEN SHARE
          {remoteStream && (
            <span style={{marginLeft: '8px', fontSize: '0.65rem', opacity: 0.8}}>
              - {connectionState}
            </span>
          )}
        </div>
      </div>

      {/* SEB Quit Password Modal */}
      <AnimatePresence>
        {isQuitModeActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="quit-modal-overlay"
            style={{
              position: 'fixed', 
              inset: 0, 
              zIndex: 9999, 
              background: isForcedExit ? 'var(--bg-darker)' : 'rgba(0,0,0,0.85)', 
              backdropFilter: 'blur(10px)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}
          >
            {isForcedExit && (
               <div className="bg-decor decor-1" style={{opacity: 0.1}}></div>
            )}
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card card-dark quit-modal-card"
              style={{maxWidth: '400px', width: '90%', border: '1px solid rgba(224, 69, 69, 0.3)', padding: '2rem', zIndex: 10}}
            >
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem'}}>
                <div className="icon-box" style={{background: 'rgba(224, 69, 69, 0.1)', color: '#E04545', width: '80px', height: '80px', borderRadius: '50%', border: '4px solid rgba(224, 69, 69, 0.1)'}}>
                  {isForcedExit ? <ShieldAlert size={40} /> : <Key size={32} />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{isForcedExit ? 'Session Pinned' : 'Restricted Mode'}</h2>
                  <p className="text-muted" style={{fontSize: '0.85rem', marginTop: '0.5rem'}}>
                    {isForcedExit 
                      ? 'You broke focus from the primary window. Enter the Quit Password to exit permanently, or return to the broadcast.'
                      : 'This session is locked. Enter the Quit Password provided by the host to exit fullscreen or switch windows.'}
                  </p>
                </div>
                
                <form onSubmit={handleQuitSubmit} style={{width: '100%', marginTop: '1rem'}}>
                  <input 
                    type="password" 
                    value={quitPasswordInput}
                    onChange={(e) => setQuitPasswordInput(e.target.value)}
                    placeholder="Enter 4-digit PIN..."
                    className="quit-modal-input"
                    style={{width: '100%', padding: '0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: 'black', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px', fontWeight: 'bold'}}
                    autoFocus
                  />
                  {quitError && <p style={{color: '#E04545', margin: '0.5rem 0 0 0', fontSize: '0.8rem', fontWeight: 'bold'}}>{quitError}</p>}
                  
                  <div className="quit-modal-buttons" style={{display: 'flex', gap: '8px', marginTop: '1.5rem'}}>
                    {isForcedExit ? (
                       <button type="button" onClick={handleQuitCancel} className="btn btn-primary" style={{flex: 1, padding: '0.75rem'}}>Return to Broadcast</button>
                    ) : (
                       <>
                         <button type="button" onClick={handleQuitCancel} className="btn" style={{flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white'}}>Cancel</button>
                         <button type="submit" className="btn btn-primary" style={{flex: 1, background: '#E04545'}}>Unlock Device</button>
                       </>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

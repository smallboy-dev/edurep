import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import '../components/AdminMobile.css';
import { 
  Users, 
  Activity, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  Maximize2,
  ChevronLeft,
  ChevronRight,
  MonitorPlay,
  Power,
  ScreenShare,
  Key
} from 'lucide-react';
import { motion } from 'framer-motion';
import FloatingControlPanel from '../components/FloatingControlPanel';
import { useWebRTCHost } from '../hooks/useWebRTCHost';
import { useRef } from 'react';

export default function AdminDashboard() {
  const { sessionId } = useParams();
  const { 
    sessionData, 
    updateSession, 
    loading, 
    participantsCount, 
    endSession 
  } = useSession(sessionId);
  
  
  const { localStream, isSharing, startShare, stopShare, error: webrtcError, connectionState } = useWebRTCHost(sessionId);
  const hostVideoRef = useRef(null);

  useEffect(() => {
    if (hostVideoRef.current && localStream) {
      hostVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isSharing]);

  const [authChecking, setAuthChecking] = useState(true);
  const [liveDuration, setLiveDuration] = useState('Just now');
  
  // Authorization logic
  const adminSessions = JSON.parse(localStorage.getItem('livelock_admin_sessions') || '{}');
  const storedKey = adminSessions[sessionId];
  const isAuthorized = sessionData && storedKey && (String(sessionData.adminKey).trim() === String(storedKey).trim());

  // Handle Auth Propagation Delay
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setAuthChecking(false);
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Live Duration Ticker
  useEffect(() => {
    if (!sessionData?.createdAt) return;
    
    const computeDuration = () => {
      const ms = typeof sessionData.createdAt.toMillis === 'function' ? sessionData.createdAt.toMillis() : Date.now();
      const diffMins = Math.floor((Date.now() - ms) / 60000);
      if (diffMins === 0) setLiveDuration('Just now');
      else if (diffMins < 60) setLiveDuration(`${diffMins} min${diffMins !== 1 ? 's' : ''} ago`);
      else setLiveDuration(`${Math.floor(diffMins / 60)} hr${Math.floor(diffMins / 60) !== 1 ? 's' : ''} ago`);
    };

    computeDuration();
    const interval = setInterval(computeDuration, 10000);
    return () => clearInterval(interval);
  }, [sessionData?.createdAt]);

  
  const safeSessionData = sessionData || {};
  const toggleLock = () => updateSession({ isLocked: !safeSessionData.isLocked });
  const toggleFullscreen = () => updateSession({ forceFullscreen: !safeSessionData.forceFullscreen });

  const stats = [
    { label: 'Total Viewers', value: (participantsCount || 0).toLocaleString(), icon: Users, trend: 'Real-time sync', color: '#0A4DB0' },
    { label: 'Session Status', value: safeSessionData.isLocked ? 'Restricted' : 'Open', icon: Activity, trend: 'Current state', color: '#18A058', accent: true },
    { label: 'Duration', value: 'Live', icon: Clock, trend: `Started: ${liveDuration}`, color: '#6B7785' },
    { label: 'Quit Password', value: safeSessionData.quitPassword || '----', icon: Key, trend: 'Unlock PIN', color: '#E04545' },
  ];

  // EARLY RETURNS AFTER ALL HOOKS
  if (loading) {
    return (
      <div className="main-container bg-main flex flex-col items-center justify-center" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '2rem'}}>
         <div className="icon-box icon-box-primary animate-bounce">
            <ShieldCheck size={40} />
         </div>
         <div className="text-xl font-extrabold tracking-widest text-primary uppercase opacity-50">Loading Session...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="main-container bg-dark flex flex-col items-center justify-center p-6 text-center" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-darker)'}}>
        <div className="bg-decor decor-1"></div>
        <div className="card card-dark" style={{maxWidth: '450px', width: '100%', textAlign: 'center', border: '1px solid rgba(224, 69, 69, 0.2)'}}>
          <div className="icon-box icon-box-primary" style={{margin: '0 auto', background: 'rgba(224, 69, 69, 0.1)', color: '#E04545', width: '80px', height: '80px'}}>
            <ShieldCheck size={48} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-6" style={{marginTop: '1.5rem'}}>Access Restricted</h1>
          <p className="text-light opacity-60 mt-4" style={{marginTop: '1rem'}}>You do not have the host key required for this session.</p>
          <button onClick={() => window.location.href = '/'} className="btn btn-white" style={{marginTop: '2rem'}}>Return to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-main admin-dashboard" style={{display: 'flex', height: '100vh', overflow: 'hidden'}}>
      <Sidebar sessionId={sessionId} />
      
      <main style={{flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
        <Topbar 
          title="Session Control" 
          sessionStatus={safeSessionData.status === 'ended' ? 'ENDED' : (safeSessionData.status === 'live' ? 'ACTIVE' : 'READY')} 
          viewerCount={participantsCount} 
        />
        
        <div className="animate-fade-in" style={{flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem'}}>
          <div className="card-grid stats-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem'}}>
            {stats.map((stat) => (
              <motion.div 
                key={stat.label}
                whileHover={{ y: -4 }}
                className="card card-light"
                style={{padding: '1.5rem', gap: '1rem'}}
              >
                <div className="flex justify-between items-start" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%'}}>
                  <span className="text-muted font-bold tracking-tight uppercase" style={{fontSize: '0.75rem'}}>{stat.label}</span>
                  <div className={`icon-box ${stat.accent ? 'icon-box-primary' : 'icon-box-primary'}`} style={{width: '40px', height: '40px'}}>
                    <stat.icon size={20} />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-main" style={{color: 'var(--text-main)'}}>{stat.value}</div>
                <div className="flex items-center gap-1" style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: stat.accent ? 'var(--secondary)' : 'var(--text-muted)'}}>
                  <TrendingUp size={14} />
                  {stat.trend}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="card-grid content-grid" style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem'}}>
            <div className="space-y-6" style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
              <div className="card card-light" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <h3 className="text-lg font-bold flex items-center gap-2" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <ScreenShare size={20} className="highlight" style={{color: '#18A058'}} />
                  Screen Share
                </h3>
                
                {isSharing ? (
                  <div className="screen-share-container" style={{position: 'relative', width: '100%', height: '220px', background: 'black', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-light)'}}>
                     <video ref={hostVideoRef} autoPlay muted playsInline style={{width: '100%', height: '100%', objectFit: 'contain'}} />
                     <div style={{position: 'absolute', top: 0, left: 0, right: 0, padding: '0.5rem', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px'}}>
                        <div style={{width: '8px', height: '8px', borderRadius: '50%', background: '#E04545', animation: 'pulse 2s infinite'}}></div>
                        LIVE SCREENCAST ACTIVE
                        <span style={{marginLeft: 'auto', fontSize: '0.65rem', opacity: 0.8}}>
                          {connectionState}
                        </span>
                     </div>
                     <button onClick={stopShare} className="btn" style={{position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(224, 69, 69, 0.9)', color: 'white', padding: '0.5rem 1rem', fontSize: '0.8rem'}}>Stop Sharing</button>
                  </div>
                ) : (
                  <div>
                    <button onClick={startShare} className="btn" style={{width: '100%', padding: '1rem', background: 'rgba(24, 160, 88, 0.1)', color: '#18A058', border: '1px solid #18A058', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'}}>
                      <MonitorPlay size={20} />
                      Capture Display / Window
                    </button>
                    <p className="text-muted" style={{marginTop: '0.75rem', fontSize: '0.75rem', textAlign: 'center'}}>Bypasses loading restrictions. Smoothly transmit your PPTs natively to all locked viewers.</p>
                    {webrtcError && <p style={{color: '#E04545', marginTop: '0.5rem', fontSize: '0.75rem', textAlign: 'center', fontWeight: 'bold'}}>{webrtcError}</p>}
                  </div>
                )}
              </div>
              
                {/* Show screen sharing info when in screen mode */}
                {isSharing && (
                  <div className="relative" style={{padding: '1.5rem', background: 'linear-gradient(135deg, rgba(24, 160, 88, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)', borderRadius: 'var(--radius-md)', border: '1px solid #18A058', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <div className="flex items-center gap-4" style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                        <div className="icon-box" style={{width: '56px', height: '56px', background: 'linear-gradient(135deg, #18A058 0%, #10b981 100%)', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(24, 160, 88, 0.25)'}}>
                          <ScreenShare size={28} />
                        </div>
                        <div style={{flex: 1}}>
                          <div className="flex items-center gap-2" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                            <div style={{width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite'}}></div>
                            <p className="font-bold uppercase tracking-widest" style={{fontSize: '0.7rem', color: '#ef4444', letterSpacing: '1px'}}>Currently Broadcasting</p>
                          </div>
                          <p className="font-bold" style={{maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1f2937', fontSize: '1rem', lineHeight: '1.4'}}>Live Screen Share - {connectionState}</p>
                          <div className="flex items-center gap-3" style={{display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px'}}>
                            <span className="badge" style={{margin: 0, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontSize: '0.75rem', padding: '4px 8px'}}>
                              Screen Share Active
                            </span>
                            <span style={{fontSize: '0.75rem', color: '#6b7280'}}>Real-time Casting</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="badge" style={{margin: 0, background: '#18A058', color: 'white', border: 'none', fontSize: '0.875rem', fontWeight: '600', padding: '8px 16px', boxShadow: '0 2px 8px rgba(24, 160, 88, 0.25)'}}>
                        LIVE SCREENCAST
                      </div>
                    </div>
                )}

              <div className="card card-light">
                <div className="card-grid control-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem'}}>
                  <button 
                    onClick={() => updateSession({ status: safeSessionData.status === 'live' ? 'ready' : 'live' })}
                    className="card card-light"
                    style={{
                      padding: '1.25rem',
                      cursor: 'pointer',
                      border: safeSessionData.status === 'live' ? '2px solid var(--secondary)' : '3px solid var(--primary)',
                      background: safeSessionData.status === 'live' ? 'rgba(24, 160, 88, 0.03)' : 'var(--primary)',
                      color: safeSessionData.status === 'live' ? 'var(--secondary)' : 'white',
                      gridColumn: 'span 1'
                    }}
                  >
                    <div className="flex items-center justify-between" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                      <div className="flex items-center gap-4" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <Activity size={24} className={safeSessionData.status === 'live' ? '' : 'animate-pulse'} />
                        <div className="text-left">
                          <p className="font-bold underline uppercase tracking-widest" style={{fontSize: '0.65rem', opacity: 0.8}}>Session State</p>
                          <p className="font-bold text-lg">{safeSessionData.status === 'live' ? 'LIVE NOW' : 'GO LIVE'}</p>
                        </div>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={toggleFullscreen}
                    className="card card-light"
                    style={{
                      padding: '1.25rem',
                      cursor: 'pointer',
                      border: safeSessionData.forceFullscreen ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                      background: safeSessionData.forceFullscreen ? 'rgba(10, 77, 176, 0.03)' : 'white'
                    }}
                  >
                    <div className="flex items-center justify-between" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                      <div className="flex items-center gap-4" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <Maximize2 size={20} className={safeSessionData.forceFullscreen ? 'highlight' : 'text-muted'} />
                        <p className="font-bold" style={{fontSize: '0.8rem'}}>Fullscreen</p>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={toggleLock}
                    className="card card-light"
                    style={{
                      padding: '1.25rem',
                      cursor: 'pointer',
                      border: safeSessionData.isLocked ? '2px solid #E04545' : '1px solid var(--border-light)',
                      background: safeSessionData.isLocked ? 'rgba(224, 69, 69, 0.03)' : 'white'
                    }}
                  >
                    <div className="flex items-center justify-between" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                      <div className="flex items-center gap-4" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <ShieldCheck size={20} style={{color: safeSessionData.isLocked ? '#E04545' : 'var(--text-muted)'}} />
                        <p className="font-bold" style={{fontSize: '0.8rem'}}>Lock</p>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={endSession}
                    className="card card-light"
                    style={{
                      padding: '1.25rem',
                      cursor: 'pointer',
                      border: safeSessionData.status === 'ended' ? '2px solid black' : '1px solid var(--border-light)',
                      background: safeSessionData.status === 'ended' ? '#eee' : 'white'
                    }}
                  >
                    <div className="flex items-center justify-between" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                      <div className="flex items-center gap-4" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <Power size={20} style={{color: 'black'}} />
                        <p className="font-bold" style={{fontSize: '0.8rem'}}>End</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="card card-light" style={{padding: 0}}>
              <div style={{padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h3 className="font-bold">Recent Activity</h3>
                <span className="badge" style={{margin: 0, background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.7rem'}}>Live</span>
              </div>
              <div style={{padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                {safeSessionData.activityLogs && safeSessionData.activityLogs.length > 0 ? (
                  safeSessionData.activityLogs.slice().reverse().map((log, idx) => (
                    <div key={idx} className="card-hover activity-item" style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem', borderRadius: 'var(--radius-md)'}}>
                      <div className="icon-box icon-box-primary" style={{width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', background: 'var(--bg-main)'}}>
                        <Users size={16} style={{color: 'var(--text-muted)'}} />
                      </div>
                      <div className="activity-details" style={{flex: 1}}>
                        <p className="font-bold gap-2" style={{fontSize: '0.85rem'}}>Viewer_{log.id}</p>
                        <p className="text-muted" style={{fontSize: '0.7rem'}}>{log.action} · {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                      <div style={{width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary)'}}></div>
                    </div>
                  ))
                ) : (
                  <div style={{padding: '2rem', textAlign: 'center', opacity: 0.5}}>
                    <p>No activity yet.</p>
                    <p style={{fontSize: '0.75rem'}}>When viewers join, they will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <FloatingControlPanel 
        onToggleFullscreen={toggleFullscreen}
        onToggleLock={toggleLock}
        onEnd={endSession}
        isLocked={safeSessionData.isLocked}
        isFullscreen={safeSessionData.forceFullscreen}
      />
    </div>
  );
}

import { AlertCircle, Maximize, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FullscreenOverlay({ isFullscreen, isLocked, onEnterFullscreen }) {
  if (isFullscreen || !isLocked) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="main-container h-full"
        style={{
          position: 'fixed', 
          inset: 0, 
          zIndex: 9999, 
          background: 'var(--bg-darker)', // Fully opaque dark background
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div className="bg-decor decor-1" style={{opacity: 0.1}}></div>
        
        <div className="card card-dark animate-fade-in" style={{maxWidth: '450px', width: '90%', textAlign: 'center', boxShadow: '0 0 100px rgba(0,0,0,0.8)', border: '1px solid rgba(224, 69, 69, 0.3)'}}>
          <div className="icon-box" style={{margin: '0 auto', background: 'rgba(224, 69, 69, 0.2)', color: '#E04545', width: '100px', height: '100px', borderRadius: '50%', border: '4px solid rgba(224, 69, 69, 0.1)'}}>
            <ShieldAlert size={56} />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Session Pinned</h2>
            <p className="text-light opacity-60" style={{fontSize: '1rem', lineHeight: 1.6}}>
              The presenter has **Locked Focus** for this session. Navigation and system keys are restricted to keep you synchronized with the broadcast.
            </p>
          </div>
          
          <button 
            onClick={onEnterFullscreen}
            className="btn btn-primary"
            style={{marginTop: '1.5rem', padding: '1.25rem 2.5rem', fontSize: '1.1rem', background: '#E04545'}}
          >
            <Maximize size={24} />
            Resume Pinned Session
          </button>
          
          <div style={{marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '8px'}}>
             <p className="text-muted font-bold uppercase tracking-widest" style={{fontSize: '0.7rem', color: '#E04545'}}>
               Host Restriction Active
             </p>
             <p className="text-light opacity-30" style={{fontSize: '0.65rem'}}>
               ESC and Navigation keys are managed by LiveLock
             </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

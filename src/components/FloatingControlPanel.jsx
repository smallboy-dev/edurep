import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  ShieldCheck, 
  Power 
} from 'lucide-react';

export default function FloatingControlPanel({ 
  onNext, 
  onPrev, 
  onToggleFullscreen, 
  onToggleLock, 
  onEnd,
  isLocked,
  isFullscreen,
  currentIndex,
  totalItems
}) {
  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="badge floating-controls"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem',
        borderRadius: '16px',
        background: 'rgba(11, 33, 64, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        color: 'white'
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.75rem', borderRight: '1px solid rgba(255, 255, 255, 0.1)'}}>
        <button 
          onClick={onPrev}
          className="btn"
          style={{padding: '0.5rem', width: 'auto', background: 'transparent', border: 'none', color: 'white'}}
        >
          <ChevronLeft size={20} />
        </button>
        <span style={{fontSize: '0.75rem', fontWeight: 'bold', minWidth: '40px', textAlign: 'center'}}>
          {currentIndex + 1} / {totalItems}
        </span>
        <button 
          onClick={onNext}
          className="btn"
          style={{padding: '0.5rem', width: 'auto', background: 'transparent', border: 'none', color: 'white'}}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.75rem', borderRight: '1px solid rgba(255, 255, 255, 0.1)'}}>
        <button 
          onClick={onToggleFullscreen}
          className="btn"
          style={{
            padding: '0.5rem', 
            width: 'auto', 
            border: 'none', 
            color: 'white',
            background: isFullscreen ? 'var(--primary)' : 'transparent'
          }}
        >
          <Maximize2 size={18} />
        </button>
        <button 
          onClick={onToggleLock}
          className="btn"
          style={{
            padding: '0.5rem', 
            width: 'auto', 
            border: 'none', 
            color: 'white',
            background: isLocked ? '#E04545' : 'transparent'
          }}
        >
          <ShieldCheck size={18} />
        </button>
      </div>

      <button 
        onClick={onEnd}
        className="btn"
        style={{
          padding: '0.5rem', 
          width: 'auto', 
          border: 'none', 
          color: 'white',
          background: 'transparent',
          marginLeft: '0.5rem'
        }}
        title="End Session"
      >
        <Power size={18} />
      </button>
    </motion.div>
  );
}

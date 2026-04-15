import { Users, Bell } from 'lucide-react';

export default function Topbar({ title, sessionStatus, viewerCount }) {
  return (
    <header className="h-20 bg-white border-b flex items-center justify-between px-8 shadow-sm" style={{height: '80px', background: 'white', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem'}}>
      <h1 className="text-xl font-extrabold tracking-tight text-main" style={{fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)'}}>{title}</h1>
      
      <div className="flex items-center gap-8" style={{display: 'flex', alignItems: 'center', gap: '32px'}}>
        <div className="badge" style={{margin: 0, padding: '0.6rem 1.2rem', background: 'var(--bg-main)', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-light)', fontSize: '0.75rem', fontWeight: 700}}>
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" style={{width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary)'}}></div>
          {sessionStatus}
        </div>
        
        <div className="flex items-center gap-6" style={{display: 'flex', alignItems: 'center', gap: '24px', color: 'var(--text-muted)'}}>
          <div className="flex items-center gap-2" style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700}}>
            <Users size={20} />
            <span style={{fontSize: '0.9rem'}}>{viewerCount || 0} Viewers</span>
          </div>
          <Bell size={20} style={{cursor: 'pointer'}} />
        </div>
        
        <div style={{height: '32px', width: '1px', background: 'var(--border-light)'}}></div>
        
        <img 
          src="https://storage.googleapis.com/banani-avatars/avatar%2Ffemale%2F25-35%2FEuropean%2F4" 
          alt="Profile" 
          style={{width: '44px', height: '44px', borderRadius: '50%', border: '2px solid white', boxShadow: 'var(--shadow-md)', objectFit: 'cover'}}
        />
      </div>
    </header>
  );
}

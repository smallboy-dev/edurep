import { LayoutDashboard, Video, UploadCloud, BarChart2, Settings, MonitorPlay } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ sessionId }) {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: `/admin/${sessionId}` },
    { name: 'Sessions', icon: Video, path: `/admin/${sessionId}/sessions` },
    { name: 'Upload Content', icon: UploadCloud, path: `/admin/${sessionId}/upload` },
    { name: 'Analytics', icon: BarChart2, path: `/admin/${sessionId}/analytics` },
    { name: 'Settings', icon: Settings, path: `/admin/${sessionId}/settings` },
  ];

  return (
    <aside className="bg-dark border-r" style={{height: '100vh', display: 'flex', flexDirection: 'column', width: '280px', borderRight: '1px solid var(--border-white)', background: 'var(--bg-darker)'}}>
      <div style={{padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', color: 'white'}}>
        <div className="icon-box icon-box-white" style={{width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'var(--primary)'}}>
          <MonitorPlay size={24} />
        </div>
        <span className="text-2xl font-extrabold tracking-tight">LiveLock</span>
      </div>
      
      <nav style={{flex: 1, padding: '0 1rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
        {menuItems.map((item) => (
          <NavLink
            end
            key={item.name}
            to={item.path}
            className="card-hover"
            style={({ isActive }) => ({
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              textDecoration: 'none', 
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              background: isActive ? 'var(--primary)' : 'transparent',
              color: isActive ? 'white' : 'white',
              opacity: isActive ? 1 : 0.6,
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              boxShadow: isActive ? '0 10px 15px -3px rgba(10, 77, 176, 0.3)' : 'none'
            })}
          >
            <item.icon size={20} />
            {item.name}
          </NavLink>
        ))}
      </nav>
      
      <div style={{padding: '2rem', borderTop: '1px solid var(--border-white)'}}>
        <div className="badge" style={{margin: 0, padding: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-white)', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 'var(--radius-md)'}}>
          <span style={{opacity: 0.6, fontSize: '0.75rem', fontWeight: 600}}>CODE:</span> 
          <span className="highlight" style={{marginLeft: '8px', letterSpacing: '2px', fontWeight: 800, color: 'var(--primary-light)'}}>{sessionId}</span>
        </div>
      </div>
    </aside>
  );
}

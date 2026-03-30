import { useMemo } from 'react';
import { clearAuthSession, getAuthSession } from './authStorage';
import { C, font } from './theme';

const MENU = [
  { id:'overview',        icon:'◈', label:'Overview',        path:'/admin/dashboard' },
  { id:'users',           icon:'👥', label:'Accounts',        path:'/admin/accounts' },
  { id:'departments',     icon:'🏢', label:'Departments',     path:'/admin/departments' },
  { id:'closure-periods', icon:'📅', label:'Closure Dates',   path:'/admin/closure-periods' },
  { id:'idea-management', icon:'💡', label:'Idea Management', path:'/admin/idea-management' },
];

function NavItem({ item, active }) {
  const isActive = active === item.id;
  return (
    <button onClick={() => { if(!isActive) window.location.href=item.path; }}
      style={{display:'flex',alignItems:'center',gap:'10px',width:'100%',padding:'9px 12px',marginBottom:'2px',
        border:'none',borderRadius:'8px',cursor:'pointer',fontFamily:font,fontSize:'13px',fontWeight:isActive?600:500,
        textAlign:'left',transition:'all .15s',
        background:isActive?'rgba(99,102,241,0.15)':'transparent',
        color:isActive?'#A5B4FC':'rgba(148,163,184,0.8)',
        borderLeft:isActive?'3px solid #6366F1':'3px solid transparent'}}>
      <span style={{fontSize:'15px',width:'18px',textAlign:'center',flexShrink:0}}>{item.icon}</span>
      {item.label}
    </button>
  );
}

export default function AdminShell({ activeMenu, children }) {
  const session = useMemo(() => getAuthSession(), []);
  const user = session?.user;
  const initials = (user?.name||'AD').slice(0,2).toUpperCase();

  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:font,background:'#F8FAFC'}}>
      {/* Sidebar */}
      <aside style={{width:'220px',minHeight:'100vh',background:C.sidebar,display:'flex',flexDirection:'column',flexShrink:0,boxShadow:'2px 0 12px rgba(0,0,0,0.15)'}}>
        {/* Logo */}
        <div style={{padding:'1.3rem 1.1rem',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:'34px',height:'34px',borderRadius:'9px',flexShrink:0,background:'linear-gradient(135deg,#6366F1,#818CF8)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(99,102,241,0.4)'}}>
              <span style={{color:'#fff',fontWeight:900,fontSize:'13px'}}>IH</span>
            </div>
            <div>
              <div style={{color:'#F1F5F9',fontWeight:800,fontSize:'14px',letterSpacing:'-0.01em'}}>IdeaHub</div>
              <div style={{color:'rgba(148,163,184,0.6)',fontSize:'10px'}}>Admin Portal</div>
            </div>
          </div>
        </div>
        {/* Nav */}
        <nav style={{flex:1,padding:'0.9rem 0.5rem 0.5rem'}}>
          <div style={{fontSize:'9px',fontWeight:700,color:'rgba(148,163,184,0.4)',letterSpacing:'0.1em',textTransform:'uppercase',padding:'0 8px',marginBottom:'6px'}}>Menu</div>
          {MENU.map(item => <NavItem key={item.id} item={item} active={activeMenu}/>)}
        </nav>
        {/* Footer */}
        <div style={{padding:'0.9rem 0.7rem',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px',borderRadius:'8px',background:'rgba(255,255,255,0.04)',marginBottom:'8px'}}>
            <div style={{width:'30px',height:'30px',borderRadius:'50%',flexShrink:0,background:'linear-gradient(135deg,#6366F1,#A78BFA)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{color:'#fff',fontWeight:700,fontSize:'11px'}}>{initials}</span>
            </div>
            <div style={{minWidth:0}}>
              <div style={{color:'#E2E8F0',fontSize:'12px',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.name||'Admin'}</div>
              <div style={{color:'rgba(148,163,184,0.55)',fontSize:'10px'}}>Administrator</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'4px 8px',marginBottom:'8px'}}>
            <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#4ADE80',flexShrink:0}}/>
            <span style={{color:'rgba(148,163,184,0.55)',fontSize:'11px'}}>System online</span>
          </div>
          <button onClick={() => { clearAuthSession(); window.location.href='/login'; }}
            style={{width:'100%',padding:'7px 10px',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'7px',background:'transparent',color:'rgba(148,163,184,0.7)',fontSize:'12px',fontWeight:500,cursor:'pointer',fontFamily:font,display:'flex',alignItems:'center',gap:'6px',justifyContent:'center'}}>
            ↩ Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{flex:1,background:'#F8FAFC',minHeight:'100vh',overflowY:'auto'}}>
        {/* Topbar */}
        <div style={{background:'#fff',borderBottom:'1px solid #E2E8F0',padding:'0 2.5rem',height:'56px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 1px 3px rgba(0,0,0,0.04)',position:'sticky',top:0,zIndex:10}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <span style={{fontSize:'11px',color:'#94A3B8'}}>Admin</span>
            <span style={{color:'#CBD5E1'}}>/</span>
            <span style={{fontSize:'12px',fontWeight:600,color:'#475569',textTransform:'capitalize'}}>{(activeMenu||'dashboard').replace(/-/g,' ')}</span>
          </div>
          <span style={{fontSize:'12px',color:'#94A3B8'}}>{new Date().toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})}</span>
        </div>
        {/* Content */}
        <div style={{padding:'2rem 2.5rem',maxWidth:'1400px'}}>{children}</div>
      </main>
    </div>
  );
}

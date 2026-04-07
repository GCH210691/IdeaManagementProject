import { canCreateIdeas, canViewAcademicYearReports, canViewCategoryList, clearAuthSession, getAuthSession } from './authStorage';

function toRoleLabel(role) {
  return String(role||'').toLowerCase().split('_').map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join(' ');
}

function roleAccent(role) {
  return { ADMIN:'#7C3AED', STAFF:'#0EA5E9', QA_COORDINATOR:'#10B981', QA_MANAGER:'#F59E0B' }[role] || '#6366F1';
}

function NavItem({ item, active }) {
  const isActive = active === item.id;
  return (
    <button onClick={() => { if(window.location.pathname.toLowerCase()!==item.path.toLowerCase()) window.location.href=item.path; }}
      style={{display:'flex',alignItems:'center',gap:'9px',width:'100%',padding:'9px 12px',marginBottom:'2px',
        border:'none',borderRadius:'8px',cursor:'pointer',fontFamily:font,fontSize:'13px',fontWeight:isActive?600:500,
        textAlign:'left',transition:'all .15s',
        background:isActive?'rgba(99,102,241,0.15)':'transparent',
        color:isActive?'#A5B4FC':'rgba(148,163,184,0.8)',
        borderLeft:isActive?'3px solid #6366F1':'3px solid transparent'}}>
      <span style={{fontSize:'14px',width:'18px',textAlign:'center',flexShrink:0}}>{item.icon}</span>
      {item.label}
    </button>
  );
}

export default function StaffShell({ activeMenu, footerText, children }) {
  const session = getAuthSession();
  const user = session?.user;
  const roleLabel = toRoleLabel(user?.role||'User');
  const accent = roleAccent(user?.role);
  const initials = (user?.name||'U').slice(0,2).toUpperCase();

    const menuItems = [
        { id: 'dashboard', icon: 'DB', label: 'Dashboard', path: '/dashboard' },
        { id: 'ideas', icon: 'VI', label: 'View ideas', path: '/ideas' },
        ...(canCreateIdeas(user) ? [{ id: 'create', icon: 'CI', label: 'Create idea', path: '/ideas/create' }] : []),
        ...(canCreateIdeas(user) ? [{ id: 'myideas', icon: 'MY', label: 'My ideas', path: '/staff/my-ideas' }] : []),
        { id: 'departments', icon: 'DP', label: 'Departments', path: '/staff/departments' },
        ...(user?.role === 'QA_COORDINATOR'
            ? [
                { id: 'notifications', icon: 'NT', label: 'Notifications', path: '/qa-coordinator/notifications' },
                { id: 'department-management', icon: 'DM', label: 'Department management', path: '/qa-coordinator/department-management' }
            ]
            : []),
        ...(canViewAcademicYearReports(user)
            ? [{ id: 'academic-year-reports', icon: 'AR', label: 'Academic year reports', path: '/qa-manager/academic-year-reports' }]
            : []),
        ...(canViewCategoryList(user) ? [{ id: 'categories', icon: 'CL', label: 'Category list', path: '/qa-manager/categories' }] : []),
    ];

  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:font,background:'#F8FAFC'}}>
      {/* Sidebar */}
      <aside style={{width:'220px',minHeight:'100vh',background:C.sidebar,display:'flex',flexDirection:'column',flexShrink:0,boxShadow:'2px 0 12px rgba(0,0,0,0.15)'}}>
        {/* Logo */}
        <div style={{padding:'1.3rem 1.1rem',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:'34px',height:'34px',borderRadius:'9px',flexShrink:0,background:`linear-gradient(135deg,${accent},${accent}CC)`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 2px 8px ${accent}44`}}>
              <span style={{color:'#fff',fontWeight:900,fontSize:'13px'}}>IH</span>
            </div>
            <div>
              <div style={{color:'#F1F5F9',fontWeight:800,fontSize:'14px',letterSpacing:'-0.01em'}}>IdeaHub</div>
              <div style={{color:'rgba(148,163,184,0.6)',fontSize:'10px'}}>{roleLabel}</div>
            </div>
          </div>
        </div>
        {/* Nav */}
        <nav style={{flex:1,padding:'0.9rem 0.5rem 0.5rem'}}>
          <div style={{fontSize:'9px',fontWeight:700,color:'rgba(148,163,184,0.4)',letterSpacing:'0.1em',textTransform:'uppercase',padding:'0 8px',marginBottom:'6px'}}>Navigation</div>
          {menuItems.map(item => <NavItem key={item.id} item={item} active={activeMenu}/>)}
        </nav>
        {/* Footer */}
        <div style={{padding:'0.9rem 0.7rem',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px',borderRadius:'8px',background:'rgba(255,255,255,0.04)',marginBottom:'8px'}}>
            <div style={{width:'30px',height:'30px',borderRadius:'50%',flexShrink:0,background:`linear-gradient(135deg,${accent},${accent}AA)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{color:'#fff',fontWeight:700,fontSize:'11px'}}>{initials}</span>
            </div>
            <div style={{minWidth:0}}>
              <div style={{color:'#E2E8F0',fontSize:'12px',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.name||'User'}</div>
              <div style={{color:'rgba(148,163,184,0.55)',fontSize:'10px'}}>{roleLabel}</div>
            </div>
          </div>
          {footerText && <div style={{fontSize:'11px',color:'rgba(148,163,184,0.5)',padding:'0 8px',marginBottom:'6px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{footerText}</div>}
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
            <span style={{fontSize:'11px',color:'#94A3B8'}}>{roleLabel}</span>
            <span style={{color:'#CBD5E1'}}>/</span>
            <span style={{fontSize:'12px',fontWeight:600,color:'#475569',textTransform:'capitalize'}}>{(activeMenu||'').replace(/-/g,' ')||'Dashboard'}</span>
          </div>
          <span style={{fontSize:'12px',color:'#94A3B8'}}>{new Date().toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})}</span>
        </div>
        <div style={{padding:'2rem 2.5rem',maxWidth:'1400px'}}>{children}</div>
      </main>
    </div>
  );
}

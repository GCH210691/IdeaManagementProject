import { useEffect } from 'react';
import { clearAuthSession, getAuthSession, getDisplayName, roleToPath } from './authStorage';
import { font, C } from './theme';

export default function RoleLandingPage({ expectedRole, roleText }) {
  const session = getAuthSession();
  const user = session?.user;

  useEffect(()=>{
    if(!session?.token||!user){window.location.href='/login';return;}
    if(user.role!==expectedRole){window.location.href=roleToPath(user.role);}
  },[expectedRole,session,user]);

  if(!session?.token||!user)return null;
  const name=getDisplayName(user);

  return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:font}}>
      <div style={{background:'#fff',borderRadius:'16px',border:`1px solid ${C.border}`,padding:'2.5rem',maxWidth:'420px',width:'100%',textAlign:'center',boxShadow:'0 4px 20px rgba(0,0,0,0.06)'}}>
        <div style={{width:'60px',height:'60px',borderRadius:'50%',background:`linear-gradient(135deg,${C.primary},#818CF8)`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.25rem',fontSize:'28px'}}>👋</div>
        <h1 style={{margin:'0 0 0.4rem',fontSize:'1.3rem',fontWeight:800,color:C.text}}>Welcome, {name}!</h1>
        <p style={{margin:'0 0 1.5rem',fontSize:'13px',color:C.textSub}}>You are signed in as <strong>{roleText}</strong>. Redirecting to your dashboard…</p>
        <button onClick={()=>{clearAuthSession();window.location.href='/login';}}
          style={{padding:'0.65rem 1.4rem',border:`1px solid ${C.border}`,borderRadius:'9px',background:'#fff',color:C.textSub,fontSize:'13.5px',fontWeight:600,cursor:'pointer',fontFamily:font}}>
          ↩ Logout
        </button>
      </div>
    </div>
  );
}

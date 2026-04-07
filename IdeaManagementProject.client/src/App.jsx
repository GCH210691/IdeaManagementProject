import { useState } from 'react';
import { roleToPath, setAuthSession, BASE_URL } from './shared/authStorage';

function Input({ label, type='text', value, onChange, placeholder, autoComplete }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{marginBottom:'1rem'}}>
      <label style={{display:'block',fontSize:'11px',fontWeight:700,color:'rgba(226,232,240,0.6)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'6px'}}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        style={{width:'100%',boxSizing:'border-box',padding:'0.7rem 0.9rem',background:focused?'rgba(99,102,241,0.08)':'rgba(255,255,255,0.05)',border:`1.5px solid ${focused?'#6366F1':'rgba(255,255,255,0.1)'}`,borderRadius:'10px',color:'#F1F5F9',fontSize:'14px',fontFamily:font,outline:'none',transition:'all .2s',boxShadow:focused?'0 0 0 3px rgba(99,102,241,0.15)':'none'}}/>
    </div>
  );
}

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const isErr = message && !message.includes('...');

  async function submit(e) {
    e.preventDefault();
    if (!email.trim()||!password) { setMessage('Email and password are required.'); return; }
    setLoading(true); setMessage('Signing in…');
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({email:email.trim(),password})});
      if (res.status===401) { setMessage('Invalid email or password.'); return; }
      if (!res.ok) { setMessage(`Login failed (${res.status})`); return; }
      const data = await res.json();
      setAuthSession(data.token, data.user);
      window.location.href = roleToPath(data.user?.role);
    } catch(e) { setMessage('Error: ' + (e instanceof Error ? e.message : String(e))); }
    finally { setLoading(false); }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',fontFamily:font,background:'#060E1E',position:'relative',overflow:'hidden'}}>
      {/* BG orbs */}
      <div style={{position:'absolute',top:'-100px',left:'-80px',width:'500px',height:'500px',borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.22) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:'-80px',right:'-60px',width:'400px',height:'400px',borderRadius:'50%',background:'radial-gradient(circle,rgba(6,182,212,0.12) 0%,transparent 70%)',pointerEvents:'none'}}/>
      {/* Grid */}
      <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',backgroundSize:'52px 52px',pointerEvents:'none'}}/>

      {/* Left panel */}
      <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',padding:'4rem',display:'none'}}>
      </div>

      {/* Card */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
        <div style={{width:'100%',maxWidth:'420px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:'20px',padding:'2.5rem',boxSizing:'border-box',backdropFilter:'blur(20px)',boxShadow:'0 25px 60px rgba(0,0,0,0.5)'}}>

          {/* Logo */}
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'2rem'}}>
            <div style={{width:'40px',height:'40px',borderRadius:'11px',background:'linear-gradient(135deg,#6366F1,#818CF8)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px rgba(99,102,241,0.5)'}}>
              <span style={{color:'#fff',fontWeight:900,fontSize:'14px'}}>IH</span>
            </div>
            <div>
              <div style={{color:'#fff',fontWeight:800,fontSize:'16px',letterSpacing:'-0.02em'}}>IdeaHub</div>
              <div style={{color:'rgba(255,255,255,0.35)',fontSize:'11px'}}>Idea Management Platform</div>
            </div>
          </div>

          <h1 style={{margin:'0 0 0.3rem 0',fontSize:'1.5rem',fontWeight:900,color:'#fff',letterSpacing:'-0.02em'}}>Welcome back</h1>
          <p style={{margin:'0 0 1.8rem 0',color:'rgba(255,255,255,0.38)',fontSize:'13px'}}>Sign in to share and explore ideas</p>

          <form onSubmit={submit}>
            <Input label="Email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@university.com" autoComplete="username"/>
            <div style={{marginBottom:'1rem'}}>
              <label style={{display:'block',fontSize:'11px',fontWeight:700,color:'rgba(226,232,240,0.6)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'6px'}}>Password</label>
              <div style={{position:'relative'}}>
                <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                  style={{width:'100%',boxSizing:'border-box',padding:'0.7rem 2.6rem 0.7rem 0.9rem',background:'rgba(255,255,255,0.05)',border:'1.5px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'#F1F5F9',fontSize:'14px',fontFamily:font,outline:'none'}}/>
                <button type="button" onClick={()=>setShowPw(!showPw)}
                  style={{position:'absolute',right:'0.75rem',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.4)',fontSize:'14px',padding:0}}>
                  {showPw?'🙈':'👁'}
                </button>
              </div>
            </div>

            <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'1.2rem'}}>
              <button type="button" style={{background:'none',border:'none',color:'#818CF8',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:font,padding:0}}>Forgot password?</button>
            </div>

            <button type="submit" disabled={loading}
              style={{width:'100%',padding:'0.8rem',borderRadius:'10px',border:'none',background:loading?'rgba(99,102,241,0.4)':'linear-gradient(135deg,#4F46E5 0%,#6366F1 60%,#818CF8 100%)',color:'#fff',fontWeight:700,fontSize:'14px',cursor:loading?'not-allowed':'pointer',fontFamily:font,letterSpacing:'0.01em',boxShadow:loading?'none':'0 4px 20px rgba(99,102,241,0.4)'}}>
              {loading?'Signing in…':'Sign in →'}
            </button>
          </form>

          {/* Register link */}
          <p style={{textAlign:'center',marginTop:'1.2rem',marginBottom:0}}>
            <span style={{color:'rgba(255,255,255,0.3)',fontSize:'13px'}}>Don&apos;t have an account? </span>
            <button onClick={()=>window.location.href='/register'} style={{background:'none',border:'none',color:'#818CF8',fontWeight:700,fontSize:'13px',cursor:'pointer',fontFamily:font,padding:0}}>Register now</button>
          </p>

          {/* Message */}
          {message && message!=='Signing in…' && (
            <div style={{marginTop:'1rem',padding:'0.7rem 1rem',borderRadius:'8px',fontSize:'13px',background:isErr?'rgba(239,68,68,0.1)':'rgba(16,185,129,0.1)',border:`1px solid ${isErr?'rgba(239,68,68,0.25)':'rgba(16,185,129,0.25)'}`,color:isErr?'#FCA5A5':'#6EE7B7'}}>
              {isErr?'⚠ ':' '}{message}
            </div>
          )}

          {/* Demo hint */}
          <div style={{marginTop:'1.25rem',padding:'0.75rem',borderRadius:'10px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',fontSize:'12px',color:'rgba(255,255,255,0.35)'}}>
            <strong style={{color:'rgba(255,255,255,0.5)'}}>Demo:</strong> admin@university.com / Admin@123
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

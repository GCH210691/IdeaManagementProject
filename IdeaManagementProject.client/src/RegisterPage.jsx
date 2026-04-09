import { useEffect, useState } from 'react';
import { BASE_URL } from './shared/authStorage';

const ADMIN_LOCKED = new Set(['ADMIN','QA_MANAGER']);
const ADMIN_DEPT = 'administration';

function toRoleLabel(r) { return String(r||'').toLowerCase().split('_').map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join(' '); }

const inp = {width:'100%',boxSizing:'border-box',padding:'0.65rem 0.85rem',background:'rgba(255,255,255,0.06)',border:'1.5px solid rgba(255,255,255,0.1)',borderRadius:'9px',color:'#F1F5F9',fontSize:'14px',fontFamily:"'DM Sans', 'Segoe UI', system-ui, sans-serif",outline:'none'};
const sel = {...inp,cursor:'pointer'};

function Field({label,children}) {
  return (
    <div style={{marginBottom:'0.85rem'}}>
      <label style={{display:'block',fontSize:'10.5px',fontWeight:700,color:'rgba(226,232,240,0.55)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'5px'}}>{label}</label>
      {children}
    </div>
  );
}

export default function RegisterPage() {
  const [form,setForm]=useState({name:'',email:'',password:'',role:'',departmentId:''});
  const [roles,setRoles]=useState([]);
  const [departments,setDepartments]=useState([]);
  const [acceptedTerms,setAcceptedTerms]=useState(false);
  const [loading,setLoading]=useState(false);
  const [loadingOptions,setLoadingOptions]=useState(true);
  const [message,setMessage]=useState('');
  const isErr = message&&!message.includes('…')&&!message.includes('Success');

  useEffect(()=>{
    async function loadOptions() {
      try {
        const res=await fetch(`${BASE_URL}/api/auth/register-options`,{headers:{Accept:'application/json'}});
        if(!res.ok)return;
        const data=await res.json();
        setRoles(Array.isArray(data.roles)?data.roles:[]);
        setDepartments(Array.isArray(data.departments)?data.departments:[]);
      }catch(e){setMessage('Failed to load options: '+(e instanceof Error?e.message:String(e)));}
      finally{setLoadingOptions(false);}
    }
    loadOptions();
  },[]);

  function handleRoleChange(role) {
    const update={...form,role};
    if(ADMIN_LOCKED.has(role)){
      const adminDept=departments.find(d=>d.name?.toLowerCase()===ADMIN_DEPT);
      update.departmentId=adminDept?String(adminDept.departmentId):'';
    }
    setForm(update);
  }

  const deptLocked = ADMIN_LOCKED.has(form.role);
  const availableDepts = deptLocked?departments.filter(d=>d.name?.toLowerCase()===ADMIN_DEPT):departments;

  async function submit(e) {
    e.preventDefault();
    if(!form.name.trim()||!form.email.trim()||!form.password||!form.role||!form.departmentId){setMessage('All fields are required.');return;}
    if(!acceptedTerms){setMessage('Please accept the terms to continue.');return;}
    setLoading(true);setMessage('Creating account…');
    try {
      const res=await fetch(`${BASE_URL}/api/auth/register`,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({name:form.name.trim(),email:form.email.trim(),password:form.password,role:form.role,departmentId:Number(form.departmentId),acceptedTerms})});
      const data=await res.json().catch(()=>null);
      if(res.status===409){setMessage('Email is already registered.');return;}
      if(!res.ok){setMessage(data?.message||`Registration failed (${res.status})`);return;}
      setMessage('Account created! Redirecting…');
      setTimeout(()=>window.location.href='/',1200);
    }catch(e){setMessage('Error: '+(e instanceof Error?e.message:String(e)));}
    finally{setLoading(false);}
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',fontFamily:"'DM Sans', 'Segoe UI', system-ui, sans-serif",background:'#060E1E',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:'-80px',right:'-60px',width:'500px',height:'500px',borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:'-60px',left:'-80px',width:'400px',height:'400px',borderRadius:'50%',background:'radial-gradient(circle,rgba(6,182,212,0.1) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)',backgroundSize:'52px 52px',pointerEvents:'none'}}/>

      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
        <div style={{width:'100%',maxWidth:'480px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:'20px',padding:'2.25rem',boxSizing:'border-box',backdropFilter:'blur(20px)',boxShadow:'0 25px 60px rgba(0,0,0,0.5)'}}>
          {/* Logo */}
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'1.75rem'}}>
            <div style={{width:'36px',height:'36px',borderRadius:'9px',background:'linear-gradient(135deg,#6366F1,#818CF8)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 3px 10px rgba(99,102,241,0.45)'}}>
              <span style={{color:'#fff',fontWeight:900,fontSize:'12px'}}>IH</span>
            </div>
            <div style={{color:'#fff',fontWeight:800,fontSize:'15px',letterSpacing:'-0.01em'}}>IdeaHub</div>
          </div>

          <h1 style={{margin:'0 0 0.25rem',fontSize:'1.3rem',fontWeight:900,color:'#fff',letterSpacing:'-0.02em'}}>Create an account</h1>
          <p style={{margin:'0 0 1.5rem',color:'rgba(255,255,255,0.38)',fontSize:'13px'}}>Join your team's idea management platform</p>

          {loadingOptions ? (
            <p style={{color:'rgba(255,255,255,0.4)',fontSize:'13px'}}>Loading options…</p>
          ) : (
            <form onSubmit={submit}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                <div style={{gridColumn:'1/-1'}}>
                  <Field label="Full name">
                    <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Your full name" disabled={loading} style={inp}/>
                  </Field>
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <Field label="Email">
                    <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="you@university.com" disabled={loading} style={inp}/>
                  </Field>
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <Field label="Password">
                    <input type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} placeholder="••••••••" disabled={loading} style={inp}/>
                  </Field>
                </div>
                <div>
                  <Field label="Role">
                    <select value={form.role} onChange={e=>handleRoleChange(e.target.value)} disabled={loading} style={sel}>
                      <option value="">Select role</option>
                      {roles.map(r=><option key={r.roleName} value={r.roleName}>{toRoleLabel(r.roleName)}</option>)}
                    </select>
                  </Field>
                </div>
                <div>
                  <Field label="Department">
                    <select value={form.departmentId} onChange={e=>setForm(p=>({...p,departmentId:e.target.value}))} disabled={loading||deptLocked} style={{...sel,opacity:deptLocked?0.6:1}}>
                      <option value="">Select dept.</option>
                      {availableDepts.map(d=><option key={d.departmentId} value={d.departmentId}>{d.name}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              {/* Terms */}
              <div style={{display:'flex',gap:'10px',alignItems:'flex-start',margin:'0.5rem 0 1.25rem',cursor:'pointer'}} onClick={()=>setAcceptedTerms(!acceptedTerms)}>
                <div style={{width:'18px',height:'18px',borderRadius:'5px',border:`1.5px solid ${acceptedTerms?'#6366F1':'rgba(255,255,255,0.2)'}`,background:acceptedTerms?'#6366F1':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:'1px',transition:'all .2s'}}>
                  {acceptedTerms&&<span style={{color:'#fff',fontSize:'11px',lineHeight:1}}>✓</span>}
                </div>
                <span style={{color:'rgba(255,255,255,0.45)',fontSize:'12.5px',lineHeight:1.5}}>I accept the terms and conditions of the platform</span>
              </div>

              <button type="submit" disabled={loading} style={{width:'100%',padding:'0.75rem',borderRadius:'10px',border:'none',background:loading?'rgba(99,102,241,0.4)':'linear-gradient(135deg,#4F46E5,#818CF8)',color:'#fff',fontWeight:700,fontSize:'14px',cursor:loading?'not-allowed':'pointer',fontFamily:"'DM Sans', 'Segoe UI', system-ui, sans-serif",boxShadow:loading?'none':'0 4px 16px rgba(99,102,241,0.4)'}}>
                {loading?'Creating account…':'Create Account →'}
              </button>
            </form>
          )}

          <p style={{textAlign:'center',marginTop:'1.1rem',marginBottom:0}}>
            <span style={{color:'rgba(255,255,255,0.3)',fontSize:'13px'}}>Already have an account? </span>
            <button onClick={()=>window.location.href='/'} style={{background:'none',border:'none',color:'#818CF8',fontWeight:700,fontSize:'13px',cursor:'pointer',fontFamily:"'DM Sans', 'Segoe UI', system-ui, sans-serif",padding:0}}>Sign in</button>
          </p>

          {message&&<div style={{marginTop:'1rem',padding:'0.7rem 1rem',borderRadius:'8px',fontSize:'13px',background:isErr?'rgba(239,68,68,0.1)':'rgba(16,185,129,0.1)',border:`1px solid ${isErr?'rgba(239,68,68,0.25)':'rgba(16,185,129,0.25)'}`,color:isErr?'#FCA5A5':'#6EE7B7'}}>{isErr?'⚠ ':' '}{message}</div>}
        </div>
      </div>
    </div>
  );
}

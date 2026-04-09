import { useEffect, useMemo, useState } from 'react';
import { BASE_URL, getAuthHeaders, getAuthSession, roleToPath } from '../shared/authStorage';
import AdminShell from '../shells/AdminShell';
import { C, card, font } from '../shared/designTokens';

function toLocalInputValue(v) { if(!v)return''; const d=new Date(v); if(isNaN(d))return''; return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,16); }
function toIsoOrNull(v) { if(!v)return null; const d=new Date(v); return isNaN(d)?null:d.toISOString(); }
function toRoleLabel(r) { return String(r||'').toLowerCase().split('_').map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join(' '); }
function getInitials(name) { const p=String(name||'').trim().split(/\s+/).filter(Boolean).slice(0,2); return p.length===0?'NA':p.map(x=>x[0]?.toUpperCase()||'').join(''); }
function roleColor(r) { return {ADMIN:'#7C3AED',STAFF:'#0891B2',QA_COORDINATOR:'#059669',QA_MANAGER:'#D97706'}[r]||C.textSub; }
function roleBg(r) { return {ADMIN:'#EDE9FE',STAFF:'#CFFAFE',QA_COORDINATOR:'#D1FAE5',QA_MANAGER:'#FEF3C7'}[r]||'#F1F5F9'; }

const inp = { width:'100%',boxSizing:'border-box',padding:'0.5rem 0.65rem',borderRadius:'6px',border:`1.5px solid ${C.border}`,fontSize:'13px',color:C.text,fontFamily:font,outline:'none' };

function StatCard({ label, value, accent }) {
  return (
    <div style={{...card,padding:'1.1rem',borderTop:`3px solid ${accent}`,flex:1}}>
      <div style={{fontSize:'1.7rem',fontWeight:800,color:C.text,lineHeight:1}}>{value}</div>
      <div style={{fontSize:'11.5px',color:C.textSub,marginTop:'5px'}}>{label}</div>
    </div>
  );
}

export default function AdminAccountsPage() {
  const session = useMemo(()=>getAuthSession(),[]);
  const user = session?.user;
  const [users,setUsers]=useState([]);
  const [roles,setRoles]=useState([]);
  const [departments,setDepartments]=useState([]);
  const [search,setSearch]=useState('');
  const [feedback,setFeedback]=useState({type:'info',text:''});
  const [editingUserId,setEditingUserId]=useState(0);
  const [form,setForm]=useState({name:'',email:'',role:'',departmentId:'',acceptedTermsAt:'',password:''});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);

  async function loadData(showMsg=false) {
    setLoading(true);
    try {
        const [ur, or] = await Promise.all([
        fetch(`${BASE_URL}/api/admin/users`, { headers: getAuthHeaders({ Accept: 'application/json' }) }),
        fetch(`${BASE_URL}/api/admin/users/options`, { headers: getAuthHeaders({ Accept: 'application/json' }) }),
      ]);
      if (ur.status===401||or.status===401) { window.location.href='/login'; return; }
      if (ur.status===403||or.status===403) { window.location.href='/admin/dashboard'; return; }
      if (!ur.ok||!or.ok) { setFeedback({type:'error',text:`Load failed: ${ur.status}`}); return; }
      const ud=await ur.json(); const od=await or.json();
      const nextUsers=Array.isArray(ud)?ud:[];
      setUsers(nextUsers); setRoles(Array.isArray(od?.roles)?od.roles:[]); setDepartments(Array.isArray(od?.departments)?od.departments:[]);
      setFeedback(showMsg?{type:'success',text:`Loaded ${nextUsers.length} accounts.`}:{type:'info',text:''});
    } catch(e) { setFeedback({type:'error',text:'Load error: '+(e instanceof Error?e.message:String(e))}); }
    finally { setLoading(false); }
  }

  useEffect(()=>{ if(!session?.token||!user){window.location.href='/login';return;} if(user.role!=='ADMIN'){window.location.href=roleToPath(user.role);return;} loadData(); },[session,user]);

  const filteredUsers = useMemo(()=>{ const q=search.trim().toLowerCase(); if(!q)return users; return users.filter(r=>String(r.name||'').toLowerCase().includes(q)||String(r.email||'').toLowerCase().includes(q)||String(r.role||'').toLowerCase().includes(q)||String(r.departmentName||'').toLowerCase().includes(q)); },[search,users]);
  const summary = useMemo(()=>[
    {label:'Total accounts',value:users.length,accent:'#6366F1'},
    {label:'Administrators',value:users.filter(r=>r.role==='ADMIN').length,accent:'#7C3AED'},
    {label:'QA coordinators',value:users.filter(r=>r.role==='QA_COORDINATOR').length,accent:'#059669'},
    {label:'Accepted terms',value:users.filter(r=>r.acceptedTermsAt).length,accent:'#10B981'},
  ],[users]);

  function beginEdit(row) { setEditingUserId(row.id); setForm({name:row.name||'',email:row.email||'',role:row.role||'',departmentId:String(row.departmentId||''),acceptedTermsAt:toLocalInputValue(row.acceptedTermsAt),password:''}); setFeedback({type:'info',text:''}); }
  function cancelEdit() { setEditingUserId(0); setForm({name:'',email:'',role:'',departmentId:'',acceptedTermsAt:'',password:''}); setFeedback({type:'info',text:''}); }

  async function saveEdit() {
    if (!editingUserId) return;
    if (!form.name.trim()||!form.email.trim()||!form.role||!form.departmentId) { setFeedback({type:'error',text:'Name, email, role, and department are required.'}); return; }
    setSaving(true); setFeedback({type:'info',text:'Saving…'});
      try {
      const res = await fetch(`${BASE_URL}/api/admin/users/${editingUserId}`, { method: 'PUT', headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }), body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), role: form.role, departmentId: Number(form.departmentId), acceptedTermsAt: toIsoOrNull(form.acceptedTermsAt), password: form.password.trim() || null }) });
      if (res.status===401){window.location.href='/login';return;} if(res.status===403){window.location.href='/admin/dashboard';return;}
      const payload=await res.json().catch(()=>null);
      if (!res.ok){setFeedback({type:'error',text:payload?.message||`Save failed: ${res.status}`});return;}
      setUsers(c=>c.map(i=>i.id===editingUserId?payload:i)); setEditingUserId(0); setFeedback({type:'success',text:'Account updated.'});
    } catch(e) { setFeedback({type:'error',text:'Save error: '+(e instanceof Error?e.message:String(e))}); }
    finally { setSaving(false); }
  }

  if (!session?.token||!user) return null;

  const fbColors = {info:{bg:'#F0F9FF',br:'#BAE6FD',c:'#0369A1'},success:{bg:'#ECFDF5',br:'#A7F3D0',c:'#065F46'},error:{bg:'#FEF2F2',br:'#FECACA',c:'#B91C1C'}};
  const fb = fbColors[feedback.type]||fbColors.info;

  return (
    <AdminShell activeMenu="users">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.75rem',flexWrap:'wrap',gap:'1rem'}}>
        <div>
          <h1 style={{margin:'0 0 3px',fontSize:'1.55rem',fontWeight:800,color:C.text,letterSpacing:'-0.02em'}}>Account Management</h1>
          <p style={{margin:0,fontSize:'13px',color:C.textSub}}>Review roles, departments, and terms acceptance for all users.</p>
        </div>
        <button onClick={()=>loadData(true)} style={{padding:'0.55rem 1.1rem',border:'none',borderRadius:'8px',background:C.primary,color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:font}}>↺ Refresh accounts</button>
      </div>

      {feedback.text && <div style={{padding:'0.75rem 1rem',borderRadius:'10px',border:`1px solid ${fb.br}`,background:fb.bg,color:fb.c,fontSize:'13px',fontWeight:500,marginBottom:'1.25rem'}}>{feedback.text}</div>}

      <div style={{display:'flex',gap:'1rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        {summary.map(s=><StatCard key={s.label} {...s}/>)}
      </div>

      <div style={{...card}}>
        <div style={{display:'flex',gap:'0.75rem',alignItems:'center',marginBottom:'1.1rem',flexWrap:'wrap'}}>
          <div style={{position:'relative',flex:1,minWidth:'200px'}}>
            <span style={{position:'absolute',left:'0.75rem',top:'50%',transform:'translateY(-50%)',color:C.textMuted,fontSize:'13px'}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find by name, email, role, or department…"
              style={{...inp,paddingLeft:'2.1rem',background:'#F8FAFC',width:'100%',boxSizing:'border-box'}}/>
          </div>
          <span style={{fontSize:'12px',color:C.textMuted,fontWeight:600,whiteSpace:'nowrap'}}>{loading?'Loading…':`${filteredUsers.length} of ${users.length} accounts`}</span>
        </div>

        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13.5px',minWidth:'900px'}}>
            <thead>
              <tr style={{background:'#F8FAFC'}}>
                {['Account','Email','Role','Department','Accepted Terms','Password','Actions'].map(h=>(
                  <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:'11px',fontWeight:700,color:C.textMuted,textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:`2px solid ${C.border}`,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((row,idx)=>{
                const editing = editingUserId===row.id;
                return (
                  <tr key={row.id} style={{background:idx%2===0?'#fff':'#FAFBFF',transition:'background .1s'}}>
                    <td style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                        <div style={{width:'34px',height:'34px',borderRadius:'50%',background:`linear-gradient(135deg,${roleColor(row.role)},${roleColor(row.role)}99)`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <span style={{color:'#fff',fontWeight:700,fontSize:'12px'}}>{getInitials(row.name)}</span>
                        </div>
                        <div>
                          {editing ? <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={{...inp,width:'140px'}}/> : <div style={{fontWeight:700,color:C.text,fontSize:'13.5px'}}>{row.name}</div>}
                          {!editing && <div style={{fontSize:'11px',color:C.textMuted}}>ID: {row.id}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle'}}>
                      {editing ? <input value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} style={{...inp,width:'190px'}}/> : <span style={{color:C.textSub,fontSize:'13px'}}>{row.email}</span>}
                    </td>
                    <td style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle'}}>
                      {editing ? (
                        <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} style={{...inp,width:'150px',cursor:'pointer'}}>
                          <option value="">Select role</option>
                          {roles.map(r=><option key={r.roleName} value={r.roleName}>{toRoleLabel(r.roleName)}</option>)}
                        </select>
                      ) : <span style={{display:'inline-block',padding:'2px 9px',borderRadius:'999px',fontSize:'11.5px',fontWeight:700,background:roleBg(row.role),color:roleColor(row.role)}}>{toRoleLabel(row.role)}</span>}
                    </td>
                    <td style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle'}}>
                      {editing ? (
                        <select value={form.departmentId} onChange={e=>setForm(p=>({...p,departmentId:e.target.value}))} style={{...inp,width:'150px',cursor:'pointer'}}>
                          <option value="">Select dept.</option>
                          {departments.map(d=><option key={d.departmentId} value={d.departmentId}>{d.name}</option>)}
                        </select>
                      ) : <span style={{fontSize:'13px',color:C.text}}>{row.departmentName}</span>}
                    </td>
                    <td style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle'}}>
                      {editing ? <input type="datetime-local" value={form.acceptedTermsAt} onChange={e=>setForm(p=>({...p,acceptedTermsAt:e.target.value}))} style={{...inp,width:'175px'}}/> : (
                        <div>
                          <span style={{display:'inline-block',padding:'2px 9px',borderRadius:'999px',fontSize:'11.5px',fontWeight:700,background:row.acceptedTermsAt?C.successLt:C.dangerLt,color:row.acceptedTermsAt?C.successDk:C.dangerDk}}>{row.acceptedTermsAt?'Accepted':'Not accepted'}</span>
                          {row.acceptedTermsAt && <div style={{fontSize:'11px',color:C.textMuted,marginTop:'3px'}}>{new Date(row.acceptedTermsAt).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>}
                        </div>
                      )}
                    </td>
                    <td style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle'}}>
                      {editing ? <input type="password" placeholder="Leave blank to keep" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} style={{...inp,width:'170px'}}/> : <span style={{color:C.textMuted,fontSize:'12px'}}>Hidden</span>}
                    </td>
                    <td style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle'}}>
                      <div style={{display:'flex',gap:'6px'}}>
                        {!editing && <button onClick={()=>beginEdit(row)} style={{padding:'5px 12px',border:'none',borderRadius:'6px',background:C.infoLt,color:C.infoDk,fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:font}}>Edit</button>}
                        {editing && <>
                          <button onClick={saveEdit} disabled={saving} style={{padding:'5px 12px',border:'none',borderRadius:'6px',background:C.primary,color:'#fff',fontSize:'12px',fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:font,opacity:saving?0.7:1}}>{saving?'Saving…':'Save'}</button>
                          <button onClick={cancelEdit} disabled={saving} style={{padding:'5px 12px',border:`1px solid ${C.border}`,borderRadius:'6px',background:'#fff',color:C.textSub,fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:font}}>Cancel</button>
                        </>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filteredUsers.length===0 && (
                <tr><td colSpan={7} style={{padding:'2rem',textAlign:'center',color:C.textMuted,fontSize:'13px'}}>No accounts match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

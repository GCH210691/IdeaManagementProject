import { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders, getAuthSession, roleToPath } from '../shared/authStorage';
import AdminShell from '../shells/AdminShell';

const inp = { width:'100%',boxSizing:'border-box',padding:'0.55rem 0.75rem',borderRadius:'7px',border:`1.5px solid ${C.border}`,fontSize:'13px',color:C.text,fontFamily:font,outline:'none' };

export default function AdminDepartmentsPage() {
  const session = useMemo(()=>getAuthSession(),[]);
  const user = session?.user;
  const [departments,setDepartments]=useState([]);
  const [qaCoordinators,setQaCoordinators]=useState([]);
  const [createName,setCreateName]=useState('');
  const [createQaUserIds,setCreateQaUserIds]=useState([]);
  const [editingDepartmentId,setEditingDepartmentId]=useState(0);
  const [search,setSearch]=useState('');
  const [form,setForm]=useState({name:'',qaCoordinatorUserIds:[]});
  const [feedback,setFeedback]=useState({type:'info',text:'Loading…'});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);

  async function loadData(showMsg=false) {
    setLoading(true);
    try {
      const [dr,ur]=await Promise.all([fetch('/api/admin/departments',{headers:getAuthHeaders({Accept:'application/json'})}),fetch('/api/admin/users',{headers:getAuthHeaders({Accept:'application/json'})})]);
      if(dr.status===401||ur.status===401){window.location.href='/login';return;}
      if(dr.status===403||ur.status===403){window.location.href='/admin/dashboard';return;}
      if(!dr.ok||!ur.ok){setFeedback({type:'error',text:`Load failed: ${dr.status}`});return;}
      const dd=await dr.json(); const ud=await ur.json();
      const nextDepts=Array.isArray(dd)?dd:[];
      setDepartments(nextDepts);
      setQaCoordinators(Array.isArray(ud)?ud.filter(a=>a.role==='QA_COORDINATOR'):[]);
      setFeedback(showMsg?{type:'success',text:`Loaded ${nextDepts.length} departments.`}:{type:'info',text:''});
    } catch(e) { setFeedback({type:'error',text:'Load error: '+(e instanceof Error?e.message:String(e))}); }
    finally { setLoading(false); }
  }

  useEffect(()=>{ if(!session?.token||!user){window.location.href='/login';return;} if(user.role!=='ADMIN'){window.location.href=roleToPath(user.role);return;} loadData(); },[session,user]);

  const filteredDepts = useMemo(()=>{ const q=search.trim().toLowerCase(); if(!q)return departments; return departments.filter(r=>String(r.name||'').toLowerCase().includes(q)||(Array.isArray(r.qaCoordinators)&&r.qaCoordinators.some(c=>String(c.name||'').toLowerCase().includes(q)))); },[departments,search]);
  const summary = useMemo(()=>{ const total=departments.length; const assigned=departments.filter(r=>Array.isArray(r.qaCoordinators)&&r.qaCoordinators.length>0).length; return [{label:'Total departments',value:total,accent:'#6366F1'},{label:'Assigned coordinators',value:assigned,accent:'#10B981'},{label:'Unassigned',value:total-assigned,accent:'#F59E0B'},{label:'Coordinator accounts',value:qaCoordinators.length,accent:'#06B6D4'}]; },[departments,qaCoordinators]);

  function beginEdit(row){setEditingDepartmentId(row.departmentId);setForm({name:row.name||'',qaCoordinatorUserIds:Array.isArray(row.qaCoordinators)?row.qaCoordinators.map(i=>String(i.userId)):[]});setFeedback({type:'info',text:''});}
  function cancelEdit(){setEditingDepartmentId(0);setForm({name:'',qaCoordinatorUserIds:[]});setFeedback({type:'info',text:''});}
  function readSelected(e){return Array.from(e.target.selectedOptions,o=>o.value);}

  async function createDepartment() {
    if(!createName.trim()){setFeedback({type:'error',text:'Department name is required.'});return;}
    setSaving(true);setFeedback({type:'info',text:'Creating…'});
    try {
      const res=await fetch('/api/admin/departments',{method:'POST',headers:getAuthHeaders({'Content-Type':'application/json',Accept:'application/json'}),body:JSON.stringify({name:createName.trim(),qaCoordinatorUserIds:createQaUserIds.map(v=>Number(v))})});
      if(res.status===401){window.location.href='/login';return;} if(res.status===403){window.location.href='/admin/dashboard';return;}
      const payload=await res.json().catch(()=>null);
      if(!res.ok){setFeedback({type:'error',text:payload?.message||`Create failed: ${res.status}`});return;}
      setCreateName('');setCreateQaUserIds([]);await loadData();setFeedback({type:'success',text:'Department created.'});
    } catch(e){setFeedback({type:'error',text:'Create error: '+(e instanceof Error?e.message:String(e))});}
    finally{setSaving(false);}
  }

  async function saveEdit() {
    if(!editingDepartmentId)return;
    if(!form.name.trim()){setFeedback({type:'error',text:'Department name is required.'});return;}
    setSaving(true);setFeedback({type:'info',text:'Saving…'});
    try {
      const res=await fetch(`/api/admin/departments/${editingDepartmentId}`,{method:'PUT',headers:getAuthHeaders({'Content-Type':'application/json',Accept:'application/json'}),body:JSON.stringify({name:form.name.trim(),qaCoordinatorUserIds:form.qaCoordinatorUserIds.map(v=>Number(v))})});
      if(res.status===401){window.location.href='/login';return;} if(res.status===403){window.location.href='/admin/dashboard';return;}
      const payload=await res.json().catch(()=>null);
      if(!res.ok){setFeedback({type:'error',text:payload?.message||`Save failed: ${res.status}`});return;}
      setEditingDepartmentId(0);await loadData();setFeedback({type:'success',text:'Department updated.'});
    } catch(e){setFeedback({type:'error',text:'Save error: '+(e instanceof Error?e.message:String(e))});}
    finally{setSaving(false);}
  }

  async function deleteDepartment(dept) {
    if(!window.confirm(`Delete department "${dept.name}"?`))return;
    setSaving(true);setFeedback({type:'info',text:'Deleting…'});
    try {
      const res=await fetch(`/api/admin/departments/${dept.departmentId}`,{method:'DELETE',headers:getAuthHeaders({Accept:'application/json'})});
      if(res.status===401){window.location.href='/login';return;} if(res.status===403){window.location.href='/admin/dashboard';return;}
      if(res.status===409){const p=await res.json().catch(()=>null);setFeedback({type:'error',text:p?.message||'Department is in use.'});return;}
      if(!res.ok){const p=await res.json().catch(()=>null);setFeedback({type:'error',text:p?.message||`Delete failed: ${res.status}`});return;}
      setDepartments(c=>c.filter(i=>i.departmentId!==dept.departmentId));setFeedback({type:'success',text:'Department deleted.'});
    } catch(e){setFeedback({type:'error',text:'Delete error: '+(e instanceof Error?e.message:String(e))});}
    finally{setSaving(false);}
  }

  if(!session?.token||!user)return null;

  const fb = {info:{bg:'#F0F9FF',br:'#BAE6FD',c:'#0369A1'},success:{bg:'#ECFDF5',br:'#A7F3D0',c:'#065F46'},error:{bg:'#FEF2F2',br:'#FECACA',c:'#B91C1C'}}[feedback.type]||{bg:'#F0F9FF',br:'#BAE6FD',c:'#0369A1'};

  return (
    <AdminShell activeMenu="departments">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.75rem',flexWrap:'wrap',gap:'1rem'}}>
        <div>
          <h1 style={{margin:'0 0 3px',fontSize:'1.55rem',fontWeight:800,color:C.text,letterSpacing:'-0.02em'}}>Department Management</h1>
          <p style={{margin:0,fontSize:'13px',color:C.textSub}}>Create departments, assign QA coordinators, and maintain department ownership.</p>
        </div>
        <button onClick={()=>loadData(true)} style={{padding:'0.55rem 1.1rem',border:'none',borderRadius:'8px',background:C.primary,color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:font}}>↺ Refresh</button>
      </div>

      {feedback.text&&<div style={{padding:'0.75rem 1rem',borderRadius:'10px',border:`1px solid ${fb.br}`,background:fb.bg,color:fb.c,fontSize:'13px',fontWeight:500,marginBottom:'1.25rem'}}>{feedback.text}</div>}

      {/* Stats */}
      <div style={{display:'flex',gap:'1rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        {summary.map(s=>(
          <div key={s.label} style={{...card,padding:'1.1rem',flex:1,minWidth:'150px',borderTop:`3px solid ${s.accent}`}}>
            <div style={{fontSize:'1.7rem',fontWeight:800,color:C.text,lineHeight:1}}>{loading?'…':s.value}</div>
            <div style={{fontSize:'11.5px',color:C.textSub,marginTop:'5px'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Create form */}
      <div style={{...card,marginBottom:'1.25rem'}}>
        <h2 style={{margin:'0 0 0.25rem',fontSize:'14px',fontWeight:700,color:C.text}}>Create Department</h2>
        <p style={{margin:'0 0 1rem',fontSize:'12px',color:C.textSub}}>Add a new department and optionally assign its QA coordinator.</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:'0.75rem',alignItems:'end',flexWrap:'wrap'}}>
          <div>
            <label style={{display:'block',fontSize:'11px',fontWeight:700,color:C.textSub,marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Department name</label>
            <input value={createName} onChange={e=>setCreateName(e.target.value)} placeholder="Department name" style={inp}/>
          </div>
          <div>
            <label style={{display:'block',fontSize:'11px',fontWeight:700,color:C.textSub,marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.05em'}}>QA Coordinators</label>
            <select multiple value={createQaUserIds} onChange={e=>setCreateQaUserIds(readSelected(e))} style={{...inp,minHeight:'80px',cursor:'pointer'}}>
              {qaCoordinators.map(c=><option key={c.id} value={String(c.id)}>{c.name} ({c.email})</option>)}
            </select>
            <div style={{fontSize:'10px',color:C.textMuted,marginTop:'3px'}}>Hold Ctrl/Cmd to select multiple</div>
          </div>
          <button onClick={createDepartment} disabled={saving} style={{padding:'0.6rem 1.1rem',border:'none',borderRadius:'8px',background:C.primary,color:'#fff',fontSize:'13px',fontWeight:600,cursor:saving?'not-allowed':'pointer',fontFamily:font,height:'38px',whiteSpace:'nowrap'}}>
            {saving?'…':'Create department'}
          </button>
        </div>
      </div>

      {/* Dept table */}
      <div style={{...card}}>
        <div style={{display:'flex',gap:'0.75rem',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap'}}>
          <div style={{position:'relative',flex:1,minWidth:'200px'}}>
            <span style={{position:'absolute',left:'0.75rem',top:'50%',transform:'translateY(-50%)',color:C.textMuted,fontSize:'13px'}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find by department or coordinator…" style={{...inp,paddingLeft:'2.1rem',background:'#F8FAFC',width:'100%',boxSizing:'border-box'}}/>
          </div>
          <span style={{fontSize:'12px',color:C.textMuted,fontWeight:600}}>{filteredDepts.length} of {departments.length} departments</span>
        </div>

        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13.5px',minWidth:'700px'}}>
            <thead>
              <tr style={{background:'#F8FAFC'}}>
                {['Department','Coordinator','Assignment','Actions'].map(h=>(
                  <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:'11px',fontWeight:700,color:C.textMuted,textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:`2px solid ${C.border}`,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDepts.map((row,idx)=>{
                const editing=editingDepartmentId===row.departmentId;
                const coordinatorNames=Array.isArray(row.qaCoordinators)&&row.qaCoordinators.length>0?row.qaCoordinators.map(c=>c.name).join(', '):'No coordinator assigned';
                const isAssigned=Array.isArray(row.qaCoordinators)&&row.qaCoordinators.length>0;
                return (
                  <tr key={row.departmentId} style={{background:idx%2===0?'#fff':'#FAFBFF'}}>
                    <td style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle'}}>
                      {editing?<input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={{...inp,width:'200px'}}/> : (
                        <div>
                          <div style={{fontWeight:700,color:C.text}}>{row.name}</div>
                          <div style={{fontSize:'11px',color:C.textMuted}}>ID: {row.departmentId}</div>
                        </div>
                      )}
                    </td>
                    <td style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle'}}>
                      {editing?(
                        <select multiple value={form.qaCoordinatorUserIds} onChange={e=>setForm(p=>({...p,qaCoordinatorUserIds:readSelected(e)}))} style={{...inp,minHeight:'72px',cursor:'pointer',width:'220px'}}>
                          {qaCoordinators.map(c=><option key={c.id} value={String(c.id)}>{c.name}</option>)}
                        </select>
                      ):<span style={{fontSize:'13px',color:isAssigned?C.text:C.textMuted}}>{coordinatorNames}</span>}
                    </td>
                    <td style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle'}}>
                      <span style={{display:'inline-block',padding:'2px 9px',borderRadius:'999px',fontSize:'11.5px',fontWeight:700,background:isAssigned?'#D1FAE5':'#FEF3C7',color:isAssigned?'#065F46':'#92400E'}}>{isAssigned?'Assigned':'Unassigned'}</span>
                    </td>
                    <td style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle'}}>
                      <div style={{display:'flex',gap:'6px'}}>
                        {!editing&&<button onClick={()=>beginEdit(row)} style={{padding:'5px 12px',border:'none',borderRadius:'6px',background:'#DBEAFE',color:'#1E40AF',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:font}}>Edit</button>}
                        {editing&&<>
                          <button onClick={saveEdit} disabled={saving} style={{padding:'5px 12px',border:'none',borderRadius:'6px',background:C.primary,color:'#fff',fontSize:'12px',fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:font}}>Save</button>
                          <button onClick={cancelEdit} style={{padding:'5px 12px',border:`1px solid ${C.border}`,borderRadius:'6px',background:'#fff',color:C.textSub,fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:font}}>Cancel</button>
                        </>}
                        {!editing&&<button onClick={()=>deleteDepartment(row)} disabled={saving} style={{padding:'5px 12px',border:'none',borderRadius:'6px',background:'#FEE2E2',color:'#991B1B',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:font}}>Delete</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading&&filteredDepts.length===0&&<tr><td colSpan={4} style={{padding:'2rem',textAlign:'center',color:C.textMuted,fontSize:'13px'}}>No departments found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

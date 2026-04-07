import { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders, getAuthSession, roleToPath } from './authStorage';
import AdminShell from './AdminShell';

function fmtDT(v) { return v ? new Date(v).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'; }
function toLocal(v) { if(!v)return''; const d=new Date(v); return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,16); }

const inp = { width:'100%',boxSizing:'border-box',padding:'0.5rem 0.7rem',borderRadius:'7px',border:`1.5px solid ${C.border}`,fontSize:'13px',color:C.text,fontFamily:font,outline:'none' };
const btnPrimary = {padding:'0.55rem 1rem',border:'none',borderRadius:'7px',background:C.primary,color:'#fff',fontSize:'12.5px',fontWeight:600,cursor:'pointer',fontFamily:font};
const btnSecondary = {padding:'0.55rem 1rem',border:`1px solid ${C.border}`,borderRadius:'7px',background:'#fff',color:C.textSub,fontSize:'12.5px',fontWeight:600,cursor:'pointer',fontFamily:font};
const btnDanger = {padding:'4px 10px',border:'none',borderRadius:'6px',background:'#FEE2E2',color:'#991B1B',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:font};

const emptyCP = {academicYearId:'',title:'',ideaStartAt:'',ideaEndAt:'',commentEndAt:''};

export default function AdminClosureManagementPage() {
  const session = useMemo(()=>getAuthSession(),[]);
  const user = session?.user;
  const [academicYears,setAcademicYears]=useState([]);
  const [closurePeriods,setClosurePeriods]=useState([]);
  const [message,setMessage]=useState('Loading…');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [newAcademicYearName,setNewAcademicYearName]=useState('');
  const [editingAYId,setEditingAYId]=useState(0);
  const [editingAYName,setEditingAYName]=useState('');
  const [newCP,setNewCP]=useState(emptyCP);
  const [editingCPId,setEditingCPId]=useState(0);
  const [editingCP,setEditingCP]=useState(emptyCP);

  async function loadData(msg='') {
    setLoading(true);
    try {
      const [ar,cr]=await Promise.all([fetch('/api/admin/academic-years',{headers:getAuthHeaders({Accept:'application/json'})}),fetch('/api/admin/closure-periods',{headers:getAuthHeaders({Accept:'application/json'})})]);
      if(ar.status===401||cr.status===401){window.location.href='/login';return;}
      if(ar.status===403||cr.status===403){window.location.href='/admin/dashboard';return;}
      if(!ar.ok||!cr.ok){setMessage(`Load failed`);return;}
      setAcademicYears(await ar.json().then(d=>Array.isArray(d)?d:[]));
      setClosurePeriods(await cr.json().then(d=>Array.isArray(d)?d:[]));
      setMessage(msg);
    } catch(e){setMessage('Load error: '+(e instanceof Error?e.message:String(e)));}
    finally{setLoading(false);}
  }

  useEffect(()=>{ if(!session?.token||!user){window.location.href='/login';return;} if(user.role!=='ADMIN'){window.location.href=roleToPath(user.role);return;} loadData(); },[session,user]);

  async function createAcademicYear() {
    if(!newAcademicYearName.trim()){setMessage('Academic year name is required.');return;}
    setSaving(true);setMessage('Creating…');
    try {
      const res=await fetch('/api/admin/academic-years',{method:'POST',headers:getAuthHeaders({'Content-Type':'application/json',Accept:'application/json'}),body:JSON.stringify({yearName:newAcademicYearName.trim()})});
      if(res.status===401){window.location.href='/login';return;}
      const p=await res.json().catch(()=>null);
      if(!res.ok){setMessage(p?.message||`Create failed: ${res.status}`);return;}
      setNewAcademicYearName('');await loadData('Academic year created.');
    }catch(e){setMessage('Error: '+(e instanceof Error?e.message:String(e)));}
    finally{setSaving(false);}
  }

  async function saveAcademicYear(id) {
    if(!editingAYName.trim()){setMessage('Name is required.');return;}
    setSaving(true);setMessage('Saving…');
    try {
      const res=await fetch(`/api/admin/academic-years/${id}`,{method:'PUT',headers:getAuthHeaders({'Content-Type':'application/json',Accept:'application/json'}),body:JSON.stringify({yearName:editingAYName.trim()})});
      if(res.status===401){window.location.href='/login';return;}
      const p=await res.json().catch(()=>null);
      if(!res.ok){setMessage(p?.message||`Save failed: ${res.status}`);return;}
      setEditingAYId(0);setEditingAYName('');await loadData('Academic year updated.');
    }catch(e){setMessage('Error: '+(e instanceof Error?e.message:String(e)));}
    finally{setSaving(false);}
  }

  async function deleteAcademicYear(ay) {
    if(!window.confirm(`Delete "${ay.yearName}"?`))return;
    setSaving(true);setMessage('Deleting…');
    try {
      const res=await fetch(`/api/admin/academic-years/${ay.academicYearId}`,{method:'DELETE',headers:getAuthHeaders({Accept:'application/json'})});
      if(res.status===401){window.location.href='/login';return;}
      const p=await res.json().catch(()=>null);
      if(!res.ok){setMessage(p?.message||`Delete failed: ${res.status}`);return;}
      await loadData('Academic year deleted.');
    }catch(e){setMessage('Error: '+(e instanceof Error?e.message:String(e)));}
    finally{setSaving(false);}
  }

  async function createClosurePeriod() {
    if(!newCP.academicYearId||!newCP.title.trim()||!newCP.ideaStartAt||!newCP.ideaEndAt||!newCP.commentEndAt){setMessage('All closure period fields are required.');return;}
    setSaving(true);setMessage('Creating…');
    try {
      const res=await fetch('/api/admin/closure-periods',{method:'POST',headers:getAuthHeaders({'Content-Type':'application/json',Accept:'application/json'}),body:JSON.stringify({academicYearId:Number(newCP.academicYearId),title:newCP.title.trim(),ideaStartAt:newCP.ideaStartAt,ideaEndAt:newCP.ideaEndAt,commentEndAt:newCP.commentEndAt})});
      if(res.status===401){window.location.href='/login';return;}
      const p=await res.json().catch(()=>null);
      if(!res.ok){setMessage(p?.message||`Create failed: ${res.status}`);return;}
      setNewCP(emptyCP);await loadData('Closure period created.');
    }catch(e){setMessage('Error: '+(e instanceof Error?e.message:String(e)));}
    finally{setSaving(false);}
  }

  async function saveClosurePeriod(id) {
    if(!editingCP.academicYearId||!editingCP.title.trim()||!editingCP.ideaStartAt||!editingCP.ideaEndAt||!editingCP.commentEndAt){setMessage('All fields are required.');return;}
    setSaving(true);setMessage('Saving…');
    try {
      const res=await fetch(`/api/admin/closure-periods/${id}`,{method:'PUT',headers:getAuthHeaders({'Content-Type':'application/json',Accept:'application/json'}),body:JSON.stringify({academicYearId:Number(editingCP.academicYearId),title:editingCP.title.trim(),ideaStartAt:editingCP.ideaStartAt,ideaEndAt:editingCP.ideaEndAt,commentEndAt:editingCP.commentEndAt})});
      if(res.status===401){window.location.href='/login';return;}
      const p=await res.json().catch(()=>null);
      if(!res.ok){setMessage(p?.message||`Save failed: ${res.status}`);return;}
      setEditingCPId(0);setEditingCP(emptyCP);await loadData('Closure period updated.');
    }catch(e){setMessage('Error: '+(e instanceof Error?e.message:String(e)));}
    finally{setSaving(false);}
  }

  async function deleteClosurePeriod(cp) {
    if(!window.confirm(`Delete "${cp.title}"?`))return;
    setSaving(true);setMessage('Deleting…');
    try {
      const res=await fetch(`/api/admin/closure-periods/${cp.closurePeriodId}`,{method:'DELETE',headers:getAuthHeaders({Accept:'application/json'})});
      if(res.status===401){window.location.href='/login';return;}
      const p=await res.json().catch(()=>null);
      if(!res.ok){setMessage(p?.message||`Delete failed: ${res.status}`);return;}
      await loadData('Closure period deleted.');
    }catch(e){setMessage('Error: '+(e instanceof Error?e.message:String(e)));}
    finally{setSaving(false);}
  }

  if(!session?.token||!user)return null;

  const msgIsErr = message&&!message.includes('…')&&!message.includes('created')&&!message.includes('updated')&&!message.includes('deleted');
  const msgIsOk = message&&(message.includes('created')||message.includes('updated')||message.includes('deleted'));

  return (
    <AdminShell activeMenu="closure-periods">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.75rem',flexWrap:'wrap',gap:'1rem'}}>
        <div>
          <h1 style={{margin:'0 0 3px',fontSize:'1.55rem',fontWeight:800,color:C.text,letterSpacing:'-0.02em'}}>Closure Date Management</h1>
          <p style={{margin:0,fontSize:'13px',color:C.textSub}}>Manage academic years and closure periods for idea submission and commenting.</p>
        </div>
        <button onClick={()=>loadData('Data refreshed.')} disabled={loading||saving} style={btnPrimary}>↺ Refresh</button>
      </div>

      {message&&<div style={{padding:'0.75rem 1rem',borderRadius:'10px',border:`1px solid ${msgIsErr?'#FECACA':msgIsOk?'#A7F3D0':'#BAE6FD'}`,background:msgIsErr?'#FEF2F2':msgIsOk?'#ECFDF5':'#F0F9FF',color:msgIsErr?'#B91C1C':msgIsOk?'#065F46':'#0369A1',fontSize:'13px',fontWeight:500,marginBottom:'1.25rem'}}>{message}</div>}

      {/* ── Academic Years ── */}
      <div style={{...card,marginBottom:'1.25rem'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.1rem',flexWrap:'wrap',gap:'0.75rem'}}>
          <h2 style={{margin:0,fontSize:'14px',fontWeight:700,color:C.text}}>📚 Academic Years</h2>
          <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
            <input value={newAcademicYearName} onChange={e=>setNewAcademicYearName(e.target.value)} placeholder="e.g. 2025–2026" disabled={saving} style={{...inp,width:'180px'}}/>
            <button onClick={createAcademicYear} disabled={saving} style={btnPrimary}>+ Create</button>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px',minWidth:'400px'}}>
            <thead>
              <tr style={{background:'#F8FAFC'}}>
                {['Name','Closure Periods','Actions'].map(h=><th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:'10.5px',fontWeight:700,color:C.textMuted,textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:`2px solid ${C.border}`}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {academicYears.map((ay,i)=>(
                <tr key={ay.academicYearId} style={{background:i%2===0?'#fff':'#FAFBFF'}}>
                  <td style={{padding:'10px 12px',borderBottom:`1px solid ${C.border}`}}>
                    {editingAYId===ay.academicYearId
                      ?<input value={editingAYName} onChange={e=>setEditingAYName(e.target.value)} disabled={saving} style={{...inp,width:'200px'}}/>
                      :<span style={{fontWeight:600,color:C.text}}>{ay.yearName}</span>}
                  </td>
                  <td style={{padding:'10px 12px',borderBottom:`1px solid ${C.border}`}}>
                    <span style={{display:'inline-block',padding:'2px 9px',borderRadius:'999px',fontSize:'11.5px',fontWeight:700,background:'#EEF2FF',color:'#3730A3'}}>{ay.closurePeriodCount}</span>
                  </td>
                  <td style={{padding:'10px 12px',borderBottom:`1px solid ${C.border}`}}>
                    <div style={{display:'flex',gap:'6px'}}>
                      {editingAYId===ay.academicYearId
                        ?<><button onClick={()=>saveAcademicYear(ay.academicYearId)} disabled={saving} style={{...btnPrimary,padding:'4px 10px',fontSize:'12px'}}>Save</button><button onClick={()=>{setEditingAYId(0);setEditingAYName('');}} style={{...btnSecondary,padding:'4px 10px',fontSize:'12px'}}>Cancel</button></>
                        :<><button onClick={()=>{setEditingAYId(ay.academicYearId);setEditingAYName(ay.yearName);}} style={{padding:'4px 10px',border:'none',borderRadius:'6px',background:'#DBEAFE',color:'#1E40AF',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:font}}>Edit</button><button onClick={()=>deleteAcademicYear(ay)} disabled={saving} style={btnDanger}>Delete</button></>}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading&&academicYears.length===0&&<tr><td colSpan={3} style={{padding:'1.5rem',textAlign:'center',color:C.textMuted,fontSize:'13px'}}>No academic years yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Closure Periods ── */}
      <div style={{...card}}>
        <h2 style={{margin:'0 0 1rem',fontSize:'14px',fontWeight:700,color:C.text}}>📅 Closure Periods</h2>
        {/* Create form */}
        <div style={{background:'#F8FAFC',borderRadius:'10px',padding:'1rem',border:`1px solid ${C.border}`,marginBottom:'1.1rem'}}>
          <p style={{margin:'0 0 0.75rem',fontSize:'12px',fontWeight:600,color:C.textSub}}>Create new closure period</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'0.6rem',alignItems:'end'}}>
            <div>
              <label style={{display:'block',fontSize:'10px',fontWeight:700,color:C.textMuted,marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Academic Year</label>
              <select value={newCP.academicYearId} onChange={e=>setNewCP(p=>({...p,academicYearId:e.target.value}))} disabled={saving} style={{...inp,cursor:'pointer'}}>
                <option value="">Select year</option>
                {academicYears.map(ay=><option key={ay.academicYearId} value={ay.academicYearId}>{ay.yearName}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:'block',fontSize:'10px',fontWeight:700,color:C.textMuted,marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Title</label>
              <input value={newCP.title} onChange={e=>setNewCP(p=>({...p,title:e.target.value}))} placeholder="Period title" disabled={saving} style={inp}/>
            </div>
            <div>
              <label style={{display:'block',fontSize:'10px',fontWeight:700,color:C.textMuted,marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Idea Start</label>
              <input type="datetime-local" value={newCP.ideaStartAt} onChange={e=>setNewCP(p=>({...p,ideaStartAt:e.target.value}))} disabled={saving} style={inp}/>
            </div>
            <div>
              <label style={{display:'block',fontSize:'10px',fontWeight:700,color:C.textMuted,marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Idea End</label>
              <input type="datetime-local" value={newCP.ideaEndAt} onChange={e=>setNewCP(p=>({...p,ideaEndAt:e.target.value}))} disabled={saving} style={inp}/>
            </div>
            <div>
              <label style={{display:'block',fontSize:'10px',fontWeight:700,color:C.textMuted,marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Comment End</label>
              <input type="datetime-local" value={newCP.commentEndAt} onChange={e=>setNewCP(p=>({...p,commentEndAt:e.target.value}))} disabled={saving} style={inp}/>
            </div>
            <div style={{display:'flex',alignItems:'flex-end'}}>
              <button onClick={createClosurePeriod} disabled={saving} style={{...btnPrimary,width:'100%',whiteSpace:'nowrap'}}>+ Create period</button>
            </div>
          </div>
        </div>

        {/* Periods table */}
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12.5px',minWidth:'900px'}}>
            <thead>
              <tr style={{background:'#F8FAFC'}}>
                {['Academic Year','Title','Idea Start','Idea End','Comment End','Ideas','Actions'].map(h=><th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:'10.5px',fontWeight:700,color:C.textMuted,textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:`2px solid ${C.border}`,whiteSpace:'nowrap'}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {closurePeriods.map((cp,i)=>{
                const editing=editingCPId===cp.closurePeriodId;
                return (
                  <tr key={cp.closurePeriodId} style={{background:i%2===0?'#fff':'#FAFBFF'}}>
                    <td style={{padding:'10px 12px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle'}}>
                      {editing?<select value={editingCP.academicYearId} onChange={e=>setEditingCP(p=>({...p,academicYearId:e.target.value}))} disabled={saving} style={{...inp,width:'130px',cursor:'pointer'}}><option value="">Year</option>{academicYears.map(ay=><option key={ay.academicYearId} value={ay.academicYearId}>{ay.yearName}</option>)}</select>:<span style={{fontWeight:600}}>{cp.academicYearName}</span>}
                    </td>
                    <td style={{padding:'10px 12px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle'}}>
                      {editing?<input value={editingCP.title} onChange={e=>setEditingCP(p=>({...p,title:e.target.value}))} disabled={saving} style={{...inp,width:'150px'}}/>:<span>{cp.title}</span>}
                    </td>
                    <td style={{padding:'10px 12px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle',whiteSpace:'nowrap',fontSize:'11.5px',color:C.textSub}}>
                      {editing?<input type="datetime-local" value={editingCP.ideaStartAt} onChange={e=>setEditingCP(p=>({...p,ideaStartAt:e.target.value}))} disabled={saving} style={{...inp,width:'160px'}}/>:fmtDT(cp.ideaStartAt)}
                    </td>
                    <td style={{padding:'10px 12px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle',whiteSpace:'nowrap',fontSize:'11.5px',color:C.textSub}}>
                      {editing?<input type="datetime-local" value={editingCP.ideaEndAt} onChange={e=>setEditingCP(p=>({...p,ideaEndAt:e.target.value}))} disabled={saving} style={{...inp,width:'160px'}}/>:fmtDT(cp.ideaEndAt)}
                    </td>
                    <td style={{padding:'10px 12px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle',whiteSpace:'nowrap',fontSize:'11.5px',color:C.textSub}}>
                      {editing?<input type="datetime-local" value={editingCP.commentEndAt} onChange={e=>setEditingCP(p=>({...p,commentEndAt:e.target.value}))} disabled={saving} style={{...inp,width:'160px'}}/>:fmtDT(cp.commentEndAt)}
                    </td>
                    <td style={{padding:'10px 12px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle',textAlign:'center'}}>
                      <span style={{fontWeight:700,color:C.primary}}>{cp.ideaCount}</span>
                    </td>
                    <td style={{padding:'10px 12px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle'}}>
                      <div style={{display:'flex',gap:'5px'}}>
                        {editing
                          ?<><button onClick={()=>saveClosurePeriod(cp.closurePeriodId)} disabled={saving} style={{...btnPrimary,padding:'4px 10px',fontSize:'12px'}}>Save</button><button onClick={()=>{setEditingCPId(0);setEditingCP(emptyCP);}} style={{...btnSecondary,padding:'4px 10px',fontSize:'12px'}}>Cancel</button></>
                          :<><button onClick={()=>{setEditingCPId(cp.closurePeriodId);setEditingCP({academicYearId:String(cp.academicYearId),title:cp.title,ideaStartAt:toLocal(cp.ideaStartAt),ideaEndAt:toLocal(cp.ideaEndAt),commentEndAt:toLocal(cp.commentEndAt)});}} style={{padding:'4px 10px',border:'none',borderRadius:'6px',background:'#DBEAFE',color:'#1E40AF',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:font}}>Edit</button><button onClick={()=>deleteClosurePeriod(cp)} disabled={saving} style={btnDanger}>Delete</button></>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading&&closurePeriods.length===0&&<tr><td colSpan={7} style={{padding:'1.5rem',textAlign:'center',color:C.textMuted,fontSize:'13px'}}>No closure periods yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

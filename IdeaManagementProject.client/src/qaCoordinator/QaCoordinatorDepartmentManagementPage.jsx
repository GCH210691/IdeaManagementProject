import { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders, getAuthSession, roleToPath } from '../shared/authStorage';
import StaffShell from '../shells/StaffShell';

export default function QaCoordinatorDepartmentManagementPage() {
  const session = useMemo(()=>getAuthSession(),[]);
  const user = session?.user;
  const [departmentId,setDepartmentId]=useState(0);
  const [departmentName,setDepartmentName]=useState('');
  const [departmentStaff,setDepartmentStaff]=useState([]);
  const [availableStaff,setAvailableStaff]=useState([]);
  const [message,setMessage]=useState('Loading…');
  const [loading,setLoading]=useState(true);
  const [savingUserId,setSavingUserId]=useState(0);

  async function loadData(msg='') {
    setLoading(true);
    try {
      const res=await fetch('/api/qa-coordinator/department-management',{headers:getAuthHeaders({Accept:'application/json'})});
      if(res.status===401){window.location.href='/login';return;}
      if(res.status===403){window.location.href=roleToPath(user?.role);return;}
      if(!res.ok){setMessage(`Load failed: ${res.status}`);return;}
      const p=await res.json();
      setDepartmentId(Number(p.departmentId||0));setDepartmentName(String(p.departmentName||''));
      setDepartmentStaff(Array.isArray(p.departmentStaff)?p.departmentStaff:[]);
      setAvailableStaff(Array.isArray(p.availableStaff)?p.availableStaff:[]);
      setMessage(msg);
    }catch(e){setMessage('Error: '+(e instanceof Error?e.message:String(e)));}
    finally{setLoading(false);}
  }

  useEffect(()=>{
    if(!session?.token||!user){window.location.href='/login';return;}
    if(user.role!=='QA_COORDINATOR'){window.location.href=roleToPath(user.role);return;}
    loadData();
  },[session,user]);

  async function assign(staff) {
    if(!departmentId){setMessage('Your department is not available.');return;}
    setSavingUserId(staff.id);setMessage('');
    try {
      const res=await fetch(`/api/qa-coordinator/department-management/staff/${staff.id}/department`,{method:'PUT',headers:getAuthHeaders({'Content-Type':'application/json',Accept:'application/json'}),body:JSON.stringify({departmentId})});
      if(res.status===401){window.location.href='/login';return;}
      if(!res.ok){const p=await res.json().catch(()=>null);setMessage(p?.message||`Failed: ${res.status}`);return;}
      await loadData(`${staff.name} assigned to ${departmentName}.`);
    }catch(e){setMessage('Error: '+(e instanceof Error?e.message:String(e)));}
    finally{setSavingUserId(0);}
  }

  async function unassign(staff) {
    setSavingUserId(staff.id);setMessage('');
    try {
      const res=await fetch(`/api/qa-coordinator/department-management/staff/${staff.id}/department`,{method:'PUT',headers:getAuthHeaders({'Content-Type':'application/json',Accept:'application/json'}),body:JSON.stringify({departmentId:null})});
      if(res.status===401){window.location.href='/login';return;}
      if(!res.ok){const p=await res.json().catch(()=>null);setMessage(p?.message||`Failed: ${res.status}`);return;}
      await loadData(`${staff.name} removed from ${departmentName}.`);
    }catch(e){setMessage('Error: '+(e instanceof Error?e.message:String(e)));}
    finally{setSavingUserId(0);}
  }

  if(!session?.token||!user)return null;

  return (
    <StaffShell activeMenu="department-management">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.75rem',flexWrap:'wrap',gap:'1rem'}}>
        <div>
          <h1 style={{margin:'0 0 4px',fontSize:'1.55rem',fontWeight:800,color:C.text,letterSpacing:'-0.02em'}}>Department Management</h1>
          <p style={{margin:0,fontSize:'13px',color:C.textSub}}>Assign and remove staff from <strong>{departmentName||'your department'}</strong>.</p>
        </div>
        <button onClick={()=>loadData()} style={{padding:'0.55rem 1rem',border:`1px solid ${C.border}`,borderRadius:'8px',background:'#fff',color:C.textSub,fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:font}}>↺ Refresh</button>
      </div>

      {message&&<div style={{padding:'0.75rem 1rem',borderRadius:'10px',border:'1px solid #A7F3D0',background:'#ECFDF5',color:'#065F46',fontSize:'13px',marginBottom:'1.25rem'}}>{message}</div>}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem'}}>
        <div style={{...card}}>
          <h2 style={{margin:'0 0 1rem',fontSize:'13.5px',fontWeight:700,color:C.text}}>👥 Department Staff ({departmentStaff.length})</h2>
          {loading?<p style={{color:C.textMuted,fontSize:'13px'}}>Loading…</p>:departmentStaff.length===0
            ?<p style={{color:C.textMuted,fontSize:'13px'}}>No staff assigned yet.</p>
            :departmentStaff.map(s=>(
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'9px',background:'#F8FAFC',marginBottom:'6px',border:`1px solid ${C.border}`}}>
                <div style={{width:'32px',height:'32px',borderRadius:'50%',background:`linear-gradient(135deg,${C.primary},#818CF8)`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <span style={{color:'#fff',fontWeight:700,fontSize:'11px'}}>{(s.name||'U').slice(0,1).toUpperCase()}</span>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:'13px',color:C.text}}>{s.name}</div>
                  <div style={{fontSize:'11px',color:C.textMuted}}>{s.email}</div>
                </div>
                <button onClick={()=>unassign(s)} disabled={savingUserId===s.id} style={{padding:'4px 10px',border:'none',borderRadius:'6px',background:C.dangerLt,color:C.dangerDk,fontSize:'11.5px',fontWeight:700,cursor:'pointer',fontFamily:font}}>{savingUserId===s.id?'…':'Remove'}</button>
              </div>
            ))
          }
        </div>

        <div style={{...card}}>
          <h2 style={{margin:'0 0 1rem',fontSize:'13.5px',fontWeight:700,color:C.text}}>🔍 Available Staff ({availableStaff.length})</h2>
          {loading?<p style={{color:C.textMuted,fontSize:'13px'}}>Loading…</p>:availableStaff.length===0
            ?<p style={{color:C.textMuted,fontSize:'13px'}}>No unassigned staff available.</p>
            :availableStaff.map(s=>(
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'9px',background:'#F8FAFC',marginBottom:'6px',border:`1px solid ${C.border}`}}>
                <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'linear-gradient(135deg,#94A3B8,#CBD5E1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <span style={{color:'#fff',fontWeight:700,fontSize:'11px'}}>{(s.name||'U').slice(0,1).toUpperCase()}</span>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:'13px',color:C.text}}>{s.name}</div>
                  <div style={{fontSize:'11px',color:C.textMuted}}>{s.email}</div>
                </div>
                <button onClick={()=>assign(s)} disabled={savingUserId===s.id} style={{padding:'4px 10px',border:'none',borderRadius:'6px',background:C.successLt,color:C.successDk,fontSize:'11.5px',fontWeight:700,cursor:'pointer',fontFamily:font}}>{savingUserId===s.id?'…':'Assign'}</button>
              </div>
            ))
          }
        </div>
      </div>
    </StaffShell>
  );
}

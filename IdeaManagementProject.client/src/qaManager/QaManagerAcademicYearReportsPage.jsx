import { useEffect, useMemo, useState } from 'react';
import { canViewAcademicYearReports, getAuthHeaders, getAuthSession, roleToPath } from '../shared/authStorage';
import StaffShell from '../shells/StaffShell';

function formatRole(r) { return String(r||'').toLowerCase().split('_').filter(Boolean).map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join(' '); }
function fmtDT(v) { return v?new Date(v).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):''; }

const th = {padding:'10px 14px',textAlign:'left',fontSize:'11px',fontWeight:700,color:C.textMuted,textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:`2px solid ${C.border}`,background:'#F8FAFC',whiteSpace:'nowrap'};
const td = {padding:'11px 14px',borderBottom:`1px solid ${C.border}`,verticalAlign:'top',fontSize:'12.5px',color:C.text};
const inp = {padding:'0.55rem 0.75rem',borderRadius:'7px',border:`1.5px solid ${C.border}`,fontSize:'13px',color:C.text,fontFamily:font,outline:'none',background:'#fff',cursor:'pointer'};

export default function QaManagerAcademicYearReportsPage() {
  const session = useMemo(()=>getAuthSession(),[]);
  const user = session?.user;
  const [academicYears,setAcademicYears]=useState([]);
  const [selectedId,setSelectedId]=useState('');
  const [report,setReport]=useState(null);
  const [message,setMessage]=useState('Loading…');
  const [loading,setLoading]=useState(true);

  async function loadAcademicYears(preferred='') {
    try {
      const res=await fetch('/api/qa-manager/academic-year-reports/academic-years',{headers:getAuthHeaders({Accept:'application/json'})});
      if(res.status===401){window.location.href='/login';return;}
      if(res.status===403){window.location.href=roleToPath(user?.role);return;}
      if(!res.ok){setMessage(`Load failed: ${res.status}`);return;}
      const data=await res.json();
      const nextYears=Array.isArray(data)?data:[];
      setAcademicYears(nextYears);
      const nextId=preferred||String(nextYears[0]?.academicYearId||'');
      setSelectedId(nextId);
      if(nextId)await loadReport(nextId,false);
      else{setReport(null);setMessage('No academic years available.');}
    }catch(e){setMessage('Error: '+(e instanceof Error?e.message:String(e)));}
    finally{setLoading(false);}
  }

  async function loadReport(id,showMsg=true) {
    if(!id){setReport(null);setMessage('Select an academic year.');return;}
    setLoading(true);
    try {
      const res=await fetch(`/api/qa-manager/academic-year-reports/${id}`,{headers:getAuthHeaders({Accept:'application/json'})});
      if(res.status===401){window.location.href='/login';return;}
      if(res.status===403){window.location.href=roleToPath(user?.role);return;}
      if(res.status===404){setReport(null);setMessage('Academic year not found.');return;}
      if(!res.ok){setReport(null);setMessage(`Load failed: ${res.status}`);return;}
      const data=await res.json();
      setReport(data);setMessage(showMsg?'Report loaded.':'');
    }catch(e){setReport(null);setMessage('Error: '+(e instanceof Error?e.message:String(e)));}
    finally{setLoading(false);}
  }

  useEffect(()=>{
    if(!session?.token||!user){window.location.href='/login';return;}
    if(!canViewAcademicYearReports(user)){window.location.href=roleToPath(user.role);return;}
    loadAcademicYears();
  },[session,user]);

  if(!session?.token||!user)return null;

  const ideas=Array.isArray(report?.ideas)?report.ideas:[];
  const comments=Array.isArray(report?.comments)?report.comments:[];

  return (
    <StaffShell activeMenu="academic-year-reports" footerText="Academic year reports">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.75rem',flexWrap:'wrap',gap:'1rem'}}>
        <div>
          <h1 style={{margin:'0 0 4px',fontSize:'1.55rem',fontWeight:800,color:C.text,letterSpacing:'-0.02em'}}>Academic Year Reports</h1>
          <p style={{margin:0,fontSize:'13px',color:C.textSub}}>View ideas and comments filtered by academic year.</p>
        </div>
        <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
          <select value={selectedId} onChange={e=>{setSelectedId(e.target.value);loadReport(e.target.value);}} disabled={loading} style={inp}>
            <option value="">Select academic year</option>
            {academicYears.map(ay=><option key={ay.academicYearId} value={ay.academicYearId}>{ay.yearName}</option>)}
          </select>
          <button onClick={()=>loadAcademicYears(selectedId)} disabled={loading} style={{padding:'0.55rem 1rem',border:'none',borderRadius:'7px',background:C.primary,color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:font}}>↺ Refresh</button>
        </div>
      </div>

      {message&&<div style={{padding:'0.75rem 1rem',borderRadius:'10px',border:'1px solid #BAE6FD',background:'#F0F9FF',color:'#0369A1',fontSize:'13px',marginBottom:'1.25rem'}}>{message}</div>}

      {report&&(<>
        {/* Stats */}
        <div style={{display:'flex',gap:'1rem',marginBottom:'1.25rem',flexWrap:'wrap'}}>
          {[
            {label:'Academic year',value:report.academicYearName,accent:'#6366F1'},
            {label:'Total ideas',value:ideas.length,accent:'#10B981'},
            {label:'Total comments',value:comments.length,accent:'#F59E0B'},
            {label:'Upvotes',value:ideas.reduce((s,i)=>s+(i.upvoteCount||0),0),accent:'#06B6D4'},
          ].map(s=>(
            <div key={s.label} style={{...card,padding:'1.1rem',flex:1,minWidth:'140px',borderTop:`3px solid ${s.accent}`}}>
              <div style={{fontSize:'1.55rem',fontWeight:800,color:C.text,lineHeight:1}}>{s.value}</div>
              <div style={{fontSize:'11.5px',color:C.textSub,marginTop:'5px'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Ideas table */}
        <div style={{...card,marginBottom:'1.25rem'}}>
          <h2 style={{margin:'0 0 1rem',fontSize:'13.5px',fontWeight:700,color:C.text}}>💡 Ideas ({ideas.length})</h2>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12.5px',minWidth:'800px'}}>
              <thead>
                <tr>{['Title','Author','Department','Period','💬','👍/👎','Created'].map(h=><th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {ideas.map((idea,i)=>(
                  <tr key={idea.ideaId} style={{background:i%2===0?'#fff':'#FAFBFF',cursor:'pointer'}} onClick={()=>window.location.href='/ideas/'+idea.ideaId}>
                    <td style={{...td,fontWeight:600,color:C.primary}}>{idea.title}</td>
                    <td style={td}>{idea.authorName}</td>
                    <td style={td}>{idea.departmentName}</td>
                    <td style={{...td,whiteSpace:'nowrap'}}>{idea.closurePeriodTitle}</td>
                    <td style={{...td,textAlign:'center'}}>{idea.commentCount}</td>
                    <td style={{...td,whiteSpace:'nowrap'}}><span style={{color:'#059669',fontWeight:700}}>+{idea.upvoteCount||0}</span>/<span style={{color:'#DC2626',fontWeight:700}}>-{idea.downvoteCount||0}</span></td>
                    <td style={{...td,whiteSpace:'nowrap',color:C.textSub}}>{fmtDT(idea.createdAt)}</td>
                  </tr>
                ))}
                {ideas.length===0&&<tr><td colSpan={7} style={{padding:'1.5rem',textAlign:'center',color:C.textMuted}}>No ideas for this academic year.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comments table */}
        <div style={{...card}}>
          <h2 style={{margin:'0 0 1rem',fontSize:'13.5px',fontWeight:700,color:C.text}}>💬 Comments ({comments.length})</h2>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12.5px',minWidth:'800px'}}>
              <thead>
                <tr>{['Idea','Author','Department','Period','Created','Content'].map(h=><th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {comments.map((c,i)=>(
                  <tr key={c.commentId} style={{background:i%2===0?'#fff':'#FAFBFF'}}>
                    <td style={{...td,fontWeight:600,color:C.primary,cursor:'pointer'}} onClick={()=>window.location.href='/ideas/'+c.ideaId}>{c.ideaTitle}</td>
                    <td style={td}>{c.authorName} <span style={{fontSize:'10px',padding:'1px 6px',borderRadius:'999px',background:'#EEF2FF',color:'#3730A3',fontWeight:700}}>{formatRole(c.authorRole)}</span></td>
                    <td style={td}>{c.departmentName}</td>
                    <td style={{...td,whiteSpace:'nowrap'}}>{c.closurePeriodTitle}</td>
                    <td style={{...td,whiteSpace:'nowrap',color:C.textSub}}>{fmtDT(c.createdAt)}</td>
                    <td style={{...td,maxWidth:'280px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:C.textSub}}>{c.content}</td>
                  </tr>
                ))}
                {comments.length===0&&<tr><td colSpan={6} style={{padding:'1.5rem',textAlign:'center',color:C.textMuted}}>No comments for this academic year.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </>)}
    </StaffShell>
  );
}

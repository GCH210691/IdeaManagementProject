import { useEffect, useMemo, useState } from 'react';
import { canCreateIdeas, getAuthHeaders, getAuthSession, BASE_URL } from '../shared/authStorage';
import StaffShell from '../shells/StaffShell';
import { C, card, font } from '../theme';

function toSelectedIds(opts) { return Array.from(opts).filter(o=>o.selected).map(o=>Number(o.value)); }
function fmtDT(v) { return v?new Date(v).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):''; }

function swMessage(sw) {
  if(!sw) return {text:'Loading submission window…',color:C.textSub};
  if(sw.state==='open') return {text:`✅ Submission open · closes ${fmtDT(sw.ideaEndAt)}`,color:C.successDk,bg:C.successLt};
  if(sw.state==='upcoming') return {text:`⏳ Upcoming · opens ${fmtDT(sw.ideaStartAt)}`,color:'#0369A1',bg:'#E0F2FE'};
  if(sw.state==='closed') {
    const closedAt = sw.ideaEndAt ? new Date(sw.ideaEndAt) : null;
    const isStaleData = closedAt && closedAt.getFullYear() < 2020;
    return isStaleData
      ? {text:'🔒 No active submission window. Please contact the administrator to configure one.',color:C.dangerDk,bg:C.dangerLt}
      : {text:`🔒 Submission closed · ended ${fmtDT(sw.ideaEndAt)}`,color:C.dangerDk,bg:C.dangerLt};
  }
  return {text:'🔒 No submission window configured. Please contact the administrator.',color:C.textSub,bg:'#F1F5F9'};
}

const inp = {width:'100%',boxSizing:'border-box',padding:'0.65rem 0.85rem',borderRadius:'9px',border:`1.5px solid ${C.border}`,fontSize:'14px',color:C.text,fontFamily:font,outline:'none',transition:'border-color .15s, box-shadow .15s'};
const Label = ({children}) => <label style={{display:'block',fontSize:'12px',fontWeight:600,color:C.textSub,marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>{children}</label>;

export default function CreateIdeaPage() {
  const session = useMemo(()=>getAuthSession(),[]);
  const user = session?.user;
  const [title,setTitle]=useState('');
  const [content,setContent]=useState('');
  const [isAnonymous,setIsAnonymous]=useState(false);
  const [selectedCategoryIds,setSelectedCategoryIds]=useState([]);
  const [files,setFiles]=useState([]);
  const [categories,setCategories]=useState([]);
  const [submissionWindow,setSubmissionWindow]=useState(null);
  const [message,setMessage]=useState('');
  const [submitting,setSubmitting]=useState(false);

  useEffect(()=>{
    if(!session?.token||!user){window.location.href='/login';return;}
    if(!canCreateIdeas(user)){window.location.href='/ideas';return;}
    let active=true;
    async function load() {
        try {
        const [cr, sr] = await Promise.all([fetch(`${BASE_URL}/api/categories`, { headers: getAuthHeaders({ Accept: 'application/json' }) }), fetch(`${BASE_URL}/api/ideas/submission-window`, { headers: getAuthHeaders({ Accept: 'application/json' }) })]);
        if(cr.status===401||sr.status===401){window.location.href='/login';return;}
        if(!active)return;
        setCategories(cr.ok?await cr.json().then(d=>Array.isArray(d)?d:[]):[]);
        setSubmissionWindow(sr.ok?await sr.json():null);
      }catch(e){setMessage('Load error: '+(e instanceof Error?e.message:String(e)));}
    }
    load();
    return()=>{active=false;};
  },[session,user]);

  const submissionOpen = submissionWindow?.state==='open';
  const swInfo = swMessage(submissionWindow);

  async function submit(e) {
    e.preventDefault();
    if(!submissionOpen){setMessage('No submission window is open.');return;}
    if(!title.trim()||!content.trim()){setMessage('Title and content are required.');return;}
    setSubmitting(true);setMessage('');
    try {
      const fd=new FormData();
      fd.append('title',title.trim());fd.append('content',content.trim());fd.append('isAnonymous',isAnonymous);
      selectedCategoryIds.forEach(id=>fd.append('categoryIds',id));
      files.forEach(f => fd.append('files', f));
      const res = await fetch(`${BASE_URL}/api/ideas`, { method: 'POST', headers: getAuthHeaders(), body: fd });
      if(res.status===401){window.location.href='/login';return;}
      const payload=await res.json().catch(()=>null);
      if(res.status===409){setSubmissionWindow(p=>p?{...p,state:'closed'}:p);setMessage(payload?.message||'Submission window closed.');return;}
      if(!res.ok){setMessage(payload?.message||`Failed: ${res.status}`);return;}
      window.location.href='/ideas/'+payload.ideaId;
    }catch(e){setMessage('Submit error: '+(e instanceof Error?e.message:String(e)));}
    finally{setSubmitting(false);}
  }

  if(!session?.token||!user)return null;

  return (
    <StaffShell activeMenu="create">
      <div style={{maxWidth:'1100px'}}>
        <div style={{marginBottom:'1.5rem'}}>
          <h1 style={{margin:'0 0 4px',fontSize:'1.55rem',fontWeight:800,color:C.text,letterSpacing:'-0.02em'}}>Submit an Idea</h1>
          <p style={{margin:0,fontSize:'13px',color:C.textSub}}>Share your idea with the community during the active submission window.</p>
        </div>

        {/* Submission window banner */}
        {submissionWindow && (
          <div style={{padding:'0.75rem 1rem',borderRadius:'10px',border:`1px solid ${swInfo.bg||C.border}`,background:swInfo.bg||'#F8FAFC',color:swInfo.color,fontSize:'13px',fontWeight:500,marginBottom:'1.25rem'}}>
            {swInfo.text}
          </div>
        )}

        <div style={{...card}}>
          <form onSubmit={submit}>
            {/* Title */}
            <div style={{marginBottom:'1.1rem'}}>
              <Label>Title *</Label>
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Give your idea a clear, concise title" disabled={submitting}
                style={{...inp,background:'#fff'}}
                onFocus={e=>{e.target.style.borderColor=C.primary;e.target.style.boxShadow=`0 0 0 3px ${C.primaryLt}`;}}
                onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
            </div>

            {/* Content */}
            <div style={{marginBottom:'1.1rem'}}>
              <Label>Content *</Label>
              <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Describe your idea in detail…" disabled={submitting} rows={6}
                style={{...inp,minHeight:'150px',resize:'vertical',background:'#fff',lineHeight:1.65}}
                onFocus={e=>{e.target.style.borderColor=C.primary;e.target.style.boxShadow=`0 0 0 3px ${C.primaryLt}`;}}
                onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
            </div>

            {/* Categories */}
            {categories.length>0 && (
              <div style={{marginBottom:'1.1rem'}}>
                <Label>Categories <span style={{fontWeight:400,textTransform:'none',fontSize:'11px',color:C.textMuted}}>(hold Ctrl/Cmd for multiple)</span></Label>
                <select multiple value={selectedCategoryIds.map(String)}
                  onChange={e=>setSelectedCategoryIds(toSelectedIds(e.target))}
                  disabled={submitting}
                  style={{...inp,minHeight:'100px',cursor:'pointer',background:'#fff'}}>
                  {categories.map(c=><option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                </select>
              </div>
            )}

            {/* Files */}
            <div style={{marginBottom:'1.1rem'}}>
              <Label>Attachments <span style={{fontWeight:400,textTransform:'none',fontSize:'11px',color:C.textMuted}}>(optional)</span></Label>
              <div style={{border:`1.5px dashed ${C.border}`,borderRadius:'9px',padding:'1.25rem',background:'#F8FAFC',textAlign:'center'}}>
                <input type="file" multiple onChange={e=>setFiles(Array.from(e.target.files||[]))} disabled={submitting}
                  style={{display:'block',margin:'0 auto',fontSize:'13px',color:C.textSub,cursor:'pointer'}}/>
                {files.length>0 && (
                  <div style={{marginTop:'0.75rem',display:'flex',flexWrap:'wrap',gap:'6px',justifyContent:'center'}}>
                    {files.map((f,i)=><span key={i} style={{fontSize:'11.5px',padding:'2px 9px',borderRadius:'999px',background:C.primaryLt,color:C.primaryDk,fontWeight:600}}>📎 {f.name}</span>)}
                  </div>
                )}
              </div>
            </div>

            {/* Anonymous toggle */}
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'1.5rem',padding:'0.75rem',borderRadius:'9px',background:'#F8FAFC',border:`1px solid ${C.border}`}}>
              <div onClick={()=>!submitting&&setIsAnonymous(!isAnonymous)}
                style={{width:'40px',height:'22px',borderRadius:'11px',background:isAnonymous?C.primary:'#CBD5E1',cursor:'pointer',position:'relative',transition:'background .2s',flexShrink:0}}>
                <div style={{position:'absolute',top:'3px',left:isAnonymous?'21px':'3px',width:'16px',height:'16px',borderRadius:'50%',background:'#fff',transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
              </div>
              <div>
                <div style={{fontSize:'13px',fontWeight:600,color:C.text}}>Post anonymously</div>
                <div style={{fontSize:'11.5px',color:C.textSub}}>Your name will be hidden from other users</div>
              </div>
            </div>

            {message && (
              <div style={{padding:'0.75rem 1rem',borderRadius:'9px',border:'1px solid #FECACA',background:'#FEF2F2',color:'#B91C1C',fontSize:'13px',marginBottom:'1rem'}}>⚠ {message}</div>
            )}

            <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end'}}>
              <button type="button" onClick={()=>window.history.back()} style={{padding:'0.65rem 1.2rem',border:`1px solid ${C.border}`,borderRadius:'9px',background:'#fff',color:C.textSub,fontSize:'13.5px',fontWeight:600,cursor:'pointer',fontFamily:font}}>Cancel</button>
              <button type="submit" disabled={submitting||!submissionOpen}
                style={{padding:'0.65rem 1.4rem',border:'none',borderRadius:'9px',background:submissionOpen?C.primary:'#CBD5E1',color:'#fff',fontSize:'13.5px',fontWeight:700,cursor:submissionOpen&&!submitting?'pointer':'not-allowed',fontFamily:font,boxShadow:submissionOpen?`0 2px 8px ${C.primary}44`:undefined}}>
                {submitting?'Submitting…':'Submit Idea →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </StaffShell>
  );
}

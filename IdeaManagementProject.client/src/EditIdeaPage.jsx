import { useEffect, useMemo, useState } from 'react';
import { canCreateIdeas, canManageIdea, getAuthHeaders, getAuthSession } from './authStorage';
import StaffShell from './StaffShell';
import { C, card, font } from './theme';

function getIdeaIdFromPath() { const m=window.location.pathname.match(/^\/ideas\/(\d+)\/edit$/i); return m?Number(m[1]):0; }
function toSelectedIds(opts) { return Array.from(opts).filter(o=>o.selected).map(o=>Number(o.value)); }

const inp = {width:'100%',boxSizing:'border-box',padding:'0.65rem 0.85rem',borderRadius:'9px',border:`1.5px solid ${C.border}`,fontSize:'14px',color:C.text,fontFamily:font,outline:'none',transition:'border-color .15s, box-shadow .15s',background:'#fff'};
const Label = ({children}) => <label style={{display:'block',fontSize:'12px',fontWeight:600,color:C.textSub,marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>{children}</label>;

export default function EditIdeaPage() {
  const session = useMemo(()=>getAuthSession(),[]);
  const user = session?.user;
  const ideaId = useMemo(()=>getIdeaIdFromPath(),[]);
  const [idea,setIdea]=useState(null);
  const [title,setTitle]=useState('');
  const [content,setContent]=useState('');
  const [isAnonymous,setIsAnonymous]=useState(false);
  const [selectedCategoryIds,setSelectedCategoryIds]=useState([]);
  const [categories,setCategories]=useState([]);
  const [message,setMessage]=useState(ideaId?'Loading…':'Invalid idea ID.');
  const [submitting,setSubmitting]=useState(false);

  useEffect(()=>{
    if(!session?.token||!user){window.location.href='/login';return;}
    if(!canCreateIdeas(user)){window.location.href='/ideas';return;}
    if(!ideaId){return;}
    let active=true;
    async function load() {
      try {
        const [ir,cr]=await Promise.all([fetch(`/api/ideas/${ideaId}`,{headers:getAuthHeaders({Accept:'application/json'})}),fetch('/api/categories',{headers:getAuthHeaders({Accept:'application/json'})})]);
        if(ir.status===401||cr.status===401){window.location.href='/login';return;}
        if(ir.status===404){setMessage('Idea not found.');return;}
        if(!ir.ok||!cr.ok){setMessage(`Load failed: ${ir.status}`);return;}
        const [ideaData,catData]=await Promise.all([ir.json(),cr.json()]);
        if(!active)return;
        if(!canManageIdea(user,ideaData)){setMessage('You can only edit your own ideas.');return;}
        setIdea(ideaData);setTitle(ideaData.title||'');setContent(ideaData.content||'');setIsAnonymous(ideaData.isAnonymous||false);
        setSelectedCategoryIds(Array.isArray(ideaData.categoryIds)?ideaData.categoryIds:[]);
        setCategories(Array.isArray(catData)?catData:[]);setMessage('');
      }catch(e){setMessage('Load error: '+(e instanceof Error?e.message:String(e)));}
    }
    load();
    return()=>{active=false;};
  },[ideaId,session,user]);

  async function submit(e) {
    e.preventDefault();
    if(!title.trim()||!content.trim()){setMessage('Title and content are required.');return;}
    setSubmitting(true);setMessage('');
    try {
      const res=await fetch(`/api/ideas/${ideaId}`,{method:'PUT',headers:getAuthHeaders({'Content-Type':'application/json',Accept:'application/json'}),body:JSON.stringify({title:title.trim(),content:content.trim(),isAnonymous,categoryIds:selectedCategoryIds})});
      if(res.status===401){window.location.href='/login';return;}
      const payload=await res.json().catch(()=>null);
      if(!res.ok){setMessage(payload?.message||`Failed: ${res.status}`);return;}
      window.location.href='/ideas/'+ideaId;
    }catch(e){setMessage('Error: '+(e instanceof Error?e.message:String(e)));}
    finally{setSubmitting(false);}
  }

  if(!session?.token||!user)return null;

  return (
    <StaffShell activeMenu="myideas">
      <div style={{maxWidth:'720px'}}>
        <div style={{marginBottom:'1.5rem'}}>
          <button onClick={()=>window.history.back()} style={{background:'none',border:'none',cursor:'pointer',color:C.textSub,fontSize:'13px',fontWeight:600,padding:'0 0 0.75rem 0',fontFamily:font,display:'flex',alignItems:'center',gap:'5px'}}>← Back</button>
          <h1 style={{margin:'0 0 4px',fontSize:'1.55rem',fontWeight:800,color:C.text,letterSpacing:'-0.02em'}}>Edit Idea</h1>
          <p style={{margin:0,fontSize:'13px',color:C.textSub}}>Update your idea's details below.</p>
        </div>

        {message&&!idea && (
          <div style={{...card,color:message.includes('Loading')?C.textSub:'#B91C1C',fontSize:'14px'}}>{message}</div>
        )}

        {idea && (
          <div style={{...card}}>
            <form onSubmit={submit}>
              <div style={{marginBottom:'1.1rem'}}>
                <Label>Title *</Label>
                <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Idea title" disabled={submitting}
                  style={inp}
                  onFocus={e=>{e.target.style.borderColor=C.primary;e.target.style.boxShadow=`0 0 0 3px ${C.primaryLt}`;}}
                  onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
              </div>
              <div style={{marginBottom:'1.1rem'}}>
                <Label>Content *</Label>
                <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Describe your idea…" rows={6} disabled={submitting}
                  style={{...inp,minHeight:'140px',resize:'vertical',lineHeight:1.65}}
                  onFocus={e=>{e.target.style.borderColor=C.primary;e.target.style.boxShadow=`0 0 0 3px ${C.primaryLt}`;}}
                  onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
              </div>
              {categories.length>0 && (
                <div style={{marginBottom:'1.1rem'}}>
                  <Label>Categories <span style={{fontWeight:400,textTransform:'none',fontSize:'11px',color:C.textMuted}}>(Ctrl/Cmd for multiple)</span></Label>
                  <select multiple value={selectedCategoryIds.map(String)}
                    onChange={e=>setSelectedCategoryIds(toSelectedIds(e.target))}
                    disabled={submitting}
                    style={{...inp,minHeight:'100px',cursor:'pointer'}}>
                    {categories.map(c=><option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {/* Anonymous toggle */}
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'1.5rem',padding:'0.75rem',borderRadius:'9px',background:'#F8FAFC',border:`1px solid ${C.border}`,cursor:'pointer'}} onClick={()=>!submitting&&setIsAnonymous(!isAnonymous)}>
                <div style={{width:'40px',height:'22px',borderRadius:'11px',background:isAnonymous?C.primary:'#CBD5E1',position:'relative',transition:'background .2s',flexShrink:0}}>
                  <div style={{position:'absolute',top:'3px',left:isAnonymous?'21px':'3px',width:'16px',height:'16px',borderRadius:'50%',background:'#fff',transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
                </div>
                <div>
                  <div style={{fontSize:'13px',fontWeight:600,color:C.text}}>Post anonymously</div>
                  <div style={{fontSize:'11.5px',color:C.textSub}}>Your name will be hidden</div>
                </div>
              </div>

              {message&&<div style={{padding:'0.75rem 1rem',borderRadius:'9px',border:'1px solid #FECACA',background:'#FEF2F2',color:'#B91C1C',fontSize:'13px',marginBottom:'1rem'}}>⚠ {message}</div>}

              <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end'}}>
                <button type="button" onClick={()=>window.location.href='/ideas/'+ideaId} style={{padding:'0.65rem 1.2rem',border:`1px solid ${C.border}`,borderRadius:'9px',background:'#fff',color:C.textSub,fontSize:'13.5px',fontWeight:600,cursor:'pointer',fontFamily:font}}>Cancel</button>
                <button type="submit" disabled={submitting} style={{padding:'0.65rem 1.4rem',border:'none',borderRadius:'9px',background:C.primary,color:'#fff',fontSize:'13.5px',fontWeight:700,cursor:submitting?'not-allowed':'pointer',fontFamily:font,opacity:submitting?0.7:1}}>
                  {submitting?'Saving…':'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </StaffShell>
  );
}

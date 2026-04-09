import { useEffect, useMemo, useState } from 'react';
import {
    BASE_URL,
    canCreateIdeas,
    canManageIdea,
    getAuthHeaders,
    getAuthSession,
    roleToPath,
} from '../shared/authStorage';
import StaffShell from '../shells/StaffShell';
import { C, badge, card, font } from '../shared/designTokens';

function toRelativeTime(v) {
  if(!v)return'';const d=Date.now()-new Date(v).getTime();if(d<0)return'Just now';const m=Math.floor(d/60000);if(m<1)return'Just now';if(m<60)return m+'m ago';const h=Math.floor(m/60);if(h<24)return h+'h ago';return Math.floor(h/24)+'d ago';
}

export default function MyIdeasPage() {
  const session = useMemo(()=>getAuthSession(),[]);
  const user = session?.user;
  const [ideas,setIdeas]=useState([]);
  const [message,setMessage]=useState('Loading…');
  const [deletingId,setDeletingId]=useState(0);

  useEffect(()=>{
    if(!session?.token||!user){window.location.href='/login';return;}
    if(!canCreateIdeas(user)){window.location.href=roleToPath(user.role);return;}
    let active=true;
    async function load() {
      try {
        const endpoint=BASE_URL?`${BASE_URL}/api/ideas`:'/api/ideas';
        const res=await fetch(endpoint,{headers:getAuthHeaders({Accept:'application/json'})});
        if(res.status===401){window.location.href='/login';return;}
        if(!res.ok){setMessage(`Load failed: ${res.status}`);return;}
        const data=await res.json();
        if(!active)return;
        const mine=(Array.isArray(data)?data:[]).filter(i=>Number(i.authorUserId)===Number(user.id));
        setIdeas(mine);setMessage('');
      }catch(e){setMessage('Error: '+(e instanceof Error?e.message:String(e)));}
    }
    load();
    return()=>{active=false;};
  },[session,user]);

  async function deleteIdea(idea) {
    if(!canManageIdea(user,idea))return;
    if(!window.confirm(`Delete "${idea.title}"?`))return;
    setDeletingId(idea.ideaId);setMessage('');
    try {
      const endpoint=BASE_URL?`${BASE_URL}/api/ideas/${idea.ideaId}`:`/api/ideas/${idea.ideaId}`;
      const res=await fetch(endpoint,{method:'DELETE',headers:getAuthHeaders({Accept:'application/json'})});
      if(res.status===401){window.location.href='/login';return;}
      if(!res.ok){setMessage(`Delete failed: ${res.status}`);return;}
      setIdeas(c=>c.filter(i=>i.ideaId!==idea.ideaId));setMessage('Idea deleted.');
    }catch(e){setMessage('Error: '+(e instanceof Error?e.message:String(e)));}
    finally{setDeletingId(0);}
  }

  if(!session?.token||!user)return null;

  return (
    <StaffShell activeMenu="myideas" footerText={`${ideas.length} of your ideas`}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
        <div>
          <h1 style={{margin:'0 0 4px',fontSize:'1.55rem',fontWeight:800,color:C.text,letterSpacing:'-0.02em'}}>My Ideas</h1>
          <p style={{margin:0,fontSize:'13px',color:C.textSub}}>Ideas you have submitted to the system.</p>
        </div>
        <button onClick={()=>window.location.href='/ideas/create'} style={{padding:'0.6rem 1.1rem',border:'none',borderRadius:'8px',background:C.primary,color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:font}}>+ New Idea</button>
      </div>

      {message&&<p style={{color:message.includes('deleted')?C.successDk:'#B91C1C',fontSize:'13px',marginTop:0}}>{message}</p>}

      {!message&&ideas.length===0&&<div style={{...card,padding:'2.5rem',textAlign:'center'}}>
        <div style={{fontSize:'48px',marginBottom:'0.75rem'}}>💡</div>
        <h2 style={{margin:'0 0 0.4rem',fontSize:'15px',fontWeight:700,color:C.text}}>No ideas yet</h2>
        <p style={{margin:'0 0 1.25rem',fontSize:'13px',color:C.textSub}}>Share your first idea with the community!</p>
        <button onClick={()=>window.location.href='/ideas/create'} style={{padding:'0.65rem 1.4rem',border:'none',borderRadius:'9px',background:C.primary,color:'#fff',fontSize:'13.5px',fontWeight:700,cursor:'pointer',fontFamily:font}}>Create Idea</button>
      </div>}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:'1rem'}}>
        {ideas.map(idea=>{
          const cats=Array.isArray(idea.categories)?idea.categories:[];
          const commentCount=Array.isArray(idea.comments)?idea.comments.length:0;
          return (
            <div key={idea.ideaId} style={{...card,padding:'1.25rem',display:'flex',flexDirection:'column',gap:'0.6rem',cursor:'pointer',transition:'box-shadow .2s,transform .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 8px 24px rgba(79,70,229,0.12)';e.currentTarget.style.transform='translateY(-1px)';}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow='';e.currentTarget.style.transform='';}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'0.5rem'}}>
                <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                  <span style={{...badge.primary,fontSize:'10px'}}>{idea.departmentName}</span>
                  {idea.isAnonymous&&<span style={{...badge.neutral,fontSize:'10px'}}>Anon</span>}
                </div>
                <span style={{fontSize:'10.5px',color:C.textMuted,flexShrink:0}}>{toRelativeTime(idea.createdAt)}</span>
              </div>
              <h3 style={{margin:0,fontSize:'14px',fontWeight:700,color:C.text,lineHeight:1.35}}>{idea.title}</h3>
              <p style={{margin:0,fontSize:'12px',color:C.textSub,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',lineHeight:1.5}}>{idea.content}</p>
              {cats.length>0&&<div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>{cats.map(c=><span key={c} style={{fontSize:'10px',padding:'2px 7px',borderRadius:'999px',background:'#EEF2FF',color:'#3730A3',fontWeight:600}}>{c}</span>)}</div>}
              <div style={{display:'flex',gap:'1rem',fontSize:'11.5px',color:C.textMuted,marginTop:'2px'}}>
                <span>👁 {idea.viewCount||0}</span>
                <span style={{color:'#059669'}}>👍 {idea.upvoteCount||0}</span>
                <span style={{color:'#DC2626'}}>👎 {idea.downvoteCount||0}</span>
                <span>💬 {commentCount}</span>
              </div>
              <div style={{display:'flex',gap:'0.4rem',marginTop:'4px',paddingTop:'0.75rem',borderTop:`1px solid ${C.border}`}}>
                <button onClick={()=>window.location.href='/ideas/'+idea.ideaId} style={{padding:'5px 12px',border:'none',borderRadius:'6px',background:'#EEF2FF',color:'#3730A3',fontSize:'11.5px',fontWeight:700,cursor:'pointer',fontFamily:font}}>View</button>
                <button onClick={()=>window.location.href='/ideas/'+idea.ideaId+'/edit'} style={{padding:'5px 12px',border:'none',borderRadius:'6px',background:C.infoLt,color:C.infoDk,fontSize:'11.5px',fontWeight:700,cursor:'pointer',fontFamily:font}}>Edit</button>
                <button onClick={()=>deleteIdea(idea)} disabled={deletingId===idea.ideaId} style={{padding:'5px 12px',border:'none',borderRadius:'6px',background:C.dangerLt,color:C.dangerDk,fontSize:'11.5px',fontWeight:700,cursor:'pointer',fontFamily:font,marginLeft:'auto'}}>{deletingId===idea.ideaId?'…':'Delete'}</button>
              </div>
            </div>
          );
        })}
      </div>
    </StaffShell>
  );
}

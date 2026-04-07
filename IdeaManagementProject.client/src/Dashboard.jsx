import { useEffect, useMemo, useState } from 'react';
import {
    BASE_URL,
    canManageIdea,
    getAuthHeaders,
    getAuthSession,
    getDisplayName,
    isDashboardRole,
    roleToPath,
} from './shared/authStorage';
import StaffShell from './shells/StaffShell';

function toRelativeTime(v) {
  if (!v) return '';
  const d = Date.now() - new Date(v).getTime();
  if (d < 0) return 'Just now';
  const m = Math.floor(d/60000);
  if (m < 1) return 'Just now';
  if (m < 60) return m+'m ago';
  const h = Math.floor(m/60);
  if (h < 24) return h+'h ago';
  return Math.floor(h/24)+'d ago';
}
function isToday(v) {
  const d = new Date(v), n = new Date();
  return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate();
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{...card, borderTop:`3px solid ${accent||C.primary}`, padding:'1.25rem'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'0.75rem'}}>
        <div style={{width:'38px',height:'38px',borderRadius:'9px',background:`${accent||C.primary}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>{icon}</div>
        {sub && <span style={{fontSize:'10px',fontWeight:700,padding:'2px 7px',borderRadius:'999px',background:C.successLt,color:C.successDk}}>{sub}</span>}
      </div>
      <div style={{fontSize:'1.85rem',fontWeight:800,color:C.text,lineHeight:1,letterSpacing:'-0.02em'}}>{value}</div>
      <div style={{fontSize:'11.5px',color:C.textSub,marginTop:'5px'}}>{label}</div>
    </div>
  );
}

function IdeaCard({ idea, user, onView, onEdit, onDelete, deleting, hot }) {
  const cats = Array.isArray(idea.categories) ? idea.categories : [];
  const canEdit = canManageIdea(user, idea);
  return (
    <div style={{...card, padding:'1.1rem', display:'flex', flexDirection:'column', gap:'0.6rem', cursor:'pointer', transition:'box-shadow .2s, transform .15s'}}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 8px 24px rgba(79,70,229,0.12)';e.currentTarget.style.transform='translateY(-1px)';}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow='';e.currentTarget.style.transform='';}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'0.5rem'}}>
        <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
          <span style={{...badge.primary,fontSize:'10px'}}>{idea.departmentName||'Department'}</span>
          {hot && <span style={{...badge.warning,fontSize:'10px'}}>🔥 Hot</span>}
        </div>
        <span style={{fontSize:'10.5px',color:C.textMuted,flexShrink:0}}>{toRelativeTime(idea.createdAt)}</span>
      </div>
      <h3 style={{margin:0,fontSize:'13.5px',fontWeight:700,color:C.text,lineHeight:1.35,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}} onClick={()=>onView(idea.ideaId)}>{idea.title}</h3>
      {cats.length > 0 && <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>{cats.slice(0,2).map(c=><span key={c} style={{fontSize:'10px',padding:'1px 6px',borderRadius:'999px',background:'#EEF2FF',color:'#3730A3',fontWeight:600}}>{c}</span>)}</div>}
      <p style={{margin:0,fontSize:'11.5px',color:C.textSub}}>by {idea.authorName}{idea.isAnonymous?' (anon)':''}</p>
      <div style={{display:'flex',gap:'1rem',fontSize:'11.5px',color:C.textMuted,marginTop:'2px'}}>
        <span>👁 {idea.viewCount||0}</span>
        <span style={{color:'#059669'}}>👍 {idea.upvoteCount||0}</span>
        <span style={{color:'#DC2626'}}>👎 {idea.downvoteCount||0}</span>
        <span>💬 {Array.isArray(idea.comments)?idea.comments.length:0}</span>
      </div>
      <div style={{display:'flex',gap:'0.4rem',marginTop:'4px'}}>
        <button onClick={()=>onView(idea.ideaId)} style={{padding:'4px 10px',border:'none',borderRadius:'6px',background:'#EEF2FF',color:'#3730A3',fontSize:'11px',fontWeight:700,cursor:'pointer',fontFamily:font}}>View</button>
        {canEdit && <>
          <button onClick={()=>onEdit(idea)} style={{padding:'4px 10px',border:'none',borderRadius:'6px',background:C.infoLt,color:C.infoDk,fontSize:'11px',fontWeight:700,cursor:'pointer',fontFamily:font}}>Edit</button>
          <button onClick={()=>onDelete(idea)} disabled={deleting===idea.ideaId} style={{padding:'4px 10px',border:'none',borderRadius:'6px',background:C.dangerLt,color:C.dangerDk,fontSize:'11px',fontWeight:700,cursor:'pointer',fontFamily:font}}>{deleting===idea.ideaId?'…':'Delete'}</button>
        </>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const session = useMemo(() => getAuthSession(), []);
  const user = session?.user;
  const [tab, setTab] = useState('recent');
  const [ideas, setIdeas] = useState([]);
  const [message, setMessage] = useState('Loading…');
  const [actionMessage, setActionMessage] = useState('');
  const [deletingId, setDeletingId] = useState(0);

  useEffect(() => {
    if (!session?.token||!user) { window.location.href='/login'; return; }
    if (!isDashboardRole(user)) { window.location.href=roleToPath(user.role); return; }
    let cancelled = false;
    async function load() {
      try {
        const endpoint = BASE_URL?`${BASE_URL}/api/ideas`:'/api/ideas';
        const res = await fetch(endpoint,{headers:getAuthHeaders({Accept:'application/json'})});
        if (res.status===401) { window.location.href='/login'; return; }
        if (!res.ok) { setMessage(`Unable to load: ${res.status}`); return; }
        const payload = await res.json();
        if (cancelled) return;
        setIdeas(Array.isArray(payload)?payload:[]);
        setMessage('');
      } catch(e) { setMessage('Error: '+(e instanceof Error?e.message:String(e))); }
    }
    load();
    return () => { cancelled=true; };
  }, [session, user]);

  const myIdeas = useMemo(() => ideas.filter(i=>Number(i.authorUserId)===Number(user?.id)), [ideas,user?.id]);
  const sortedIdeas = useMemo(() => {
    const items=[...ideas];
    if (tab==='hot') items.sort((a,b)=>(b.viewCount||0)-(a.viewCount||0));
    else items.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    return items;
  }, [ideas, tab]);
  const ideaCards = useMemo(() => sortedIdeas.slice(0,6), [sortedIdeas]);
  const latestActivity = useMemo(() => [...ideas].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5), [ideas]);
  const stats = useMemo(() => ({
    todayIdeas: ideas.filter(i=>isToday(i.createdAt)).length,
    myIdeas: myIdeas.length,
    totalViews: ideas.reduce((s,i)=>s+(i.viewCount||0),0),
    totalComments: ideas.reduce((s,i)=>s+(Array.isArray(i.comments)?i.comments.length:0),0),
  }), [ideas, myIdeas.length]);

  async function deleteIdea(idea) {
    if (!canManageIdea(user,idea)) { setActionMessage('You can only manage your own ideas.'); return; }
    if (!window.confirm(`Delete "${idea.title}"?`)) return;
    setDeletingId(idea.ideaId); setActionMessage('');
    try {
      const endpoint = BASE_URL?`${BASE_URL}/api/ideas/${idea.ideaId}`:`/api/ideas/${idea.ideaId}`;
      const res = await fetch(endpoint,{method:'DELETE',headers:getAuthHeaders({Accept:'application/json'})});
      if (res.status===401) { window.location.href='/login'; return; }
      if (!res.ok) { setActionMessage(`Delete failed: ${res.status}`); return; }
      setIdeas(c=>c.filter(i=>i.ideaId!==idea.ideaId));
      setActionMessage('Idea deleted.');
    } catch(e) { setActionMessage('Error: '+(e instanceof Error?e.message:String(e))); }
    finally { setDeletingId(0); }
  }

  if (!session?.token||!user) return null;
  const username = getDisplayName(user);

  return (
    <StaffShell activeMenu="dashboard" footerText={`${ideas.length} ideas in system`}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.75rem',flexWrap:'wrap',gap:'1rem'}}>
        <div>
          <h1 style={{margin:'0 0 3px',fontSize:'1.55rem',fontWeight:800,color:C.text,letterSpacing:'-0.02em'}}>Dashboard</h1>
          <p style={{margin:0,fontSize:'13px',color:C.textSub}}>Welcome back, <strong>{username}</strong> — here's what's happening.</p>
        </div>
        <button onClick={()=>window.location.reload()}
          style={{padding:'0.55rem 1rem',border:`1px solid ${C.border}`,borderRadius:'8px',background:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:font,color:C.textSub,display:'flex',alignItems:'center',gap:'5px'}}>
          ↺ Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginBottom:'1.75rem'}}>
        <StatCard icon="💡" label="Ideas today" value={stats.todayIdeas} sub={stats.todayIdeas>0?'Active':undefined} accent="#6366F1"/>
        <StatCard icon="📌" label="My ideas" value={stats.myIdeas} sub={stats.myIdeas>0?'Yours':undefined} accent="#06B6D4"/>
        <StatCard icon="👁" label="Total views" value={stats.totalViews} sub={stats.totalViews>0?'Live':undefined} accent="#10B981"/>
        <StatCard icon="💬" label="Total comments" value={stats.totalComments} sub={stats.totalComments>0?'Live':undefined} accent="#F59E0B"/>
      </div>

      {/* Tab bar */}
      <div style={{display:'flex',gap:'4px',background:'#E2E8F0',borderRadius:'10px',padding:'4px',width:'fit-content',marginBottom:'1.25rem'}}>
        {[['recent','🕐 Recent'],['hot','🔥 Most Viewed']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{padding:'6px 16px',borderRadius:'7px',fontSize:'12.5px',fontWeight:tab===id?700:500,border:'none',cursor:'pointer',fontFamily:font,background:tab===id?'#fff':'transparent',color:tab===id?C.text:C.textSub,boxShadow:tab===id?'0 1px 4px rgba(0,0,0,0.1)':'none',transition:'all .2s'}}>
            {label}
          </button>
        ))}
      </div>

      {message && <p style={{color:'#B91C1C',marginTop:0,fontSize:'13px'}}>{message}</p>}
      {actionMessage && <p style={{color:actionMessage.includes('deleted')?C.successDk:'#B91C1C',marginTop:0,fontSize:'13px'}}>{actionMessage}</p>}

      {/* Ideas grid */}
      {!message && ideaCards.length===0
        ? <div style={{...card,padding:'2rem',textAlign:'center',color:C.textSub}}>No ideas yet.</div>
        : <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem',marginBottom:'1.75rem'}}>
            {ideaCards.map((idea,idx)=>(
              <IdeaCard key={idea.ideaId} idea={idea} user={user}
                hot={tab==='hot'&&idx<3}
                onView={id=>window.location.href='/ideas/'+id}
                onEdit={idea=>window.location.href='/ideas/'+idea.ideaId+'/edit'}
                onDelete={deleteIdea} deleting={deletingId}/>
            ))}
          </div>
      }

      {/* Recent activity */}
      {!message && latestActivity.length>0 && (
        <div style={{...card}}>
          <h2 style={{margin:'0 0 1rem',fontSize:'13.5px',fontWeight:700,color:C.text}}>📋 Latest Activity</h2>
          {latestActivity.map((item,i)=>(
            <div key={item.ideaId} style={{display:'flex',alignItems:'center',gap:'0.75rem',paddingBottom:'0.75rem',marginBottom:'0.75rem',borderBottom:i===latestActivity.length-1?'none':`1px solid ${C.border}`}}>
              <div style={{width:'34px',height:'34px',borderRadius:'50%',background:`linear-gradient(135deg,${C.primary},#818CF8)`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <span style={{color:'#fff',fontSize:'12px',fontWeight:700}}>{(item.authorName||'U').slice(0,1).toUpperCase()}</span>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap',marginBottom:'2px'}}>
                  <span style={{fontSize:'12.5px',fontWeight:700,color:C.text}}>{item.authorName}</span>
                  <span style={{fontSize:'12px',color:C.textMuted}}>posted</span>
                  <span style={{fontSize:'12.5px',color:C.primary,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'200px'}}>{item.title}</span>
                  <span style={{fontSize:'11px',color:C.textMuted,marginLeft:'auto',flexShrink:0}}>{toRelativeTime(item.createdAt)}</span>
                </div>
                <p style={{margin:0,fontSize:'12px',color:C.textSub}}>{item.departmentName} · 👁 {item.viewCount||0}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </StaffShell>
  );
}

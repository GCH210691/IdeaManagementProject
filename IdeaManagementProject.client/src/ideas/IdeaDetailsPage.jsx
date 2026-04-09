import { useEffect, useMemo, useState } from 'react';
import { BASE_URL, canManageIdea, getAuthHeaders, getAuthSession } from '../shared/authStorage';
import { card } from '../theme';
import StaffShell from '../shells/StaffShell';

function getIdeaIdFromPath() {
    const match = window.location.pathname.match(/^\/ideas\/(\d+)$/i);
    return match ? Number(match[1]) : 0;
}
function formatRole(role) {
    return String(role || '').toLowerCase().split('_').filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}
function toRelativeTime(value) {
    if (!value) return '';
    const diffMs = Date.now() - new Date(value).getTime();
    if (diffMs < 0) return 'Just now';
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return diffMin + 'm ago';
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return diffHour + 'h ago';
    return Math.floor(diffHour / 24) + 'd ago';
}
const IMAGE_TYPES = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml'];
function isImageType(ct) { return IMAGE_TYPES.includes((ct||'').toLowerCase()); }

function Lightbox({ src, name, onClose }) {
    return (
        <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
            <div onClick={e=>e.stopPropagation()} style={{position:'relative',maxWidth:'90vw',maxHeight:'90vh'}}>
                <img src={src} alt={name} style={{maxWidth:'90vw',maxHeight:'85vh',borderRadius:'8px',display:'block'}} />
                <button onClick={onClose} style={{position:'absolute',top:'-14px',right:'-14px',width:'32px',height:'32px',borderRadius:'50%',border:'none',background:'#fff',color:'#111',cursor:'pointer',fontWeight:900,fontSize:'16px'}}>✕</button>
                <p style={{color:'#fff',textAlign:'center',marginTop:'8px',fontSize:'12px',opacity:0.7}}>{name}</p>
            </div>
        </div>
    );
}

export default function IdeaDetailsPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;
    const ideaId = useMemo(() => getIdeaIdFromPath(), []);

    const [idea, setIdea] = useState(null);
    const [message, setMessage] = useState(ideaId ? 'Loading…' : 'Invalid idea ID.');
    const [commentText, setCommentText] = useState('');
    const [commentMsg, setCommentMsg] = useState('');
    const [sendingComment, setSendingComment] = useState(false);
    const [sendingVote, setSendingVote] = useState(false);
    const [voteMsg, setVoteMsg] = useState('');
    const [lightbox, setLightbox] = useState(null);

    useEffect(() => {
        if (!session?.token || !user) { window.location.href = '/login'; return; }
        if (!ideaId) return;
        let active = true;
        async function load() {
            try {
                const res = await fetch(`${BASE_URL}/api/ideas/` + ideaId, { headers: getAuthHeaders({ Accept: 'application/json' }) });
                if (res.status === 401) { window.location.href = '/login'; return; }
                if (res.status === 404) { setMessage('Idea not found.'); return; }
                if (!res.ok) { setMessage('Unable to load idea: ' + res.status); return; }
                const data = await res.json();
                if (!active) return;
                setIdea(data);
                setMessage('');
            } catch (e) { setMessage('Load error: ' + (e instanceof Error ? e.message : String(e))); }
        }
        load();
        return () => { active = false; };
    }, [ideaId, session, user]);

    async function submitComment() {
        if (!idea?.isCommentOpen) { setCommentMsg('Comment is closed for this idea.'); return; }
        if (!commentText.trim()) { setCommentMsg('Comment cannot be empty.'); return; }
        setSendingComment(true); setCommentMsg('');
        try {
            const res = await fetch(`${BASE_URL}/api/ideas/` + ideaId + '/comments', {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
                body: JSON.stringify({ content: commentText.trim() }),
            });
            if (res.status === 401) { window.location.href = '/login'; return; }
            const payload = await res.json().catch(() => null);
            if (res.status === 409) { setIdea(c => c ? {...c, isCommentOpen: false} : c); setCommentMsg(payload?.message || 'Comment window is now closed.'); return; }
            if (!res.ok) { setCommentMsg(payload?.message || 'Failed: ' + res.status); return; }
            setIdea(c => c ? {...c, comments: [...(c.comments || []), payload]} : c);
            setCommentText(''); setCommentMsg('');
        } catch (e) { setCommentMsg('Error: ' + (e instanceof Error ? e.message : String(e))); }
        finally { setSendingComment(false); }
    }

    async function submitVote(value) {
        setSendingVote(true); setVoteMsg('');
        try {
            const res = await fetch(`${BASE_URL}/api/ideas/` + ideaId + '/vote', {
                method: 'PUT',
                headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
                body: JSON.stringify({ value }),
            });
            if (res.status === 401) { window.location.href = '/login'; return; }
            const payload = await res.json().catch(() => null);
            if (!res.ok) { setVoteMsg(payload?.message || 'Vote failed: ' + res.status); return; }
            setIdea(c => c ? {...c, upvoteCount: payload.upvoteCount, downvoteCount: payload.downvoteCount, currentUserVote: payload.currentUserVote} : c);
        } catch (e) { setVoteMsg('Vote error: ' + (e instanceof Error ? e.message : String(e))); }
        finally { setSendingVote(false); }
    }

    async function downloadAttachment(attachmentId, originalName) {
        try {
            const res = await fetch(`${BASE_URL}/api/ideas/attachments/` + attachmentId + '/download', { headers: getAuthHeaders() });
            if (res.status === 401) { window.location.href = '/login'; return; }
            if (!res.ok) { setMessage('Download failed: ' + res.status); return; }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = originalName;
            document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        } catch (e) { setMessage('Download error: ' + (e instanceof Error ? e.message : String(e))); }
    }

    if (!session?.token || !user) return null;

    const cats = Array.isArray(idea?.categories) ? idea.categories : [];
    const attachments = Array.isArray(idea?.attachments) ? idea.attachments : [];
    const comments = Array.isArray(idea?.comments) ? idea.comments : [];
    const imageAttachments = attachments.filter(a => isImageType(a.contentType));
    const fileAttachments = attachments.filter(a => !isImageType(a.contentType));
    const canEdit = idea && canManageIdea(user, idea);
    const isQaManager = user?.role === 'QA_MANAGER';

    const card = { background:'#fff', borderRadius:'14px', border:'1px solid #E5E7EB', padding:'1.75rem', marginBottom:'1.25rem', boxSizing:'border-box' };
    const divider = { height:'1px', background:'#F3F4F6', margin:'1.25rem 0' };

    return (
        <StaffShell activeMenu="ideas" footerText="Idea detail">
            {lightbox && <Lightbox src={lightbox.url} name={lightbox.name} onClose={() => setLightbox(null)} />}
            <div style={{maxWidth:'1100px'}}>
                <button
                    onClick={() => window.history.length > 1 ? window.history.back() : window.location.href='/ideas'}
                    style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'none',border:'none',cursor:'pointer',color:'#6B7280',fontSize:'13px',fontWeight:600,padding:'0 0 1.25rem 0',fontFamily:'inherit'}}>
                    ← Back to ideas
                </button>

                {message && <div style={{...card,color:'#B91C1C',fontSize:'14px'}}>{message}</div>}

                {!message && idea && (<>
                    {/* Main card */}
                    <div style={card}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'1rem',marginBottom:'0.75rem',flexWrap:'wrap'}}>
                            <h1 style={{fontSize:'1.35rem',fontWeight:900,color:'#111827',margin:0,lineHeight:1.3}}>{idea.title}</h1>
                            {canEdit && (
                                <button onClick={() => window.location.href='/ideas/'+ideaId+'/edit'}
                                    style={{padding:'0.55rem 1rem',borderRadius:'8px',border:'none',background:'#DBEAFE',color:'#1E40AF',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>
                                    Edit idea
                                </button>
                            )}
                        </div>

                        {/* Meta */}
                        <div style={{display:'flex',gap:'1rem',marginBottom:'1rem',flexWrap:'wrap',alignItems:'center'}}>
                            {[
                                { icon:'👤', text: idea.authorName },
                                { icon:'🏢', text: idea.departmentName },
                                { icon:'📅', text: new Date(idea.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) },
                                { icon:'👁', text: idea.viewCount + ' views' },
                            ].map(m => (
                                <span key={m.text} style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'12px',color:'#6B7280'}}>
                                    <span>{m.icon}</span>{m.text}
                                </span>
                            ))}
                            {idea.isAnonymous && <span style={{fontSize:'11px',fontWeight:600,padding:'2px 8px',borderRadius:'999px',background:'#F3F4F6',color:'#374151'}}>Anonymous</span>}
                            <span style={{fontSize:'11px',fontWeight:700,padding:'2px 9px',borderRadius:'999px',background:idea.isCommentOpen?'#DCFCE7':'#FEE2E2',color:idea.isCommentOpen?'#166534':'#991B1B'}}>
                                {idea.isCommentOpen ? '💬 Comments open' : '🔒 Comments closed'}
                            </span>
                        </div>

                        {/* Categories */}
                        {cats.length > 0 && (
                            <div style={{marginBottom:'1rem'}}>
                                {cats.map(c => <span key={c} style={{display:'inline-block',padding:'2px 10px',marginRight:'4px',borderRadius:'999px',background:'#EEF2FF',color:'#3730A3',fontSize:'11px',fontWeight:600}}>{c}</span>)}
                            </div>
                        )}

                        <div style={divider} />
                        <p style={{fontSize:'14px',color:'#374151',lineHeight:1.75,whiteSpace:'pre-wrap',margin:0}}>{idea.content}</p>

                        {/* Attachments */}
                        {attachments.length > 0 && (<>
                            <div style={divider} />
                            <div style={{fontSize:'11px',fontWeight:700,color:'#6B7280',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'0.75rem'}}>
                                Attachments ({attachments.length})
                            </div>
                            {imageAttachments.length > 0 && (
                                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:'0.75rem',marginBottom:'0.75rem'}}>
                                    {imageAttachments.map(a => (
                                        <div key={a.attachmentId} style={{position:'relative'}}>
                                            <div
                                                style={{width:'100%',height:'110px',borderRadius:'8px',border:'1px solid #E5E7EB',background:'#F9FAFB',display:'flex',alignItems:'center',justifyContent:'center',cursor:isQaManager?'pointer':'default',overflow:'hidden'}}
                                                onClick={() => isQaManager && setLightbox({url:'/api/ideas/attachments/'+a.attachmentId+'/download',name:a.originalName})}>
                                                <span style={{fontSize:'13px',color:'#9CA3AF'}}>🖼 {a.originalName}</span>
                                            </div>
                                            <div style={{fontSize:'10px',color:'#6B7280',marginTop:'3px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.originalName}</div>
                                            {isQaManager && (
                                                <button onClick={() => downloadAttachment(a.attachmentId, a.originalName)}
                                                    style={{position:'absolute',top:'4px',right:'4px',background:'rgba(0,0,0,0.55)',border:'none',color:'#fff',borderRadius:'5px',padding:'2px 6px',fontSize:'10px',cursor:'pointer'}}>↓</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {fileAttachments.length > 0 && (
                                <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem'}}>
                                    {fileAttachments.map(a => (
                                        <button key={a.attachmentId}
                                            onClick={() => isQaManager && downloadAttachment(a.attachmentId, a.originalName)}
                                            title={isQaManager?'Click to download':'Only QA Manager can download'}
                                            style={{display:'inline-flex',alignItems:'center',gap:'5px',padding:'4px 10px',background:'#F3F4F6',border:'1px solid #E5E7EB',borderRadius:'999px',fontSize:'12px',color:'#374151',fontWeight:600,cursor:isQaManager?'pointer':'default',fontFamily:'inherit'}}>
                                            📎 {a.originalName}{isQaManager && <span style={{opacity:0.6}}>↓</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>)}

                        <div style={divider} />

                        {/* Voting */}
                        <div style={{display:'flex',alignItems:'center',gap:'0.75rem',flexWrap:'wrap'}}>
                            {[
                                {value:1, label:'👍 Upvote', activeLabel:'👍 Upvoted', count:idea.upvoteCount||0, active:idea.currentUserVote===1, tone:'up'},
                                {value:-1, label:'👎 Downvote', activeLabel:'👎 Downvoted', count:idea.downvoteCount||0, active:idea.currentUserVote===-1, tone:'down'},
                            ].map(v => (
                                <button key={v.value} disabled={sendingVote}
                                    onClick={() => submitVote(idea.currentUserVote === v.value ? 0 : v.value)}
                                    style={{display:'inline-flex',alignItems:'center',gap:'5px',padding:'7px 14px',borderRadius:'8px',border:'none',cursor:sendingVote?'wait':'pointer',fontFamily:'inherit',fontWeight:700,fontSize:'13px',background:v.active?(v.tone==='up'?'#DCFCE7':'#FEE2E2'):'#F3F4F6',color:v.active?(v.tone==='up'?'#166534':'#991B1B'):'#374151'}}>
                                    {v.active ? v.activeLabel : v.label}
                                    <span style={{opacity:0.7}}>({v.count})</span>
                                </button>
                            ))}
                            {voteMsg && <span style={{fontSize:'12px',color:'#6B7280'}}>{voteMsg}</span>}
                        </div>
                    </div>

                    {/* Comments card */}
                    <div style={card}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem',flexWrap:'wrap',gap:'0.5rem'}}>
                            <h2 style={{margin:0,fontSize:'15px',fontWeight:800,color:'#111827'}}>💬 Comments ({comments.length})</h2>
                            <span style={{fontSize:'11px',fontWeight:700,padding:'2px 9px',borderRadius:'999px',background:idea.isCommentOpen?'#DCFCE7':'#FEE2E2',color:idea.isCommentOpen?'#166534':'#991B1B'}}>
                                {idea.isCommentOpen
                                    ? 'Open until ' + new Date(idea.commentEndAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})
                                    : 'Commenting closed'}
                            </span>
                        </div>

                        {comments.length === 0
                            ? <p style={{color:'#9CA3AF',fontSize:'13px',margin:'0 0 1rem 0'}}>No comments yet. Be the first!</p>
                            : <div style={{marginBottom:'1rem'}}>
                                {comments.map(comment => (
                                    <div key={comment.commentId} style={{background:'#F9FAFB',borderRadius:'10px',padding:'0.9rem 1rem',marginBottom:'0.75rem',border:'1px solid #F3F4F6'}}>
                                        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'0.4rem',flexWrap:'wrap'}}>
                                            <span style={{fontWeight:700,fontSize:'13px',color:'#111827'}}>{comment.authorName}</span>
                                            <span style={{fontSize:'11px',fontWeight:600,padding:'1px 7px',borderRadius:'999px',background:'#EEF2FF',color:'#3730A3'}}>{formatRole(comment.authorRole)}</span>
                                            <span style={{fontSize:'11px',color:'#9CA3AF',marginLeft:'auto'}}>
                                                {toRelativeTime(comment.createdAt)} · {new Date(comment.createdAt).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <p style={{fontSize:'13px',color:'#374151',lineHeight:1.6,margin:0,whiteSpace:'pre-wrap'}}>{comment.content}</p>
                                    </div>
                                ))}
                            </div>
                        }

                        <div style={{borderTop:'1px solid #F3F4F6',paddingTop:'1rem'}}>
                            <textarea
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                disabled={!idea.isCommentOpen}
                                placeholder={idea.isCommentOpen ? 'Write a comment…' : 'Commenting is closed for this idea.'}
                                style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #E5E7EB',fontSize:'14px',fontFamily:'inherit',outline:'none',resize:'vertical',color:'#111827',boxSizing:'border-box',background:'#F9FAFB',minHeight:'80px'}}
                            />
                            {commentMsg && <p style={{margin:'0.4rem 0',fontSize:'12px',color:commentMsg.includes('Error')||commentMsg.includes('closed')?'#DC2626':'#059669'}}>{commentMsg}</p>}
                            <div style={{marginTop:'0.75rem',display:'flex',justifyContent:'flex-end'}}>
                                <button onClick={submitComment} disabled={!idea.isCommentOpen||sendingComment}
                                    style={{padding:'0.6rem 1.2rem',borderRadius:'8px',border:'none',fontFamily:'inherit',fontWeight:700,fontSize:'13px',cursor:(!idea.isCommentOpen||sendingComment)?'not-allowed':'pointer',background:(!idea.isCommentOpen||sendingComment)?'#D1D5DB':'#3B82F6',color:(!idea.isCommentOpen||sendingComment)?'#9CA3AF':'#fff'}}>
                                    {sendingComment ? 'Sending…' : 'Post Comment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>)}
            </div>
        </StaffShell>
    );
}

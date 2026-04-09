import { useEffect, useMemo, useState } from 'react';
import { BASE_URL, getAuthHeaders, getAuthSession, isDashboardRole, roleToPath } from './shared/authStorage';
import StaffShell from './shells/StaffShell';

function pageHeaderStyle() { return { marginBottom:'1rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap' }; }
function h1Style() { return { margin:'0 0 0.25rem 0', fontSize:'1.5rem', fontWeight:900, color:'#111827' }; }
function subStyle() { return { margin:0, fontSize:'13px', color:'#6B7280' }; }
function statsGridStyle() { return { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.25rem' }; }
function statCardStyle() { return { background:'#fff', borderRadius:'12px', border:'1px solid #F3F4F6', padding:'1.25rem', boxSizing:'border-box' }; }
function cardStyle() { return { background:'#fff', borderRadius:'12px', border:'1px solid #F3F4F6', padding:'1.25rem' }; }

function categoryTagStyle() {
    return { display:'inline-block', padding:'2px 7px', marginRight:'3px', marginBottom:'3px', borderRadius:'999px', background:'#EEF2FF', color:'#3730A3', fontSize:'10px', fontWeight:600 };
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

export default function DepartmentIdeasPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;

    const [ideas, setIdeas] = useState([]);
    const [message, setMessage] = useState('Loading department data...');

    useEffect(() => {
        if (!session?.token || !user) { window.location.href = '/login'; return; }
        if (!isDashboardRole(user)) { window.location.href = roleToPath(user.role); return; }

        let cancelled = false;
        async function loadIdeas() {
            try {
                const endpoint = BASE_URL ? BASE_URL + '/api/ideas' : '/api/ideas';
                const res = await fetch(endpoint, { headers: getAuthHeaders({ Accept: 'application/json' }) });
                if (res.status === 401) { window.location.href = '/login'; return; }
                if (!res.ok) { setMessage('Unable to load ideas: ' + res.status); return; }
                const payload = await res.json();
                if (cancelled) return;
                setIdeas(Array.isArray(payload) ? payload : []);
                setMessage('');
            } catch (e) { setMessage('Load error: ' + (e instanceof Error ? e.message : String(e))); }
        }
        loadIdeas();
        return () => { cancelled = true; };
    }, [session, user]);

    // ── KEY FIX: filter ideas belonging to the current user's department ──
    const userDepartmentId = user?.departmentId;
    const myDeptName = useMemo(() => {
        if (!userDepartmentId || ideas.length === 0) return null;
        const found = ideas.find(i => i.departmentId === userDepartmentId);
        return found?.departmentName || null;
    }, [ideas, userDepartmentId]);

    const deptIdeas = useMemo(() => {
        if (!userDepartmentId) return ideas; // fallback: show all if no department
        return ideas.filter(i => i.departmentId === userDepartmentId);
    }, [ideas, userDepartmentId]);

    // Stats for the user's department
    const stats = useMemo(() => {
        const totalViews = deptIdeas.reduce((s, i) => s + (i.viewCount || 0), 0);
        const totalUpvotes = deptIdeas.reduce((s, i) => s + (i.upvoteCount || 0), 0);
        const totalComments = deptIdeas.reduce((s, i) => s + (Array.isArray(i.comments) ? i.comments.length : 0), 0);
        return { totalViews, totalUpvotes, totalComments };
    }, [deptIdeas]);

    if (!session?.token || !user) return null;

    const displayDeptName = myDeptName || user?.departmentName || 'Your Department';

    return (
        <StaffShell activeMenu="departments" footerText={deptIdeas.length + ' ideas in your department'}>
            <div style={pageHeaderStyle()}>
                <div>
                    <h1 style={h1Style()}>Department: {displayDeptName}</h1>
                    <p style={subStyle()}>Ideas submitted by members of your department.</p>
                </div>
            </div>

            {/* Stats */}
            <div style={statsGridStyle()}>
                <div style={statCardStyle()}>
                    <div style={{ fontSize:'1.75rem', fontWeight:900, color:'#111827' }}>{deptIdeas.length}</div>
                    <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'4px' }}>Ideas submitted</div>
                </div>
                <div style={statCardStyle()}>
                    <div style={{ fontSize:'1.75rem', fontWeight:900, color:'#111827' }}>{stats.totalViews}</div>
                    <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'4px' }}>Total views</div>
                </div>
                <div style={statCardStyle()}>
                    <div style={{ fontSize:'1.75rem', fontWeight:900, color:'#111827' }}>{stats.totalComments}</div>
                    <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'4px' }}>Total comments</div>
                </div>
            </div>

            {message && <p style={{ color:'#B91C1C', marginTop:0 }}>{message}</p>}

            {!message && deptIdeas.length === 0 && (
                <div style={cardStyle()}>
                    <p style={{ margin:0, color:'#6B7280', fontSize:'13px' }}>No ideas from your department yet.</p>
                </div>
            )}

            {!message && deptIdeas.length > 0 && (
                <div style={cardStyle()}>
                    <h2 style={{ margin:'0 0 1rem 0', fontSize:'13px', fontWeight:700, color:'#1F2937' }}>
                        Ideas from {displayDeptName}
                    </h2>
                    {deptIdeas.map((idea, index) => {
                        const cats = Array.isArray(idea.categories) ? idea.categories : [];
                        const commentCount = Array.isArray(idea.comments) ? idea.comments.length : 0;
                        const isLast = index === deptIdeas.length - 1;
                        return (
                            <div key={idea.ideaId} style={{
                                display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'1rem',
                                paddingBottom: isLast ? 0 : '0.9rem',
                                marginBottom: isLast ? 0 : '0.9rem',
                                borderBottom: isLast ? 'none' : '1px solid #F3F4F6',
                                flexWrap:'wrap',
                            }}>
                                <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontWeight:700, fontSize:'13px', color:'#111827', marginBottom:'4px', lineHeight:1.3 }}>
                                        {idea.title}
                                    </div>
                                    <div style={{ fontSize:'12px', color:'#6B7280', marginBottom:'6px' }}>
                                        by {idea.authorName} · {toRelativeTime(idea.createdAt)}
                                    </div>
                                    {cats.length > 0 && (
                                        <div style={{ marginBottom:'6px' }}>
                                            {cats.map(c => <span key={c} style={categoryTagStyle()}>{c}</span>)}
                                        </div>
                                    )}
                                    <div style={{ display:'flex', gap:'1rem', fontSize:'12px', color:'#6B7280' }}>
                                        <span>👁 {idea.viewCount || 0}</span>
                                        <span style={{ color:'#059669' }}>👍 {idea.upvoteCount || 0}</span>
                                        <span style={{ color:'#DC2626' }}>👎 {idea.downvoteCount || 0}</span>
                                        <span>💬 {commentCount}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => window.location.href = '/ideas/' + idea.ideaId}
                                    style={{ border:'none', borderRadius:'7px', padding:'5px 12px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', background:'#DBEAFE', color:'#1E40AF', flexShrink:0 }}>
                                    View
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </StaffShell>
    );
}

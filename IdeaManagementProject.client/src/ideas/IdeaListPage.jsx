import { useEffect, useMemo, useState } from 'react';
import { BASE_URL, canCreateIdeas, canManageIdea, getAuthHeaders, getAuthSession } from '../shared/authStorage';
import StaffShell from '../shells/StaffShell';

function pageHeaderStyle() { return { marginBottom:'1rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap' }; }
function h1Style() { return { margin:'0 0 0.25rem 0', fontSize:'1.5rem', fontWeight:900, color:'#111827' }; }
function subStyle() { return { margin:0, fontSize:'13px', color:'#6B7280' }; }
function actionButtonStyle(primary) {
    return { border:'none', borderRadius:'8px', padding:'0.55rem 0.9rem', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:primary?'#fff':'#111827', background:primary?'#2563EB':'#E5E7EB' };
}
function cardStyle() { return { background:'#fff', borderRadius:'12px', border:'1px solid #F3F4F6', padding:'1.25rem' }; }
function thStyle() { return { textAlign:'left', borderBottom:'1px solid #E5E7EB', padding:'0.65rem 0.75rem', fontSize:'11px', color:'#6B7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap' }; }
function tdStyle() { return { textAlign:'left', borderBottom:'1px solid #F3F4F6', padding:'0.75rem', verticalAlign:'middle', fontSize:'13px', color:'#111827' }; }
function tinyButtonStyle(tone) {
    const map = { neutral:{ background:'#E5E7EB', color:'#111827' }, primary:{ background:'#DBEAFE', color:'#1E40AF' }, danger:{ background:'#FEE2E2', color:'#991B1B' } };
    return { border:'none', borderRadius:'6px', padding:'4px 8px', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', ...map[tone] };
}
function categoryTagStyle() { return { display:'inline-block', padding:'2px 7px', marginRight:'3px', marginBottom:'3px', borderRadius:'999px', background:'#EEF2FF', color:'#3730A3', fontSize:'10px', fontWeight:600 }; }
function inputStyle() { return { padding:'0.5rem 0.75rem', borderRadius:'8px', border:'1px solid #E5E7EB', fontSize:'13px', fontFamily:'inherit', outline:'none', color:'#111827', background:'#F9FAFB' }; }
function selectStyle() { return { padding:'0.5rem 0.75rem', borderRadius:'8px', border:'1px solid #E5E7EB', fontSize:'13px', fontFamily:'inherit', outline:'none', color:'#111827', background:'#F9FAFB', cursor:'pointer' }; }

export default function IdeaListPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;
    const [ideas, setIdeas] = useState([]);
    const [message, setMessage] = useState('Loading ideas...');
    const [deletingId, setDeletingId] = useState(0);
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState('desc');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    function handleSort(field) {
        setPage(1);
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    }

    function SortIcon({ field }) {
        if (sortField !== field) return <span style={{ color: '#D1D5DB', marginLeft: '4px' }}>↕</span>;
        return <span style={{ color: '#2563EB', marginLeft: '4px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
    }

    useEffect(() => {
        if (!session?.token || !user) { window.location.href = '/login'; return; }
        let active = true;
        async function loadIdeas() {
            try {
                const res = await fetch(`${BASE_URL}/api/ideas`, { headers: getAuthHeaders({ Accept: 'application/json' }) });
                if (res.status === 401) { window.location.href = '/login'; return; }
                if (!res.ok) { setMessage('Unable to load ideas: ' + res.status); return; }
                const data = await res.json();
                if (!active) return;
                setIdeas(Array.isArray(data) ? data : []);
                setMessage('');
            } catch (e) { setMessage('Load error: ' + (e instanceof Error ? e.message : String(e))); }
        }
        loadIdeas();
        return () => { active = false; };
    }, [session, user]);

    const allowCreate = useMemo(() => canCreateIdeas(user), [user]);

    const filtered = useMemo(() => {
        setPage(1);
        let list = [...ideas];
        const q = search.trim().toLowerCase();
        if (q) list = list.filter(i => i.title?.toLowerCase().includes(q) || i.authorName?.toLowerCase().includes(q) || i.departmentName?.toLowerCase().includes(q));
        const dir = sortDir === 'asc' ? 1 : -1;
        list.sort((a, b) => {
            switch (sortField) {
                case 'title':       return dir * (a.title||'').localeCompare(b.title||'');
                case 'authorName':  return dir * (a.authorName||'').localeCompare(b.authorName||'');
                case 'department':  return dir * (a.departmentName||'').localeCompare(b.departmentName||'');
                case 'viewCount':   return dir * ((a.viewCount||0) - (b.viewCount||0));
                case 'upvoteCount': return dir * ((a.upvoteCount||0) - (b.upvoteCount||0));
                case 'downvoteCount': return dir * ((a.downvoteCount||0) - (b.downvoteCount||0));
                case 'commentCount': return dir * ((Array.isArray(a.comments)?a.comments.length:0) - (Array.isArray(b.comments)?b.comments.length:0));
                case 'createdAt':
                default:            return dir * (new Date(a.createdAt) - new Date(b.createdAt));
            }
        });
        return list;
    }, [ideas, search, sortField, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    async function downloadCsvExport() {
        try {
            const res = await fetch(`${BASE_URL}/api/ideas/export/csv`, { headers: getAuthHeaders({ Accept: 'text/csv' }) });
            if (res.status === 401) { window.location.href = '/login'; return; }
            if (res.status === 403) { setMessage('Only QA managers can download the CSV export.'); return; }
            if (!res.ok) { setMessage('Export failed: ' + res.status); return; }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const disposition = res.headers.get('content-disposition') || '';
            const match = disposition.match(/filename="?([^"]+)"?/i);
            const a = document.createElement('a'); a.href = url; a.download = match?.[1] || 'system-data.csv';
            document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        } catch (e) { setMessage('Export error: ' + (e instanceof Error ? e.message : String(e))); }
    }

    async function deleteIdea(idea) {
        if (!canManageIdea(user, idea)) return;
        if (!window.confirm('Delete idea "' + idea.title + '"?')) return;
        setDeletingId(idea.ideaId); setMessage('');
        try {
            const res = await fetch(`${BASE_URL}/api/ideas/` + idea.ideaId, { method: 'DELETE', headers: getAuthHeaders({ Accept: 'application/json' }) });
            if (res.status === 401) { window.location.href = '/login'; return; }
            if (res.status === 403) { setMessage('You can only delete your own ideas.'); return; }
            if (!res.ok) { setMessage('Delete failed: ' + res.status); return; }
            setIdeas(cur => cur.filter(i => i.ideaId !== idea.ideaId));
            setMessage('Idea deleted.');
        } catch (e) { setMessage('Delete error: ' + (e instanceof Error ? e.message : String(e))); }
        finally { setDeletingId(0); }
    }

    if (!session?.token || !user) return null;

    return (
        <StaffShell activeMenu="ideas" footerText={ideas.length + ' ideas in DB'}>
            <div style={pageHeaderStyle()}>
                <div>
                    <h1 style={h1Style()}>Idea List</h1>
                    <p style={subStyle()}>Browse and search all submitted ideas.</p>
                </div>
                <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
                    {user?.role === 'QA_MANAGER' && (
                        <button type="button" style={actionButtonStyle(true)} onClick={downloadCsvExport}>Download CSV</button>
                    )}
                    {allowCreate && (
                        <button type="button" style={actionButtonStyle(true)} onClick={() => window.location.href='/ideas/create'}>Create idea</button>
                    )}
                </div>
            </div>

            {message && <p style={{ color: message.includes('deleted') ? '#065F46' : '#B91C1C', marginTop:0 }}>{message}</p>}

            <div style={cardStyle()}>
                {/* Filters */}
                <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
                    <input
                        style={{ ...inputStyle(), minWidth:'240px' }}
                        placeholder="Search by title, author or department…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <span style={{ fontSize:'12px', color:'#6B7280', marginLeft:'auto' }}>
                        {filtered.length} of {ideas.length} ideas · Page {page}/{totalPages}
                    </span>
                </div>

                {filtered.length === 0 && !message ? (
                    <p style={{ margin:0, color:'#6B7280', fontSize:'13px' }}>No ideas match your filter.</p>
                ) : (
                    <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'1000px', fontSize:'13px' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC' }}>
                                    {[
                                        { label: 'Title',      field: 'title' },
                                        { label: 'Author',     field: 'authorName' },
                                        { label: 'Department', field: 'department' },
                                        { label: 'Categories', field: null },
                                        { label: 'Anon',       field: null },
                                        { label: 'Views',      field: 'viewCount' },
                                        { label: '👍',         field: 'upvoteCount' },
                                        { label: '👎',         field: 'downvoteCount' },
                                        { label: '💬',         field: 'commentCount' },
                                        { label: 'Created',    field: 'createdAt' },
                                    ].map(({ label, field }) => (
                                        <th key={label}
                                            onClick={field ? () => handleSort(field) : undefined}
                                            style={{
                                                ...thStyle(),
                                                cursor: field ? 'pointer' : 'default',
                                                userSelect: 'none',
                                                background: field && sortField === field ? '#EEF2FF' : 'transparent',
                                                color: field && sortField === field ? '#3730A3' : undefined,
                                                whiteSpace: 'nowrap',
                                            }}>
                                            {label}{field && <SortIcon field={field} />}
                                        </th>
                                    ))}
                                    <th style={{ ...thStyle(), cursor: 'default' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map(idea => {
                                    const allowManage = canManageIdea(user, idea);
                                    const cats = Array.isArray(idea.categories) ? idea.categories : [];
                                    const commentCount = Array.isArray(idea.comments) ? idea.comments.length : 0;
                                    return (
                                        <tr key={idea.ideaId}>
                                            <td style={{ ...tdStyle(), maxWidth:'180px' }}>
                                                <div style={{ fontWeight:600, lineHeight:1.3 }}>{idea.title}</div>
                                            </td>
                                            <td style={tdStyle()}>{idea.authorName}</td>
                                            <td style={tdStyle()}>{idea.departmentName}</td>
                                            <td style={tdStyle()}>
                                                {cats.length > 0
                                                    ? cats.map(c => <span key={c} style={categoryTagStyle()}>{c}</span>)
                                                    : <span style={{ color:'#9CA3AF' }}>—</span>}
                                            </td>
                                            <td style={{ ...tdStyle(), textAlign:'center' }}>{idea.isAnonymous ? 'Yes' : 'No'}</td>
                                            <td style={{ ...tdStyle(), textAlign:'center' }}>{idea.viewCount || 0}</td>
                                            <td style={{ ...tdStyle(), textAlign:'center', color:'#059669', fontWeight:700 }}>{idea.upvoteCount || 0}</td>
                                            <td style={{ ...tdStyle(), textAlign:'center', color:'#DC2626', fontWeight:700 }}>{idea.downvoteCount || 0}</td>
                                            <td style={{ ...tdStyle(), textAlign:'center' }}>{commentCount}</td>
                                            <td style={{ ...tdStyle(), whiteSpace:'nowrap', fontSize:'12px' }}>
                                                {new Date(idea.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                                            </td>
                                            <td style={tdStyle()}>
                                                <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                                                    <button type="button" style={tinyButtonStyle('neutral')} onClick={() => window.location.href='/ideas/'+idea.ideaId}>View</button>
                                                    {allowManage && (<>
                                                        <button type="button" style={tinyButtonStyle('primary')} onClick={() => window.location.href='/ideas/'+idea.ideaId+'/edit'}>Edit</button>
                                                        <button type="button" style={tinyButtonStyle('danger')} onClick={() => deleteIdea(idea)} disabled={deletingId === idea.ideaId}>
                                                            {deletingId === idea.ideaId ? '…' : 'Delete'}
                                                        </button>
                                                    </>)}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'1rem', paddingTop:'1rem', borderTop:'1px solid #F3F4F6' }}>
                        <span style={{ fontSize:'12px', color:'#6B7280' }}>
                            Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length} ideas
                        </span>
                        <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
                            <button onClick={() => setPage(1)} disabled={page===1}
                                style={{ padding:'5px 9px', borderRadius:'6px', border:'1px solid #E5E7EB', background:page===1?'#F9FAFB':'#fff', color:page===1?'#D1D5DB':'#374151', fontSize:'12px', fontWeight:600, cursor:page===1?'default':'pointer', fontFamily:'inherit' }}>«</button>
                            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                                style={{ padding:'5px 10px', borderRadius:'6px', border:'1px solid #E5E7EB', background:page===1?'#F9FAFB':'#fff', color:page===1?'#D1D5DB':'#374151', fontSize:'12px', fontWeight:600, cursor:page===1?'default':'pointer', fontFamily:'inherit' }}>‹ Prev</button>
                            {Array.from({length:totalPages},(_,i)=>i+1)
                                .filter(p => p===1||p===totalPages||Math.abs(p-page)<=1)
                                .reduce((acc,p,i,arr) => { if(i>0&&p-arr[i-1]>1)acc.push('…'); acc.push(p); return acc; }, [])
                                .map((p,i) => p==='…'
                                    ? <span key={`e${i}`} style={{ padding:'5px 6px', fontSize:'12px', color:'#9CA3AF' }}>…</span>
                                    : <button key={p} onClick={() => setPage(p)}
                                        style={{ padding:'5px 10px', borderRadius:'6px', border:`1px solid ${page===p?'#2563EB':'#E5E7EB'}`, background:page===p?'#2563EB':'#fff', color:page===p?'#fff':'#374151', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', minWidth:'32px' }}>{p}</button>
                                )}
                            <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                                style={{ padding:'5px 10px', borderRadius:'6px', border:'1px solid #E5E7EB', background:page===totalPages?'#F9FAFB':'#fff', color:page===totalPages?'#D1D5DB':'#374151', fontSize:'12px', fontWeight:600, cursor:page===totalPages?'default':'pointer', fontFamily:'inherit' }}>Next ›</button>
                            <button onClick={() => setPage(totalPages)} disabled={page===totalPages}
                                style={{ padding:'5px 9px', borderRadius:'6px', border:'1px solid #E5E7EB', background:page===totalPages?'#F9FAFB':'#fff', color:page===totalPages?'#D1D5DB':'#374151', fontSize:'12px', fontWeight:600, cursor:page===totalPages?'default':'pointer', fontFamily:'inherit' }}>»</button>
                        </div>
                    </div>
                )}
            </div>
        </StaffShell>
    );
}

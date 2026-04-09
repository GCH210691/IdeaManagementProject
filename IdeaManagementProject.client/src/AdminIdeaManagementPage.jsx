import { useEffect, useMemo, useState } from 'react';
import AdminShell from './shells/AdminShell';
import { BASE_URL, getAuthHeaders, getAuthSession, roleToPath } from './shared/authStorage';
import { card } from './theme';

/* ─── Style helpers ────────────────────────────────────────────────── */
const s = {
    pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' },
    h1: { margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 900, color: '#111827' },
    sub: { margin: 0, fontSize: '13px', color: '#6B7280' },
    card: { background: '#fff', borderRadius: '12px', border: '1px solid #F3F4F6', padding: '1.25rem', marginBottom: '1.25rem', boxSizing: 'border-box' },
    filterRow: { display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' },
    input: {
        padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB',
        fontSize: '13px', fontFamily: 'inherit', outline: 'none', color: '#111827',
        background: '#F9FAFB', minWidth: '220px',
    },
    select: {
        padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB',
        fontSize: '13px', fontFamily: 'inherit', outline: 'none', color: '#111827',
        background: '#F9FAFB', cursor: 'pointer',
    },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px', fontSize: '13px' },
    th: { textAlign: 'left', padding: '0.65rem 0.75rem', fontSize: '11px', fontWeight: 700, color: '#6B7280', borderBottom: '1px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' },
    td: { padding: '0.75rem', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle', color: '#111827' },
    btn: (tone) => {
        const map = {
            danger:   { background: '#FEE2E2', color: '#991B1B' },
            blue:     { background: '#DBEAFE', color: '#1E40AF' },
            neutral:  { background: '#E5E7EB', color: '#374151' },
            amber:    { background: '#FEF3C7', color: '#92400E' },
        };
        return { border: 'none', borderRadius: '6px', padding: '4px 9px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', ...map[tone] };
    },
    catTag: { display: 'inline-block', padding: '2px 7px', marginRight: '3px', borderRadius: '999px', background: '#EEF2FF', color: '#3730A3', fontSize: '10px', fontWeight: 600 },
    badge: (open) => ({
        display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
        background: open ? '#DCFCE7' : '#FEE2E2', color: open ? '#166534' : '#991B1B',
    }),
    modalOverlay: {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
    },
    modalBox: {
        background: '#fff', borderRadius: '14px', padding: '1.75rem',
        width: '420px', maxWidth: '94vw', boxSizing: 'border-box',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    },
    modalTitle: { margin: '0 0 0.5rem 0', fontSize: '15px', fontWeight: 800, color: '#111827' },
    modalSub: { margin: '0 0 1.25rem 0', fontSize: '13px', color: '#6B7280' },
    label: { display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' },
    dateInput: { width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', fontFamily: 'inherit', outline: 'none', color: '#111827', boxSizing: 'border-box' },
    modalBtns: { display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', marginTop: '1.25rem' },
    primaryBtn: { padding: '0.55rem 1.1rem', borderRadius: '8px', border: 'none', background: '#3B82F6', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
    cancelBtn: { padding: '0.55rem 1.1rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
};

function formatDate(val) {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ClosureDateModal({ idea, onClose, onSaved }) {
    const [commentEndAt, setCommentEndAt] = useState(
        idea?.commentEndAt ? new Date(idea.commentEndAt).toISOString().slice(0, 16) : ''
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function handleSave() {
        if (!commentEndAt) { setError('Please select a date.'); return; }
        setSaving(true);
        setError('');
        try {
            const endpoint = BASE_URL
                ? `${BASE_URL}/api/admin/ideas/${idea.ideaId}/comment-end-at`
                : `/api/admin/ideas/${idea.ideaId}/comment-end-at`;
            const res = await fetch(endpoint, {
                method: 'PATCH',
                headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
                body: JSON.stringify({ commentEndAt: new Date(commentEndAt).toISOString() }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                setError(data?.message || `Save failed (${res.status})`);
                return;
            }
            onSaved && onSaved({ ...idea, commentEndAt: new Date(commentEndAt).toISOString() });
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div style={s.modalOverlay} onClick={onClose}>
            <div style={s.modalBox} onClick={e => e.stopPropagation()}>
                <h2 style={s.modalTitle}>Assign Comment Closure Date</h2>
                <p style={s.modalSub}>
                    Idea: <strong>{idea?.title}</strong>
                </p>
                <div style={{ marginBottom: '0.75rem', padding: '0.6rem 0.75rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', fontSize: '12px', color: '#1E40AF' }}>
                    ℹ This updates the comment closure date for all ideas in the same closure period.
                </div>
                <label style={s.label}>Comment closes at</label>
                <input
                    type="datetime-local"
                    style={s.dateInput}
                    value={commentEndAt}
                    onChange={e => setCommentEndAt(e.target.value)}
                />
                {error && <p style={{ margin: '0.5rem 0 0 0', fontSize: '12px', color: '#DC2626' }}>{error}</p>}
                <div style={s.modalBtns}>
                    <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
                    <button style={s.primaryBtn} onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminIdeaManagementPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;

    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState('desc');
    const [deletingId, setDeletingId] = useState(0);
    const [closureModal, setClosureModal] = useState(null);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    function handleSort(field) {
        setPage(1);
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    }
    function SortIcon({ field }) {
        if (sortField !== field) return <span style={{ color: '#D1D5DB', marginLeft: '4px' }}>↕</span>;
        return <span style={{ color: '#6366F1', marginLeft: '4px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
    }

    useEffect(() => {
        if (!session?.token || !user) { window.location.href = '/login'; return; }
        if (user.role !== 'ADMIN') { window.location.href = roleToPath(user.role); return; }
        loadIdeas();
    }, [session, user]);

    async function loadIdeas() {
        setLoading(true);
        setError('');
        try {
            const endpoint = BASE_URL ? `${BASE_URL}/api/ideas` : '/api/ideas';
            const res = await fetch(endpoint, { headers: getAuthHeaders({ Accept: 'application/json' }) });
            if (res.status === 401) { window.location.href = '/login'; return; }
            if (!res.ok) { setError(`Failed to load ideas: ${res.status}`); return; }
            const data = await res.json();
            setIdeas(Array.isArray(data) ? data : []);
        } catch (e) {
            setError('Load error: ' + (e instanceof Error ? e.message : String(e)));
        } finally {
            setLoading(false);
        }
    }

    async function deleteIdea(idea) {
        if (!window.confirm(`Delete idea "${idea.title}"?\nThis cannot be undone.`)) return;
        setDeletingId(idea.ideaId);
        try {
            const endpoint = BASE_URL ? `${BASE_URL}/api/ideas/${idea.ideaId}` : `/api/ideas/${idea.ideaId}`;
            const res = await fetch(endpoint, {
                method: 'DELETE',
                headers: getAuthHeaders({ Accept: 'application/json' }),
            });
            if (res.status === 401) { window.location.href = '/login'; return; }
            if (!res.ok) { setError(`Delete failed: ${res.status}`); return; }
            setIdeas(prev => prev.filter(i => i.ideaId !== idea.ideaId));
        } catch (e) {
            setError('Delete error: ' + (e instanceof Error ? e.message : String(e)));
        } finally {
            setDeletingId(0);
        }
    }

    const filtered = useMemo(() => {
        setPage(1);
        let list = [...ideas];
        const q = search.trim().toLowerCase();
        if (q) {
            list = list.filter(i =>
                i.title?.toLowerCase().includes(q) ||
                i.authorName?.toLowerCase().includes(q) ||
                i.departmentName?.toLowerCase().includes(q)
            );
        }
        const dir = sortDir === 'asc' ? 1 : -1;
        list.sort((a, b) => {
            switch (sortField) {
                case 'title':        return dir * (a.title||'').localeCompare(b.title||'');
                case 'authorName':   return dir * (a.authorName||'').localeCompare(b.authorName||'');
                case 'department':   return dir * (a.departmentName||'').localeCompare(b.departmentName||'');
                case 'viewCount':    return dir * ((a.viewCount||0) - (b.viewCount||0));
                case 'upvoteCount':  return dir * ((a.upvoteCount||0) - (b.upvoteCount||0));
                case 'commentCount': return dir * ((Array.isArray(a.comments)?a.comments.length:0) - (Array.isArray(b.comments)?b.comments.length:0));
                case 'commentEndAt': return dir * (new Date(a.commentEndAt||0) - new Date(b.commentEndAt||0));
                case 'createdAt':
                default:             return dir * (new Date(a.createdAt) - new Date(b.createdAt));
            }
        });
        return list;
    }, [ideas, search, sortField, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    if (!session?.token || !user || user.role !== 'ADMIN') return null;

    return (
        <AdminShell activeMenu="idea-management">
            <div style={s.pageHeader}>
                <div>
                    <h1 style={s.h1}>Idea Management</h1>
                    <p style={s.sub}>View, delete, and manage all submitted ideas across the system.</p>
                </div>
                <button
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#3B82F6', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                    onClick={loadIdeas}>
                    {loading ? 'Loading…' : 'Refresh'}
                </button>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Total ideas', value: ideas.length },
                    { label: 'Total views', value: ideas.reduce((s, i) => s + (i.viewCount || 0), 0) },
                    { label: 'Total upvotes', value: ideas.reduce((s, i) => s + (i.upvoteCount || 0), 0) },
                    { label: 'Total comments', value: ideas.reduce((s, i) => s + (i.comments?.length || 0), 0) },
                ].map(stat => (
                    <div key={stat.label} style={s.card}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827' }}>{loading ? '…' : stat.value.toLocaleString()}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '13px', color: '#DC2626' }}>
                    ⚠️ {error}
                </div>
            )}

            <div style={s.card}>
                {/* Filters */}
                <div style={s.filterRow}>
                    <input
                        style={s.input}
                        placeholder="Search by title, author or department…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <span style={{ fontSize: '12px', color: '#6B7280', marginLeft: 'auto' }}>
                        {filtered.length} of {ideas.length} ideas · Page {page}/{totalPages}
                    </span>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', color: '#6B7280', padding: '2rem' }}>Loading ideas…</p>
                    ) : filtered.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#6B7280', padding: '2rem' }}>No ideas found.</p>
                    ) : (
                        <table style={s.table}>
                            <thead>
                                <tr style={{ background: '#F8FAFC' }}>
                                    {[
                                        { label: '#',             field: null },
                                        { label: 'Title',         field: 'title' },
                                        { label: 'Author',        field: 'authorName' },
                                        { label: 'Department',    field: 'department' },
                                        { label: 'Categories',    field: null },
                                        { label: 'Views',         field: 'viewCount' },
                                        { label: '👍/👎',        field: 'upvoteCount' },
                                        { label: '💬',            field: 'commentCount' },
                                        { label: 'Comment closes',field: 'commentEndAt' },
                                        { label: 'Status',        field: null },
                                        { label: 'Created',       field: 'createdAt' },
                                    ].map(({ label, field }) => (
                                        <th key={label}
                                            onClick={field ? () => handleSort(field) : undefined}
                                            style={{
                                                ...s.th,
                                                cursor: field ? 'pointer' : 'default',
                                                userSelect: 'none',
                                                background: field && sortField === field ? '#EEF2FF' : 'transparent',
                                                color: field && sortField === field ? '#3730A3' : undefined,
                                                whiteSpace: 'nowrap',
                                            }}>
                                            {label}{field && <SortIcon field={field} />}
                                        </th>
                                    ))}
                                    <th style={{ ...s.th, width: '110px', cursor: 'default' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((idea, idx) => {
                                    const cats = Array.isArray(idea.categories) ? idea.categories : [];
                                    const commentCount = Array.isArray(idea.comments) ? idea.comments.length : 0;
                                    return (
                                        <tr key={idea.ideaId} style={{ background: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                                            <td style={{ ...s.td, color: '#9CA3AF', fontSize: '11px', width: '36px' }}>{idea.ideaId}</td>
                                            <td style={{ ...s.td, maxWidth: '200px' }}>
                                                <div style={{ fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>{idea.title}</div>
                                                {idea.isAnonymous && (
                                                    <span style={{ fontSize: '10px', color: '#9CA3AF' }}>Anonymous</span>
                                                )}
                                            </td>
                                            <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{idea.authorName}</td>
                                            <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{idea.departmentName}</td>
                                            <td style={s.td}>
                                                {cats.length > 0
                                                    ? cats.map(c => <span key={c} style={s.catTag}>{c}</span>)
                                                    : <span style={{ color: '#D1D5DB', fontSize: '11px' }}>—</span>}
                                            </td>
                                            <td style={{ ...s.td, textAlign: 'center' }}>{idea.viewCount || 0}</td>
                                            <td style={{ ...s.td, textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                <span style={{ color: '#059669', fontWeight: 700 }}>+{idea.upvoteCount || 0}</span>
                                                {' / '}
                                                <span style={{ color: '#DC2626', fontWeight: 700 }}>-{idea.downvoteCount || 0}</span>
                                            </td>
                                            <td style={{ ...s.td, textAlign: 'center' }}>{commentCount}</td>
                                            <td style={{ ...s.td, whiteSpace: 'nowrap', fontSize: '12px' }}>
                                                {formatDate(idea.commentEndAt)}
                                            </td>
                                            <td style={s.td}>
                                                <span style={s.badge(idea.isCommentOpen)}>
                                                    {idea.isCommentOpen ? 'Open' : 'Closed'}
                                                </span>
                                            </td>
                                            <td style={{ ...s.td, whiteSpace: 'nowrap', fontSize: '12px' }}>
                                                {formatDate(idea.createdAt)}
                                            </td>
                                            <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-start' }}>
                                                    <button
                                                        style={{ ...s.btn('blue'), width: '100%', textAlign: 'center' }}
                                                        onClick={() => window.location.href = `/ideas/${idea.ideaId}`}>
                                                        👁 View
                                                    </button>
                                                    <button
                                                        style={{ ...s.btn('amber'), width: '100%', textAlign: 'center' }}
                                                        onClick={() => setClosureModal(idea)}>
                                                        📅 Set closure
                                                    </button>
                                                    <button
                                                        style={{ ...s.btn('danger'), width: '100%', textAlign: 'center' }}
                                                        onClick={() => deleteIdea(idea)}
                                                        disabled={deletingId === idea.ideaId}>
                                                        {deletingId === idea.ideaId ? '⏳ Deleting…' : '🗑 Delete'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #F3F4F6' }}>
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>
                            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} ideas
                        </span>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button onClick={() => setPage(1)} disabled={page === 1}
                                style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid #E5E7EB', background: page === 1 ? '#F9FAFB' : '#fff', color: page === 1 ? '#D1D5DB' : '#374151', fontSize: '12px', fontWeight: 600, cursor: page === 1 ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                                «
                            </button>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #E5E7EB', background: page === 1 ? '#F9FAFB' : '#fff', color: page === 1 ? '#D1D5DB' : '#374151', fontSize: '12px', fontWeight: 600, cursor: page === 1 ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                                ‹ Prev
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                .reduce((acc, p, i, arr) => {
                                    if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, i) => p === '…'
                                    ? <span key={`ellipsis-${i}`} style={{ padding: '5px 6px', fontSize: '12px', color: '#9CA3AF' }}>…</span>
                                    : <button key={p} onClick={() => setPage(p)}
                                        style={{ padding: '5px 10px', borderRadius: '6px', border: `1px solid ${page === p ? '#3B82F6' : '#E5E7EB'}`, background: page === p ? '#3B82F6' : '#fff', color: page === p ? '#fff' : '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minWidth: '32px' }}>
                                        {p}
                                    </button>
                                )}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #E5E7EB', background: page === totalPages ? '#F9FAFB' : '#fff', color: page === totalPages ? '#D1D5DB' : '#374151', fontSize: '12px', fontWeight: 600, cursor: page === totalPages ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                                Next ›
                            </button>
                            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                                style={{ padding: '5px 9px', borderRadius: '6px', border: '1px solid #E5E7EB', background: page === totalPages ? '#F9FAFB' : '#fff', color: page === totalPages ? '#D1D5DB' : '#374151', fontSize: '12px', fontWeight: 600, cursor: page === totalPages ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                                »
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Closure date modal */}
            {closureModal && (
                <ClosureDateModal
                    idea={closureModal}
                    onClose={() => setClosureModal(null)}
                    onSaved={(updated) => {
                        setIdeas(prev => prev.map(i => i.ideaId === updated.ideaId ? updated : i));
                        setClosureModal(null);
                    }}
                />
            )}
        </AdminShell>
    );
}

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

function pageHeaderStyle() {
    return {
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
    };
}

function h1Style() {
    return { margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 900, color: '#111827' };
}

function subStyle() {
    return { margin: 0, fontSize: '13px', color: '#6B7280' };
}

function actionButtonStyle() {
    return {
        border: 'none',
        borderRadius: '8px',
        padding: '0.55rem 0.9rem',
        fontSize: '12px',
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
        color: '#111827',
        background: '#E5E7EB',
    };
}

function statsGridStyle() {
    return {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '1.25rem',
    };
}

function statCardStyle() {
    return {
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #F3F4F6',
        padding: '1.25rem',
        boxSizing: 'border-box',
    };
}

function statTopRowStyle() {
    return { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' };
}

function changeBadgeStyle(positive = true) {
    return {
        fontSize: '11px',
        fontWeight: 700,
        color: positive ? '#059669' : '#6B7280',
        background: positive ? '#ECFDF5' : '#F3F4F6',
        padding: '2px 8px',
        borderRadius: '999px',
    };
}

function tabBarStyle() {
    return {
        display: 'flex',
        background: '#E5E7EB',
        borderRadius: '10px',
        padding: '4px',
        width: 'fit-content',
        marginBottom: '1.25rem',
    };
}

function tabBtnStyle(active) {
    return {
        padding: '6px 16px',
        borderRadius: '7px',
        fontSize: '13px',
        fontWeight: 700,
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        background: active ? '#fff' : 'transparent',
        color: active ? '#111827' : '#6B7280',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
        transition: 'all 0.2s',
    };
}

function ideasGridStyle() {
    return {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '1.25rem',
    };
}

function ideaCardStyle() {
    return {
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #F3F4F6',
        padding: '1rem',
        boxSizing: 'border-box',
    };
}

function badgeStyle() {
    return {
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '999px',
        background: '#EEF2FF',
        color: '#3730A3',
        maxWidth: '160px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    };
}

function hotTagStyle() {
    return { fontSize: '11px', fontWeight: 700, color: '#F97316' };
}

function sectionStyle() {
    return {
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #F3F4F6',
        padding: '1.25rem',
    };
}

function rowStyle() {
    return {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #F9FAFB',
        marginBottom: '0.75rem',
    };
}

function avatarStyle() {
    return {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: '#3B82F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 700,
        flexShrink: 0,
    };
}

function tinyButtonStyle(tone = 'neutral') {
    const map = {
        neutral: { background: '#E5E7EB', color: '#111827' },
        primary: { background: '#DBEAFE', color: '#1E40AF' },
        danger: { background: '#FEE2E2', color: '#991B1B' },
    };

    return {
        border: 'none',
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '11px',
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
        ...map[tone],
    };
}

function toRelativeTime(value) {
    if (!value) {
        return 'Unknown time';
    }

    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();

    if (Number.isNaN(diffMs) || diffMs < 0) {
        return 'Just now';
    }

    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) {
        return 'Just now';
    }
    if (diffMin < 60) {
        return `${diffMin}m ago`;
    }

    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) {
        return `${diffHour}h ago`;
    }

    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d ago`;
}

function isToday(value) {
    const date = new Date(value);
    const now = new Date();

    return date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
        && date.getDate() === now.getDate();
}

export default function Dashboard() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;

    const [tab, setTab] = useState('recent');
    const [ideas, setIdeas] = useState([]);
    const [message, setMessage] = useState('Loading dashboard data...');
    const [actionMessage, setActionMessage] = useState('');
    const [deletingId, setDeletingId] = useState(0);

    useEffect(() => {
        if (!session?.token || !user) {
            window.location.href = '/login';
            return;
        }

        if (!isDashboardRole(user)) {
            window.location.href = roleToPath(user.role);
            return;
        }

        let cancelled = false;

        async function loadIdeas() {
            try {
                const endpoint = BASE_URL ? `${BASE_URL}/api/ideas` : '/api/ideas';
                const response = await fetch(endpoint, {
                    headers: getAuthHeaders({ Accept: 'application/json' }),
                });

                if (response.status === 401) {
                    window.location.href = '/login';
                    return;
                }

                if (!response.ok) {
                    setMessage(`Unable to load ideas: ${response.status}`);
                    return;
                }

                const payload = await response.json();
                if (cancelled) {
                    return;
                }

                setIdeas(Array.isArray(payload) ? payload : []);
                setMessage('');
            } catch (error) {
                const details = error instanceof Error ? error.message : String(error);
                setMessage(`Load error: ${details}`);
            }
        }

        loadIdeas();

        return () => {
            cancelled = true;
        };
    }, [session, user]);

    const username = getDisplayName(user);
    const myIdeas = useMemo(
        () => ideas.filter((idea) => Number(idea.authorUserId) === Number(user?.id)),
        [ideas, user?.id],
    );

    const sortedIdeas = useMemo(() => {
        const items = [...ideas];

        if (tab === 'hot') {
            items.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        } else {
            items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return items;
    }, [ideas, tab]);

    const ideaCards = useMemo(() => sortedIdeas.slice(0, 6), [sortedIdeas]);

    const latestActivity = useMemo(() => {
        return [...ideas]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
    }, [ideas]);

    const stats = useMemo(() => {
        const todayIdeas = ideas.filter((idea) => isToday(idea.createdAt)).length;
        const totalViews = ideas.reduce((sum, idea) => sum + (idea.viewCount || 0), 0);

        return {
            todayIdeas,
            myIdeas: myIdeas.length,
            totalViews,
        };
    }, [ideas, myIdeas.length]);

    function refreshIdeas() {
        window.location.reload();
    }

    function viewIdea(ideaId) {
        window.location.href = `/ideas/${ideaId}`;
    }

    function editIdea(idea) {
        if (!canManageIdea(user, idea)) {
            return;
        }

        window.location.href = `/ideas/${idea.ideaId}/edit`;
    }

    async function deleteIdea(idea) {
        if (!canManageIdea(user, idea)) {
            setActionMessage('You can only manage your own ideas.');
            return;
        }

        if (!window.confirm(`Delete idea "${idea.title}"?`)) {
            return;
        }

        setDeletingId(idea.ideaId);
        setActionMessage('');

        try {
            const endpoint = BASE_URL ? `${BASE_URL}/api/ideas/${idea.ideaId}` : `/api/ideas/${idea.ideaId}`;
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: getAuthHeaders({ Accept: 'application/json' }),
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (response.status === 403) {
                setActionMessage('You can only manage your own ideas.');
                return;
            }

            if (response.status === 404) {
                setActionMessage('Idea not found.');
                setIdeas((current) => current.filter((item) => item.ideaId !== idea.ideaId));
                return;
            }

            if (!response.ok) {
                setActionMessage(`Delete failed: ${response.status}`);
                return;
            }

            setIdeas((current) => current.filter((item) => item.ideaId !== idea.ideaId));
            setActionMessage('Idea deleted.');
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setActionMessage(`Delete error: ${details}`);
        } finally {
            setDeletingId(0);
        }
    }

    if (!session?.token || !user) {
        return null;
    }

    return (
        <StaffShell activeMenu="dashboard" footerText={`${ideas.length} ideas in DB`}>
            <div style={pageHeaderStyle()}>
                <div>
                    <h1 style={h1Style()}>Staff Dashboard</h1>
                    <p style={subStyle()}>{`Welcome back, ${username}. Here is the current overview.`}</p>
                </div>
                <button type="button" style={actionButtonStyle()} onClick={refreshIdeas}>Refresh data</button>
            </div>

            <div style={statsGridStyle()}>
                <div style={statCardStyle()}>
                    <div style={statTopRowStyle()}>
                        <span style={{ fontSize: '24px' }}>ID</span>
                        <span style={changeBadgeStyle(stats.todayIdeas > 0)}>{stats.todayIdeas > 0 ? 'Today' : 'No new yet'}</span>
                    </div>
                    <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#111827' }}>{stats.todayIdeas}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Ideas created today</div>
                </div>
                <div style={statCardStyle()}>
                    <div style={statTopRowStyle()}>
                        <span style={{ fontSize: '24px' }}>MY</span>
                        <span style={changeBadgeStyle(myIdeas.length > 0)}>{myIdeas.length > 0 ? 'Your contributions' : 'No post yet'}</span>
                    </div>
                    <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#111827' }}>{myIdeas.length}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Ideas you created</div>
                </div>
                <div style={statCardStyle()}>
                    <div style={statTopRowStyle()}>
                        <span style={{ fontSize: '24px' }}>VW</span>
                        <span style={changeBadgeStyle(stats.totalViews > 0)}>{stats.totalViews > 0 ? 'Live data' : 'Waiting data'}</span>
                    </div>
                    <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#111827' }}>{stats.totalViews}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Total idea views</div>
                </div>
            </div>

            <div style={tabBarStyle()}>
                <button style={tabBtnStyle(tab === 'recent')} onClick={() => setTab('recent')}>Recent</button>
                <button style={tabBtnStyle(tab === 'hot')} onClick={() => setTab('hot')}>Most viewed</button>
            </div>

            {message && <p style={{ color: '#B91C1C', marginTop: 0 }}>{message}</p>}
            {actionMessage && <p style={{ color: actionMessage.includes('deleted') ? '#065F46' : '#B91C1C', marginTop: 0 }}>{actionMessage}</p>}

            {!message && ideaCards.length === 0 && (
                <div style={sectionStyle()}>
                    <p style={{ margin: 0, color: '#6B7280', fontSize: '13px' }}>No ideas to show yet.</p>
                </div>
            )}

            {!message && ideaCards.length > 0 && (
                <div style={ideasGridStyle()}>
                    {ideaCards.map((idea, index) => {
                        const allowManage = canManageIdea(user, idea);

                        return (
                        <div key={idea.ideaId} style={ideaCardStyle()}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={badgeStyle()}>{idea.departmentName || 'Department'}</span>
                                    {tab === 'hot' && index < 3 && <span style={hotTagStyle()}>Hot</span>}
                                </div>
                                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{toRelativeTime(idea.createdAt)}</span>
                            </div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 700, color: '#111827', lineHeight: 1.4 }}>
                                {idea.title}
                            </h3>
                            <p style={{ margin: '0 0 0.75rem 0', fontSize: '12px', color: '#6B7280' }}>
                                by {idea.authorName}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '12px', color: '#6B7280', marginBottom: '0.75rem' }}>
                                <span>Views {idea.viewCount || 0}</span>
                                <span>{idea.isAnonymous ? 'Anonymous' : 'Named'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <button type="button" style={tinyButtonStyle('neutral')} onClick={() => viewIdea(idea.ideaId)}>View</button>
                                {allowManage && (
                                    <>
                                        <button type="button" style={tinyButtonStyle('primary')} onClick={() => editIdea(idea)}>Edit</button>
                                        <button
                                            type="button"
                                            style={tinyButtonStyle('danger')}
                                            onClick={() => deleteIdea(idea)}
                                            disabled={deletingId === idea.ideaId}>
                                            {deletingId === idea.ideaId ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}

            {!message && latestActivity.length > 0 && (
                <div style={sectionStyle()}>
                    <h2 style={{ margin: '0 0 1rem 0', fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>
                        Latest database activity
                    </h2>
                    {latestActivity.map((item, index) => (
                        <div
                            key={item.ideaId}
                            style={{
                                ...rowStyle(),
                                ...(index === latestActivity.length - 1
                                    ? { borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }
                                    : {}),
                            }}>
                            <div style={avatarStyle()}>{(item.authorName || 'U').slice(0, 1).toUpperCase()}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937' }}>{item.authorName}</span>
                                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>created</span>
                                    <span style={{ fontSize: '12px', color: '#3B82F6' }}>{item.title}</span>
                                    <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: 'auto' }}>{toRelativeTime(item.createdAt)}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '12px', color: '#4B5563' }}>
                                    Department: {item.departmentName} | Views: {item.viewCount || 0}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </StaffShell>
    );
}


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

function actionButtonStyle(primary = false) {
    return {
        border: 'none',
        borderRadius: '8px',
        padding: '0.55rem 0.9rem',
        fontSize: '12px',
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
        color: primary ? '#fff' : '#111827',
        background: primary ? '#2563EB' : '#E5E7EB',
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

function categoryTagStyle() {
    return {
        display: 'inline-block',
        padding: '2px 8px',
        marginRight: '0.35rem',
        marginBottom: '0.35rem',
        borderRadius: '999px',
        background: '#DBEAFE',
        color: '#1D4ED8',
        fontSize: '11px',
        fontWeight: 600,
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

function sectionStyle() {
    return {
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #F3F4F6',
        padding: '1.25rem',
    };
}

function statRowStyle() {
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
        padding: '1rem',
        boxSizing: 'border-box',
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

    return `${Math.floor(diffHour / 24)}d ago`;
}

export default function MyIdeasPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;

    const [ideas, setIdeas] = useState([]);
    const [message, setMessage] = useState('Loading your ideas...');
    const [deletingId, setDeletingId] = useState(0);
    const [actionMessage, setActionMessage] = useState('');

    useEffect(() => {
        if (!session?.token || !user) {
            window.location.href = '/login';
            return;
        }

        if (!canCreateIdeas(user)) {
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

                const allIdeas = Array.isArray(payload) ? payload : [];
                setIdeas(allIdeas.filter((idea) => Number(idea.authorUserId) === Number(user.id)));
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

    const totalViews = useMemo(
        () => ideas.reduce((sum, idea) => sum + (idea.viewCount || 0), 0),
        [ideas],
    );

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
            setActionMessage('You can only delete your own ideas.');
            return;
        }

        if (!window.confirm(`Delete idea "${idea.title}"?`)) {
            return;
        }

        setDeletingId(idea.ideaId);
        setActionMessage('');

        try {
            const response = await fetch(`/api/ideas/${idea.ideaId}`, {
                method: 'DELETE',
                headers: getAuthHeaders({ Accept: 'application/json' }),
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (response.status === 403) {
                setActionMessage('You can only delete your own ideas.');
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
        <StaffShell activeMenu="myideas" footerText={`${ideas.length} personal ideas`}>
            <div style={pageHeaderStyle()}>
                <div>
                    <h1 style={h1Style()}>My Ideas</h1>
                    <p style={subStyle()}>Manage only the ideas you created.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" style={actionButtonStyle()} onClick={() => { window.location.href = '/ideas'; }}>
                        View all ideas
                    </button>
                    {canCreateIdeas(user) && (
                        <button type="button" style={actionButtonStyle(true)} onClick={() => { window.location.href = '/ideas/create'; }}>
                            Create idea
                        </button>
                    )}
                </div>
            </div>

            <div style={statRowStyle()}>
                <div style={statCardStyle()}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827' }}>{ideas.length}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Ideas you own</div>
                </div>
                <div style={statCardStyle()}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827' }}>{totalViews}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Combined views</div>
                </div>
                <div style={statCardStyle()}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827' }}>{ideas.filter((idea) => idea.isAnonymous).length}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Anonymous submissions</div>
                </div>
            </div>

            {message && <p style={{ color: '#B91C1C', marginTop: 0 }}>{message}</p>}
            {actionMessage && <p style={{ color: actionMessage.includes('deleted') ? '#065F46' : '#B91C1C', marginTop: 0 }}>{actionMessage}</p>}

            {!message && ideas.length === 0 && (
                <div style={sectionStyle()}>
                    <p style={{ margin: 0, color: '#6B7280', fontSize: '13px' }}>You have not created any ideas yet.</p>
                </div>
            )}

            {!message && ideas.length > 0 && (
                <div style={ideasGridStyle()}>
                    {ideas.map((idea) => (
                        <div key={idea.ideaId} style={ideaCardStyle()}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={badgeStyle()}>{idea.departmentName || 'Department'}</span>
                                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{toRelativeTime(idea.createdAt)}</span>
                            </div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 700, color: '#111827', lineHeight: 1.4 }}>
                                {idea.title}
                            </h3>
                            <div style={{ marginBottom: '0.5rem' }}>
                                {(Array.isArray(idea.categories) ? idea.categories : []).map((category) => (
                                    <span key={category} style={categoryTagStyle()}>{category}</span>
                                ))}
                                {(!Array.isArray(idea.categories) || idea.categories.length === 0) && (
                                    <span style={{ color: '#9CA3AF', fontSize: '12px' }}>No categories</span>
                                )}
                            </div>
                            <p style={{ margin: '0 0 0.75rem 0', fontSize: '12px', color: '#6B7280' }}>
                                Views {idea.viewCount || 0} | {idea.isAnonymous ? 'Anonymous' : 'Named'}
                            </p>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <button type="button" style={tinyButtonStyle('neutral')} onClick={() => viewIdea(idea.ideaId)}>View</button>
                                <button type="button" style={tinyButtonStyle('primary')} onClick={() => editIdea(idea)}>Edit</button>
                                <button
                                    type="button"
                                    style={tinyButtonStyle('danger')}
                                    onClick={() => deleteIdea(idea)}
                                    disabled={deletingId === idea.ideaId}>
                                    {deletingId === idea.ideaId ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </StaffShell>
    );
}

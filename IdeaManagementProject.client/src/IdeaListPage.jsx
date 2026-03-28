import { useEffect, useMemo, useState } from 'react';
import { canCreateIdeas, canManageIdea, getAuthHeaders, getAuthSession } from './authStorage';
import StaffShell from './StaffShell';

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

function cardStyle() {
    return {
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #F3F4F6',
        padding: '1.25rem',
    };
}

function tableStyle() {
    return {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '1080px',
    };
}

function thStyle() {
    return {
        textAlign: 'left',
        borderBottom: '1px solid #E5E7EB',
        padding: '0.75rem',
        fontSize: '12px',
        color: '#6B7280',
    };
}

function tdStyle() {
    return {
        textAlign: 'left',
        borderBottom: '1px solid #F3F4F6',
        padding: '0.75rem',
        verticalAlign: 'top',
        fontSize: '13px',
        color: '#111827',
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

function categoryTagStyle() {
    return {
        display: 'inline-block',
        padding: '2px 8px',
        marginRight: '0.35rem',
        marginBottom: '0.35rem',
        borderRadius: '999px',
        background: '#EEF2FF',
        color: '#3730A3',
        fontSize: '11px',
        fontWeight: 600,
    };
}

export default function IdeaListPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;
    const [ideas, setIdeas] = useState([]);
    const [message, setMessage] = useState('Loading ideas...');
    const [deletingId, setDeletingId] = useState(0);

    useEffect(() => {
        if (!session?.token || !user) {
            window.location.href = '/login';
            return;
        }

        let active = true;

        async function loadIdeas() {
            try {
                const response = await fetch('/api/ideas', {
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

                const data = await response.json();
                if (!active) {
                    return;
                }

                setIdeas(Array.isArray(data) ? data : []);
                setMessage('');
            } catch (error) {
                const details = error instanceof Error ? error.message : String(error);
                setMessage('Load error: ' + details);
            }
        }

        loadIdeas();

        return () => {
            active = false;
        };
    }, [session, user]);

    const allowCreate = useMemo(() => canCreateIdeas(user), [user]);

    function viewIdea(ideaId) {
        window.location.href = `/ideas/${ideaId}`;
    }

    function editIdea(ideaId) {
        window.location.href = `/ideas/${ideaId}/edit`;
    }

    async function downloadCsvExport() {
        try {
            const response = await fetch('/api/ideas/export/csv', {
                headers: getAuthHeaders({ Accept: 'text/csv' }),
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (response.status === 403) {
                setMessage('Only QA managers can download the CSV export.');
                return;
            }

            if (!response.ok) {
                setMessage(`Export failed: ${response.status}`);
                return;
            }

            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const disposition = response.headers.get('content-disposition') || '';
            const matchedName = disposition.match(/filename="?([^"]+)"?/i);

            link.href = downloadUrl;
            link.download = matchedName?.[1] || 'system-data.csv';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage('Export error: ' + details);
        }
    }

    async function deleteIdea(idea) {
        if (!canManageIdea(user, idea)) {
            return;
        }

        if (!window.confirm(`Delete idea "${idea.title}"?`)) {
            return;
        }

        setDeletingId(idea.ideaId);
        setMessage('');

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
                setMessage('You can only delete your own ideas.');
                return;
            }

            if (response.status === 404) {
                setMessage('Idea not found.');
                setIdeas((currentIdeas) => currentIdeas.filter((currentIdea) => currentIdea.ideaId !== idea.ideaId));
                return;
            }

            if (!response.ok) {
                setMessage(`Delete failed: ${response.status}`);
                return;
            }

            setIdeas((currentIdeas) => currentIdeas.filter((currentIdea) => currentIdea.ideaId !== idea.ideaId));
            setMessage('Idea deleted.');
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage('Delete error: ' + details);
        } finally {
            setDeletingId(0);
        }
    }

    if (!session?.token || !user) {
        return null;
    }

    return (
        <StaffShell activeMenu="ideas" footerText={`${ideas.length} ideas in DB`}>
            <div style={pageHeaderStyle()}>
                <div>
                    <h1 style={h1Style()}>Idea List</h1>
                    <p style={subStyle()}>Browse all submitted ideas and manage the ones you own.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {user?.role === 'QA_MANAGER' && (
                        <button type="button" style={actionButtonStyle(true)} onClick={downloadCsvExport}>
                            Download CSV
                        </button>
                    )}
                    {allowCreate && (
                        <button type="button" style={actionButtonStyle(true)} onClick={() => { window.location.href = '/ideas/create'; }}>
                            Create idea
                        </button>
                    )}
                </div>
            </div>

            {message && <p>{message}</p>}

            {!message && ideas.length === 0 && (
                <div style={cardStyle()}>
                    <p style={{ margin: 0, color: '#6B7280', fontSize: '13px' }}>No ideas yet.</p>
                </div>
            )}

            {!message && ideas.length > 0 && (
                <div style={{ ...cardStyle(), overflowX: 'auto' }}>
                    <table style={tableStyle()}>
                        <thead>
                            <tr>
                                <th style={thStyle()}>Title</th>
                                <th style={thStyle()}>Author</th>
                                <th style={thStyle()}>Department</th>
                                <th style={thStyle()}>Categories</th>
                                <th style={thStyle()}>Anonymous</th>
                                <th style={thStyle()}>Views</th>
                                <th style={thStyle()}>Created</th>
                                <th style={thStyle()}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ideas.map((idea) => {
                                const allowManage = canManageIdea(user, idea);
                                const categories = Array.isArray(idea.categories) ? idea.categories : [];

                                return (
                                    <tr key={idea.ideaId}>
                                        <td style={tdStyle()}>{idea.title}</td>
                                        <td style={tdStyle()}>{idea.authorName}</td>
                                        <td style={tdStyle()}>{idea.departmentName}</td>
                                        <td style={tdStyle()}>
                                            {categories.length > 0 ? categories.map((category) => (
                                                <span key={category} style={categoryTagStyle()}>{category}</span>
                                            )) : <span style={{ color: '#9CA3AF' }}>None</span>}
                                        </td>
                                        <td style={tdStyle()}>{idea.isAnonymous ? 'Yes' : 'No'}</td>
                                        <td style={tdStyle()}>{idea.viewCount}</td>
                                        <td style={tdStyle()}>{new Date(idea.createdAt).toLocaleString()}</td>
                                        <td style={tdStyle()}>
                                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                <button type="button" style={tinyButtonStyle('neutral')} onClick={() => viewIdea(idea.ideaId)}>View</button>
                                                {allowManage && (
                                                    <>
                                                        <button type="button" style={tinyButtonStyle('primary')} onClick={() => editIdea(idea.ideaId)}>
                                                            Edit
                                                        </button>
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
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </StaffShell>
    );
}

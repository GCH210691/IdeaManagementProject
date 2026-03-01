import { useEffect, useMemo, useState } from 'react';
import { canCreateIdeas, canManageIdea, getAuthHeaders, getAuthSession } from './authStorage';

function pageStyle() {
    return {
        minHeight: '100vh',
        padding: '2rem',
        boxSizing: 'border-box',
        fontFamily: 'Arial, sans-serif'
    };
}

function tableCellStyle() {
    return {
        textAlign: 'left',
        borderBottom: '1px solid #eee',
        padding: '0.5rem',
        verticalAlign: 'top'
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
                    headers: getAuthHeaders({ Accept: 'application/json' })
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

    function goCreate() {
        window.location.href = '/ideas/create';
    }

    function goDashboard() {
        window.location.href = '/dashboard';
    }

    function viewIdea(ideaId) {
        window.location.href = `/ideas/${ideaId}`;
    }

    function editIdea(ideaId) {
        window.location.href = `/ideas/${ideaId}/edit`;
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
                headers: getAuthHeaders({ Accept: 'application/json' })
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
        <div style={pageStyle()}>
            <h1>Idea List</h1>
            <p>
                {allowCreate && <button onClick={goCreate}>Create idea</button>}
                <button onClick={goDashboard} style={{ marginLeft: allowCreate ? '0.75rem' : 0 }}>Back to dashboard</button>
            </p>

            {message && <p>{message}</p>}

            {!message && ideas.length === 0 && <p>No ideas yet.</p>}

            {!message && ideas.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.5rem' }}>Title</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.5rem' }}>Author</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.5rem' }}>Department</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.5rem' }}>Anonymous</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.5rem' }}>Views</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.5rem' }}>Created</th>
                            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.5rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ideas.map((idea) => {
                            const allowManage = canManageIdea(user, idea);

                            return (
                                <tr key={idea.ideaId}>
                                    <td style={tableCellStyle()}>{idea.title}</td>
                                    <td style={tableCellStyle()}>{idea.authorName}</td>
                                    <td style={tableCellStyle()}>{idea.departmentName}</td>
                                    <td style={tableCellStyle()}>{idea.isAnonymous ? 'Yes' : 'No'}</td>
                                    <td style={tableCellStyle()}>{idea.viewCount}</td>
                                    <td style={tableCellStyle()}>{new Date(idea.createdAt).toLocaleString()}</td>
                                    <td style={tableCellStyle()}>
                                        <button type="button" onClick={() => viewIdea(idea.ideaId)}>View</button>
                                        {allowManage && (
                                            <>
                                                <button type="button" onClick={() => editIdea(idea.ideaId)} style={{ marginLeft: '0.5rem' }}>
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteIdea(idea)}
                                                    style={{ marginLeft: '0.5rem' }}
                                                    disabled={deletingId === idea.ideaId}>
                                                    {deletingId === idea.ideaId ? 'Deleting...' : 'Delete'}
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}

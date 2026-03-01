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

function cardStyle() {
    return {
        maxWidth: '700px',
        margin: '0 auto',
        border: '1px solid #d5d5d5',
        borderRadius: '8px',
        padding: '1.4rem'
    };
}

function getIdeaIdFromPath() {
    const match = window.location.pathname.match(/^\/ideas\/(\d+)\/edit$/i);
    return match ? Number(match[1]) : 0;
}

export default function EditIdeaPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;
    const ideaId = useMemo(() => getIdeaIdFromPath(), []);
    const [idea, setIdea] = useState(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [message, setMessage] = useState('Loading idea...');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!session?.token || !user) {
            window.location.href = '/login';
            return;
        }

        if (!canCreateIdeas(user)) {
            window.location.href = '/dashboard';
            return;
        }

        if (!ideaId) {
            setMessage('Invalid idea id.');
            return;
        }

        let active = true;

        async function loadIdea() {
            try {
                const response = await fetch(`/api/ideas/${ideaId}?incrementViewCount=false`, {
                    headers: getAuthHeaders({ Accept: 'application/json' })
                });

                if (response.status === 401) {
                    window.location.href = '/login';
                    return;
                }

                if (response.status === 404) {
                    setMessage('Idea not found.');
                    return;
                }

                if (!response.ok) {
                    setMessage(`Unable to load idea: ${response.status}`);
                    return;
                }

                const data = await response.json();
                if (!active) {
                    return;
                }

                setIdea(data);
                setTitle(data.title || '');
                setContent(data.content || '');
                setIsAnonymous(Boolean(data.isAnonymous));

                if (!canManageIdea(user, data)) {
                    setMessage('You can only edit your own ideas.');
                    return;
                }

                setMessage('');
            } catch (error) {
                const details = error instanceof Error ? error.message : String(error);
                setMessage('Load error: ' + details);
            }
        }

        loadIdea();

        return () => {
            active = false;
        };
    }, [ideaId, session, user]);

    async function submit(e) {
        e.preventDefault();

        if (!idea || !canManageIdea(user, idea)) {
            setMessage('You can only edit your own ideas.');
            return;
        }

        if (!title.trim() || !content.trim()) {
            setMessage('Title and content are required.');
            return;
        }

        setLoading(true);
        setMessage('Saving changes...');

        try {
            const response = await fetch(`/api/ideas/${ideaId}`, {
                method: 'PUT',
                headers: getAuthHeaders({
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                }),
                body: JSON.stringify({
                    title: title.trim(),
                    content: content.trim(),
                    isAnonymous
                })
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (response.status === 403) {
                setMessage('You can only edit your own ideas.');
                return;
            }

            if (response.status === 404) {
                setMessage('Idea not found.');
                return;
            }

            if (response.status === 400) {
                const payload = await response.json().catch(() => null);
                setMessage(payload?.message || 'Invalid idea data.');
                return;
            }

            if (!response.ok) {
                setMessage(`Update failed: ${response.status}`);
                return;
            }

            window.location.href = `/ideas/${ideaId}`;
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage('Update error: ' + details);
        } finally {
            setLoading(false);
        }
    }

    function goDetails() {
        window.location.href = `/ideas/${ideaId}`;
    }

    if (!session?.token || !user) {
        return null;
    }

    const canEdit = idea && canManageIdea(user, idea);

    return (
        <div style={pageStyle()}>
            <section style={cardStyle()}>
                <h1 style={{ marginTop: 0 }}>Edit Idea</h1>

                {message && <p>{message}</p>}

                {canEdit && (
                    <form onSubmit={submit}>
                        <p>
                            <label>
                                Title
                                <br />
                                <input
                                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem' }}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </label>
                        </p>

                        <p>
                            <label>
                                Content
                                <br />
                                <textarea
                                    style={{ width: '100%', minHeight: '180px', boxSizing: 'border-box', padding: '0.45rem' }}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </label>
                        </p>

                        <p>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={isAnonymous}
                                    onChange={(e) => setIsAnonymous(e.target.checked)}
                                />
                                {' '}Submit anonymously
                            </label>
                        </p>

                        <p style={{ marginBottom: 0 }}>
                            <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</button>
                            <button type="button" onClick={goDetails} style={{ marginLeft: '0.75rem' }}>Back to idea</button>
                        </p>
                    </form>
                )}

                {!canEdit && idea && (
                    <p style={{ marginBottom: 0 }}>
                        <button type="button" onClick={goDetails}>Back to idea</button>
                    </p>
                )}
            </section>
        </div>
    );
}

import { useEffect, useMemo, useState } from 'react';
import { canManageIdea, getAuthHeaders, getAuthSession } from './authStorage';

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
        maxWidth: '900px',
        margin: '0 auto',
        border: '1px solid #d5d5d5',
        borderRadius: '8px',
        padding: '1.4rem'
    };
}

function getIdeaIdFromPath() {
    const match = window.location.pathname.match(/^\/ideas\/(\d+)$/i);
    return match ? Number(match[1]) : 0;
}

export default function IdeaDetailsPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;
    const ideaId = useMemo(() => getIdeaIdFromPath(), []);
    const invalidIdeaId = !ideaId;
    const [idea, setIdea] = useState(null);
    const [message, setMessage] = useState(invalidIdeaId ? 'Invalid idea id.' : 'Loading idea...');
    const [commentText, setCommentText] = useState('');
    const [commentMessage, setCommentMessage] = useState('');
    const [sendingComment, setSendingComment] = useState(false);

    useEffect(() => {
        if (!session?.token || !user) {
            window.location.href = '/login';
            return;
        }

        if (invalidIdeaId) {
            return;
        }

        let active = true;

        async function loadIdea() {
            try {
                const response = await fetch(`/api/ideas/${ideaId}`, {
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
    }, [ideaId, invalidIdeaId, session, user]);

    function goList() {
        window.location.href = '/ideas';
    }

    function goEdit() {
        window.location.href = `/ideas/${ideaId}/edit`;
    }

    async function submitComment() {
        if (!commentText.trim()) {
            setCommentMessage('Comment content is required.');
            return;
        }

        setSendingComment(true);
        setCommentMessage('');

        try {
            const response = await fetch(`/api/ideas/${ideaId}/comments`, {
                method: 'POST',
                headers: getAuthHeaders({
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }),
                body: JSON.stringify({ content: commentText.trim() }),
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                setCommentMessage(payload?.message || `Comment failed: ${response.status}`);
                return;
            }

            setIdea((current) => {
                if (!current) {
                    return current;
                }

                const currentComments = Array.isArray(current.comments) ? current.comments : [];
                return {
                    ...current,
                    comments: [...currentComments, payload],
                };
            });
            setCommentText('');
            setCommentMessage('Comment sent.');
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setCommentMessage('Comment error: ' + details);
        } finally {
            setSendingComment(false);
        }
    }

    if (!session?.token || !user) {
        return null;
    }

    return (
        <div style={pageStyle()}>
            <section style={cardStyle()}>
                <h1 style={{ marginTop: 0 }}>Idea Details</h1>

                {message && <p>{message}</p>}

                {!message && idea && (
                    <>
                        <p><strong>Title:</strong> {idea.title}</p>
                        <p><strong>Content:</strong></p>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{idea.content}</p>
                        <p><strong>Author:</strong> {idea.authorName}</p>
                        <p><strong>Department:</strong> {idea.departmentName}</p>
                        <p><strong>Anonymous:</strong> {idea.isAnonymous ? 'Yes' : 'No'}</p>
                        <p><strong>Views:</strong> {idea.viewCount}</p>
                        <p><strong>Created:</strong> {new Date(idea.createdAt).toLocaleString()}</p>

                        <hr />

                        <h2>Comments</h2>
                        <p>
                            <textarea
                                value={commentText}
                                onChange={(event) => setCommentText(event.target.value)}
                                rows={4}
                                placeholder="Write a comment..."
                                style={{ width: '100%', boxSizing: 'border-box' }}
                            />
                        </p>
                        <p>
                            <button type="button" onClick={submitComment} disabled={sendingComment}>
                                {sendingComment ? 'Sending...' : 'Send'}
                            </button>
                        </p>
                        {commentMessage && <p>{commentMessage}</p>}

                        {!Array.isArray(idea.comments) || idea.comments.length === 0 ? (
                            <p>no comment yet</p>
                        ) : (
                            <div>
                                {idea.comments.map((comment) => (
                                    <div key={comment.commentId} style={{ marginBottom: '1rem' }}>
                                        <div>
                                            <strong>{comment.authorName}</strong>{' '}
                                            <span>{new Date(comment.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div style={{ whiteSpace: 'pre-wrap' }}>{comment.content}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                <p style={{ marginBottom: 0 }}>
                    <button type="button" onClick={goList}>Back to idea list</button>
                    {!message && idea && canManageIdea(user, idea) && (
                        <button type="button" onClick={goEdit} style={{ marginLeft: '0.75rem' }}>Edit idea</button>
                    )}
                </p>
            </section>
        </div>
    );
}




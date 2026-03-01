import { useEffect, useMemo, useState } from 'react';
import { canCreateIdeas, getAuthHeaders, getAuthSession } from './authStorage';

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

export default function CreateIdeaPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!session?.token || !user) {
            window.location.href = '/login';
            return;
        }

        if (!canCreateIdeas(user)) {
            window.location.href = '/dashboard';
        }
    }, [session, user]);

    async function submit(e) {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            setMessage('Title and content are required.');
            return;
        }

        setLoading(true);
        setMessage('Creating idea...');

        try {
            const response = await fetch('/api/ideas', {
                method: 'POST',
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
                setMessage('You are not allowed to create ideas.');
                return;
            }

            if (response.status === 400) {
                const payload = await response.json().catch(() => null);
                setMessage(payload?.message || 'Invalid idea data.');
                return;
            }

            if (!response.ok) {
                setMessage(`Create idea failed: ${response.status}`);
                return;
            }

            window.location.href = '/ideas';
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage('Create error: ' + details);
        } finally {
            setLoading(false);
        }
    }

    function goList() {
        window.location.href = '/ideas';
    }

    if (!session?.token || !user || !canCreateIdeas(user)) {
        return null;
    }

    return (
        <div style={pageStyle()}>
            <section style={cardStyle()}>
                <h1 style={{ marginTop: 0 }}>Create Idea</h1>
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
                        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create idea'}</button>
                        <button type="button" onClick={goList} style={{ marginLeft: '0.75rem' }}>Back to idea list</button>
                    </p>
                </form>

                {message && <p style={{ color: message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') || message.toLowerCase().includes('invalid') || message.toLowerCase().includes('not allowed') ? '#b00020' : '#555' }}>{message}</p>}
            </section>
        </div>
    );
}


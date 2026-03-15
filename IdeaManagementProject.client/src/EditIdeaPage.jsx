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

function cardStyle() {
    return {
        maxWidth: '760px',
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #F3F4F6',
        padding: '1.4rem',
    };
}

function inputStyle(multiline = false) {
    return {
        width: '100%',
        minHeight: multiline ? '180px' : undefined,
        boxSizing: 'border-box',
        padding: '0.7rem 0.8rem',
        borderRadius: '10px',
        border: '1px solid #D1D5DB',
        fontFamily: 'inherit',
        fontSize: '13px',
    };
}

function multiSelectStyle() {
    return {
        ...inputStyle(),
        minHeight: '160px',
    };
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

function getIdeaIdFromPath() {
    const match = window.location.pathname.match(/^\/ideas\/(\d+)\/edit$/i);
    return match ? Number(match[1]) : 0;
}

function toSelectedIds(options) {
    return Array.from(options)
        .filter((option) => option.selected)
        .map((option) => Number(option.value));
}

export default function EditIdeaPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;
    const ideaId = useMemo(() => getIdeaIdFromPath(), []);
    const [idea, setIdea] = useState(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
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

        async function loadPageData() {
            try {
                const [ideaResponse, categoriesResponse] = await Promise.all([
                    fetch(`/api/ideas/${ideaId}?incrementViewCount=false`, {
                        headers: getAuthHeaders({ Accept: 'application/json' }),
                    }),
                    fetch('/api/categories', {
                        headers: getAuthHeaders({ Accept: 'application/json' }),
                    }),
                ]);

                if (ideaResponse.status === 401 || categoriesResponse.status === 401) {
                    window.location.href = '/login';
                    return;
                }

                if (ideaResponse.status === 404) {
                    setMessage('Idea not found.');
                    return;
                }

                if (!ideaResponse.ok || !categoriesResponse.ok) {
                    setMessage(`Unable to load edit page: idea=${ideaResponse.status}, categories=${categoriesResponse.status}`);
                    return;
                }

                const [ideaData, categoriesData] = await Promise.all([
                    ideaResponse.json(),
                    categoriesResponse.json(),
                ]);

                if (!active) {
                    return;
                }

                setIdea(ideaData);
                setTitle(ideaData.title || '');
                setContent(ideaData.content || '');
                setIsAnonymous(Boolean(ideaData.isAnonymous));
                setSelectedCategoryIds(Array.isArray(ideaData.categoryIds) ? ideaData.categoryIds : []);
                setCategoryOptions(Array.isArray(categoriesData) ? categoriesData : []);

                if (!canManageIdea(user, ideaData)) {
                    setMessage('You can only edit your own ideas.');
                    return;
                }

                setMessage('');
            } catch (error) {
                const details = error instanceof Error ? error.message : String(error);
                setMessage('Load error: ' + details);
            }
        }

        loadPageData();

        return () => {
            active = false;
        };
    }, [ideaId, session, user]);

    async function submit(event) {
        event.preventDefault();

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
                    Accept: 'application/json',
                }),
                body: JSON.stringify({
                    title: title.trim(),
                    content: content.trim(),
                    isAnonymous,
                    categoryIds: selectedCategoryIds,
                }),
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

    if (!session?.token || !user) {
        return null;
    }

    const canEdit = idea && canManageIdea(user, idea);

    return (
        <StaffShell activeMenu="myideas" footerText={idea ? `Editing ${idea.title}` : 'Editing idea'}>
            <div style={pageHeaderStyle()}>
                <div>
                    <h1 style={h1Style()}>Edit Idea</h1>
                    <p style={subStyle()}>Update the content and categories for your idea.</p>
                </div>
            </div>

            <section style={cardStyle()}>
                {message && <p>{message}</p>}

                {canEdit && (
                    <form onSubmit={submit}>
                        <p>
                            <label>
                                <span style={{ display: 'block', marginBottom: '0.45rem', fontSize: '12px', fontWeight: 700, color: '#6B7280' }}>Title</span>
                                <input
                                    style={inputStyle()}
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                />
                            </label>
                        </p>

                        <p>
                            <label>
                                <span style={{ display: 'block', marginBottom: '0.45rem', fontSize: '12px', fontWeight: 700, color: '#6B7280' }}>Content</span>
                                <textarea
                                    style={inputStyle(true)}
                                    value={content}
                                    onChange={(event) => setContent(event.target.value)}
                                />
                            </label>
                        </p>

                        <p>
                            <label>
                                <span style={{ display: 'block', marginBottom: '0.45rem', fontSize: '12px', fontWeight: 700, color: '#6B7280' }}>Categories</span>
                                <select
                                    multiple
                                    value={selectedCategoryIds.map(String)}
                                    onChange={(event) => setSelectedCategoryIds(toSelectedIds(event.target.options))}
                                    style={multiSelectStyle()}>
                                    {categoryOptions.map((category) => (
                                        <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
                                    ))}
                                </select>
                            </label>
                            <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '12px', color: '#6B7280' }}>
                                Hold Ctrl or Command to select multiple categories.
                            </span>
                        </p>

                        <p>
                            <label style={{ fontSize: '13px', color: '#374151' }}>
                                <input
                                    type="checkbox"
                                    checked={isAnonymous}
                                    onChange={(event) => setIsAnonymous(event.target.checked)}
                                />
                                {' '}Submit anonymously
                            </label>
                        </p>

                        <p style={{ marginBottom: 0, display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button type="submit" disabled={loading} style={actionButtonStyle(true)}>
                                {loading ? 'Saving...' : 'Save changes'}
                            </button>
                            <button type="button" onClick={() => { window.location.href = `/ideas/${ideaId}`; }} style={actionButtonStyle()}>
                                Back to idea
                            </button>
                        </p>
                    </form>
                )}

                {!canEdit && idea && (
                    <p style={{ marginBottom: 0 }}>
                        <button type="button" onClick={() => { window.location.href = `/ideas/${ideaId}`; }} style={actionButtonStyle()}>
                            Back to idea
                        </button>
                    </p>
                )}
            </section>
        </StaffShell>
    );
}

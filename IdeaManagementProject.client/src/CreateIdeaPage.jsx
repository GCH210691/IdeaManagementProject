import { useEffect, useMemo, useState } from 'react';
import { canCreateIdeas, getAuthHeaders, getAuthSession } from './authStorage';
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

function toSelectedIds(options) {
    return Array.from(options)
        .filter((option) => option.selected)
        .map((option) => Number(option.value));
}

export default function CreateIdeaPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [message, setMessage] = useState('');
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

        let active = true;

        async function loadCategories() {
            try {
                const response = await fetch('/api/categories', {
                    headers: getAuthHeaders({ Accept: 'application/json' }),
                });

                if (response.status === 401) {
                    window.location.href = '/login';
                    return;
                }

                if (!response.ok) {
                    setMessage(`Unable to load categories: ${response.status}`);
                    return;
                }

                const data = await response.json();
                if (!active) {
                    return;
                }

                setCategoryOptions(Array.isArray(data) ? data : []);
            } catch (error) {
                const details = error instanceof Error ? error.message : String(error);
                setMessage('Load error: ' + details);
            }
        }

        loadCategories();

        return () => {
            active = false;
        };
    }, [session, user]);

    async function submit(event) {
        event.preventDefault();

        if (!title.trim() || !content.trim()) {
            setMessage('Title and content are required.');
            return;
        }

        setLoading(true);
        setMessage('Creating idea...');

        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('content', content.trim());
            formData.append('isAnonymous', String(isAnonymous));

            selectedCategoryIds.forEach((categoryId) => {
                formData.append('categoryIds', String(categoryId));
            });

            selectedFiles.forEach((file) => {
                formData.append('files', file);
            });

            const response = await fetch('/api/ideas', {
                method: 'POST',
                headers: getAuthHeaders({ Accept: 'application/json' }),
                body: formData,
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

    if (!session?.token || !user || !canCreateIdeas(user)) {
        return null;
    }

    return (
        <StaffShell activeMenu="create" footerText="Create a new idea">
            <div style={pageHeaderStyle()}>
                <div>
                    <h1 style={h1Style()}>Create Idea</h1>
                    <p style={subStyle()}>Submit a new idea to the system.</p>
                </div>
            </div>

            <section style={cardStyle()}>
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
                        <label>
                            <span style={{ display: 'block', marginBottom: '0.45rem', fontSize: '12px', fontWeight: 700, color: '#6B7280' }}>Attachments</span>
                            <input
                                type="file"
                                multiple
                                onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
                            />
                        </label>
                        {selectedFiles.length > 0 && (
                            <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '12px', color: '#6B7280' }}>
                                {selectedFiles.length} file(s) selected.
                            </span>
                        )}
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
                            {loading ? 'Saving...' : 'Create idea'}
                        </button>
                        <button type="button" onClick={() => { window.location.href = '/ideas'; }} style={actionButtonStyle()}>
                            Back to idea list
                        </button>
                    </p>
                </form>

                {message && (
                    <p style={{ color: message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') || message.toLowerCase().includes('invalid') || message.toLowerCase().includes('not allowed') ? '#B91C1C' : '#555', marginTop: '1rem' }}>
                        {message}
                    </p>
                )}
            </section>
        </StaffShell>
    );
}

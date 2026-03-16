import { useEffect, useMemo, useState } from 'react';
import { canViewCategoryList, getAuthHeaders, getAuthSession, roleToPath } from './authStorage';
import StaffShell from './StaffShell';

function containerStyle() {
    return { maxWidth: '980px', margin: '0 auto' };
}

function headerStyle() {
    return {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
    };
}

function titleStyle() {
    return { margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#111827' };
}

function subtitleStyle() {
    return { margin: '0.35rem 0 0 0', color: '#6B7280', fontSize: '13px' };
}

function primaryButtonStyle() {
    return {
        padding: '0.7rem 1rem',
        borderRadius: '10px',
        border: 'none',
        background: '#2563EB',
        color: '#FFFFFF',
        fontSize: '13px',
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
    };
}

function secondaryButtonStyle() {
    return {
        padding: '0.7rem 1rem',
        borderRadius: '10px',
        border: '1px solid #D1D5DB',
        background: '#FFFFFF',
        color: '#111827',
        fontSize: '13px',
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
    };
}

function bannerStyle(type) {
    const palette = {
        info: { color: '#1D4ED8', background: '#EFF6FF', border: '#BFDBFE' },
        success: { color: '#047857', background: '#ECFDF5', border: '#A7F3D0' },
        error: { color: '#B91C1C', background: '#FEF2F2', border: '#FECACA' },
    };

    const selected = palette[type] || palette.info;

    return {
        marginBottom: '1rem',
        padding: '0.85rem 1rem',
        borderRadius: '12px',
        border: `1px solid ${selected.border}`,
        background: selected.background,
        color: selected.color,
        fontSize: '13px',
        fontWeight: 600,
    };
}

function cardStyle() {
    return {
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        padding: '1.25rem',
        boxSizing: 'border-box',
    };
}

function fieldLabelStyle() {
    return {
        display: 'block',
        marginBottom: '0.45rem',
        fontSize: '12px',
        color: '#6B7280',
        fontWeight: 700,
    };
}

function fieldStyle() {
    return {
        width: '100%',
        border: '1px solid #D1D5DB',
        borderRadius: '10px',
        padding: '0.65rem 0.75rem',
        fontSize: '13px',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        background: '#FFFFFF',
        color: '#111827',
    };
}

function tagStyle() {
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

export default function CategoryEditPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;
    const categoryId = useMemo(() => {
        const match = window.location.pathname.match(/\/qa-manager\/categories\/(\d+)\/edit/i);
        return match ? Number(match[1]) : 0;
    }, []);

    const [category, setCategory] = useState(null);
    const [name, setName] = useState('');
    const [feedback, setFeedback] = useState({ type: 'info', text: 'Loading category...' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!session?.token || !user) {
            window.location.href = '/login';
            return;
        }

        if (!canViewCategoryList(user)) {
            window.location.href = roleToPath(user.role);
            return;
        }

        if (!categoryId) {
            setFeedback({ type: 'error', text: 'Invalid category id.' });
            return;
        }

        let active = true;

        async function loadCategory() {
            try {
                const response = await fetch(`/api/qa-manager/categories/${categoryId}`, {
                    headers: getAuthHeaders({ Accept: 'application/json' }),
                });

                if (response.status === 401) {
                    window.location.href = '/login';
                    return;
                }

                if (response.status === 403) {
                    window.location.href = roleToPath(user.role);
                    return;
                }

                if (response.status === 404) {
                    setFeedback({ type: 'error', text: 'Category not found.' });
                    return;
                }

                if (!response.ok) {
                    setFeedback({ type: 'error', text: `Load failed: ${response.status}` });
                    return;
                }

                const payload = await response.json();
                if (!active) {
                    return;
                }

                setCategory(payload);
                setName(payload?.name || '');
                setFeedback({ type: 'info', text: '' });
            } catch (error) {
                const details = error instanceof Error ? error.message : String(error);
                setFeedback({ type: 'error', text: `Load error: ${details}` });
            }
        }

        loadCategory();

        return () => {
            active = false;
        };
    }, [session, user, categoryId]);

    async function saveCategory() {
        if (!name.trim()) {
            setFeedback({ type: 'error', text: 'Category name is required.' });
            return;
        }

        setSaving(true);
        setFeedback({ type: 'info', text: 'Saving category...' });

        try {
            const response = await fetch(`/api/qa-manager/categories/${categoryId}`, {
                method: 'PUT',
                headers: getAuthHeaders({
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }),
                body: JSON.stringify({ name: name.trim() }),
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (response.status === 403) {
                window.location.href = roleToPath(user?.role);
                return;
            }

            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                setFeedback({ type: 'error', text: payload?.message || `Save failed: ${response.status}` });
                return;
            }

            setCategory(payload);
            setName(payload.name || '');
            setFeedback({ type: 'success', text: 'Category updated.' });
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setFeedback({ type: 'error', text: `Save error: ${details}` });
        } finally {
            setSaving(false);
        }
    }

    if (!session?.token || !user) {
        return null;
    }

    return (
        <StaffShell activeMenu="categories" footerText={category ? `Editing ${category.name}` : 'Editing category'}>
            <div style={containerStyle()}>
                <div style={headerStyle()}>
                    <div>
                        <h1 style={titleStyle()}>Edit Category</h1>
                        <p style={subtitleStyle()}>
                            Rename the category and review which ideas are currently linked to it.
                        </p>
                    </div>
                    <button type="button" onClick={() => { window.location.href = '/qa-manager/categories'; }} style={secondaryButtonStyle()}>
                        Back to category list
                    </button>
                </div>

                {feedback.text && <div style={bannerStyle(feedback.type)}>{feedback.text}</div>}

                <div style={{ ...cardStyle(), marginBottom: '1.25rem' }}>
                    <label style={fieldLabelStyle()}>Category name</label>
                    <input value={name} onChange={(event) => setName(event.target.value)} style={fieldStyle()} />
                    <div style={{ marginTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={saveCategory}
                            disabled={saving}
                            style={{ ...primaryButtonStyle(), opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
                            {saving ? 'Saving...' : 'Save category'}
                        </button>
                    </div>
                </div>

                <div style={cardStyle()}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '0.25rem' }}>Ideas in this category</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '1rem' }}>
                        Category deletion is blocked while any ideas are linked here.
                    </div>

                    {Array.isArray(category?.ideas) && category.ideas.length > 0 ? (
                        <div>
                            {category.ideas.map((idea) => (
                                <span key={idea.ideaId} style={tagStyle()}>{idea.title}</span>
                            ))}
                        </div>
                    ) : (
                        <p style={{ margin: 0, color: '#6B7280', fontSize: '13px' }}>No linked ideas yet.</p>
                    )}
                </div>
            </div>
        </StaffShell>
    );
}

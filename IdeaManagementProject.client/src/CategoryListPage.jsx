import { useEffect, useMemo, useState } from 'react';
import { canViewCategoryList, getAuthHeaders, getAuthSession, roleToPath } from './authStorage';
import StaffShell from './StaffShell';

function containerStyle() {
    return { maxWidth: '1240px', margin: '0 auto' };
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

function summaryGridStyle() {
    return {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.25rem',
    };
}

function summaryCardStyle() {
    return {
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '14px',
        padding: '1rem 1.1rem',
        boxSizing: 'border-box',
    };
}

function summaryValueStyle() {
    return { fontSize: '1.75rem', fontWeight: 900, color: '#111827', lineHeight: 1.1 };
}

function summaryLabelStyle() {
    return { marginTop: '0.35rem', fontSize: '12px', color: '#6B7280' };
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
        padding: '1.1rem',
        boxSizing: 'border-box',
    };
}

function createGridStyle() {
    return {
        display: 'grid',
        gridTemplateColumns: 'minmax(240px, 1fr) auto',
        gap: '0.85rem',
        alignItems: 'end',
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
        padding: '0.55rem 0.7rem',
        fontSize: '13px',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        background: '#FFFFFF',
        color: '#111827',
    };
}

function toolbarStyle() {
    return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
        marginBottom: '1rem',
    };
}

function searchWrapStyle() {
    return {
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        width: 'min(360px, 100%)',
        background: '#FFFFFF',
        border: '1px solid #D1D5DB',
        borderRadius: '12px',
        padding: '0.65rem 0.8rem',
        boxSizing: 'border-box',
    };
}

function searchInputStyle() {
    return {
        width: '100%',
        border: 'none',
        outline: 'none',
        fontSize: '13px',
        fontFamily: 'inherit',
        background: 'transparent',
        color: '#111827',
    };
}

function tableWrapStyle() {
    return { overflowX: 'auto' };
}

function tableStyle() {
    return { width: '100%', borderCollapse: 'collapse', minWidth: '960px' };
}

function thStyle() {
    return {
        textAlign: 'left',
        padding: '0.85rem 0.75rem',
        fontSize: '12px',
        fontWeight: 700,
        color: '#6B7280',
        borderBottom: '1px solid #E5E7EB',
        whiteSpace: 'nowrap',
    };
}

function tdStyle() {
    return {
        padding: '0.95rem 0.75rem',
        borderBottom: '1px solid #F3F4F6',
        fontSize: '13px',
        color: '#111827',
        verticalAlign: 'top',
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

function inlineButtonStyle(kind) {
    if (kind === 'danger') {
        return {
            ...secondaryButtonStyle(),
            padding: '0.45rem 0.8rem',
            color: '#B91C1C',
            borderColor: '#FECACA',
            background: '#FEF2F2',
        };
    }

    if (kind === 'primary') {
        return {
            ...primaryButtonStyle(),
            padding: '0.45rem 0.8rem',
        };
    }

    return {
        ...secondaryButtonStyle(),
        padding: '0.45rem 0.8rem',
    };
}

export default function CategoryListPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;

    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState('');
    const [createName, setCreateName] = useState('');
    const [feedback, setFeedback] = useState({ type: 'info', text: 'Loading categories...' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    async function loadCategories(showLoadedMessage = false) {
        setLoading(true);

        try {
            const response = await fetch('/api/qa-manager/categories', {
                headers: getAuthHeaders({ Accept: 'application/json' }),
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (response.status === 403) {
                window.location.href = roleToPath(user?.role);
                return;
            }

            if (!response.ok) {
                setFeedback({ type: 'error', text: `Load failed: ${response.status}` });
                return;
            }

            const data = await response.json();
            const nextCategories = Array.isArray(data) ? data : [];
            setCategories(nextCategories);
            setFeedback(showLoadedMessage
                ? { type: 'success', text: `Loaded ${nextCategories.length} categor${nextCategories.length === 1 ? 'y' : 'ies'}.` }
                : { type: 'info', text: '' });
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setFeedback({ type: 'error', text: `Load error: ${details}` });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!session?.token || !user) {
            window.location.href = '/login';
            return;
        }

        if (!canViewCategoryList(user)) {
            window.location.href = roleToPath(user.role);
            return;
        }

        loadCategories();
    }, [session, user]);

    const filteredCategories = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return categories;
        }

        return categories.filter((category) => (
            String(category.name || '').toLowerCase().includes(query)
            || (Array.isArray(category.ideas) && category.ideas.some((idea) => String(idea.title || '').toLowerCase().includes(query)))
        ));
    }, [categories, search]);

    const summary = useMemo(() => {
        const total = categories.length;
        const used = categories.filter((category) => Array.isArray(category.ideas) && category.ideas.length > 0).length;
        const unused = total - used;
        const links = categories.reduce((sum, category) => sum + (Array.isArray(category.ideas) ? category.ideas.length : 0), 0);

        return [
            { label: 'Total categories', value: total },
            { label: 'Used categories', value: used },
            { label: 'Unused categories', value: unused },
            { label: 'Idea links', value: links },
        ];
    }, [categories]);

    async function createCategory() {
        if (!createName.trim()) {
            setFeedback({ type: 'error', text: 'Category name is required.' });
            return;
        }

        setSaving(true);
        setFeedback({ type: 'info', text: 'Creating category...' });

        try {
            const response = await fetch('/api/qa-manager/categories', {
                method: 'POST',
                headers: getAuthHeaders({
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }),
                body: JSON.stringify({ name: createName.trim() }),
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
                setFeedback({ type: 'error', text: payload?.message || `Create failed: ${response.status}` });
                return;
            }

            setCategories((current) => [...current, payload]);
            setCreateName('');
            setFeedback({ type: 'success', text: 'Category created.' });
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setFeedback({ type: 'error', text: `Create error: ${details}` });
        } finally {
            setSaving(false);
        }
    }

    async function deleteCategory(category) {
        if (!window.confirm(`Delete category "${category.name}"?`)) {
            return;
        }

        setSaving(true);
        setFeedback({ type: 'info', text: 'Deleting category...' });

        try {
            const response = await fetch(`/api/qa-manager/categories/${category.categoryId}`, {
                method: 'DELETE',
                headers: getAuthHeaders({ Accept: 'application/json' }),
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (response.status === 403) {
                window.location.href = roleToPath(user?.role);
                return;
            }

            if (response.status === 409) {
                const payload = await response.json().catch(() => null);
                setFeedback({ type: 'error', text: payload?.message || 'Category is in use and cannot be deleted.' });
                return;
            }

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                setFeedback({ type: 'error', text: payload?.message || `Delete failed: ${response.status}` });
                return;
            }

            setCategories((current) => current.filter((item) => item.categoryId !== category.categoryId));
            setFeedback({ type: 'success', text: 'Category deleted.' });
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setFeedback({ type: 'error', text: `Delete error: ${details}` });
        } finally {
            setSaving(false);
        }
    }

    function openEdit(categoryId) {
        window.location.href = `/qa-manager/categories/${categoryId}/edit`;
    }

    if (!session?.token || !user) {
        return null;
    }

    return (
        <StaffShell activeMenu="categories" footerText={`${categories.length} categories loaded`}>
            <div style={containerStyle()}>
                <div style={headerStyle()}>
                    <div>
                        <h1 style={titleStyle()}>Category List</h1>
                        <p style={subtitleStyle()}>
                            QA Manager can create, review, edit, and delete categories that are not yet linked to ideas.
                        </p>
                    </div>
                    <button type="button" onClick={() => loadCategories(true)} style={primaryButtonStyle()}>
                        Refresh categories
                    </button>
                </div>

                {feedback.text && <div style={bannerStyle(feedback.type)}>{feedback.text}</div>}

                <div style={summaryGridStyle()}>
                    {summary.map((item) => (
                        <div key={item.label} style={summaryCardStyle()}>
                            <div style={summaryValueStyle()}>{item.value}</div>
                            <div style={summaryLabelStyle()}>{item.label}</div>
                        </div>
                    ))}
                </div>

                <div style={{ ...cardStyle(), marginBottom: '1.25rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>Create category</div>
                        <div style={{ marginTop: '0.25rem', fontSize: '12px', color: '#6B7280' }}>
                            Add a category that can later be assigned to one or more ideas.
                        </div>
                    </div>
                    <div style={createGridStyle()}>
                        <div>
                            <label style={fieldLabelStyle()}>Category name</label>
                            <input
                                value={createName}
                                onChange={(event) => setCreateName(event.target.value)}
                                placeholder="Category name"
                                style={fieldStyle()}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={createCategory}
                            disabled={saving}
                            style={{ ...primaryButtonStyle(), opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
                            Create category
                        </button>
                    </div>
                </div>

                <div style={cardStyle()}>
                    <div style={toolbarStyle()}>
                        <div style={searchWrapStyle()}>
                            <span style={{ color: '#6B7280', fontSize: '14px' }}>Search</span>
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Find by category or linked idea"
                                style={searchInputStyle()}
                            />
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
                            {loading ? 'Loading categories...' : `${filteredCategories.length} visible categor${filteredCategories.length === 1 ? 'y' : 'ies'}`}
                        </div>
                    </div>

                    <div style={tableWrapStyle()}>
                        <table style={tableStyle()}>
                            <thead>
                                <tr>
                                    <th style={thStyle()}>Category</th>
                                    <th style={thStyle()}>Ideas in category</th>
                                    <th style={thStyle()}>Usage</th>
                                    <th style={thStyle()}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCategories.map((category) => {
                                    const ideas = Array.isArray(category.ideas) ? category.ideas : [];

                                    return (
                                        <tr key={category.categoryId}>
                                            <td style={tdStyle()}>
                                                <div style={{ fontWeight: 800 }}>{category.name}</div>
                                                <div style={{ marginTop: '0.2rem', fontSize: '12px', color: '#6B7280' }}>
                                                    Category ID: {category.categoryId}
                                                </div>
                                            </td>
                                            <td style={tdStyle()}>
                                                {ideas.length > 0 ? ideas.map((idea) => (
                                                    <span key={idea.ideaId} style={tagStyle()}>{idea.title}</span>
                                                )) : <span style={{ color: '#9CA3AF' }}>No linked ideas</span>}
                                            </td>
                                            <td style={tdStyle()}>{ideas.length}</td>
                                            <td style={tdStyle()}>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    <button type="button" onClick={() => openEdit(category.categoryId)} style={inlineButtonStyle('primary')}>
                                                        Edit
                                                    </button>
                                                    <button type="button" onClick={() => deleteCategory(category)} style={inlineButtonStyle('danger')} disabled={saving}>
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!loading && filteredCategories.length === 0 && (
                                    <tr>
                                        <td style={{ ...tdStyle(), textAlign: 'center', color: '#6B7280' }} colSpan={4}>
                                            No categories match the current search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </StaffShell>
    );
}

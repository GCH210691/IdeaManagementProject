import { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders, getAuthSession, roleToPath } from './authStorage';
import AdminShell from './AdminShell';

function toLocalInputValue(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
}

function toIsoOrNull(value) {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
}

function toRoleLabel(role) {
    return String(role || '')
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function getInitials(name) {
    const parts = String(name || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);

    if (parts.length === 0) {
        return 'NA';
    }

    return parts.map((part) => part[0]?.toUpperCase() || '').join('');
}

function containerStyle() {
    return {
        maxWidth: '1240px',
        margin: '0 auto',
    };
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
    return {
        margin: 0,
        fontSize: '1.75rem',
        fontWeight: 900,
        color: '#111827',
    };
}

function subtitleStyle() {
    return {
        margin: '0.35rem 0 0 0',
        color: '#6B7280',
        fontSize: '13px',
    };
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
    return {
        fontSize: '1.75rem',
        fontWeight: 900,
        color: '#111827',
        lineHeight: 1.1,
    };
}

function summaryLabelStyle() {
    return {
        marginTop: '0.35rem',
        fontSize: '12px',
        color: '#6B7280',
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
        padding: '1.1rem',
        boxSizing: 'border-box',
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
    return {
        overflowX: 'auto',
    };
}

function tableStyle() {
    return {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '1060px',
    };
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

function avatarStyle() {
    return {
        width: '34px',
        height: '34px',
        borderRadius: '999px',
        background: '#DBEAFE',
        color: '#1D4ED8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 800,
        flexShrink: 0,
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

function badgeStyle(background, color) {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.25rem 0.6rem',
        borderRadius: '999px',
        background,
        color,
        fontSize: '11px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
    };
}

function roleBadgeStyle(role) {
    const map = {
        ADMIN: ['#FEE2E2', '#B91C1C'],
        QA_MANAGER: ['#EDE9FE', '#6D28D9'],
        QA_COORDINATOR: ['#DBEAFE', '#1D4ED8'],
        STAFF: ['#D1FAE5', '#047857'],
    };

    const selected = map[role] || ['#E5E7EB', '#374151'];
    return badgeStyle(selected[0], selected[1]);
}

function termsBadgeStyle(value) {
    return value ? badgeStyle('#ECFDF5', '#047857') : badgeStyle('#F3F4F6', '#6B7280');
}

function actionRowStyle() {
    return {
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
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

export default function AdminAccountsPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;

    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [search, setSearch] = useState('');
    const [editingUserId, setEditingUserId] = useState(0);
    const [form, setForm] = useState({
        name: '',
        email: '',
        role: '',
        departmentId: '',
        acceptedTermsAt: '',
        password: '',
    });
    const [feedback, setFeedback] = useState({ type: 'info', text: 'Loading accounts...' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    async function loadData(showLoadedMessage = false) {
        setLoading(true);

        try {
            const [usersResponse, optionsResponse] = await Promise.all([
                fetch('/api/admin/users', {
                    headers: getAuthHeaders({ Accept: 'application/json' }),
                }),
                fetch('/api/admin/users/options', {
                    headers: getAuthHeaders({ Accept: 'application/json' }),
                }),
            ]);

            if (usersResponse.status === 401 || optionsResponse.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (usersResponse.status === 403 || optionsResponse.status === 403) {
                window.location.href = '/admin/dashboard';
                return;
            }

            if (!usersResponse.ok || !optionsResponse.ok) {
                setFeedback({
                    type: 'error',
                    text: `Load failed: users=${usersResponse.status}, options=${optionsResponse.status}`,
                });
                return;
            }

            const usersData = await usersResponse.json();
            const optionsData = await optionsResponse.json();

            const nextUsers = Array.isArray(usersData) ? usersData : [];
            setUsers(nextUsers);
            setRoles(Array.isArray(optionsData?.roles) ? optionsData.roles : []);
            setDepartments(Array.isArray(optionsData?.departments) ? optionsData.departments : []);
            setFeedback(showLoadedMessage
                ? { type: 'success', text: `Loaded ${nextUsers.length} account${nextUsers.length === 1 ? '' : 's'}.` }
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

        if (user.role !== 'ADMIN') {
            window.location.href = roleToPath(user.role);
            return;
        }

        loadData();
    }, [session, user]);

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return users;
        }

        return users.filter((row) => (
            String(row.name || '').toLowerCase().includes(query)
            || String(row.email || '').toLowerCase().includes(query)
            || String(row.role || '').toLowerCase().includes(query)
            || String(row.departmentName || '').toLowerCase().includes(query)
        ));
    }, [search, users]);

    const summary = useMemo(() => {
        const total = users.length;
        const admins = users.filter((row) => row.role === 'ADMIN').length;
        const coordinators = users.filter((row) => row.role === 'QA_COORDINATOR').length;
        const acceptedTerms = users.filter((row) => row.acceptedTermsAt).length;

        return [
            { label: 'Total accounts', value: total },
            { label: 'Administrators', value: admins },
            { label: 'QA coordinators', value: coordinators },
            { label: 'Accepted terms', value: acceptedTerms },
        ];
    }, [users]);

    function beginEdit(row) {
        setEditingUserId(row.id);
        setForm({
            name: row.name || '',
            email: row.email || '',
            role: row.role || '',
            departmentId: String(row.departmentId || ''),
            acceptedTermsAt: toLocalInputValue(row.acceptedTermsAt),
            password: '',
        });
        setFeedback({ type: 'info', text: '' });
    }

    function cancelEdit() {
        setEditingUserId(0);
        setForm({
            name: '',
            email: '',
            role: '',
            departmentId: '',
            acceptedTermsAt: '',
            password: '',
        });
        setFeedback({ type: 'info', text: '' });
    }

    async function saveEdit() {
        if (!editingUserId) {
            return;
        }

        if (!form.name.trim() || !form.email.trim() || !form.role || !form.departmentId) {
            setFeedback({
                type: 'error',
                text: 'Name, email, role, and department are required.',
            });
            return;
        }

        setSaving(true);
        setFeedback({ type: 'info', text: 'Saving account...' });

        try {
            const response = await fetch(`/api/admin/users/${editingUserId}`, {
                method: 'PUT',
                headers: getAuthHeaders({
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }),
                body: JSON.stringify({
                    name: form.name.trim(),
                    email: form.email.trim(),
                    role: form.role,
                    departmentId: Number(form.departmentId),
                    acceptedTermsAt: toIsoOrNull(form.acceptedTermsAt),
                    password: form.password.trim() ? form.password.trim() : null,
                }),
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (response.status === 403) {
                window.location.href = '/admin/dashboard';
                return;
            }

            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                setFeedback({
                    type: 'error',
                    text: payload?.message || `Save failed: ${response.status}`,
                });
                return;
            }

            setUsers((current) => current.map((item) => (item.id === editingUserId ? payload : item)));
            setEditingUserId(0);
            setFeedback({ type: 'success', text: 'Account updated.' });
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
        <AdminShell activeMenu="users">
            <div style={containerStyle()}>
                <div style={headerStyle()}>
                    <div>
                        <h1 style={titleStyle()}>Account Management</h1>
                        <p style={subtitleStyle()}>
                            Review account details, role assignments, departments, and terms acceptance.
                        </p>
                    </div>
                    <button type="button" onClick={() => loadData(true)} style={primaryButtonStyle()}>
                        Refresh accounts
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

                <div style={cardStyle()}>
                    <div style={toolbarStyle()}>
                        <div style={searchWrapStyle()}>
                            <span style={{ color: '#6B7280', fontSize: '14px' }}>Search</span>
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Find by name, email, role, or department"
                                style={searchInputStyle()}
                            />
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
                            {loading ? 'Loading accounts...' : `${filteredUsers.length} visible account${filteredUsers.length === 1 ? '' : 's'}`}
                        </div>
                    </div>

                    <div style={tableWrapStyle()}>
                        <table style={tableStyle()}>
                            <thead>
                                <tr>
                                    <th style={thStyle()}>Account</th>
                                    <th style={thStyle()}>Email</th>
                                    <th style={thStyle()}>Role</th>
                                    <th style={thStyle()}>Department</th>
                                    <th style={thStyle()}>Accepted Terms</th>
                                    <th style={thStyle()}>Reset Password</th>
                                    <th style={thStyle()}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((row) => {
                                    const editing = editingUserId === row.id;

                                    return (
                                        <tr key={row.id}>
                                            <td style={tdStyle()}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={avatarStyle()}>{getInitials(row.name)}</div>
                                                    <div>
                                                        {editing ? (
                                                            <input
                                                                value={form.name}
                                                                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                                                style={fieldStyle()}
                                                            />
                                                        ) : (
                                                            <div style={{ fontWeight: 800 }}>{row.name}</div>
                                                        )}
                                                        {!editing && (
                                                            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '0.2rem' }}>
                                                                User ID: {row.id}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={tdStyle()}>
                                                {editing ? (
                                                    <input
                                                        value={form.email}
                                                        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                                                        style={fieldStyle()}
                                                    />
                                                ) : (
                                                    <span style={{ color: '#4B5563' }}>{row.email}</span>
                                                )}
                                            </td>
                                            <td style={tdStyle()}>
                                                {editing ? (
                                                    <select
                                                        value={form.role}
                                                        onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                                                        style={fieldStyle()}>
                                                        <option value="">Select role</option>
                                                        {roles.map((item) => (
                                                            <option key={item.roleName} value={item.roleName}>{toRoleLabel(item.roleName)}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span style={roleBadgeStyle(row.role)}>{toRoleLabel(row.role)}</span>
                                                )}
                                            </td>
                                            <td style={tdStyle()}>
                                                {editing ? (
                                                    <select
                                                        value={form.departmentId}
                                                        onChange={(event) => setForm((prev) => ({ ...prev, departmentId: event.target.value }))}
                                                        style={fieldStyle()}>
                                                        <option value="">Select department</option>
                                                        {departments.map((item) => (
                                                            <option key={item.departmentId} value={item.departmentId}>{item.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    row.departmentName
                                                )}
                                            </td>
                                            <td style={tdStyle()}>
                                                {editing ? (
                                                    <input
                                                        type="datetime-local"
                                                        value={form.acceptedTermsAt}
                                                        onChange={(event) => setForm((prev) => ({ ...prev, acceptedTermsAt: event.target.value }))}
                                                        style={fieldStyle()}
                                                    />
                                                ) : (
                                                    <div>
                                                        <span style={termsBadgeStyle(row.acceptedTermsAt)}>
                                                            {row.acceptedTermsAt ? 'Accepted' : 'Not accepted'}
                                                        </span>
                                                        {row.acceptedTermsAt && (
                                                            <div style={{ marginTop: '0.35rem', fontSize: '12px', color: '#6B7280' }}>
                                                                {new Date(row.acceptedTermsAt).toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={tdStyle()}>
                                                {editing ? (
                                                    <input
                                                        type="password"
                                                        placeholder="Leave blank to keep current password"
                                                        value={form.password}
                                                        onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                                                        style={fieldStyle()}
                                                    />
                                                ) : (
                                                    <span style={{ color: '#9CA3AF' }}>Hidden</span>
                                                )}
                                            </td>
                                            <td style={tdStyle()}>
                                                <div style={actionRowStyle()}>
                                                    {!editing && (
                                                        <button type="button" onClick={() => beginEdit(row)} style={inlineButtonStyle('default')}>
                                                            Edit
                                                        </button>
                                                    )}
                                                    {editing && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={saveEdit}
                                                                disabled={saving}
                                                                style={{
                                                                    ...inlineButtonStyle('primary'),
                                                                    opacity: saving ? 0.7 : 1,
                                                                    cursor: saving ? 'not-allowed' : 'pointer',
                                                                }}>
                                                                Save
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={cancelEdit}
                                                                disabled={saving}
                                                                style={{
                                                                    ...inlineButtonStyle('danger'),
                                                                    opacity: saving ? 0.7 : 1,
                                                                    cursor: saving ? 'not-allowed' : 'pointer',
                                                                }}>
                                                                Cancel
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!loading && filteredUsers.length === 0 && (
                                    <tr>
                                        <td style={{ ...tdStyle(), textAlign: 'center', color: '#6B7280' }} colSpan={7}>
                                            No accounts match the current search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}

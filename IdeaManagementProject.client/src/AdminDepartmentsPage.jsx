import { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders, getAuthSession, roleToPath, BASE_URL } from './authStorage';
import AdminShell from './AdminShell';

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

function createGridStyle() {
    return {
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 1.2fr) minmax(280px, 1fr) auto',
        gap: '0.85rem',
        alignItems: 'end',
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

function tableWrapStyle() {
    return {
        overflowX: 'auto',
    };
}

function tableStyle() {
    return {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '920px',
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

function coordinatorBadgeStyle(hasCoordinator) {
    return hasCoordinator
        ? badgeStyle('#DBEAFE', '#1D4ED8')
        : badgeStyle('#F3F4F6', '#6B7280');
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

export default function AdminDepartmentsPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;

    const [departments, setDepartments] = useState([]);
    const [qaCoordinators, setQaCoordinators] = useState([]);
    const [createName, setCreateName] = useState('');
    const [createQaUserId, setCreateQaUserId] = useState('');
    const [editingDepartmentId, setEditingDepartmentId] = useState(0);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ name: '', qaCoordinatorUserId: '' });
    const [feedback, setFeedback] = useState({ type: 'info', text: 'Loading departments...' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    async function loadData(showLoadedMessage = false) {
        setLoading(true);

        try {
            const [departmentsResponse, usersResponse] = await Promise.all([
                fetch(`${BASE_URL}/api/admin/departments`, {
                    headers: getAuthHeaders({ Accept: 'application/json' }),
                }),
                fetch(`${BASE_URL}/api/admin/users`, {
                    headers: getAuthHeaders({ Accept: 'application/json' }),
                }),
            ]);

            if (departmentsResponse.status === 401 || usersResponse.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (departmentsResponse.status === 403 || usersResponse.status === 403) {
                window.location.href = '/admin/dashboard';
                return;
            }

            if (!departmentsResponse.ok || !usersResponse.ok) {
                setFeedback({
                    type: 'error',
                    text: `Load failed: departments=${departmentsResponse.status}, users=${usersResponse.status}`,
                });
                return;
            }

            const departmentsData = await departmentsResponse.json();
            const usersData = await usersResponse.json();
            const nextDepartments = Array.isArray(departmentsData) ? departmentsData : [];
            const coordinators = Array.isArray(usersData)
                ? usersData.filter((account) => account.role === 'QA_COORDINATOR')
                : [];

            setDepartments(nextDepartments);
            setQaCoordinators(coordinators);
            setFeedback(showLoadedMessage
                ? { type: 'success', text: `Loaded ${nextDepartments.length} department${nextDepartments.length === 1 ? '' : 's'}.` }
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

    const filteredDepartments = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return departments;
        }

        return departments.filter((row) => (
            String(row.name || '').toLowerCase().includes(query)
            || String(row.qaCoordinatorName || '').toLowerCase().includes(query)
        ));
    }, [departments, search]);

    const summary = useMemo(() => {
        const total = departments.length;
        const assigned = departments.filter((row) => row.qaCoordinatorUserId).length;
        const unassigned = total - assigned;
        const available = qaCoordinators.length;

        return [
            { label: 'Total departments', value: total },
            { label: 'Assigned coordinators', value: assigned },
            { label: 'Unassigned departments', value: unassigned },
            { label: 'Coordinator accounts', value: available },
        ];
    }, [departments, qaCoordinators]);

    function beginEdit(row) {
        setEditingDepartmentId(row.departmentId);
        setForm({
            name: row.name || '',
            qaCoordinatorUserId: row.qaCoordinatorUserId ? String(row.qaCoordinatorUserId) : '',
        });
        setFeedback({ type: 'info', text: '' });
    }

    function cancelEdit() {
        setEditingDepartmentId(0);
        setForm({ name: '', qaCoordinatorUserId: '' });
        setFeedback({ type: 'info', text: '' });
    }

    async function createDepartment() {
        if (!createName.trim()) {
            setFeedback({ type: 'error', text: 'Department name is required.' });
            return;
        }

        setSaving(true);
        setFeedback({ type: 'info', text: 'Creating department...' });

        try {
            const response = await fetch(`${BASE_URL}/api/admin/departments`, {
                method: 'POST',
                headers: getAuthHeaders({
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }),
                body: JSON.stringify({
                    name: createName.trim(),
                    qaCoordinatorUserId: createQaUserId ? Number(createQaUserId) : null,
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
                setFeedback({ type: 'error', text: payload?.message || `Create failed: ${response.status}` });
                return;
            }

            setDepartments((current) => [...current, payload]);
            setCreateName('');
            setCreateQaUserId('');
            setFeedback({ type: 'success', text: 'Department created.' });
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setFeedback({ type: 'error', text: `Create error: ${details}` });
        } finally {
            setSaving(false);
        }
    }

    async function saveEdit() {
        if (!editingDepartmentId) {
            return;
        }

        if (!form.name.trim()) {
            setFeedback({ type: 'error', text: 'Department name is required.' });
            return;
        }

        setSaving(true);
        setFeedback({ type: 'info', text: 'Saving department...' });

        try {
            const response = await fetch(`${BASE_URL}/api/admin/departments/${editingDepartmentId}`, {
                method: 'PUT',
                headers: getAuthHeaders({
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }),
                body: JSON.stringify({
                    name: form.name.trim(),
                    qaCoordinatorUserId: form.qaCoordinatorUserId ? Number(form.qaCoordinatorUserId) : null,
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
                setFeedback({ type: 'error', text: payload?.message || `Save failed: ${response.status}` });
                return;
            }

            setDepartments((current) => current.map((item) => (item.departmentId === editingDepartmentId ? payload : item)));
            setEditingDepartmentId(0);
            setFeedback({ type: 'success', text: 'Department updated.' });
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setFeedback({ type: 'error', text: `Save error: ${details}` });
        } finally {
            setSaving(false);
        }
    }

    async function deleteDepartment(department) {
        if (!window.confirm(`Delete department "${department.name}"?`)) {
            return;
        }

        setSaving(true);
        setFeedback({ type: 'info', text: 'Deleting department...' });

        try {
            const response = await fetch(`${BASE_URL}/api/admin/departments/${department.departmentId}`, {
                method: 'DELETE',
                headers: getAuthHeaders({ Accept: 'application/json' }),
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (response.status === 403) {
                window.location.href = '/admin/dashboard';
                return;
            }

            if (response.status === 409) {
                const payload = await response.json().catch(() => null);
                setFeedback({ type: 'error', text: payload?.message || 'Department is in use and cannot be deleted.' });
                return;
            }

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                setFeedback({ type: 'error', text: payload?.message || `Delete failed: ${response.status}` });
                return;
            }

            setDepartments((current) => current.filter((item) => item.departmentId !== department.departmentId));
            setFeedback({ type: 'success', text: 'Department deleted.' });
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setFeedback({ type: 'error', text: `Delete error: ${details}` });
        } finally {
            setSaving(false);
        }
    }

    if (!session?.token || !user) {
        return null;
    }

    return (
        <AdminShell activeMenu="departments">
            <div style={containerStyle()}>
                <div style={headerStyle()}>
                    <div>
                        <h1 style={titleStyle()}>Department Management</h1>
                        <p style={subtitleStyle()}>
                            Create departments, assign QA coordinators, and maintain department ownership.
                        </p>
                    </div>
                    <button type="button" onClick={() => loadData(true)} style={primaryButtonStyle()}>
                        Refresh departments
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
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>Create department</div>
                        <div style={{ marginTop: '0.25rem', fontSize: '12px', color: '#6B7280' }}>
                            Add a department and optionally assign its QA coordinator immediately.
                        </div>
                    </div>
                    <div style={createGridStyle()}>
                        <div>
                            <label style={fieldLabelStyle()}>Department name</label>
                            <input
                                value={createName}
                                onChange={(event) => setCreateName(event.target.value)}
                                placeholder="Department name"
                                style={fieldStyle()}
                            />
                        </div>
                        <div>
                            <label style={fieldLabelStyle()}>QA coordinator</label>
                            <select
                                value={createQaUserId}
                                onChange={(event) => setCreateQaUserId(event.target.value)}
                                style={fieldStyle()}>
                                <option value="">No QA coordinator</option>
                                {qaCoordinators.map((item) => (
                                    <option key={item.id} value={item.id}>{item.name} ({item.email})</option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={createDepartment}
                            disabled={saving}
                            style={{
                                ...primaryButtonStyle(),
                                opacity: saving ? 0.7 : 1,
                                cursor: saving ? 'not-allowed' : 'pointer',
                            }}>
                            Create department
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
                                placeholder="Find by department or coordinator"
                                style={searchInputStyle()}
                            />
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
                            {loading ? 'Loading departments...' : `${filteredDepartments.length} visible department${filteredDepartments.length === 1 ? '' : 's'}`}
                        </div>
                    </div>

                    <div style={tableWrapStyle()}>
                        <table style={tableStyle()}>
                            <thead>
                                <tr>
                                    <th style={thStyle()}>Department</th>
                                    <th style={thStyle()}>Coordinator</th>
                                    <th style={thStyle()}>Assignment</th>
                                    <th style={thStyle()}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDepartments.map((row) => {
                                    const editing = editingDepartmentId === row.departmentId;

                                    return (
                                        <tr key={row.departmentId}>
                                            <td style={tdStyle()}>
                                                {editing ? (
                                                    <input
                                                        value={form.name}
                                                        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                                        style={fieldStyle()}
                                                    />
                                                ) : (
                                                    <div>
                                                        <div style={{ fontWeight: 800 }}>{row.name}</div>
                                                        <div style={{ marginTop: '0.2rem', fontSize: '12px', color: '#6B7280' }}>
                                                            Department ID: {row.departmentId}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td style={tdStyle()}>
                                                {editing ? (
                                                    <select
                                                        value={form.qaCoordinatorUserId}
                                                        onChange={(event) => setForm((prev) => ({ ...prev, qaCoordinatorUserId: event.target.value }))}
                                                        style={fieldStyle()}>
                                                        <option value="">No QA coordinator</option>
                                                        {qaCoordinators.map((item) => (
                                                            <option key={item.id} value={item.id}>{item.name} ({item.email})</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <div>
                                                        <div style={{ fontWeight: 700 }}>{row.qaCoordinatorName || 'No coordinator assigned'}</div>
                                                        {row.qaCoordinatorEmail && (
                                                            <div style={{ marginTop: '0.2rem', fontSize: '12px', color: '#6B7280' }}>
                                                                {row.qaCoordinatorEmail}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={tdStyle()}>
                                                <span style={coordinatorBadgeStyle(Boolean(row.qaCoordinatorUserId))}>
                                                    {row.qaCoordinatorUserId ? 'Assigned' : 'Unassigned'}
                                                </span>
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
                                                    {!editing && (
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteDepartment(row)}
                                                            disabled={saving}
                                                            style={{
                                                                ...inlineButtonStyle('danger'),
                                                                opacity: saving ? 0.7 : 1,
                                                                cursor: saving ? 'not-allowed' : 'pointer',
                                                            }}>
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!loading && filteredDepartments.length === 0 && (
                                    <tr>
                                        <td style={{ ...tdStyle(), textAlign: 'center', color: '#6B7280' }} colSpan={4}>
                                            No departments match the current search.
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

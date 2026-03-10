import { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders, getAuthSession, roleToPath } from './authStorage';

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

export default function AdminAccountsPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;

    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [editingUserId, setEditingUserId] = useState(0);
    const [form, setForm] = useState({
        name: '',
        email: '',
        role: '',
        departmentId: '',
        acceptedTermsAt: '',
        password: '',
    });
    const [message, setMessage] = useState('Loading accounts...');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!session?.token || !user) {
            window.location.href = '/login';
            return;
        }

        if (user.role !== 'ADMIN') {
            window.location.href = roleToPath(user.role);
            return;
        }

        let cancelled = false;

        async function loadData() {
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
                    setMessage(`Load failed: users=${usersResponse.status}, options=${optionsResponse.status}`);
                    return;
                }

                const usersData = await usersResponse.json();
                const optionsData = await optionsResponse.json();

                if (cancelled) {
                    return;
                }

                setUsers(Array.isArray(usersData) ? usersData : []);
                setRoles(Array.isArray(optionsData?.roles) ? optionsData.roles : []);
                setDepartments(Array.isArray(optionsData?.departments) ? optionsData.departments : []);
                setMessage('');
            } catch (error) {
                const details = error instanceof Error ? error.message : String(error);
                setMessage(`Load error: ${details}`);
            }
        }

        loadData();

        return () => {
            cancelled = true;
        };
    }, [session, user]);

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
        setMessage('');
    }

    function cancelEdit() {
        setEditingUserId(0);
        setMessage('');
    }

    async function saveEdit() {
        if (!editingUserId) {
            return;
        }

        if (!form.name.trim() || !form.email.trim() || !form.role || !form.departmentId) {
            setMessage('Name, email, role, and department are required.');
            return;
        }

        setSaving(true);
        setMessage('Saving account...');

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
                setMessage(payload?.message || `Save failed: ${response.status}`);
                return;
            }

            setUsers((current) => current.map((item) => (item.id === editingUserId ? payload : item)));
            setEditingUserId(0);
            setMessage('Account updated.');
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage(`Save error: ${details}`);
        } finally {
            setSaving(false);
        }
    }

    function goBack() {
        window.location.href = '/admin/dashboard';
    }

    if (!session?.token || !user) {
        return null;
    }

    return (
        <div style={{ padding: '1rem', fontFamily: 'Arial, sans-serif' }}>
            <h1>Account Management</h1>
            <p>
                <button type="button" onClick={goBack}>Back to admin dashboard</button>
            </p>

            {message && <p>{message}</p>}

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.4rem' }}>Id</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.4rem' }}>Name</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.4rem' }}>Email</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.4rem' }}>Role</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.4rem' }}>Department</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.4rem' }}>Accepted Terms</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.4rem' }}>New Password</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.4rem' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((row) => {
                        const editing = editingUserId === row.id;

                        return (
                            <tr key={row.id}>
                                <td style={{ borderBottom: '1px solid #eee', padding: '0.4rem' }}>{row.id}</td>
                                <td style={{ borderBottom: '1px solid #eee', padding: '0.4rem' }}>
                                    {editing ? (
                                        <input
                                            value={form.name}
                                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                        />
                                    ) : row.name}
                                </td>
                                <td style={{ borderBottom: '1px solid #eee', padding: '0.4rem' }}>
                                    {editing ? (
                                        <input
                                            value={form.email}
                                            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                                        />
                                    ) : row.email}
                                </td>
                                <td style={{ borderBottom: '1px solid #eee', padding: '0.4rem' }}>
                                    {editing ? (
                                        <select
                                            value={form.role}
                                            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}>
                                            <option value="">Select role</option>
                                            {roles.map((item) => (
                                                <option key={item.roleName} value={item.roleName}>{item.roleName}</option>
                                            ))}
                                        </select>
                                    ) : row.role}
                                </td>
                                <td style={{ borderBottom: '1px solid #eee', padding: '0.4rem' }}>
                                    {editing ? (
                                        <select
                                            value={form.departmentId}
                                            onChange={(e) => setForm((prev) => ({ ...prev, departmentId: e.target.value }))}>
                                            <option value="">Select department</option>
                                            {departments.map((item) => (
                                                <option key={item.departmentId} value={item.departmentId}>{item.name}</option>
                                            ))}
                                        </select>
                                    ) : row.departmentName}
                                </td>
                                <td style={{ borderBottom: '1px solid #eee', padding: '0.4rem' }}>
                                    {editing ? (
                                        <input
                                            type="datetime-local"
                                            value={form.acceptedTermsAt}
                                            onChange={(e) => setForm((prev) => ({ ...prev, acceptedTermsAt: e.target.value }))}
                                        />
                                    ) : (row.acceptedTermsAt ? new Date(row.acceptedTermsAt).toLocaleString() : 'Not accepted')}
                                </td>
                                <td style={{ borderBottom: '1px solid #eee', padding: '0.4rem' }}>
                                    {editing ? (
                                        <input
                                            type="password"
                                            placeholder="Leave empty"
                                            value={form.password}
                                            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                                        />
                                    ) : '-'}
                                </td>
                                <td style={{ borderBottom: '1px solid #eee', padding: '0.4rem' }}>
                                    {!editing && <button type="button" onClick={() => beginEdit(row)}>Edit</button>}
                                    {editing && (
                                        <>
                                            <button type="button" onClick={saveEdit} disabled={saving}>Save</button>
                                            <button type="button" onClick={cancelEdit} style={{ marginLeft: '0.5rem' }} disabled={saving}>Cancel</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

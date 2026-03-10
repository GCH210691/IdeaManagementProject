import { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders, getAuthSession, roleToPath } from './authStorage';

export default function AdminDepartmentsPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;

    const [departments, setDepartments] = useState([]);
    const [qaCoordinators, setQaCoordinators] = useState([]);
    const [createName, setCreateName] = useState('');
    const [createQaUserId, setCreateQaUserId] = useState('');
    const [editingDepartmentId, setEditingDepartmentId] = useState(0);
    const [form, setForm] = useState({ name: '', qaCoordinatorUserId: '' });
    const [message, setMessage] = useState('Loading departments...');
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
                const [departmentsResponse, usersResponse] = await Promise.all([
                    fetch('/api/admin/departments', {
                        headers: getAuthHeaders({ Accept: 'application/json' }),
                    }),
                    fetch('/api/admin/users', {
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
                    setMessage(`Load failed: departments=${departmentsResponse.status}, users=${usersResponse.status}`);
                    return;
                }

                const departmentsData = await departmentsResponse.json();
                const usersData = await usersResponse.json();

                if (cancelled) {
                    return;
                }

                setDepartments(Array.isArray(departmentsData) ? departmentsData : []);

                const coordinators = Array.isArray(usersData)
                    ? usersData.filter((account) => account.role === 'QA_COORDINATOR')
                    : [];

                setQaCoordinators(coordinators);
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

    function goBack() {
        window.location.href = '/admin/dashboard';
    }

    function beginEdit(row) {
        setEditingDepartmentId(row.departmentId);
        setForm({
            name: row.name || '',
            qaCoordinatorUserId: row.qaCoordinatorUserId ? String(row.qaCoordinatorUserId) : '',
        });
        setMessage('');
    }

    function cancelEdit() {
        setEditingDepartmentId(0);
        setMessage('');
    }

    async function createDepartment() {
        if (!createName.trim()) {
            setMessage('Department name is required.');
            return;
        }

        setSaving(true);
        setMessage('Creating department...');

        try {
            const response = await fetch('/api/admin/departments', {
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
                setMessage(payload?.message || `Create failed: ${response.status}`);
                return;
            }

            setDepartments((current) => [...current, payload]);
            setCreateName('');
            setCreateQaUserId('');
            setMessage('Department created.');
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage(`Create error: ${details}`);
        } finally {
            setSaving(false);
        }
    }

    async function saveEdit() {
        if (!editingDepartmentId) {
            return;
        }

        if (!form.name.trim()) {
            setMessage('Department name is required.');
            return;
        }

        setSaving(true);
        setMessage('Saving department...');

        try {
            const response = await fetch(`/api/admin/departments/${editingDepartmentId}`, {
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
                setMessage(payload?.message || `Save failed: ${response.status}`);
                return;
            }

            setDepartments((current) => current.map((item) => (item.departmentId === editingDepartmentId ? payload : item)));
            setEditingDepartmentId(0);
            setMessage('Department updated.');
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage(`Save error: ${details}`);
        } finally {
            setSaving(false);
        }
    }

    async function deleteDepartment(department) {
        if (!window.confirm(`Delete department "${department.name}"?`)) {
            return;
        }

        setSaving(true);
        setMessage('Deleting department...');

        try {
            const response = await fetch(`/api/admin/departments/${department.departmentId}`, {
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
                setMessage(payload?.message || 'Department is in use and cannot be deleted.');
                return;
            }

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                setMessage(payload?.message || `Delete failed: ${response.status}`);
                return;
            }

            setDepartments((current) => current.filter((item) => item.departmentId !== department.departmentId));
            setMessage('Department deleted.');
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage(`Delete error: ${details}`);
        } finally {
            setSaving(false);
        }
    }

    if (!session?.token || !user) {
        return null;
    }

    return (
        <div style={{ padding: '1rem', fontFamily: 'Arial, sans-serif' }}>
            <h1>Department Management</h1>
            <p>
                <button type="button" onClick={goBack}>Back to admin dashboard</button>
            </p>

            {message && <p>{message}</p>}

            <h3>Create department</h3>
            <p>
                <input
                    placeholder="Department name"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                />
                <select
                    value={createQaUserId}
                    onChange={(e) => setCreateQaUserId(e.target.value)}
                    style={{ marginLeft: '0.5rem' }}>
                    <option value="">No QA coordinator</option>
                    {qaCoordinators.map((item) => (
                        <option key={item.id} value={item.id}>{item.name} ({item.email})</option>
                    ))}
                </select>
                <button type="button" onClick={createDepartment} style={{ marginLeft: '0.5rem' }} disabled={saving}>Create</button>
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.4rem' }}>Id</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.4rem' }}>Name</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.4rem' }}>QA Coordinator</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '0.4rem' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {departments.map((row) => {
                        const editing = editingDepartmentId === row.departmentId;

                        return (
                            <tr key={row.departmentId}>
                                <td style={{ borderBottom: '1px solid #eee', padding: '0.4rem' }}>{row.departmentId}</td>
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
                                        <select
                                            value={form.qaCoordinatorUserId}
                                            onChange={(e) => setForm((prev) => ({ ...prev, qaCoordinatorUserId: e.target.value }))}>
                                            <option value="">No QA coordinator</option>
                                            {qaCoordinators.map((item) => (
                                                <option key={item.id} value={item.id}>{item.name} ({item.email})</option>
                                            ))}
                                        </select>
                                    ) : (row.qaCoordinatorName || 'None')}
                                </td>
                                <td style={{ borderBottom: '1px solid #eee', padding: '0.4rem' }}>
                                    {!editing && <button type="button" onClick={() => beginEdit(row)}>Edit</button>}
                                    {editing && (
                                        <>
                                            <button type="button" onClick={saveEdit} disabled={saving}>Save</button>
                                            <button type="button" onClick={cancelEdit} style={{ marginLeft: '0.5rem' }} disabled={saving}>Cancel</button>
                                        </>
                                    )}
                                    {!editing && (
                                        <button
                                            type="button"
                                            onClick={() => deleteDepartment(row)}
                                            style={{ marginLeft: '0.5rem' }}
                                            disabled={saving}>
                                            Delete
                                        </button>
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

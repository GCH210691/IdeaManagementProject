import { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders, getAuthSession, roleToPath } from '../shared/authStorage';
import StaffShell from '../shells/StaffShell';

export default function QaCoordinatorDepartmentManagementPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;

    const [departmentId, setDepartmentId] = useState(0);
    const [departmentName, setDepartmentName] = useState('');
    const [departmentStaff, setDepartmentStaff] = useState([]);
    const [availableStaff, setAvailableStaff] = useState([]);
    const [message, setMessage] = useState('Loading department management...');
    const [loading, setLoading] = useState(true);
    const [savingUserId, setSavingUserId] = useState(0);

    async function loadData(successMessage = '') {
        setLoading(true);

        try {
            const response = await fetch('/api/qa-coordinator/department-management', {
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
                setMessage(`Load failed: ${response.status}`);
                return;
            }

            const payload = await response.json();
            setDepartmentId(Number(payload.departmentId || 0));
            setDepartmentName(String(payload.departmentName || ''));
            setDepartmentStaff(Array.isArray(payload.departmentStaff) ? payload.departmentStaff : []);
            setAvailableStaff(Array.isArray(payload.availableStaff) ? payload.availableStaff : []);
            setMessage(successMessage);
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage(`Load error: ${details}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!session?.token || !user) {
            window.location.href = '/login';
            return;
        }

        if (user.role !== 'QA_COORDINATOR') {
            window.location.href = roleToPath(user.role);
            return;
        }

        loadData();
    }, [session, user]);

    async function assignStaffToDepartment(staff) {
        if (!departmentId) {
            setMessage('Your department is not available.');
            return;
        }

        setSavingUserId(staff.id);
        setMessage('');

        try {
            const response = await fetch(`/api/qa-coordinator/department-management/staff/${staff.id}/department`, {
                method: 'PUT',
                headers: getAuthHeaders({
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }),
                body: JSON.stringify({ departmentId }),
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
                setMessage(payload?.message || `Save failed: ${response.status}`);
                return;
            }

            await loadData(`Assigned ${staff.name} to ${departmentName}.`);
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage(`Save error: ${details}`);
        } finally {
            setSavingUserId(0);
        }
    }

    if (!session?.token || !user) {
        return null;
    }

    return (
        <StaffShell activeMenu="department-management" footerText={departmentName ? `${departmentStaff.length} staff in ${departmentName}` : 'Department management'}>
            <div>
                <h1>Department Management</h1>
                <p>
                    View staff in your department and assign staff into {departmentName || 'your department'}.
                </p>

                <p>
                    <button type="button" onClick={() => loadData()} disabled={loading}>
                        Refresh
                    </button>
                </p>

                {message && <p>{message}</p>}

                <section>
                    <h2>Staff in {departmentName || 'your department'}</h2>
                    {loading ? (
                        <p>Loading staff...</p>
                    ) : departmentStaff.length === 0 ? (
                        <p>No staff currently belong to your department.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Department</th>
                                </tr>
                            </thead>
                            <tbody>
                                {departmentStaff.map((staff) => (
                                    <tr key={staff.id}>
                                        <td>{staff.name}</td>
                                        <td>{staff.email}</td>
                                        <td>{staff.departmentName}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>

                <section style={{ marginTop: '1.5rem' }}>
                    <h2>Assign staff to {departmentName || 'your department'}</h2>
                    {loading ? (
                        <p>Loading staff...</p>
                    ) : availableStaff.length === 0 ? (
                        <p>No staff from other departments are available.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Current department</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {availableStaff.map((staff) => (
                                    <tr key={staff.id}>
                                        <td>{staff.name}</td>
                                        <td>{staff.email}</td>
                                        <td>{staff.departmentName}</td>
                                        <td>
                                            <button
                                                type="button"
                                                onClick={() => assignStaffToDepartment(staff)}
                                                disabled={savingUserId === staff.id}>
                                                {savingUserId === staff.id ? 'Saving...' : `Assign to ${departmentName || 'my department'}`}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </div>
        </StaffShell>
    );
}

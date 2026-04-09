import { useEffect, useMemo, useState } from 'react';
import { BASE_URL, getAuthHeaders, getAuthSession, roleToPath } from '../shared/authStorage';
import StaffShell from '../shells/StaffShell';

export default function QaCoordinatorNotificationsPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;
    const [notifications, setNotifications] = useState([]);
    const [message, setMessage] = useState('Loading notifications...');
    const [loading, setLoading] = useState(true);

    async function loadNotifications(successMessage = '') {
        setLoading(true);

        try {
            const response = await fetch(`${BASE_URL}/api/qa-coordinator/notifications`, {
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
            setNotifications(Array.isArray(payload) ? payload : []);
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

        loadNotifications();
    }, [session, user]);

    function viewIdea(notification) {
        if (!notification.ideaId) {
            return;
        }

        window.location.href = `/ideas/${notification.ideaId}`;
    }

    if (!session?.token || !user) {
        return null;
    }

    return (
        <StaffShell activeMenu="notifications" footerText={`${notifications.length} notifications`}>
            <div>
                <h1>Notifications</h1>
                <p>View idea notifications from staff in your department.</p>

                <p>
                    <button type="button" onClick={() => loadNotifications('Notifications refreshed.')} disabled={loading}>
                        Refresh
                    </button>
                </p>

                {message && <p>{message}</p>}

                {loading ? (
                    <p>Loading notifications...</p>
                ) : notifications.length === 0 ? (
                    <p>No notifications yet.</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Staff</th>
                                <th>Idea</th>
                                <th>Department</th>
                                <th>Created</th>
                                <th>Message</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notifications.map((notification) => (
                                <tr key={notification.notificationId}>
                                    <td>{notification.staffName}</td>
                                    <td>{notification.ideaTitle}</td>
                                    <td>{notification.departmentName}</td>
                                    <td>{new Date(notification.createdAt).toLocaleString()}</td>
                                    <td>{notification.message}</td>
                                    <td>
                                        {notification.canViewIdea ? (
                                            <button type="button" onClick={() => viewIdea(notification)}>
                                                View
                                            </button>
                                        ) : (
                                            <span>Idea deleted</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </StaffShell>
    );
}

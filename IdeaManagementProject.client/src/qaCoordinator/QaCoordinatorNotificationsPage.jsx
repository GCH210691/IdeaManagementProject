import { useEffect, useMemo, useState } from 'react';
import { BASE_URL, getAuthHeaders, getAuthSession, roleToPath } from '../shared/authStorage';
import StaffShell from '../shells/StaffShell';

const font = "'DM Sans', 'Segoe UI', system-ui, sans-serif";

export default function QaCoordinatorNotificationsPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;
    const [notifications, setNotifications] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    async function loadNotifications(successMessage = '') {
        setLoading(true);
        setMessage('');
        try {
            const response = await fetch(`${BASE_URL}/api/qa-coordinator/notifications`, {
                headers: getAuthHeaders({ Accept: 'application/json' }),
            });

            if (response.status === 401) { window.location.href = '/login'; return; }
            if (response.status === 403) { window.location.href = roleToPath(user?.role); return; }
            if (!response.ok) { setMessage(`Load failed: ${response.status}`); return; }

            const payload = await response.json();
            setNotifications(Array.isArray(payload) ? payload : []);
            setMessage(successMessage);
        } catch (error) {
            setMessage(`Load error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!session?.token || !user) { window.location.href = '/login'; return; }
        if (user.role !== 'QA_COORDINATOR') { window.location.href = roleToPath(user.role); return; }
        loadNotifications();
    }, [session, user]);

    function viewIdea(notification) {
        if (notification.ideaId) window.location.href = `/ideas/${notification.ideaId}`;
    }

    if (!session?.token || !user) return null;

    return (
        <StaffShell activeMenu="notifications" footerText={`${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`}>
            {/* Header */}
            <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.3rem', fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', fontFamily: font }}>
                        Notifications
                    </h1>
                    <p style={{ margin: 0, color: '#64748B', fontSize: '14px', fontFamily: font }}>
                        View idea notifications from staff in your department.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => loadNotifications('Notifications refreshed.')}
                    disabled={loading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '9px 18px', borderRadius: '9px', border: '1.5px solid #E2E8F0',
                        background: loading ? '#F1F5F9' : '#fff', color: loading ? '#94A3B8' : '#475569',
                        fontWeight: 600, fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer',
                        fontFamily: font, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'all .15s',
                    }}
                >
                    {loading ? '⏳ Loading…' : '↻ Refresh'}
                </button>
            </div>

            {/* Success message */}
            {message && !message.startsWith('Load') && (
                <div style={{
                    marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px',
                    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                    color: '#059669', fontSize: '13px', fontFamily: font, fontWeight: 500,
                }}>
                    ✓ {message}
                </div>
            )}

            {/* Error message */}
            {message && message.startsWith('Load') && (
                <div style={{
                    marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    color: '#DC2626', fontSize: '13px', fontFamily: font, fontWeight: 500,
                }}>
                    ⚠ {message}
                </div>
            )}

            {/* Card */}
            <div style={{
                background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0',
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden',
            }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8', fontFamily: font, fontSize: '14px' }}>
                        <div style={{ fontSize: '28px', marginBottom: '10px' }}>⏳</div>
                        Loading notifications…
                    </div>
                ) : notifications.length === 0 ? (
                    <div style={{ padding: '3.5rem', textAlign: 'center', fontFamily: font }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔔</div>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '15px', marginBottom: '6px' }}>No notifications yet</div>
                        <div style={{ color: '#94A3B8', fontSize: '13px' }}>When staff submit ideas, you'll see them here.</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: font }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                                    {['Staff', 'Idea', 'Department', 'Created', 'Message', 'Action'].map(h => (
                                        <th key={h} style={{
                                            padding: '11px 16px', textAlign: 'left', fontSize: '11px',
                                            fontWeight: 700, color: '#64748B', letterSpacing: '0.07em',
                                            textTransform: 'uppercase', whiteSpace: 'nowrap',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {notifications.map((n, i) => (
                                    <tr key={n.notificationId}
                                        style={{ borderBottom: i < notifications.length - 1 ? '1px solid #F1F5F9' : 'none', transition: 'background .1s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#FAFBFF'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '13px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                                                    background: 'linear-gradient(135deg,#10B981,#059669)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '11px' }}>
                                                        {(n.staffName || 'U').slice(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>{n.staffName}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '13px 16px', fontSize: '13px', color: '#334155', fontWeight: 500, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {n.ideaTitle}
                                        </td>
                                        <td style={{ padding: '13px 16px' }}>
                                            <span style={{
                                                display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
                                                background: 'rgba(16,185,129,0.1)', color: '#059669',
                                                fontSize: '12px', fontWeight: 600,
                                            }}>
                                                {n.departmentName}
                                            </span>
                                        </td>
                                        <td style={{ padding: '13px 16px', fontSize: '12.5px', color: '#64748B', whiteSpace: 'nowrap' }}>
                                            {new Date(n.createdAt).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '13px 16px', fontSize: '13px', color: '#475569', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {n.message}
                                        </td>
                                        <td style={{ padding: '13px 16px' }}>
                                            {n.canViewIdea ? (
                                                <button type="button" onClick={() => viewIdea(n)}
                                                    style={{
                                                        padding: '6px 14px', borderRadius: '7px', border: 'none',
                                                        background: 'linear-gradient(135deg,#6366F1,#818CF8)',
                                                        color: '#fff', fontWeight: 600, fontSize: '12px',
                                                        cursor: 'pointer', fontFamily: font,
                                                        boxShadow: '0 2px 6px rgba(99,102,241,0.3)',
                                                    }}>
                                                    View →
                                                </button>
                                            ) : (
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: '6px',
                                                    background: '#F1F5F9', color: '#94A3B8',
                                                    fontSize: '12px', fontWeight: 500,
                                                }}>
                                                    Deleted
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </StaffShell>
    );
}

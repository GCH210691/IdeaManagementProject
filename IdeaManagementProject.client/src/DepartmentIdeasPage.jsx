import { useEffect, useMemo, useState } from 'react';
import { BASE_URL, getAuthHeaders, getAuthSession, isDashboardRole, roleToPath } from './shared/authStorage';
import StaffShell from './shells/StaffShell';

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

function statsGridStyle() {
    return {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '1.25rem',
    };
}

function statCardStyle() {
    return {
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #F3F4F6',
        padding: '1.25rem',
        boxSizing: 'border-box',
    };
}

function sectionStyle() {
    return {
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #F3F4F6',
        padding: '1.25rem',
    };
}

function rowStyle(isLast) {
    return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        paddingBottom: isLast ? 0 : '0.9rem',
        marginBottom: isLast ? 0 : '0.9rem',
        borderBottom: isLast ? 'none' : '1px solid #F3F4F6',
    };
}

function badgeStyle() {
    return {
        fontSize: '11px',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: '999px',
        background: '#DBEAFE',
        color: '#1D4ED8',
    };
}

export default function DepartmentIdeasPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;

    const [ideas, setIdeas] = useState([]);
    const [message, setMessage] = useState('Loading department data...');

    useEffect(() => {
        if (!session?.token || !user) {
            window.location.href = '/login';
            return;
        }

        if (!isDashboardRole(user)) {
            window.location.href = roleToPath(user.role);
            return;
        }

        let cancelled = false;

        async function loadIdeas() {
            try {
                const endpoint = BASE_URL ? `${BASE_URL}/api/ideas` : '/api/ideas';
                const response = await fetch(endpoint, {
                    headers: getAuthHeaders({ Accept: 'application/json' }),
                });

                if (response.status === 401) {
                    window.location.href = '/login';
                    return;
                }

                if (!response.ok) {
                    setMessage(`Unable to load ideas: ${response.status}`);
                    return;
                }

                const payload = await response.json();
                if (cancelled) {
                    return;
                }

                setIdeas(Array.isArray(payload) ? payload : []);
                setMessage('');
            } catch (error) {
                const details = error instanceof Error ? error.message : String(error);
                setMessage(`Load error: ${details}`);
            }
        }

        loadIdeas();

        return () => {
            cancelled = true;
        };
    }, [session, user]);

    const summary = useMemo(() => {
        const grouped = new Map();

        for (const idea of ideas) {
            const key = idea.departmentName || 'Unknown';
            const current = grouped.get(key) || { name: key, count: 0, views: 0 };
            current.count += 1;
            current.views += idea.viewCount || 0;
            grouped.set(key, current);
        }

        return [...grouped.values()].sort((a, b) => b.count - a.count);
    }, [ideas]);

    const topDepartment = summary[0];

    if (!session?.token || !user) {
        return null;
    }

    return (
        <StaffShell activeMenu="departments" footerText={`${summary.length} departments tracked`}>
            <div style={pageHeaderStyle()}>
                <div>
                    <h1 style={h1Style()}>Departments</h1>
                    <p style={subStyle()}>Browse idea activity grouped by department.</p>
                </div>
            </div>

            <div style={statsGridStyle()}>
                <div style={statCardStyle()}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827' }}>{summary.length}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Departments with ideas</div>
                </div>
                <div style={statCardStyle()}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827' }}>{ideas.length}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Ideas across departments</div>
                </div>
                <div style={statCardStyle()}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827' }}>{topDepartment ? topDepartment.name : 'None'}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Largest department by idea count</div>
                </div>
            </div>

            {message && <p style={{ color: '#B91C1C', marginTop: 0 }}>{message}</p>}

            {!message && summary.length === 0 && (
                <div style={sectionStyle()}>
                    <p style={{ margin: 0, color: '#6B7280', fontSize: '13px' }}>No department data yet.</p>
                </div>
            )}

            {!message && summary.length > 0 && (
                <div style={sectionStyle()}>
                    <h2 style={{ margin: '0 0 1rem 0', fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>
                        Ideas by department
                    </h2>
                    {summary.map((item, index) => (
                        <div key={item.name} style={rowStyle(index === summary.length - 1)}>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{item.name}</div>
                                <div style={{ marginTop: '0.2rem', fontSize: '12px', color: '#6B7280' }}>
                                    {item.views} total views
                                </div>
                            </div>
                            <span style={badgeStyle()}>{item.count} ideas</span>
                        </div>
                    ))}
                </div>
            )}
        </StaffShell>
    );
}


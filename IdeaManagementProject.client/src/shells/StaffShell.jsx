import { canCreateIdeas, canViewAcademicYearReports, canViewCategoryList, clearAuthSession, getAuthSession } from '../shared/authStorage';

function pageStyle() {
    return {
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        background: '#F9FAFB',
    };
}

function sidebarStyle() {
    return {
        width: '224px',
        minHeight: '100vh',
        background: '#0F1C33',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
    };
}

function sidebarLogoAreaStyle() {
    return {
        padding: '1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    };
}

function logoBadgeStyle() {
    return {
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        background: '#3B82F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 900,
        fontSize: '12px',
        flexShrink: 0,
    };
}

function navStyle() {
    return {
        flex: 1,
        padding: '1rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    };
}

function navItemStyle(active) {
    return {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.6rem 0.75rem',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        border: 'none',
        width: '100%',
        textAlign: 'left',
        transition: 'background 0.15s, color 0.15s',
        background: active ? '#3B82F6' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.5)',
        fontFamily: 'inherit',
    };
}

function onlineDotStyle() {
    return {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#4ADE80',
        flexShrink: 0,
    };
}

function mainStyle() {
    return {
        flex: 1,
        padding: '2rem',
        overflowY: 'auto',
        boxSizing: 'border-box',
    };
}

function toRoleLabel(role) {
    return String(role || 'User')
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

export default function StaffShell({ activeMenu, footerText, children }) {
    const session = getAuthSession();
    const user = session?.user;
    const roleLabel = toRoleLabel(user?.role || 'User');

    const menuItems = [
        { id: 'dashboard', icon: 'DB', label: 'Dashboard', path: '/dashboard' },
        { id: 'ideas', icon: 'VI', label: 'View ideas', path: '/ideas' },
        ...(canCreateIdeas(user) ? [{ id: 'create', icon: 'CI', label: 'Create idea', path: '/ideas/create' }] : []),
        ...(canCreateIdeas(user) ? [{ id: 'myideas', icon: 'MY', label: 'My ideas', path: '/staff/my-ideas' }] : []),
        { id: 'departments', icon: 'DP', label: 'Departments', path: '/staff/departments' },
        ...(user?.role === 'QA_COORDINATOR'
            ? [
                { id: 'notifications', icon: 'NT', label: 'Notifications', path: '/qa-coordinator/notifications' },
                { id: 'department-management', icon: 'DM', label: 'Department management', path: '/qa-coordinator/department-management' }
            ]
            : []),
        ...(canViewAcademicYearReports(user)
            ? [{ id: 'academic-year-reports', icon: 'AR', label: 'Academic year reports', path: '/qa-manager/academic-year-reports' }]
            : []),
        ...(canViewCategoryList(user) ? [{ id: 'categories', icon: 'CL', label: 'Category list', path: '/qa-manager/categories' }] : []),
    ];

    function handleLogout() {
        clearAuthSession();
        window.location.href = '/login';
    }

    return (
        <div style={pageStyle()}>
            <div style={sidebarStyle()}>
                <div style={sidebarLogoAreaStyle()}>
                    <div style={logoBadgeStyle()}>SS</div>
                    <div>
                        <div style={{ color: '#fff', fontWeight: 900, fontSize: '14px', lineHeight: 1.2 }}>IdeaHub</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{roleLabel}</div>
                    </div>
                </div>

                <nav style={navStyle()}>
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            style={navItemStyle(activeMenu === item.id)}
                            onClick={() => {
                                if (window.location.pathname.toLowerCase() !== item.path.toLowerCase()) {
                                    window.location.href = item.path;
                                }
                            }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, width: '16px' }}>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div style={onlineDotStyle()} />
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{footerText || 'Idea workspace'}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            background: 'none',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '7px',
                            color: 'rgba(255,255,255,0.4)',
                            fontSize: '12px',
                            cursor: 'pointer',
                            padding: '6px 12px',
                            width: '100%',
                            fontFamily: 'inherit',
                        }}>
                        Logout
                    </button>
                </div>
            </div>

            <main style={mainStyle()}>{children}</main>
        </div>
    );
}

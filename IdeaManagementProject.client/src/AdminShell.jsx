import { clearAuthSession } from './authStorage';

function shellStyle() {
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
        background: 'linear-gradient(135deg, #2563EB, #60A5FA)',
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

function mainStyle() {
    return {
        flex: 1,
        padding: '2rem',
        overflowY: 'auto',
        boxSizing: 'border-box',
    };
}

const MENU_ITEMS = [
    { id: 'overview', icon: 'OV', label: 'Overview' },
    { id: 'users', icon: 'AC', label: 'Accounts' },
    { id: 'departments', icon: 'DP', label: 'Departments' },
    { id: 'closure-periods', icon: 'CP', label: 'Closure dates' },
    { id: 'analytics', icon: 'AN', label: 'Analytics' },
    { id: 'categories', icon: 'CT', label: 'Categories' },
];

export default function AdminShell({ activeMenu, onMenuSelect, children }) {
    function defaultNavigate(itemId) {
        if (itemId === 'overview') {
            window.location.href = '/admin/dashboard';
            return;
        }

        if (itemId === 'users') {
            window.location.href = '/admin/accounts';
            return;
        }

        if (itemId === 'departments') {
            window.location.href = '/admin/departments';
            return;
        }

        if (itemId === 'closure-periods') {
            window.location.href = '/admin/closure-periods';
            return;
        }

        window.location.href = '/admin/dashboard';
    }

    function handleMenuClick(itemId) {
        if (typeof onMenuSelect === 'function') {
            const handled = onMenuSelect(itemId);
            if (handled) {
                return;
            }
        }

        defaultNavigate(itemId);
    }

    function handleLogout() {
        clearAuthSession();
        window.location.href = '/login';
    }

    return (
        <div style={shellStyle()}>
            <div style={sidebarStyle()}>
                <div style={sidebarLogoAreaStyle()}>
                    <div style={logoBadgeStyle()}>SS</div>
                    <div>
                        <div style={{ color: '#fff', fontWeight: 900, fontSize: '14px', lineHeight: 1.2 }}>IdeaHub</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Admin</div>
                    </div>
                </div>

                <nav style={navStyle()}>
                    {MENU_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            style={navItemStyle(activeMenu === item.id)}
                            onClick={() => handleMenuClick(item.id)}>
                            <span style={{ fontSize: '11px', fontWeight: 800, width: '16px' }}>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ADE80' }} />
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>247 users online</span>
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

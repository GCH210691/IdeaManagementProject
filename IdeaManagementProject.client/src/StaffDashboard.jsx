import { useState, useEffect } from 'react';
import { recentIdeas, hotIdeas, recentComments, requireAuth } from './dashboardData';

// ── STYLES ────────────────────────────────────────────────────────────

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
        width: '32px', height: '32px',
        borderRadius: '8px',
        background: '#3B82F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 900, fontSize: '12px', flexShrink: 0,
    };
}

function navStyle() {
    return { flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' };
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
        width: '8px', height: '8px',
        borderRadius: '50%',
        background: '#4ADE80',
        flexShrink: 0,
    };
}

function mainStyle() {
    return { flex: 1, padding: '2rem', overflowY: 'auto' };
}

function pageHeaderStyle() {
    return { marginBottom: '2rem' };
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
        marginBottom: '2rem',
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

function statTopRowStyle() {
    return { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' };
}

function changeBadgeStyle() {
    return {
        fontSize: '11px', fontWeight: 700,
        color: '#059669',
        background: '#ECFDF5',
        padding: '2px 8px',
        borderRadius: '999px',
    };
}

function tabBarStyle() {
    return {
        display: 'flex',
        background: '#E5E7EB',
        borderRadius: '10px',
        padding: '4px',
        width: 'fit-content',
        marginBottom: '1.25rem',
    };
}

function tabBtnStyle(active) {
    return {
        padding: '6px 16px',
        borderRadius: '7px',
        fontSize: '13px',
        fontWeight: 700,
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        background: active ? '#fff' : 'transparent',
        color: active ? '#111827' : '#6B7280',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
        transition: 'all 0.2s',
    };
}

function ideasGridStyle() {
    return {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '2rem',
    };
}

function ideaCardStyle() {
    return {
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #F3F4F6',
        padding: '1rem',
        boxSizing: 'border-box',
        transition: 'box-shadow 0.2s',
    };
}

function badgeStyle(category) {
    const map = {
        HR:          { background: '#ECFDF5', color: '#065F46' },
        'Giáo dục':  { background: '#EEF2FF', color: '#3730A3' },
        'Dịch vụ':   { background: '#FFF7ED', color: '#9A3412' },
        'Kinh doanh':{ background: '#EFF6FF', color: '#1D4ED8' },
        'Công cụ':   { background: '#F5F3FF', color: '#5B21B6' },
    };
    const c = map[category] || { background: '#F3F4F6', color: '#374151' };
    return {
        fontSize: '11px', fontWeight: 600,
        padding: '2px 8px', borderRadius: '999px',
        ...c,
    };
}

function hotTagStyle() {
    return { fontSize: '11px', fontWeight: 700, color: '#F97316' };
}

function commentSectionStyle() {
    return {
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #F3F4F6',
        padding: '1.25rem',
    };
}

function commentRowStyle() {
    return {
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #F9FAFB',
        marginBottom: '0.75rem',
    };
}

function avatarStyle() {
    return {
        width: '32px', height: '32px',
        borderRadius: '50%',
        background: '#3B82F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: '12px', fontWeight: 700,
        flexShrink: 0,
    };
}

// ── SIDEBAR ───────────────────────────────────────────────────────────

function Sidebar({ active, setActive }) {
    const menuItems = [
        { id: 'dashboard', icon: '🏠', label: 'Dashboard'         },
        { id: 'myideas',   icon: '💡', label: 'Ý tưởng của tôi'  },
        { id: 'categories',icon: '📁', label: 'Danh mục'          },
    ];

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }

    return (
        <div style={sidebarStyle()}>
            {/* Logo */}
            <div style={sidebarLogoAreaStyle()}>
                <div style={logoBadgeStyle()}>SS</div>
                <div>
                    <div style={{ color: '#fff', fontWeight: 900, fontSize: '14px', lineHeight: 1.2 }}>IdeaHub</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Staff</div>
                </div>
            </div>

            {/* Nav */}
            <nav style={navStyle()}>
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        style={navItemStyle(active === item.id)}
                        onClick={() => setActive(item.id)}
                    >
                        <span style={{ fontSize: '16px' }}>{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* Footer */}
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={onlineDotStyle()} />
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>247 người online</span>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '7px', color: 'rgba(255,255,255,0.4)',
                        fontSize: '12px', cursor: 'pointer', padding: '6px 12px',
                        width: '100%', fontFamily: 'inherit',
                        transition: 'color 0.15s, border-color 0.15s',
                    }}
                >
                    Đăng xuất
                </button>
            </div>
        </div>
    );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────

function App() {
    const [activeMenu, setActiveMenu] = useState('dashboard');
    const [tab, setTab] = useState('recent');

    useEffect(() => {
        requireAuth();
    }, []);

    const ideas = tab === 'recent' ? recentIdeas : hotIdeas;

    return (
        <div style={pageStyle()}>
            <Sidebar active={activeMenu} setActive={setActiveMenu} />

            <main style={mainStyle()}>

                {/* Page header */}
                <div style={pageHeaderStyle()}>
                    <h1 style={h1Style()}>Dashboard</h1>
                    <p style={subStyle()}>Chào mừng trở lại! Dưới đây là những gì đang diễn ra.</p>
                </div>

                {/* Stats */}
                <div style={statsGridStyle()}>
                    {[
                        { label: 'Ý tưởng hôm nay',   value: '24',  icon: '💡', change: '+12%' },
                        { label: 'Bình luận hôm nay',  value: '89',  icon: '💬', change: '+8%'  },
                        { label: 'Lượt thích hôm nay', value: '312', icon: '👍', change: '+23%' },
                    ].map(s => (
                        <div key={s.label} style={statCardStyle()}>
                            <div style={statTopRowStyle()}>
                                <span style={{ fontSize: '24px' }}>{s.icon}</span>
                                <span style={changeBadgeStyle()}>{s.change}</span>
                            </div>
                            <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#111827' }}>{s.value}</div>
                            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Tab switcher */}
                <div style={tabBarStyle()}>
                    <button style={tabBtnStyle(tab === 'recent')}  onClick={() => setTab('recent')}>Mới nhất</button>
                    <button style={tabBtnStyle(tab === 'hot')}     onClick={() => setTab('hot')}>Sôi nổi nhất 🔥</button>
                </div>

                {/* Ideas grid */}
                <div style={ideasGridStyle()}>
                    {ideas.map(idea => (
                        <div key={idea.id} style={ideaCardStyle()}>
                            {/* Top row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={badgeStyle(idea.category)}>{idea.category}</span>
                                    {idea.hot && <span style={hotTagStyle()}>🔥 Hot</span>}
                                </div>
                                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{idea.time}</span>
                            </div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 700, color: '#111827', lineHeight: 1.4 }}>
                                {idea.title}
                            </h3>
                            <p style={{ margin: '0 0 0.75rem 0', fontSize: '12px', color: '#6B7280' }}>bởi {idea.author}</p>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '12px', color: '#6B7280' }}>
                                <span>👍 {idea.likes}</span>
                                <span>💬 {idea.comments}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent comments */}
                <div style={commentSectionStyle()}>
                    <h2 style={{ margin: '0 0 1rem 0', fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>
                        💬 Bình luận gần nhất
                    </h2>
                    {recentComments.map((c, i) => (
                        <div
                            key={i}
                            style={{
                                ...commentRowStyle(),
                                ...(i === recentComments.length - 1
                                    ? { borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }
                                    : {}),
                            }}
                        >
                            <div style={avatarStyle()}>
                                {c.user[c.user.length - 1]}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937' }}>{c.user}</span>
                                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>→</span>
                                    <span style={{ fontSize: '12px', color: '#3B82F6' }}>{c.idea}</span>
                                    <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: 'auto' }}>{c.time}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '12px', color: '#4B5563' }}>{c.text}</p>
                            </div>
                        </div>
                    ))}
                </div>

            </main>
        </div>
    );
}

export default App;

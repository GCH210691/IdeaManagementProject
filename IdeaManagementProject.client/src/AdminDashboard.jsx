import { useEffect } from 'react';
import {
    PieChart, Pie, Cell,
    LineChart, Line,
    BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { roleData, postFreq, categoryDist, onlineUsers, requireAuth } from './dashboardData';

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
        background: 'linear-gradient(135deg, #2563EB, #60A5FA)',
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

function mainStyle() {
    return { flex: 1, padding: '2rem', overflowY: 'auto' };
}

function pageHeaderStyle() {
    return {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '2rem',
    };
}

function h1Style() {
    return { margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 900, color: '#111827' };
}

function subStyle() {
    return { margin: 0, fontSize: '13px', color: '#6B7280' };
}

function exportBtnStyle() {
    return {
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        border: 'none',
        background: '#3B82F6',
        color: '#fff',
        fontSize: '13px',
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    };
}

function kpiGridStyle() {
    return {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem',
    };
}

function kpiCardStyle() {
    return {
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #F3F4F6',
        padding: '1.25rem',
        boxSizing: 'border-box',
    };
}

function kpiTopRowStyle() {
    return { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' };
}

function changeBadgeStyle() {
    return {
        fontSize: '11px', fontWeight: 700,
        color: '#059669', background: '#ECFDF5',
        padding: '2px 8px', borderRadius: '999px',
    };
}

function twoColStyle() {
    return {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
        marginBottom: '1.5rem',
    };
}

function chartCardStyle() {
    return {
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #F3F4F6',
        padding: '1.25rem',
        boxSizing: 'border-box',
    };
}

function chartTitleStyle() {
    return { margin: '0 0 1rem 0', fontSize: '13px', fontWeight: 700, color: '#1F2937' };
}

function pieRowStyle() {
    return { display: 'flex', alignItems: 'center', gap: '1rem' };
}

function legendItemStyle() {
    return { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' };
}

// ── SIDEBAR ───────────────────────────────────────────────────────────

function Sidebar({ active, setActive }) {
    const menuItems = [
        { id: 'overview',    icon: '⬛', label: 'Tổng quan'  },
        { id: 'users',       icon: '👥', label: 'Tài khoản'  },
        { id: 'analytics',   icon: '📊', label: 'Phân tích'  },
        { id: 'categories',  icon: '📁', label: 'Danh mục'   },
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
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Admin</div>
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
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ADE80' }} />
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>247 người online</span>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '7px', color: 'rgba(255,255,255,0.4)',
                        fontSize: '12px', cursor: 'pointer', padding: '6px 12px',
                        width: '100%', fontFamily: 'inherit',
                    }}
                >
                    Đăng xuất
                </button>
            </div>
        </div>
    );
}

// ── KPI CARD ──────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, change }) {
    return (
        <div style={kpiCardStyle()}>
            <div style={kpiTopRowStyle()}>
                <span style={{ fontSize: '24px' }}>{icon}</span>
                {change && <span style={changeBadgeStyle()}>{change}</span>}
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#111827' }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>{label}</div>
        </div>
    );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────

import { useState } from 'react';

function App() {
    const [activeMenu, setActiveMenu] = useState('overview');

    useEffect(() => {
        requireAuth();
    }, []);

    return (
        <div style={pageStyle()}>
            <Sidebar active={activeMenu} setActive={setActiveMenu} />

            <main style={mainStyle()}>

                {/* Page header */}
                <div style={pageHeaderStyle()}>
                    <div>
                        <h1 style={h1Style()}>Analytics Dashboard</h1>
                        <p style={subStyle()}>Tổng quan toàn hệ thống – cập nhật thời gian thực</p>
                    </div>
                    <button style={exportBtnStyle()}>⬇ Xuất báo cáo</button>
                </div>

                {/* KPI Cards */}
                <div style={kpiGridStyle()}>
                    <KpiCard icon="👥" label="Tổng tài khoản"   value="8,500" change="+3.2%" />
                    <KpiCard icon="💡" label="Tổng ý tưởng"     value="1,250" change="+8.1%" />
                    <KpiCard icon="🟢" label="Đang online"       value="247"               />
                    <KpiCard icon="💬" label="Bình luận hôm nay" value="482"   change="+12%" />
                </div>

                {/* Row 1: Pie + Bar */}
                <div style={twoColStyle()}>

                    {/* Role distribution */}
                    <div style={chartCardStyle()}>
                        <h2 style={chartTitleStyle()}>Phân bổ Role tài khoản</h2>
                        <div style={pieRowStyle()}>
                            <ResponsiveContainer width="50%" height={160}>
                                <PieChart>
                                    <Pie
                                        data={roleData}
                                        cx="50%" cy="50%"
                                        innerRadius={45} outerRadius={70}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {roleData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={v => v.toLocaleString()} />
                                </PieChart>
                            </ResponsiveContainer>

                            <div style={{ flex: 1 }}>
                                {roleData.map(r => (
                                    <div key={r.name} style={legendItemStyle()}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: r.color, flexShrink: 0, display: 'inline-block' }} />
                                            <span style={{ fontSize: '12px', color: '#4B5563' }}>{r.name}</span>
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>
                                            {r.value.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Ideas by category */}
                    <div style={chartCardStyle()}>
                        <h2 style={chartTitleStyle()}>Ý tưởng theo Danh mục</h2>
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={categoryDist} barSize={20}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Bar dataKey="ideas" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Row 2: Line charts */}
                <div style={twoColStyle()}>

                    {/* Post & comment frequency */}
                    <div style={chartCardStyle()}>
                        <h2 style={chartTitleStyle()}>Tần suất đăng bài &amp; bình luận</h2>
                        <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={postFreq}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Line type="monotone" dataKey="posts"    stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} name="Bài đăng"   />
                                <Line type="monotone" dataKey="comments" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3 }} name="Bình luận"  />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Online users today */}
                    <div style={chartCardStyle()}>
                        <h2 style={chartTitleStyle()}>Người dùng online hôm nay</h2>
                        <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={onlineUsers}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} name="Online" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </main>
        </div>
    );
}

export default App;

import { useEffect, useMemo, useState } from 'react';
import {
    PieChart, Pie, Cell,
    LineChart, Line,
    BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import AdminShell from './AdminShell';
import { roleData, postFreq, categoryDist, onlineUsers, requireAuth } from './dashboardData';

// ─── Màu cho donut chart role ────────────────────────────────────────────────
const ROLE_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#1E3A5F', '#10B981', '#F59E0B'];

// ─── Style helpers ────────────────────────────────────────────────────────────
const pageHeaderStyle = () => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap',
});
const h1Style = () => ({
    margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 900, color: '#111827',
});
const subStyle = () => ({ margin: 0, fontSize: '13px', color: '#6B7280' });
const exportBtnStyle = () => ({
    padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
    background: '#3B82F6', color: '#fff', fontSize: '13px', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
});
const kpiGridStyle = () => ({
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem', marginBottom: '1.5rem',
});
const kpiCardStyle = () => ({
    background: '#fff', borderRadius: '12px', border: '1px solid #F3F4F6',
    padding: '1.25rem', boxSizing: 'border-box',
});
const kpiTopRowStyle = () => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem',
});
const changeBadgeStyle = (positive) => ({
    fontSize: '11px', fontWeight: 700,
    color: positive ? '#059669' : '#DC2626',
    background: positive ? '#ECFDF5' : '#FEF2F2',
    padding: '2px 8px', borderRadius: '999px',
});
const twoColStyle = () => ({
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem',
});
const chartCardStyle = () => ({
    background: '#fff', borderRadius: '12px', border: '1px solid #F3F4F6',
    padding: '1.25rem', boxSizing: 'border-box',
});
const chartTitleStyle = () => ({
    margin: '0 0 1rem 0', fontSize: '13px', fontWeight: 700, color: '#1F2937',
});
const pieRowStyle = () => ({ display: 'flex', alignItems: 'center', gap: '1rem' });
const legendItemStyle = () => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px',
});

function subStyle() {
    return {
        margin: 0,
        fontSize: '13px',
        color: '#6B7280',
    };
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
    return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
    };
}

function changeBadgeStyle() {
    return {
        fontSize: '11px',
        fontWeight: 700,
        color: '#059669',
        background: '#ECFDF5',
        padding: '2px 8px',
        borderRadius: '999px',
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
    return {
        margin: '0 0 1rem 0',
        fontSize: '13px',
        fontWeight: 700,
        color: '#1F2937',
    };
}

function pieRowStyle() {
    return {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
    };
}

function legendItemStyle() {
    return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '6px',
    };
}

function KpiCard({ icon, label, value, change }) {
    return (
        <div style={kpiCardStyle()}>
            <div style={kpiTopRowStyle()}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#1D4ED8' }}>{icon}</span>
                {change && <span style={changeBadgeStyle()}>{change}</span>}
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#111827' }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>{label}</div>
        </div>
    );
}

export default function AdminDashboard() {
    const [activeMenu, setActiveMenu] = useState('overview');

    useEffect(() => {
        requireAuth();
    }, []);

    async function loadAllData() {
        setLoading(true);
        setError(null);
        try {
            const [ovr, roles, cats, postFreq] = await Promise.all([
                fetchOverview(),
                fetchRoleDistribution(),
                fetchIdeasByCategory(),
                fetchPostFrequency(),
            ]);

            setOverview(ovr);

            // Map role-distribution → { name, value, color }
            setRoleDistribution(
                roles.map((r, i) => ({
                    name: r.roleName,
                    value: r.count,
                    color: ROLE_COLORS[i % ROLE_COLORS.length],
                }))
            );

            // Map ideas-by-category → { name, ideas }
            setCategoryData(
                cats.map((c) => ({ name: c.categoryName, ideas: c.count }))
            );

            // Map post-frequency items → { month, posts }
            // API chỉ trả ideasCount (posts), comments giữ mock = 0
            setPostFrequency(
                (postFreq.items ?? []).map((item) => ({
                    month: item.period,
                    posts: item.ideasCount,
                    comments: 0,   // API chưa có comments count — để 0
                }))
            );
        } catch (err) {
            console.error('Analytics load error:', err);
            setError('Không thể tải dữ liệu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AdminShell
            activeMenu={activeMenu}
            onMenuSelect={(itemId) => {
                if (itemId === 'users') { window.location.href = '/admin/accounts'; return true; }
                if (itemId === 'departments') { window.location.href = '/admin/departments'; return true; }
                setActiveMenu(itemId);
                return true;
            }}>

            {/* Shimmer keyframe */}
            <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

            <div style={pageHeaderStyle()}>
                <div>
                    <h1 style={h1Style()}>Analytics Dashboard</h1>
                    <p style={subStyle()}>System overview and real-time activity updates</p>
                </div>
                <button style={exportBtnStyle()} onClick={loadAllData}>
                    {loading ? 'Loading…' : 'Refresh'}
                </button>
            </div>

            {/* Error banner */}
            {error && (
                <div style={{
                    background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px',
                    padding: '0.75rem 1rem', marginBottom: '1rem',
                    fontSize: '13px', color: '#DC2626',
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* ── KPI Cards ── */}
            <div style={kpiGridStyle()}>
                <KpiCard
                    icon="AC" label="Total accounts"
                    value={overview ? overview.totalAccounts.toLocaleString() : (loading ? '…' : '—')}
                    change={overview ? overview.accountsGrowthPercent : null}
                />
                <KpiCard
                    icon="ID" label="Total ideas"
                    value={overview ? overview.totalIdeas.toLocaleString() : (loading ? '…' : '—')}
                    change={overview ? overview.ideasGrowthPercent : null}
                />
                <KpiCard
                    icon="DP" label="Total departments"
                    value={overview ? overview.totalDepartments.toLocaleString() : (loading ? '…' : '—')}
                />
                <KpiCard
                    icon="CT" label="Total categories"
                    value={overview ? overview.totalCategories.toLocaleString() : (loading ? '…' : '—')}
                />
            </div>

            {/* ── Row 1: Role distribution + Ideas by category ── */}
            <div style={twoColStyle()}>
                {/* Donut: Role distribution */}
                <div style={chartCardStyle()}>
                    <h2 style={chartTitleStyle()}>Role distribution</h2>
                    {loading ? <Skeleton height={160} /> : (
                        <div style={pieRowStyle()}>
                            <ResponsiveContainer width="50%" height={160}>
                                <PieChart>
                                    <Pie
                                        data={roleDistribution}
                                        cx="50%" cy="50%"
                                        innerRadius={45} outerRadius={70}
                                        paddingAngle={3} dataKey="value">
                                        {roleDistribution.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => v.toLocaleString()} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ flex: 1 }}>
                                {roleDistribution.map((row) => (
                                    <div key={row.name} style={legendItemStyle()}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                width: '10px', height: '10px', borderRadius: '50%',
                                                background: row.color, flexShrink: 0, display: 'inline-block',
                                            }} />
                                            <span style={{ fontSize: '12px', color: '#4B5563' }}>{row.name}</span>
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>
                                            {row.value.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bar: Ideas by category */}
                <div style={chartCardStyle()}>
                    <h2 style={chartTitleStyle()}>Ideas by category</h2>
                    {loading ? <Skeleton height={160} /> : (
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={categoryData} barSize={20}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Bar dataKey="ideas" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ── Row 2: Post frequency + placeholder ── */}
            <div style={twoColStyle()}>
                {/* Line: Post frequency */}
                <div style={chartCardStyle()}>
                    <h2 style={chartTitleStyle()}>Post frequency</h2>
                    {loading ? <Skeleton height={180} /> : (
                        <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={postFrequency}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Line type="monotone" dataKey="posts" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} name="Posts" />
                                <Line type="monotone" dataKey="comments" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3 }} name="Comments" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Placeholder: Users online (no API yet) */}
                <div style={chartCardStyle()}>
                    <h2 style={chartTitleStyle()}>Users online today</h2>
                    <div style={{
                        height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#9CA3AF', fontSize: '13px', border: '1px dashed #E5E7EB', borderRadius: '8px',
                    }}>
                        No API available yet
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}

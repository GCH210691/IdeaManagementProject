import { useEffect, useState } from 'react';
import {
    PieChart, Pie, Cell,
    LineChart, Line,
    BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import AdminShell from './AdminShell';
import { roleData, postFreq, categoryDist, onlineUsers, requireAuth } from './dashboardData';

function pageHeaderStyle() {
    return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        gap: '1rem',
        flexWrap: 'wrap',
    };
}

function h1Style() {
    return {
        margin: '0 0 0.25rem 0',
        fontSize: '1.5rem',
        fontWeight: 900,
        color: '#111827',
    };
}

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

    return (
        <AdminShell
            activeMenu={activeMenu}
            onMenuSelect={(itemId) => {
                if (itemId === 'users') {
                    window.location.href = '/admin/accounts';
                    return true;
                }

                if (itemId === 'departments') {
                    window.location.href = '/admin/departments';
                    return true;
                }

                setActiveMenu(itemId);
                return true;
            }}>
            <div style={pageHeaderStyle()}>
                <div>
                    <h1 style={h1Style()}>Analytics Dashboard</h1>
                    <p style={subStyle()}>System overview and real-time activity updates</p>
                </div>
                <button style={exportBtnStyle()}>Export report</button>
            </div>

            <div style={kpiGridStyle()}>
                <KpiCard icon="AC" label="Total accounts" value="8,500" change="+3.2%" />
                <KpiCard icon="ID" label="Total ideas" value="1,250" change="+8.1%" />
                <KpiCard icon="ON" label="Online now" value="247" />
                <KpiCard icon="CM" label="Comments today" value="482" change="+12%" />
            </div>

            <div style={twoColStyle()}>
                <div style={chartCardStyle()}>
                    <h2 style={chartTitleStyle()}>Role distribution</h2>
                    <div style={pieRowStyle()}>
                        <ResponsiveContainer width="50%" height={160}>
                            <PieChart>
                                <Pie
                                    data={roleData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={70}
                                    paddingAngle={3}
                                    dataKey="value">
                                    {roleData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => value.toLocaleString()} />
                            </PieChart>
                        </ResponsiveContainer>

                        <div style={{ flex: 1 }}>
                            {roleData.map((row) => (
                                <div key={row.name} style={legendItemStyle()}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: row.color, flexShrink: 0, display: 'inline-block' }} />
                                        <span style={{ fontSize: '12px', color: '#4B5563' }}>{row.name}</span>
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>
                                        {row.value.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={chartCardStyle()}>
                    <h2 style={chartTitleStyle()}>Ideas by category</h2>
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

            <div style={twoColStyle()}>
                <div style={chartCardStyle()}>
                    <h2 style={chartTitleStyle()}>Post and comment frequency</h2>
                    <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={postFreq}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line type="monotone" dataKey="posts" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} name="Posts" />
                            <Line type="monotone" dataKey="comments" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3 }} name="Comments" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div style={chartCardStyle()}>
                    <h2 style={chartTitleStyle()}>Users online today</h2>
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
        </AdminShell>
    );
}
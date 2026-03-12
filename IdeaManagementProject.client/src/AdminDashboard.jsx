import { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getAuthSession, getDisplayName } from './authStorage';
import {
    injectGlobalCSS, IC, AppLayout, IdeaCard, IdeasListSection,
    useToast, ToastContainer, Av, statusTag, roleColor, ROLE_LABEL,
} from './sharedLayout';
import {
    INIT_IDEAS, INIT_CMTS, INIT_CATS, INIT_USERS, DEPTS,
    roleData, postFreq, categoryDist, onlineUsers,
} from './mockData';

/* ── STATS OVERVIEW ── */
function OverviewPage({ ideas }) {
    const tot = ideas.length, app = ideas.filter(i => i.status === 'approved').length,
        pen = ideas.filter(i => i.status === 'pending').length, rej = ideas.filter(i => i.status === 'rejected').length;
    return (
        <div>
            <div className="ph"><div><div className="pt">Tổng quan hệ thống</div><div className="ps">Cập nhật thời gian thực</div></div><button className="btn btn-primary btn-sm"><IC.Dl />Xuất báo cáo</button></div>
            <div className="g4" style={{ marginBottom: 20 }}>
                {[['Tổng tài khoản', '8,500', 'var(--brand)', '#eff6ff', '👥'], ['Tổng ý tưởng', tot, 'var(--teal)', 'var(--teal-l)', '💡'], ['Online hôm nay', '247', 'var(--violet)', 'var(--violet-l)', '🟢'], ['Bình luận hôm nay', '482', 'var(--amber)', 'var(--amber-l)', '💬']].map(([l, v, c, bg, em]) => (
                    <div key={l} className="sc"><div className="sc-icon" style={{ background: bg, color: c }}>{em}</div><div className="sc-val" style={{ color: c }}>{v}</div><div className="sc-lbl">{l}</div></div>
                ))}
            </div>
            <div className="g2" style={{ marginBottom: 18 }}>
                <div className="card">
                    <div className="st"><div className="stb" />&nbsp;Phân bổ Role</div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <ResponsiveContainer width="50%" height={150}>
                            <PieChart><Pie data={roleData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="value">{roleData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip /></PieChart>
                        </ResponsiveContainer>
                        <div style={{ flex: 1 }}>
                            {roleData.map(r => (
                                <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: r.color, display: 'inline-block' }} /><span style={{ fontSize: 12, color: 'var(--ink2)' }}>{r.name}</span></div>
                                    <span style={{ fontSize: 12, fontWeight: 700 }}>{r.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="st"><div className="stb" />&nbsp;Ý tưởng theo danh mục</div>
                    <ResponsiveContainer width="100%" height={150}><BarChart data={categoryDist} barSize={18}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="ideas" fill="#3B82F6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
                </div>
            </div>
            <div className="g2">
                <div className="card">
                    <div className="st"><div className="stb" />&nbsp;Tần suất đăng bài</div>
                    <ResponsiveContainer width="100%" height={160}><LineChart data={postFreq}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} /><Line type="monotone" dataKey="posts" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} name="Bài đăng" /><Line type="monotone" dataKey="comments" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} name="Bình luận" /></LineChart></ResponsiveContainer>
                </div>
                <div className="card">
                    <div className="st"><div className="stb" />&nbsp;Trạng thái ý tưởng</div>
                    {[['Đã duyệt', app, 'var(--teal)'], ['Đang chờ', pen, 'var(--amber)'], ['Bị từ chối', rej, 'var(--rose)']].map(([l, v, c]) => (
                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
                            <div style={{ width: 42, height: 42, borderRadius: '50%', background: c + '22', color: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Lora',serif", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{tot ? Math.round(v / tot * 100) : 0}%</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ fontWeight: 700, fontSize: 13 }}>{l}</span><span style={{ color: 'var(--muted)', fontSize: 12 }}>{v}</span></div>
                                <div className="pb"><div className="pf" style={{ width: tot ? `${Math.round(v / tot * 100)}%` : '0%', background: c }} /></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ── USER MANAGEMENT ── */
function UserMgmtPage({ addToast }) {
    const [users, setUsers] = useState(INIT_USERS);
    const [showAdd, setShowAdd] = useState(false);
    const [nName, setNName] = useState('');
    const [nEmail, setNEmail] = useState('');
    const [nDept, setNDept] = useState('Computer Science');
    const [nRole, setNRole] = useState('STAFF');
    const [search, setSearch] = useState('');
    const ROLES = ['ADMIN', 'QA_MANAGER', 'QA_COORDINATOR', 'STAFF'];
    const list = users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
    const del = id => { setUsers(p => p.filter(u => u.id !== id)); addToast('Đã xoá tài khoản', 'success'); };
    const toggle = id => { setUsers(p => p.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u)); addToast('Đã cập nhật trạng thái', 'success'); };
    const changeRole = (id, r) => { setUsers(p => p.map(u => u.id === id ? { ...u, role: r } : u)); addToast('Đã cập nhật role!', 'success'); };
    return (
        <div>
            <div className="ph">
                <div><div className="pt">Quản lý tài khoản</div><div className="ps">Phân quyền và quản lý người dùng</div></div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><IC.Plus />Thêm tài khoản</button>
            </div>
            {showAdd && (
                <div className="mb" onClick={() => setShowAdd(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="mh"><div className="mt2">Thêm tài khoản mới</div><button className="ibtn" onClick={() => setShowAdd(false)}><IC.X /></button></div>
                        <div className="fg"><label className="fl">Họ và tên</label><input className="fi" value={nName} onChange={e => setNName(e.target.value)} placeholder="Nguyễn Văn A" /></div>
                        <div className="fg"><label className="fl">Email</label><input className="fi" value={nEmail} onChange={e => setNEmail(e.target.value)} placeholder="user@university.edu" /></div>
                        <div className="fg"><label className="fl">Khoa</label><select className="fi" value={nDept} onChange={e => setNDept(e.target.value)}>{DEPTS.map(d => <option key={d}>{d}</option>)}</select></div>
                        <div className="fg"><label className="fl">Role</label><select className="fi" value={nRole} onChange={e => setNRole(e.target.value)}>{ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            <button className="btn btn-primary" disabled={!nName || !nEmail} onClick={() => {
                                const init = nName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                                setUsers(p => [...p, { id: Date.now(), name: nName, email: nEmail, dept: nDept, role: nRole, ideas: 0, av: init, status: 'active' }]);
                                setShowAdd(false); setNName(''); setNEmail(''); addToast('Đã thêm tài khoản!', 'success');
                            }}>Thêm</button>
                            <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Huỷ</button>
                        </div>
                    </div>
                </div>
            )}
            <div style={{ marginBottom: 13 }}>
                <div className="ih-sb2" style={{ maxWidth: 320 }}><IC.Mag /><input placeholder="Tìm kiếm tài khoản..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            </div>
            <div className="tw">
                <table>
                    <thead><tr><th>Tài khoản</th><th>Email</th><th>Khoa</th><th>Role</th><th>Ý tưởng</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                    <tbody>
                        {list.map(u => (
                            <tr key={u.id}>
                                <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Av initials={u.av} size="sm" /><span style={{ fontWeight: 700 }}>{u.name}</span></div></td>
                                <td style={{ fontSize: 12.5, color: 'var(--muted)' }}>{u.email}</td>
                                <td style={{ fontSize: 12.5 }}>{u.dept}</td>
                                <td><select className="fi" style={{ padding: '4px 8px', width: 'auto', fontSize: 12, fontWeight: 700 }} value={u.role} onChange={e => changeRole(u.id, e.target.value)}>{['ADMIN', 'QA_MANAGER', 'QA_COORDINATOR', 'STAFF'].map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></td>
                                <td>{u.ideas}</td>
                                <td><span className={`tag tag-${u.status === 'active' ? 'teal' : 'rose'}`} style={{ cursor: 'pointer' }} onClick={() => toggle(u.id)}>{u.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}</span></td>
                                <td><div style={{ display: 'flex', gap: 5 }}><button className="btn btn-xs btn-outline" onClick={() => addToast('Xem hồ sơ', 'info')}>Xem</button><button className="btn btn-xs btn-danger" onClick={() => del(u.id)}>Xoá</button></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ── CATEGORY MANAGEMENT ── */
function CatManagePage({ addToast }) {
    const [cats, setCats] = useState(INIT_CATS);
    const [showAdd, setShowAdd] = useState(false);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [editId, setEditId] = useState(null);
    const [editName, setEditName] = useState('');
    const del = id => {
        const c = cats.find(x => x.id === id);
        if (c.count > 0) { addToast('Không thể xoá: danh mục đang có ý tưởng!', 'error'); return; }
        setCats(p => p.filter(x => x.id !== id)); addToast('Đã xoá danh mục', 'success');
    };
    return (
        <div>
            <div className="ph">
                <div><div className="pt">Danh mục</div><div className="ps">Quản lý danh mục ý tưởng</div></div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><IC.Plus />Thêm danh mục</button>
            </div>
            {showAdd && (
                <div className="mb" onClick={() => setShowAdd(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="mh"><div className="mt2">Thêm danh mục</div><button className="ibtn" onClick={() => setShowAdd(false)}><IC.X /></button></div>
                        <div className="fg"><label className="fl">Tên danh mục</label><input className="fi" placeholder="VD: Innovation" value={name} onChange={e => setName(e.target.value)} /></div>
                        <div className="fg"><label className="fl">Mô tả</label><textarea className="fi" placeholder="Mô tả danh mục..." value={desc} onChange={e => setDesc(e.target.value)} style={{ minHeight: 80 }} /></div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-primary" disabled={!name} onClick={() => { setCats(p => [...p, { id: Date.now(), name, desc, count: 0, active: true }]); setName(''); setDesc(''); setShowAdd(false); addToast('Đã thêm danh mục!', 'success'); }}><IC.Plus />Thêm</button>
                            <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Huỷ</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="tw">
                <table>
                    <thead><tr><th>STT</th><th>Tên danh mục</th><th>Mô tả</th><th>Ý tưởng</th><th>Thao tác</th></tr></thead>
                    <tbody>
                        {cats.map((c, i) => (
                            <tr key={c.id}>
                                <td style={{ color: 'var(--muted)', fontWeight: 600 }}>{i + 1}</td>
                                <td>{editId === c.id ? <input className="fi" value={editName} onChange={e => setEditName(e.target.value)} style={{ padding: '5px 9px', width: 'auto' }} /> : <strong style={{ fontSize: 13.5 }}>{c.name}</strong>}</td>
                                <td style={{ color: 'var(--muted)', maxWidth: 240, fontSize: 12.5 }}>{c.desc}</td>
                                <td><span className={`tag ${c.count > 0 ? 'tag-blue' : 'tag-gray'}`}>{c.count}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 5 }}>
                                        {editId === c.id ? (
                                            <><button className="btn btn-sm btn-teal" onClick={() => { setCats(p => p.map(x => x.id === c.id ? { ...x, name: editName } : x)); setEditId(null); addToast('Đã cập nhật!', 'success'); }}><IC.Ok /></button><button className="btn btn-sm btn-outline" onClick={() => setEditId(null)}><IC.X /></button></>
                                        ) : (
                                            <><button className="btn btn-sm btn-outline" onClick={() => { setEditId(c.id); setEditName(c.name); }}><IC.Edit />Sửa</button><button className="btn btn-sm btn-danger" onClick={() => del(c.id)}><IC.Trash />Xoá</button></>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ── STATISTICS ── */
function StatsPage({ ideas }) {
    const tot = ideas.length, app = ideas.filter(i => i.status === 'approved').length,
        pen = ideas.filter(i => i.status === 'pending').length, rej = ideas.filter(i => i.status === 'rejected').length;
    const anonI = ideas.filter(i => i.anon).length, anonC = INIT_CMTS.filter(c => c.anon).length;
    const catSt = INIT_CATS.map(c => ({ name: c.name, n: ideas.filter(i => i.cat === c.name).length })).sort((a, b) => b.n - a.n);
    return (
        <div>
            <div className="ph"><div><div className="pt">Thống kê & Báo cáo</div><div className="ps">Dữ liệu phân tích nền tảng</div></div></div>
            <div className="g4" style={{ marginBottom: 18 }}>
                {[['Tổng ý tưởng', tot, 'var(--brand)', '💡'], ['Đã duyệt', app, 'var(--teal)', '✅'], ['Đang chờ', pen, 'var(--amber)', '⏳'], ['Bị từ chối', rej, 'var(--rose)', '❌']].map(([l, v, c, em]) => (
                    <div key={l} className="sc"><div className="sc-icon" style={{ background: c + '18' }}>{em}</div><div className="sc-val" style={{ color: c }}>{v}</div><div className="sc-lbl">{l}</div></div>
                ))}
            </div>
            <div className="g2" style={{ marginBottom: 16 }}>
                <div className="card">
                    <div className="st"><div className="stb" />&nbsp;Ý tưởng theo danh mục</div>
                    {catSt.map(s => (
                        <div key={s.name} style={{ marginBottom: 11 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ fontSize: 12.5, fontWeight: 600 }}>{s.name}</span><span style={{ fontSize: 12, color: 'var(--muted)' }}>{s.n}</span></div>
                            <div className="pb"><div className="pf" style={{ width: `${tot ? Math.round(s.n / tot * 100) : 0}%`, background: 'var(--brand)' }} /></div>
                        </div>
                    ))}
                </div>
                <div className="card">
                    <div className="st"><div className="stb" />&nbsp;Dữ liệu ẩn danh</div>
                    <div style={{ display: 'flex', gap: 11, marginBottom: 18 }}>
                        {[['Ý tưởng ẩn danh', anonI, 'var(--violet)'], ['Bình luận ẩn danh', anonC, 'var(--rose)']].map(([l, v, c]) => (
                            <div key={l} style={{ flex: 1, textAlign: 'center', padding: '14px', background: 'var(--bg)', borderRadius: 9 }}>
                                <div style={{ fontFamily: "'Lora',serif", fontSize: 24, fontWeight: 700, color: c }}>{v}</div>
                                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{l}</div>
                            </div>
                        ))}
                    </div>
                    <div className="st" style={{ marginTop: 4 }}><div className="stb" />&nbsp;Tương tác</div>
                    {[['Tổng lượt xem', ideas.reduce((s, i) => s + i.views, 0), 'var(--brand)'], ['Tổng lượt thích', ideas.reduce((s, i) => s + i.up, 0), 'var(--teal)'], ['Tổng bình luận', INIT_CMTS.length, 'var(--violet)']].map(([l, v, c]) => (
                        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{l}</span>
                            <span style={{ fontFamily: "'Lora',serif", fontSize: 18, fontWeight: 700, color: c }}>{v}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ── ANON REPORTS ── */
function AnonPage({ ideas }) {
    const aI = ideas.filter(i => i.anon), aC = INIT_CMTS.filter(c => c.anon);
    return (
        <div>
            <div className="ph"><div><div className="pt">Báo cáo ẩn danh</div><div className="ps">Ý tưởng và bình luận ẩn danh</div></div></div>
            <div className="g2" style={{ marginBottom: 18 }}>
                <div className="sc"><div className="sc-val" style={{ color: 'var(--violet)', fontSize: 22 }}>{aI.length}</div><div className="sc-lbl">Ý tưởng ẩn danh</div></div>
                <div className="sc"><div className="sc-val" style={{ color: 'var(--rose)', fontSize: 22 }}>{aC.length}</div><div className="sc-lbl">Bình luận ẩn danh</div></div>
            </div>
            <div className="st"><div className="stb" />&nbsp;Ý tưởng ẩn danh</div>
            <div className="tw" style={{ marginBottom: 20 }}>
                <table>
                    <thead><tr><th>Tiêu đề</th><th>Danh mục</th><th>Trạng thái</th><th>Lượt xem</th><th>👍</th><th>Ngày</th></tr></thead>
                    <tbody>{aI.map(i => (<tr key={i.id}><td style={{ fontWeight: 600 }}>{i.title}</td><td><span className="tag tag-blue">{i.cat}</span></td><td><span className={`tag tag-${statusTag(i.status)}`}>{i.status}</span></td><td>{i.views}</td><td>{i.up}</td><td style={{ color: 'var(--muted)', fontSize: 12 }}>{i.date}</td></tr>))}</tbody>
                </table>
            </div>
            <div className="st"><div className="stb" />&nbsp;Bình luận ẩn danh</div>
            <div className="tw">
                <table>
                    <thead><tr><th>Nội dung</th><th>Ý tưởng #</th><th>Thời gian</th><th>👍</th></tr></thead>
                    <tbody>{aC.map(c => (<tr key={c.id}><td style={{ maxWidth: 380, fontSize: 13 }}>{c.text}</td><td><span className="tag tag-blue">#{c.ideaId}</span></td><td style={{ color: 'var(--muted)', fontSize: 12 }}>{c.time}</td><td>{c.up}</td></tr>))}</tbody>
                </table>
            </div>
        </div>
    );
}

/* ── EXPORT ── */
function ExportPage({ ideas, addToast }) {
    return (
        <div>
            <div className="ph"><div><div className="pt">Xuất dữ liệu</div><div className="ps">Tải xuống ý tưởng và tài liệu đính kèm</div></div></div>
            <div className="g2">
                <div className="card">
                    <div style={{ fontFamily: "'Lora',serif", fontWeight: 700, fontSize: 16, marginBottom: 7 }}>Xuất ý tưởng (CSV)</div>
                    <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>Tải toàn bộ ý tưởng kèm metadata (tiêu đề, mô tả, tác giả, danh mục, trạng thái, lượt vote, ngày gửi) dạng CSV.</p>
                    <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '11px 13px', marginBottom: 14, overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: 11.5 }}>
                            <thead><tr>{['ID', 'Tiêu đề', 'Danh mục', 'Trạng thái', 'Views', '👍'].map(h => <th key={h} style={{ textAlign: 'left', padding: '3px 7px', background: 'none', fontSize: 10.5, color: 'var(--muted)' }}>{h}</th>)}</tr></thead>
                            <tbody>{ideas.slice(0, 3).map(i => <tr key={i.id}>{[i.id, i.title.slice(0, 18) + '...', i.cat, i.status, i.views, i.up].map((v, j) => <td key={j} style={{ padding: '3px 7px', borderBottom: 'none', fontSize: 11.5 }}>{v}</td>)}</tr>)}</tbody>
                        </table>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>...và {ideas.length - 3} dòng nữa</div>
                    </div>
                    <button className="btn btn-primary" onClick={() => addToast('Đang tải CSV...', 'success')}><IC.Dl />Tải tất cả ý tưởng (CSV)</button>
                </div>
                <div className="card">
                    <div style={{ fontFamily: "'Lora',serif", fontWeight: 700, fontSize: 16, marginBottom: 7 }}>Xuất tài liệu (ZIP)</div>
                    <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>Tải toàn bộ tài liệu đính kèm của các ý tưởng dạng file ZIP.</p>
                    <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '11px 13px', marginBottom: 14 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 7 }}>File có sẵn:</div>
                        {ideas.filter(i => i.docs.length > 0).flatMap(idea => idea.docs.map(d => (
                            <div key={`${idea.id}-${d}`} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                                <IC.File /><span style={{ fontSize: 12, fontWeight: 500 }}>{d}</span><span style={{ fontSize: 11, color: 'var(--muted)' }}>({idea.title.slice(0, 16)}...)</span>
                            </div>
                        )))}
                    </div>
                    <button className="btn btn-primary" onClick={() => addToast('Đang tải ZIP...', 'success')}><IC.Dl />Tải tất cả file (ZIP)</button>
                </div>
            </div>
        </div>
    );
}

/* ── ROLES ── */
function RolesPage() {
    const perms = {
        ADMIN: ['Quản lý tài khoản & phân quyền', 'Tạo/xoá tài khoản', 'Xem toàn bộ dữ liệu', 'Truy cập tất cả bảng điều khiển'],
        QA_MANAGER: ['Xem tất cả ý tưởng & phân tích', 'Kiểm tra báo cáo ẩn danh', 'Xuất dữ liệu CSV/ZIP', 'Xoá danh mục chưa dùng'],
        QA_COORDINATOR: ['Duyệt hoặc từ chối ý tưởng', 'Nhận email khi có ý tưởng mới', 'Mở/đóng cửa sổ gửi bài', 'Quản lý danh mục'],
        STAFF: ['Gửi ý tưởng cải tiến', 'Tải tài liệu đính kèm', 'Gửi ẩn danh', 'Bình luận, vote thumbs up/down'],
    };
    const roleEmojis = { ADMIN: '🛡️', QA_MANAGER: '📊', QA_COORDINATOR: '🎯', STAFF: '👤' };
    const clrs = { ADMIN: 'rose', QA_MANAGER: 'violet', QA_COORDINATOR: 'blue', STAFF: 'teal' };
    return (
        <div>
            <div className="ph"><div><div className="pt">Phân quyền hệ thống</div><div className="ps">Định nghĩa các role và quyền truy cập</div></div></div>
            <div className="g2">
                {Object.entries(perms).map(([r, ps]) => (
                    <div key={r} className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 9, background: `var(--${clrs[r]}-l)`, color: `var(--${clrs[r]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{roleEmojis[r]}</div>
                            <div><div style={{ fontFamily: "'Lora',serif", fontWeight: 700, fontSize: 14.5 }}>{ROLE_LABEL[r]}</div><span className={`tag tag-${clrs[r]}`}>{r}</span></div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {ps.map(p => (<div key={p} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}><span style={{ color: 'var(--teal)', flexShrink: 0 }}><IC.Ok /></span>{p}</div>))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORT (Admin — cũng dùng cho QA Manager & Coordinator)
═══════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
    useEffect(() => { injectGlobalCSS(); }, []);
    const session = getAuthSession();
    const user = session?.user || {};
    const role = user.role || 'ADMIN';
    const isAdmin = role === 'ADMIN';
    const isManager = role === 'QA_MANAGER' || isAdmin;
    const isCoord = role === 'QA_COORDINATOR' || isManager;

    const [page, setPage] = useState('overview');
    const [detail, setDetail] = useState(null);
    const [ideas, setIdeas] = useState(INIT_IDEAS);
    const [allCmts, setAllCmts] = useState(INIT_CMTS);
    const [closure, setClosure] = useState({ active: true, date: '2025-06-30' });
    const [toasts, toast] = useToast();

    const go = p => { setPage(p); setDetail(null); };
    const viewIdea = idea => { setDetail(idea); setPage('detail'); };

    /* ── IDEA MANAGEMENT (Coordinator) ── */
    function IdeaMgmtPage() {
        const [filter, setFilter] = useState('all');
        const [search, setSearch] = useState('');
        const list = ideas.filter(i => filter === 'all' || i.status === filter).filter(i => !search || i.title.toLowerCase().includes(search.toLowerCase()));
        const change = (id, s) => { setIdeas(p => p.map(i => i.id === id ? { ...i, status: s } : i)); toast(`Ý tưởng đã được ${s}!`, s === 'approved' ? 'success' : 'error'); };
        return (
            <div>
                <div className="ph">
                    <div><div className="pt">Quản lý ý tưởng</div><div className="ps">Xét duyệt và quản lý ý tưởng đã gửi</div></div>
                    <button className={`btn btn-sm ${closure.active ? 'btn-danger' : 'btn-teal'}`} onClick={() => { setClosure(p => ({ ...p, active: !p.active })); toast(closure.active ? 'Đã mở lại gửi bài!' : 'Đã đóng gửi bài!', closure.active ? 'success' : 'error'); }}>
                        {closure.active ? '🔓 Mở gửi bài' : '🔒 Đóng gửi bài'}
                    </button>
                </div>
                {closure.active && <div style={{ background: 'var(--amber-l)', border: '1px solid #fcd34d', borderRadius: 9, padding: '9px 13px', marginBottom: 15, fontSize: 13, color: 'var(--amber)', fontWeight: 600 }}>⏰ Gửi bài đã đóng — hạn: {closure.date}</div>}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="ih-sb2"><IC.Mag /><input placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    {['all', 'approved', 'pending', 'rejected'].map(f => <button key={f} className={`fc ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{f === 'all' ? 'Tất cả' : f === 'approved' ? 'Đã duyệt' : f === 'pending' ? 'Chờ duyệt' : 'Từ chối'}</button>)}
                </div>
                <div className="tw">
                    <table>
                        <thead><tr><th>Tiêu đề</th><th>Tác giả</th><th>Danh mục</th><th>Trạng thái</th><th>Views</th><th>Ngày</th><th>Thao tác</th></tr></thead>
                        <tbody>
                            {list.map(idea => (
                                <tr key={idea.id}>
                                    <td style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--brand)' }} onClick={() => viewIdea(idea)}>{idea.title}</td>
                                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Av initials={idea.av} size="sm" /><span>{idea.anon ? 'Ẩn danh' : idea.author}</span></div></td>
                                    <td><span className="tag tag-blue">{idea.cat}</span></td>
                                    <td><span className={`tag tag-${statusTag(idea.status)}`}>{idea.status}</span></td>
                                    <td>{idea.views}</td>
                                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{idea.date}</td>
                                    <td><div style={{ display: 'flex', gap: 4 }}>{idea.status !== 'approved' && <button className="btn btn-xs btn-teal" onClick={() => change(idea.id, 'approved')}><IC.Ok />Duyệt</button>}{idea.status !== 'rejected' && <button className="btn btn-xs btn-danger" onClick={() => change(idea.id, 'rejected')}><IC.X />Từ chối</button>}</div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    /* ── DETAIL with coordinator actions ── */
    function DetailPage({ idea }) {
        const [cmt, setCmt] = useState('');
        const [anonCmt, setAnonCmt] = useState(false);
        const [voted, setVoted] = useState(null);
        const displayName = getDisplayName(user);
        const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        const cmts = allCmts.filter(c => c.ideaId === idea.id);
        const vote = t => { if (voted === t) { setVoted(null); return; } setVoted(t); toast(t === 'up' ? '👍 Đã thích!' : '👎 Không thích!', 'success'); };
        const postCmt = () => {
            if (!cmt.trim()) return;
            setAllCmts(p => [...p, { id: Date.now(), ideaId: idea.id, user: anonCmt ? 'Ẩn danh' : displayName, av: anonCmt ? '?' : initials, text: cmt, time: 'Vừa xong', up: 0, anon: anonCmt }]);
            setIdeas(p => p.map(i => i.id === idea.id ? { ...i, comments: i.comments + 1 } : i));
            setCmt(''); toast('Đã đăng bình luận!', 'success');
        };
        const changeStatus = s => { setIdeas(p => p.map(i => i.id === idea.id ? { ...i, status: s } : i)); toast(`Ý tưởng đã được ${s}!`, s === 'approved' ? 'success' : 'error'); };
        return (
            <div>
                <button className="back-btn" onClick={() => { setDetail(null); setPage('ideasAll'); }}><IC.Back />Quay lại</button>
                <div className="detail-grid">
                    <div>
                        <div className="card" style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                <span className={`tag tag-${statusTag(idea.status)}`}>{idea.status}</span>
                                {idea.docs.length > 0 && <div style={{ display: 'flex', gap: 5 }}>{idea.docs.map(d => <button key={d} className="btn btn-outline btn-xs" onClick={() => toast(`Tải ${d}...`, 'info')}><IC.Dl />{d}</button>)}</div>}
                            </div>
                            <h1 style={{ fontSize: 19, marginBottom: 11, lineHeight: 1.35 }}>{idea.title}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 13, flexWrap: 'wrap' }}>
                                <Av initials={idea.av} size="md" />
                                <div><div style={{ fontWeight: 700, fontSize: 13 }}>{idea.anon ? 'Ẩn danh' : idea.author}</div>{!idea.anon && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{idea.dept}</div>}</div>
                                <span className="tag tag-blue">{idea.cat}</span>
                            </div>
                            <p className="idea-body">{idea.desc}</p>
                            <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 13 }}>
                                <button className={`btn btn-sm ${voted === 'up' ? 'btn-teal' : 'btn-outline'}`} onClick={() => vote('up')}><IC.TUp />{voted === 'up' ? idea.up + 1 : idea.up}</button>
                                <button className={`btn btn-sm ${voted === 'dn' ? 'btn-rose' : 'btn-outline'}`} onClick={() => vote('dn')}><IC.TDn />{voted === 'dn' ? idea.down + 1 : idea.down}</button>
                            </div>
                        </div>
                        <div className="card">
                            <div className="st"><div className="stb" />&nbsp;Bình luận ({cmts.length})</div>
                            <textarea className="fi" placeholder="Chia sẻ suy nghĩ..." value={cmt} onChange={e => setCmt(e.target.value)} style={{ minHeight: 70, marginBottom: 7 }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 13 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}><input type="checkbox" checked={anonCmt} onChange={e => setAnonCmt(e.target.checked)} />Ẩn danh</label>
                                <button className="btn btn-primary btn-sm" onClick={postCmt} disabled={!cmt.trim()}><IC.Send />Đăng</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {cmts.map(c => (<div key={c.id} style={{ display: 'flex', gap: 8 }}><Av initials={c.av} size="sm" /><div style={{ flex: 1 }}><div style={{ display: 'flex', gap: 6, marginBottom: 2 }}><span style={{ fontWeight: 700, fontSize: 12.5 }}>{c.user}</span><span style={{ fontSize: 11, color: 'var(--muted)' }}>{c.time}</span></div><p style={{ fontSize: 13, lineHeight: 1.5 }}>{c.text}</p></div></div>))}
                                {cmts.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: 14 }}>Chưa có bình luận.</p>}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {isCoord && (
                            <div className="card card-sm">
                                <div style={{ fontWeight: 700, marginBottom: 9, fontSize: 13 }}>Quản lý ý tưởng</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <button className="btn btn-sm btn-teal" style={{ justifyContent: 'center' }} onClick={() => changeStatus('approved')}><IC.Ok />Duyệt</button>
                                    <button className="btn btn-sm btn-amber" style={{ justifyContent: 'center' }} onClick={() => changeStatus('pending')}>Chờ duyệt</button>
                                    <button className="btn btn-sm btn-danger" style={{ justifyContent: 'center' }} onClick={() => changeStatus('rejected')}><IC.X />Từ chối</button>
                                </div>
                            </div>
                        )}
                        <div className="card card-sm">
                            <div style={{ fontWeight: 700, marginBottom: 9, fontSize: 13 }}>Thống kê</div>
                            {[['Lượt xem', idea.views, 'var(--brand)'], ['Thích', idea.up, 'var(--teal)'], ['Không thích', idea.down, 'var(--rose)']].map(([l, v, c]) => (
                                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                                    <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{l}</span>
                                    <span style={{ fontWeight: 800, color: c, fontFamily: "'Lora',serif" }}>{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ── DEPT IDEAS ── */
    function DeptIdeasPage() {
        const [sel, setSel] = useState(null);
        const colors = ['var(--brand)', 'var(--rose)', 'var(--teal)', 'var(--violet)', 'var(--amber)', '#0891b2', '#be185d'];
        if (sel) {
            const list = ideas.filter(i => i.dept === sel);
            return (<div><button className="back-btn" onClick={() => setSel(null)}><IC.Back />Tất cả khoa</button><div className="ph"><div><div className="pt">{sel}</div><div className="ps">{list.length} ý tưởng</div></div></div><div className="g2">{list.map(i => <IdeaCard key={i.id} idea={i} onClick={viewIdea} />)}</div></div>);
        }
        return (
            <div>
                <div className="ph"><div><div className="pt">Ý tưởng theo khoa</div></div></div>
                <div className="g3">
                    {DEPTS.map((d, i) => {
                        const n = ideas.filter(x => x.dept === d).length;
                        return (<div key={d} className="card" style={{ cursor: 'pointer', borderLeft: `3px solid ${colors[i % colors.length]}` }} onClick={() => setSel(d)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}><div style={{ width: 32, height: 32, borderRadius: 8, background: colors[i % colors.length] + '18', color: colors[i % colors.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IC.Bldg /></div><div style={{ fontFamily: "'Lora',serif", fontWeight: 700, fontSize: 13.5 }}>{d}</div></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 12, color: 'var(--muted)' }}>Tổng ý tưởng</span><span style={{ fontFamily: "'Lora',serif", fontSize: 20, fontWeight: 700, color: colors[i % colors.length] }}>{n}</span></div>
                        </div>);
                    })}
                </div>
            </div>
        );
    }

    /* ── MENU ── */
    const menuItems = [
        { id: 'overview',  label: 'Tổng quan',        ic: <IC.Home /> },
        { id: 'ideasAll',  label: 'Tất cả ý tưởng',  ic: <IC.Bulb /> },
        ...(isCoord ? [
            { type: 'sep', key: 's1' },
            { type: 'label', key: 'l1', label: 'QA Coordinator' },
            { id: 'ideaMgmt', label: 'Quản lý ý tưởng', ic: <IC.Grid /> },
            { id: 'deptIdeas', label: 'Ý tưởng theo khoa', ic: <IC.Bldg /> },
        ] : []),
        ...(isManager ? [
            { type: 'sep', key: 's2' },
            { type: 'label', key: 'l2', label: 'QA Manager' },
            { id: 'catMgmt',  label: 'Danh mục',        ic: <IC.Grid /> },
            { id: 'stats',    label: 'Thống kê',         ic: <IC.Bar /> },
            { id: 'anon',     label: 'Báo cáo ẩn danh', ic: <IC.Mask /> },
            { id: 'export',   label: 'Xuất dữ liệu',    ic: <IC.Dl /> },
        ] : []),
        ...(isAdmin ? [
            { type: 'sep', key: 's3' },
            { type: 'label', key: 'l3', label: 'Administrator' },
            { id: 'userMgmt', label: 'Tài khoản',        ic: <IC.Users /> },
            { id: 'roles',    label: 'Phân quyền',       ic: <IC.Shield /> },
        ] : []),
    ];

    const titles = {
        overview: 'Tổng quan', ideasAll: 'Tất cả ý tưởng', ideaMgmt: 'Quản lý ý tưởng', deptIdeas: 'Ý tưởng theo khoa',
        catMgmt: 'Danh mục', stats: 'Thống kê', anon: 'Báo cáo ẩn danh', export: 'Xuất dữ liệu',
        userMgmt: 'Tài khoản', roles: 'Phân quyền', detail: detail?.title || 'Chi tiết',
    };

    function renderPage() {
        if (detail && page === 'detail') return <DetailPage idea={detail} />;
        switch (page) {
            case 'overview':  return <OverviewPage ideas={ideas} />;
            case 'ideasAll':  return <IdeasListSection title="Tất cả ý tưởng" ideas={ideas} onView={viewIdea} cats={INIT_CATS} />;
            case 'ideaMgmt':  return <IdeaMgmtPage />;
            case 'deptIdeas': return <DeptIdeasPage />;
            case 'catMgmt':   return <CatManagePage addToast={toast} />;
            case 'stats':     return <StatsPage ideas={ideas} />;
            case 'anon':      return <AnonPage ideas={ideas} />;
            case 'export':    return <ExportPage ideas={ideas} addToast={toast} />;
            case 'userMgmt':  return <UserMgmtPage addToast={toast} />;
            case 'roles':     return <RolesPage />;
            default:          return <OverviewPage ideas={ideas} />;
        }
    }

    const roleLabel = ROLE_LABEL[role] || 'Admin';

    return (
        <>
            <AppLayout menuItems={menuItems} activeMenu={page} setActiveMenu={go} roleLabel={roleLabel} topbarTitle={titles[page] || 'IdeaHub'}>
                {renderPage()}
            </AppLayout>
            <ToastContainer toasts={toasts} />
        </>
    );
}

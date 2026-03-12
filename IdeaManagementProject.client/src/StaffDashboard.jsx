import { useState, useEffect } from 'react';
import { getAuthSession, getDisplayName } from './authStorage';
import {
    injectGlobalCSS, IC, AppLayout, IdeaCard, IdeasListSection,
    useToast, ToastContainer, Av, statusTag,
} from './sharedLayout';
import { INIT_IDEAS, INIT_CMTS, INIT_NOTIFS, INIT_CATS, DEPTS } from './mockData';

/* ── HOME ── */
function HomePage({ ideas, onView, displayName }) {
    const pop = ideas.filter(i => i.status === 'approved').sort((a, b) => b.up - a.up).slice(0, 3);
    const viewed = [...ideas].sort((a, b) => b.views - a.views).slice(0, 3);
    return (
        <div>
            <div className="ph"><div><div className="pt">Chào mừng, {displayName.split(' ')[0]} 👋</div><div className="ps">Khám phá và chia sẻ ý tưởng cải tiến</div></div></div>
            <div className="g4" style={{ marginBottom: 20 }}>
                {[['Tổng ý tưởng', ideas.length, 'var(--brand)', '#eff6ff', '💡'],
                  ['Đã duyệt', ideas.filter(i => i.status === 'approved').length, 'var(--teal)', 'var(--teal-l)', '✅'],
                  ['Đang chờ', ideas.filter(i => i.status === 'pending').length, 'var(--amber)', 'var(--amber-l)', '⏳'],
                  ['Tuần này', '+12', 'var(--rose)', 'var(--rose-l)', '🔥'],
                ].map(([l, v, c, bg, em]) => (
                    <div key={l} className="sc">
                        <div className="sc-icon" style={{ background: bg, color: c }}>{em}</div>
                        <div className="sc-val" style={{ color: c }}>{v}</div>
                        <div className="sc-lbl">{l}</div>
                    </div>
                ))}
            </div>
            <div className="g2">
                <div>
                    <div className="st"><div className="stb" />&nbsp;Phổ biến nhất</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{pop.map(i => <IdeaCard key={i.id} idea={i} onClick={onView} />)}</div>
                </div>
                <div>
                    <div className="st"><div className="stb" />&nbsp;Xem nhiều nhất</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{viewed.map(i => <IdeaCard key={i.id} idea={i} onClick={onView} />)}</div>
                </div>
            </div>
        </div>
    );
}

/* ── SUBMIT ── */
function SubmitPage({ addToast, closure }) {
    const [step, setStep] = useState('terms');
    const [title, setTitle] = useState('');
    const [cat, setCat] = useState('');
    const [desc, setDesc] = useState('');
    const [anon, setAnon] = useState(false);
    const [done, setDone] = useState(false);
    if (done) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center' }}>
            <div style={{ maxWidth: 360 }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
                <h2 style={{ marginBottom: 8 }}>Đã gửi ý tưởng!</h2>
                <p style={{ color: 'var(--muted)', lineHeight: 1.6, fontSize: 13.5 }}>Ý tưởng đang chờ xét duyệt. Bạn sẽ nhận email thông báo khi có kết quả.</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { setDone(false); setStep('terms'); setTitle(''); setCat(''); setDesc(''); setAnon(false); }}>Gửi ý tưởng khác</button>
            </div>
        </div>
    );
    if (step === 'terms') return (
        <div>
            <div className="ph"><div><div className="pt">Điều khoản & Điều kiện</div><div className="ps">Đọc và đồng ý trước khi gửi</div></div></div>
            <div style={{ maxWidth: 620 }} className="card">
                <div style={{ background: 'linear-gradient(135deg,#eff6ff,#fdf2f8)', border: '1px solid #bfdbfe', borderRadius: 9, padding: '13px 16px', marginBottom: 18, display: 'flex', gap: 11 }}>
                    <IC.Shield /><p style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.65, margin: 0 }}>Nội dung phải gốc, mang tính xây dựng. Bạn có thể gửi ẩn danh. Ý tưởng được nhà trường xem xét. QA Coordinator có thể liên hệ bạn để làm rõ.</p>
                </div>
                {closure?.active && <div style={{ background: 'var(--amber-l)', border: '1px solid #fcd34d', borderRadius: 9, padding: '9px 13px', marginBottom: 16, fontSize: 13, color: 'var(--amber)', fontWeight: 600 }}>⏰ Hạn gửi: {closure.date}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" onClick={() => setStep('form')}><IC.Ok />Tôi đồng ý & Tiếp tục</button>
                    <button className="btn btn-outline">Từ chối</button>
                </div>
            </div>
        </div>
    );
    return (
        <div>
            <div className="ph"><div><div className="pt">Gửi Ý Tưởng</div></div></div>
            <div style={{ maxWidth: 620 }} className="card">
                <div className="fg"><label className="fl">Tiêu đề *</label><input className="fi" placeholder="Tiêu đề rõ ràng, dễ hiểu" value={title} onChange={e => setTitle(e.target.value)} /></div>
                <div className="fg"><label className="fl">Danh mục *</label><select className="fi" value={cat} onChange={e => setCat(e.target.value)}><option value="">Chọn danh mục</option>{INIT_CATS.map(c => <option key={c.id}>{c.name}</option>)}</select></div>
                <div className="fg"><label className="fl">Mô tả *</label><textarea className="fi" placeholder="Mô tả chi tiết: vấn đề, cách thực hiện, tác động..." value={desc} onChange={e => setDesc(e.target.value)} style={{ minHeight: 130 }} /></div>
                <div className="fg"><label className="fl">Tài liệu đính kèm (tuỳ chọn)</label><div style={{ border: '2px dashed var(--border)', borderRadius: 9, padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}>📎 Nhấn hoặc kéo thả file</div></div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
                    <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} />Gửi ẩn danh
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" disabled={!title || !cat || !desc} onClick={() => { setDone(true); addToast('Ý tưởng đã được gửi!', 'success'); }}><IC.Send />Gửi ý tưởng</button>
                    <button className="btn btn-outline" onClick={() => { setTitle(''); setCat(''); setDesc(''); }}>Xoá</button>
                </div>
            </div>
        </div>
    );
}

/* ── IDEA DETAIL ── */
function IdeaDetailPage({ idea, onBack, addToast, allCmts, setAllCmts, setIdeas }) {
    const [cmt, setCmt] = useState('');
    const [anonCmt, setAnonCmt] = useState(false);
    const [voted, setVoted] = useState(null);
    const session = getAuthSession();
    const displayName = getDisplayName(session?.user);
    const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const cmts = allCmts.filter(c => c.ideaId === idea.id);
    const vote = t => { if (voted === t) { setVoted(null); return; } setVoted(t); addToast(t === 'up' ? '👍 Đã thích!' : '👎 Không thích!', 'success'); };
    const postCmt = () => {
        if (!cmt.trim()) return;
        setAllCmts(p => [...p, { id: Date.now(), ideaId: idea.id, user: anonCmt ? 'Ẩn danh' : displayName, av: anonCmt ? '?' : initials, text: cmt, time: 'Vừa xong', up: 0, anon: anonCmt }]);
        setIdeas(p => p.map(i => i.id === idea.id ? { ...i, comments: i.comments + 1 } : i));
        setCmt(''); addToast('Đã đăng bình luận!', 'success');
    };
    return (
        <div>
            <button className="back-btn" onClick={onBack}><IC.Back />Quay lại</button>
            <div className="detail-grid">
                <div>
                    <div className="card" style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span className={`tag tag-${statusTag(idea.status)}`}>{idea.status}</span>
                            {idea.docs.length > 0 && <div style={{ display: 'flex', gap: 5 }}>{idea.docs.map(d => <button key={d} className="btn btn-outline btn-xs" onClick={() => addToast(`Tải ${d}...`, 'info')}><IC.Dl />{d}</button>)}</div>}
                        </div>
                        <h1 style={{ fontSize: 19, marginBottom: 12, lineHeight: 1.35 }}>{idea.title}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14, flexWrap: 'wrap' }}>
                            <Av initials={idea.av} size="md" />
                            <div><div style={{ fontWeight: 700, fontSize: 13 }}>{idea.anon ? 'Ẩn danh' : idea.author}</div>{!idea.anon && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{idea.dept}</div>}</div>
                            <span className="tag tag-blue">{idea.cat}</span>
                        </div>
                        <p className="idea-body">{idea.desc}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 14 }}>
                            <button className={`btn btn-sm ${voted === 'up' ? 'btn-teal' : 'btn-outline'}`} onClick={() => vote('up')}><IC.TUp />{voted === 'up' ? idea.up + 1 : idea.up}</button>
                            <button className={`btn btn-sm ${voted === 'dn' ? 'btn-rose' : 'btn-outline'}`} onClick={() => vote('dn')}><IC.TDn />{voted === 'dn' ? idea.down + 1 : idea.down}</button>
                            <span style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3 }}><IC.Eye />{idea.views}</span>
                        </div>
                    </div>
                    <div className="card">
                        <div className="st"><div className="stb" />&nbsp;Bình luận ({cmts.length})</div>
                        <textarea className="fi" placeholder="Chia sẻ suy nghĩ..." value={cmt} onChange={e => setCmt(e.target.value)} style={{ minHeight: 74, marginBottom: 7 }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}><input type="checkbox" checked={anonCmt} onChange={e => setAnonCmt(e.target.checked)} />Đăng ẩn danh</label>
                            <button className="btn btn-primary btn-sm" onClick={postCmt} disabled={!cmt.trim()}><IC.Send />Đăng</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                            {cmts.map(c => (
                                <div key={c.id} style={{ display: 'flex', gap: 8 }}>
                                    <Av initials={c.av} size="sm" />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', gap: 6, marginBottom: 3, alignItems: 'center' }}>
                                            <span style={{ fontWeight: 700, fontSize: 12.5 }}>{c.user}</span>
                                            {c.anon && <span className="tag tag-gray" style={{ fontSize: 10 }}>Ẩn danh</span>}
                                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{c.time}</span>
                                        </div>
                                        <p style={{ fontSize: 13, lineHeight: 1.55 }}>{c.text}</p>
                                    </div>
                                </div>
                            ))}
                            {cmts.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: 16 }}>Chưa có bình luận. Hãy là người đầu tiên!</p>}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                    <div className="card card-sm">
                        <div style={{ fontWeight: 700, marginBottom: 9, fontSize: 13 }}>Thống kê</div>
                        {[['Lượt xem', idea.views, 'var(--brand)'], ['Thích', idea.up, 'var(--teal)'], ['Không thích', idea.down, 'var(--rose)'], ['Bình luận', cmts.length, 'var(--violet)']].map(([l, v, c]) => (
                            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{l}</span>
                                <span style={{ fontWeight: 800, color: c, fontFamily: "'Lora',serif" }}>{v}</span>
                            </div>
                        ))}
                    </div>
                    <div className="card card-sm">
                        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Chi tiết</div>
                        <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div><span style={{ color: 'var(--muted)' }}>Danh mục: </span><span className="tag tag-blue">{idea.cat}</span></div>
                            {!idea.anon && <div><span style={{ color: 'var(--muted)' }}>Khoa: </span><strong>{idea.dept}</strong></div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── SEARCH ── */
function SearchPage({ ideas, onView }) {
    const [q, setQ] = useState('');
    const [res, setRes] = useState([]);
    const [done, setDone] = useState(false);
    const doSearch = query => {
        const term = query || q; if (!term.trim()) return;
        setRes(ideas.filter(i => [i.title, i.desc, i.cat].join(' ').toLowerCase().includes(term.toLowerCase())));
        setDone(true);
    };
    return (
        <div>
            <div className="ph"><div><div className="pt">Tìm kiếm</div></div></div>
            <div style={{ maxWidth: 500, marginBottom: 22, display: 'flex', gap: 8 }}>
                <input className="fi" placeholder="Nhập từ khoá..." value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} style={{ flex: 1 }} />
                <button className="btn btn-primary" onClick={() => doSearch()}><IC.Mag />Tìm</button>
            </div>
            {!done && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{INIT_CATS.map(c => <button key={c.id} className="fc" onClick={() => { setQ(c.name); doSearch(c.name); }}>{c.name}</button>)}</div>}
            {done && (
                <div>
                    <div style={{ marginBottom: 11, fontSize: 13, color: 'var(--muted)' }}>
                        <strong>{res.length}</strong> kết quả cho "<strong>{q}</strong>"
                        <button className="btn btn-ghost btn-xs" style={{ marginLeft: 8 }} onClick={() => { setDone(false); setQ(''); }}>Xoá</button>
                    </div>
                    {res.length > 0 ? <div className="g2">{res.map(i => <IdeaCard key={i.id} idea={i} onClick={onView} />)}</div> : <div className="empty"><p>Không tìm thấy kết quả.</p></div>}
                </div>
            )}
        </div>
    );
}

/* ── CATS ── */
function CatsPage({ ideas, onView }) {
    const [sel, setSel] = useState(null);
    const colors = ['var(--brand)', 'var(--rose)', 'var(--teal)', 'var(--violet)', 'var(--amber)', '#0891b2', '#be185d'];
    if (sel) {
        const list = ideas.filter(i => i.cat === sel.name);
        return (<div><button className="back-btn" onClick={() => setSel(null)}><IC.Back />Tất cả danh mục</button><div className="ph"><div><div className="pt">{sel.name}</div><div className="ps">{list.length} ý tưởng</div></div></div><div className="g2">{list.map(i => <IdeaCard key={i.id} idea={i} onClick={onView} />)}</div></div>);
    }
    return (
        <div>
            <div className="ph"><div><div className="pt">Danh mục</div></div></div>
            <div className="g3">
                {INIT_CATS.map((c, i) => (
                    <div key={c.id} className="card" style={{ cursor: 'pointer', borderTop: `3px solid ${colors[i % colors.length]}` }} onClick={() => setSel(c)}>
                        <div style={{ fontFamily: "'Lora',serif", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{c.name}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.5 }}>{c.desc}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontFamily: "'Lora',serif", fontSize: 22, fontWeight: 700, color: colors[i % colors.length] }}>{c.count}</span>
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>ý tưởng</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── NOTIFS ── */
function NotifsPage({ addToast }) {
    const [notifs, setNotifs] = useState(INIT_NOTIFS);
    const colMap = { like: 'var(--rose)', comment: 'var(--brand)', approved: 'var(--teal)', email: 'var(--violet)' };
    const iconMap = { like: '❤️', comment: '💬', approved: '✅', email: '📧' };
    return (
        <div>
            <div className="ph">
                <div><div className="pt">Thông báo</div><div className="ps">{notifs.filter(n => !n.read).length} chưa đọc</div></div>
                <button className="btn btn-outline btn-sm" onClick={() => { setNotifs(p => p.map(n => ({ ...n, read: true }))); addToast('Đã đọc tất cả', 'success'); }}>Đánh dấu đã đọc</button>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {notifs.map((n, i) => (
                    <div key={n.id} style={{ padding: '12px 16px', display: 'flex', gap: 10, borderBottom: i < notifs.length - 1 ? '1px solid var(--border)' : 'none', background: !n.read ? '#f8faff' : '#fff', cursor: 'pointer' }} onClick={() => setNotifs(p => p.map(x => x.id === n.id ? { ...x, read: true } : x))}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: colMap[n.type] + '18', color: colMap[n.type], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15 }}>{iconMap[n.type]}</div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: !n.read ? 700 : 500 }}>{n.msg}</div><div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{n.time}</div></div>
                        {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brand)', marginTop: 5, flexShrink: 0 }} />}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── ACCOUNT ── */
function AccountPage({ addToast }) {
    const session = getAuthSession();
    const user = session?.user || {};
    const displayName = getDisplayName(user);
    const [name, setName] = useState(displayName);
    const [email, setEmail] = useState(user.email || `${displayName.toLowerCase().replace(/\s+/g, '.')}@university.edu`);
    const [dept, setDept] = useState('Computer Science');
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    return (
        <div>
            <div className="ph"><div><div className="pt">Tài khoản</div></div></div>
            <div className="g2">
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
                        <Av initials={initials} size="lg" />
                        <div><div style={{ fontWeight: 800, fontSize: 14.5, fontFamily: "'Lora',serif" }}>{name}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>{email}</div></div>
                    </div>
                    <div className="fg"><label className="fl">Họ và tên</label><input className="fi" value={name} onChange={e => setName(e.target.value)} /></div>
                    <div className="fg"><label className="fl">Email</label><input className="fi" value={email} onChange={e => setEmail(e.target.value)} /></div>
                    <div className="fg"><label className="fl">Khoa</label><select className="fi" value={dept} onChange={e => setDept(e.target.value)}>{DEPTS.map(d => <option key={d}>{d}</option>)}</select></div>
                    <button className="btn btn-primary btn-sm" onClick={() => addToast('Đã lưu!', 'success')}><IC.Ok />Lưu</button>
                </div>
                <div className="card">
                    <div style={{ fontWeight: 700, marginBottom: 12 }}><IC.Key /> Đổi mật khẩu</div>
                    <div className="fg"><label className="fl">Mật khẩu hiện tại</label><input className="fi" type="password" placeholder="••••••••" /></div>
                    <div className="fg"><label className="fl">Mật khẩu mới</label><input className="fi" type="password" placeholder="••••••••" /></div>
                    <div className="fg"><label className="fl">Xác nhận</label><input className="fi" type="password" placeholder="••••••••" /></div>
                    <button className="btn btn-outline btn-sm" onClick={() => addToast('Đã cập nhật mật khẩu!', 'success')}>Cập nhật</button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════ */
export default function StaffDashboard() {
    useEffect(() => { injectGlobalCSS(); }, []);
    const session = getAuthSession();
    const user = session?.user || {};
    const displayName = getDisplayName(user);

    const [page, setPage] = useState('home');
    const [detail, setDetail] = useState(null);
    const [ideas, setIdeas] = useState(INIT_IDEAS);
    const [allCmts, setAllCmts] = useState(INIT_CMTS);
    const [closure] = useState({ active: true, date: '2025-06-30' });
    const [toasts, toast] = useToast();
    const unread = INIT_NOTIFS.filter(n => !n.read).length;

    const go = p => { setPage(p); setDetail(null); };
    const viewIdea = idea => { setDetail(idea); setPage('detail'); };

    const menuItems = [
        { id: 'home',    label: 'Trang chủ',       ic: <IC.Home /> },
        { id: 'latest',  label: 'Ý tưởng mới',     ic: <IC.Bulb /> },
        { id: 'popular', label: 'Phổ biến',         ic: <IC.Fire /> },
        { id: 'viewed',  label: 'Xem nhiều',        ic: <IC.Eye /> },
        { id: 'cats',    label: 'Danh mục',         ic: <IC.Grid /> },
        { id: 'submit',  label: 'Gửi ý tưởng',     ic: <IC.Send /> },
        { id: 'search',  label: 'Tìm kiếm',         ic: <IC.Mag /> },
        { type: 'sep', key: 's1' },
        { id: 'myideas', label: 'Ý tưởng của tôi', ic: <IC.Bulb /> },
        { id: 'notifs',  label: 'Thông báo',        ic: <IC.Bell /> },
        { id: 'account', label: 'Tài khoản',        ic: <IC.User /> },
    ];

    const titles = { home: 'Trang chủ', latest: 'Ý tưởng mới', popular: 'Phổ biến nhất', viewed: 'Xem nhiều nhất', cats: 'Danh mục', submit: 'Gửi ý tưởng', search: 'Tìm kiếm', myideas: 'Ý tưởng của tôi', notifs: 'Thông báo', account: 'Tài khoản', detail: detail?.title || 'Chi tiết' };

    function renderPage() {
        if (detail && page === 'detail') return <IdeaDetailPage idea={detail} onBack={() => { setDetail(null); setPage('latest'); }} addToast={toast} allCmts={allCmts} setAllCmts={setAllCmts} setIdeas={setIdeas} />;
        switch (page) {
            case 'home':    return <HomePage ideas={ideas} onView={viewIdea} displayName={displayName} />;
            case 'latest':  return <IdeasListSection title="Ý tưởng mới nhất" subtitle="Được gửi gần đây" ideas={[...ideas].sort((a, b) => a.id - b.id)} onView={viewIdea} cats={INIT_CATS} />;
            case 'popular': return <IdeasListSection title="Phổ biến nhất" ideas={ideas} onView={viewIdea} sortFn={(a, b) => b.up - a.up} showRank cats={INIT_CATS} />;
            case 'viewed':  return <IdeasListSection title="Xem nhiều nhất" ideas={ideas} onView={viewIdea} sortFn={(a, b) => b.views - a.views} showRank cats={INIT_CATS} />;
            case 'cats':    return <CatsPage ideas={ideas} onView={viewIdea} />;
            case 'submit':  return <SubmitPage addToast={toast} closure={closure} />;
            case 'search':  return <SearchPage ideas={ideas} onView={viewIdea} />;
            case 'myideas': return <IdeasListSection title="Ý tưởng của tôi" ideas={ideas.slice(0, 4)} onView={viewIdea} cats={INIT_CATS} />;
            case 'notifs':  return <NotifsPage addToast={toast} />;
            case 'account': return <AccountPage addToast={toast} />;
            default:        return <HomePage ideas={ideas} onView={viewIdea} displayName={displayName} />;
        }
    }

    return (
        <>
            <AppLayout menuItems={menuItems} activeMenu={page} setActiveMenu={go} roleLabel="Staff" topbarTitle={titles[page] || 'IdeaHub'}
                topbarRight={<button className="ibtn" onClick={() => go('notifs')} style={{ position: 'relative' }}><IC.Bell />{unread > 0 && <div className="i-badge">{unread}</div>}</button>}
            >
                {renderPage()}
            </AppLayout>
            <ToastContainer toasts={toasts} />
        </>
    );
}

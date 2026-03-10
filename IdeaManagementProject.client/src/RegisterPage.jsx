import { useState } from 'react';

const ROLES = ['User', 'Staff', 'QA', 'Admin'];

/* ─── Styles (inline, matching project convention) ─── */
function appStyle() {
    return {
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#060E1E',
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        padding: '2rem',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
    };
}

function bgOrbStyle(top, left, size, color) {
    return {
        position: 'absolute',
        top, left,
        width: size, height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        pointerEvents: 'none',
    };
}

function gridOverlayStyle() {
    return {
        position: 'absolute',
        inset: 0,
        backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        pointerEvents: 'none',
    };
}

function cardStyle() {
    return {
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '2.5rem',
        boxSizing: 'border-box',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)',
    };
}

function logoRowStyle() {
    return {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '2rem',
    };
}

function logoBadgeStyle() {
    return {
        width: '38px', height: '38px',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, #2563EB, #60A5FA)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff',
        fontWeight: 900,
        fontSize: '13px',
        flexShrink: 0,
    };
}

function headingStyle() {
    return {
        margin: '0 0 0.3rem 0',
        color: '#fff',
        fontSize: '1.4rem',
        fontWeight: 900,
        letterSpacing: '-0.02em',
    };
}

function subTextStyle() {
    return {
        margin: '0 0 1.8rem 0',
        color: 'rgba(255,255,255,0.38)',
        fontSize: '13px',
    };
}

function labelStyle() {
    return {
        display: 'block',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        marginBottom: '0.4rem',
    };
}

function inputStyle(focus, hasError) {
    return {
        width: '100%',
        boxSizing: 'border-box',
        padding: '0.75rem 0.9rem',
        background: focus ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.06)',
        border: `1.5px solid ${hasError ? '#EF4444' : focus ? '#3B82F6' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '10px',
        color: '#fff',
        fontSize: '14px',
        outline: 'none',
        fontFamily: 'inherit',
        boxShadow: focus ? `0 0 0 3px ${hasError ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)'}` : 'none',
    };
}

function selectStyle(focus) {
    return {
        ...inputStyle(focus, false),
        appearance: 'none',
        WebkitAppearance: 'none',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.4)' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 14px center',
        backgroundSize: '12px',
        paddingRight: '2.2rem',
        cursor: 'pointer',
    };
}

function twoColStyle() {
    return {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.85rem',
    };
}

function fieldStyle() {
    return { marginBottom: '1rem' };
}

function errorTextStyle() {
    return {
        color: '#FCA5A5',
        fontSize: '12px',
        marginTop: '0.3rem',
    };
}

function strengthBarTrackStyle() {
    return {
        height: '4px',
        borderRadius: '4px',
        background: 'rgba(255,255,255,0.08)',
        marginTop: '0.5rem',
    };
}

function strengthBarFillStyle(score) {
    const colors = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'];
    const widths = ['0%', '25%', '50%', '75%', '100%'];
    return {
        height: '4px',
        borderRadius: '4px',
        width: widths[score] || '0%',
        background: colors[score] || 'transparent',
        transition: 'width 0.4s ease, background 0.4s ease',
    };
}

function btnPrimaryStyle(disabled) {
    return {
        width: '100%',
        padding: '0.8rem',
        borderRadius: '10px',
        border: 'none',
        background: disabled
            ? 'rgba(59,130,246,0.4)'
            : 'linear-gradient(135deg, #2563EB 0%, #3B82F6 60%, #60A5FA 100%)',
        color: '#fff',
        fontWeight: 700,
        fontSize: '14px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : '0 4px 20px rgba(59,130,246,0.4)',
        fontFamily: 'inherit',
        letterSpacing: '0.02em',
    };
}

function linkBtnStyle() {
    return {
        background: 'none',
        border: 'none',
        color: '#60A5FA',
        fontWeight: 700,
        fontSize: '13px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        padding: 0,
    };
}

function msgStyle(isError) {
    return {
        marginTop: '1rem',
        padding: '0.7rem 1rem',
        borderRadius: '8px',
        fontSize: '13px',
        background: isError ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
        border: `1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
        color: isError ? '#FCA5A5' : '#6EE7B7',
    };
}

/* ─── Password Strength ─── */
function PasswordStrength({ password }) {
    if (!password) return null;
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ];
    const score = checks.filter(Boolean).length;
    const labels = ['8+ ký tự', 'Hoa', 'Số', 'Đặc biệt'];
    const levelNames = ['', 'Yếu', 'Trung bình', 'Tốt', 'Mạnh'];
    const levelColors = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'];

    return (
        <div>
            <div style={strengthBarTrackStyle()}>
                <div style={strengthBarFillStyle(score)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {labels.map((lbl, i) => (
                        <span key={i} style={{
                            fontSize: '11px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: checks[i] ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                            color: checks[i] ? '#10B981' : 'rgba(255,255,255,0.3)',
                        }}>
                            {checks[i] ? '✓' : '·'} {lbl}
                        </span>
                    ))}
                </div>
                {score > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: levelColors[score] }}>
                        {levelNames[score]}
                    </span>
                )}
            </div>
        </div>
    );
}

/* ─── Component ─── */
function App() {
    const [form, setForm] = useState({
        name: '', email: '', department: '', role: 'User', password: '', confirm: ''
    });
    const [focused, setFocused] = useState({});
    const [showPw, setShowPw] = useState(false);
    const [agree, setAgree] = useState(false);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
    const onFocus = (key) => () => setFocused(f => ({ ...f, [key]: true }));
    const onBlur = (key) => () => setFocused(f => ({ ...f, [key]: false }));

    function validate() {
        const e = {};
        if (!form.name.trim()) e.name = 'Họ tên không được để trống.';
        if (!form.email.includes('@')) e.email = 'Email không hợp lệ.';
        if (form.password.length < 8) e.password = 'Mật khẩu tối thiểu 8 ký tự.';
        if (form.password !== form.confirm) e.confirm = 'Mật khẩu không khớp.';
        if (!agree) e.agree = 'Bạn cần đồng ý điều khoản.';
        return e;
    }

    async function submit(e) {
        e.preventDefault();

        const v = validate();
        setErrors(v);
        if (Object.keys(v).length) return;

        setLoading(true);
        setMessage('Đang tạo tài khoản...');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    fullName: form.name.trim(),
                    email: form.email.trim(),
                    department: form.department.trim(),
                    role: form.role,
                    password: form.password,
                }),
            });

            if (response.status === 409) { setMessage('Email này đã được đăng ký.'); return; }
            if (response.status === 400) { setMessage('Thông tin không hợp lệ.'); return; }
            if (!response.ok) { setMessage(`Đăng ký thất bại: ${response.status}`); return; }

            setMessage('Tài khoản đã được tạo! Vui lòng chờ Admin phê duyệt.');
            setTimeout(() => { window.location.href = '/'; }, 2500);
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage('Register error: ' + details);
        } finally {
            setLoading(false);
        }
    }

    const isSuccess = message.includes('Tài khoản đã được tạo');
    const isError = !isSuccess && (
        message.toLowerCase().includes('error') ||
        message.toLowerCase().includes('thất bại') ||
        message.toLowerCase().includes('không hợp lệ') ||
        message.toLowerCase().includes('đã được đăng ký')
    );

    return (
        <div style={appStyle()}>
            {/* Background */}
            <div style={bgOrbStyle('-100px', '-60px', '440px', 'rgba(59,130,246,0.18)')} />
            <div style={bgOrbStyle('auto', 'auto', '320px', 'rgba(99,102,241,0.13)')} />
            <div style={gridOverlayStyle()} />

            {/* Card */}
            <div style={cardStyle()}>

                {/* Logo */}
                <div style={logoRowStyle()}>
                    <div style={logoBadgeStyle()}>SS</div>
                    <div>
                        <div style={{ color: '#fff', fontWeight: 900, fontSize: '1rem', lineHeight: 1.2 }}>IdeaHub</div>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>Enterprise Idea Management</div>
                    </div>
                </div>

                <h1 style={headingStyle()}>Tạo tài khoản mới</h1>
                <p style={subTextStyle()}>Điền thông tin để tham gia IdeaHub.</p>

                <form onSubmit={submit}>

                    {/* Name + Department */}
                    <div style={{ ...twoColStyle(), marginBottom: '1rem' }}>
                        <div>
                            <label style={labelStyle()}>Họ và tên</label>
                            <input
                                style={inputStyle(focused.name, !!errors.name)}
                                value={form.name}
                                onChange={set('name')}
                                onFocus={onFocus('name')}
                                onBlur={onBlur('name')}
                                placeholder="Nguyễn Văn A"
                                autoComplete="name"
                            />
                            {errors.name && <p style={errorTextStyle()}>{errors.name}</p>}
                        </div>
                        <div>
                            <label style={labelStyle()}>Phòng ban</label>
                            <input
                                style={inputStyle(focused.department, false)}
                                value={form.department}
                                onChange={set('department')}
                                onFocus={onFocus('department')}
                                onBlur={onBlur('department')}
                                placeholder="Marketing..."
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div style={fieldStyle()}>
                        <label style={labelStyle()}>Email công ty</label>
                        <input
                            style={inputStyle(focused.email, !!errors.email)}
                            value={form.email}
                            onChange={set('email')}
                            onFocus={onFocus('email')}
                            onBlur={onBlur('email')}
                            placeholder="email@company.com"
                            autoComplete="email"
                        />
                        {errors.email && <p style={errorTextStyle()}>{errors.email}</p>}
                    </div>

                    {/* Role */}
                    <div style={fieldStyle()}>
                        <label style={labelStyle()}>Vai trò</label>
                        <select
                            style={selectStyle(focused.role)}
                            value={form.role}
                            onChange={set('role')}
                            onFocus={onFocus('role')}
                            onBlur={onBlur('role')}
                        >
                            {ROLES.map(r => (
                                <option key={r} value={r} style={{ background: '#0F1C33', color: '#fff' }}>{r}</option>
                            ))}
                        </select>
                    </div>

                    {/* Password */}
                    <div style={fieldStyle()}>
                        <label style={labelStyle()}>Mật khẩu</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                style={{ ...inputStyle(focused.password, !!errors.password), paddingRight: '2.8rem' }}
                                type={showPw ? 'text' : 'password'}
                                value={form.password}
                                onChange={set('password')}
                                onFocus={onFocus('password')}
                                onBlur={onBlur('password')}
                                placeholder="Tối thiểu 8 ký tự"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(!showPw)}
                                style={{
                                    position: 'absolute', right: '0.75rem', top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontSize: '14px', color: 'rgba(255,255,255,0.4)',
                                }}
                            >
                                {showPw ? '🙈' : '👁'}
                            </button>
                        </div>
                        <PasswordStrength password={form.password} />
                        {errors.password && <p style={errorTextStyle()}>{errors.password}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div style={fieldStyle()}>
                        <label style={labelStyle()}>Xác nhận mật khẩu</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                style={{
                                    ...inputStyle(focused.confirm, !!errors.confirm),
                                    paddingRight: '2.8rem',
                                    borderColor: form.confirm && form.confirm === form.password
                                        ? '#10B981'
                                        : errors.confirm ? '#EF4444' : focused.confirm ? '#3B82F6' : 'rgba(255,255,255,0.1)',
                                }}
                                type="password"
                                value={form.confirm}
                                onChange={set('confirm')}
                                onFocus={onFocus('confirm')}
                                onBlur={onBlur('confirm')}
                                placeholder="Nhập lại mật khẩu"
                                autoComplete="new-password"
                            />
                            {form.confirm && form.confirm === form.password && (
                                <span style={{
                                    position: 'absolute', right: '0.75rem', top: '50%',
                                    transform: 'translateY(-50%)', color: '#10B981', fontSize: '14px',
                                }}>✓</span>
                            )}
                        </div>
                        {errors.confirm && <p style={errorTextStyle()}>{errors.confirm}</p>}
                    </div>

                    {/* Terms */}
                    <div style={{ marginBottom: '1.4rem' }}>
                        <div
                            style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer' }}
                            onClick={() => setAgree(!agree)}
                        >
                            <div style={{
                                width: '16px', height: '16px', marginTop: '1px',
                                border: `1.5px solid ${agree ? '#3B82F6' : errors.agree ? '#EF4444' : 'rgba(255,255,255,0.25)'}`,
                                borderRadius: '4px',
                                background: agree ? '#3B82F6' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, transition: 'all 0.2s',
                            }}>
                                {agree && <span style={{ color: '#fff', fontSize: '11px', lineHeight: 1 }}>✓</span>}
                            </div>
                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                                Tôi đồng ý với{' '}
                                <span style={{ color: '#60A5FA' }}>Điều khoản sử dụng</span>
                                {' '}và{' '}
                                <span style={{ color: '#60A5FA' }}>Chính sách bảo mật</span>
                                {' '}của IdeaHub.
                            </p>
                        </div>
                        {errors.agree && <p style={errorTextStyle()}>{errors.agree}</p>}
                    </div>

                    {/* Submit */}
                    <button type="submit" style={btnPrimaryStyle(loading)} disabled={loading}>
                        {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản →'}
                    </button>
                </form>

                {/* Login link */}
                <p style={{ textAlign: 'center', marginTop: '1.2rem', marginBottom: 0 }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>Đã có tài khoản? </span>
                    <button style={linkBtnStyle()} onClick={() => { window.location.href = '/'; }}>
                        Đăng nhập
                    </button>
                </p>

                {/* Message */}
                {message && message !== 'Đang tạo tài khoản...' && (
                    <p style={msgStyle(isError)}>{isSuccess ? '✓ ' : isError ? '⚠ ' : ''}{message}</p>
                )}
            </div>
        </div>
    );
}

export default App;
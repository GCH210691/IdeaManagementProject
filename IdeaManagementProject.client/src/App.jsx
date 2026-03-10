import { useState } from 'react';
import { roleToPath, setAuthSession, BASE_URL } from './authStorage';

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
        maxWidth: '440px',
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

function inputStyle(focus) {
    return {
        width: '100%',
        boxSizing: 'border-box',
        padding: '0.75rem 0.9rem',
        background: focus ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.06)',
        border: `1.5px solid ${focus ? '#3B82F6' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '10px',
        color: '#fff',
        fontSize: '14px',
        outline: 'none',
        fontFamily: 'inherit',
        transition: 'border-color 0.2s, background 0.2s',
        boxShadow: focus ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
    };
}

function rowStyle() {
    return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '0.9rem 0 1.4rem',
    };
}

function checkboxRowStyle() {
    return {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        cursor: 'pointer',
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
        transition: 'box-shadow 0.15s, transform 0.15s',
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

/* ─── Component ─── */
function App() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [remember, setRemember] = useState(false);
    const [focusUser, setFocusUser] = useState(false);
    const [focusPw, setFocusPw] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const isError = message.toLowerCase().includes('error')
        || message.toLowerCase().includes('invalid')
        || message.toLowerCase().includes('failed')
        || message.toLowerCase().includes('required');

    async function submit(e) {
        e.preventDefault();

        if (!username.trim() || !password) {
            setMessage('Username and password are required.');
            return;
        }

        setLoading(true);
        setMessage('Logging in...');

        try {
            const response = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    email: username.trim(),
                    password,
                }),
            });

            if (response.status === 401) { setMessage('Invalid credentials.'); return; }
            if (response.status === 400) { setMessage('Please provide both username and password.'); return; }
            if (!response.ok) { setMessage(`Login failed: ${response.status}`); return; }

            const data = await response.json();            
            setAuthSession(data.token, data.user);

            const destination = roleToPath(data.user?.role);
            console.log('des =>', destination);
            //return;

            window.location.href = destination;
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage('Login error: ' + details);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={appStyle()}>
            {/* Background */}
            <div style={bgOrbStyle('-120px', '-80px', '480px', 'rgba(59,130,246,0.18)')} />
            <div style={bgOrbStyle('auto', 'auto', '360px', 'rgba(99,102,241,0.15)')} />
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

                <h1 style={headingStyle()}>Chào mừng trở lại 👋</h1>
                <p style={subTextStyle()}>Đăng nhập để chia sẻ và khám phá ý tưởng.</p>

                <form onSubmit={submit}>
                    {/* Username */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle()}>Email / Tên đăng nhập</label>
                        <input
                            style={inputStyle(focusUser)}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="email@company.com"
                            onFocus={() => setFocusUser(true)}
                            onBlur={() => setFocusUser(false)}
                            autoComplete="username"
                        />
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: 0, position: 'relative' }}>
                        <label style={labelStyle()}>Mật khẩu</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                style={{ ...inputStyle(focusPw), paddingRight: '2.8rem' }}
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                onFocus={() => setFocusPw(true)}
                                onBlur={() => setFocusPw(false)}
                                autoComplete="current-password"
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
                    </div>

                    {/* Remember + Forgot */}
                    <div style={rowStyle()}>
                        <div style={checkboxRowStyle()} onClick={() => setRemember(!remember)}>
                            <div style={{
                                width: '16px', height: '16px',
                                border: `1.5px solid ${remember ? '#3B82F6' : 'rgba(255,255,255,0.25)'}`,
                                borderRadius: '4px',
                                background: remember ? '#3B82F6' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                            }}>
                                {remember && <span style={{ color: '#fff', fontSize: '11px', lineHeight: 1 }}>✓</span>}
                            </div>
                            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>Ghi nhớ đăng nhập</span>
                        </div>
                        <button type="button" style={linkBtnStyle()}>Quên mật khẩu?</button>
                    </div>

                    {/* Submit */}
                    <button type="submit" style={btnPrimaryStyle(loading)} disabled={loading}>
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập →'}
                    </button>
                </form>

                {/* Register link */}
                <p style={{ textAlign: 'center', marginTop: '1.2rem', marginBottom: 0 }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>Chưa có tài khoản? </span>
                    <button style={linkBtnStyle()} onClick={() => { window.location.href = '/register'; }}>
                        Đăng ký ngay
                    </button>
                </p>

                {/* Admin note */}
                <div style={{
                    marginTop: '1.5rem',
                    padding: '0.8rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.4)',
                }}>
                    <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Admin demo:</strong>{' '}
                    admin@university.com / Admin@123
                </div>

                {/* Message */}
                {message && message !== 'Logging in...' && (
                    <p style={msgStyle(isError)}>{isError ? '⚠ ' : '✓ '}{message}</p>
                )}
            </div>
        </div>
    );
}

export default App;

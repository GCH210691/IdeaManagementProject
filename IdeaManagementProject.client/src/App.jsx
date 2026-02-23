import { useState } from 'react';
import { roleToPath, setAuthSession } from './authStorage';

function appStyle() {
    return {
        minHeight: '100vh',
        padding: '2rem',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        boxSizing: 'border-box'
    };
}

function layoutStyle() {
    return {
        width: '100%',
        maxWidth: '920px',
        display: 'flex',
        gap: '1.75rem',
        flexWrap: 'wrap'
    };
}

function panelStyle() {
    return {
        border: '1px solid #d5d5d5',
        borderRadius: '8px',
        padding: '1.2rem',
        boxSizing: 'border-box',
        flex: '1 1 420px',
        minWidth: '280px'
    };
}

function App() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    async function submit(e) {
        e.preventDefault();

        if (!username.trim() || !password) {
            setMessage('Username and password are required.');
            return;
        }

        setLoading(true);
        setMessage('Logging in...');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: username.trim(),
                    password
                })
            });

            if (response.status === 401) {
                setMessage('Invalid credentials.');
                return;
            }

            if (response.status === 400) {
                setMessage('Please provide both username and password.');
                return;
            }

            if (!response.ok) {
                setMessage(`Login failed: ${response.status}`);
                return;
            }

            const data = await response.json();
            setAuthSession(data.token, data.user);

            const destination = roleToPath(data.user?.role);
            window.location.href = destination;
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage('Login error: ' + details);
        } finally {
            setLoading(false);
        }
    }

    function goToRegister() {
        window.location.href = '/register';
    }

    return (
        <div style={appStyle()}>
            <div style={layoutStyle()}>
                <section style={panelStyle()}>
                    <h1 style={{ marginTop: 0 }}>Login</h1>
                    <form onSubmit={submit}>
                        <p>
                            <label>
                                Username (email)
                                <br />
                                <input
                                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem' }}
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="admin@university.com"
                                />
                            </label>
                        </p>

                        <p>
                            <label>
                                Password
                                <br />
                                <input
                                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem' }}
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                />
                            </label>
                        </p>

                        <p style={{ marginBottom: 0 }}>
                            <button type="submit" disabled={loading}>
                                {loading ? 'Signing in...' : 'Login'}
                            </button>
                            <button type="button" style={{ marginLeft: '0.75rem' }} onClick={goToRegister}>
                                Register
                            </button>
                        </p>
                    </form>

                    {message && (
                        <p style={{ color: message.toLowerCase().includes('error') || message.toLowerCase().includes('invalid') || message.toLowerCase().includes('failed') ? '#b00020' : '#222' }}>
                            {message}
                        </p>
                    )}
                </section>

                <aside style={panelStyle()}>
                    <h2 style={{ marginTop: 0, fontSize: '1.2rem' }}>Admin Login Note</h2>
                    <p style={{ marginBottom: '0.4rem' }}><strong>Username:</strong> admin@university.com</p>
                    <p style={{ marginTop: 0 }}><strong>Password:</strong> Admin@123</p>
                    <p style={{ color: '#555' }}>Use this account to access the Admin role page.</p>
                </aside>
            </div>
        </div>
    );
}

export default App;

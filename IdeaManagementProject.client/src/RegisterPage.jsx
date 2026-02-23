import { useEffect, useMemo, useState } from 'react';
import { roleToPath, setAuthSession } from './authStorage';

function pageStyle() {
    return {
        minHeight: '100vh',
        padding: '2rem',
        boxSizing: 'border-box',
        fontFamily: 'Arial, sans-serif'
    };
}

function cardStyle() {
    return {
        maxWidth: '560px',
        margin: '0 auto',
        border: '1px solid #d5d5d5',
        borderRadius: '8px',
        padding: '1.2rem'
    };
}

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        let active = true;

        async function loadOptions() {
            setOptionsLoading(true);
            setMessage('Loading registration options...');

            try {
                const response = await fetch('/api/auth/register-options', {
                    headers: { 'Accept': 'application/json' }
                });

                if (!response.ok) {
                    setMessage(`Unable to load options: ${response.status}`);
                    return;
                }

                const data = await response.json();
                if (!active) {
                    return;
                }

                const roleItems = Array.isArray(data.roles) ? data.roles : [];
                const departmentItems = Array.isArray(data.departments) ? data.departments : [];

                setRoles(roleItems);
                setDepartments(departmentItems);

                if (roleItems.length > 0) {
                    setRole(roleItems[0].roleName);
                }

                if (departmentItems.length > 0) {
                    setDepartmentId(String(departmentItems[0].departmentId));
                }

                setMessage('');
            } catch (error) {
                const details = error instanceof Error ? error.message : String(error);
                setMessage('Load error: ' + details);
            } finally {
                if (active) {
                    setOptionsLoading(false);
                }
            }
        }

        loadOptions();

        return () => {
            active = false;
        };
    }, []);

    const canSubmit = useMemo(() => {
        return !optionsLoading && !loading && roles.length > 0 && departments.length > 0;
    }, [optionsLoading, loading, roles.length, departments.length]);

    async function submit(e) {
        e.preventDefault();

        if (!name.trim() || !email.trim() || !password || !role || !departmentId) {
            setMessage('Please fill in all required fields.');
            return;
        }

        setLoading(true);
        setMessage('Creating account...');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    password,
                    role,
                    departmentId: Number(departmentId),
                    acceptedTerms
                })
            });

            if (response.status === 409) {
                setMessage('Email is already registered.');
                return;
            }

            if (response.status === 400) {
                const payload = await response.json().catch(() => null);
                setMessage(payload?.message || 'Invalid registration data.');
                return;
            }

            if (!response.ok) {
                setMessage(`Registration failed: ${response.status}`);
                return;
            }

            const data = await response.json();
            setAuthSession(data.token, data.user);

            const destination = roleToPath(data.user?.role);
            window.location.href = destination;
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage('Registration error: ' + details);
        } finally {
            setLoading(false);
        }
    }

    function goLogin() {
        window.location.href = '/login';
    }

    return (
        <div style={pageStyle()}>
            <section style={cardStyle()}>
                <h1 style={{ marginTop: 0 }}>Register</h1>
                <form onSubmit={submit}>
                    <p>
                        <label>
                            Full name
                            <br />
                            <input
                                style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem' }}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </label>
                    </p>

                    <p>
                        <label>
                            Email
                            <br />
                            <input
                                style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem' }}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                            />
                        </label>
                    </p>

                    <p>
                        <label>
                            Role
                            <br />
                            <select
                                style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem' }}
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                disabled={optionsLoading}
                            >
                                {roles.map((item) => (
                                    <option key={item.roleName} value={item.roleName}>{item.roleName}</option>
                                ))}
                            </select>
                        </label>
                    </p>

                    <p>
                        <label>
                            Department
                            <br />
                            <select
                                style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem' }}
                                value={departmentId}
                                onChange={(e) => setDepartmentId(e.target.value)}
                                disabled={optionsLoading}
                            >
                                {departments.map((item) => (
                                    <option key={item.departmentId} value={item.departmentId}>{item.name}</option>
                                ))}
                            </select>
                        </label>
                    </p>

                    <p>
                        <label>
                            <input
                                type="checkbox"
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                            />
                            {' '}I accept the terms
                        </label>
                    </p>

                    <p style={{ marginBottom: 0 }}>
                        <button type="submit" disabled={!canSubmit}>
                            {loading ? 'Registering...' : 'Register'}
                        </button>
                        <button type="button" onClick={goLogin} style={{ marginLeft: '0.75rem' }}>
                            Back to login
                        </button>
                    </p>
                </form>

                {message && (
                    <p style={{ color: message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') || message.toLowerCase().includes('invalid') ? '#b00020' : '#555' }}>
                        {message}
                    </p>
                )}
            </section>
        </div>
    );
}

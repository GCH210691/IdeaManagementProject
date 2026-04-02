import { useEffect } from 'react';
import { clearAuthSession, getAuthSession, getDisplayName, roleToPath } from './shared/authStorage';

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
        maxWidth: '700px',
        margin: '2rem auto',
        border: '1px solid #d5d5d5',
        borderRadius: '8px',
        padding: '1.4rem'
    };
}

export default function RoleLandingPage({ expectedRole, roleText }) {
    const session = getAuthSession();
    const user = session?.user;

    useEffect(() => {
        if (!session?.token || !user) {
            window.location.href = '/login';
            return;
        }

        if (user.role !== expectedRole) {
            const ownPath = roleToPath(user.role);
            window.location.href = ownPath;
        }
    }, [expectedRole, session, user]);

    function logout() {
        clearAuthSession();
        window.location.href = '/login';
    }

    if (!session?.token || !user) {
        return null;
    }

    const username = getDisplayName(user);

    return (
        <div style={pageStyle()}>
            <section style={cardStyle()}>
                <p style={{ margin: 0, fontSize: '1.1rem' }}>
                    {`welcome, ${roleText} ${username}.`}
                </p>
                <p style={{ marginTop: '1rem' }}>
                    <button onClick={logout}>Logout</button>
                </p>
            </section>
        </div>
    );
}

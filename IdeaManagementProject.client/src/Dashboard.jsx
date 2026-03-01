import { useEffect, useMemo } from 'react';
import { canCreateIdeas, clearAuthSession, getAuthSession, getDisplayName, roleToLabel } from './authStorage';

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

export default function Dashboard() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;

    useEffect(() => {
        if (!session?.token || !user) {
            window.location.href = '/login';
        }
    }, [session, user]);

    function logout() {
        clearAuthSession();
        window.location.href = '/login';
    }

    function viewIdeas() {
        window.location.href = '/ideas';
    }

    if (!session?.token || !user) {
        return null;
    }

    const username = getDisplayName(user);
    const roleText = roleToLabel(user.role);
    const showIdeasButton = canCreateIdeas(user);

    return (
        <div style={pageStyle()}>
            <section style={cardStyle()}>
                <h1 style={{ marginTop: 0 }}>Dashboard</h1>
                <p style={{ margin: 0, fontSize: '1.1rem' }}>
                    {`welcome, ${roleText} ${username}`}
                </p>
                <p style={{ marginTop: '1rem' }}>
                    {showIdeasButton && <button onClick={viewIdeas}>View ideas</button>}
                    <button onClick={logout} style={{ marginLeft: showIdeasButton ? '0.75rem' : 0 }}>Logout</button>
                </p>
            </section>
        </div>
    );
}


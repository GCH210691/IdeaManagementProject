import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import RegisterPage from './RegisterPage.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import StaffDashboard from './StaffDashboard.jsx';
import { getAuthSession } from './authStorage';

/**
 * Router dựa trên window.location.pathname.
 *
 * roleToPath() trong authStorage.js trả về:
 *   ADMIN          → /admin
 *   QA_MANAGER     → /qa-manager
 *   QA_COORDINATOR → /qa-coordinator
 *   STAFF          → /staff
 *
 * AdminDashboard tự detect role từ session để render đúng menu.
 */

const path = window.location.pathname.toLowerCase();

function guardedRedirect() {
    const session = getAuthSession();
    if (!session?.token) {
        window.location.replace('/');
        return true;
    }
    return false;
}

let Root = App;

if (path === '/register') {
    Root = RegisterPage;
} else if (path === '/staff') {
    if (!guardedRedirect()) Root = StaffDashboard;
} else if (path === '/admin' || path === '/qa-manager' || path === '/qa-coordinator') {
    if (!guardedRedirect()) Root = AdminDashboard;
} else if (path === '/' || path === '/login') {
    Root = App;
} else {
    window.location.replace('/');
}

if (Root) {
    createRoot(document.getElementById('root')).render(
        <StrictMode>
            <Root />
        </StrictMode>
    );
}

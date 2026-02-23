import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import RegisterPage from './RegisterPage.jsx';
import RoleLandingPage from './RoleLandingPage.jsx';

const path = window.location.pathname.toLowerCase();

let Root = App;

if (path === '/register') {
    Root = RegisterPage;
} else if (path === '/role/admin') {
    Root = () => <RoleLandingPage expectedRole="ADMIN" roleText="Admin" />;
} else if (path === '/role/qa-coordinator') {
    Root = () => <RoleLandingPage expectedRole="QA_COORDINATOR" roleText="QA coordinator" />;
} else if (path === '/role/qa-manager') {
    Root = () => <RoleLandingPage expectedRole="QA_MANAGER" roleText="QA manager" />;
} else if (path === '/role/staff') {
    Root = () => <RoleLandingPage expectedRole="STAFF" roleText="Staff" />;
} else if (path === '/' || path === '/login') {
    Root = App;
} else {
    window.location.replace('/login');
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Root />
    </StrictMode>
);

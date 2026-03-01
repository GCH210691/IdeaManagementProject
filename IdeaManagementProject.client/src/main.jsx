import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import RegisterPage from './RegisterPage.jsx';
import Dashboard from './Dashboard.jsx';
import IdeaListPage from './IdeaListPage.jsx';
import CreateIdeaPage from './CreateIdeaPage.jsx';
import IdeaDetailsPage from './IdeaDetailsPage.jsx';
import EditIdeaPage from './EditIdeaPage.jsx';

const path = window.location.pathname.toLowerCase();

let Root = App;

if (path === '/register') {
    Root = RegisterPage;
} else if (path === '/dashboard') {
    Root = Dashboard;
} else if (path === '/ideas') {
    Root = IdeaListPage;
} else if (path === '/ideas/create') {
    Root = CreateIdeaPage;
} else if (/^\/ideas\/\d+\/edit$/.test(path)) {
    Root = EditIdeaPage;
} else if (/^\/ideas\/\d+$/.test(path)) {
    Root = IdeaDetailsPage;
} else if (path === '/' || path === '/login') {
    Root = App;
} else {
    window.location.replace('/login');
}

createRoot(document.getElementById('root')).render(<Root />);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import RegisterPage from './RegisterPage.jsx';
import Dashboard from './Dashboard.jsx';
import IdeaListPage from './ideas/IdeaListPage.jsx';
import CreateIdeaPage from './ideas/CreateIdeaPage.jsx';
import IdeaDetailsPage from './ideas/IdeaDetailsPage.jsx';
import EditIdeaPage from './ideas/EditIdeaPage.jsx';
import RoleLandingPage from './RoleLandingPage.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import AdminAccountsPage from './admin/AdminAccountsPage.jsx';
import AdminDepartmentsPage from './admin/AdminDepartmentsPage.jsx';
import AdminClosureManagementPage from './admin/AdminClosureManagementPage.jsx';
import MyIdeasPage from './ideas/MyIdeasPage.jsx';
import DepartmentIdeasPage from './DepartmentIdeasPage.jsx';
import CategoryListPage from './qaManager/CategoryListPage.jsx';
import CategoryEditPage from './qaManager/CategoryEditPage.jsx';
import QaCoordinatorDepartmentManagementPage from './qaCoordinator/QaCoordinatorDepartmentManagementPage.jsx';
import QaCoordinatorNotificationsPage from './qaCoordinator/QaCoordinatorNotificationsPage.jsx';
import QaManagerAcademicYearReportsPage from './qaManager/QaManagerAcademicYearReportsPage.jsx';

const path = window.location.pathname.toLowerCase();

let Root = App;

if (path === '/register') {
    Root = RegisterPage;
} else if (path === '/dashboard') {
    Root = Dashboard;
} else if (path === '/admin/dashboard') {
    Root = AdminDashboard;
} else if (path === '/admin/accounts') {
    Root = AdminAccountsPage;
} else if (path === '/admin/departments') {
    Root = AdminDepartmentsPage;
} else if (path === '/admin/closure-periods') {
    Root = AdminClosureManagementPage;
} else if (path === '/admin/idea-management') {
    Root = AdminIdeaManagementPage;
} else if (path === '/staff/dashboard') {
    Root = Dashboard;
} else if (path === '/staff/my-ideas') {
    Root = MyIdeasPage;
} else if (path === '/staff/departments') {
    Root = DepartmentIdeasPage;
} else if (path === '/qa-coordinator/department-management') {
    Root = QaCoordinatorDepartmentManagementPage;
} else if (path === '/qa-coordinator/notifications') {
    Root = QaCoordinatorNotificationsPage;
} else if (path === '/qa-manager/academic-year-reports') {
    Root = QaManagerAcademicYearReportsPage;
} else if (path === '/qa-manager/categories') {
    Root = CategoryListPage;
} else if (/^\/qa-manager\/categories\/\d+\/edit$/.test(path)) {
    Root = CategoryEditPage;
} else if (path === '/role/admin') {
    Root = () => <RoleLandingPage expectedRole="ADMIN" roleText="Admin" />;
} else if (path === '/role/qa-coordinator') {
    Root = () => <RoleLandingPage expectedRole="QA_COORDINATOR" roleText="QA coordinator" />;
} else if (path === '/role/qa-manager') {
    Root = () => <RoleLandingPage expectedRole="QA_MANAGER" roleText="QA manager" />;
} else if (path === '/role/staff') {
    Root = () => <RoleLandingPage expectedRole="STAFF" roleText="Staff" />;
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

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Root />
    </StrictMode>,
);

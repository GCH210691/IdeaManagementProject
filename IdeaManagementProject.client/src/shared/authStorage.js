export const AUTH_STORAGE_KEY = 'uims_auth_session';
const envBaseUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_BASE_URL : '';
export const BASE_URL = 'http://localhost:5111'; // (envBaseUrl || '').replace(/\/+$/, '');

export function setAuthSession(token, user) {
    const payload = { token, user };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
}

export function getAuthSession() {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
    }
}

export function getAuthToken() {
    return getAuthSession()?.token || '';
}

export function getAuthHeaders(extraHeaders = {}) {
    const token = getAuthToken();
    const headers = { ...extraHeaders };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

export function clearAuthSession() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getDisplayName(user) {
    if (user?.name && user.name.trim().length > 0) {
        return user.name.trim();
    }

    if (user?.email && user.email.includes('@')) {
        return user.email.split('@')[0];
    }

    return 'user';
}

export function roleToPath(role) {
    switch (role) {
        case 'ADMIN':
            return '/admin/dashboard';
        case 'QA_COORDINATOR':
            return '/dashboard';
        case 'QA_MANAGER':
            return '/dashboard';
        case 'STAFF':
            return '/staff/dashboard';
        default:
            return '/dashboard';
    }
}

export function roleToLabel(role) {
    switch (role) {
        case 'ADMIN':
            return 'Admin';
        case 'QA_COORDINATOR':
            return 'QA coordinator';
        case 'QA_MANAGER':
            return 'QA manager';
        case 'STAFF':
            return 'Staff';
        default:
            return 'User';
    }
}

export function canCreateIdeas(user) {
    return user?.role === 'STAFF' || user?.role === 'QA_COORDINATOR';
}

export function canManageIdea(user, idea) {
    return canCreateIdeas(user) && Number(user?.id) === Number(idea?.authorUserId);
}

export function isDashboardRole(user) {
    return user?.role === 'STAFF' || user?.role === 'QA_COORDINATOR' || user?.role === 'QA_MANAGER';
}

export function canViewCategoryList(user) {
    return user?.role === 'QA_MANAGER';
}

export function canViewAcademicYearReports(user) {
    return user?.role === 'QA_MANAGER';
}

export const AUTH_STORAGE_KEY = 'uims_auth_session';

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
            return '/role/admin';
        case 'QA_COORDINATOR':
            return '/role/qa-coordinator';
        case 'QA_MANAGER':
            return '/role/qa-manager';
        case 'STAFF':
            return '/role/staff';
        default:
            return '/login';
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

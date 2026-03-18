// src/analyticsApi.js
// Service layer for Admin Analytics API

const BASE_URL = 'http://localhost:5111/api/admin/analytics';

function getToken() {
    try {
        const raw = localStorage.getItem('uims_auth_session');
        if (!raw) return null;
        const session = JSON.parse(raw);
        return session?.token ?? null;
    } catch {
        return null;
    }
}

function authHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function apiFetch(path) {
    const res = await fetch(`${BASE_URL}${path}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
    return res.json();
}

/** GET /api/admin/analytics/overview */
export async function fetchOverview() {
    return apiFetch('/overview');
}

/** GET /api/admin/analytics/role-distribution */
export async function fetchRoleDistribution() {
    return apiFetch('/role-distribution');
}

/** GET /api/admin/analytics/ideas-by-category */
export async function fetchIdeasByCategory() {
    return apiFetch('/ideas-by-category');
}

/** GET /api/admin/analytics/ideas-by-department */
export async function fetchIdeasByDepartment() {
    return apiFetch('/ideas-by-department');
}

/** GET /api/admin/analytics/post-frequency?year=YYYY */
export async function fetchPostFrequency(year) {
    const query = year ? `?year=${year}` : '';
    return apiFetch(`/post-frequency${query}`);
}

// src/analyticsApi.js
// Service layer for Admin Analytics API

import { BASE_URL, getAuthHeaders } from '../shared/authStorage';

const ANALYTICS_BASE_URL = `${BASE_URL}/api/admin/analytics`;

async function apiFetch(path) {
    const res = await fetch(`${ANALYTICS_BASE_URL}${path}`, {
        headers: getAuthHeaders({ Accept: 'application/json' }),
    });

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

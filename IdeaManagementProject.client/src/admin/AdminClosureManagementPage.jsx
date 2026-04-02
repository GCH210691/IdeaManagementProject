import { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders, getAuthSession, roleToPath } from '../shared/authStorage';
import AdminShell from '../shells/AdminShell';

function formatDateTime(value) {
    return value ? new Date(value).toLocaleString() : '';
}

function toDateTimeLocalValue(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toISOString().slice(0, 16);
}

export default function AdminClosureManagementPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;

    const [academicYears, setAcademicYears] = useState([]);
    const [closurePeriods, setClosurePeriods] = useState([]);
    const [message, setMessage] = useState('Loading closure management data...');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [newAcademicYearName, setNewAcademicYearName] = useState('');
    const [editingAcademicYearId, setEditingAcademicYearId] = useState(0);
    const [editingAcademicYearName, setEditingAcademicYearName] = useState('');

    const [newClosurePeriod, setNewClosurePeriod] = useState({
        academicYearId: '',
        title: '',
        ideaStartAt: '',
        ideaEndAt: '',
        commentEndAt: '',
    });
    const [editingClosurePeriodId, setEditingClosurePeriodId] = useState(0);
    const [editingClosurePeriod, setEditingClosurePeriod] = useState({
        academicYearId: '',
        title: '',
        ideaStartAt: '',
        ideaEndAt: '',
        commentEndAt: '',
    });

    async function loadData(successMessage = '') {
        setLoading(true);

        try {
            const [academicYearsResponse, closurePeriodsResponse] = await Promise.all([
                fetch('/api/admin/academic-years', {
                    headers: getAuthHeaders({ Accept: 'application/json' }),
                }),
                fetch('/api/admin/closure-periods', {
                    headers: getAuthHeaders({ Accept: 'application/json' }),
                }),
            ]);

            if (academicYearsResponse.status === 401 || closurePeriodsResponse.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (academicYearsResponse.status === 403 || closurePeriodsResponse.status === 403) {
                window.location.href = '/admin/dashboard';
                return;
            }

            if (!academicYearsResponse.ok || !closurePeriodsResponse.ok) {
                setMessage(`Load failed: academicYears=${academicYearsResponse.status}, closurePeriods=${closurePeriodsResponse.status}`);
                return;
            }

            const academicYearsData = await academicYearsResponse.json();
            const closurePeriodsData = await closurePeriodsResponse.json();

            setAcademicYears(Array.isArray(academicYearsData) ? academicYearsData : []);
            setClosurePeriods(Array.isArray(closurePeriodsData) ? closurePeriodsData : []);
            setMessage(successMessage);
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage('Load error: ' + details);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!session?.token || !user) {
            window.location.href = '/login';
            return;
        }

        if (user.role !== 'ADMIN') {
            window.location.href = roleToPath(user.role);
            return;
        }

        loadData();
    }, [session, user]);

    async function createAcademicYear() {
        if (!newAcademicYearName.trim()) {
            setMessage('Academic year name is required.');
            return;
        }

        setSaving(true);
        setMessage('Creating academic year...');

        try {
            const response = await fetch('/api/admin/academic-years', {
                method: 'POST',
                headers: getAuthHeaders({
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }),
                body: JSON.stringify({ yearName: newAcademicYearName.trim() }),
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                setMessage(payload?.message || `Create failed: ${response.status}`);
                return;
            }

            setNewAcademicYearName('');
            await loadData('Academic year created.');
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage('Create error: ' + details);
        } finally {
            setSaving(false);
        }
    }

    async function saveAcademicYear(academicYearId) {
        if (!editingAcademicYearName.trim()) {
            setMessage('Academic year name is required.');
            return;
        }

        setSaving(true);
        setMessage('Saving academic year...');

        try {
            const response = await fetch(`/api/admin/academic-years/${academicYearId}`, {
                method: 'PUT',
                headers: getAuthHeaders({
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }),
                body: JSON.stringify({ yearName: editingAcademicYearName.trim() }),
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                setMessage(payload?.message || `Save failed: ${response.status}`);
                return;
            }

            setEditingAcademicYearId(0);
            setEditingAcademicYearName('');
            await loadData('Academic year updated.');
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage('Save error: ' + details);
        } finally {
            setSaving(false);
        }
    }

    async function deleteAcademicYear(academicYear) {
        if (!window.confirm(`Delete academic year "${academicYear.yearName}"?`)) {
            return;
        }

        setSaving(true);
        setMessage('Deleting academic year...');

        try {
            const response = await fetch(`/api/admin/academic-years/${academicYear.academicYearId}`, {
                method: 'DELETE',
                headers: getAuthHeaders({ Accept: 'application/json' }),
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (response.status === 409) {
                const payload = await response.json().catch(() => null);
                setMessage(payload?.message || 'Academic year cannot be deleted.');
                return;
            }

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                setMessage(payload?.message || `Delete failed: ${response.status}`);
                return;
            }

            await loadData('Academic year deleted.');
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage('Delete error: ' + details);
        } finally {
            setSaving(false);
        }
    }

    async function createClosurePeriod() {
        if (!newClosurePeriod.academicYearId || !newClosurePeriod.title.trim() || !newClosurePeriod.ideaStartAt || !newClosurePeriod.ideaEndAt || !newClosurePeriod.commentEndAt) {
            setMessage('Academic year, title, idea start, idea end, and comment end are required.');
            return;
        }

        setSaving(true);
        setMessage('Creating closure period...');

        try {
            const response = await fetch('/api/admin/closure-periods', {
                method: 'POST',
                headers: getAuthHeaders({
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }),
                body: JSON.stringify({
                    academicYearId: Number(newClosurePeriod.academicYearId),
                    title: newClosurePeriod.title.trim(),
                    ideaStartAt: newClosurePeriod.ideaStartAt,
                    ideaEndAt: newClosurePeriod.ideaEndAt,
                    commentEndAt: newClosurePeriod.commentEndAt,
                }),
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                setMessage(payload?.message || `Create failed: ${response.status}`);
                return;
            }

            setNewClosurePeriod({
                academicYearId: '',
                title: '',
                ideaStartAt: '',
                ideaEndAt: '',
                commentEndAt: '',
            });
            await loadData('Closure period created.');
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage('Create error: ' + details);
        } finally {
            setSaving(false);
        }
    }

    async function saveClosurePeriod(closurePeriodId) {
        if (!editingClosurePeriod.academicYearId || !editingClosurePeriod.title.trim() || !editingClosurePeriod.ideaStartAt || !editingClosurePeriod.ideaEndAt || !editingClosurePeriod.commentEndAt) {
            setMessage('Academic year, title, idea start, idea end, and comment end are required.');
            return;
        }

        setSaving(true);
        setMessage('Saving closure period...');

        try {
            const response = await fetch(`/api/admin/closure-periods/${closurePeriodId}`, {
                method: 'PUT',
                headers: getAuthHeaders({
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }),
                body: JSON.stringify({
                    academicYearId: Number(editingClosurePeriod.academicYearId),
                    title: editingClosurePeriod.title.trim(),
                    ideaStartAt: editingClosurePeriod.ideaStartAt,
                    ideaEndAt: editingClosurePeriod.ideaEndAt,
                    commentEndAt: editingClosurePeriod.commentEndAt,
                }),
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                setMessage(payload?.message || `Save failed: ${response.status}`);
                return;
            }

            setEditingClosurePeriodId(0);
            setEditingClosurePeriod({
                academicYearId: '',
                title: '',
                ideaStartAt: '',
                ideaEndAt: '',
                commentEndAt: '',
            });
            await loadData('Closure period updated.');
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage('Save error: ' + details);
        } finally {
            setSaving(false);
        }
    }

    async function deleteClosurePeriod(closurePeriod) {
        if (!window.confirm(`Delete closure period "${closurePeriod.title}"?`)) {
            return;
        }

        setSaving(true);
        setMessage('Deleting closure period...');

        try {
            const response = await fetch(`/api/admin/closure-periods/${closurePeriod.closurePeriodId}`, {
                method: 'DELETE',
                headers: getAuthHeaders({ Accept: 'application/json' }),
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                setMessage(payload?.message || `Delete failed: ${response.status}`);
                return;
            }

            await loadData('Closure period deleted.');
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage('Delete error: ' + details);
        } finally {
            setSaving(false);
        }
    }

    function beginAcademicYearEdit(academicYear) {
        setEditingAcademicYearId(academicYear.academicYearId);
        setEditingAcademicYearName(academicYear.yearName);
    }

    function beginClosurePeriodEdit(closurePeriod) {
        setEditingClosurePeriodId(closurePeriod.closurePeriodId);
        setEditingClosurePeriod({
            academicYearId: String(closurePeriod.academicYearId),
            title: closurePeriod.title,
            ideaStartAt: toDateTimeLocalValue(closurePeriod.ideaStartAt),
            ideaEndAt: toDateTimeLocalValue(closurePeriod.ideaEndAt),
            commentEndAt: toDateTimeLocalValue(closurePeriod.commentEndAt),
        });
    }

    if (!session?.token || !user) {
        return null;
    }

    return (
        <AdminShell activeMenu="closure-periods">
            <div>
                <h1>Closure Date Management</h1>
                <p>Manage academic years and closure periods for idea submission and commenting.</p>

                {message && <p>{message}</p>}

                <p>
                    <button type="button" onClick={() => loadData('Data refreshed.')} disabled={loading || saving}>
                        Refresh
                    </button>
                </p>

                <hr />

                <h2>Academic Years</h2>
                <p>
                    <input
                        value={newAcademicYearName}
                        onChange={(event) => setNewAcademicYearName(event.target.value)}
                        placeholder="Academic year name"
                        disabled={saving}
                    />
                    {' '}
                    <button type="button" onClick={createAcademicYear} disabled={saving}>
                        Create academic year
                    </button>
                </p>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left' }}>Name</th>
                            <th style={{ textAlign: 'left' }}>Closure periods</th>
                            <th style={{ textAlign: 'left' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {academicYears.map((academicYear) => (
                            <tr key={academicYear.academicYearId}>
                                <td style={{ padding: '0.5rem 0' }}>
                                    {editingAcademicYearId === academicYear.academicYearId ? (
                                        <input
                                            value={editingAcademicYearName}
                                            onChange={(event) => setEditingAcademicYearName(event.target.value)}
                                            disabled={saving}
                                        />
                                    ) : (
                                        academicYear.yearName
                                    )}
                                </td>
                                <td>{academicYear.closurePeriodCount}</td>
                                <td>
                                    {editingAcademicYearId === academicYear.academicYearId ? (
                                        <>
                                            <button type="button" onClick={() => saveAcademicYear(academicYear.academicYearId)} disabled={saving}>Save</button>
                                            {' '}
                                            <button type="button" onClick={() => { setEditingAcademicYearId(0); setEditingAcademicYearName(''); }} disabled={saving}>Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button type="button" onClick={() => beginAcademicYearEdit(academicYear)} disabled={saving}>Edit</button>
                                            {' '}
                                            <button type="button" onClick={() => deleteAcademicYear(academicYear)} disabled={saving}>Delete</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {!loading && academicYears.length === 0 && (
                            <tr>
                                <td colSpan={3}>No academic years yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <hr />

                <h2>Closure Periods</h2>
                <p>
                    <select
                        value={newClosurePeriod.academicYearId}
                        onChange={(event) => setNewClosurePeriod((current) => ({ ...current, academicYearId: event.target.value }))}
                        disabled={saving}>
                        <option value="">Select academic year</option>
                        {academicYears.map((academicYear) => (
                            <option key={academicYear.academicYearId} value={academicYear.academicYearId}>
                                {academicYear.yearName}
                            </option>
                        ))}
                    </select>
                    {' '}
                    <input
                        value={newClosurePeriod.title}
                        onChange={(event) => setNewClosurePeriod((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Title"
                        disabled={saving}
                    />
                    {' '}
                    <input
                        type="datetime-local"
                        value={newClosurePeriod.ideaStartAt}
                        onChange={(event) => setNewClosurePeriod((current) => ({ ...current, ideaStartAt: event.target.value }))}
                        disabled={saving}
                    />
                    {' '}
                    <input
                        type="datetime-local"
                        value={newClosurePeriod.ideaEndAt}
                        onChange={(event) => setNewClosurePeriod((current) => ({ ...current, ideaEndAt: event.target.value }))}
                        disabled={saving}
                    />
                    {' '}
                    <input
                        type="datetime-local"
                        value={newClosurePeriod.commentEndAt}
                        onChange={(event) => setNewClosurePeriod((current) => ({ ...current, commentEndAt: event.target.value }))}
                        disabled={saving}
                    />
                    {' '}
                    <button type="button" onClick={createClosurePeriod} disabled={saving}>
                        Create closure period
                    </button>
                </p>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left' }}>Academic year</th>
                            <th style={{ textAlign: 'left' }}>Title</th>
                            <th style={{ textAlign: 'left' }}>Idea start</th>
                            <th style={{ textAlign: 'left' }}>Idea end</th>
                            <th style={{ textAlign: 'left' }}>Comment end</th>
                            <th style={{ textAlign: 'left' }}>Ideas</th>
                            <th style={{ textAlign: 'left' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {closurePeriods.map((closurePeriod) => (
                            <tr key={closurePeriod.closurePeriodId}>
                                <td style={{ padding: '0.5rem 0' }}>
                                    {editingClosurePeriodId === closurePeriod.closurePeriodId ? (
                                        <select
                                            value={editingClosurePeriod.academicYearId}
                                            onChange={(event) => setEditingClosurePeriod((current) => ({ ...current, academicYearId: event.target.value }))}
                                            disabled={saving}>
                                            <option value="">Select academic year</option>
                                            {academicYears.map((academicYear) => (
                                                <option key={academicYear.academicYearId} value={academicYear.academicYearId}>
                                                    {academicYear.yearName}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        closurePeriod.academicYearName
                                    )}
                                </td>
                                <td>
                                    {editingClosurePeriodId === closurePeriod.closurePeriodId ? (
                                        <input
                                            value={editingClosurePeriod.title}
                                            onChange={(event) => setEditingClosurePeriod((current) => ({ ...current, title: event.target.value }))}
                                            disabled={saving}
                                        />
                                    ) : (
                                        closurePeriod.title
                                    )}
                                </td>
                                <td>
                                    {editingClosurePeriodId === closurePeriod.closurePeriodId ? (
                                        <input
                                            type="datetime-local"
                                            value={editingClosurePeriod.ideaStartAt}
                                            onChange={(event) => setEditingClosurePeriod((current) => ({ ...current, ideaStartAt: event.target.value }))}
                                            disabled={saving}
                                        />
                                    ) : (
                                        formatDateTime(closurePeriod.ideaStartAt)
                                    )}
                                </td>
                                <td>
                                    {editingClosurePeriodId === closurePeriod.closurePeriodId ? (
                                        <input
                                            type="datetime-local"
                                            value={editingClosurePeriod.ideaEndAt}
                                            onChange={(event) => setEditingClosurePeriod((current) => ({ ...current, ideaEndAt: event.target.value }))}
                                            disabled={saving}
                                        />
                                    ) : (
                                        formatDateTime(closurePeriod.ideaEndAt)
                                    )}
                                </td>
                                <td>
                                    {editingClosurePeriodId === closurePeriod.closurePeriodId ? (
                                        <input
                                            type="datetime-local"
                                            value={editingClosurePeriod.commentEndAt}
                                            onChange={(event) => setEditingClosurePeriod((current) => ({ ...current, commentEndAt: event.target.value }))}
                                            disabled={saving}
                                        />
                                    ) : (
                                        formatDateTime(closurePeriod.commentEndAt)
                                    )}
                                </td>
                                <td>{closurePeriod.ideaCount}</td>
                                <td>
                                    {editingClosurePeriodId === closurePeriod.closurePeriodId ? (
                                        <>
                                            <button type="button" onClick={() => saveClosurePeriod(closurePeriod.closurePeriodId)} disabled={saving}>Save</button>
                                            {' '}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingClosurePeriodId(0);
                                                    setEditingClosurePeriod({
                                                        academicYearId: '',
                                                        title: '',
                                                        ideaStartAt: '',
                                                        ideaEndAt: '',
                                                        commentEndAt: '',
                                                    });
                                                }}
                                                disabled={saving}>
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button type="button" onClick={() => beginClosurePeriodEdit(closurePeriod)} disabled={saving}>Edit</button>
                                            {' '}
                                            <button type="button" onClick={() => deleteClosurePeriod(closurePeriod)} disabled={saving}>Delete</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {!loading && closurePeriods.length === 0 && (
                            <tr>
                                <td colSpan={7}>No closure periods yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminShell>
    );
}

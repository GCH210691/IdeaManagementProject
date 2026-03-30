import { useEffect, useMemo, useState } from 'react';
import { canViewAcademicYearReports, getAuthHeaders, getAuthSession, roleToPath } from './authStorage';
import StaffShell from './StaffShell';

function formatRole(role) {
    return String(role || '')
        .toLowerCase()
        .split('_')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

export default function QaManagerAcademicYearReportsPage() {
    const session = useMemo(() => getAuthSession(), []);
    const user = session?.user;

    const [academicYears, setAcademicYears] = useState([]);
    const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('');
    const [report, setReport] = useState(null);
    const [message, setMessage] = useState('Loading academic year reports...');
    const [loading, setLoading] = useState(true);

    async function loadAcademicYears(preferredAcademicYearId = '') {
        try {
            const response = await fetch('/api/qa-manager/academic-year-reports/academic-years', {
                headers: getAuthHeaders({ Accept: 'application/json' }),
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (response.status === 403) {
                window.location.href = roleToPath(user?.role);
                return;
            }

            if (!response.ok) {
                setMessage(`Load failed: ${response.status}`);
                return;
            }

            const data = await response.json();
            const nextAcademicYears = Array.isArray(data) ? data : [];
            setAcademicYears(nextAcademicYears);

            const nextAcademicYearId = preferredAcademicYearId || String(nextAcademicYears[0]?.academicYearId || '');
            setSelectedAcademicYearId(nextAcademicYearId);

            if (nextAcademicYearId) {
                await loadReport(nextAcademicYearId, false);
            } else {
                setReport(null);
                setMessage('No academic years available.');
            }
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setMessage('Load error: ' + details);
        } finally {
            setLoading(false);
        }
    }

    async function loadReport(academicYearId, showSuccessMessage = true) {
        if (!academicYearId) {
            setReport(null);
            setMessage('Select an academic year.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`/api/qa-manager/academic-year-reports/${academicYearId}`, {
                headers: getAuthHeaders({ Accept: 'application/json' }),
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (response.status === 403) {
                window.location.href = roleToPath(user?.role);
                return;
            }

            if (response.status === 404) {
                setReport(null);
                setMessage('Academic year not found.');
                return;
            }

            if (!response.ok) {
                setReport(null);
                setMessage(`Load failed: ${response.status}`);
                return;
            }

            const data = await response.json();
            setReport(data);
            setMessage(showSuccessMessage ? 'Report loaded.' : '');
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            setReport(null);
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

        if (!canViewAcademicYearReports(user)) {
            window.location.href = roleToPath(user.role);
            return;
        }

        loadAcademicYears();
    }, [session, user]);

    if (!session?.token || !user) {
        return null;
    }

    const ideas = Array.isArray(report?.ideas) ? report.ideas : [];
    const comments = Array.isArray(report?.comments) ? report.comments : [];

    return (
        <StaffShell activeMenu="academic-year-reports" footerText="Academic year reports">
            <div>
                <h1>Academic Year Reports</h1>
                <p>View ideas and comments filtered by academic year.</p>

                {message && <p>{message}</p>}

                <p>
                    <select
                        value={selectedAcademicYearId}
                        onChange={(event) => setSelectedAcademicYearId(event.target.value)}
                        disabled={loading}>
                        <option value="">Select academic year</option>
                        {academicYears.map((academicYear) => (
                            <option key={academicYear.academicYearId} value={academicYear.academicYearId}>
                                {academicYear.yearName}
                            </option>
                        ))}
                    </select>
                    {' '}
                    <button type="button" onClick={() => loadReport(selectedAcademicYearId)} disabled={loading || !selectedAcademicYearId}>
                        Load report
                    </button>
                    {' '}
                    <button type="button" onClick={() => loadAcademicYears(selectedAcademicYearId)} disabled={loading}>
                        Refresh
                    </button>
                </p>

                {report && (
                    <>
                        <p>
                            <strong>Academic year:</strong> {report.academicYearName}
                        </p>
                        <p>
                            <strong>Ideas:</strong> {ideas.length}
                            {' | '}
                            <strong>Comments:</strong> {comments.length}
                        </p>

                        <h2>Ideas</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left' }}>Title</th>
                                    <th style={{ textAlign: 'left' }}>Author</th>
                                    <th style={{ textAlign: 'left' }}>Department</th>
                                    <th style={{ textAlign: 'left' }}>Closure period</th>
                                    <th style={{ textAlign: 'left' }}>Comments</th>
                                    <th style={{ textAlign: 'left' }}>Votes</th>
                                    <th style={{ textAlign: 'left' }}>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ideas.map((idea) => (
                                    <tr key={idea.ideaId}>
                                        <td style={{ padding: '0.5rem 0' }}>{idea.title}</td>
                                        <td>{idea.authorName}</td>
                                        <td>{idea.departmentName}</td>
                                        <td>{idea.closurePeriodTitle}</td>
                                        <td>{idea.commentCount}</td>
                                        <td>{idea.upvoteCount} up / {idea.downvoteCount} down</td>
                                        <td>{new Date(idea.createdAt).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {ideas.length === 0 && (
                                    <tr>
                                        <td colSpan={7}>No ideas found for this academic year.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <h2>Comments</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left' }}>Idea</th>
                                    <th style={{ textAlign: 'left' }}>Comment author</th>
                                    <th style={{ textAlign: 'left' }}>Department</th>
                                    <th style={{ textAlign: 'left' }}>Closure period</th>
                                    <th style={{ textAlign: 'left' }}>Created</th>
                                    <th style={{ textAlign: 'left' }}>Content</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comments.map((comment) => (
                                    <tr key={comment.commentId}>
                                        <td style={{ padding: '0.5rem 0' }}>{comment.ideaTitle}</td>
                                        <td>{comment.authorName} [{formatRole(comment.authorRole)}]</td>
                                        <td>{comment.departmentName}</td>
                                        <td>{comment.closurePeriodTitle}</td>
                                        <td>{new Date(comment.createdAt).toLocaleString()}</td>
                                        <td style={{ whiteSpace: 'pre-wrap' }}>{comment.content}</td>
                                    </tr>
                                ))}
                                {comments.length === 0 && (
                                    <tr>
                                        <td colSpan={6}>No comments found for this academic year.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </StaffShell>
    );
}

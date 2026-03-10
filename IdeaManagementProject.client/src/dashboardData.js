// Mock data (replace with real API calls later)

export const recentIdeas = [
    { id: 1, title: 'Optimize onboarding workflow', author: 'User A', category: 'HR', likes: 125, comments: 30, time: '2 hours ago', hot: true },
    { id: 2, title: 'AI online learning platform', author: 'User B', category: 'Education', likes: 98, comments: 15, time: '4 hours ago', hot: false },
    { id: 3, title: 'Green delivery application', author: 'User C', category: 'Service', likes: 76, comments: 12, time: '6 hours ago', hot: false },
    { id: 4, title: 'Supply chain software', author: 'User D', category: 'Business', likes: 54, comments: 8, time: '8 hours ago', hot: false },
    { id: 5, title: 'AI customer support chatbot', author: 'User E', category: 'Tools', likes: 201, comments: 47, time: '1 hour ago', hot: true },
];

export const hotIdeas = [...recentIdeas].sort((a, b) => b.comments - a.comments).slice(0, 4);

export const recentComments = [
    { user: 'User B', idea: 'Optimize onboarding workflow', text: 'Great idea, I fully support this.', time: '10 minutes ago' },
    { user: 'User C', idea: 'AI customer support chatbot', text: 'Can we add better NLP support?', time: '25 minutes ago' },
    { user: 'User D', idea: 'AI online learning platform', text: 'I tried it, and it works very well.', time: '1 hour ago' },
];

export const roleData = [
    { name: 'User', value: 5200, color: '#3B82F6' },
    { name: 'Staff', value: 2100, color: '#6366F1' },
    { name: 'QA', value: 800, color: '#8B5CF6' },
    { name: 'Admin', value: 400, color: '#1E3A5F' },
];

export const postFreq = [
    { month: 'Jan', posts: 150, comments: 320 },
    { month: 'Feb', posts: 220, comments: 410 },
    { month: 'Mar', posts: 310, comments: 580 },
    { month: 'Apr', posts: 280, comments: 520 },
    { month: 'May', posts: 390, comments: 730 },
    { month: 'Jun', posts: 460, comments: 890 },
];

export const categoryDist = [
    { name: 'Tools', ideas: 340 },
    { name: 'Education', ideas: 280 },
    { name: 'Service', ideas: 210 },
    { name: 'Business', ideas: 190 },
    { name: 'HR', ideas: 150 },
    { name: 'Other', ideas: 80 },
];

export const onlineUsers = [
    { time: '08:00', count: 120 },
    { time: '09:00', count: 340 },
    { time: '10:00', count: 520 },
    { time: '11:00', count: 680 },
    { time: '12:00', count: 410 },
    { time: '13:00', count: 290 },
    { time: '14:00', count: 610 },
    { time: '15:00', count: 740 },
];

// Auth helpers
export function getSessionRole() {
    try {
        const raw = localStorage.getItem('uims_auth_session');
        if (!raw) return null;
        const user = JSON.parse(raw);
        return user?.role ?? null;
    } catch {
        return null;
    }
}

export function requireAuth() {
    const raw = localStorage.getItem('uims_auth_session');
    if (!raw) {
        window.location.href = '/login';
        return;
    }

    try {
        const session = JSON.parse(raw);
        if (!session?.token || !session?.user) {
            throw new Error('Invalid session');
        }
    } catch {
        localStorage.removeItem('uims_auth_session');
        window.location.href = '/login';
    }
}

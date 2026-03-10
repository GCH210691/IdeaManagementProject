// ── MOCK DATA (thay bằng API calls thực tế sau) ──────────────────────

export const recentIdeas = [
    { id: 1, title: 'Tối ưu Quy trình Onboarding', author: 'Nguyễn Văn A', category: 'HR',        likes: 125, comments: 30, time: '2 giờ trước',  hot: true  },
    { id: 2, title: 'Nền tảng Học tập Trực tuyến AI', author: 'Trần Thị B', category: 'Giáo dục', likes: 98,  comments: 15, time: '4 giờ trước',  hot: false },
    { id: 3, title: 'Ứng dụng Giao hàng Xanh',       author: 'Lê Văn C',   category: 'Dịch vụ',  likes: 76,  comments: 12, time: '6 giờ trước',  hot: false },
    { id: 4, title: 'Phần mềm Chuỗi Cung ứng',       author: 'Phạm Thị D', category: 'Kinh doanh',likes: 54, comments: 8,  time: '8 giờ trước',  hot: false },
    { id: 5, title: 'Chatbot AI Hỗ trợ Khách hàng',  author: 'Hoàng Văn E', category: 'Công cụ',  likes: 201, comments: 47, time: '1 giờ trước', hot: true  },
];

export const hotIdeas = [...recentIdeas].sort((a, b) => b.comments - a.comments).slice(0, 4);

export const recentComments = [
    { user: 'User B', idea: 'Tối ưu Onboarding',    text: 'Ý tưởng rất hay, tôi hoàn toàn ủng hộ!',  time: '10 phút trước' },
    { user: 'User C', idea: 'Chatbot AI',            text: 'Có thể tích hợp thêm NLP không?',          time: '25 phút trước' },
    { user: 'User D', idea: 'Nền tảng Học tập',      text: 'Đã thử rồi, hiệu quả thực sự!',            time: '1 giờ trước'   },
];

export const roleData = [
    { name: 'User',  value: 5200, color: '#3B82F6' },
    { name: 'Staff', value: 2100, color: '#6366F1' },
    { name: 'QA',    value: 800,  color: '#8B5CF6' },
    { name: 'Admin', value: 400,  color: '#1E3A5F' },
];

export const postFreq = [
    { month: 'T1', posts: 150, comments: 320 },
    { month: 'T2', posts: 220, comments: 410 },
    { month: 'T3', posts: 310, comments: 580 },
    { month: 'T4', posts: 280, comments: 520 },
    { month: 'T5', posts: 390, comments: 730 },
    { month: 'T6', posts: 460, comments: 890 },
];

export const categoryDist = [
    { name: 'Công cụ',   ideas: 340 },
    { name: 'Giáo dục',  ideas: 280 },
    { name: 'Dịch vụ',   ideas: 210 },
    { name: 'Kinh doanh',ideas: 190 },
    { name: 'HR',         ideas: 150 },
    { name: 'Khác',       ideas: 80  },
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

// ── AUTH HELPERS ──────────────────────────────────────────────────────

/** Lấy role từ session (token lưu ở localStorage bởi authStorage.js) */
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

/** Redirect về login nếu chưa xác thực */
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


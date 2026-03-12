// ── MOCK DATA – IdeaHub ──────────────────────────────────────────────
// Thay thế bằng API calls thực tế sau

export const DEPTS = [
    'Computer Science', 'Business Administration', 'Environmental Science',
    'Psychology', 'Liberal Arts', 'Food Technology', 'Physical Education',
];

export const INIT_CATS = [
    { id: 1, name: 'Research',        desc: 'Đề xuất nghiên cứu học thuật',     count: 3, active: true },
    { id: 2, name: 'Event',           desc: 'Sự kiện và hoạt động trường',       count: 2, active: true },
    { id: 3, name: 'General',         desc: 'Ý tưởng cải tiến tổng hợp',         count: 1, active: true },
    { id: 4, name: 'School Sports',   desc: 'Thể thao và hoạt động thể chất',    count: 1, active: true },
    { id: 5, name: 'Exams',           desc: 'Đề xuất liên quan đến kỳ thi',      count: 1, active: true },
    { id: 6, name: 'Canteen Foods',   desc: 'Góp ý về ăn uống, căng-tin',        count: 2, active: true },
    { id: 7, name: 'Club Recruitment',desc: 'Hoạt động câu lạc bộ sinh viên',    count: 1, active: true },
];

export const INIT_IDEAS = [
    { id: 1,  title: 'AI-Powered Study Assistant',    cat: 'Research',        author: 'Nguyen Van A', av: 'NV', dept: 'Computer Science',       views: 342, up: 87,  down: 4,  comments: 2, date: '2h ago',  desc: 'Build an AI assistant that helps students plan study schedules, track progress, and suggest resources based on individual learning styles.',           status: 'approved', anon: false, docs: [] },
    { id: 2,  title: 'Green Campus Initiative',       cat: 'General',         author: 'Tran Thi B',   av: 'TB', dept: 'Environmental Science',   views: 289, up: 64,  down: 2,  comments: 1, date: '5h ago',  desc: 'Chương trình bền vững toàn khuôn viên: lắp pin mặt trời, trạm tái chế và phương tiện thân thiện với môi trường.',                                    status: 'approved', anon: false, docs: ['green_plan.pdf'] },
    { id: 3,  title: 'Annual Sports Festival',        cat: 'School Sports',   author: 'Anonymous',    av: '?',  dept: 'Physical Education',      views: 256, up: 91,  down: 1,  comments: 1, date: '1d ago',  desc: 'Tổ chức lễ hội thể thao toàn trường với các cuộc thi liên khoa, biểu diễn văn hóa và hội thảo sức khỏe.',                                             status: 'approved', anon: true,  docs: [] },
    { id: 4,  title: 'Smart Canteen System',          cat: 'Canteen Foods',   author: 'Pham Thi D',   av: 'PD', dept: 'Food Technology',         views: 198, up: 45,  down: 8,  comments: 0, date: '2d ago',  desc: 'Triển khai hệ thống đặt món kỹ thuật số cho căng-tin, giảm thời gian chờ và hạn chế lãng phí thực phẩm.',                                            status: 'pending',  anon: false, docs: ['canteen_proposal.docx'] },
    { id: 5,  title: 'Exam Stress Relief Program',   cat: 'Exams',           author: 'Hoang Van E',  av: 'HV', dept: 'Psychology',              views: 445, up: 112, down: 3,  comments: 0, date: '3d ago',  desc: 'Tạo chương trình hỗ trợ mùa thi: tư vấn tâm lý, lớp thiền định và mạng lưới gia sư đồng đẳng.',                                                     status: 'approved', anon: false, docs: [] },
    { id: 6,  title: 'Tech Club Recruitment Drive',  cat: 'Club Recruitment',author: 'Anonymous',    av: '?',  dept: 'Computer Science',       views: 167, up: 38,  down: 5,  comments: 0, date: '4d ago',  desc: 'Khởi động chiến dịch tuyển thành viên cho Tech Club với hackathon, workshop và khách mời từ doanh nghiệp.',                                            status: 'pending',  anon: true,  docs: ['flyer.png'] },
    { id: 7,  title: 'Online Research Library',      cat: 'Research',        author: 'Dang Van G',   av: 'DG', dept: 'Library Science',         views: 523, up: 134, down: 2,  comments: 1, date: '5d ago',  desc: 'Xây dựng thư viện nghiên cứu trực tuyến với tìm kiếm AI, công cụ trích dẫn và tính năng cộng tác.',                                                   status: 'approved', anon: false, docs: ['library_spec.pdf', 'budget.xlsx'] },
    { id: 8,  title: 'Mental Health Awareness Week', cat: 'Event',           author: 'Bui Thi H',    av: 'BH', dept: 'Counseling',              views: 312, up: 98,  down: 1,  comments: 0, date: '1w ago',  desc: 'Tổ chức tuần lễ nâng cao nhận thức sức khỏe tâm thần với workshop, chuyên gia và hoạt động hỗ trợ đồng đẳng.',                                        status: 'approved', anon: false, docs: [] },
    { id: 9,  title: 'Campus Food Review Platform',  cat: 'Canteen Foods',   author: 'Nguyen Thi I', av: 'NI', dept: 'Business',                views: 189, up: 52,  down: 9,  comments: 0, date: '1w ago',  desc: 'Tạo nền tảng để sinh viên đánh giá và góp ý cải thiện các lựa chọn ẩm thực trong khuôn viên.',                                                      status: 'rejected', anon: false, docs: [] },
    { id: 10, title: 'Inter-University Debate League',cat: 'Event',          author: 'Tran Van J',   av: 'TJ', dept: 'Liberal Arts',            views: 234, up: 67,  down: 3,  comments: 0, date: '2w ago', desc: 'Thành lập giải đấu tranh biện liên trường để phát triển tư duy phản biện và kỹ năng nói trước công chúng.',                                          status: 'approved', anon: false, docs: ['proposal.pdf'] },
    { id: 11, title: 'Renewable Energy Research Hub', cat: 'Research',       author: 'Le Thi K',     av: 'LK', dept: 'Environmental Science',   views: 178, up: 43,  down: 2,  comments: 0, date: '2w ago', desc: 'Thành lập trung tâm nghiên cứu năng lượng tái tạo liên ngành tập trung vào năng lượng mặt trời và điện gió.',                                          status: 'pending',  anon: false, docs: [] },
    { id: 12, title: 'Campus Bike-Sharing Program',  cat: 'General',         author: 'Phan Van L',   av: 'PL', dept: 'Physical Education',      views: 201, up: 77,  down: 4,  comments: 0, date: '3w ago', desc: 'Triển khai hệ thống chia sẻ xe đạp trong khuôn viên để giảm ùn tắc và khuyến khích sinh viên tập thể dục.',                                          status: 'approved', anon: false, docs: [] },
];

export const INIT_CMTS = [
    { id: 1, ideaId: 1, user: 'Tran Thi B', av: 'TB', text: 'Ý tưởng xuất sắc! Trường mình thực sự cần hệ thống hỗ trợ như vậy.', time: '2h ago', up: 12, anon: false },
    { id: 2, ideaId: 1, user: 'Anonymous',  av: '?',  text: 'Tôi rất ủng hộ. Muốn tham gia vào quá trình phát triển.', time: '3h ago', up: 8,  anon: true  },
    { id: 3, ideaId: 2, user: 'Le Van C',   av: 'LC', text: 'Cuối cùng cũng có người nghĩ đến điều này. Chúng ta cần nhiều sáng kiến xanh hơn.', time: '6h ago', up: 15, anon: false },
    { id: 4, ideaId: 3, user: 'Anonymous',  av: '?',  text: 'Ý tưởng tuyệt! Có thể thêm nội dung thi bơi lội không?', time: '1d ago', up: 5,  anon: true  },
    { id: 5, ideaId: 7, user: 'Nguyen Van A',av:'NV', text: 'Điều này sẽ thay đổi cách chúng ta nghiên cứu. Hoàn toàn ủng hộ!', time: '3d ago', up: 9, anon: false },
];

export const INIT_NOTIFS = [
    { id: 1, type: 'like',     msg: "Tran Thi B đã thích ý tưởng 'AI-Powered Study Assistant' của bạn", time: '2 phút trước', read: false },
    { id: 2, type: 'comment',  msg: "Có người vừa bình luận về ý tưởng 'Green Campus Initiative'",       time: '1 giờ trước',  read: false },
    { id: 3, type: 'approved', msg: "Ý tưởng 'Annual Sports Festival' của bạn đã được duyệt",           time: '3 giờ trước',  read: true  },
    { id: 4, type: 'email',    msg: 'Có ý tưởng mới được gửi trong phòng ban của bạn',                  time: '5 giờ trước',  read: true  },
    { id: 5, type: 'like',     msg: 'Ẩn danh đã thích bình luận của bạn',                               time: '1 ngày trước', read: true  },
];

export const INIT_USERS = [
    { id: 1, name: 'Admin System',      email: 'admin@university.edu',       dept: 'IT',               role: 'ADMIN',          ideas: 0, av: 'AS', status: 'active'   },
    { id: 2, name: 'QA Manager',        email: 'qamanager@university.edu',   dept: 'Quality Assurance',role: 'QA_MANAGER',     ideas: 0, av: 'QM', status: 'active'   },
    { id: 3, name: 'Dr. Nguyen Coord',  email: 'coordinator@university.edu', dept: 'Computer Science', role: 'QA_COORDINATOR', ideas: 0, av: 'NC', status: 'active'   },
    { id: 4, name: 'Nguyen Van A',      email: 'nguyenvana@university.edu',  dept: 'Computer Science', role: 'STAFF',          ideas: 4, av: 'NV', status: 'active'   },
    { id: 5, name: 'Tran Thi B',        email: 'tranthib@university.edu',    dept: 'Business',         role: 'STAFF',          ideas: 2, av: 'TB', status: 'active'   },
    { id: 6, name: 'Le Van C',          email: 'levanc@university.edu',      dept: 'PE',               role: 'STAFF',          ideas: 1, av: 'LC', status: 'inactive' },
    { id: 7, name: 'Pham Thi D',        email: 'phamthid@university.edu',    dept: 'Food Tech',        role: 'STAFF',          ideas: 1, av: 'PD', status: 'active'   },
];

// ── AUTH HELPERS ──────────────────────────────────────────────────────
export function requireAuth() {
    // Bỏ comment để bật bảo vệ thực tế
    // const raw = localStorage.getItem('uims_auth_session');
    // if (!raw) window.location.href = '/';
}

// ── Recharts data ─────────────────────────────────────────────────────
export const roleData = [
    { name: 'Staff', value: 5200, color: '#3B82F6' },
    { name: 'QA Coordinator', value: 800, color: '#8B5CF6' },
    { name: 'QA Manager', value: 300, color: '#6366F1' },
    { name: 'Admin', value: 100, color: '#1E3A5F' },
];

export const postFreq = [
    { month: 'T1', posts: 150, comments: 320 },
    { month: 'T2', posts: 220, comments: 410 },
    { month: 'T3', posts: 310, comments: 580 },
    { month: 'T4', posts: 280, comments: 520 },
    { month: 'T5', posts: 390, comments: 730 },
    { month: 'T6', posts: 460, comments: 890 },
];

export const categoryDist = INIT_CATS.map(c => ({ name: c.name, ideas: c.count * 40 + 80 }));

export const onlineUsers = [
    { time: '08:00', count: 120 }, { time: '09:00', count: 340 },
    { time: '10:00', count: 520 }, { time: '11:00', count: 680 },
    { time: '12:00', count: 410 }, { time: '13:00', count: 290 },
    { time: '14:00', count: 610 }, { time: '15:00', count: 740 },
];

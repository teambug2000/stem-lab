/**
 * 🗄️ STORAGE ENGINE: stem-lab LocalStorage Manager
 */

const STORAGE_KEYS = {
    BOOKINGS: 'stem_lab_bookings',
    DEVICES: 'stem_lab_devices',
    PREFERENCES: 'stem_lab_preferences',
    USERS: 'stem_lab_users',
    SESSION: 'stem_lab_session',
    API_URL: 'stem_lab_api_url',
    TELEGRAM_TOKEN: 'stem_lab_tg_token',
    TELEGRAM_CHATID: 'stem_lab_tg_chatid'
};

// Tài khoản đăng nhập mẫu
const MOCK_USERS = [
    { username: 'hocsinh', password: '123456', name: '🎓 Học sinh', role: 'student' },
    { username: 'troly', password: '123456', name: '⚡ Lab Assistant', role: 'assistant' },
    { username: 'giaovien', password: '123456', name: '👨‍🏫 Giáo viên / Admin', role: 'teacher' }
];

// Lấy ngày hiện tại động làm ngày mặc định cho dữ liệu mẫu
const todayStr = new Date().toISOString().split('T')[0];

// Function to generate the default 61 devices
function generateDefaultDevices() {
    const list = [];
    
    // 1. Kính hiển vi: 2 cái (yellow)
    for (let i = 1; i <= 2; i++) {
        list.push({ id: `dev_khv_${i}`, name: `Kính hiển vi #${i}`, type: 'Kính hiển vi', zone: 'yellow', status: 'available' });
    }
    // 2. Vex IQ: 7 bộ (red)
    for (let i = 1; i <= 7; i++) {
        list.push({ id: `dev_viq_${i}`, name: `Bộ Vex IQ #${i}`, type: 'Vex IQ', zone: 'red', status: 'available' });
    }
    // 3. Vex AIM: 4 bộ (red)
    for (let i = 1; i <= 4; i++) {
        list.push({ id: `dev_vaim_${i}`, name: `Bộ Vex AIM #${i}`, type: 'Vex AIM', zone: 'red', status: 'available' });
    }
    // 4. Vex V5: 3 bộ (red)
    for (let i = 1; i <= 3; i++) {
        list.push({ id: `dev_vv5_${i}`, name: `Bộ Vex V5 #${i}`, type: 'Vex V5', zone: 'red', status: 'available' });
    }
    // 5. KC BOT: 7 bộ (red)
    for (let i = 1; i <= 7; i++) {
        list.push({ id: `dev_kcb_${i}`, name: `Bộ KC BOT #${i}`, type: 'KC BOT', zone: 'red', status: 'available' });
    }
    // 6. Bộ học tập AI - IoT: 10 bộ (yellow)
    for (let i = 1; i <= 10; i++) {
        list.push({ id: `dev_aiot_${i}`, name: `Bộ học tập AI - IoT #${i}`, type: 'AI - IoT', zone: 'yellow', status: 'available' });
    }
    // 7. Máy in 3D: 2 máy (red)
    for (let i = 1; i <= 2; i++) {
        list.push({ id: `dev_m3d_${i}`, name: `Máy in 3D #${i}`, type: 'Máy in 3D', zone: 'red', status: 'available' });
    }
    // 8. Máy Snapmaker Artisan 3 trong 1: 1 máy (red)
    list.push({ id: 'dev_sma_1', name: 'Máy Snapmaker Artisan #1', type: 'Snapmaker Artisan', zone: 'red', status: 'available' });
    
    // 9. Laptop: 10 cái (open)
    for (let i = 1; i <= 10; i++) {
        list.push({ id: `dev_lt_${i}`, name: `Laptop #${i}`, type: 'Laptop', zone: 'open', status: 'available' });
    }
    // 10. Dụng cụ, máy móc cầm tay: 15 bộ (yellow)
    for (let i = 1; i <= 15; i++) {
        list.push({ id: `dev_cc_${i}`, name: `Dụng cụ cầm tay #${i}`, type: 'Dụng cụ cầm tay', zone: 'yellow', status: 'available' });
    }
    
    return list;
}

// Initial Mock Bookings Data with Slot Numbering & Advanced Statuses
const MOCK_BOOKINGS = [
    {
        id: 'book_mock_1',
        team_name: 'VEX Team 12A1',
        representative: 'Nguyễn Văn A',
        zone: 'yellow',
        date: todayStr, // Current default day
        time_slot: '07:00-09:00',
        slot_number: 1,
        devices: ['Bộ học tập AI - IoT #1', 'Bộ học tập AI - IoT #2', 'Laptop #1'],
        device_requests: { 'AI - IoT': 2, 'Laptop': 1 },
        purpose: 'Thử nghiệm hệ thống nhận diện gương mặt thông minh',
        status: 'approved',
        role_creator: 'student',
        is_urgent: false,
        urgent_reason: '',
        is_overtime: false,
        error_report: null,
        teacher_evaluation: { status: 'tốt', notes: 'Nhóm làm việc tập trung, hoàn thành tốt mô hình', evaluated_at: new Date().toISOString() },
        created_at: new Date().toISOString(),
        rating: 5,
        review: 'Phòng sạch sẽ, thiết bị hoạt động rất mượt mà.'
    },
    {
        id: 'book_mock_2',
        team_name: 'Drone Team',
        representative: 'Trần Thị B',
        zone: 'red',
        date: todayStr,
        time_slot: '07:00-09:00',
        slot_number: 1,
        devices: ['Máy in 3D #1'],
        device_requests: { 'Máy in 3D #1': 1 },
        purpose: 'In 3D khung bảo vệ cánh quạt drone',
        status: 'approved',
        role_creator: 'student',
        is_urgent: false,
        urgent_reason: '',
        is_overtime: true, // Overtime active
        error_report: null,
        teacher_evaluation: null,
        created_at: new Date().toISOString(),
        rating: null,
        review: ''
    },
    {
        id: 'book_mock_3',
        team_name: 'IoT 12A2',
        representative: 'Lê Văn C',
        zone: 'yellow',
        date: todayStr,
        time_slot: '13:30-15:30',
        slot_number: 1,
        devices: ['Bộ học tập AI - IoT #3'],
        device_requests: { 'AI - IoT': 1 },
        purpose: 'Lập trình cảm biến nhiệt độ DHT11 hiển thị LCD',
        status: 'pending',
        role_creator: 'student',
        is_urgent: false,
        urgent_reason: '',
        is_overtime: false,
        error_report: null,
        teacher_evaluation: null,
        created_at: new Date().toISOString(),
        rating: null,
        review: ''
    },
    {
        id: 'book_mock_4',
        team_name: 'Smart Car 11A5',
        representative: 'Phạm Minh D',
        zone: 'yellow',
        date: todayStr,
        time_slot: '17:30-19:30',
        slot_number: 2, // Parallel booking in Yellow Zone!
        devices: ['Bộ học tập AI - IoT #4', 'Laptop #2'],
        device_requests: { 'AI - IoT': 1, 'Laptop': 1 },
        purpose: 'Lắp ráp xe tự hành dò đường cảm biến siêu âm',
        status: 'in_use',
        role_creator: 'student',
        is_urgent: false,
        urgent_reason: '',
        is_overtime: false,
        error_report: { type: 'device', description: 'Cảm biến siêu âm bị hỏng, cần hỗ trợ đổi cảm biến khác', reported_at: new Date().toISOString() }, // Error active
        teacher_evaluation: null,
        created_at: new Date().toISOString(),
        rating: null,
        review: ''
    },
    {
        id: 'book_mock_5',
        team_name: 'Thầy Hoàng (GV Vật lý)',
        representative: 'Nguyễn Văn Hoàng',
        zone: 'red',
        date: todayStr,
        time_slot: '09:00-11:00',
        slot_number: 1,
        devices: ['Máy Snapmaker Artisan #1'],
        device_requests: { 'Máy Snapmaker Artisan #1': 1 },
        purpose: 'Khắc CNC mô hình bài học Vật Lý cho lớp 10',
        status: 'approved',
        role_creator: 'teacher', // Teacher booking
        is_urgent: false,
        urgent_reason: '',
        is_overtime: false,
        error_report: null,
        teacher_evaluation: null,
        created_at: new Date().toISOString(),
        rating: null,
        review: ''
    }
];

const StorageEngine = {
    _bookingsCache: null,
    _devicesCache: null,

    init() {
        try {
            // Check if Bookings exists, if not, write mock data
            if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
                localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(MOCK_BOOKINGS));
            }
            // Check if Devices exists, if not, write mock data
            if (!localStorage.getItem(STORAGE_KEYS.DEVICES)) {
                localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(generateDefaultDevices()));
            }
            // Clear cache to ensure sync
            this._bookingsCache = null;
            this._devicesCache = null;
        } catch (e) {
            console.error('❌ Error initializing StorageEngine:', e);
        }
    },

    getApiUrl() {
        return localStorage.getItem(STORAGE_KEYS.API_URL) || '';
    },

    saveApiUrl(url) {
        localStorage.setItem(STORAGE_KEYS.API_URL, url);
    },

    getTelegramConfig() {
        return {
            token: localStorage.getItem(STORAGE_KEYS.TELEGRAM_TOKEN) || '',
            chatId: localStorage.getItem(STORAGE_KEYS.TELEGRAM_CHATID) || ''
        };
    },

    saveTelegramConfig(token, chatId) {
        localStorage.setItem(STORAGE_KEYS.TELEGRAM_TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.TELEGRAM_CHATID, chatId);
    },

    async syncToGoogleSheets(notificationMessage = null) {
        const url = this.getApiUrl();
        if (!url) return false;

        const payload = {
            action: 'sync',
            bookings: this.getBookings(),
            devices: this.getDevices()
        };

        const tg = this.getTelegramConfig();
        if (notificationMessage && tg.token && tg.chatId) {
            payload.notifyTelegram = true;
            payload.telegramToken = tg.token;
            payload.telegramChatId = tg.chatId;
            payload.notificationMessage = notificationMessage;
        }

        try {
            // Sử dụng content-type text/plain để tránh lỗi CORS Preflight
            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                }
            });
            const result = await response.json();
            console.log('🔄 Cloud Sync Result:', result);
            return result.success;
        } catch (e) {
            console.error('❌ Cloud Sync failed:', e);
            return false;
        }
    },

    async loadFromGoogleSheets() {
        const url = this.getApiUrl();
        if (!url) return { success: false, message: 'Chưa cấu hình API URL!' };

        try {
            const response = await fetch(`${url}?action=all`);
            const result = await response.json();
            if (result.success) {
                if (result.bookings) {
                    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(result.bookings));
                    this._bookingsCache = result.bookings;
                }
                if (result.devices) {
                    localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(result.devices));
                    this._devicesCache = result.devices;
                }
                return { success: true, message: 'Đồng bộ dữ liệu từ Google Sheets thành công!' };
            } else {
                return { success: false, message: result.message || 'Lỗi tải dữ liệu!' };
            }
        } catch (e) {
            console.error('❌ Load from Cloud failed:', e);
            return { success: false, message: 'Không thể kết nối đến Google Sheets: ' + e.message };
        }
    },

    getBookings() {
        if (this._bookingsCache !== null) {
            return this._bookingsCache;
        }
        try {
            const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
            this._bookingsCache = data ? JSON.parse(data) : [];
            return this._bookingsCache;
        } catch (e) {
            console.error('❌ Error getting bookings:', e);
            return [];
        }
    },

    saveBookings(bookings, notificationMessage = null) {
        try {
            localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
            this._bookingsCache = bookings;
            // Gọi sync ngầm
            this.syncToGoogleSheets(notificationMessage);
            return true;
        } catch (e) {
            console.error('❌ Error saving bookings:', e);
            return false;
        }
    },

    getDevices() {
        if (this._devicesCache !== null) {
            return this._devicesCache;
        }
        try {
            const data = localStorage.getItem(STORAGE_KEYS.DEVICES);
            this._devicesCache = data ? JSON.parse(data) : [];
            return this._devicesCache;
        } catch (e) {
            console.error('❌ Error getting devices:', e);
            return [];
        }
    },

    saveDevices(devices) {
        try {
            localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
            this._devicesCache = devices;
            // Gọi sync ngầm
            this.syncToGoogleSheets();
            return true;
        } catch (e) {
            console.error('❌ Error saving devices:', e);
            return false;
        }
    },

    reset() {
        try {
            localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
            localStorage.removeItem(STORAGE_KEYS.DEVICES);
            this._bookingsCache = null;
            this._devicesCache = null;
            this.init();
            // Đồng bộ reset lên đám mây
            this.syncToGoogleSheets("🧹 <b>Hệ thống đã được đặt lại dữ liệu gốc!</b>");
            return true;
        } catch (e) {
            console.error('❌ Error resetting storage:', e);
            return false;
        }
    }
};

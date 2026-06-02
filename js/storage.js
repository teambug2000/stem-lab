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

// Function to generate the default devices
function generateDefaultDevices() {
    const list = [];
    
    // 1. Kính hiển vi: 2 cái (science)
    for (let i = 1; i <= 2; i++) {
        list.push({ id: `dev_khv_${i}`, name: `Kính hiển vi #${i}`, type: 'Kính hiển vi', zone: 'science', status: 'available' });
    }
    // 2. Vex IQ: 7 bộ (robotics)
    for (let i = 1; i <= 7; i++) {
        list.push({ id: `dev_viq_${i}`, name: `Bộ Vex IQ #${i}`, type: 'Vex IQ', zone: 'robotics', status: 'available' });
    }
    // 3. Vex AIM: 4 bộ (robotics)
    for (let i = 1; i <= 4; i++) {
        list.push({ id: `dev_vaim_${i}`, name: `Bộ Vex AIM #${i}`, type: 'Vex AIM', zone: 'robotics', status: 'available' });
    }
    // 4. Vex V5: 3 bộ (robotics)
    for (let i = 1; i <= 3; i++) {
        list.push({ id: `dev_vv5_${i}`, name: `Bộ Vex V5 #${i}`, type: 'Vex V5', zone: 'robotics', status: 'available' });
    }
    // 5. KC BOT: 7 bộ (digital)
    for (let i = 1; i <= 7; i++) {
        list.push({ id: `dev_kcb_${i}`, name: `Bộ KC BOT #${i}`, type: 'KC BOT', zone: 'digital', status: 'available' });
    }
    // 6. Bộ học tập AI - IoT: 10 bộ (digital)
    for (let i = 1; i <= 10; i++) {
        list.push({ id: `dev_aiot_${i}`, name: `Bộ học tập AI - IoT #${i}`, type: 'AI - IoT', zone: 'digital', status: 'available' });
    }
    // 7. Máy in 3D: 2 máy (fablab)
    for (let i = 1; i <= 2; i++) {
        list.push({ id: `dev_m3d_${i}`, name: `Máy in 3D #${i}`, type: 'Máy in 3D', zone: 'fablab', status: 'available' });
    }
    // 8. Máy Snapmaker Artisan 3 trong 1: 1 máy (fablab)
    list.push({ id: 'dev_sma_1', name: 'Máy Snapmaker Artisan #1', type: 'Snapmaker Artisan', zone: 'fablab', status: 'available' });
    
    // 9. Laptop: 10 cái (digital)
    for (let i = 1; i <= 10; i++) {
        list.push({ id: `dev_lt_${i}`, name: `Laptop #${i}`, type: 'Laptop', zone: 'digital', status: 'available' });
    }
    // 10. Dụng cụ, máy móc cầm tay: 15 bộ (fablab)
    for (let i = 1; i <= 15; i++) {
        list.push({ id: `dev_cc_${i}`, name: `Dụng cụ cầm tay #${i}`, type: 'Dụng cụ cầm tay', zone: 'fablab', status: 'available' });
    }
    // 11. Bộ thí nghiệm Vật lý: 5 bộ (science)
    for (let i = 1; i <= 5; i++) {
        list.push({ id: `dev_phy_${i}`, name: `Bộ thí nghiệm Vật lý #${i}`, type: 'Bộ thí nghiệm Vật lý', zone: 'science', status: 'available' });
    }
    // 12. Bộ thí nghiệm Hóa học: 5 bộ (science)
    for (let i = 1; i <= 5; i++) {
        list.push({ id: `dev_che_${i}`, name: `Bộ thí nghiệm Hóa học #${i}`, type: 'Bộ thí nghiệm Hóa học', zone: 'science', status: 'available' });
    }
    
    return list;
}

// Initial Mock Bookings Data (Cleared)
const MOCK_BOOKINGS = [];

const StorageEngine = {
    _bookingsCache: null,
    _devicesCache: null,

    init() {
        try {
            // Load and migrate existing bookings if necessary
            let bookings = [];
            const bookingsData = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
            if (bookingsData) {
                try {
                    bookings = JSON.parse(bookingsData);
                    let migrated = false;
                    bookings.forEach(b => {
                        if (b.zone === 'green') { b.zone = 'fablab'; migrated = true; }
                        else if (b.zone === 'yellow') { b.zone = 'digital'; migrated = true; }
                        else if (b.zone === 'red') { b.zone = 'robotics'; migrated = true; }
                        else if (b.zone === 'open') { b.zone = 'science'; migrated = true; }
                    });
                    if (migrated) {
                        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
                    }
                } catch (e) {
                    console.error('Migration error:', e);
                }
            } else {
                localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(MOCK_BOOKINGS));
            }

            // Load and migrate existing devices if necessary, or seed if empty/outdated
            let devices = [];
            const devicesData = localStorage.getItem(STORAGE_KEYS.DEVICES);
            if (devicesData) {
                try {
                    devices = JSON.parse(devicesData);
                } catch (e) {}
            }
            
            const hasOldZones = devices.some(d => ['green', 'yellow', 'red', 'open'].includes(d.zone));
            if (!devicesData || !Array.isArray(devices) || devices.length === 0 || hasOldZones) {
                localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(generateDefaultDevices()));
                // Reset bookings to mock bookings to keep data consistent with new zones
                localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(MOCK_BOOKINGS));
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

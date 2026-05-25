/**
 * 🗄️ STORAGE ENGINE: stem-lab LocalStorage Manager
 */

const STORAGE_KEYS = {
    BOOKINGS: 'stem_lab_bookings',
    DEVICES: 'stem_lab_devices',
    PREFERENCES: 'stem_lab_preferences'
};

// Initial Mock Devices Data
const MOCK_DEVICES = [
    // Green Zone
    { id: 'dev_g1', name: 'Robot VEX IQ Kit 1', zone: 'green', status: 'available' },
    { id: 'dev_g2', name: 'Robot VEX IQ Kit 2', zone: 'green', status: 'available' },
    { id: 'dev_g3', name: 'Sa bàn thi đấu Robotics', zone: 'green', status: 'available' },
    
    // Yellow Zone
    { id: 'dev_y1', name: 'Kit Arduino Uno R3 Starter', zone: 'yellow', status: 'available' },
    { id: 'dev_y2', name: 'Máy đo dao động ký (Oscilloscope)', zone: 'yellow', status: 'available' },
    { id: 'dev_y3', name: 'Mỏ hàn nhiệt điện tử', zone: 'yellow', status: 'available' },
    
    // Red Zone
    { id: 'dev_r1', name: 'Máy in 3D Ender-3 Pro', zone: 'red', status: 'available' },
    { id: 'dev_r2', name: 'Bộ dụng cụ cơ khí cầm tay', zone: 'red', status: 'available' },
    { id: 'dev_r3', name: 'Vật liệu Maker (Gỗ, mica, foam)', zone: 'red', status: 'available' },
    
    // Open Lab
    { id: 'dev_o1', name: 'Máy tính xách tay cấu hình cao 1', zone: 'open', status: 'available' },
    { id: 'dev_o2', name: 'Kính thực tế ảo VR Oculus Quest', zone: 'open', status: 'available' }
];

// Initial Mock Bookings Data
const MOCK_BOOKINGS = [
    {
        id: 'book_mock_1',
        team_name: 'VEX Team 12A1',
        representative: 'Nguyễn Văn A',
        zone: 'green',
        date: '2026-05-26', // Current default day
        time_slot: '07:00-09:00',
        devices: ['Robot VEX IQ Kit 1'],
        purpose: 'Lắp ráp mô hình thi đấu giải Robotics Robocon sắp tới',
        status: 'approved',
        created_at: new Date('2026-05-25T08:00:00').toISOString(),
        rating: 5,
        review: 'Phòng sạch sẽ, robot hoạt động rất mượt mà.'
    },
    {
        id: 'book_mock_2',
        team_name: 'Drone Team',
        representative: 'Trần Thị B',
        zone: 'red',
        date: '2026-05-26',
        time_slot: '07:00-09:00',
        devices: ['Bộ dụng cụ cơ khí cầm tay'],
        purpose: 'Sửa cánh quạt drone',
        status: 'approved',
        created_at: new Date('2026-05-25T09:30:00').toISOString(),
        rating: null,
        review: ''
    },
    {
        id: 'book_mock_3',
        team_name: 'IoT 12A2',
        representative: 'Lê Văn C',
        zone: 'yellow',
        date: '2026-05-26',
        time_slot: '13:30-15:30',
        devices: ['Kit Arduino Uno R3 Starter'],
        purpose: 'Lập trình cảm biến nhiệt độ DHT11 hiển thị LCD',
        status: 'pending',
        created_at: new Date('2026-05-25T14:00:00').toISOString(),
        rating: null,
        review: ''
    },
    {
        id: 'book_mock_4',
        team_name: 'Smart Car 11A5',
        representative: 'Phạm Minh D',
        zone: 'yellow',
        date: '2026-05-26',
        time_slot: '17:30-19:30',
        devices: ['Kit Arduino Uno R3 Starter'],
        purpose: 'Lắp ráp xe tự hành dò đường',
        status: 'in_use',
        created_at: new Date('2026-05-25T16:45:00').toISOString(),
        rating: null,
        review: ''
    }
];

const StorageEngine = {
    init() {
        try {
            // Check if Bookings exists, if not, write mock data
            if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
                localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(MOCK_BOOKINGS));
            }
            // Check if Devices exists, if not, write mock data
            if (!localStorage.getItem(STORAGE_KEYS.DEVICES)) {
                localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(MOCK_DEVICES));
            }
            console.log('⚡ StorageEngine initialized successfully!');
        } catch (e) {
            console.error('❌ Error initializing StorageEngine:', e);
        }
    },

    getBookings() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('❌ Error getting bookings:', e);
            return [];
        }
    },

    saveBookings(bookings) {
        try {
            localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
            return true;
        } catch (e) {
            console.error('❌ Error saving bookings:', e);
            return false;
        }
    },

    getDevices() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.DEVICES);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('❌ Error getting devices:', e);
            return [];
        }
    },

    saveDevices(devices) {
        try {
            localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
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
            this.init();
            return true;
        } catch (e) {
            console.error('❌ Error resetting storage:', e);
            return false;
        }
    }
};

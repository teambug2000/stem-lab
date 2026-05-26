/**
 * 🗄️ STORAGE ENGINE: stem-lab LocalStorage Manager
 */

const STORAGE_KEYS = {
    BOOKINGS: 'stem_lab_bookings',
    DEVICES: 'stem_lab_devices',
    PREFERENCES: 'stem_lab_preferences'
};

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
        date: '2026-05-26', // Current default day
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
        teacher_evaluation: { status: 'tốt', notes: 'Nhóm làm việc tập trung, hoàn thành tốt mô hình', evaluated_at: '2026-05-26T09:15:00Z' },
        created_at: new Date('2026-05-25T08:00:00').toISOString(),
        rating: 5,
        review: 'Phòng sạch sẽ, thiết bị hoạt động rất mượt mà.'
    },
    {
        id: 'book_mock_2',
        team_name: 'Drone Team',
        representative: 'Trần Thị B',
        zone: 'red',
        date: '2026-05-26',
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
        slot_number: 2, // Parallel booking in Yellow Zone!
        devices: ['Bộ học tập AI - IoT #4', 'Laptop #2'],
        device_requests: { 'AI - IoT': 1, 'Laptop': 1 },
        purpose: 'Lắp ráp xe tự hành dò đường cảm biến siêu âm',
        status: 'in_use',
        role_creator: 'student',
        is_urgent: false,
        urgent_reason: '',
        is_overtime: false,
        error_report: { type: 'device', description: 'Cảm biến siêu âm bị hỏng, cần hỗ trợ đổi cảm biến khác', reported_at: '2026-05-26T18:00:00Z' }, // Error active
        teacher_evaluation: null,
        created_at: new Date('2026-05-25T16:45:00').toISOString(),
        rating: null,
        review: ''
    },
    {
        id: 'book_mock_5',
        team_name: 'Thầy Hoàng (GV Vật lý)',
        representative: 'Nguyễn Văn Hoàng',
        zone: 'red',
        date: '2026-05-26',
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
        created_at: new Date('2026-05-25T10:00:00').toISOString(),
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
                localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(generateDefaultDevices()));
            }
            console.log('⚡ StorageEngine initialized successfully with 61 devices!');
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

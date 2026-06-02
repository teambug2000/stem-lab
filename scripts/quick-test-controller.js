const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('🧪 Bắt đầu chạy Quick Test Script cho stem-lab...\n');

// 1. Giả lập LocalStorage
const localStorageMock = {
    store: {},
    getItem(key) { return this.store[key] || null; },
    setItem(key, value) { this.store[key] = String(value); },
    removeItem(key) { delete this.store[key]; },
    clear() { this.store = {}; }
};

// 2. Giả lập fetch
const fetchMock = async () => ({
    json: async () => ({ success: true })
});

// 3. Khởi tạo ngữ cảnh chạy VM
const context = {
    localStorage: localStorageMock,
    fetch: fetchMock,
    console: console,
    Date: Date,
    Math: Math,
    JSON: JSON,
    Array: Array,
    Object: Object,
    String: String,
    RegExp: RegExp,
    parseInt: parseInt,
    parseFloat: parseFloat,
    setTimeout: setTimeout,
    ZONES: {
        digital: { name: 'Digital & AI Lab' },
        fablab: { name: 'FabLab & Engineering' },
        robotics: { name: 'Robotics Arena' },
        science: { name: 'Science Discovery Lab' },
        classroom: { name: 'Lớp học' }
    }
};

vm.createContext(context);

// 4. Đọc và nạp mã nguồn vào VM
try {
    const storageCode = fs.readFileSync(path.join(__dirname, '../js/storage.js'), 'utf8');
    const controllerCode = fs.readFileSync(path.join(__dirname, '../js/controller.js'), 'utf8');
    
    vm.runInContext(storageCode, context);
    vm.runInContext(controllerCode, context);
} catch (e) {
    console.error('❌ Lỗi nạp mã nguồn:', e.message);
    process.exit(1);
}

// Lấy tham chiếu đến API và Engine
const { StorageEngine, StemLabAPI } = context;

// Bộ đếm kết quả
let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
        console.log(`  ✅ [PASS] ${message}`);
    } else {
        failed++;
        console.log(`  ❌ [FAIL] ${message}`);
    }
}

// --- BẮT ĐẦU CHẠY CÁC TEST CASES ---

// Test 1: Khởi tạo database mẫu
console.log('📦 Test Case 1: Khởi tạo dữ liệu mẫu');
StorageEngine.init();
const devices = StorageEngine.getDevices();
assert(devices.length === 71, `Kho thiết bị khởi tạo đủ 71 thiết bị (Thực tế: ${devices.length})`);
const bookings = StorageEngine.getBookings();
assert(bookings.length > 0, `Có dữ liệu lịch đặt mẫu khởi tạo (Số lượng: ${bookings.length})`);

// Test 2: Khóa lịch quá khứ
console.log('\n📅 Test Case 2: Khóa lịch đăng ký trong quá khứ');
const pastBooking = {
    id: 'test_past',
    team_name: 'Test Team',
    representative: 'Nguyễn Văn Test',
    zone: 'digital',
    date: '2020-01-01',
    time_slot: '07:00-09:00',
    slot_number: 1,
    device_requests: {},
    purpose: 'Test past date',
    role_creator: 'student',
    is_urgent: false
};
const resPast = StemLabAPI.validateBooking(pastBooking);
assert(resPast.valid === false, 'Hệ thống chặn thành công lịch đăng ký trong quá khứ');

// Test 3: Khóa đặt phòng trực tuyến FabLab đối với học sinh
console.log('\n🛠️ Test Case 3: Quyền đăng ký vùng FabLab & Engineering');
const fablabStudentBooking = {
    id: 'test_fablab_student',
    team_name: 'Test Team',
    representative: 'Nguyễn Văn Test',
    zone: 'fablab',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days in future
    time_slot: '09:00-11:00',
    slot_number: 1,
    device_requests: {},
    purpose: 'Test fablab',
    role_creator: 'student',
    is_urgent: false
};
const resFablabStudent = StemLabAPI.validateBooking(fablabStudentBooking);
assert(resFablabStudent.valid === false, 'Hệ thống chặn học sinh đặt lịch trực tuyến vùng FabLab');

const fablabTeacherBooking = {
    ...fablabStudentBooking,
    id: 'test_fablab_teacher',
    role_creator: 'teacher'
};
const resFablabTeacher = StemLabAPI.validateBooking(fablabTeacherBooking);
assert(resFablabTeacher.valid === true, 'Giáo viên được phép đặt lịch vùng FabLab');

// Test 4: Ràng buộc 24h và mượn GẤP
console.log('\n⚠️ Test Case 4: Quy tắc đặt phòng trước 24 giờ & đăng ký GẤP');
const urgentNoFlagBooking = {
    id: 'test_urgent_noflag',
    team_name: 'Test Team',
    representative: 'Nguyễn Văn Test',
    zone: 'digital',
    date: new Date().toISOString().split('T')[0], // Today
    time_slot: '17:30-19:30',
    slot_number: 1,
    device_requests: {},
    purpose: 'Test urgent',
    role_creator: 'student',
    is_urgent: false
};
const resUrgentNoFlag = StemLabAPI.validateBooking(urgentNoFlagBooking);
assert(resUrgentNoFlag.valid === false, 'Chặn thành công đăng ký dưới 24h không tích chọn GẤP');

const urgentWithFlagBooking = {
    ...urgentNoFlagBooking,
    id: 'test_urgent_flag',
    is_urgent: true,
    urgent_reason: 'Cần hoàn thành mô hình robot để nộp bài ngày mai'
};
const resUrgentWithFlag = StemLabAPI.validateBooking(urgentWithFlagBooking);
assert(resUrgentWithFlag.valid === true, 'Cho phép đặt lịch dưới 24h nếu có giải trình lý do GẤP');

// Test 5: Giới hạn quota (Tối đa 3 ca/tuần cho mỗi nhóm học sinh)
console.log('\n📊 Test Case 5: Định mức sử dụng (Quota tối đa 3 ca/tuần)');
// Xóa toàn bộ booking cũ để test sạch
localStorageMock.setItem('stem_lab_bookings', JSON.stringify([]));
StorageEngine._bookingsCache = null;

const futureDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]; // 2 ngày tới

// Tạo 3 booking thành công cùng 1 tuần
StemLabAPI.createBooking({
    team_name: 'VEX Team',
    representative: 'Học sinh A',
    zone: 'digital',
    date: futureDate,
    time_slot: '07:00-09:00',
    slot_number: 1,
    device_requests: {},
    purpose: 'Luyện tập',
    role_creator: 'student'
});
StemLabAPI.createBooking({
    team_name: 'VEX Team',
    representative: 'Học sinh A',
    zone: 'digital',
    date: futureDate,
    time_slot: '09:00-11:00',
    slot_number: 1,
    device_requests: {},
    purpose: 'Luyện tập',
    role_creator: 'student'
});
StemLabAPI.createBooking({
    team_name: 'VEX Team',
    representative: 'Học sinh A',
    zone: 'digital',
    date: futureDate,
    time_slot: '13:30-15:30',
    slot_number: 1,
    device_requests: {},
    purpose: 'Luyện tập',
    role_creator: 'student'
});

const bookingsList = StorageEngine.getBookings();
assert(bookingsList.length === 3, 'Đã tạo thành công 3 ca học trong tuần');

// Tạo ca thứ 4 (phải bị chặn)
const resQuota = StemLabAPI.createBooking({
    team_name: 'VEX Team',
    representative: 'Học sinh A',
    zone: 'digital',
    date: futureDate,
    time_slot: '15:30-17:30',
    slot_number: 1,
    device_requests: {},
    purpose: 'Luyện tập ca thứ 4',
    role_creator: 'student'
});
assert(resQuota.success === false, 'Hệ thống chặn thành công khi nhóm đặt ca thứ 4 trong tuần');

// Test 6: Kiểm tra số lượng thiết bị khả dụng
console.log('\n🛠️ Test Case 6: Kiểm tra số lượng bận/rảnh của thiết bị');
const stats = StemLabAPI.getAvailableDevicesCount(futureDate, '07:00-09:00');
assert(stats['AI - IoT'].available === 10, 'Thiết bị AI - IoT trống đủ 10 bộ lúc đầu ca');

// Đặt lịch mượn 3 bộ AI - IoT
StemLabAPI.createBooking({
    team_name: 'IoT Team',
    representative: 'Học sinh B',
    zone: 'digital',
    date: futureDate,
    time_slot: '07:00-09:00',
    slot_number: 2,
    device_requests: { 'AI - IoT': 3 },
    purpose: 'Lập trình cảm biến',
    role_creator: 'student'
});

const statsAfter = StemLabAPI.getAvailableDevicesCount(futureDate, '07:00-09:00');
assert(statsAfter['AI - IoT'].available === 7, `Sau khi mượn 3 bộ, số lượng còn lại chính xác là 7 (Thực tế: ${statsAfter['AI - IoT'].available})`);

// --- BÁO CÁO TỔNG KẾT ---
console.log('\n=======================================');
console.log('📊 BÁO CÁO KẾT QUẢ KIỂM THỬ:');
console.log(`  ✅ Đạt: ${passed} / ${passed + failed}`);
if (failed === 0) {
    console.log('  🎉 TẤT CẢ CÁC BÀI KIỂM THỬ ĐỀU THÀNH CÔNG! Logic hoạt động hoàn hảo.');
} else {
    console.log(`  ❌ Thất bại: ${failed} bài kiểm thử.`);
}
console.log('=======================================');

process.exit(failed > 0 ? 1 : 0);

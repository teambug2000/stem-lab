/**
 * ⚡ BUSINESS LOGIC ENGINE: stem-lab Controller
 */

// Helper to get ISO week number from a date string (YYYY-MM-DD)
function getWeekNumber(dateString) {
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                          - 3 + (week1.getDay() + 6) % 7) / 7);
}

function getWeekYear(dateString) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    return date.getFullYear();
}

const StemLabAPI = {
    // 1. Auto-reject expired bookings
    autoRejectExpiredBookings() {
        const bookings = StorageEngine.getBookings();
        const todayStr = new Date().toISOString().split('T')[0];
        let updated = false;

        bookings.forEach(b => {
            if (b.status === 'pending' && b.date < todayStr) {
                b.status = 'rejected';
                b.review = 'Hệ thống tự động từ chối do quá hạn duyệt.';
                updated = true;
            }
        });

        if (updated) {
            StorageEngine.saveBookings(bookings);
            console.log('🧹 Expired bookings clean-up complete.');
        }
    },

    // 2. Calculate Available Devices dynamically for a specific slot
    getAvailableDevicesCount(date, timeSlot) {
        const allDevices = StorageEngine.getDevices();
        const bookings = StorageEngine.getBookings().filter(b => 
            b.date === date && 
            b.time_slot === timeSlot && 
            b.status !== 'rejected'
        );

        // Map of device name to type
        const deviceMap = {};
        allDevices.forEach(d => {
            deviceMap[d.name] = d.type;
        });

        // Initialize counts
        const stats = {};
        allDevices.forEach(d => {
            if (!stats[d.type]) {
                stats[d.type] = { total: 0, busy: 0, available: 0, items: [] };
            }
            stats[d.type].total++;
            stats[d.type].items.push(d.name);
        });

        // Count busy devices from active bookings
        bookings.forEach(b => {
            b.devices.forEach(deviceName => {
                const type = deviceMap[deviceName];
                if (type && stats[type]) {
                    stats[type].busy++;
                }
            });
        });

        // Calculate available count
        Object.keys(stats).forEach(type => {
            stats[type].available = stats[type].total - stats[type].busy;
        });

        return stats;
    },

    // 3. Validation Logic
    validateBooking(newBooking) {
        const todayStr = new Date().toISOString().split('T')[0];

        // --- RULE 1: Past Dates Block (Khóa lịch quá khứ) ---
        if (newBooking.date < todayStr) {
            return { valid: false, message: 'Không thể tác động hoặc đăng ký lịch trong quá khứ!' };
        }

        // --- RULE 2: Green Zone Student Block (Khóa khu cơ khí) ---
        if (newBooking.zone === 'green' && newBooking.role_creator === 'student') {
            return { 
                valid: false, 
                message: 'Khu vực Cơ khí không hỗ trợ đăng ký trực tuyến cho học sinh (cần dùng thẻ vật lý và có giáo viên giám sát)!' 
            };
        }

        const bookings = StorageEngine.getBookings();

        // --- RULE 3: Slot-specific Double Booking (Trùng slot song song) ---
        const doubleBooking = bookings.find(b => 
            b.zone === newBooking.zone &&
            b.date === newBooking.date &&
            b.time_slot === newBooking.time_slot &&
            b.slot_number === newBooking.slot_number &&
            b.status !== 'rejected' &&
            b.id !== newBooking.id
        );

        if (doubleBooking) {
            return {
                valid: false,
                message: `Vị trí Slot ${newBooking.slot_number} tại khung giờ này đã bị đăng ký bởi nhóm "${doubleBooking.team_name}"!`
            };
        }

        // --- RULE 4: 24h Advance Warning & Urgent check ---
        const slotStartHour = newBooking.time_slot.split('-')[0];
        const reservationTime = new Date(`${newBooking.date}T${slotStartHour}:00`);
        const timeDiffHours = (reservationTime - new Date()) / (1000 * 60 * 60);

        if (timeDiffHours < 24 && newBooking.role_creator === 'student') {
            if (!newBooking.is_urgent) {
                return {
                    valid: false,
                    message: 'Đăng ký phải thực hiện trước 24 giờ để duyệt. Vui lòng tích chọn mục "Đăng ký GẤP" và giải trình lý do cấp bách để gửi!'
                };
            }
            if (!newBooking.urgent_reason || newBooking.urgent_reason.trim() === '') {
                return {
                    valid: false,
                    message: 'Vui lòng nhập lý do giải trình cho yêu cầu mượn GẤP!'
                };
            }
        }

        // --- RULE 5: Quota limit (Only for Students, Teachers bypass) ---
        if (newBooking.role_creator === 'student') {
            const newBookingWeek = getWeekNumber(newBooking.date);
            const newBookingYear = getWeekYear(newBooking.date);
            
            const activeTeamBookingsInWeek = bookings.filter(b => {
                if (b.status === 'rejected') return false;
                if (b.id === newBooking.id) return false;
                
                const bWeek = getWeekNumber(b.date);
                const bYear = getWeekYear(b.date);
                
                return b.team_name.toLowerCase().trim() === newBooking.team_name.toLowerCase().trim() &&
                       bWeek === newBookingWeek &&
                       bYear === newBookingYear;
            });

            if (activeTeamBookingsInWeek.length >= 3) {
                return {
                    valid: false,
                    message: `Nhóm "${newBooking.team_name}" đã sử dụng hết định mức đặt lịch trong tuần này (Đã đặt ${activeTeamBookingsInWeek.length} ca, tối đa 3 ca/tuần)!`
                };
            }
        }

        // --- RULE 6: Device availability check ---
        const availableStats = this.getAvailableDevicesCount(newBooking.date, newBooking.time_slot);
        let deviceError = null;

        Object.entries(newBooking.device_requests).forEach(([type, qtyRequested]) => {
            if (qtyRequested > 0) {
                const availableCount = availableStats[type] ? availableStats[type].available : 0;
                if (qtyRequested > availableCount) {
                    deviceError = `Thiết bị "${type}" hiện chỉ còn trống ${availableCount} bộ trong khung giờ này, không đủ đáp ứng số lượng ${qtyRequested} bộ yêu cầu!`;
                }
            }
        });

        if (deviceError) {
            return { valid: false, message: deviceError };
        }

        return { valid: true };
    },

    // 4. CRUD operations
    createBooking(bookingData) {
        const bookings = StorageEngine.getBookings();
        
        // Base struct
        const newBooking = {
            id: 'book_' + Date.now(),
            team_name: bookingData.team_name.trim(),
            representative: bookingData.representative.trim(),
            zone: bookingData.zone,
            date: bookingData.date,
            time_slot: bookingData.time_slot,
            slot_number: parseInt(bookingData.slot_number),
            device_requests: bookingData.device_requests || {},
            devices: [], // Assigned item names will go here
            purpose: bookingData.purpose.trim(),
            status: bookingData.role_creator === 'teacher' ? 'approved' : 'pending', // Teachers auto-approved
            role_creator: bookingData.role_creator || 'student',
            is_urgent: !!bookingData.is_urgent,
            urgent_reason: (bookingData.urgent_reason || '').trim(),
            is_overtime: false,
            error_report: null,
            teacher_evaluation: null,
            created_at: new Date().toISOString(),
            rating: null,
            review: ''
        };

        // Validate
        const validation = this.validateBooking(newBooking);
        if (!validation.valid) {
            return { success: false, message: validation.message };
        }

        // Allocate specific device serial names
        const availableStats = this.getAvailableDevicesCount(newBooking.date, newBooking.time_slot);
        const allocatedDeviceNames = [];

        Object.entries(newBooking.device_requests).forEach(([type, qtyRequested]) => {
            if (qtyRequested > 0 && availableStats[type]) {
                // Find all items of this type currently busy in this slot
                const busyInSlot = [];
                bookings.forEach(b => {
                    if (b.date === newBooking.date && b.time_slot === newBooking.time_slot && b.status !== 'rejected') {
                        b.devices.forEach(dName => {
                            busyInSlot.push(dName);
                        });
                    }
                });

                // Pick first available items
                let count = 0;
                availableStats[type].items.forEach(itemName => {
                    if (count < qtyRequested && !busyInSlot.includes(itemName)) {
                        allocatedDeviceNames.push(itemName);
                        count++;
                    }
                });
            }
        });

        newBooking.devices = allocatedDeviceNames;

        bookings.push(newBooking);
        const saved = StorageEngine.saveBookings(bookings);
        
        return { success: saved, booking: newBooking };
    },

    updateBookingStatus(id, newStatus) {
        const bookings = StorageEngine.getBookings();
        const index = bookings.findIndex(b => b.id === id);
        
        if (index === -1) {
            return { success: false, message: 'Không tìm thấy thông tin đăng ký!' };
        }

        bookings[index].status = newStatus;
        
        // Update device status globally
        const devices = StorageEngine.getDevices();
        const bookingDevices = bookings[index].devices;
        
        if (newStatus === 'in_use') {
            devices.forEach(d => {
                if (bookingDevices.includes(d.name)) {
                    d.status = 'in_use';
                }
            });
        } else if (newStatus === 'completed' || newStatus === 'rejected') {
            devices.forEach(d => {
                if (bookingDevices.includes(d.name)) {
                    d.status = 'available';
                }
            });
        }

        StorageEngine.saveDevices(devices);
        const saved = StorageEngine.saveBookings(bookings);
        
        return { success: saved, booking: bookings[index] };
    },

    // Report Error or Project Overtime status
    reportIssue(id, issueType, description) {
        const bookings = StorageEngine.getBookings();
        const index = bookings.findIndex(b => b.id === id);
        
        if (index === -1) {
            return { success: false, message: 'Không tìm thấy ca học!' };
        }

        bookings[index].error_report = {
            type: issueType, // 'device' or 'project'
            description: description.trim(),
            reported_at: new Date().toISOString()
        };

        const saved = StorageEngine.saveBookings(bookings);
        return { success: saved, booking: bookings[index] };
    },

    extendBooking(id) {
        const bookings = StorageEngine.getBookings();
        const index = bookings.findIndex(b => b.id === id);
        
        if (index === -1) {
            return { success: false, message: 'Không tìm thấy ca học!' };
        }

        bookings[index].is_overtime = true;

        const saved = StorageEngine.saveBookings(bookings);
        return { success: saved, booking: bookings[index] };
    },

    // Teacher Evaluation for Group
    submitTeacherEvaluation(id, status, notes) {
        const bookings = StorageEngine.getBookings();
        const index = bookings.findIndex(b => b.id === id);
        
        if (index === -1) {
            return { success: false, message: 'Không tìm thấy ca học!' };
        }

        bookings[index].teacher_evaluation = {
            status: status, // 'tốt' | 'đạt' | 'chưa đạt'
            notes: notes.trim(),
            evaluated_at: new Date().toISOString()
        };

        const saved = StorageEngine.saveBookings(bookings);
        return { success: saved, booking: bookings[index] };
    },

    // 5. Stats and Reports Calculation
    getWeeklyFrequencyData() {
        const bookings = StorageEngine.getBookings();
        const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        const frequencies = [0, 0, 0, 0, 0, 0, 0];

        bookings.forEach(b => {
            if (b.status === 'rejected') return;
            const bDate = new Date(b.date);
            let dayIndex = bDate.getDay() - 1; // Mon = 0, Sun = 6
            if (dayIndex === -1) dayIndex = 6;
            
            if (dayIndex >= 0 && dayIndex < 7) {
                frequencies[dayIndex]++;
            }
        });

        return { labels: weekDays, data: frequencies };
    },

    getZoneDistributionData() {
        const bookings = StorageEngine.getBookings().filter(b => b.status !== 'rejected');
        const zones = { yellow: 0, red: 0, open: 0 };
        
        bookings.forEach(b => {
            if (zones[b.zone] !== undefined) {
                zones[b.zone]++;
            }
        });

        return {
            labels: ['Yellow (Điện)', 'Red (Maker)', 'Open Lab'],
            data: [zones.yellow, zones.red, zones.open]
        };
    },

    getTopTeamsData() {
        const bookings = StorageEngine.getBookings().filter(b => b.status !== 'rejected');
        const teamCounts = {};

        bookings.forEach(b => {
            teamCounts[b.team_name] = (teamCounts[b.team_name] || 0) + 1;
        });

        return Object.entries(teamCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }
};

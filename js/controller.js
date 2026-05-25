/**
 * ⚡ BUSINESS LOGIC ENGINE: stem-lab Controller
 */

// Helper to get ISO week number from a date string (YYYY-MM-DD)
function getWeekNumber(dateString) {
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    const week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                          - 3 + (week1.getDay() + 6) % 7) / 7);
}

// Get the year of the ISO week
function getWeekYear(dateString) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    return date.getFullYear();
}

const StemLabAPI = {
    // 1. Validation Logic
    validateBooking(newBooking) {
        const bookings = StorageEngine.getBookings();
        
        // --- RULE 1: Double Booking (Check trùng lịch) ---
        // Không được phép đặt trùng cùng Zone, cùng Ngày, cùng Khung giờ
        const doubleBooking = bookings.find(b => 
            b.zone === newBooking.zone &&
            b.date === newBooking.date &&
            b.time_slot === newBooking.time_slot &&
            b.status !== 'rejected' &&
            b.id !== newBooking.id
        );

        if (doubleBooking) {
            return {
                valid: false,
                message: `Khung giờ này đã được đăng ký sử dụng bởi nhóm "${doubleBooking.team_name}" (${doubleBooking.status === 'pending' ? 'Đang chờ duyệt' : 'Đã duyệt'})!`
            };
        }

        // --- RULE 2: Quota Limits (Check định mức ca học) ---
        // Mỗi nhóm chỉ được đặt tối đa 3 ca trong 1 tuần (Chỉ đếm các ca hợp lệ, không tính rejected)
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

        return { valid: true };
    },

    // 2. CRUD Bookings
    createBooking(bookingData) {
        const bookings = StorageEngine.getBookings();
        
        const newBooking = {
            id: 'book_' + Date.now(),
            team_name: bookingData.team_name.trim(),
            representative: bookingData.representative.trim(),
            zone: bookingData.zone,
            date: bookingData.date,
            time_slot: bookingData.time_slot,
            devices: bookingData.devices || [],
            purpose: bookingData.purpose.trim(),
            status: 'pending', // Default status is pending approval
            created_at: new Date().toISOString(),
            rating: null,
            review: ''
        };

        // Validate first
        const validation = this.validateBooking(newBooking);
        if (!validation.valid) {
            return { success: false, message: validation.message };
        }

        bookings.push(newBooking);
        const saved = StorageEngine.saveBookings(bookings);
        
        // Update device statuses to in_use (simulated) if status is approved immediately
        if (saved) {
            return { success: true, booking: newBooking };
        } else {
            return { success: false, message: 'Lỗi hệ thống khi lưu trữ dữ liệu!' };
        }
    },

    updateBookingStatus(id, newStatus) {
        const bookings = StorageEngine.getBookings();
        const index = bookings.findIndex(b => b.id === id);
        
        if (index === -1) {
            return { success: false, message: 'Không tìm thấy thông tin đăng ký!' };
        }

        bookings[index].status = newStatus;
        
        // Update device status accordingly
        const devices = StorageEngine.getDevices();
        const bookingDevices = bookings[index].devices;
        
        if (newStatus === 'in_use') {
            // Mark devices used in this booking as occupied
            devices.forEach(d => {
                if (bookingDevices.includes(d.name)) {
                    d.status = 'in_use';
                }
            });
        } else if (newStatus === 'completed' || newStatus === 'rejected') {
            // Free devices
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

    submitReview(id, rating, reviewText) {
        const bookings = StorageEngine.getBookings();
        const index = bookings.findIndex(b => b.id === id);
        
        if (index === -1) {
            return { success: false, message: 'Không tìm thấy thông tin đăng ký!' };
        }

        bookings[index].rating = parseInt(rating);
        bookings[index].review = reviewText.trim();

        const saved = StorageEngine.saveBookings(bookings);
        return { success: saved, booking: bookings[index] };
    },

    // 3. Stats and Reports Calculation
    getWeeklyFrequencyData(weekOffset = 0) {
        // Mock data logic for daily activity in current week
        const bookings = StorageEngine.getBookings();
        const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        const frequencies = [0, 0, 0, 0, 0, 0, 0];

        // Let's count completed, approved and in_use bookings
        bookings.forEach(b => {
            if (b.status === 'rejected') return;
            const bDate = new Date(b.date);
            let dayIndex = bDate.getDay() - 1; // Mon = 0, Sun = 6
            if (dayIndex === -1) dayIndex = 6; // Sunday fix
            
            if (dayIndex >= 0 && dayIndex < 7) {
                frequencies[dayIndex]++;
            }
        });

        return { labels: weekDays, data: frequencies };
    },

    getZoneDistributionData() {
        const bookings = StorageEngine.getBookings().filter(b => b.status !== 'rejected');
        const zones = { green: 0, yellow: 0, red: 0, open: 0 };
        
        bookings.forEach(b => {
            if (zones[b.zone] !== undefined) {
                zones[b.zone]++;
            }
        });

        return {
            labels: ['Green (Robot)', 'Yellow (Điện)', 'Red (Maker)', 'Open Lab'],
            data: [zones.green, zones.yellow, zones.red, zones.open]
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

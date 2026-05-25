/**
 * 🖥️ UI ENGINE: stem-lab DOM Render & Interaction Manager
 */

// Time slots & Zones configurations
const TIME_SLOTS = [
    '07:00-09:00',
    '09:00-11:00',
    '13:30-15:30',
    '15:30-17:30',
    '17:30-19:30'
];

const ZONES = {
    green: { name: 'Green Zone', icon: 'fa-solid fa-robot', desc: 'Robot & Cơ khí' },
    yellow: { name: 'Yellow Zone', icon: 'fa-solid fa-bolt', desc: 'Điện - Điện tử' },
    red: { name: 'Red Zone', icon: 'fa-solid fa-cubes', desc: 'STEM Maker' },
    open: { name: 'Open Lab', icon: 'fa-solid fa-border-all', desc: 'Không gian mở' }
};

// State variables
let currentDate = '2026-05-26'; // Selected date (Default matches mock data)
let activeRole = 'student'; // Current active role
let barChart = null;
let pieChart = null;

const UIEngine = {
    init() {
        this.setupEventListeners();
        this.renderAll();
    },

    setupEventListeners() {
        // Role select event
        document.getElementById('role-select').addEventListener('change', (e) => {
            activeRole = e.target.value;
            this.switchRoleView(activeRole);
        });

        // Prev/Next day buttons
        document.getElementById('prev-day').addEventListener('click', () => {
            this.changeDate(-1);
        });
        document.getElementById('next-day').addEventListener('click', () => {
            this.changeDate(1);
        });

        // Booking Modal closures
        document.getElementById('close-booking-modal').addEventListener('click', () => this.hideBookingModal());
        document.getElementById('btn-cancel-booking').addEventListener('click', () => this.hideBookingModal());
        
        // Form submit handlers
        document.getElementById('booking-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBookingSubmit();
        });

        document.getElementById('evaluation-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEvaluationSubmit();
        });

        document.getElementById('close-evaluation-modal').addEventListener('click', () => this.hideEvaluationModal());

        // Simulated QR scan click
        document.getElementById('btn-qr-simulate').addEventListener('click', () => {
            this.simulateQRScan();
        });

        // Setup star rating stars interaction
        const stars = document.querySelectorAll('.star-rating i');
        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                const val = e.target.getAttribute('data-value');
                document.getElementById('input-rating').value = val;
                this.updateStarRatingDisplay(val);
            });
        });
    },

    renderAll() {
        document.getElementById('current-date-display').innerText = this.formatDateDisplay(currentDate);
        this.renderCalendarGrid();
        
        if (activeRole === 'assistant') {
            this.renderLADashboard();
        } else if (activeRole === 'teacher') {
            this.renderTeacherDashboard();
        }
    },

    // --- ROLE VIEW SWITCHER ---
    switchRoleView(role) {
        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`${role}-view`).classList.add('active');
        
        this.renderAll();
    },

    // --- DATE CONVERTERS ---
    formatDateDisplay(dateStr) {
        const date = new Date(dateStr);
        const options = { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' };
        return date.toLocaleDateString('vi-VN', options);
    },

    changeDate(days) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() + days);
        currentDate = date.toISOString().split('T')[0];
        this.renderAll();
    },

    // --- 1. RENDER CALENDAR GRID (Student View) ---
    renderCalendarGrid() {
        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';

        // Render Headers (Top Row)
        // 1st cell is empty space (above time headers)
        const emptyHeader = document.createElement('div');
        emptyHeader.className = 'grid-header';
        emptyHeader.innerHTML = '🕒 Khung ca';
        grid.appendChild(emptyHeader);

        // Render Zone Columns Headers
        Object.entries(ZONES).forEach(([key, zone]) => {
            const h = document.createElement('div');
            h.className = `grid-header ${key}-header`;
            h.innerHTML = `<i class="${zone.icon}"></i> ${zone.name} <span>(${zone.desc})</span>`;
            grid.appendChild(h);
        });

        // Get all bookings for current date
        const bookings = StorageEngine.getBookings().filter(b => b.date === currentDate);

        // Render Cells Row by Row
        TIME_SLOTS.forEach(slot => {
            // First cell in row: Time Slot info
            const timeCell = document.createElement('div');
            timeCell.className = 'time-col-header';
            timeCell.innerHTML = `${slot.split('-')[0]} <span>đến ${slot.split('-')[1]}</span>`;
            grid.appendChild(timeCell);

            // Render Zone Cells for this slot
            Object.keys(ZONES).forEach(zoneKey => {
                const cell = document.createElement('div');
                
                // Find if there's a booking in this slot + zone
                const booking = bookings.find(b => b.zone === zoneKey && b.time_slot === slot && b.status !== 'rejected');

                if (!booking) {
                    // Vacant slot
                    cell.className = 'grid-cell vacant';
                    cell.innerHTML = `<i class="fa-solid fa-circle-plus"></i> Trống<span style="font-size: 10px; opacity:0.6;">(Click đặt)</span>`;
                    cell.addEventListener('click', () => this.showBookingModal(zoneKey, slot));
                } else {
                    // Booked slot
                    cell.className = `grid-cell booked status-${booking.status}`;
                    
                    let statusLabel = '';
                    switch(booking.status) {
                        case 'pending': statusLabel = 'Chờ duyệt'; break;
                        case 'approved': statusLabel = 'Đã duyệt'; break;
                        case 'in_use': statusLabel = 'Đang dùng'; break;
                        case 'completed': statusLabel = 'Hoàn thành'; break;
                    }

                    cell.innerHTML = `
                        <div class="cell-team">${booking.team_name}</div>
                        <div class="cell-rep"><i class="fa-regular fa-user"></i> ${booking.representative}</div>
                        <span class="cell-status-badge">${statusLabel}</span>
                    `;

                    // If completed and rating is empty (simulating student returning to leave feedback)
                    if (booking.status === 'completed' && booking.rating === null && activeRole === 'student') {
                        cell.style.cursor = 'pointer';
                        cell.addEventListener('click', () => this.showEvaluationModal(booking.id));
                    }
                }
                grid.appendChild(cell);
            });
        });
    },

    // --- 2. BOOKING FORM MODAL ---
    showBookingModal(zone, slot) {
        // Pre-populate read-only details
        document.getElementById('form-zone').value = zone;
        document.getElementById('form-timeslot').value = slot;
        document.getElementById('form-date').value = currentDate;

        document.getElementById('display-zone').innerText = ZONES[zone].name;
        document.getElementById('display-zone').className = `info-badge ${zone}-badge`;
        document.getElementById('display-timeslot').innerText = slot;

        // Populate devices checkbox based on zone
        const devices = StorageEngine.getDevices().filter(d => d.zone === zone && d.status === 'available');
        const checklist = document.getElementById('devices-checklist');
        checklist.innerHTML = '';

        if (devices.length === 0) {
            checklist.innerHTML = `<span style="font-size:12px; color:var(--text-muted);">Không có thiết bị trống hỗ trợ cho Zone này</span>`;
        } else {
            devices.forEach(d => {
                const label = document.createElement('label');
                label.className = 'device-checkbox-label';
                label.innerHTML = `<input type="checkbox" name="devices" value="${d.name}"> ${d.name}`;
                checklist.appendChild(label);
            });
        }

        // Show modal container
        document.getElementById('booking-modal').classList.add('active');
    },

    hideBookingModal() {
        document.getElementById('booking-modal').classList.remove('active');
        document.getElementById('booking-form').reset();
    },

    handleBookingSubmit() {
        const zone = document.getElementById('form-zone').value;
        const time_slot = document.getElementById('form-timeslot').value;
        const date = document.getElementById('form-date').value;
        
        const team_name = document.getElementById('input-team').value;
        const representative = document.getElementById('input-representative').value;
        const purpose = document.getElementById('input-purpose').value;
        
        // Gather checked devices
        const checkedDevices = [];
        document.querySelectorAll('input[name="devices"]:checked').forEach(cb => {
            checkedDevices.push(cb.value);
        });

        const result = StemLabAPI.createBooking({
            team_name,
            representative,
            zone,
            date,
            time_slot,
            devices: checkedDevices,
            purpose
        });

        if (result.success) {
            alert(`🎉 Gửi yêu cầu đăng ký phòng STEM thành công! Ca học đang chờ Lab Assistant duyệt.`);
            this.hideBookingModal();
            this.renderAll();
        } else {
            alert(`❌ Không thể đăng ký:\n${result.message}`);
        }
    },

    // --- 3. EVALUATION MODAL ---
    showEvaluationModal(bookingId) {
        document.getElementById('eval-booking-id').value = bookingId;
        this.updateStarRatingDisplay(5); // Default 5 stars
        document.getElementById('input-rating').value = 5;
        document.getElementById('input-review').value = '';
        document.getElementById('evaluation-modal').classList.add('active');
    },

    hideEvaluationModal() {
        document.getElementById('evaluation-modal').classList.remove('active');
    },

    updateStarRatingDisplay(val) {
        const stars = document.querySelectorAll('.star-rating i');
        stars.forEach((star, index) => {
            if (index < val) {
                star.className = 'fa-solid fa-star';
            } else {
                star.className = 'fa-regular fa-star';
            }
        });
    },

    handleEvaluationSubmit() {
        const id = document.getElementById('eval-booking-id').value;
        const rating = document.getElementById('input-rating').value;
        const reviewText = document.getElementById('input-review').value;

        const result = StemLabAPI.submitReview(id, rating, reviewText);

        if (result.success) {
            alert('💖 Cảm ơn bạn đã gửi đánh giá trải nghiệm!');
            this.hideEvaluationModal();
            this.renderAll();
        } else {
            alert('❌ Có lỗi xảy ra khi lưu đánh giá!');
        }
    },

    // --- 4. RENDER LAB ASSISTANT VIEW ---
    renderLADashboard() {
        const laContainer = document.getElementById('la-dashboard-content');
        laContainer.innerHTML = '';

        // Create 2-column structure
        const laGrid = document.createElement('div');
        laGrid.className = 'dashboard-grid';

        // Column 1: Bookings Management
        const bookingsCol = document.createElement('div');
        bookingsCol.className = 'panel-card';
        
        // Query active requests
        const bookings = StorageEngine.getBookings().sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        const pendingBookings = bookings.filter(b => b.status === 'pending');
        const approvedBookings = bookings.filter(b => b.status === 'approved');
        const activeBookings = bookings.filter(b => b.status === 'in_use');
        const historyBookings = bookings.filter(b => b.status === 'completed' || b.status === 'rejected');

        bookingsCol.innerHTML = `
            <div class="panel-header">
                <h3><i class="fa-solid fa-clipboard-list"></i> Danh Sách Lịch Đăng Ký</h3>
                <span class="info-badge">${pendingBookings.length} chờ duyệt</span>
            </div>
            
            <div class="la-booking-list">
                ${bookings.length === 0 ? '<p style="text-align:center; padding:20px; color:var(--text-muted);">Chưa có yêu cầu đặt lịch nào.</p>' : ''}
                
                ${bookings.map(b => {
                    let statusText = '';
                    let actionButtons = '';
                    
                    if (b.status === 'pending') {
                        statusText = '<span class="cell-status-badge">Đang chờ duyệt</span>';
                        actionButtons = `
                            <button class="btn btn-success btn-sm" onclick="LA_Action.approve('${b.id}')"><i class="fa-solid fa-check"></i> Duyệt</button>
                            <button class="btn btn-danger btn-sm" onclick="LA_Action.reject('${b.id}')"><i class="fa-solid fa-xmark"></i> Từ chối</button>
                        `;
                    } else if (b.status === 'approved') {
                        statusText = '<span class="cell-status-badge">Đã duyệt</span>';
                        actionButtons = `
                            <button class="btn btn-primary btn-sm" onclick="LA_Action.handover('${b.id}')"><i class="fa-solid fa-key"></i> Bàn giao phòng</button>
                        `;
                    } else if (b.status === 'in_use') {
                        statusText = '<span class="cell-status-badge">Đang sử dụng</span>';
                        actionButtons = `
                            <button class="btn btn-secondary btn-sm" onclick="LA_Action.complete('${b.id}')"><i class="fa-solid fa-circle-check"></i> Hoàn thành ca</button>
                        `;
                    } else if (b.status === 'completed') {
                        statusText = `<span class="cell-status-badge">Hoàn thành ${b.rating ? '★'.repeat(b.rating) : '(Chưa đánh giá)'}</span>`;
                    } else if (b.status === 'rejected') {
                        statusText = '<span class="cell-status-badge">Bị từ chối</span>';
                    }

                    return `
                        <div class="la-booking-item">
                            <div class="la-booking-details">
                                <div class="la-booking-title">${b.team_name} <span style="font-weight:400; font-size:12px; color:var(--text-muted);">(${ZONES[b.zone].name})</span></div>
                                <div class="la-booking-meta">
                                    <span><i class="fa-regular fa-user"></i> ${b.representative}</span>
                                    <span><i class="fa-regular fa-calendar"></i> ${b.date}</span>
                                    <span><i class="fa-regular fa-clock"></i> ${b.time_slot}</span>
                                    ${b.devices.length > 0 ? `<span><i class="fa-solid fa-microchip"></i> ${b.devices.join(', ')}</span>` : ''}
                                </div>
                                <div style="font-size:12px; margin-top:4px; color:var(--text-secondary);">Mục đích: ${b.purpose}</div>
                                ${b.review ? `<div style="font-size:11px; margin-top:4px; color:var(--zone-yellow); font-style:italic;">Phản hồi: "${b.review}"</div>` : ''}
                            </div>
                            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                                ${statusText}
                                <div class="la-booking-actions">
                                    ${actionButtons}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Column 2: Device Management & Fast Actions
        const sidebarCol = document.createElement('div');
        sidebarCol.className = 'panel-card';

        const devices = StorageEngine.getDevices();

        sidebarCol.innerHTML = `
            <div class="panel-header">
                <h3><i class="fa-solid fa-screwdriver-wrench"></i> Trạng Thái Thiết Bị</h3>
            </div>
            <div class="devices-list">
                ${devices.map(d => `
                    <div class="device-item">
                        <div>
                            <div style="font-weight:600;">${d.name}</div>
                            <div style="font-size:11px; color:var(--text-muted);">${ZONES[d.zone].name}</div>
                        </div>
                        <span class="device-badge ${d.status}">${d.status === 'available' ? 'Trống' : 'Đang bận'}</span>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:20px; border-top:1px solid rgba(255,255,255,0.05); padding-top:16px;">
                <button class="btn btn-secondary btn-block" onclick="LA_Action.resetStorage()"><i class="fa-solid fa-trash-can"></i> Reset Dữ Liệu Demo</button>
            </div>
        `;

        laGrid.appendChild(bookingsCol);
        laGrid.appendChild(sidebarCol);
        laContainer.appendChild(laGrid);
    },

    // --- 5. RENDER TEACHER DASHBOARD VIEW (With Chart.js) ---
    renderTeacherDashboard() {
        const teacherContainer = document.getElementById('teacher-dashboard-content');
        teacherContainer.innerHTML = '';

        const grid = document.createElement('div');
        grid.className = 'teacher-grid';

        // 1. Weekly Frequencies Chart Card
        const chartCard1 = document.createElement('div');
        chartCard1.className = 'panel-card';
        chartCard1.innerHTML = `
            <div class="panel-header">
                <h3><i class="fa-solid fa-chart-bar"></i> Tần Suất Đặt Lịch Trong Tuần</h3>
            </div>
            <div class="chart-container">
                <canvas id="weekly-chart"></canvas>
            </div>
        `;

        // 2. Zone Distribution Chart Card
        const chartCard2 = document.createElement('div');
        chartCard2.className = 'panel-card';
        chartCard2.innerHTML = `
            <div class="panel-header">
                <h3><i class="fa-solid fa-chart-pie"></i> Phân Bổ Sử Dụng Theo Zone</h3>
            </div>
            <div class="chart-container">
                <canvas id="zone-chart"></canvas>
            </div>
        `;

        // 3. Top Teams Table Card
        const tableCard = document.createElement('div');
        tableCard.className = 'panel-card';
        
        const topTeams = StemLabAPI.getTopTeamsData();

        tableCard.innerHTML = `
            <div class="panel-header">
                <h3><i class="fa-solid fa-trophy"></i> Top 5 Nhóm Sử Dụng Nhiều Nhất</h3>
            </div>
            <div class="table-wrapper">
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>Hạng</th>
                            <th>Tên Nhóm</th>
                            <th>Số ca sử dụng</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topTeams.length === 0 ? '<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">Chưa có dữ liệu thống kê.</td></tr>' : ''}
                        ${topTeams.map((team, idx) => `
                            <tr>
                                <td style="font-weight:700; color:var(--zone-yellow);">${idx + 1}</td>
                                <td style="font-weight:600;">${team.name}</td>
                                <td><span class="info-badge" style="padding:2px 8px;">${team.count} ca</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // 4. Feedbacks List Card
        const feedbackCard = document.createElement('div');
        feedbackCard.className = 'panel-card';

        const reviews = StorageEngine.getBookings().filter(b => b.rating !== null);

        feedbackCard.innerHTML = `
            <div class="panel-header">
                <h3><i class="fa-regular fa-comment-dots"></i> Ý Kiến Phản Hồi Từ Học Sinh</h3>
            </div>
            <div class="la-booking-list" style="max-height:220px;">
                ${reviews.length === 0 ? '<p style="text-align:center; color:var(--text-muted); padding:20px;">Chưa có phản hồi hay đánh giá nào.</p>' : ''}
                ${reviews.map(r => `
                    <div style="background:rgba(255,255,255,0.015); border:1px solid var(--border-color); border-radius:8px; padding:10px 14px; margin-bottom:8px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <strong style="font-size:13px;">${r.team_name}</strong>
                            <span style="color:#ffd700; font-size:12px;">${'★'.repeat(r.rating)}</span>
                        </div>
                        <p style="font-size:12px; color:var(--text-secondary); font-style:italic;">"${r.review}"</p>
                    </div>
                `).join('')}
            </div>
        `;

        grid.appendChild(chartCard1);
        grid.appendChild(chartCard2);
        grid.appendChild(tableCard);
        grid.appendChild(feedbackCard);
        
        teacherContainer.appendChild(grid);

        // Render Chart JS
        setTimeout(() => {
            this.buildCharts();
        }, 100);
    },

    buildCharts() {
        // Destroy existing instances if any to prevent bugs
        if (barChart) barChart.destroy();
        if (pieChart) pieChart.destroy();

        // 1. Build Bar Chart
        const weeklyData = StemLabAPI.getWeeklyFrequencyData();
        const ctxBar = document.getElementById('weekly-chart').getContext('2d');
        barChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: weeklyData.labels,
                datasets: [{
                    label: 'Số ca đặt',
                    data: weeklyData.data,
                    backgroundColor: 'rgba(99, 102, 241, 0.65)',
                    borderColor: '#6366f1',
                    borderWidth: 1.5,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, color: '#94a3b8' },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                    }
                }
            }
        });

        // 2. Build Pie Chart
        const distributionData = StemLabAPI.getZoneDistributionData();
        const ctxPie = document.getElementById('zone-chart').getContext('2d');
        pieChart = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: distributionData.labels,
                datasets: [{
                    data: distributionData.data,
                    backgroundColor: [
                        '#10b981', // green
                        '#f59e0b', // yellow
                        '#ef4444', // red
                        '#3b82f6'  // open lab
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#f8fafc', font: { family: 'Outfit' } }
                    }
                },
                cutout: '65%'
            }
        });
    },

    // --- 6. SIMULATED QR CODE SCANNER ---
    simulateQRScan() {
        const slotsStr = TIME_SLOTS.map((s, idx) => `${idx + 1}. Ca ${s}`).join('\n');
        const zonesKeys = Object.keys(ZONES);
        const zonesStr = zonesKeys.map((k, idx) => `${idx + 1}. ${ZONES[k].name}`).join('\n');

        const zoneChoice = prompt(`🤖 Giả lập quét mã QR tại cửa phòng Lab!\n\nChọn khu vực (Zone) cần đặt (1-4):\n${zonesStr}`, '1');
        if (!zoneChoice) return;

        const zoneIdx = parseInt(zoneChoice) - 1;
        if (zoneIdx < 0 || zoneIdx >= zonesKeys.length) {
            alert('Lựa chọn không hợp lệ!');
            return;
        }

        const slotChoice = prompt(`Chọn ca học cần đặt (1-5):\n${slotsStr}`, '1');
        if (!slotChoice) return;

        const slotIdx = parseInt(slotChoice) - 1;
        if (slotIdx < 0 || slotIdx >= TIME_SLOTS.length) {
            alert('Lựa chọn không hợp lệ!');
            return;
        }

        const selectedZone = zonesKeys[zoneIdx];
        const selectedSlot = TIME_SLOTS[slotIdx];

        // Directly open booking form pre-populated!
        this.showBookingModal(selectedZone, selectedSlot);
    }
};

// Global actions namespace for onclick events in dynamically generated HTML
window.LA_Action = {
    approve(id) {
        if (confirm('Duyệt yêu cầu đăng ký này?')) {
            const res = StemLabAPI.updateBookingStatus(id, 'approved');
            if (res.success) {
                UIEngine.renderAll();
            }
        }
    },
    reject(id) {
        if (confirm('Từ chối yêu cầu đăng ký này?')) {
            const res = StemLabAPI.updateBookingStatus(id, 'rejected');
            if (res.success) {
                UIEngine.renderAll();
            }
        }
    },
    handover(id) {
        if (confirm('Xác nhận bàn giao phòng và các thiết bị mượn kèm?')) {
            const res = StemLabAPI.updateBookingStatus(id, 'in_use');
            if (res.success) {
                UIEngine.renderAll();
            }
        }
    },
    complete(id) {
        if (confirm('Xác nhận kết thúc ca học và thu hồi phòng/thiết bị?')) {
            const res = StemLabAPI.updateBookingStatus(id, 'completed');
            if (res.success) {
                UIEngine.renderAll();
            }
        }
    },
    resetStorage() {
        if (confirm('Bạn có chắc muốn đặt lại toàn bộ dữ liệu hệ thống về trạng thái ban đầu?')) {
            StorageEngine.reset();
            UIEngine.renderAll();
        }
    }
};

/**
 * 🖥️ UI ENGINE: stem-lab DOM Render & Interaction Manager
 */

// Helper to escape HTML characters for XSS prevention
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    if (typeof str !== 'string') str = String(str);
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Time slots & Zones configurations (Excluding Green Zone from online reservation selection)
const TIME_SLOTS = [
    '07:00-09:00',
    '09:00-11:00',
    '13:30-15:30',
    '15:30-17:30',
    '17:30-19:30'
];

const ZONES = {
    green: { name: 'Green Zone', icon: 'fa-solid fa-screwdriver-wrench', desc: 'Khu Cơ khí (Quản lý thẻ vật lý)', bookable: false },
    yellow: { name: 'Yellow Zone', icon: 'fa-solid fa-bolt', desc: 'Điện - Điện tử', bookable: true },
    red: { name: 'Red Zone', icon: 'fa-solid fa-cubes', desc: 'STEM Maker', bookable: true },
    open: { name: 'Open Lab', icon: 'fa-solid fa-border-all', desc: 'Không gian mở', bookable: true }
};

const DEVICE_TYPES = [
    'Kính hiển vi',
    'Vex IQ',
    'Vex AIM',
    'Vex V5',
    'KC BOT',
    'AI - IoT',
    'Máy in 3D',
    'Snapmaker Artisan',
    'Laptop',
    'Dụng cụ cầm tay'
];

// State variables
let currentDate = '2026-05-26'; // Default starting day
let activeRole = 'student'; // Roles: student, assistant, teacher
let activeTeacherTab = 'stats'; // Stats or devices
let barChart = null;
let pieChart = null;

const UIEngine = {
    init() {
        // Run auto-reject expired bookings on startup
        StemLabAPI.autoRejectExpiredBookings();

        // Sync date picker default
        document.getElementById('date-picker').value = currentDate;

        this.setupEventListeners();
        this.renderAll();
    },

    setupEventListeners() {
        // Role switcher selector
        document.getElementById('role-select').addEventListener('change', (e) => {
            activeRole = e.target.value;
            this.switchRoleView(activeRole);
        });

        // Date picker change event
        document.getElementById('date-picker').addEventListener('change', (e) => {
            if (e.target.value) {
                currentDate = e.target.value;
                this.renderAll();
            }
        });

        // Prev/Next day buttons
        document.getElementById('prev-day').addEventListener('click', () => this.changeDate(-1));
        document.getElementById('next-day').addEventListener('click', () => this.changeDate(1));

        // Booking Modal closures
        document.getElementById('close-booking-modal').addEventListener('click', () => this.hideBookingModal());
        document.getElementById('btn-cancel-booking').addEventListener('click', () => this.hideBookingModal());
        
        // Form submit handlers
        document.getElementById('booking-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBookingSubmit();
        });

        // Role select inside booking form (Show/Hide urgent logic)
        document.getElementById('form-role-creator').addEventListener('change', () => this.toggleUrgentFields());
        document.getElementById('input-is-urgent').addEventListener('change', () => this.toggleUrgentFields());

        // Issue Modal (LA/Student report error / extend)
        document.getElementById('close-issue-modal').addEventListener('click', () => this.hideIssueModal());
        document.getElementById('issue-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleIssueSubmit();
        });
        
        // Issue Action radio buttons change
        document.querySelectorAll('input[name="issue-action"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'report-error') {
                    document.getElementById('issue-error-section').classList.remove('hidden');
                    document.getElementById('issue-extend-section').classList.add('hidden');
                } else {
                    document.getElementById('issue-error-section').classList.add('hidden');
                    document.getElementById('issue-extend-section').classList.remove('hidden');
                }
            });
        });

        // Evaluation Form (Teacher evaluating groups)
        document.getElementById('close-evaluation-modal').addEventListener('click', () => this.hideEvaluationModal());
        document.getElementById('evaluation-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEvaluationSubmit();
        });

        // Teacher sub-tab switching
        document.getElementById('tab-btn-stats').addEventListener('click', () => this.switchTeacherTab('stats'));
        document.getElementById('tab-btn-devices').addEventListener('click', () => this.switchTeacherTab('devices'));

        // Admin new device submit
        document.getElementById('device-admin-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAdminAddDevice();
        });

        // Teacher rating buttons clicks
        const evalBtns = document.querySelectorAll('.eval-btn');
        evalBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                evalBtns.forEach(b => b.classList.remove('selected'));
                const targetBtn = e.currentTarget;
                targetBtn.classList.add('selected');
                document.getElementById('input-rating').value = targetBtn.getAttribute('data-value');
            });
        });

        // Simulated QR scan click
        document.getElementById('btn-qr-simulate').addEventListener('click', () => this.simulateQRScan());
        
        // Lab Assistant Quick / On-the-spot Booking
        document.getElementById('btn-quick-booking').addEventListener('click', () => {
            this.showQuickBookingModal();
        });
    },

    renderAll() {
        document.getElementById('current-date-display').innerText = this.formatDateDisplay(currentDate);
        document.getElementById('date-picker').value = currentDate;
        this.renderCalendarGrid();
        
        if (activeRole === 'assistant') {
            this.renderLADashboard();
        } else if (activeRole === 'teacher') {
            this.renderTeacherDashboard();
            this.renderAdminDevices();
        }
    },

    // --- ROLE VIEW SWITCHER ---
    switchRoleView(role) {
        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`${role}-view`).classList.add('active');
        
        this.renderAll();
    },

    // --- TEACHER SUB-TABS SWITCHER ---
    switchTeacherTab(tab) {
        activeTeacherTab = tab;
        document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));

        if (tab === 'stats') {
            document.getElementById('tab-btn-stats').classList.add('active');
            document.getElementById('teacher-stats-tab').classList.add('active');
            this.renderTeacherDashboard();
        } else {
            document.getElementById('tab-btn-devices').classList.add('active');
            document.getElementById('teacher-devices-tab').classList.add('active');
            this.renderAdminDevices();
        }
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

    // --- 1. RENDER CALENDAR GRID (Parallel Slots) ---
    renderCalendarGrid() {
        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';

        const todayStr = new Date().toISOString().split('T')[0];
        const isPastDate = currentDate < todayStr;

        // Render Headers (Top Row)
        const emptyHeader = document.createElement('div');
        emptyHeader.className = 'grid-header';
        emptyHeader.innerHTML = '🕒 Khung ca';
        grid.appendChild(emptyHeader);

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
            // First cell: Time Slot info
            const timeCell = document.createElement('div');
            timeCell.className = 'time-col-header';
            timeCell.innerHTML = `${slot.split('-')[0]} <span>đến ${slot.split('-')[1]}</span>`;
            grid.appendChild(timeCell);

            // Render Zone Cells
            Object.keys(ZONES).forEach(zoneKey => {
                const cell = document.createElement('div');

                // Case 1: Green Zone (Khu cơ khí) is locked for online registration
                if (zoneKey === 'green') {
                    cell.className = 'grid-cell green-locked';
                    // We can display bookings in Green Zone if they were created directly by LA/Teacher
                    const greenBookings = bookings.filter(b => b.zone === 'green' && b.time_slot === slot && b.status !== 'rejected');
                    
                    if (greenBookings.length > 0) {
                        cell.className = 'grid-cell';
                        for (let i = 1; i <= 3; i++) {
                            const subSlotDiv = document.createElement('div');
                            const b = greenBookings.find(bk => bk.slot_number === i);
                            
                            if (b) {
                                subSlotDiv.className = `sub-slot booked status-${b.status}`;
                                subSlotDiv.innerHTML = `
                                    <div class="sub-slot-team">${escapeHTML(b.team_name)}</div>
                                    <div class="sub-slot-meta"><i class="fa-regular fa-user"></i> ${escapeHTML(b.representative)}</div>
                                    <span class="sub-slot-badge">Slot ${i}</span>
                                `;
                                subSlotDiv.addEventListener('click', () => this.handleBookingCellClick(b));
                            } else {
                                subSlotDiv.className = 'sub-slot vacant';
                                subSlotDiv.style.cursor = 'not-allowed';
                                subSlotDiv.innerHTML = `<span style="opacity:0.3;">Chỉ đặt bằng thẻ vật lý</span>`;
                            }
                            cell.appendChild(subSlotDiv);
                        }
                    } else {
                        cell.innerHTML = `<i class="fa-solid fa-address-card"></i> <strong>Cơ Khí Vật Lý</strong> <span style="font-size:10px; opacity:0.75; margin-top:2px;">Quản lý bằng thẻ vật lý & cần giáo viên trực tiếp giám sát</span>`;
                    }
                    
                    grid.appendChild(cell);
                    return;
                }

                // Case 2: Yellow, Red, Open Lab (Multi-slot Grid 1-3)
                cell.className = 'grid-cell';
                
                for (let i = 1; i <= 3; i++) {
                    const subSlotDiv = document.createElement('div');
                    const b = bookings.find(bk => bk.zone === zoneKey && bk.time_slot === slot && bk.slot_number === i && bk.status !== 'rejected');
                    
                    if (b) {
                        // Slot is booked
                        subSlotDiv.className = `sub-slot booked status-${b.status}`;
                        
                        let displayUrgent = b.is_urgent ? '<span style="color:var(--zone-red); font-weight:700;">[GẤP]</span> ' : '';
                        let displayOvertime = b.is_overtime ? ' ⏳' : '';
                        let displayError = b.error_report ? ' ⚠️' : '';

                        subSlotDiv.innerHTML = `
                            <div class="sub-slot-team">${displayUrgent}${escapeHTML(b.team_name)}${displayOvertime}${displayError}</div>
                            <div class="sub-slot-meta"><i class="fa-regular fa-user"></i> ${escapeHTML(b.representative)}</div>
                            <span class="sub-slot-badge">Slot ${i}</span>
                        `;
                        subSlotDiv.addEventListener('click', () => this.handleBookingCellClick(b));
                    } else {
                        // Slot is vacant
                        subSlotDiv.className = 'sub-slot vacant';
                        
                        if (isPastDate) {
                            subSlotDiv.style.cursor = 'not-allowed';
                            subSlotDiv.innerHTML = `<span style="opacity:0.35;">Đã qua</span>`;
                        } else {
                            subSlotDiv.innerHTML = `<i class="fa-solid fa-plus"></i> Trống (Slot ${i})`;
                            subSlotDiv.addEventListener('click', () => this.showBookingModal(zoneKey, slot, i));
                        }
                    }
                    cell.appendChild(subSlotDiv);
                }

                grid.appendChild(cell);
            });
        });
    },

    // Click behavior on a booked cell slot
    handleBookingCellClick(booking) {
        if (activeRole === 'student') {
            // Students can leave feedback if completed
            if (booking.status === 'completed' && booking.rating === null) {
                this.showEvaluationModal(booking.id);
            } else {
                alert(`📋 Chi tiết ca học:\n- Nhóm: ${booking.team_name}\n- Người mượn: ${booking.representative}\n- Mục đích: ${booking.purpose}\n- Trạng thái: ${booking.status}\n- Thiết bị: ${booking.devices.join(', ')}`);
            }
        } else if (activeRole === 'assistant') {
            // Lab assistant can trigger actions on active bookings (Issue modal)
            if (booking.status === 'in_use') {
                this.showIssueModal(booking);
            } else {
                this.switchRoleView('assistant');
            }
        } else if (activeRole === 'teacher') {
            // Teachers can evaluate
            if (booking.status === 'completed' && booking.teacher_evaluation === null) {
                this.showTeacherEvaluationModal(booking);
            } else {
                this.switchRoleView('teacher');
            }
        }
    },

    // --- 2. BOOKING FORM MODAL ---
    showBookingModal(zone, slot, slotNumber) {
        // Reset urgent reason
        document.getElementById('input-is-urgent').checked = false;
        document.getElementById('input-urgent-reason').value = '';
        document.getElementById('urgent-reason-group').classList.add('hidden');

        // Populate fields
        document.getElementById('form-zone').value = zone;
        document.getElementById('form-timeslot').value = slot;
        document.getElementById('form-date').value = currentDate;
        document.getElementById('form-slotnumber').value = slotNumber;

        document.getElementById('display-zone').innerText = `${ZONES[zone].name} (Slot ${slotNumber})`;
        document.getElementById('display-zone').className = `info-badge ${zone}-badge`;
        document.getElementById('display-timeslot').innerText = slot;

        // Reset role select in form based on active main switcher
        const roleFormSelect = document.getElementById('form-role-creator');
        if (activeRole === 'teacher') {
            roleFormSelect.value = 'teacher';
        } else {
            roleFormSelect.value = 'student';
        }

        this.renderFormDevicesChecklist(zone, slot);
        this.toggleUrgentFields();

        document.getElementById('booking-modal').classList.add('active');
    },

    // Render device checkboxes in booking modal with quantities
    renderFormDevicesChecklist(zone, slot) {
        const checklist = document.getElementById('devices-checklist');
        checklist.innerHTML = '';

        // Get live availability statistics
        const stats = StemLabAPI.getAvailableDevicesCount(currentDate, slot);

        DEVICE_TYPES.forEach((type, idx) => {
            const devInfo = stats[type] || { available: 0, total: 0 };
            
            // Render type row
            const row = document.createElement('div');
            row.className = 'device-item-row';
            
            const isAvailable = devInfo.available > 0;
            
            row.innerHTML = `
                <label class="device-checkbox-label" style="${!isAvailable ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                    <input type="checkbox" id="cb-dev-${idx}" name="devices-cb" value="${type}" ${!isAvailable ? 'disabled' : ''}>
                    ${type} <span style="font-size: 11px; color: var(--text-secondary);"> (Rảnh: ${devInfo.available}/${devInfo.total})</span>
                </label>
                <input type="number" id="qty-dev-${idx}" class="device-qty-input hidden" min="1" max="${devInfo.available}" value="1" disabled>
            `;

            // Bind check toggle to input visibility
            checklist.appendChild(row);

            const cb = document.getElementById(`cb-dev-${idx}`);
            const qty = document.getElementById(`qty-dev-${idx}`);

            if (cb) {
                cb.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        qty.classList.remove('hidden');
                        qty.disabled = false;
                        qty.focus();
                    } else {
                        qty.classList.add('hidden');
                        qty.disabled = true;
                        qty.value = 1;
                    }
                });
            }
        });
    },

    toggleUrgentFields() {
        const creatorRole = document.getElementById('form-role-creator').value;
        const slotStartHour = document.getElementById('form-timeslot').value.split('-')[0];
        const resDate = document.getElementById('form-date').value;
        
        // Calculate diff
        const reservationTime = new Date(`${resDate}T${slotStartHour}:00`);
        const timeDiffHours = (reservationTime - new Date()) / (1000 * 60 * 60);

        const urgentCheckbox = document.getElementById('input-is-urgent');
        const urgentGroup = document.getElementById('urgent-reason-group');

        if (creatorRole === 'teacher') {
            // Teachers bypass 24h rules entirely
            urgentCheckbox.disabled = true;
            urgentCheckbox.checked = false;
            urgentGroup.classList.add('hidden');
        } else {
            urgentCheckbox.disabled = false;
            if (timeDiffHours < 24) {
                // Sát giờ, force check or show reason input
                urgentCheckbox.checked = true;
                urgentGroup.classList.remove('hidden');
            } else {
                if (urgentCheckbox.checked) {
                    urgentGroup.classList.remove('hidden');
                } else {
                    urgentGroup.classList.add('hidden');
                }
            }
        }
    },

    hideBookingModal() {
        document.getElementById('booking-modal').classList.remove('active');
        document.getElementById('booking-form').reset();
    },

    handleBookingSubmit() {
        const zone = document.getElementById('form-zone').value;
        const time_slot = document.getElementById('form-timeslot').value;
        const date = document.getElementById('form-date').value;
        const slot_number = document.getElementById('form-slotnumber').value;
        
        const team_name = document.getElementById('input-team').value;
        const representative = document.getElementById('input-representative').value;
        const purpose = document.getElementById('input-purpose').value;
        
        const role_creator = document.getElementById('form-role-creator').value;
        const is_urgent = document.getElementById('input-is-urgent').checked;
        const urgent_reason = document.getElementById('input-urgent-reason').value;

        // Gather device requests
        const device_requests = {};
        DEVICE_TYPES.forEach((type, idx) => {
            const cb = document.getElementById(`cb-dev-${idx}`);
            const qty = document.getElementById(`qty-dev-${idx}`);
            if (cb && cb.checked) {
                device_requests[type] = parseInt(qty.value);
            }
        });

        const result = StemLabAPI.createBooking({
            team_name,
            representative,
            zone,
            date,
            time_slot,
            slot_number,
            device_requests,
            purpose,
            role_creator,
            is_urgent,
            urgent_reason
        });

        if (result.success) {
            alert(`🎉 Đăng ký thành công! ${result.booking.status === 'approved' ? 'Lịch của Giáo viên tự động được phê duyệt.' : 'Đã gửi yêu cầu phê duyệt.'}`);
            this.hideBookingModal();
            this.renderAll();
        } else {
            alert(`❌ Đăng ký thất bại:\n${result.message}`);
        }
    },

    // --- 3. LAB ASSISTANT SPECIAL / QUICK BOOKING (MƯỢN NÓNG) ---
    showQuickBookingModal() {
        // Opens the booking modal but allows selecting zone, timeslot and slotnumber manually in form!
        // For simplicity, we just trigger the simulated QR scan which lets them pick dynamically
        this.simulateQRScan();
    },

    // --- 4. ISSUE & EXTENSION MODAL ---
    showIssueModal(booking) {
        document.getElementById('issue-booking-id').value = booking.id;
        document.getElementById('issue-display-team').innerText = booking.team_name;
        document.getElementById('issue-display-devices').innerText = booking.devices.join(', ') || 'Không mượn thiết bị';
        
        // Reset form
        document.getElementById('issue-form').reset();
        document.getElementById('issue-error-section').classList.remove('hidden');
        document.getElementById('issue-extend-section').classList.add('hidden');
        
        document.getElementById('issue-modal').classList.add('active');
    },

    hideIssueModal() {
        document.getElementById('issue-modal').classList.remove('active');
    },

    handleIssueSubmit() {
        const id = document.getElementById('issue-booking-id').value;
        const action = document.querySelector('input[name="issue-action"]:checked').value;

        if (action === 'report-error') {
            const issueType = document.getElementById('input-issue-type').value;
            const desc = document.getElementById('input-issue-desc').value;
            
            if (!desc || desc.trim() === '') {
                alert('Vui lòng nhập mô tả lỗi!');
                return;
            }

            const res = StemLabAPI.reportIssue(id, issueType, desc);
            if (res.success) {
                alert('⚠️ Đã gửi báo cáo lỗi/sự cố lên Giáo viên!');
                this.hideIssueModal();
                this.renderAll();
            }
        } else {
            // Extend overtime
            const res = StemLabAPI.extendBooking(id);
            if (res.success) {
                alert('⏳ Đã gia hạn thành công! Trạng thái chuyển sang Overtime.');
                this.hideIssueModal();
                this.renderAll();
            }
        }
    },

    // --- 5. TEACHER EVALUATION FORM MODAL ---
    showTeacherEvaluationModal(booking) {
        document.getElementById('eval-booking-id').value = booking.id;
        document.getElementById('eval-display-team').innerText = booking.team_name;
        document.getElementById('eval-display-purpose').innerText = booking.purpose;
        
        // Reset evaluation buttons selection
        document.querySelectorAll('.eval-btn').forEach(b => b.classList.remove('selected'));
        // Select 'đạt' by default
        document.querySelector('.eval-btn[data-value="đạt"]').classList.add('selected');
        document.getElementById('input-rating').value = 'đạt';
        document.getElementById('input-review').value = '';

        document.getElementById('evaluation-modal').classList.add('active');
    },

    hideEvaluationModal() {
        document.getElementById('evaluation-modal').classList.remove('active');
    },

    handleEvaluationSubmit() {
        const id = document.getElementById('eval-booking-id').value;
        const status = document.getElementById('input-rating').value; // tốt / đạt / chưa đạt
        const notes = document.getElementById('input-review').value;

        const result = StemLabAPI.submitTeacherEvaluation(id, status, notes);

        if (result.success) {
            alert('✅ Đã xếp loại đánh giá năng lực nhóm thành công!');
            this.hideEvaluationModal();
            this.renderAll();
        } else {
            alert('❌ Có lỗi xảy ra!');
        }
    },

    // --- 6. RENDER LAB ASSISTANT VIEW (Grouped details) ---
    renderLADashboard() {
        const laContainer = document.getElementById('la-dashboard-content');
        laContainer.innerHTML = '';

        const laGrid = document.createElement('div');
        laGrid.className = 'dashboard-grid';

        // Column 1: Consolidated Bookings Management
        const bookingsCol = document.createElement('div');
        bookingsCol.className = 'panel-card';
        
        const bookings = StorageEngine.getBookings().sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        const pendingCount = bookings.filter(b => b.status === 'pending').length;

        // Grouping: For display, we render them cleanly.
        // We highlight urgent bookings at the top
        bookingsCol.innerHTML = `
            <div class="panel-header">
                <h3><i class="fa-solid fa-clipboard-list"></i> Quản Lý Lịch Trình Ca Học</h3>
                <span class="info-badge">${pendingCount} Yêu cầu chờ duyệt</span>
            </div>
            
            <div class="la-booking-list">
                ${bookings.length === 0 ? '<p style="text-align:center; padding:20px; color:var(--text-muted);">Không có dữ liệu đăng ký phòng.</p>' : ''}
                
                ${bookings.map(b => {
                    let statusLabel = '';
                    let actionButtons = '';
                    
                    if (b.status === 'pending') {
                        statusLabel = '<span class="cell-status-badge">Đang chờ duyệt</span>';
                        actionButtons = `
                            <button class="btn btn-success btn-sm" onclick="LA_Action.approve('${b.id}')"><i class="fa-solid fa-check"></i> Duyệt</button>
                            <button class="btn btn-danger btn-sm" onclick="LA_Action.reject('${b.id}')"><i class="fa-solid fa-xmark"></i> Từ chối</button>
                        `;
                    } else if (b.status === 'approved') {
                        statusLabel = '<span class="cell-status-badge">Đã duyệt</span>';
                        actionButtons = `
                            <button class="btn btn-primary btn-sm" onclick="LA_Action.handover('${b.id}')"><i class="fa-solid fa-key"></i> Bàn giao</button>
                        `;
                    } else if (b.status === 'in_use') {
                        statusLabel = '<span class="cell-status-badge">Đang sử dụng</span>';
                        actionButtons = `
                            <button class="btn btn-secondary btn-sm" onclick="LA_Action.complete('${b.id}')"><i class="fa-solid fa-circle-check"></i> Hoàn thành ca</button>
                            <button class="btn btn-warning btn-sm" onclick="LA_Action.triggerIssue('${b.id}')"><i class="fa-solid fa-triangle-exclamation"></i> Sự cố / Gia hạn</button>
                        `;
                    } else if (b.status === 'completed') {
                        statusLabel = `<span class="cell-status-badge">Đã hoàn thành</span>`;
                    } else if (b.status === 'rejected') {
                        statusLabel = '<span class="cell-status-badge">Từ chối</span>';
                    }

                    // Display details
                    let urgentBadge = b.is_urgent ? `<span class="badge-urgent"><i class="fa-solid fa-fire"></i> GẤP: ${escapeHTML(b.urgent_reason)}</span>` : '';
                    let overtimeBadge = b.is_overtime ? `<span class="badge-overtime"><i class="fa-solid fa-hourglass-half"></i> ĐANG GIA HẠN (OVERTIME)</span>` : '';
                    let errorBadge = b.error_report ? `<span class="badge-error"><i class="fa-solid fa-triangle-exclamation"></i> LỖI: ${escapeHTML(b.error_report.description)}</span>` : '';
                    
                    let roleBadge = b.role_creator === 'teacher' ? '<span class="info-badge" style="color:var(--zone-blue); border-color:var(--zone-blue);">Giáo Viên</span>' : '';

                    return `
                        <div class="la-booking-item ${b.is_urgent ? 'urgent-item' : ''}">
                            <div class="la-booking-details">
                                <div class="la-booking-title">
                                    ${escapeHTML(b.team_name)} ${roleBadge}
                                    <span style="font-weight:400; font-size:12px; color:var(--text-muted);">
                                        (${ZONES[b.zone].name} - Slot ${b.slot_number})
                                    </span>
                                </div>
                                <div class="la-booking-meta">
                                    <span><i class="fa-regular fa-user"></i> <strong>Người nhận:</strong> ${escapeHTML(b.representative)}</span>
                                    <span><i class="fa-regular fa-calendar"></i> <strong>Ngày:</strong> ${escapeHTML(b.date)}</span>
                                    <span><i class="fa-regular fa-clock"></i> <strong>Ca:</strong> ${escapeHTML(b.time_slot)}</span>
                                </div>
                                <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">
                                    <strong>Mục đích:</strong> ${escapeHTML(b.purpose)}
                                </div>
                                ${b.devices.length > 0 ? `
                                    <div style="font-size:12px; color:var(--zone-yellow); margin-top:4px; font-weight:500;">
                                        <i class="fa-solid fa-microchip"></i> <strong>Thiết bị bàn giao:</strong> ${escapeHTML(b.devices.join(', '))}
                                    </div>
                                ` : ''}
                                <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:6px;">
                                    ${urgentBadge}
                                    ${overtimeBadge}
                                    ${errorBadge}
                                </div>
                            </div>
                            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px; min-width:140px;">
                                ${statusLabel}
                                <div class="la-booking-actions">
                                    ${actionButtons}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Column 2: Devices Status Check (Grouped & summarized)
        const sidebarCol = document.createElement('div');
        sidebarCol.className = 'panel-card';

        // Count device statuses
        const devices = StorageEngine.getDevices();
        const stats = {};
        DEVICE_TYPES.forEach(t => {
            stats[t] = { total: 0, available: 0, in_use: 0 };
        });
        devices.forEach(d => {
            if (stats[d.type]) {
                stats[d.type].total++;
                if (d.status === 'available') stats[d.type].available++;
                else stats[d.type].in_use++;
            }
        });

        sidebarCol.innerHTML = `
            <div class="panel-header">
                <h3><i class="fa-solid fa-warehouse"></i> Trạng Thái Thiết Bị Rảnh</h3>
            </div>
            <div class="devices-list">
                ${DEVICE_TYPES.map(type => {
                    const s = stats[type] || { total: 0, available: 0, in_use: 0 };
                    let badgeClass = s.available > 0 ? 'available' : 'in_use';
                    return `
                        <div class="device-item">
                            <div>
                                <div style="font-weight:600;">${type}</div>
                                <div style="font-size:11px; color:var(--text-muted);">Tổng số lượng kho: ${s.total} bộ</div>
                            </div>
                            <span class="device-badge ${badgeClass}">Trống: ${s.available}</span>
                        </div>
                    `;
                }).join('')}
            </div>
            <div style="margin-top:20px; border-top:1px solid rgba(255,255,255,0.05); padding-top:16px;">
                <button class="btn btn-secondary btn-block" onclick="LA_Action.resetStorage()"><i class="fa-solid fa-trash-can"></i> Đặt Lại Dữ Liệu Gốc</button>
            </div>
        `;

        laGrid.appendChild(bookingsCol);
        laGrid.appendChild(sidebarCol);
        laContainer.appendChild(laGrid);
    },

    // --- 7. RENDER ADMIN DEVICES LIST ---
    renderAdminDevices() {
        const devices = StorageEngine.getDevices().sort((a,b) => a.type.localeCompare(b.type));
        const tbody = document.querySelector('#admin-devices-table tbody');
        
        tbody.innerHTML = '';
        document.getElementById('admin-total-devices-count').innerText = `${devices.length} Thiết bị`;

        devices.forEach(d => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-family: monospace; font-size: 11px;">${d.id}</td>
                <td style="font-weight:600;">${d.name}</td>
                <td>${d.type}</td>
                <td><span class="info-badge" style="padding:2px 6px;">${ZONES[d.zone] ? ZONES[d.zone].name : d.zone}</span></td>
                <td><span class="device-badge ${d.status}">${d.status === 'available' ? 'Trống' : 'Đang bận'}</span></td>
            `;
            tbody.appendChild(tr);
        });
    },

    handleAdminAddDevice() {
        const name = document.getElementById('admin-device-name').value;
        const type = document.getElementById('admin-device-type').value;
        const zone = document.getElementById('admin-device-zone').value;

        const devices = StorageEngine.getDevices();
        const newId = `dev_custom_${Date.now()}`;

        devices.push({
            id: newId,
            name: name.trim(),
            type: type,
            zone: zone,
            status: 'available'
        });

        if (StorageEngine.saveDevices(devices)) {
            alert('🎉 Đã thêm thiết bị mới vào kho thành công!');
            document.getElementById('device-admin-form').reset();
            this.renderAdminDevices();
        } else {
            alert('❌ Lỗi lưu dữ liệu!');
        }
    },

    // --- 8. RENDER TEACHER STATS DASHBOARD ---
    renderTeacherDashboard() {
        const teacherContainer = document.getElementById('teacher-dashboard-content');
        teacherContainer.innerHTML = '';

        const grid = document.createElement('div');
        grid.className = 'teacher-grid';

        const bookings = StorageEngine.getBookings();
        const errorBookings = bookings.filter(b => b.error_report !== null && b.status === 'in_use');

        // 0. URGENT ERROR ACTIONS ALERT SECTION (If any active error exists)
        if (errorBookings.length > 0) {
            const errorAlertCard = document.createElement('div');
            errorAlertCard.className = 'panel-card teacher-grid-full';
            errorAlertCard.style.borderColor = 'var(--zone-red)';
            errorAlertCard.style.background = 'rgba(239, 68, 68, 0.05)';
            
            errorAlertCard.innerHTML = `
                <div class="panel-header" style="border-bottom-color: rgba(239,68,68,0.2);">
                    <h3 style="color:var(--zone-red);"><i class="fa-solid fa-bell-exclamation"></i> CẢNH BÁO SỰ CỐ KHẨN CẤP PHÒNG LAB</h3>
                    <span class="badge-error">${errorBookings.length} Nhóm cần hỗ trợ</span>
                </div>
                <div class="la-booking-list" style="max-height:180px;">
                    ${errorBookings.map(b => `
                        <div style="background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.2); border-radius:10px; padding:12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <strong style="font-size:14px; color:white;">${escapeHTML(b.team_name)}</strong> - 
                                <span style="font-size:12px; color:var(--text-secondary);">${escapeHTML(ZONES[b.zone].name)} (${escapeHTML(b.time_slot)})</span>
                                <div style="font-size:13px; color:var(--text-primary); margin-top:4px;">
                                    ⚠️ <strong>Sự cố:</strong> ${escapeHTML(b.error_report.description)}
                                </div>
                            </div>
                            <button class="btn btn-warning btn-sm" onclick="LA_Action.complete('${b.id}')"><i class="fa-solid fa-check"></i> Hỗ trợ xong & Đóng ca</button>
                        </div>
                    `).join('')}
                </div>
            `;
            grid.appendChild(errorAlertCard);
        }

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
                                <td style="font-weight:600;">${escapeHTML(team.name)}</td>
                                <td><span class="info-badge" style="padding:2px 8px;">${team.count} ca</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // 4. Feedbacks & Teacher Evaluations List Card
        const feedbackCard = document.createElement('div');
        feedbackCard.className = 'panel-card';

        const completedBookings = bookings.filter(b => b.status === 'completed');

        feedbackCard.innerHTML = `
            <div class="panel-header">
                <h3><i class="fa-regular fa-comment-dots"></i> Nhận Xét & Đánh Giá Nhóm</h3>
            </div>
            <div class="la-booking-list" style="max-height:250px;">
                ${completedBookings.length === 0 ? '<p style="text-align:center; color:var(--text-muted); padding:20px;">Chưa có ca học nào hoàn thành.</p>' : ''}
                ${completedBookings.map(b => {
                    let evalHtml = '';
                    if (b.teacher_evaluation) {
                        let evalBadge = '';
                        if (b.teacher_evaluation.status === 'tốt') evalBadge = '<span class="cell-status-badge" style="background:rgba(16,185,129,0.15); color:var(--zone-green);">Tốt</span>';
                        else if (b.teacher_evaluation.status === 'đạt') evalBadge = '<span class="cell-status-badge" style="background:rgba(99,102,241,0.15); color:var(--primary);">Đạt</span>';
                        else evalBadge = '<span class="cell-status-badge" style="background:rgba(239,68,68,0.15); color:var(--zone-red);">Chưa đạt</span>';

                        evalHtml = `
                            <div style="margin-top:6px; padding:6px 10px; background:rgba(255,255,255,0.03); border-radius:6px; border-left:2px solid var(--primary);">
                                <strong>Giáo viên đánh giá:</strong> ${evalBadge}
                                <p style="font-size:11px; color:var(--text-secondary); margin-top:2px;">"${escapeHTML(b.teacher_evaluation.notes)}"</p>
                            </div>
                        `;
                    } else {
                        evalHtml = `
                            <button class="btn btn-primary btn-sm" style="margin-top:6px;" onclick="Teacher_Action.evaluateGroup('${b.id}')">
                                <i class="fa-solid fa-award"></i> Đánh giá năng lực nhóm
                            </button>
                        `;
                    }

                    return `
                        <div style="background:rgba(255,255,255,0.015); border:1px solid var(--border-color); border-radius:10px; padding:12px; margin-bottom:8px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                <strong style="font-size:13px; color:white;">${escapeHTML(b.team_name)}</strong>
                                <span style="font-size:11px; color:var(--text-secondary);">${escapeHTML(b.date)} (${escapeHTML(b.time_slot)})</span>
                            </div>
                            <p style="font-size:12px; color:var(--text-secondary);">Mục đích: ${escapeHTML(b.purpose)}</p>
                            ${b.rating ? `
                                <div style="font-size:11px; color:var(--zone-yellow); margin-top:4px;">
                                    Học sinh phản hồi (${b.rating}★): "${escapeHTML(b.review)}"
                                </div>
                            ` : ''}
                            ${evalHtml}
                        </div>
                    `;
                }).join('')}
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

    // --- 9. SIMULATED QR CODE SCANNER ---
    simulateQRScan() {
        const zonesKeys = Object.keys(ZONES).filter(k => ZONES[k].bookable); // Only bookable zones
        const zonesStr = zonesKeys.map((k, idx) => `${idx + 1}. ${ZONES[k].name}`).join('\n');
        
        const zoneChoice = prompt(`🤖 Giả lập quét mã QR tại cửa phòng Lab!\n\nChọn khu vực (Zone) cần đặt (1-3):\n${zonesStr}`, '1');
        if (!zoneChoice) return;

        const zoneIdx = parseInt(zoneChoice) - 1;
        if (zoneIdx < 0 || zoneIdx >= zonesKeys.length) {
            alert('Lựa chọn không hợp lệ!');
            return;
        }

        const slotsStr = TIME_SLOTS.map((s, idx) => `${idx + 1}. Ca ${s}`).join('\n');
        const slotChoice = prompt(`Chọn ca học cần đặt (1-5):\n${slotsStr}`, '1');
        if (!slotChoice) return;

        const slotIdx = parseInt(slotChoice) - 1;
        if (slotIdx < 0 || slotIdx >= TIME_SLOTS.length) {
            alert('Lựa chọn không hợp lệ!');
            return;
        }

        const slotNumChoice = prompt(`Chọn vị trí đặt Slot (1, 2, hoặc 3):`, '1');
        if (!slotNumChoice) return;

        const slotNum = parseInt(slotNumChoice);
        if (slotNum !== 1 && slotNum !== 2 && slotNum !== 3) {
            alert('Vị trí Slot chỉ từ 1 đến 3!');
            return;
        }

        const selectedZone = zonesKeys[zoneIdx];
        const selectedSlot = TIME_SLOTS[slotIdx];

        this.showBookingModal(selectedZone, selectedSlot, slotNum);
    }
};

// Global actions namespace for onclick events in dynamically generated HTML
window.LA_Action = {
    approve(id) {
        if (confirm('Duyệt yêu cầu đăng ký này?')) {
            const res = StemLabAPI.updateBookingStatus(id, 'approved');
            if (res.success) UIEngine.renderAll();
        }
    },
    reject(id) {
        if (confirm('Từ chối yêu cầu đăng ký này?')) {
            const res = StemLabAPI.updateBookingStatus(id, 'rejected');
            if (res.success) UIEngine.renderAll();
        }
    },
    handover(id) {
        if (confirm('Xác nhận bàn giao phòng và các thiết bị mượn kèm?')) {
            const res = StemLabAPI.updateBookingStatus(id, 'in_use');
            if (res.success) UIEngine.renderAll();
        }
    },
    complete(id) {
        if (confirm('Xác nhận hoàn thành ca thực hành và thu hồi phòng/thiết bị?')) {
            const res = StemLabAPI.updateBookingStatus(id, 'completed');
            if (res.success) UIEngine.renderAll();
        }
    },
    triggerIssue(id) {
        const bookings = StorageEngine.getBookings();
        const b = bookings.find(bk => bk.id === id);
        if (b) {
            UIEngine.showIssueModal(b);
        }
    },
    resetStorage() {
        if (confirm('Bạn có chắc muốn thiết lập lại toàn bộ dữ liệu hệ thống về trạng thái ban đầu?')) {
            StorageEngine.reset();
            UIEngine.renderAll();
        }
    }
};

window.Teacher_Action = {
    evaluateGroup(id) {
        const bookings = StorageEngine.getBookings();
        const b = bookings.find(bk => bk.id === id);
        if (b) {
            UIEngine.showTeacherEvaluationModal(b);
        }
    }
};

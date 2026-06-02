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
    digital: { name: 'Digital & AI Lab', icon: 'fa-solid fa-microchip', desc: 'Công nghệ số & AI (Cụm 1)', bookable: true },
    fablab: { name: 'FabLab & Engineering', icon: 'fa-solid fa-screwdriver-wrench', desc: 'Chế tạo (Thẻ vật lý & Giám sát - Cụm 2)', bookable: false },
    robotics: { name: 'Robotics Arena', icon: 'fa-solid fa-robot', desc: 'Robotics (Cụm 3)', bookable: true },
    science: { name: 'Science Discovery Lab', icon: 'fa-solid fa-flask', desc: 'Khoa học thực nghiệm (Cụm 4)', bookable: true },
    classroom: { name: 'Lớp học', icon: 'fa-solid fa-chalkboard-user', desc: 'Không gian lớp học', bookable: true }
};

const DEVICE_TYPES = [
    'AI - IoT',
    'Laptop',
    'KC BOT',
    'Máy in 3D',
    'Snapmaker Artisan',
    'Dụng cụ cầm tay',
    'Vex IQ',
    'Vex V5',
    'Vex AIM',
    'Kính hiển vi',
    'Bộ thí nghiệm Vật lý',
    'Bộ thí nghiệm Hóa học'
];

// State variables
let currentDate = new Date().toISOString().split('T')[0]; // Default starting day (Dynamic to current date)
let activeRole = 'student'; // Roles: student, assistant, teacher
let activeTeacherTab = 'stats'; // Stats or devices
let barChart = null;
let pieChart = null;

const UIEngine = {
    init() {
        // Run auto-reject expired bookings on startup
        StemLabAPI.autoRejectExpiredBookings();

        // Check login session
        const session = localStorage.getItem('stem_lab_session');
        if (!session) {
            // Mặc định học sinh tự do sử dụng không cần đăng nhập
            activeRole = 'student';
            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('btn-login-trigger').style.display = 'inline-flex';
            document.getElementById('user-profile-info').style.display = 'none';
            
            this.switchRoleView(activeRole);
            
            // Dù không đăng nhập vẫn check tham số URL để auto open form đặt phòng qua QR
            this.checkURLQueryParamsAndOpenForm();
        } else {
            const user = JSON.parse(session);
            activeRole = user.role;
            
            document.getElementById('btn-login-trigger').style.display = 'none';
            document.getElementById('user-profile-info').style.display = 'flex';
            document.getElementById('user-info').innerHTML = `<i class="fa-solid fa-user"></i> ${user.name}`;
            
            // Switch to appropriate view
            this.switchRoleView(activeRole);
            
            // Run silent background sync on start
            this.loadDataFromCloudOnStartup();

            // Check URL query parameters to auto open booking form
            this.checkURLQueryParamsAndOpenForm();
        }

        // Sync date picker default
        const datePicker = document.getElementById('date-picker');
        if (datePicker) {
            datePicker.value = currentDate;
        }

        this.setupEventListeners();
    },

    setupEventListeners() {
        // Mở modal Đăng nhập
        document.getElementById('btn-login-trigger').addEventListener('click', () => {
            document.getElementById('login-overlay').style.display = 'flex';
        });

        // Đóng modal Đăng nhập
        document.getElementById('close-login-modal').addEventListener('click', () => {
            document.getElementById('login-overlay').style.display = 'none';
        });

        // Handle login form submit
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('login-username').value.trim();
            const passwordInput = document.getElementById('login-password').value.trim();
            
            // Validate login against MOCK_USERS in storage.js
            const user = MOCK_USERS.find(u => u.username === usernameInput && u.password === passwordInput);
            if (user) {
                localStorage.setItem('stem_lab_session', JSON.stringify({
                    username: user.username,
                    name: user.name,
                    role: user.role
                }));
                
                activeRole = user.role;
                document.getElementById('login-form').reset();
                document.getElementById('login-overlay').style.display = 'none';
                
                document.getElementById('btn-login-trigger').style.display = 'none';
                document.getElementById('user-profile-info').style.display = 'flex';
                document.getElementById('user-info').innerHTML = `<i class="fa-solid fa-user"></i> ${user.name}`;
                
                this.switchRoleView(activeRole);
                
                // Silent background sync
                this.loadDataFromCloudOnStartup();

                // Check URL query parameters to auto open booking form
                this.checkURLQueryParamsAndOpenForm();
            } else {
                alert('❌ Tên tài khoản hoặc mật khẩu không chính xác!');
            }
        });

        // Handle Logout button click
        document.getElementById('btn-logout').addEventListener('click', () => {
            if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị?')) {
                localStorage.removeItem('stem_lab_session');
                activeRole = 'student';
                
                document.getElementById('btn-login-trigger').style.display = 'inline-flex';
                document.getElementById('user-profile-info').style.display = 'none';
                
                this.switchRoleView('student');
            }
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

        // Lab Assistant Quick / On-the-spot Booking
        document.getElementById('btn-quick-booking').addEventListener('click', () => {
            this.showQuickBookingModal();
        });

        // Cloud sync settings handlers
        document.getElementById('btn-save-sheet-url').addEventListener('click', async () => {
            const url = document.getElementById('admin-sheet-url').value.trim();
            const token = document.getElementById('admin-telegram-token').value.trim();
            const chatId = document.getElementById('admin-telegram-chatid').value.trim();
            
            StorageEngine.saveApiUrl(url);
            StorageEngine.saveTelegramConfig(token, chatId);
            
            alert('💾 Đã lưu cấu hình kết nối thành công!');
            
            if (url) {
                // Show floating sync loader
                const loader = document.createElement('div');
                loader.style.position = 'fixed';
                loader.style.top = '50%';
                loader.style.left = '50%';
                loader.style.transform = 'translate(-50%, -50%)';
                loader.style.background = 'rgba(10, 15, 30, 0.95)';
                loader.style.color = '#fff';
                loader.style.padding = '20px 45px';
                loader.style.borderRadius = '14px';
                loader.style.zIndex = '99999';
                loader.style.border = '1px solid rgba(255,255,255,0.1)';
                loader.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';
                loader.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải và đồng bộ dữ liệu từ Google Sheets...';
                document.body.appendChild(loader);
                
                const res = await StorageEngine.loadFromGoogleSheets();
                document.body.removeChild(loader);
                
                alert(res.message);
                this.renderAll();
            }
        });

        // Reset system handler
        document.getElementById('btn-reset-system').addEventListener('click', () => {
            if (confirm('⚠️ CẢNH BÁO: Hành động này sẽ XÓA TOÀN BỘ dữ liệu bookings, hoàn trả toàn bộ kho 61 thiết bị về trạng thái trống mặc định và đồng bộ trực tiếp lên đám mây. Bạn có muốn tiếp tục?')) {
                StorageEngine.reset();
                alert('🧹 Đã hoàn tất đặt lại dữ liệu gốc của hệ thống!');
                this.renderAll();
            }
        });

        // --- 🔍 WIDGET TRA CỨU UY TÍN NHÓM ---
        const btnReputationLookup = document.getElementById('btn-reputation-lookup');
        const reputationSearchInput = document.getElementById('reputation-search-input');
        
        const handleReputationLookup = () => {
            const teamName = reputationSearchInput.value.trim();
            if (!teamName) {
                alert('Vui lòng nhập tên nhóm cần tra cứu!');
                return;
            }
            const score = StorageEngine.getTeamReputation(teamName);
            const allBookings = StorageEngine.getBookings();
            
            const lastFailedBooking = allBookings
                .filter(b => b.team_name.trim().toLowerCase() === teamName.trim().toLowerCase() && 
                             b.teacher_evaluation && 
                             (b.teacher_evaluation.status === 'chưa đạt' || b.teacher_evaluation.status === 'failed'))
                .sort((a, b) => new Date(b.teacher_evaluation.evaluated_at) - new Date(a.teacher_evaluation.evaluated_at))[0];

            let extraInfo = '';
            if (score === 0) {
                let failReason = "Không có lý do cụ thể";
                if (lastFailedBooking && lastFailedBooking.teacher_evaluation.notes) {
                    failReason = lastFailedBooking.teacher_evaluation.notes;
                }
                extraInfo = `\n\n🚨 Nhóm hiện đang bị KHÓA đặt lịch!\nLý do: "${failReason}"`;
            } else if (score < 40) {
                extraInfo = `\n\n⚠️ Cảnh báo: Điểm uy tín đang ở mức NGUY HIỂM. Nếu bị Chưa Đạt tiếp sẽ bị khóa đặt lịch!`;
            } else {
                extraInfo = `\n\n✅ Nhóm hoạt động bình thường, uy tín tốt.`;
            }

            alert(`🏆 Điểm Uy Tín của nhóm "${teamName}" là: ${score}/100${extraInfo}`);
        };

        if (btnReputationLookup && reputationSearchInput) {
            btnReputationLookup.addEventListener('click', handleReputationLookup);
            reputationSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    handleReputationLookup();
                }
            });
        }

        // --- 🤖 AUTOCOMPLETE & AUTOFILL TÊN NHÓM ---
        const inputTeam = document.getElementById('input-team');
        const inputRepresentative = document.getElementById('input-representative');
        const suggestionsBox = document.getElementById('autocomplete-suggestions');
        
        const closeSuggestions = () => {
            if (suggestionsBox) {
                suggestionsBox.classList.add('hidden');
                suggestionsBox.innerHTML = '';
            }
        };

        if (inputTeam && suggestionsBox) {
            const handleTeamInput = () => {
                const val = inputTeam.value.trim();
                const bookings = StorageEngine.getBookings();
                
                const uniqueTeams = [];
                const seen = new Set();
                bookings.forEach(b => {
                    const nameNormal = b.team_name.trim();
                    const key = nameNormal.toLowerCase();
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueTeams.push(nameNormal);
                    }
                });

                if (!val) {
                    closeSuggestions();
                    this.checkTeamReputationWarning('');
                    return;
                }

                const filtered = uniqueTeams.filter(t => t.toLowerCase().includes(val.toLowerCase()));
                if (filtered.length === 0) {
                    closeSuggestions();
                    this.checkTeamReputationWarning(val);
                    return;
                }

                suggestionsBox.innerHTML = '';
                filtered.forEach(team => {
                    const score = StorageEngine.getTeamReputation(team);
                    const div = document.createElement('div');
                    div.className = 'autocomplete-suggestion';
                    div.innerHTML = `
                        <span>${escapeHTML(team)}</span>
                        <span class="suggestion-score">Uy tín: ${score}đ</span>
                    `;
                    div.addEventListener('click', () => {
                        inputTeam.value = team;
                        closeSuggestions();
                        
                        const teamBookings = bookings.filter(b => b.team_name.trim().toLowerCase() === team.trim().toLowerCase());
                        if (teamBookings.length > 0) {
                            const lastBooking = teamBookings.sort((a,b) => b.created_at.localeCompare(a.created_at))[0];
                            if (lastBooking && inputRepresentative) {
                                inputRepresentative.value = lastBooking.representative;
                            }
                        }
                        
                        this.checkTeamReputationWarning(team);
                    });
                    suggestionsBox.appendChild(div);
                });
                suggestionsBox.classList.remove('hidden');
                
                this.checkTeamReputationWarning(val);
            };

            inputTeam.addEventListener('input', handleTeamInput);
            inputTeam.addEventListener('focus', handleTeamInput);
            
            document.addEventListener('click', (e) => {
                if (e.target !== inputTeam && e.target !== suggestionsBox && !suggestionsBox.contains(e.target)) {
                    closeSuggestions();
                }
            });
        }

        // --- 👨‍🏫 DYNAMIC RATING & COMMENT VALIDATION ---
        const teacherEvalBtns = document.querySelectorAll('.eval-btn');
        const inputReview = document.getElementById('input-review');
        if (inputReview) {
            teacherEvalBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const ratingVal = e.currentTarget.getAttribute('data-value');
                    const requiredStar = document.querySelector('label[for="input-review"] .required');
                    
                    if (ratingVal === 'chưa đạt') {
                        inputReview.required = true;
                        inputReview.placeholder = 'BẮT BUỘC: Nhập lý do xếp loại Chưa đạt (ví dụ: Không dọn dẹp vệ sinh, làm hỏng thiết bị, nghịch phá...)';
                        if (requiredStar) requiredStar.style.display = 'inline';
                    } else {
                        inputReview.required = false;
                        inputReview.placeholder = 'Nhập nhận xét chi tiết về tinh thần làm việc, ý thức bảo quản thiết bị... (Không bắt buộc)';
                        if (requiredStar) requiredStar.style.display = 'none';
                    }
                });
            });
        }

        // Populate initial configs in Teacher View
        document.getElementById('admin-sheet-url').value = StorageEngine.getApiUrl();
        const tg = StorageEngine.getTelegramConfig();
        document.getElementById('admin-telegram-token').value = tg.token;
        document.getElementById('admin-telegram-chatid').value = tg.chatId;
    },

    renderAll() {
        const dateDisplay = document.getElementById('current-date-display');
        if (dateDisplay) {
            dateDisplay.innerText = this.formatDateDisplay(currentDate);
        }
        const datePicker = document.getElementById('date-picker');
        if (datePicker) {
            datePicker.value = currentDate;
        }
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

                // Case 1: FabLab Zone (Khu chế tạo) is locked for online registration
                if (zoneKey === 'fablab') {
                    cell.className = 'grid-cell fablab-locked';
                    // We can display bookings in FabLab Zone if they were created directly by LA/Teacher
                    const fablabBookings = bookings.filter(b => b.zone === 'fablab' && b.time_slot === slot && b.status !== 'rejected');
                    
                    if (fablabBookings.length > 0) {
                        cell.className = 'grid-cell';
                        for (let i = 1; i <= 3; i++) {
                            const subSlotDiv = document.createElement('div');
                            const b = fablabBookings.find(bk => bk.slot_number === i);
                            
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
                        cell.innerHTML = `<i class="fa-solid fa-address-card"></i> <strong>FabLab & Chế tạo</strong> <span style="font-size:10px; opacity:0.75; margin-top:2px;">Chỉ hỗ trợ đặt thẻ vật lý tại phòng & có Giáo viên giám sát</span>`;
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
        const score = StorageEngine.getTeamReputation(booking.team_name);
        let evalDetail = '';
        if (booking.teacher_evaluation) {
            let statusText = booking.teacher_evaluation.status.toUpperCase();
            evalDetail = `\n- Đánh giá của GV: ${statusText}\n- Nhận xét của GV: "${booking.teacher_evaluation.notes}"`;
        }
        
        const detailsMessage = `📋 Chi tiết ca học:\n- Nhóm: ${booking.team_name} (Uy tín: ${score}/100)\n- Người mượn: ${booking.representative}\n- Mục đích: ${booking.purpose}\n- Trạng thái: ${booking.status}\n- Thiết bị: ${booking.devices.join(', ') || 'Không mượn'}${evalDetail}`;

        if (activeRole === 'student') {
            if (booking.status === 'completed' && booking.rating === null) {
                this.showEvaluationModal(booking.id);
            } else {
                alert(detailsMessage);
            }
        } else if (activeRole === 'assistant') {
            if (booking.status === 'in_use') {
                this.showIssueModal(booking);
            } else {
                alert(detailsMessage);
            }
        } else if (activeRole === 'teacher') {
            if (booking.status === 'completed' && booking.teacher_evaluation === null) {
                this.showTeacherEvaluationModal(booking);
            } else {
                alert(detailsMessage);
            }
        }
    },

    // --- 2. BOOKING FORM MODAL ---
    showBookingModal(zone, slot, slotNumber) {
        // Reset urgent reason
        document.getElementById('input-is-urgent').checked = false;
        document.getElementById('input-urgent-reason').value = '';
        document.getElementById('urgent-reason-group').classList.add('hidden');

        // Reset autocomplete and reputation warnings
        this.checkTeamReputationWarning('');
        const suggestionsBox = document.getElementById('autocomplete-suggestions');
        if (suggestionsBox) {
            suggestionsBox.classList.add('hidden');
            suggestionsBox.innerHTML = '';
        }

        // Autofill from Local Storage if available on this device
        const lastTeam = localStorage.getItem('stem_lab_last_team') || '';
        const lastRep = localStorage.getItem('stem_lab_last_rep') || '';
        document.getElementById('input-team').value = lastTeam;
        document.getElementById('input-representative').value = lastRep;

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

        if (lastTeam) {
            this.checkTeamReputationWarning(lastTeam);
        }

        document.getElementById('booking-modal').classList.add('active');
    },

    // Render device checkboxes in booking modal with quantities
    renderFormDevicesChecklist(zone, slot) {
        const checklist = document.getElementById('devices-checklist');
        checklist.innerHTML = '';

        // Get live availability statistics
        const stats = StemLabAPI.getAvailableDevicesCount(currentDate, slot);

        // Filter and render device types
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

        if (checklist.innerHTML === '') {
            checklist.innerHTML = '<p style="font-size:12px; color:var(--text-muted); font-style:italic; padding: 10px 0; text-align: center; width: 100%;">Không cần thiết bị mượn kèm tại phân khu này.</p>';
        }
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
            
            // Save team details to cache
            localStorage.setItem('stem_lab_last_team', team_name);
            localStorage.setItem('stem_lab_last_rep', representative);

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
        
        document.querySelectorAll('.eval-btn').forEach(b => b.classList.remove('selected'));
        document.querySelector('.eval-btn[data-value="đạt"]').classList.add('selected');
        document.getElementById('input-rating').value = 'đạt';
        
        const inputReview = document.getElementById('input-review');
        inputReview.value = '';
        inputReview.required = false;
        inputReview.placeholder = 'Nhập nhận xét chi tiết về tinh thần làm việc, ý thức bảo quản thiết bị... (Không bắt buộc)';
        
        const requiredStar = document.querySelector('label[for="input-review"] .required');
        if (requiredStar) requiredStar.style.display = 'none';

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
            alert('❌ Xếp loại thất bại:\n' + result.message);
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

        // Group bookings that have the same team_name, date, time_slot, and status
        const grouped = [];
        const groups = {};
        
        bookings.forEach(b => {
            const key = `${b.team_name.toLowerCase().trim()}_${b.date}_${b.time_slot}_${b.status}`;
            if (!groups[key]) {
                groups[key] = {
                    team_name: b.team_name,
                    representative: b.representative,
                    date: b.date,
                    time_slot: b.time_slot,
                    status: b.status,
                    role_creator: b.role_creator,
                    is_urgent: false,
                    urgent_reason: '',
                    is_overtime: false,
                    error_report: null,
                    bookings: []
                };
                grouped.push(groups[key]);
            }
            groups[key].bookings.push(b);
            if (b.is_urgent) {
                groups[key].is_urgent = true;
                groups[key].urgent_reason = b.urgent_reason;
            }
            if (b.is_overtime) {
                groups[key].is_overtime = true;
            }
            if (b.error_report) {
                groups[key].error_report = b.error_report;
            }
        });

        bookingsCol.innerHTML = `
            <div class="panel-header">
                <h3><i class="fa-solid fa-clipboard-list"></i> Quản Lý Lịch Trình Ca Học</h3>
                <span class="info-badge">${pendingCount} Yêu cầu chờ duyệt</span>
            </div>
            
            <div class="la-booking-list">
                ${grouped.length === 0 ? '<p style="text-align:center; padding:20px; color:var(--text-muted);">Không có dữ liệu đăng ký phòng.</p>' : ''}
                
                ${grouped.map(g => {
                    const idsStr = g.bookings.map(b => b.id).join(',');
                    let statusLabel = '';
                    let actionButtons = '';
                    
                    if (g.status === 'pending') {
                        statusLabel = '<span class="cell-status-badge">Đang chờ duyệt</span>';
                        actionButtons = `
                            <button class="btn btn-success btn-sm" onclick="LA_Action.approveGroup('${idsStr}')"><i class="fa-solid fa-check"></i> Duyệt</button>
                            <button class="btn btn-danger btn-sm" onclick="LA_Action.rejectGroup('${idsStr}')"><i class="fa-solid fa-xmark"></i> Từ chối</button>
                        `;
                    } else if (g.status === 'approved') {
                        statusLabel = '<span class="cell-status-badge">Đã duyệt</span>';
                        actionButtons = `
                            <button class="btn btn-primary btn-sm" onclick="LA_Action.handoverGroup('${idsStr}')"><i class="fa-solid fa-key"></i> Bàn giao</button>
                        `;
                    } else if (g.status === 'in_use') {
                        statusLabel = '<span class="cell-status-badge">Đang sử dụng</span>';
                        actionButtons = `
                            <button class="btn btn-secondary btn-sm" onclick="LA_Action.completeGroup('${idsStr}')"><i class="fa-solid fa-circle-check"></i> Hoàn thành ca</button>
                            <button class="btn btn-warning btn-sm" onclick="LA_Action.triggerIssueGroup('${idsStr}')"><i class="fa-solid fa-triangle-exclamation"></i> Sự cố / Gia hạn</button>
                        `;
                    } else if (g.status === 'completed') {
                        statusLabel = `<span class="cell-status-badge">Đã hoàn thành</span>`;
                    } else if (g.status === 'rejected') {
                        statusLabel = '<span class="cell-status-badge">Từ chối</span>';
                    }

                    // Consolidated list of zones & slots
                    const zoneDetailsStr = g.bookings.map(b => `${ZONES[b.zone] ? ZONES[b.zone].name : b.zone} (Slot ${b.slot_number})`).join(', ');

                    // Consolidated devices
                    const allDevicesInGroup = [];
                    g.bookings.forEach(b => {
                        b.devices.forEach(d => {
                            if (!allDevicesInGroup.includes(d)) {
                                allDevicesInGroup.push(d);
                            }
                        });
                    });

                    // Badges
                    let urgentBadge = g.is_urgent ? `<span class="badge-urgent"><i class="fa-solid fa-fire"></i> GẤP: ${escapeHTML(g.urgent_reason)}</span>` : '';
                    let overtimeBadge = g.is_overtime ? `<span class="badge-overtime"><i class="fa-solid fa-hourglass-half"></i> ĐANG GIA HẠN (OVERTIME)</span>` : '';
                    let errorBadge = g.error_report ? `<span class="badge-error"><i class="fa-solid fa-triangle-exclamation"></i> LỖI: ${escapeHTML(g.error_report.description)}</span>` : '';
                    let roleBadge = g.role_creator === 'teacher' ? '<span class="info-badge" style="color:var(--zone-blue); border-color:var(--zone-blue); padding: 2px 6px; font-size: 10px;">Giáo Viên</span>' : '';

                    return `
                        <div class="la-booking-item ${g.is_urgent ? 'urgent-item' : ''}">
                            <div class="la-booking-details">
                                <div class="la-booking-title">
                                    ${escapeHTML(g.team_name)} ${roleBadge}
                                    <span style="font-weight:400; font-size:12px; color:var(--text-muted);">
                                        (${zoneDetailsStr})
                                    </span>
                                </div>
                                <div class="la-booking-meta">
                                    <span><i class="fa-regular fa-user"></i> <strong>Người nhận:</strong> ${escapeHTML(g.representative)}</span>
                                    <span><i class="fa-regular fa-calendar"></i> <strong>Ngày:</strong> ${escapeHTML(g.date)}</span>
                                    <span><i class="fa-regular fa-clock"></i> <strong>Ca:</strong> ${escapeHTML(g.time_slot)}</span>
                                </div>
                                <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">
                                    <strong>Mục đích:</strong> ${escapeHTML(g.bookings[0].purpose)}
                                </div>
                                ${allDevicesInGroup.length > 0 ? `
                                    <div style="font-size:12px; color:var(--zone-yellow); margin-top:4px; font-weight:500;">
                                        <i class="fa-solid fa-microchip"></i> <strong>Thiết bị bàn giao:</strong> ${escapeHTML(allDevicesInGroup.join(', '))}
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
                <h3><i class="fa-solid fa-trophy"></i> Xếp Hạng Uy Tín & Tần Suất Đặt Lịch</h3>
            </div>
            <div class="table-wrapper">
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>Hạng</th>
                            <th>Tên Nhóm</th>
                            <th>Số ca đặt</th>
                            <th>Điểm Uy Tín</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topTeams.length === 0 ? '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Chưa có dữ liệu thống kê.</td></tr>' : ''}
                        ${topTeams.map((team, idx) => {
                            const score = StorageEngine.getTeamReputation(team.name);
                            let scoreColor = 'var(--zone-green)';
                            if (score === 0) scoreColor = 'var(--zone-red)';
                            else if (score < 40) scoreColor = 'var(--zone-yellow)';
                            return `
                                <tr>
                                    <td style="font-weight:700; color:var(--zone-yellow);">${idx + 1}</td>
                                    <td style="font-weight:600;">${escapeHTML(team.name)}</td>
                                    <td><span class="info-badge" style="padding:2px 8px;">${team.count} ca</span></td>
                                    <td><strong style="color: ${scoreColor};">${score}/100</strong></td>
                                </tr>
                            `;
                        }).join('')}
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
                        '#10b981', // digital
                        '#3b82f6', // fablab
                        '#ef4444', // robotics
                        '#f59e0b', // science
                        '#a855f7'  // classroom
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



    async loadDataFromCloudOnStartup() {
        const url = StorageEngine.getApiUrl();
        if (url) {
            console.log('☁️ Khởi tạo: Đang tải dữ liệu từ Google Sheets...');
            const res = await StorageEngine.loadFromGoogleSheets();
            if (res.success) {
                console.log('☁️ Đồng bộ dữ liệu thành công.');
                this.renderAll();
            } else {
                console.warn('⚠️ Lỗi đồng bộ ngầm khi khởi động:', res.message);
            }
        }
    },

    checkURLQueryParamsAndOpenForm() {
        const urlParams = new URLSearchParams(window.location.search);
        const zoneParam = urlParams.get('zone');
        if (zoneParam && ZONES[zoneParam] && ZONES[zoneParam].bookable) {
            // Chỉ cho phép học sinh hoặc giáo viên tự động mở form đặt lịch. Trợ lý không được
            if (activeRole === 'student' || activeRole === 'teacher') {
                const todayStr = new Date().toISOString().split('T')[0];
                currentDate = todayStr;
                
                // Tìm slot trống của phân khu hôm nay
                const bookings = StorageEngine.getBookings().filter(b => b.date === currentDate && b.zone === zoneParam && b.status !== 'rejected');
                let foundSlot = null;
                let foundSlotNumber = 1;
                
                for (const slot of TIME_SLOTS) {
                    for (let i = 1; i <= 3; i++) {
                        const isBooked = bookings.some(b => b.time_slot === slot && b.slot_number === i);
                        if (!isBooked) {
                            foundSlot = slot;
                            foundSlotNumber = i;
                            break;
                        }
                    }
                    if (foundSlot) break;
                }
                
                this.renderAll();
                if (foundSlot) {
                    this.showBookingModal(zoneParam, foundSlot, foundSlotNumber);
                } else {
                    alert(`Khu vực ${ZONES[zoneParam].name} hôm nay đã kín lịch!`);
                }
                
                // Xóa URL query parameter để F5 không tự động mở lại
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } else if (zoneParam === 'fablab') {
            alert('Khu vực FabLab & Chế tạo không hỗ trợ đăng ký trực tuyến bằng QR Code!');
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (zoneParam) {
            alert(`Mã QR khu vực "${zoneParam}" không hợp lệ!`);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
};

// Global actions namespace for onclick events in dynamically generated HTML
window.LA_Action = {
    approveGroup(idsStr) {
        if (confirm('Duyệt toàn bộ các yêu cầu đăng ký trong nhóm này?')) {
            const ids = idsStr.split(',');
            let success = false;
            ids.forEach(id => {
                const res = StemLabAPI.updateBookingStatus(id, 'approved');
                if (res.success) success = true;
            });
            if (success) UIEngine.renderAll();
        }
    },
    rejectGroup(idsStr) {
        if (confirm('Từ chối toàn bộ các yêu cầu đăng ký trong nhóm này?')) {
            const ids = idsStr.split(',');
            let success = false;
            ids.forEach(id => {
                const res = StemLabAPI.updateBookingStatus(id, 'rejected');
                if (res.success) success = true;
            });
            if (success) UIEngine.renderAll();
        }
    },
    handoverGroup(idsStr) {
        if (confirm('Xác nhận bàn giao phòng và toàn bộ thiết bị mượn kèm cho nhóm này?')) {
            const ids = idsStr.split(',');
            let success = false;
            ids.forEach(id => {
                const res = StemLabAPI.updateBookingStatus(id, 'in_use');
                if (res.success) success = true;
            });
            if (success) UIEngine.renderAll();
        }
    },
    completeGroup(idsStr) {
        if (confirm('Xác nhận hoàn thành ca thực hành và thu hồi phòng/toàn bộ thiết bị của nhóm?')) {
            const ids = idsStr.split(',');
            let success = false;
            ids.forEach(id => {
                const res = StemLabAPI.updateBookingStatus(id, 'completed');
                if (res.success) success = true;
            });
            if (success) UIEngine.renderAll();
        }
    },
    triggerIssueGroup(idsStr) {
        const firstId = idsStr.split(',')[0];
        const bookings = StorageEngine.getBookings();
        const b = bookings.find(bk => bk.id === firstId);
        if (b) {
            UIEngine.showIssueModal(b);
        }
    },
    resetStorage() {
        if (confirm('Bạn có chắc muốn thiết lập lại toàn bộ dữ liệu hệ thống về trạng thái ban đầu?')) {
            StorageEngine.reset();
            UIEngine.renderAll();
        }
    },
    
    checkTeamReputationWarning(teamName) {
        const warningBox = document.getElementById('reputation-warning-box');
        const submitBtn = document.querySelector('#booking-form button[type="submit"]');
        
        if (!teamName || teamName.trim() === '') {
            if (warningBox) warningBox.classList.add('hidden');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            }
            return;
        }

        const score = StorageEngine.getTeamReputation(teamName);
        if (!warningBox) return;

        if (score === 0) {
            const allBookings = StorageEngine.getBookings();
            const lastFailedBooking = allBookings
                .filter(b => b.team_name.trim().toLowerCase() === teamName.trim().toLowerCase() && 
                             b.teacher_evaluation && 
                             (b.teacher_evaluation.status === 'chưa đạt' || b.teacher_evaluation.status === 'failed'))
                .sort((a, b) => new Date(b.teacher_evaluation.evaluated_at) - new Date(a.teacher_evaluation.evaluated_at))[0];

            let failReason = "Không có lý do cụ thể";
            if (lastFailedBooking && lastFailedBooking.teacher_evaluation.notes) {
                failReason = lastFailedBooking.teacher_evaluation.notes;
            }

            warningBox.className = 'reputation-warning-container reputation-warning-danger';
            warningBox.innerHTML = `<i class="fa-solid fa-ban"></i> <strong>Nhóm đang bị KHÓA đặt lịch!</strong> Điểm uy tín của nhóm đã về 0.<br>Lý do vi phạm gần nhất: <i>"${failReason}"</i>`;
            warningBox.classList.remove('hidden');
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.4';
                submitBtn.style.cursor = 'not-allowed';
            }
        } else if (score < 40) {
            warningBox.className = 'reputation-warning-container reputation-warning-warning';
            warningBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <strong>Cảnh báo vùng nguy hiểm!</strong> Điểm uy tín của nhóm hiện tại là <strong>${score}/100</strong>. Nếu bị đánh giá "Chưa đạt" ở ca này, nhóm sẽ bị khóa đặt lịch!`;
            warningBox.classList.remove('hidden');
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            }
        } else {
            warningBox.className = 'reputation-warning-container reputation-warning-success';
            warningBox.innerHTML = `<i class="fa-solid fa-circle-check"></i> Điểm uy tín nhóm: <strong>${score}/100</strong> (Trạng thái hoạt động tốt).`;
            warningBox.classList.remove('hidden');
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            }
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

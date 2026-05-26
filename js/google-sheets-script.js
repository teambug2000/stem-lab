/**
 * 🚀 GOOGLE APPS SCRIPT: stem-lab REST API Engine
 * 
 * HƯỚNG DẪN CÀI ĐẶT:
 * 1. Tạo một Google Sheet mới trên Google Drive của bạn.
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa toàn bộ mã mặc định có sẵn trong file Code.gs.
 * 4. Copy và dán toàn bộ đoạn mã bên dưới vào Code.gs.
 * 5. Bấm vào biểu tượng Lưu (Save - hình đĩa mềm).
 * 6. Bấm nút "Triển khai" (Deploy) -> chọn "Triển khai mới" (New deployment).
 * 7. Chọn loại triển khai là: "Ứng dụng web" (Web app) bằng cách click vào biểu tượng bánh răng.
 * 8. Cấu hình triển khai:
 *    - Mô tả: stem-lab API v1
 *    - Thực thi dưới danh nghĩa: "Tôi" (Me - địa chỉ email của bạn)
 *    - Ai có quyền truy cập: "Mọi người" (Anyone) -> Rất quan trọng để Client có thể kết nối!
 * 9. Bấm nút "Triển khai" (Deploy). Google sẽ yêu cầu bạn cấp quyền (Authorize Access) -> Chọn tài khoản Google của bạn -> Bấm "Advanced" -> Chọn "Go to stem-lab API (unsafe)" -> Chọn "Allow".
 * 10. Copy URL ứng dụng web được cấp (định dạng: https://script.google.com/macros/s/.../exec).
 * 11. Dán URL này vào mục "Cấu hình Google Sheets API" trong tab Quản lý thiết bị của Giáo viên trên ứng dụng Web.
 */

// Định nghĩa các tên sheet cần tạo
const SHEETS = {
    BOOKINGS: 'bookings',
    DEVICES: 'devices'
};

// Hàm GET: Đọc dữ liệu từ Google Sheets trả về JSON cho Web App
function doGet(e) {
    const action = e.parameter.action;
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Tự động khởi tạo các sheet nếu chưa tồn tại
    initSheets(spreadsheet);
    
    let result = {};
    
    try {
        if (action === 'getBookings') {
            result = { success: true, data: readSheetData(spreadsheet, SHEETS.BOOKINGS) };
        } else if (action === 'getDevices') {
            result = { success: true, data: readSheetData(spreadsheet, SHEETS.DEVICES) };
        } else {
            // Trả về toàn bộ dữ liệu
            result = {
                success: true,
                bookings: readSheetData(spreadsheet, SHEETS.BOOKINGS),
                devices: readSheetData(spreadsheet, SHEETS.DEVICES)
            };
        }
    } catch (err) {
        result = { success: false, message: err.toString() };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
                         .setMimeType(ContentService.MimeType.JSON);
}

// Hàm POST: Đồng bộ dữ liệu từ Web App ghi vào Google Sheets & Gửi Telegram
function doPost(e) {
    let result = {};
    
    try {
        const postData = JSON.parse(e.postData.contents);
        const action = postData.action;
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        
        initSheets(spreadsheet);
        
        if (action === 'sync') {
            // 1. Đồng bộ danh sách Bookings (nếu được gửi kèm)
            if (postData.bookings) {
                writeToSheet(spreadsheet, SHEETS.BOOKINGS, postData.bookings);
            }
            
            // 2. Đồng bộ danh sách Devices (nếu được gửi kèm)
            if (postData.devices) {
                writeToSheet(spreadsheet, SHEETS.DEVICES, postData.devices);
            }
            
            result = { success: true, message: 'Đồng bộ Google Sheets thành công!' };
            
            // 3. Gửi thông báo Telegram tự động (nếu có yêu cầu)
            if (postData.notifyTelegram && postData.telegramToken && postData.telegramChatId && postData.notificationMessage) {
                sendTelegramMessage(postData.telegramToken, postData.telegramChatId, postData.notificationMessage);
            }
        } else {
            result = { success: false, message: 'Hành động không hợp lệ' };
        }
    } catch (err) {
        result = { success: false, message: err.toString() };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
                         .setMimeType(ContentService.MimeType.JSON);
}

// Khởi tạo các sheet nếu chưa có
function initSheets(spreadsheet) {
    let bookingsSheet = spreadsheet.getSheetByName(SHEETS.BOOKINGS);
    if (!bookingsSheet) {
        bookingsSheet = spreadsheet.insertSheet(SHEETS.BOOKINGS);
        // Thiết lập tiêu đề cột mẫu cho Bookings
        const headers = [
            'id', 'team_name', 'representative', 'zone', 'date', 'time_slot', 'slot_number',
            'device_requests', 'devices', 'purpose', 'status', 'role_creator',
            'is_urgent', 'urgent_reason', 'is_overtime', 'error_report', 'teacher_evaluation',
            'rating', 'review', 'created_at'
        ];
        bookingsSheet.appendRow(headers);
        bookingsSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E0E0E0');
    }
    
    let devicesSheet = spreadsheet.getSheetByName(SHEETS.DEVICES);
    if (!devicesSheet) {
        devicesSheet = spreadsheet.insertSheet(SHEETS.DEVICES);
        // Thiết lập tiêu đề cột mẫu cho Devices
        const headers = ['id', 'name', 'type', 'zone', 'status'];
        devicesSheet.appendRow(headers);
        devicesSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E0E0E0');
    }
}

// Đọc dữ liệu từ sheet trả về mảng Object
function readSheetData(spreadsheet, sheetName) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length <= 1) return []; // Chỉ có dòng tiêu đề hoặc trống
    
    const headers = values[0];
    const dataList = [];
    
    for (let r = 1; r < values.length; r++) {
        const row = values[r];
        const obj = {};
        for (let c = 0; c < headers.length; c++) {
            const header = headers[c];
            let cellValue = row[c];
            
            // Xử lý các trường JSON lưu dưới dạng chuỗi
            if (header === 'device_requests' || header === 'devices' || 
                header === 'error_report' || header === 'teacher_evaluation') {
                try {
                    cellValue = cellValue ? JSON.parse(cellValue) : (header === 'devices' ? [] : null);
                } catch (e) {
                    cellValue = header === 'devices' ? [] : null;
                }
            } else if (header === 'is_urgent' || header === 'is_overtime') {
                cellValue = (cellValue === true || cellValue === 'true');
            } else if (header === 'slot_number' || header === 'rating') {
                cellValue = cellValue !== '' ? Number(cellValue) : null;
            }
            
            obj[header] = cellValue;
        }
        dataList.push(obj);
    }
    
    return dataList;
}

// Ghi toàn bộ danh sách Object đè vào Sheet
function writeToSheet(spreadsheet, sheetName, dataList) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    // Clear toàn bộ trừ dòng tiêu đề thứ nhất
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, lastColumn).clearContent();
    }
    
    const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    const rowsToWrite = [];
    
    dataList.forEach(item => {
        const row = [];
        headers.forEach(header => {
            let val = item[header];
            
            // Chuyển object/array thành string JSON để lưu vào cell
            if (typeof val === 'object' && val !== null) {
                val = JSON.stringify(val);
            }
            row.push(val === undefined ? '' : val);
        });
        rowsToWrite.push(row);
    });
    
    if (rowsToWrite.length > 0) {
        sheet.getRange(2, 1, rowsToWrite.length, headers.length).setValues(rowsToWrite);
    }
}

// Gửi tin nhắn đến Telegram Bot API
function sendTelegramMessage(token, chatId, message) {
    const url = 'https://api.telegram.org/bot' + token + '/sendMessage';
    const payload = {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
    };
    
    const options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
    };
    
    try {
        UrlFetchApp.fetch(url, options);
    } catch (err) {
        Logger.log('Error sending Telegram message: ' + err.toString());
    }
}

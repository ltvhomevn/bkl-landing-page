/**
 * BKL HOME - Google Apps Script để nhận form submissions
 * 
 * HƯỚNG DẪN CÀI ĐẶT:
 * 1. Mở Google Sheets → Tạo bảng tính mới
 * 2. Đặt tên Sheet đầu tiên là "Leads"
 * 3. Thêm header ở hàng 1: Thời gian | Họ tên | SĐT | Email | Sản phẩm | Showroom
 * 4. Vào Extensions → Apps Script
 * 5. Xóa code mặc định, paste toàn bộ code này vào
 * 6. Click Deploy → New Deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. Copy URL deployment → dán vào file script.js của website
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Sheet "Leads" not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Thêm dữ liệu vào sheet
    sheet.appendRow([
      new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      data.fullName || '',
      data.phone || '',
      data.email || '',
      data.interest || '',
      data.showroom || ''
    ]);
    
    // Gửi thông báo Lark (nếu có webhook URL)
    const LARK_WEBHOOK = '%%LARK_WEBHOOK%%'; // Sẽ được thay thế bằng URL thực
    
    if (LARK_WEBHOOK && LARK_WEBHOOK !== '%%LARK_WEBHOOK%%') {
      const larkPayload = {
        msg_type: 'interactive',
        card: {
          header: {
            title: {
              tag: 'plain_text',
              content: '🔔 Khách hàng mới từ BKL Home!'
            },
            template: 'red'
          },
          elements: [
            {
              tag: 'div',
              text: {
                tag: 'lark_md',
                content: '👤 **Họ tên:** ' + (data.fullName || 'N/A') +
                  '\n📞 **SĐT:** ' + (data.phone || 'N/A') +
                  '\n✉️ **Email:** ' + (data.email || 'N/A') +
                  '\n🛒 **Quan tâm:** ' + (data.interest || 'N/A') +
                  '\n📍 **Showroom:** ' + (data.showroom || 'N/A') +
                  '\n⏰ **Thời gian:** ' + new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
              }
            },
            {
              tag: 'action',
              actions: [
                {
                  tag: 'button',
                  text: { tag: 'plain_text', content: '📞 Gọi ngay' },
                  type: 'primary',
                  url: 'tel:' + (data.phone || '')
                }
              ]
            }
          ]
        }
      };
      
      UrlFetchApp.fetch(LARK_WEBHOOK, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(larkPayload)
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Data saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'BKL Home Lead API is running'
  })).setMimeType(ContentService.MimeType.JSON);
}

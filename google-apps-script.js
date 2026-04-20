/**
 * BKL HOME - Google Apps Script (Proxy cho Lark Base + Lark Group)
 * 
 * Nhận form data từ website → Ghi vào Lark Base → Thông báo nhóm Lark
 * Không dùng Google Sheets nữa.
 */

// ===== CẤU HÌNH LARK =====
const LARK_APP_ID = 'cli_a96e086194b8deea';
const LARK_APP_SECRET = 'HYjYfDVpnMhzeXlbiRIyJD2qzRhBSrjP';
const LARK_BASE_APP_TOKEN = 'L41vbITT3aHXiGsFNYGlDfeCgJg';
const LARK_BASE_TABLE_ID = 'tbl1CEUi4YhCPOrG';
const LARK_API = 'https://open.larksuite.com/open-apis';

// Lấy Lark tenant access token
function getLarkToken() {
  const resp = UrlFetchApp.fetch(LARK_API + '/auth/v3/tenant_access_token/internal', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ app_id: LARK_APP_ID, app_secret: LARK_APP_SECRET })
  });
  const data = JSON.parse(resp.getContentText());
  if (data.code !== 0) throw new Error('Token error: ' + data.msg);
  return data.tenant_access_token;
}

// Ghi dữ liệu vào Lark Base
function writeToLarkBase(token, formData) {
  const now = new Date();
  const timestamp = now.getTime(); // milliseconds

  const record = {
    fields: {
      'Họ tên': formData.fullName || '',
      'SĐT': formData.phone || '',
      'Email': formData.email || '',
      'Sản phẩm': formData.interest || '',
      'Showroom': formData.showroom || '',
      'Thời gian': timestamp
    }
  };

  const resp = UrlFetchApp.fetch(
    LARK_API + '/bitable/v1/apps/' + LARK_BASE_APP_TOKEN + '/tables/' + LARK_BASE_TABLE_ID + '/records',
    {
      method: 'post',
      headers: { 'Authorization': 'Bearer ' + token },
      contentType: 'application/json',
      payload: JSON.stringify(record)
    }
  );
  return JSON.parse(resp.getContentText());
}

// Gửi thông báo vào nhóm Lark (tìm nhóm có bot)
function sendLarkGroupNotification(token, formData) {
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  // Tìm nhóm chat mà bot đã tham gia
  const chatsResp = UrlFetchApp.fetch(LARK_API + '/im/v1/chats?page_size=20', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const chatsData = JSON.parse(chatsResp.getContentText());
  
  if (!chatsData.data || !chatsData.data.items || chatsData.data.items.length === 0) {
    return { error: 'No chats found' };
  }

  // Tìm nhóm "BKL Home Leads"
  let chatId = null;
  for (const chat of chatsData.data.items) {
    if (chat.name && chat.name.indexOf('BKL') >= 0) {
      chatId = chat.chat_id;
      break;
    }
  }
  // Nếu không tìm thấy, dùng nhóm đầu tiên
  if (!chatId) chatId = chatsData.data.items[0].chat_id;

  // Map giá trị sản phẩm
  const productMap = {
    've-sinh': 'Thiết bị vệ sinh',
    'nha-bep': 'Thiết bị nhà bếp',
    'ca-hai': 'Cả hai',
    'khac': 'Khác'
  };
  const productText = productMap[formData.interest] || formData.interest || 'N/A';

  // Map giá trị showroom
  const showroomMap = {
    'ha-dong': '36V5 Văn Phú, Hà Đông',
    'thanh-xuan': '211 Nguyễn Xiển, Thanh Xuân'
  };
  const showroomText = showroomMap[formData.showroom] || formData.showroom || 'N/A';

  // Gửi tin nhắn dạng Interactive Card
  const cardMessage = {
    receive_id: chatId,
    msg_type: 'interactive',
    content: JSON.stringify({
      header: {
        title: { tag: 'plain_text', content: '🔔 Khách hàng mới từ BKL Home!' },
        template: 'red'
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: '👤 **Họ tên:** ' + (formData.fullName || 'N/A') +
              '\n📞 **SĐT:** ' + (formData.phone || 'N/A') +
              '\n✉️ **Email:** ' + (formData.email || 'N/A') +
              '\n🛒 **Quan tâm:** ' + productText +
              '\n📍 **Showroom:** ' + showroomText +
              '\n⏰ **Thời gian:** ' + now
          }
        },
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: { tag: 'plain_text', content: '📞 Gọi ngay: ' + (formData.phone || '') },
              type: 'primary',
              url: 'tel:' + (formData.phone || '')
            },
            {
              tag: 'button',
              text: { tag: 'plain_text', content: '📊 Xem Lark Base' },
              type: 'default',
              url: 'https://bklgroup.sg.larksuite.com/base/' + LARK_BASE_APP_TOKEN
            }
          ]
        }
      ]
    })
  };

  const msgResp = UrlFetchApp.fetch(LARK_API + '/im/v1/messages?receive_id_type=chat_id', {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + token },
    contentType: 'application/json',
    payload: JSON.stringify(cardMessage)
  });
  return JSON.parse(msgResp.getContentText());
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // 1. Lấy token Lark
    const token = getLarkToken();
    
    // 2. Ghi vào Lark Base
    const baseResult = writeToLarkBase(token, data);
    
    // 3. Thông báo nhóm Lark
    let msgResult = { status: 'skipped' };
    try {
      msgResult = sendLarkGroupNotification(token, data);
    } catch(msgErr) {
      msgResult = { error: msgErr.toString() };
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      base: baseResult,
      message: msgResult
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
    message: 'BKL Home Lark API is running'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Test function
function testPost() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        fullName: 'Test User',
        phone: '0912345678',
        email: 'test@bklhome.com',
        interest: 've-sinh',
        showroom: 'ha-dong'
      })
    }
  };
  const result = doPost(testData);
  Logger.log(result.getContent());
}

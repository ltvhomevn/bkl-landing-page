/**
 * BKL HOME - Google Apps Script
 * Ghi data qua Lark Automation Webhook (không cần phân quyền Bitable)
 * Gửi thông báo nhóm qua Lark API
 */

const LARK_APP_ID = 'cli_a96e086194b8deea';
const LARK_APP_SECRET = 'HYjYfDVpnMhzeXlbiRIyJD2qzRhBSrjP';
const LARK_BASE_WEBHOOK = 'https://bklgroup.sg.larksuite.com/base/automation/hook/L41vbITT3aHXiGsFNYGlDfeCgJg/ajpC9Y0PIm';
const LARK_BASE_URL = 'https://bklgroup.sg.larksuite.com/base/L41vbITT3aHXiGsFNYGlDfeCgJg';

function getLarkToken() {
  const resp = UrlFetchApp.fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ app_id: LARK_APP_ID, app_secret: LARK_APP_SECRET })
  });
  return JSON.parse(resp.getContentText()).tenant_access_token;
}

function writeToLarkBase(formData) {
  // Gửi qua Automation Webhook
  const payload = {
    name: formData.fullName || '',
    phone: formData.phone || '',
    email: formData.email || '',
    product: formData.interest || '',
    showroom: formData.showroom || ''
  };
  
  const resp = UrlFetchApp.fetch(LARK_BASE_WEBHOOK, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  
  return resp.getContentText();
}

function sendLarkGroupNotification(token, formData) {
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  
  // Lấy danh sách nhóm chat của Bot
  const chatsResp = UrlFetchApp.fetch('https://open.larksuite.com/open-apis/im/v1/chats?page_size=20', {
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  });
  const chatsData = JSON.parse(chatsResp.getContentText());
  
  if (!chatsData.data || !chatsData.data.items || chatsData.data.items.length === 0) return { error: 'No chats found' };
  
  let chatId = null;
  for (const chat of chatsData.data.items) {
    if (chat.name && chat.name.indexOf('BKL') >= 0) { chatId = chat.chat_id; break; }
  }
  if (!chatId) chatId = chatsData.data.items[0].chat_id;
  
  const productMap = {'ve-sinh':'Thiết bị vệ sinh','nha-bep':'Thiết bị nhà bếp','ca-hai':'Cả hai','khac':'Khác'};
  const showroomMap = {'ha-dong':'36V5 Văn Phú, Hà Đông','thanh-xuan':'211 Nguyễn Xiển, Thanh Xuân'};
  const productText = productMap[formData.interest] || formData.interest || 'N/A';
  const showroomText = showroomMap[formData.showroom] || formData.showroom || 'N/A';
  
  const cardMessage = {
    receive_id: chatId, msg_type: 'interactive',
    content: JSON.stringify({
      header: { title: { tag: 'plain_text', content: '🔔 KHÁCH HÀNG MỚI ĐĂNG KÝ!' }, template: 'red' },
      elements: [
        { tag: 'div', text: { tag: 'lark_md', content: '👤 **Họ tên:** ' + (formData.fullName||'N/A') + '\n📞 **SĐT:** ' + (formData.phone||'N/A') + '\n✉️ **Email:** ' + (formData.email||'N/A') + '\n🛒 **Quan tâm:** ' + productText + '\n📍 **Showroom:** ' + showroomText + '\n⏰ **Thời gian:** ' + now }},
        { tag: 'action', actions: [
          { tag: 'button', text: { tag: 'plain_text', content: '📞 Gọi ngay: ' + (formData.phone||'') }, type: 'primary', url: 'tel:' + (formData.phone||'') },
          { tag: 'button', text: { tag: 'plain_text', content: '📊 Mở Lark Base' }, type: 'default', url: LARK_BASE_URL }
        ]}
      ]
    })
  };
  
  const msgResp = UrlFetchApp.fetch('https://open.larksuite.com/open-apis/im/v1/messages?receive_id_type=chat_id', {
    method: 'post', headers: { 'Authorization': 'Bearer ' + token }, contentType: 'application/json', payload: JSON.stringify(cardMessage), muteHttpExceptions: true
  });
  return JSON.parse(msgResp.getContentText());
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // 1. Ghi vào Lark Base qua Webhook
    const baseResult = writeToLarkBase(data);
    
    // 2. Gửi thông báo
    const token = getLarkToken();
    let msgResult = sendLarkGroupNotification(token, data);
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', base: baseResult, message: msgResult })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'BKL Home API is running v3' })).setMimeType(ContentService.MimeType.JSON);
}

// Test webhook functionality
function testWebhook() {
  const e = {
    postData: {
      contents: JSON.stringify({
        fullName: 'Test Automation',
        phone: '0999888777',
        email: 'test@automation.com',
        interest: 'nha-bep',
        showroom: 'thanh-xuan'
      })
    }
  };
  const result = doPost(e);
  console.log(result.getContent());
}

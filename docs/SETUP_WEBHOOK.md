# Hướng dẫn Setup Facebook Webhook

**Ngày**: 2026-07-18  
**Ngrok URL**: https://overrun-profile-footpad.ngrok-free.dev  
**Frontend**: http://localhost:4040  
**Backend**: http://localhost:3000

---

## ✅ Status hiện tại

- [x] Backend đang chạy port 3000
- [x] Ngrok expose backend qua HTTPS
- [x] Webhook verification endpoint hoạt động
- [x] Frontend port 4040 đã config
- [x] Facebook App ID/Secret đã cấu hình
- [ ] **Cần setup**: Webhook trên Facebook App
- [ ] **Cần setup**: OAuth Redirect URI

---

## 🔧 Bước 1: Configure Facebook Webhook

### 1.1. Truy cập Facebook App Dashboard
URL: https://developers.facebook.com/apps/3152359134965583/dashboard

### 1.2. Add Messenger Product (nếu chưa có)
1. Dashboard → Click **"Add Product"**
2. Tìm **Messenger** → Click **"Set Up"**

### 1.3. Configure Webhooks
1. Vào **Messenger → Settings**
2. Scroll xuống section **"Webhooks"**
3. Click **"Add Callback URL"** (hoặc "Edit Callback URL" nếu đã có)

**Điền thông tin**:
```
Callback URL: https://overrun-profile-footpad.ngrok-free.dev/webhook/facebook
Verify Token: vietnamese_ai_webhook_verify_2026
```

**Subscription Fields** - Tick các field sau:
- ✅ `messages`
- ✅ `messaging_postbacks`
- ✅ `message_deliveries`
- ✅ `message_reads`

4. Click **"Verify and Save"**

✅ Facebook sẽ gọi endpoint và verify token → Nếu đúng sẽ hiện "Complete"

### 1.4. Subscribe Page to Webhook
1. Vẫn ở section **"Webhooks"**
2. Phần **"Select a Page to subscribe your webhook..."**
3. Click **"Add or Remove Pages"**
4. Chọn Facebook Page của bạn
5. Click **"Subscribe"**

✅ Page đã được subscribe! Khi có tin nhắn mới → Facebook gửi webhook về backend.

---

## 🔐 Bước 2: Configure OAuth Redirect URI

### 2.1. App Domains
1. Vào **Settings → Basic**
2. Scroll xuống **"App Domains"**
3. Thêm: `localhost`
4. Click **"Save Changes"**

### 2.2. Facebook Login Settings
1. Dashboard → **Add Product** → tìm **Facebook Login** → **Set Up**
2. Settings → **Valid OAuth Redirect URIs**
3. Thêm URLs:
```
http://localhost:4040/accounts/callback
https://overrun-profile-footpad.ngrok-free.dev/accounts/callback
```
4. Click **"Save Changes"**

---

## 🧪 Bước 3: Test OAuth Flow

### 3.1. Khởi động ứng dụng

**Terminal 1 - Backend** (đã chạy):
```bash
cd D:/AI/vietnamese-demo
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd D:/AI/vietnamese-demo/frontend
npm run dev
```

**Terminal 3 - Ngrok** (đã chạy):
```bash
ngrok http 3000
```

### 3.2. Test kết nối
1. Truy cập: http://localhost:4040
2. Đăng nhập: `demo@vietnamese.ai` / `demo123456`
3. Vào trang **Accounts**
4. Click **"Kết nối Facebook"**
5. Sẽ redirect đến Facebook OAuth dialog
6. Chọn Page muốn kết nối
7. Click **"Continue"**
8. Redirect về app → Page đã kết nối thành công! ✨

---

## 📨 Bước 4: Test Nhận Tin Nhắn

### 4.1. Cách test
1. Mở Facebook Page của bạn
2. Gửi tin nhắn test từ một tài khoản Facebook khác
   - Hoặc dùng **Page inbox** ở https://www.facebook.com/your-page/inbox/
3. Kiểm tra backend logs → sẽ thấy:
   ```
   [INFO] Processing incoming message { mid: "...", senderId: "..." }
   [INFO] Created new conversation { conversationId: "..." }
   [INFO] Message queued for AI processing
   ```
4. Vào app → trang **Conversations** → tin nhắn xuất hiện
5. AI tự động reply (nếu auto_reply_mode = automatic)

---

## 🐛 Troubleshooting

### Webhook verification failed
**Lỗi**: "The URL couldn't be validated. Response does not match challenge..."

**Nguyên nhân**: Verify token không đúng hoặc backend không chạy

**Giải pháp**:
```bash
# Test endpoint trực tiếp
curl -G "https://overrun-profile-footpad.ngrok-free.dev/webhook/facebook" \
  --data-urlencode "hub.mode=subscribe" \
  --data-urlencode "hub.verify_token=vietnamese_ai_webhook_verify_2026" \
  --data-urlencode "hub.challenge=test"
  
# Nếu backend OK, sẽ trả về: test
```

### OAuth redirect error
**Lỗi**: "URL Blocked: This redirect failed because the redirect URI is not whitelisted..."

**Giải pháp**:
- Kiểm tra **Facebook Login → Valid OAuth Redirect URIs** đã thêm chính xác:
  - `http://localhost:4040/accounts/callback`

### Không nhận được tin nhắn webhook
**Nguyên nhân**: Page chưa subscribe webhook

**Giải pháp**:
1. Vào **Messenger → Settings → Webhooks**
2. Kiểm tra Page đã Subscribe chưa
3. Nếu chưa → Click "Subscribe" cho Page

### Token expired
**Lỗi**: "Error validating access token: Session has expired..."

**Giải pháp**:
- Page access token là **permanent**, không expire
- Nếu gặp lỗi → reconnect lại Page qua OAuth flow

---

## 📋 Checklist

- [ ] Webhook Callback URL đã verify thành công
- [ ] Page đã subscribe webhook
- [ ] OAuth Redirect URI đã whitelist
- [ ] Test OAuth flow thành công (kết nối Page)
- [ ] Test nhận tin nhắn thành công

---

## 💡 Notes

- **Dev mode**: App chỉ hoạt động với Page của admin/developer. Thêm test users ở **Roles → Test Users**
- **Ngrok free**: URL thay đổi mỗi lần restart → cần update lại Callback URL trên Facebook
- **Production**: Deploy lên Railway/Heroku → dùng domain cố định thay vì ngrok

---

**App ID**: 3152359134965583  
**Verify Token**: vietnamese_ai_webhook_verify_2026  
**Webhook URL**: https://overrun-profile-footpad.ngrok-free.dev/webhook/facebook  
**OAuth Redirect**: http://localhost:4040/accounts/callback

---

Sau khi setup xong, test bằng cách gửi tin nhắn đến Page → backend logs sẽ hiện webhook events! 🚀

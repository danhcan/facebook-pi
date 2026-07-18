# Facebook OAuth Setup Guide

Hướng dẫn cấu hình Facebook App để kết nối thật với Messenger API.

---

## 📋 Prerequisites

- Tài khoản Facebook Developer
- Facebook Page để test (hoặc tạo Page mới)
- Ngrok hoặc domain có HTTPS (để nhận webhook)

---

## 🚀 Bước 1: Tạo Facebook App

1. Truy cập: https://developers.facebook.com/apps/create/
2. Chọn **"Business"** → Tiếp tục
3. Chọn use case: **"Other"** → Tiếp tục
4. Chọn app type: **"Business"**
5. Điền thông tin:
   - **App Name**: `Vietnamese Messenger AI` (hoặc tên bạn muốn)
   - **App Contact Email**: email của bạn
6. Click **"Create App"**

---

## 🔑 Bước 2: Lấy App ID & Secret

1. Sau khi tạo xong, vào **Settings → Basic**
2. Copy **App ID**
3. Click **"Show"** để copy **App Secret**
4. Lưu lại 2 giá trị này

---

## 📱 Bước 3: Add Messenger Product

1. Dashboard → Click **"Add Product"**
2. Tìm **Messenger** → Click **"Set Up"**
3. Trong **Messenger Settings**:
   - Scroll xuống **"Access Tokens"** section
   - Click **"Add or Remove Pages"**
   - Chọn Facebook Page của bạn (hoặc tạo Page mới)
   - Authorize app để quản lý Page

---

## 🌐 Bước 4: Setup Ngrok (Local Development)

### Cài đặt Ngrok

```bash
# Download từ: https://ngrok.com/download
# Hoặc dùng npm
npm install -g ngrok

# Chạy ngrok để expose port 3000
ngrok http 3000
```

Ngrok sẽ tạo URL dạng: `https://abc123.ngrok-free.app`

**Lưu ý**: Mỗi lần chạy ngrok sẽ tạo URL mới (trừ khi dùng tài khoản trả phí)

---

## 🔗 Bước 5: Configure Webhooks

1. Trong **Messenger Settings** → scroll xuống **"Webhooks"**
2. Click **"Add Callback URL"**
3. Điền thông tin:
   - **Callback URL**: `https://your-ngrok-url.ngrok-free.app/webhook/facebook`
   - **Verify Token**: tự đặt (ví dụ: `my_secure_verify_token_123`)
   - **Subscription Fields**: Tick các fields sau:
     - `messages`
     - `messaging_postbacks` 
     - `message_deliveries`
     - `message_reads`
4. Click **"Verify and Save"**

**Lưu ý**: Backend phải đang chạy khi verify webhook!

---

## ⚙️ Bước 6: Update .env

Thêm credentials vào file `.env`:

```env
# Facebook App Credentials
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
FACEBOOK_WEBHOOK_VERIFY_TOKEN=my_secure_verify_token_123
```

**Lưu ý**: 
- `FACEBOOK_WEBHOOK_VERIFY_TOKEN` phải giống với token đã điền ở Bước 5
- Không commit `.env` vào git!

---

## 🔄 Bước 7: Subscribe Page to Webhooks

1. Trong **Messenger Settings** → **Webhooks**
2. Ở section **"Select a Page to subscribe your webhook..."**
3. Chọn Page của bạn
4. Click **"Subscribe"**

✅ Bây giờ Page đã được subscribe! Mỗi khi có tin nhắn mới, Facebook sẽ gửi webhook về backend.

---

## ✅ Bước 8: Test OAuth Flow

1. Khởi động backend:
   ```bash
   npm run dev
   ```

2. Khởi động frontend (terminal khác):
   ```bash
   cd frontend
   npm run dev
   ```

3. Truy cập: http://localhost:5173
4. Login vào app
5. Vào **Accounts** page
6. Click **"Kết nối Facebook"**
7. Sẽ redirect đến Facebook OAuth dialog
8. Chọn Page muốn kết nối → **"Continue"**
9. Sau khi authorize xong, sẽ redirect về app
10. Page đã được kết nối thành công! ✨

---

## 🧪 Bước 9: Test Nhận Tin Nhắn

1. Mở Facebook Page của bạn
2. Gửi tin nhắn test từ Facebook Messenger (user khác hoặc dùng Page inbox test)
3. Kiểm tra backend logs → webhook nhận được message
4. Kiểm tra **Conversations** page → tin nhắn xuất hiện
5. AI sẽ tự động reply nếu auto_reply_mode = automatic

---

## 🚨 Troubleshooting

### Webhook verification failed

**Nguyên nhân**: Verify token không đúng hoặc backend không chạy

**Giải pháp**:
- Kiểm tra `FACEBOOK_WEBHOOK_VERIFY_TOKEN` trong `.env` khớp với token đã điền ở Facebook
- Đảm bảo backend đang chạy và ngrok đang expose port đúng
- Test endpoint: `curl https://your-ngrok-url/webhook/facebook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test`

### OAuth redirect error

**Nguyên nhân**: Redirect URI không đúng

**Giải pháp**:
- Vào Facebook App → **Settings → Basic**
- Scroll xuống **"App Domains"**
- Thêm domain: `localhost` (dev) hoặc production domain
- Vào **Messenger → Settings → Redirect URI Whitelist**
- Thêm: `http://localhost:5173/accounts/callback` (dev)

### Không nhận được webhook

**Nguyên nhân**: Page chưa subscribe webhook

**Giải pháp**:
- Vào **Messenger Settings → Webhooks**
- Kiểm tra Page đã được subscribe chưa
- Nếu chưa, click "Subscribe" cho Page

### Token expired

**Nguyên nhân**: Page access token hết hạn (hiếm gặp - Page token thường permanent)

**Giải pháp**:
- Vào **Accounts** page
- Click **"Làm mới"** (Refresh) button để renew token

---

## 🔐 Security Notes

- ✅ **Webhook signature verification** đã được implement (X-Hub-Signature-256)
- ✅ **Access token encryption** trong database
- ✅ **OAuth state parameter** để prevent CSRF
- ✅ **HTTPS required** cho webhook (Facebook yêu cầu)

---

## 📚 References

- [Facebook Login for Business](https://developers.facebook.com/docs/facebook-login/for-business)
- [Messenger Platform Overview](https://developers.facebook.com/docs/messenger-platform)
- [Webhooks Setup](https://developers.facebook.com/docs/messenger-platform/webhooks)
- [Send API Reference](https://developers.facebook.com/docs/messenger-platform/send-messages)

---

## 🎯 Production Deployment

Khi deploy lên production:

1. Update webhook URL trong Facebook App:
   - Thay ngrok URL bằng production domain
   - VD: `https://your-app.railway.app/webhook/facebook`

2. Update `.env` trên production server với credentials thật

3. Update **App Domains** và **Redirect URI Whitelist** với production domain

4. Submit app for review nếu cần public (App ở dev mode chỉ hoạt động với admin/tester)

---

## 💡 Tips

- **Dev mode**: App chỉ hoạt động với Page của admin/developer/tester
- **Public mode**: Cần submit app review để public sử dụng
- **Page token**: Permanent, không expire (user token mới expire)
- **Test users**: Thêm test users ở **Roles → Test Users** để test

---

**Cần hỗ trợ?** Xem logs ở backend console hoặc Facebook App → **Messenger → Error Logs**

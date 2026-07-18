# Implementation Plan: Facebook OAuth Integration

**Date**: 2026-07-18  
**Feature Branch**: `feature/facebook-oauth-integration`  
**Estimated Time**: 30-45 minutes

---

## 🎯 Objectives

1. Cấu hình Facebook App để lấy App ID/Secret
2. Setup Webhook để nhận tin nhắn realtime
3. Cập nhật frontend để dùng OAuth flow thật
4. Test toàn bộ luồng kết nối Facebook Page

---

## 📋 Prerequisites

### **Bước 1: Tạo Facebook App**

1. Truy cập: https://developers.facebook.com/apps/create/
2. Chọn **"Business"** → **"Messenger"**
3. Điền thông tin:
   - App Name: `Vietnamese Messenger AI` (hoặc tên bạn muốn)
   - App Contact Email: email của bạn
4. Click **"Create App"**
5. Sau khi tạo xong, vào **Settings → Basic**:
   - Copy **App ID**
   - Copy **App Secret** (click "Show")

### **Bước 2: Add Messenger Product**

1. Dashboard → **Add Product** → chọn **Messenger**
2. Trong **Messenger Settings**:
   - Scroll xuống **"Webhooks"** section
   - Click **"Add Callback URL"**
   - Callback URL: `https://your-domain.com/api/webhooks/facebook` (tạm để localhost sau sẽ dùng ngrok)
   - Verify Token: tự đặt (ví dụ: `my_secure_verify_token_123`)
   - Subscription Fields: tick `messages`, `messaging_postbacks`

### **Bước 3: Setup Ngrok (để test local)**

```bash
# Download ngrok: https://ngrok.com/download
# Run ngrok để expose local backend (port 3000)
ngrok http 3000
```

Ngrok sẽ tạo URL dạng: `https://abc123.ngrok.io`

Quay lại Facebook App → Webhooks:
- Callback URL: `https://abc123.ngrok.io/api/webhooks/facebook`
- Verify Token: giống token bạn đặt ở Bước 2
- Click **"Verify and Save"**

### **Bước 4: Thêm Test Page**

1. Facebook App → **Messenger → Settings**
2. Scroll xuống **"Access Tokens"**
3. Click **"Add or Remove Pages"**
4. Chọn Facebook Page của bạn (hoặc tạo Page test)
5. Generate Page Access Token (lưu lại để test)

---

## 📝 Implementation Tasks

### **Phase 1: Backend Configuration (Priority: HIGH)**

**Task 1.1**: Update `.env` với Facebook credentials
```env
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
FACEBOOK_WEBHOOK_VERIFY_TOKEN=my_secure_verify_token_123
```

**Task 1.2**: Verify Facebook API service đã hoạt động
- Run backend với config mới
- Test endpoint: `GET /api/accounts/facebook-status` → should return `{ "configured": true }`

**Files**:
- `.env`
- `src/services/facebook-api.ts` (đã có sẵn)
- `src/routes/accounts.ts` (đã có sẵn)

---

### **Phase 2: Frontend OAuth Flow (Priority: HIGH)**

**Task 2.1**: Update Accounts page với OAuth flow thật

**Current flow (demo)**:
```tsx
// Tạo fake code → POST /api/accounts/connect
```

**New flow (real)**:
```tsx
// 1. GET /api/accounts/oauth/url → lấy OAuth URL
// 2. Redirect browser → Facebook Login Dialog
// 3. Facebook redirect về /accounts/callback?code=xxx&state=yyy
// 4. POST /api/accounts/connect với code → backend exchange token
```

**Files to modify**:
- `frontend/src/pages/Accounts.tsx`
- Add new route: `frontend/src/pages/AccountsCallback.tsx` (OAuth callback handler)
- `frontend/src/App.tsx` (add callback route)

---

### **Phase 3: Webhook Handler (Priority: MEDIUM)**

**Task 3.1**: Create webhook route để nhận tin nhắn từ Facebook

**Logic**:
1. Facebook POST webhook khi có tin nhắn mới
2. Verify signature (X-Hub-Signature-256)
3. Parse entry → messages
4. Tạo/update Conversation + Message trong DB
5. Trigger AI response (đã có sẵn trong message-processor)

**Files**:
- Create: `src/routes/webhooks.ts`
- Update: `src/app.ts` (register webhook route)
- Create: `src/services/webhook-handler.ts` (process webhook events)

---

### **Phase 4: Testing & Documentation (Priority: LOW)**

**Task 4.1**: Manual testing
- [ ] Connect Facebook Page via OAuth
- [ ] Gửi tin nhắn từ Facebook Messenger → webhook nhận được
- [ ] AI auto-reply hoạt động
- [ ] Zalo call escalation trigger khi confidence thấp

**Task 4.2**: Update README
- [ ] Add Facebook App setup guide
- [ ] Add ngrok setup for local development
- [ ] Add troubleshooting section

**Files**:
- `README.md`
- `docs/FACEBOOK_SETUP.md` (new guide)

---

## 🔧 Technical Details

### **OAuth Flow Sequence**

```
User clicks "Kết nối Facebook"
  ↓
Frontend: GET /api/accounts/oauth/url
  ↓
Backend: Generate OAuth URL with state (CSRF token)
  ↓
Frontend: Redirect browser to Facebook OAuth Dialog
  ↓
User authorizes app
  ↓
Facebook: Redirect to /accounts/callback?code=xxx&state=yyy
  ↓
Frontend: Capture code & state
  ↓
Frontend: POST /api/accounts/connect { code, redirect_uri }
  ↓
Backend: Exchange code → user token → long-lived token → get pages
  ↓
Backend: Save FacebookAccount with page access token (encrypted)
  ↓
Frontend: Show success message + refresh account list
```

### **Webhook Event Processing**

```
Facebook: POST /api/webhooks/facebook
  ↓
Verify webhook signature (X-Hub-Signature-256)
  ↓
Parse entry → object=page, entry[].messaging[]
  ↓
For each message:
  - Find/create Conversation (by participantFacebookId + accountId)
  - Create Message (direction: inbound)
  - Queue job: process-message (BullMQ)
  ↓
Message Processor (already implemented):
  - AI generate response
  - If confidence low → create Zalo call request
  - Send reply via Facebook Send API
```

---

## 🚀 Deployment Notes

### **Production Webhook URL**

Khi deploy lên production (Railway, Heroku, etc.):
1. Update Facebook App webhook URL: `https://your-production-domain.com/api/webhooks/facebook`
2. Verify webhook với production URL
3. Update `.env` trên production với FACEBOOK_* credentials

### **Security**

- ✅ Webhook signature verification (prevent spoofing)
- ✅ Access token encryption (đã có sẵn trong DB)
- ✅ OAuth state parameter (CSRF protection)
- ✅ HTTPS required (Facebook yêu cầu)

---

## 📊 Success Metrics

- [ ] Facebook OAuth flow hoàn tất (connect page thành công)
- [ ] Webhook nhận được tin nhắn từ Messenger
- [ ] AI auto-reply hoạt động với tin nhắn thật
- [ ] Token refresh mechanism hoạt động
- [ ] No console errors trong frontend/backend

---

## 🔗 References

- Facebook Login for Business: https://developers.facebook.com/docs/facebook-login/for-business
- Messenger Platform: https://developers.facebook.com/docs/messenger-platform
- Webhooks: https://developers.facebook.com/docs/messenger-platform/webhooks
- Send API: https://developers.facebook.com/docs/messenger-platform/send-messages

---

## ⚠️ Known Issues & Workarounds

1. **Local development với Webhook**: Dùng ngrok để expose localhost
2. **Facebook App Review**: App ở dev mode chỉ kết nối được Page của admin/tester. Production cần app review.
3. **Token expiration**: Page access token không expire nhưng user token có thể invalidate → cần handle token refresh

---

## 📝 Notes

- Code OAuth logic đã có sẵn trong `src/routes/accounts.ts` và `src/services/facebook-api.ts`
- Chỉ cần cấu hình `.env` và update frontend OAuth flow
- Webhook handler là phần mới cần implement

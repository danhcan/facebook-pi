# Implementation Plan: LLM Integration & Zalo Call Escalation

**Date**: 2026-07-18  
**Feature Branch**: `feature/llm-integration-zalo-escalation`  
**Estimated Time**: 2-3 hours

---

## 🎯 Objectives

1. Tích hợp LLM custom provider (OmniRoute) thay thế rule-based AI
2. Thêm tính năng chuyển tiếp Zalo call khi gặp câu hỏi khó
3. WebSocket realtime notifications cho nhân viên
4. UI quản lý LLM settings và Zalo call requests

---

## 📋 Implementation Tasks

### **Phase 1: Database Schema (Priority: HIGH)**

**Task 1.1**: Update Prisma schema
- [ ] Add `ZaloCallRequest` model
- [ ] Add monitoring fields to `AiResponse` (provider, modelUsed, tokensUsed, latencyMs, errorMessage)
- [ ] Run migration
- [ ] Update seed data

**Files**:
- `prisma/schema.prisma`
- `prisma/seed.ts`

---

### **Phase 2: Backend - LLM Integration (Priority: HIGH)**

**Task 2.1**: Create LLM client service
- [ ] Create `src/services/llm-client.ts`
- [ ] Implement OpenAI-compatible API client
- [ ] Add retry logic (3 attempts, exponential backoff)
- [ ] Add timeout handling (30s)
- [ ] Add error logging

**Task 2.2**: Update config
- [ ] Add LLM config to `src/config/index.ts`
- [ ] Update `.env.example` with LLM variables
- [ ] Create `.env` with actual values

**Task 2.3**: Upgrade AI Responder
- [ ] Refactor `src/services/ai-responder.ts`
- [ ] Build conversation context (5 messages history)
- [ ] Search relevant knowledge base
- [ ] Format system prompt
- [ ] Call LLM API
- [ ] Parse response + extract confidence
- [ ] Fallback to rule-based on error

**Task 2.4**: Create Settings API
- [ ] Create `src/routes/settings.ts`
- [ ] `GET /api/settings/llm` - Get LLM config
- [ ] `PUT /api/settings/llm` - Update LLM config
- [ ] `POST /api/settings/llm/test` - Test connection
- [ ] Add to `src/app.ts`

**Files**:
- `src/services/llm-client.ts` (new)
- `src/config/index.ts` (edit)
- `.env.example` (edit)
- `src/services/ai-responder.ts` (edit)
- `src/routes/settings.ts` (new)
- `src/app.ts` (edit)

**Tests**:
- `tests/integration/llm-client.test.ts` (new)
- `tests/integration/ai-responder.test.ts` (edit)
- `tests/integration/settings.test.ts` (new)

---

### **Phase 3: Backend - Zalo Call Escalation (Priority: HIGH)**

**Task 3.1**: Create call escalation service
- [ ] Create `src/services/call-escalation.ts`
- [ ] Implement confidence check (< 0.6)
- [ ] Create ZaloCallRequest with priority
- [ ] Send notification message to customer
- [ ] Trigger WebSocket notification

**Task 3.2**: Create Zalo Calls API
- [ ] Create `src/routes/zalo-calls.ts`
- [ ] `GET /api/zalo-calls` - List requests (filter by status)
- [ ] `GET /api/zalo-calls/:id` - Get request detail
- [ ] `POST /api/zalo-calls/:id/assign` - Assign to user
- [ ] `POST /api/zalo-calls/:id/complete` - Mark complete + notes
- [ ] `POST /api/zalo-calls/:id/cancel` - Cancel request
- [ ] Add to `src/app.ts`

**Files**:
- `src/services/call-escalation.ts` (new)
- `src/routes/zalo-calls.ts` (new)
- `src/app.ts` (edit)

**Tests**:
- `tests/integration/call-escalation.test.ts` (new)
- `tests/integration/zalo-calls.test.ts` (new)

---

### **Phase 4: Backend - WebSocket Notifications (Priority: MEDIUM)**

**Task 4.1**: Setup WebSocket server
- [ ] Install dependencies: `ws`, `@types/ws`
- [ ] Create `src/services/websocket.ts`
- [ ] Setup WS server on `/ws`
- [ ] Handle authentication (JWT from query)
- [ ] Broadcast notifications to connected clients
- [ ] Integrate with Express app

**Task 4.2**: Integration with call escalation
- [ ] Emit event when new ZaloCallRequest created
- [ ] Emit event when request assigned
- [ ] Emit event when request completed

**Files**:
- `src/services/websocket.ts` (new)
- `src/app.ts` (edit)
- `src/services/call-escalation.ts` (edit)
- `package.json` (edit - add ws)

---

### **Phase 5: Frontend - LLM Settings UI (Priority: MEDIUM)**

**Task 5.1**: Create Settings page
- [ ] Create `frontend/src/pages/Settings.tsx`
- [ ] Form: Base URL, API Key (masked), Model, Temperature, Max Tokens
- [ ] "Test Connection" button with loading state
- [ ] "Save" button with validation
- [ ] Success/error toast notifications

**Task 5.2**: Add Settings API client
- [ ] Add to `frontend/src/services/api.ts`
- [ ] `getLLMSettings()`
- [ ] `updateLLMSettings()`
- [ ] `testLLMConnection()`

**Task 5.3**: Add route to app
- [ ] Update `frontend/src/App.tsx`
- [ ] Add `/settings` route
- [ ] Update `frontend/src/components/Layout.tsx` - Add menu item

**Files**:
- `frontend/src/pages/Settings.tsx` (new)
- `frontend/src/services/api.ts` (edit)
- `frontend/src/App.tsx` (edit)
- `frontend/src/components/Layout.tsx` (edit)

---

### **Phase 6: Frontend - Zalo Calls Management (Priority: HIGH)**

**Task 6.1**: Create ZaloCalls page
- [ ] Create `frontend/src/pages/ZaloCalls.tsx`
- [ ] Tabs: Pending, Assigned, Completed, All
- [ ] List view with filters (priority, date range)
- [ ] Request card: customer name, reason, priority badge, timestamp
- [ ] "Nhận task" button (pending only)
- [ ] "Hoàn thành" modal with notes textarea
- [ ] "Hủy" button with confirmation

**Task 6.2**: Add Zalo Calls API client
- [ ] Add to `frontend/src/services/api.ts`
- [ ] `getZaloCalls(filters)`
- [ ] `assignZaloCall(id)`
- [ ] `completeZaloCall(id, notes)`
- [ ] `cancelZaloCall(id)`

**Task 6.3**: Add route and menu
- [ ] Update `frontend/src/App.tsx` - Add `/zalo-calls` route
- [ ] Update `frontend/src/components/Layout.tsx` - Add menu item with badge

**Files**:
- `frontend/src/pages/ZaloCalls.tsx` (new)
- `frontend/src/services/api.ts` (edit)
- `frontend/src/App.tsx` (edit)
- `frontend/src/components/Layout.tsx` (edit)

---

### **Phase 7: Frontend - WebSocket Integration (Priority: MEDIUM)**

**Task 7.1**: Create WebSocket service
- [ ] Create `frontend/src/services/websocket.ts`
- [ ] Connect to `/ws` with JWT token
- [ ] Handle reconnection logic
- [ ] Event emitter pattern for notifications

**Task 7.2**: Create notification hook
- [ ] Create `frontend/src/hooks/useNotifications.ts`
- [ ] Listen to WebSocket events
- [ ] Show toast notifications
- [ ] Play sound alert (optional)
- [ ] Update badge counts

**Task 7.3**: Integrate with Layout
- [ ] Update `frontend/src/components/Layout.tsx`
- [ ] Initialize WebSocket connection
- [ ] Display notification badge on Zalo Calls menu
- [ ] Show toast on new request

**Files**:
- `frontend/src/services/websocket.ts` (new)
- `frontend/src/hooks/useNotifications.ts` (new)
- `frontend/src/components/Layout.tsx` (edit)

---

### **Phase 8: Frontend - Dashboard Widgets (Priority: LOW)**

**Task 8.1**: Add Zalo Call widgets to Dashboard
- [ ] Update `frontend/src/pages/Dashboard.tsx`
- [ ] Widget: Pending call requests count
- [ ] Widget: Today's completed calls
- [ ] Widget: Average response time

**Files**:
- `frontend/src/pages/Dashboard.tsx` (edit)

---

### **Phase 9: Frontend - AI Response UI Updates (Priority: LOW)**

**Task 9.1**: Show escalation info in AI Responses page
- [ ] Update `frontend/src/pages/AiResponses.tsx`
- [ ] Display "Zalo Call Requested" badge for escalated responses
- [ ] Show reason and priority
- [ ] Link to Zalo Call detail

**Files**:
- `frontend/src/pages/AiResponses.tsx` (edit)

---

### **Phase 10: Testing & Documentation (Priority: MEDIUM)**

**Task 10.1**: Integration tests
- [ ] Test LLM client (mock API responses)
- [ ] Test AI responder with LLM
- [ ] Test call escalation logic
- [ ] Test Zalo Calls API endpoints
- [ ] Test WebSocket notifications

**Task 10.2**: Update documentation
- [ ] Update `README.md` - Add new features
- [ ] Update `docs/CONFIGURATION.md` - Add LLM config
- [ ] Update `docs/USAGE.md` - Add Settings and Zalo Calls pages
- [ ] Create `docs/LLM_INTEGRATION.md` - Technical details

**Files**:
- `tests/integration/*` (multiple files)
- `README.md` (edit)
- `docs/CONFIGURATION.md` (edit)
- `docs/USAGE.md` (edit)
- `docs/LLM_INTEGRATION.md` (new)

---

### **Phase 11: Deployment Prep (Priority: LOW)**

**Task 11.1**: Environment variables
- [ ] Ensure all LLM configs in `.env.example`
- [ ] Add deployment notes for production
- [ ] Update Docker config if needed

**Task 11.2**: Run full test suite
- [ ] Backend tests pass
- [ ] Frontend builds successfully
- [ ] Manual E2E testing

**Files**:
- `.env.example` (edit)
- `docker-compose.yml` (edit if needed)

---

## 🔧 Technical Details

### **LLM API Request Format**

```typescript
POST {baseUrl}/chat/completions
Authorization: Bearer {apiKey}

{
  "model": "hotro",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
```

### **WebSocket Message Format**

```typescript
{
  "type": "zalo_call_request",
  "data": {
    "id": "uuid",
    "conversationId": "uuid",
    "customerName": "Nguyễn Văn A",
    "reason": "complex_question",
    "priority": "high",
    "createdAt": "2026-07-18T04:00:00Z"
  }
}
```

### **Confidence Threshold Logic**

```typescript
if (confidence < 0.6) {
  // Create Zalo call request
  await callEscalation.createRequest({
    conversationId,
    reason: 'low_confidence',
    priority: confidence < 0.4 ? 'high' : 'normal'
  });
}
```

---

## 📦 Dependencies to Install

### Backend
```bash
npm install ws
npm install -D @types/ws
```

### Frontend
(No new dependencies needed - use existing axios, lucide-react)

---

## 🧪 Testing Strategy

### Unit Tests
- LLM client error handling
- Retry logic
- Confidence calculation
- Call escalation decision logic

### Integration Tests
- Full AI response flow with LLM
- Zalo call request creation
- API endpoints (settings, zalo-calls)
- WebSocket connection & notifications

### Manual Testing
- Test LLM connection with real API
- Create Zalo call request through UI
- Receive WebSocket notification
- Complete call request workflow

---

## 🚀 Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] Frontend builds without errors
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Merge to main branch

---

## 📊 Success Metrics

- LLM response success rate > 95%
- Average LLM latency < 3s
- Zalo call requests created when confidence < 0.6
- WebSocket notifications delivered < 1s
- Zero data loss on LLM API failures (fallback working)

---

## 🔍 Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| LLM API down | Fallback to rule-based responses |
| High latency | Timeout after 30s, retry 3 times |
| WebSocket disconnection | Auto-reconnect with exponential backoff |
| API key exposure | Store in .env, never commit, mask in UI |
| Database migration failure | Test migration on dev DB first |

---

## 📝 Notes

- LLM API key: `sk-95bc715585ae5b76-ee1136-ad735cd0`
- Base URL: `https://omniroute-production-5d2d.up.railway.app/v1`
- Model: `hotro`
- Expected response format: OpenAI-compatible JSON

---

## ✅ Completion Criteria

1. ✅ AI responses use LLM instead of rule-based
2. ✅ Low confidence triggers Zalo call request
3. ✅ Settings page allows LLM configuration
4. ✅ Zalo Calls page shows requests and allows assignment
5. ✅ WebSocket notifications work in realtime
6. ✅ All tests passing (>90% coverage)
7. ✅ Documentation complete and accurate

---

**End of Implementation Plan**

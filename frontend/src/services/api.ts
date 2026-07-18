import axios from 'axios'

const API_BASE = '/api'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fbm_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('fbm_token')
      localStorage.removeItem('fbm_user')
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth ──
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }).then((r) => r.data),
}

// ── Accounts ──
export const accountsApi = {
  list: () => api.get('/accounts').then((r) => r.data),
  connect: (data: { code: string; redirect_uri: string; display_name?: string; facebook_user_id?: string }) =>
    api.post('/accounts/connect', data).then((r) => r.data),
  disconnect: (id: string) => api.delete(`/accounts/${id}`).then((r) => r.data),
  refresh: (id: string) => api.post(`/accounts/${id}/refresh`).then((r) => r.data),
}

// ── Conversations ──
export const conversationsApi = {
  list: (params?: { search?: string; account_id?: string; status?: string; page?: number; limit?: number }) =>
    api.get('/conversations', { params }).then((r) => r.data),
  messages: (id: string) => api.get(`/conversations/${id}/messages`).then((r) => r.data),
  reply: (id: string, content: string) =>
    api.post(`/conversations/${id}/reply`, { content }).then((r) => r.data),
  updateSettings: (id: string, auto_reply_mode: 'automatic' | 'manual' | 'mixed') =>
    api.put(`/conversations/${id}/settings`, { auto_reply_mode }).then((r) => r.data),
}

// ── Knowledge ──
export const knowledgeApi = {
  list: (params?: { search?: string; category?: string; page?: number; limit?: number }) =>
    api.get('/knowledge', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/knowledge/${id}`).then((r) => r.data),
  create: (data: { title: string; content: string; category: string; tags?: string[] }) =>
    api.post('/knowledge', data).then((r) => r.data),
  update: (id: string, data: { title?: string; content?: string; category?: string; tags?: string[]; isActive?: boolean }) =>
    api.put(`/knowledge/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/knowledge/${id}`).then((r) => r.data),
  search: (query: string, limit?: number) =>
    api.post('/knowledge/search', { query, limit }).then((r) => r.data),
}

// ── AI Responses ──
export const aiResponsesApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/ai-responses', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/ai-responses/${id}`).then((r) => r.data),
  approve: (id: string) => api.post(`/ai-responses/${id}/approve`).then((r) => r.data),
  reject: (id: string) => api.delete(`/ai-responses/${id}`).then((r) => r.data),
  update: (id: string, content: string) =>
    api.put(`/ai-responses/${id}`, { content }).then((r) => r.data),
  feedback: (id: string, feedback: 'positive' | 'negative' | 'neutral') =>
    api.post(`/ai-responses/${id}/feedback`, { feedback }).then((r) => r.data),
}

// ── Stats ──
export const statsApi = {
  overview: () => api.get('/stats/overview').then((r) => r.data),
  activity: (days?: number) => api.get('/stats/activity', { params: { days } }).then((r) => r.data),
}

// ── History ──
export const historyApi = {
  list: (params?: { search?: string; from?: string; to?: string; page?: number; limit?: number }) =>
    api.get('/history', { params }).then((r) => r.data),
  exportUrl: (format: 'csv' | 'json', from?: string, to?: string) => {
    const params = new URLSearchParams({ format })
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const token = localStorage.getItem('fbm_token')
    return `${API_BASE}/history/export?${params.toString()}&token=${encodeURIComponent(token || '')}`
  },
}

// ── Settings (LLM config) ──
export const settingsApi = {
  getLLM: () => api.get('/settings/llm').then((r) => r.data),
  updateLLM: (data: {
    provider?: string
    baseUrl?: string
    apiKey?: string
    model?: string
    temperature?: number
    maxTokens?: number
    timeout?: number
  }) => api.put('/settings/llm', data).then((r) => r.data),
  testLLM: () => api.post('/settings/llm/test').then((r) => r.data),
}

// ── Zalo Calls ──
export const zaloCallsApi = {
  list: (params?: { status?: string; priority?: string; limit?: number; offset?: number }) =>
    api.get('/zalo-calls', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/zalo-calls/${id}`).then((r) => r.data),
  assign: (id: string) => api.post(`/zalo-calls/${id}/assign`).then((r) => r.data),
  complete: (id: string, notes?: string) =>
    api.post(`/zalo-calls/${id}/complete`, { notes }).then((r) => r.data),
  cancel: (id: string, reason?: string) =>
    api.post(`/zalo-calls/${id}/cancel`, { reason }).then((r) => r.data),
}

export default api

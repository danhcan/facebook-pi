import { useEffect, useState, useRef } from 'react'
import { Search, ArrowRight, MessageSquare, Bot, Clock } from 'lucide-react'
import { conversationsApi } from '../services/api'

interface Conversation {
  id: string
  participant_name: string
  participant_facebook_id: string
  status: string
  auto_reply_mode: 'automatic' | 'manual' | 'mixed'
  message_count: number
  last_message: { content: string; direction: string; created_at: string } | null
  created_at: string
}

interface Message {
  id: string
  direction: 'inbound' | 'outbound'
  content: string
  classification: string | null
  created_at: string
}

export default function Conversations() {
  const [query, setQuery] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load conversation list
  useEffect(() => {
    setLoading(true)
    conversationsApi.list({ search: query || undefined })
      .then((data) => setConversations(data.conversations || []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false))
  }, [query])

  // Load messages when selecting
  useEffect(() => {
    if (!selected) {
      setMessages([])
      return
    }
    conversationsApi.messages(selected)
      .then((data) => setMessages(data.messages || []))
      .catch(() => setMessages([]))
  }, [selected])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const active = conversations.find((c) => c.id === selected)

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !reply.trim()) return
    setSending(true)
    try {
      await conversationsApi.reply(selected, reply.trim())
      setReply('')
      // Reload messages
      const data = await conversationsApi.messages(selected)
      setMessages(data.messages || [])
      // Reload list để cập nhật last_message
      conversationsApi.list().then((d) => setConversations(d.conversations || []))
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Gửi thất bại')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
    if (diffMin < 1) return 'vừa xong'
    if (diffMin < 60) return `${diffMin}p`
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}g`
    return d.toLocaleDateString('vi-VN')
  }

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-3">
      {/* ── Chat list ── */}
      <div
        className="w-80 rounded-2xl flex flex-col flex-shrink-0 overflow-hidden"
        style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-paper-4)' }}
      >
        {/* Search */}
        <div className="p-3 border-b" style={{ borderColor: 'var(--color-paper-4)' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
            <input
              type="text"
              placeholder="Tìm khách..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition-all"
              style={{ background: 'var(--color-paper)', border: '1px solid var(--color-paper-4)', color: 'var(--color-ink)' }}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {loading && <p className="text-xs text-center py-4" style={{ color: 'var(--color-muted)' }}>Đang tải...</p>}
          {!loading && conversations.length === 0 && (
            <p className="text-xs text-center py-4" style={{ color: 'var(--color-muted)' }}>Chưa có cuộc trò chuyện</p>
          )}
          {conversations.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelected(chat.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150"
              style={{ background: selected === chat.id ? 'var(--color-paper)' : 'transparent' }}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-accent-soft)' }}>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                    {chat.participant_name[0]}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--color-ink)' }}>
                    {chat.participant_name}
                  </span>
                  <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: 'var(--color-muted)' }}>
                    {chat.last_message ? formatTime(chat.last_message.created_at) : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm truncate" style={{ color: 'var(--color-ink-2)' }}>
                    {chat.last_message?.content || 'Chưa có tin nhắn'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: 'var(--color-paper-3)', color: 'var(--color-muted)' }}>
                    {chat.message_count}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat detail / Empty state ── */}
      <div
        className="flex-1 rounded-2xl flex flex-col overflow-hidden"
        style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-paper-4)' }}
      >
        {active ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b flex-shrink-0" style={{ borderColor: 'var(--color-paper-4)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-accent-soft)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>{active.participant_name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{active.participant_name}</h3>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {active.message_count} tin nhắn · {active.auto_reply_mode === 'automatic' ? (
                    <span className="inline-flex items-center gap-1"><Bot className="w-3 h-3" /> Tự động</span>
                  ) : active.auto_reply_mode === 'manual' ? (
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Chờ duyệt</span>
                  ) : 'Kết hợp'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3" style={{ background: 'var(--color-paper)' }}>
              {messages.length === 0 && (
                <p className="text-xs text-center py-4" style={{ color: 'var(--color-muted)' }}>Chưa có tin nhắn</p>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className="max-w-[70%] px-4 py-3 rounded-2xl"
                    style={{
                      background: m.direction === 'inbound' ? 'var(--color-paper-4)' : 'var(--color-accent-soft)',
                      borderRadius: m.direction === 'inbound' ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                    }}
                  >
                    <p className="text-sm" style={{ color: 'var(--color-ink)' }}>{m.content}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--color-muted)' }}>
                      {new Date(m.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      {m.classification && ` · ${m.classification}`}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleReply} className="flex items-center gap-2 p-3 border-t flex-shrink-0" style={{ borderColor: 'var(--color-paper-4)', background: 'var(--color-paper-2)' }}>
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm outline-none bg-transparent rounded-xl"
                style={{ color: 'var(--color-ink)', background: 'var(--color-paper)', border: '1px solid var(--color-paper-4)' }}
              />
              <button
                type="submit"
                disabled={!reply.trim() || sending}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                style={{ background: 'var(--color-accent)' }}
              >
                <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-accent-ink)' }} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--color-paper-3)' }}>
                <MessageSquare className="w-7 h-7" style={{ color: 'var(--color-muted)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-ink-2)' }}>Chọn một cuộc trò chuyện</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Nhấp vào chat bên trái để xem chi tiết</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

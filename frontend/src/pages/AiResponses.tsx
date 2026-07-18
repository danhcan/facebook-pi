import { useEffect, useState } from 'react'
import { Check, X, Clock, ThumbsUp, ThumbsDown, Sparkles, Edit2 } from 'lucide-react'
import { aiResponsesApi } from '../services/api'

interface AiResponseItem {
  id: string
  message_id: string
  content: string
  confidence: number
  status: 'pending' | 'approved' | 'sent' | 'rejected'
  customer: string
  original_message: string
  message_classification: string | null
  created_at: string
  sent_at: string | null
}

const tabs = [
  { key: 'all' as const, label: 'Tất cả' },
  { key: 'pending' as const, label: 'Chờ duyệt' },
  { key: 'sent' as const, label: 'Đã gửi' },
  { key: 'rejected' as const, label: 'Từ chối' },
]

const badgeStyles: Record<string, { bg: string; color: string; icon: any }> = {
  pending: { bg: 'var(--color-warning-soft)', color: 'var(--color-warning)', icon: Clock },
  approved: { bg: 'var(--color-accent-soft)', color: 'var(--color-accent)', icon: ThumbsUp },
  rejected: { bg: 'var(--color-danger-soft)', color: 'var(--color-danger)', icon: ThumbsDown },
  sent: { bg: 'var(--color-success-soft)', color: 'var(--color-success)', icon: Check },
}

export default function AiResponses() {
  const [tab, setTab] = useState<'all' | 'pending' | 'sent' | 'rejected'>('all')
  const [items, setItems] = useState<AiResponseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    aiResponsesApi.list({ status: tab === 'all' ? undefined : tab })
      .then((data) => setItems(data.responses || []))
      .catch((e) => setError(e?.response?.data?.error || 'Không tải được'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [tab])

  const handleApprove = async (id: string) => {
    setBusy(true)
    try {
      await aiResponsesApi.approve(id)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Duyệt thất bại')
    } finally {
      setBusy(false)
    }
  }

  const handleReject = async (id: string) => {
    if (!confirm('Từ chối phản hồi này?')) return
    setBusy(true)
    try {
      await aiResponsesApi.reject(id)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Từ chối thất bại')
    } finally {
      setBusy(false)
    }
  }

  const startEdit = (item: AiResponseItem) => {
    setEditingId(item.id)
    setEditContent(item.content)
  }

  const saveEdit = async (id: string) => {
    setBusy(true)
    try {
      await aiResponsesApi.update(id, editContent)
      setEditingId(null)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Lưu thất bại')
    } finally {
      setBusy(false)
    }
  }

  const pendingCount = items.filter((i) => i.status === 'pending').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>
            Phản hồi AI
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            <span className="inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
              {loading ? 'Đang tải...' : `${pendingCount} phản hồi chờ duyệt`}
            </span>
          </p>
        </div>
      </div>

      {error && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}

      <div className="flex items-center gap-1 p-0.5 rounded-xl w-fit" style={{ background: 'var(--color-paper-2)' }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-1.5 text-sm rounded-lg transition-all"
            style={{
              background: tab === t.key ? 'var(--color-paper)' : 'transparent',
              color: tab === t.key ? 'var(--color-ink)' : 'var(--color-muted)',
              fontWeight: tab === t.key ? 500 : 400,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {items.length === 0 && !loading && (
          <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-paper-4)' }}>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Không có phản hồi nào.</p>
          </div>
        )}
        {items.map((item) => {
          const badge = badgeStyles[item.status]
          const Icon = badge.icon
          const isEditing = editingId === item.id
          return (
            <div key={item.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-paper-4)' }}>
              <div className="flex items-center justify-between px-5 py-2.5" style={{ background: 'var(--color-paper-2)' }}>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium" style={{ background: badge.bg, color: badge.color }}>
                    <Icon className="w-3 h-3" />
                    {item.status === 'pending' ? 'chờ duyệt' : item.status === 'sent' ? 'đã gửi' : item.status === 'approved' ? 'đã duyệt' : 'từ chối'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>với {item.customer}</span>
                  {item.message_classification && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-paper-3)', color: 'var(--color-muted)' }}>
                      {item.message_classification}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{(item.confidence * 100).toFixed(0)}%</span>
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{new Date(item.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                </div>
              </div>
              <div className="px-5 py-4 space-y-2" style={{ background: 'var(--color-paper)' }}>
                <p className="text-sm"><span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Khách:</span> {item.original_message}</p>
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                      style={{ border: '1px solid var(--color-paper-4)', color: 'var(--color-ink)', background: 'var(--color-paper-2)' }}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(item.id)} disabled={busy} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'var(--color-success)', color: 'var(--color-accent-ink)' }}>Lưu</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: 'var(--color-muted)' }}>Hủy</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm"><span className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>AI:</span> {item.content}</p>
                )}
              </div>
              {item.status === 'pending' && !isEditing && (
                <div className="flex items-center gap-2 px-5 py-3 border-t" style={{ background: 'var(--color-paper-2)', borderColor: 'var(--color-paper-4)' }}>
                  <button onClick={() => handleApprove(item.id)} disabled={busy}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                    style={{ background: 'var(--color-success)', color: 'var(--color-accent-ink)' }}>
                    <Check className="w-3.5 h-3.5" /> Duyệt & gửi
                  </button>
                  <button onClick={() => startEdit(item)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={{ color: 'var(--color-ink-2)', border: '1px solid var(--color-paper-4)' }}>
                    <Edit2 className="w-3.5 h-3.5" /> Sửa
                  </button>
                  <button onClick={() => handleReject(item.id)} disabled={busy}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                    style={{ color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }}>
                    <X className="w-3.5 h-3.5" /> Từ chối
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

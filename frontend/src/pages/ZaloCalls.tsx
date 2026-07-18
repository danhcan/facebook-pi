import { useState, useEffect } from 'react'
import { Phone, Check, X, Loader2, Clock, User, AlertCircle } from 'lucide-react'
import { zaloCallsApi } from '../services/api'

interface ZaloCall {
  id: string
  conversationId: string
  customerId: string
  customerName: string
  phoneNumber: string | null
  reason: string
  priority: string
  status: string
  assignedTo: string | null
  notes: string | null
  createdAt: string
  scheduledAt: string | null
  assignedAt: string | null
  completedAt: string | null
  conversation?: {
    participantName: string
    participantFacebookId: string
  }
  assignedUser?: {
    name: string
    email: string
  } | null
}

const STATUS_TABS = [
  { key: 'pending', label: 'Chờ nhận', color: 'var(--color-warning)' },
  { key: 'assigned', label: 'Đã nhận', color: 'var(--color-accent)' },
  { key: 'completed', label: 'Hoàn thành', color: 'var(--color-success)' },
  { key: 'all', label: 'Tất cả', color: 'var(--color-muted)' },
]

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'var(--color-danger)',
  high: 'var(--color-warning)',
  normal: 'var(--color-accent)',
  low: 'var(--color-muted)',
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Khẩn cấp',
  high: 'Cao',
  normal: 'Thường',
  low: 'Thấp',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ nhận',
  assigned: 'Đã nhận',
  calling: 'Đang gọi',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

export default function ZaloCalls() {
  const [calls, setCalls] = useState<ZaloCall[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [pendingCount, setPendingCount] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [completeModal, setCompleteModal] = useState<ZaloCall | null>(null)
  const [notes, setNotes] = useState('')
  const [cancelModal, setCancelModal] = useState<ZaloCall | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    loadCalls()
  }, [activeTab])

  const loadCalls = async () => {
    try {
      setLoading(true)
      const data = await zaloCallsApi.list({ status: activeTab, limit: 50 })
      setCalls(data.calls)
      setPendingCount(data.pendingCount)
    } catch (err) {
      console.error('Failed to load calls:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async (callId: string) => {
    try {
      setActionLoading(callId)
      await zaloCallsApi.assign(callId)
      await loadCalls()
    } catch (err) {
      console.error('Failed to assign call:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleComplete = async () => {
    if (!completeModal) return
    try {
      setActionLoading(completeModal.id)
      await zaloCallsApi.complete(completeModal.id, notes)
      setCompleteModal(null)
      setNotes('')
      await loadCalls()
    } catch (err) {
      console.error('Failed to complete call:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async () => {
    if (!cancelModal) return
    try {
      setActionLoading(cancelModal.id)
      await zaloCallsApi.cancel(cancelModal.id, cancelReason)
      setCancelModal(null)
      setCancelReason('')
      await loadCalls()
    } catch (err) {
      console.error('Failed to cancel call:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--color-accent-soft)' }}
        >
          <Phone className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
        </div>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>
            Yêu cầu gọi Zalo
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Quản lý cuộc gọi cho khách hàng cần hỗ trợ
          </p>
        </div>
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: 'var(--color-warning-soft)' }}
        >
          <AlertCircle className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
            {pendingCount} yêu cầu đang chờ được nhận
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.key ? 'var(--color-paper-3)' : 'transparent',
              color: activeTab === tab.key ? tab.color : 'var(--color-muted)',
              border: `1px solid ${activeTab === tab.key ? tab.color : 'var(--color-paper-4)'}`,
            }}
          >
            {tab.label}
            {tab.key === 'pending' && pendingCount > 0 && (
              <span
                className="ml-2 px-1.5 py-0.5 rounded text-xs"
                style={{ background: 'var(--color-danger)', color: 'white' }}
              >
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-muted)' }} />
        </div>
      ) : calls.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            background: 'var(--color-paper-2)',
            border: '1px solid var(--color-paper-4)',
          }}
        >
          <Phone
            className="w-10 h-10 mx-auto mb-3"
            style={{ color: 'var(--color-muted)' }}
          />
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Không có yêu cầu gọi nào
          </p>
        </div>
      ) : (
        /* Call List */
        <div className="space-y-3">
          {calls.map((call) => (
            <div
              key={call.id}
              className="rounded-2xl p-5"
              style={{
                background: 'var(--color-paper-2)',
                border: '1px solid var(--color-paper-4)',
              }}
            >
              <div className="flex items-start justify-between">
                {/* Left: Customer info */}
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-paper-3)' }}
                  >
                    <User className="w-5 h-5" style={{ color: 'var(--color-muted)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                        {call.customerName}
                      </h3>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          background: `${PRIORITY_COLORS[call.priority]}20`,
                          color: PRIORITY_COLORS[call.priority],
                        }}
                      >
                        {PRIORITY_LABELS[call.priority]}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs" style={{ color: 'var(--color-muted)' }}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(call.createdAt)}
                      </span>
                      {call.assignedUser && (
                        <span>
                          Nhân viên: {call.assignedUser.name}
                        </span>
                      )}
                    </div>
                    {call.notes && (
                      <p className="mt-2 text-xs" style={{ color: 'var(--color-ink-2)' }}>
                        Ghi chú: {call.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Status + Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{
                      background: 'var(--color-paper-3)',
                      color: 'var(--color-ink-2)',
                    }}
                  >
                    {STATUS_LABELS[call.status]}
                  </span>

                  {call.status === 'pending' && (
                    <button
                      onClick={() => handleAssign(call.id)}
                      disabled={actionLoading === call.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                      style={{
                        background: 'var(--color-accent)',
                        color: 'var(--color-accent-ink)',
                      }}
                    >
                      {actionLoading === call.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Phone className="w-3.5 h-3.5" />
                      )}
                      Nhận task
                    </button>
                  )}

                  {call.status === 'assigned' && (
                    <>
                      <button
                        onClick={() => {
                          setCompleteModal(call)
                          setNotes('')
                        }}
                        disabled={actionLoading === call.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                        style={{
                          background: 'var(--color-success-soft)',
                          color: 'var(--color-success)',
                        }}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Hoàn thành
                      </button>
                      <button
                        onClick={() => {
                          setCancelModal(call)
                          setCancelReason('')
                        }}
                        disabled={actionLoading === call.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                        style={{
                          background: 'var(--color-danger-soft)',
                          color: 'var(--color-danger)',
                        }}
                      >
                        <X className="w-3.5 h-3.5" />
                        Hủy
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Complete Modal */}
      {completeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'oklch(0% 0 0 / 0.6)' }}
          onClick={() => setCompleteModal(null)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-md"
            style={{
              background: 'var(--color-paper-2)',
              border: '1px solid var(--color-paper-4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
              Hoàn thành cuộc gọi
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
              Khách hàng: {completeModal.customerName}
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú kết quả cuộc gọi..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{
                background: 'var(--color-paper)',
                border: '1px solid var(--color-paper-4)',
                color: 'var(--color-ink)',
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setCompleteModal(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: 'var(--color-paper-3)',
                  color: 'var(--color-muted)',
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleComplete}
                disabled={actionLoading === completeModal.id}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{
                  background: 'var(--color-success)',
                  color: 'var(--color-accent-ink)',
                }}
              >
                {actionLoading === completeModal.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'oklch(0% 0 0 / 0.6)' }}
          onClick={() => setCancelModal(null)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-md"
            style={{
              background: 'var(--color-paper-2)',
              border: '1px solid var(--color-paper-4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
              Hủy yêu cầu gọi
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
              Khách hàng: {cancelModal.customerName}
            </p>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Lý do hủy (tùy chọn)"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--color-paper)',
                border: '1px solid var(--color-paper-4)',
                color: 'var(--color-ink)',
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setCancelModal(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: 'var(--color-paper-3)',
                  color: 'var(--color-muted)',
                }}
              >
                Đóng
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading === cancelModal.id}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{
                  background: 'var(--color-danger)',
                  color: 'white',
                }}
              >
                {actionLoading === cancelModal.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Plus, RefreshCw, ExternalLink, Trash2, X, Check, AlertCircle } from 'lucide-react'
import { accountsApi } from '../services/api'

interface Account {
  id: string
  facebook_user_id: string
  display_name: string
  status: 'active' | 'expired' | 'disconnected'
  connected_at: string
  last_sync_at: string | null
  token_expires_at?: string
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newFbId, setNewFbId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fbConfigured, setFbConfigured] = useState(false)

  const load = () => {
    setLoading(true)
    accountsApi.list()
      .then((data) => setAccounts(data.accounts || []))
      .catch((e) => setError(e?.response?.data?.error || 'Không tải được'))
      .finally(() => setLoading(false))
  }

  const checkFbStatus = async () => {
    try {
      const res = await accountsApi.getFacebookStatus()
      setFbConfigured(res.configured)
    } catch (err) {
      setFbConfigured(false)
    }
  }

  useEffect(() => {
    load()
    checkFbStatus()
  }, [])

  const handleConnectReal = async () => {
    try {
      setBusy(true)
      setError('')
      
      // Get OAuth URL from backend
      const redirectUri = `${window.location.origin}/accounts/callback`
      const res = await accountsApi.getOAuthUrl(redirectUri)
      
      // Redirect to Facebook OAuth dialog
      window.location.href = res.url
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Không thể kết nối Facebook')
      setBusy(false)
    }
  }

  const handleConnectDemo = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await accountsApi.connect({
        code: `oauth_${Date.now()}`,
        redirect_uri: `${window.location.origin}/accounts`,
        display_name: newName,
        facebook_user_id: newFbId || `fb_${Date.now()}`,
      })
      setShowModal(false)
      setNewName('')
      setNewFbId('')
      load()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Kết nối thất bại')
    } finally {
      setBusy(false)
    }
  }

  const handleDisconnect = async (id: string) => {
    if (!confirm('Ngắt kết nối tài khoản này?')) return
    try {
      await accountsApi.disconnect(id)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Xóa thất bại')
    }
  }

  const handleRefresh = async (id: string) => {
    try {
      await accountsApi.refresh(id)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Làm mới thất bại')
    }
  }

  const activeCount = accounts.filter((a) => a.status === 'active').length

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>
            Tài khoản
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            {loading ? 'Đang tải...' : `${activeCount} đang hoạt động / ${accounts.length} tổng`}
          </p>
        </div>
        <button
          onClick={() => fbConfigured ? handleConnectReal() : setShowModal(true)}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
          style={{ background: 'var(--color-accent)', color: 'var(--color-accent-ink)' }}
        >
          <Plus className="w-4 h-4" />
          {busy ? 'Đang kết nối...' : 'Kết nối Facebook'}
        </button>
      </div>

      {/* FB Not Configured Warning */}
      {!fbConfigured && (
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: 'var(--color-warning-soft)' }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-warning)' }} />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
              Chế độ Demo
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
              Facebook App chưa được cấu hình. Đang dùng demo mode (không kết nối thật).
              Để kết nối thật, vui lòng cấu hình FACEBOOK_APP_ID và FACEBOOK_APP_SECRET trong .env
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {/* ── Cards ── */}
      <div className="grid gap-3">
        {accounts.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-5 px-5 py-4 rounded-2xl transition-all"
            style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-paper-4)' }}
          >
            {/* Indicator */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-3 h-3 rounded-full"
                style={{ background: a.status === 'active' ? 'var(--color-success)' : 'var(--color-paper-5)' }} />
              <span className="text-[10px] font-medium" style={{ color: a.status === 'active' ? 'var(--color-success)' : 'var(--color-muted)' }}>
                {a.status === 'active' ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{a.display_name}</h3>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                ID: {a.facebook_user_id} · Kết nối {new Date(a.connected_at).toLocaleDateString('vi-VN')}
                {a.last_sync_at && <> · Đồng bộ {new Date(a.last_sync_at).toLocaleDateString('vi-VN')}</>}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <button onClick={() => handleRefresh(a.id)} className="p-2 rounded-xl transition-all" style={{ color: 'var(--color-ink-2)' }} title="Làm mới token">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-xl transition-all" style={{ color: 'var(--color-ink-2)' }} title="Mở Facebook">
                <ExternalLink className="w-4 h-4" />
              </button>
              <button onClick={() => handleDisconnect(a.id)} className="p-2 rounded-xl transition-all" style={{ color: 'var(--color-danger)' }} title="Ngắt kết nối">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {!loading && accounts.length === 0 && (
          <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-paper-4)' }}>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Chưa có tài khoản nào. Nhấn "Kết nối Facebook" để bắt đầu.</p>
          </div>
        )}
      </div>

      {/* ── Connect modal (demo mode only) ── */}
      {showModal && !fbConfigured && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'oklch(0% 0 0 / 0.6)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-paper-4)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-paper-4)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>Kết nối tài khoản (Demo)</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" style={{ color: 'var(--color-muted)' }} /></button>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleConnectDemo}>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                Chế độ demo: nhập thông tin tài khoản để mô phỏng kết nối OAuth (không gọi Facebook thật).
              </p>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-muted)' }}>Tên hiển thị</label>
                <input
                  placeholder="VD: Shop Online VN"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid var(--color-paper-4)', color: 'var(--color-ink)', background: 'var(--color-paper)' }}
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-muted)' }}>Facebook User ID (tùy chọn)</label>
                <input
                  placeholder="fb_xxx — để trống để tự sinh"
                  value={newFbId}
                  onChange={(e) => setNewFbId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid var(--color-paper-4)', color: 'var(--color-ink)', background: 'var(--color-paper)' }}
                />
              </div>
              {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 rounded-xl text-sm" style={{ color: 'var(--color-ink-2)' }}>Hủy</button>
                <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50" style={{ background: 'var(--color-accent)', color: 'var(--color-accent-ink)' }}>
                  <Check className="w-4 h-4" />{busy ? 'Đang kết nối...' : 'Kết nối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

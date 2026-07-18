import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { api } from '../services/api'

export default function AccountsCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Đang kết nối Facebook...')

  useEffect(() => {
    handleCallback()
  }, [])

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      // Check if user denied permission
      if (error) {
        setStatus('error')
        setMessage(errorDescription || 'Bạn đã từ chối quyền truy cập')
        setTimeout(() => navigate('/accounts'), 3000)
        return
      }

      // Validate code
      if (!code) {
        setStatus('error')
        setMessage('Thiếu mã xác thực từ Facebook')
        setTimeout(() => navigate('/accounts'), 3000)
        return
      }

      // Exchange code for access token
      const redirectUri = `${window.location.origin}/accounts/callback`
      const response = await api.post('/accounts/connect', {
        code,
        redirect_uri: redirectUri,
      })

      // Success
      setStatus('success')
      const accountCount = response.data.total || 1
      setMessage(`Đã kết nối thành công ${accountCount} trang Facebook!`)
      
      // Redirect to accounts page after 2 seconds
      setTimeout(() => navigate('/accounts'), 2000)
    } catch (err: any) {
      console.error('OAuth callback error:', err)
      setStatus('error')
      setMessage(err.response?.data?.error || 'Kết nối thất bại. Vui lòng thử lại.')
      setTimeout(() => navigate('/accounts'), 3000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-paper)' }}>
      <div
        className="rounded-2xl p-8 text-center max-w-md w-full"
        style={{
          background: 'var(--color-paper-2)',
          border: '1px solid var(--color-paper-4)',
        }}
      >
        {/* Icon */}
        <div className="mb-4">
          {status === 'loading' && (
            <Loader2
              className="w-16 h-16 mx-auto animate-spin"
              style={{ color: 'var(--color-accent)' }}
            />
          )}
          {status === 'success' && (
            <CheckCircle
              className="w-16 h-16 mx-auto"
              style={{ color: 'var(--color-success)' }}
            />
          )}
          {status === 'error' && (
            <XCircle
              className="w-16 h-16 mx-auto"
              style={{ color: 'var(--color-danger)' }}
            />
          )}
        </div>

        {/* Message */}
        <p className="text-base" style={{ color: 'var(--color-ink)' }}>
          {message}
        </p>

        {/* Subtext */}
        {status === 'loading' && (
          <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>
            Đang xác thực với Facebook...
          </p>
        )}

        {status === 'success' && (
          <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>
            Đang chuyển về trang quản lý...
          </p>
        )}

        {status === 'error' && (
          <button
            onClick={() => navigate('/accounts')}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-accent-ink)',
            }}
          >
            Quay lại
          </button>
        )}
      </div>
    </div>
  )
}

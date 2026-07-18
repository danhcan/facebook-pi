import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('demo@vietnamese.ai')
  const [password, setPassword] = useState('demo123456')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, name || email.split('@')[0])
      }
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Đăng nhập thất bại')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-paper)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--color-accent-soft)' }}
          >
            <Sparkles className="w-7 h-7" style={{ color: 'var(--color-accent)' }} />
          </div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>
            Messenger AI
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Quản lý tin nhắn & trả lời tự động
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-paper-4)' }}>
          {/* Tabs */}
          <div className="flex gap-1 p-0.5 rounded-xl mb-5" style={{ background: 'var(--color-paper)' }}>
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 px-4 py-2 text-sm rounded-lg transition-all"
                style={{
                  background: mode === m ? 'var(--color-paper-2)' : 'transparent',
                  color: mode === m ? 'var(--color-ink)' : 'var(--color-muted)',
                  fontWeight: mode === m ? 500 : 400,
                }}
              >
                {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'register' && (
              <input
                type="text"
                placeholder="Họ tên"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'var(--color-paper)', border: '1px solid var(--color-paper-4)', color: 'var(--color-ink)' }}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{ background: 'var(--color-paper)', border: '1px solid var(--color-paper-4)', color: 'var(--color-ink)' }}
            />
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{ background: 'var(--color-paper)', border: '1px solid var(--color-paper-4)', color: 'var(--color-ink)' }}
            />

            {error && (
              <p className="text-xs px-1" style={{ color: 'var(--color-danger)' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
              style={{ background: 'var(--color-accent)', color: 'var(--color-accent-ink)' }}
            >
              {busy ? 'Đang xử lý...' : (mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản')}
              {!busy && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--color-paper-4)' }}>
            <p className="text-xs text-center" style={{ color: 'var(--color-muted)' }}>
              Tài khoản demo: <span style={{ color: 'var(--color-ink-2)' }}>demo@vietnamese.ai</span> / <span style={{ color: 'var(--color-ink-2)' }}>demo123456</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  MessageSquare, 
  Globe, 
  Bot, 
  BookOpen, 
  BarChart3,
  Search,
  LogOut
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const dockItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/conversations', icon: MessageSquare, label: 'Chat' },
  { to: '/accounts', icon: Globe, label: 'Tài khoản' },
  { to: '/ai-responses', icon: Bot, label: 'AI' },
  { to: '/knowledge', icon: BookOpen, label: 'Kiến thức' },
  { to: '/stats', icon: BarChart3, label: 'Thống kê' },
]

export default function Layout() {
  const [spotlightOpen, setSpotlightOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: 'var(--color-paper)' }}
    >
      {/* ── macOS-style status bar ── */}
      <header 
        className="flex items-center justify-between px-6 py-2.5 flex-shrink-0 select-none"
        style={{ 
          WebkitUserSelect: 'none',
        }}
      >
        {/* Left: Traffic light dots (decorative) */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: 'var(--color-danger)' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: 'var(--color-warning)' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: 'var(--color-success)' }} />
          <span className="ml-4 text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>
            Messenger AI
          </span>
        </div>

        {/* Center: Spotlight */}
        <div className="flex-1 max-w-md mx-auto">
          <button
            onClick={() => setSpotlightOpen(!spotlightOpen)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-150"
            style={{ 
              background: 'var(--color-paper-2)',
              border: '1px solid var(--color-paper-4)',
              color: 'var(--color-muted)'
            }}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Tìm kiếm nhanh...</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--color-paper-3)' }}>
              ⌘K
            </span>
          </button>
        </div>

        {/* Right: Profile */}
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{user?.name || 'Admin'}</span>
          <div 
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
            style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
          >
            {(user?.name || 'A')[0]}
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: 'var(--color-muted)' }}
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto px-8 pb-24">
        <div className="max-w-6xl mx-auto py-6">
          <Outlet />
        </div>
      </main>

      {/* ── Floating Dock (macOS style) ── */}
      <nav 
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-2 rounded-2xl backdrop-blur-lg"
        style={{ 
          background: 'var(--color-dock)',
          boxShadow: 'var(--shadow-dock)',
          border: '0.5px solid oklch(0% 0 0 / 0.06)',
        }}
      >
        {dockItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-150 min-w-[56px]"
            style={({ isActive }: { isActive: boolean }) => ({
              background: isActive ? 'var(--color-accent-soft)' : 'transparent',
            })}
          >
            <item.icon 
              className="w-5 h-5 transition-all duration-150" 
              style={{ 
                color: 'var(--color-ink-2)',
              }} 
            />
            <span 
              className="text-[10px] font-medium whitespace-nowrap transition-all duration-150"
              style={{ color: 'var(--color-muted)' }}
            >
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

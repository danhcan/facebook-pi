import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import AccountsCallback from './pages/AccountsCallback'
import Conversations from './pages/Conversations'
import Knowledge from './pages/Knowledge'
import AiResponses from './pages/AiResponses'
import Stats from './pages/Stats'
import Settings from './pages/Settings'
import ZaloCalls from './pages/ZaloCalls'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--color-paper)' }}>
        <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Đang tải...</span>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--color-paper)' }}>
        <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Đang tải...</span>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/accounts/callback" element={<ProtectedRoute><AccountsCallback /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="conversations" element={<Conversations />} />
        <Route path="knowledge" element={<Knowledge />} />
        <Route path="ai-responses" element={<AiResponses />} />
        <Route path="stats" element={<Stats />} />
        <Route path="zalo-calls" element={<ZaloCalls />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

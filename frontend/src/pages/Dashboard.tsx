import { useEffect, useState } from 'react'
import { MessageSquare, Bot, Activity, Sparkles } from 'lucide-react'
import { statsApi } from '../services/api'

interface Overview {
  totalConversations: number
  totalMessages: number
  aiResponses: number
  pendingApprovals: number
  knowledgeItems: number
}

interface ActivityDay {
  date: string
  messages: number
  ai: number
}

export default function Dashboard() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [activity, setActivity] = useState<ActivityDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([statsApi.overview(), statsApi.activity(7)])
      .then(([ov, act]) => {
        if (cancelled) return
        setOverview(ov)
        setActivity(act.data || [])
      })
      .catch((e) => !cancelled && setError(e?.response?.data?.error || 'Không tải được dữ liệu'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

  if (loading) {
    return <div className="flex items-center justify-center py-20"><span className="text-sm" style={{ color: 'var(--color-muted)' }}>Đang tải...</span></div>
  }

  const stats = [
    { label: 'Đang hoạt động', value: overview?.totalConversations ?? 0, sub: 'Cuộc trò chuyện', change: 'live', icon: MessageSquare, color: 'var(--color-accent)' },
    { label: 'Tổng tin nhắn', value: overview?.totalMessages ?? 0, sub: 'Tin nhắn', change: 'all', icon: Activity, color: 'var(--color-success)' },
    { label: 'Phản hồi AI', value: overview?.aiResponses ?? 0, sub: 'Bởi AI', change: 'all', icon: Bot, color: 'var(--color-accent)' },
    { label: 'Chờ duyệt', value: overview?.pendingApprovals ?? 0, sub: 'Phản hồi', change: 'now', icon: Sparkles, color: 'var(--color-warning)' },
  ]

  const maxActivity = Math.max(1, ...activity.map((a) => a.messages))

  return (
    <div className="space-y-6">
      {/* ── Hero section ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: 'var(--color-success-soft)', color: 'var(--color-success)' }}>
              <Sparkles className="w-3 h-3" />
              Hôm nay
            </span>
          </div>
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-ink)', letterSpacing: '-0.04em' }}>
            {greeting} 👋
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--color-muted)' }}>
            {error ? <span style={{ color: 'var(--color-danger)' }}>{error}</span> : (
              overview && overview.pendingApprovals > 0
                ? <>Có <strong className="font-medium" style={{ color: 'var(--color-ink)' }}>{overview.pendingApprovals}</strong> phản hồi chờ duyệt.</>
                : <>Tất cả phản hồi đã được xử lý. </>
            )}
            {' '}
            <strong className="font-medium" style={{ color: 'var(--color-ink)' }}>{overview?.knowledgeItems ?? 0}</strong> mục tri thức.
          </p>
        </div>
      </div>

      {/* ── Stat tiles ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-5 transition-all duration-200"
            style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-paper-4)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>{stat.label}</span>
              <span className="text-[11px] flex items-center gap-0.5 font-medium" style={{ color: 'var(--color-muted)' }}>
                <stat.icon className="w-3 h-3" style={{ color: stat.color }} />{stat.change}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tabular-nums" style={{ color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>
                {(stat.value).toLocaleString()}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{stat.sub}</span>
            </div>
            <div className="mt-3 w-full h-1 rounded-full" style={{ background: 'var(--color-paper-4)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (stat.value / Math.max(1, overview?.totalMessages || 1)) * 100)}%`, background: stat.color, opacity: 0.6 }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Activity chart — 2 cols */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-paper-4)' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Hoạt động 7 ngày</h2>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>tin nhắn / AI</span>
          </div>
          <div className="flex items-end justify-between h-40 gap-2">
            {activity.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex flex-col items-center gap-0.5 justify-end" style={{ height: '120px' }}>
                  <div className="w-full rounded-t-sm transition-all" style={{
                    height: `${(d.ai / maxActivity) * 100}px`,
                    background: 'var(--color-accent)',
                    opacity: 0.7,
                    minHeight: d.ai > 0 ? '4px' : '0'
                  }} />
                  <div className="w-full rounded-t-sm transition-all" style={{
                    height: `${(Math.max(0, d.messages - d.ai) / maxActivity) * 100}px`,
                    background: 'var(--color-accent)',
                    opacity: 0.25,
                    minHeight: (d.messages - d.ai) > 0 ? '4px' : '0'
                  }} />
                </div>
                <span className="text-[11px] tabular-nums" style={{ color: 'var(--color-muted)' }}>
                  {new Date(d.date).toLocaleDateString('vi-VN', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick status — 1 col */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-paper-4)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>Tổng quan</h2>
          <div className="space-y-4">
            {[
              { label: 'Cuộc trò chuyện', value: overview?.totalConversations ?? 0, state: 'good' },
              { label: 'Tin nhắn', value: overview?.totalMessages ?? 0, state: 'good' },
              { label: 'Phản hồi AI', value: overview?.aiResponses ?? 0, state: 'good' },
              { label: 'Chờ duyệt', value: overview?.pendingApprovals ?? 0, state: (overview?.pendingApprovals ?? 0) > 0 ? 'warn' : 'good' },
              { label: 'Tri thức', value: overview?.knowledgeItems ?? 0, state: 'good' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--color-ink-2)' }}>{item.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full"
                    style={{ background: item.state === 'good' ? 'var(--color-success)' : 'var(--color-warning)' }}
                  />
                  <span className="text-sm font-medium tabular-nums" style={{ color: 'var(--color-ink)' }}>
                    {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

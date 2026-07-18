import { useEffect, useState } from 'react'
import { MessageSquare, Bot, Activity, BookOpen } from 'lucide-react'
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

export default function Stats() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [activity, setActivity] = useState<ActivityDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([statsApi.overview(), statsApi.activity(7)])
      .then(([ov, act]) => {
        setOverview(ov)
        setActivity(act.data || [])
      })
      .catch((e) => setError(e?.response?.data?.error || 'Không tải được'))
      .finally(() => setLoading(false))
  }, [])

  const max = Math.max(1, ...activity.map((d) => d.messages))
  const totalMessages = overview?.totalMessages ?? 0
  const aiRatio = totalMessages > 0 ? ((overview?.aiResponses ?? 0) / totalMessages) * 100 : 0

  if (loading) {
    return <div className="flex items-center justify-center py-20"><span className="text-sm" style={{ color: 'var(--color-muted)' }}>Đang tải...</span></div>
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>
          Thống kê
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>7 ngày qua · {error ? <span style={{ color: 'var(--color-danger)' }}>{error}</span> : 'cập nhật theo dữ liệu thật'}</p>
      </div>

      {/* Row 1: Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Cuộc trò chuyện', value: overview?.totalConversations ?? 0, icon: MessageSquare },
          { label: 'Tin nhắn', value: overview?.totalMessages ?? 0, icon: Activity },
          { label: 'AI trả lời', value: overview?.aiResponses ?? 0, icon: Bot },
          { label: 'Tri thức', value: overview?.knowledgeItems ?? 0, icon: BookOpen },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl px-5 py-4" style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-paper-4)' }}>
            <div className="flex items-center gap-2">
              <s.icon className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{s.label}</p>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-xl font-semibold tabular-nums" style={{ color: 'var(--color-ink)' }}>
                {(s.value).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Chart + Topics */}
      <div className="grid grid-cols-3 gap-3">
        {/* Chart — 2 cols */}
        <div className="col-span-2 rounded-2xl p-6" style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-paper-4)' }}>
          <h2 className="text-sm font-semibold mb-6" style={{ color: 'var(--color-ink)' }}>Hoạt động theo ngày</h2>
          <div className="flex items-end justify-between h-40 gap-2">
            {activity.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex flex-col items-center gap-0.5 justify-end" style={{ height: '120px' }}>
                  <div className="w-full rounded-t-sm transition-all" style={{
                    height: `${(d.ai / max) * 100}px`,
                    background: 'var(--color-accent)',
                    opacity: 0.7,
                    minHeight: d.ai > 0 ? '4px' : '0'
                  }} />
                  <div className="w-full rounded-t-sm transition-all" style={{
                    height: `${((d.messages - d.ai) / max) * 100}px`,
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

        {/* Overview summary — 1 col */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-paper-4)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>Tỷ lệ AI</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: 'var(--color-ink-2)' }}>AI / Tổng tin</span>
                <span className="text-xs tabular-nums" style={{ color: 'var(--color-muted)' }}>{aiRatio.toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--color-paper-4)' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, aiRatio)}%`, background: 'var(--color-accent)' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: 'var(--color-ink-2)' }}>Chờ duyệt</span>
                <span className="text-xs tabular-nums" style={{ color: 'var(--color-warning)' }}>{overview?.pendingApprovals ?? 0}</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--color-paper-4)' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (overview?.pendingApprovals ?? 0) / Math.max(1, overview?.aiResponses ?? 1) * 100)}%`, background: 'var(--color-warning)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Performance */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Phản hồi AI', value: (overview?.aiResponses ?? 0).toLocaleString(), color: 'var(--color-accent)' },
          { label: 'Chờ duyệt', value: (overview?.pendingApprovals ?? 0).toLocaleString(), color: 'var(--color-warning)' },
          { label: 'Tri thức', value: (overview?.knowledgeItems ?? 0).toLocaleString(), color: 'var(--color-success)' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl px-5 py-4 text-center" style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-paper-4)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>{item.label}</p>
            <p className="text-2xl font-semibold tabular-nums" style={{ color: item.color, letterSpacing: '-0.03em' }}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

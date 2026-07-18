import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, BookOpen, Tag, X, Check } from 'lucide-react'
import { knowledgeApi } from '../services/api'

interface Article {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  isActive: boolean
}

const CATEGORIES = ['pricing', 'policy', 'faq', 'product', 'custom']

export default function Knowledge() {
  const [items, setItems] = useState<Article[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)
  const [form, setForm] = useState({ title: '', content: '', category: 'pricing', tags: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    knowledgeApi.list({ search: query || undefined })
      .then((data) => setItems(data.items || []))
      .catch((e) => setError(e?.response?.data?.error || 'Không tải được'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [query])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', content: '', category: 'pricing', tags: '' })
    setShowModal(true)
  }

  const openEdit = (item: Article) => {
    setEditing(item)
    setForm({ title: item.title, content: item.content, category: item.category, tags: item.tags.join(', ') })
    setShowModal(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
    try {
      if (editing) {
        await knowledgeApi.update(editing.id, { title: form.title, content: form.content, category: form.category, tags })
      } else {
        await knowledgeApi.create({ title: form.title, content: form.content, category: form.category, tags })
      }
      setShowModal(false)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Lưu thất bại')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa mục tri thức này?')) return
    try {
      await knowledgeApi.remove(id)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Xóa thất bại')
    }
  }

  const activeCount = items.filter((i) => i.isActive).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>
            Kiến thức
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            {loading ? 'Đang tải...' : `${activeCount} bài đang hoạt động / ${items.length} tổng`}
          </p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'var(--color-accent)', color: 'var(--color-accent-ink)' }}>
          <Plus className="w-4 h-4" /> Thêm
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-muted)' }} />
        <input type="text" placeholder="Tìm kiếm..." value={query} onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-paper-4)', color: 'var(--color-ink)' }} />
      </div>

      {error && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}

      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-4 px-5 py-4 rounded-2xl transition-all"
            style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-paper-4)', opacity: item.isActive ? 1 : 0.5 }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-accent-soft)' }}>
              <BookOpen className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{item.title}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--color-paper-3)', color: 'var(--color-muted)' }}>{item.category}</span>
              </div>
              <p className="text-sm line-clamp-2 mb-2" style={{ color: 'var(--color-ink-2)' }}>{item.content}</p>
              <div className="flex items-center gap-2">
                {item.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-muted)' }}>
                    <Tag className="w-3 h-3" />{t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => openEdit(item)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: 'var(--color-muted)' }}>
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: 'var(--color-muted)' }}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-paper-4)' }}>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Chưa có mục tri thức nào.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'oklch(0% 0 0 / 0.6)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-paper-4)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-paper-4)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>{editing ? 'Sửa' : 'Thêm'} bài viết</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" style={{ color: 'var(--color-muted)' }} /></button>
            </div>
            <form className="p-6 space-y-4" onSubmit={submit}>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-muted)' }}>Tiêu đề</label>
                <input
                  placeholder="VD: Bảng giá dịch vụ"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid var(--color-paper-4)', color: 'var(--color-ink)', background: 'var(--color-paper)' }}
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-muted)' }}>Nội dung</label>
                <textarea rows={4}
                  placeholder="Nội dung chi tiết..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ border: '1px solid var(--color-paper-4)', color: 'var(--color-ink)', background: 'var(--color-paper)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--color-muted)' }}>Danh mục</label>
                  <select value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid var(--color-paper-4)', color: 'var(--color-ink)', background: 'var(--color-paper)' }}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--color-muted)' }}>Tags (cách nhau bởi dấu phẩy)</label>
                  <input
                    placeholder="giá, thanh toán"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid var(--color-paper-4)', color: 'var(--color-ink)', background: 'var(--color-paper)' }} />
                </div>
              </div>
              {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 rounded-xl text-sm" style={{ color: 'var(--color-ink-2)' }}>Hủy</button>
                <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50" style={{ background: 'var(--color-accent)', color: 'var(--color-accent-ink)' }}>
                  <Check className="w-4 h-4" />{busy ? 'Đang lưu...' : (editing ? 'Cập nhật' : 'Thêm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

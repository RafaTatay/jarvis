import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Plus, X, FileText, Bot, User, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const STATUSES = ['draft', 'review', 'approved', 'published']
const STATUS_COLORS = {
  draft: 'text-gray-400 border-gray-700',
  review: 'text-mission-yellow border-mission-yellow/30',
  approved: 'text-mission-cyan border-mission-cyan/30',
  published: 'text-mission-green border-mission-green/30',
}
const CONTENT_TYPES = ['blog', 'social', 'email', 'ad_copy', 'video_script', 'landing_page']
const PLATFORMS = ['Website', 'Instagram', 'LinkedIn', 'X/Twitter', 'TikTok', 'YouTube', 'Email', 'Facebook']

function CreateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', content_type: 'blog', platform: '', body: '', created_by: 'human' })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try { await onCreate(form); onClose() } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">New Content</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-mission-muted mb-1 block">Title *</label>
            <input required value={form.title} onChange={e => setForm(s => ({ ...s, title: e.target.value }))}
              className="w-full bg-mission-surface border border-mission-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-mission-cyan/50"
              placeholder="Content title..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-mission-muted mb-1 block">Type</label>
              <select value={form.content_type} onChange={e => setForm(s => ({ ...s, content_type: e.target.value }))}
                className="w-full bg-mission-surface border border-mission-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-mission-cyan/50">
                {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-mission-muted mb-1 block">Platform</label>
              <select value={form.platform} onChange={e => setForm(s => ({ ...s, platform: e.target.value }))}
                className="w-full bg-mission-surface border border-mission-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-mission-cyan/50">
                <option value="">Select...</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-mission-muted mb-1 block">Content Body</label>
            <textarea value={form.body} onChange={e => setForm(s => ({ ...s, body: e.target.value }))}
              rows={4}
              className="w-full bg-mission-surface border border-mission-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-mission-cyan/50 resize-none"
              placeholder="Write content or leave blank to generate with AI..." />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ContentCard({ item, onStatusChange, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={clsx('card border rounded-xl', STATUS_COLORS[item.status])}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wider text-mission-muted bg-mission-surface px-2 py-0.5 rounded-full">{item.content_type}</span>
            {item.platform && <span className="text-[10px] text-mission-muted">{item.platform}</span>}
            <div className="flex items-center gap-1">
              {item.created_by === 'ai_agent' ? <Bot size={10} className="text-mission-cyan" /> : <User size={10} className="text-gray-400" />}
              <span className="text-[10px] text-mission-muted">{item.created_by === 'ai_agent' ? 'AI' : 'Human'}</span>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-white truncate">{item.title}</h3>
          {item.body && (
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-[10px] text-mission-muted mt-1 hover:text-mission-cyan">
              <ChevronRight size={10} className={clsx('transition-transform', expanded && 'rotate-90')} />
              {expanded ? 'Collapse' : 'Preview'}
            </button>
          )}
          {expanded && item.body && (
            <div className="mt-2 p-2 bg-mission-surface rounded text-xs text-gray-400 max-h-40 overflow-y-auto whitespace-pre-wrap">
              {item.body}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0 items-end">
          <select
            value={item.status}
            onChange={e => onStatusChange(item.id, e.target.value)}
            onClick={e => e.stopPropagation()}
            className="bg-mission-surface border border-mission-border rounded px-2 py-1 text-xs text-gray-300 focus:outline-none"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => onDelete(item.id)} className="text-[10px] text-mission-muted hover:text-mission-red">
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ContentPipeline({ refreshKey }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState('all')

  const load = () => {
    setLoading(true)
    api.getContent().then(setItems).finally(() => setLoading(false))
  }

  useEffect(load, [refreshKey])

  const handleCreate = async (data) => { await api.createContent(data); load() }
  const handleStatusChange = async (id, status) => { await api.updateContent(id, { status }); load() }
  const handleDelete = async (id) => { if (!confirm('Delete?')) return; await api.deleteContent(id); load() }

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)
  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: items.filter(i => i.status === s).length }), {})

  return (
    <div className="p-6 h-full overflow-y-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Content Pipeline</h2>
          <p className="text-xs text-mission-muted">{items.length} pieces · {counts.published || 0} published</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> New Content
        </button>
      </div>

      {/* Status Pipeline */}
      <div className="grid grid-cols-4 gap-2">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(filter === s ? 'all' : s)}
            className={clsx('card text-center transition-all', filter === s ? 'border-mission-cyan/40' : '')}>
            <p className={clsx('text-xl font-bold font-mono', STATUS_COLORS[s])}>{counts[s] || 0}</p>
            <p className="text-[10px] text-mission-muted uppercase mt-0.5">{s}</p>
          </button>
        ))}
      </div>

      {/* Content List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-mission-cyan/30 border-t-mission-cyan animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <ContentCard key={item.id} item={item} onStatusChange={handleStatusChange} onDelete={handleDelete} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-mission-muted">
              <FileText size={32} className="mx-auto mb-2 opacity-40" />
              <p>No content {filter !== 'all' ? `in "${filter}"` : ''}. Create some or use AI Agents to generate.</p>
            </div>
          )}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  )
}

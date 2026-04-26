import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Plus, TrendingUp, DollarSign, Eye, MousePointerClick, Target, X } from 'lucide-react'
import clsx from 'clsx'

function StatusBadge({ status }) {
  const cls = { active: 'badge-active', planning: 'badge-planning', paused: 'badge-paused', completed: 'badge-completed' }
  return <span className={cls[status] || 'badge-paused'}>{status}</span>
}

function ProgressBar({ value, max, color = 'bg-mission-cyan' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-1.5 bg-mission-border rounded-full overflow-hidden">
      <div className={clsx('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

const CHANNELS = ['Google Ads', 'Meta Ads', 'LinkedIn Ads', 'TikTok', 'YouTube', 'Email', 'SEO', 'Display', 'Twitter/X']

function CreateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', channel: '', budget: '', status: 'planning' })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onCreate({ ...form, budget: parseFloat(form.budget) || 0 })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">New Campaign</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-mission-muted mb-1 block">Campaign Name *</label>
            <input required value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
              className="w-full bg-mission-surface border border-mission-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-mission-cyan/50"
              placeholder="Q3 Lead Generation" />
          </div>
          <div>
            <label className="text-xs text-mission-muted mb-1 block">Channel</label>
            <select value={form.channel} onChange={e => setForm(s => ({ ...s, channel: e.target.value }))}
              className="w-full bg-mission-surface border border-mission-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-mission-cyan/50">
              <option value="">Select channel...</option>
              {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-mission-muted mb-1 block">Budget ($)</label>
            <input type="number" value={form.budget} onChange={e => setForm(s => ({ ...s, budget: e.target.value }))}
              className="w-full bg-mission-surface border border-mission-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-mission-cyan/50"
              placeholder="10000" />
          </div>
          <div>
            <label className="text-xs text-mission-muted mb-1 block">Status</label>
            <select value={form.status} onChange={e => setForm(s => ({ ...s, status: e.target.value }))}
              className="w-full bg-mission-surface border border-mission-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-mission-cyan/50">
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CampaignManager({ refreshKey }) {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState('all')

  const load = () => {
    setLoading(true)
    api.getCampaigns().then(setCampaigns).finally(() => setLoading(false))
  }

  useEffect(load, [refreshKey])

  const filtered = filter === 'all' ? campaigns : campaigns.filter(c => c.status === filter)

  const handleCreate = async (data) => {
    await api.createCampaign(data)
    load()
  }

  const handleStatusChange = async (id, status) => {
    await api.updateCampaign(id, { status })
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this campaign?')) return
    await api.deleteCampaign(id)
    load()
  }

  const total = campaigns.length
  const active = campaigns.filter(c => c.status === 'active').length
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0)
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0)

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Campaigns</h2>
          <p className="text-xs text-mission-muted">{active} active · {total} total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> New Campaign
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Budget', value: `$${totalBudget.toLocaleString()}`, icon: DollarSign, color: 'text-mission-yellow' },
          { label: 'Total Spent', value: `$${totalSpent.toLocaleString()}`, icon: TrendingUp, color: 'text-mission-cyan' },
          { label: 'Total Impressions', value: campaigns.reduce((s, c) => s + c.impressions, 0).toLocaleString(), icon: Eye, color: 'text-purple-400' },
          { label: 'Total Conversions', value: campaigns.reduce((s, c) => s + c.conversions, 0).toLocaleString(), icon: Target, color: 'text-mission-green' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3">
            <Icon size={18} className={color} />
            <div>
              <p className={clsx('text-base font-bold font-mono', color)}>{value}</p>
              <p className="text-[10px] text-mission-muted uppercase">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1">
        {['all', 'active', 'planning', 'paused', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
              filter === f ? 'bg-mission-cyan/10 text-mission-cyan border border-mission-cyan/20' : 'text-gray-500 hover:text-gray-300')}>
            {f}
          </button>
        ))}
      </div>

      {/* Campaign Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-mission-cyan/30 border-t-mission-cyan animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id} className="card-glow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white truncate">{c.name}</h3>
                    <StatusBadge status={c.status} />
                    {c.channel && <span className="text-[10px] text-mission-muted bg-mission-surface px-2 py-0.5 rounded-full">{c.channel}</span>}
                  </div>

                  {/* Budget Progress */}
                  <div className="mb-2">
                    <div className="flex justify-between text-[10px] text-mission-muted mb-1">
                      <span>Budget usage</span>
                      <span>${c.spent.toLocaleString()} / ${c.budget.toLocaleString()}</span>
                    </div>
                    <ProgressBar value={c.spent} max={c.budget} />
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { label: 'Impressions', value: c.impressions.toLocaleString(), color: 'text-purple-400' },
                      { label: 'Clicks', value: c.clicks.toLocaleString(), color: 'text-mission-cyan' },
                      { label: 'CTR', value: `${c.ctr}%`, color: 'text-mission-yellow' },
                      { label: 'Conversions', value: c.conversions.toLocaleString(), color: 'text-mission-green' },
                      { label: 'CPA', value: c.cpa > 0 ? `$${c.cpa}` : '—', color: 'text-pink-400' },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <p className={clsx('text-sm font-bold font-mono', color)}>{value}</p>
                        <p className="text-[10px] text-mission-muted">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  <select
                    value={c.status}
                    onChange={e => handleStatusChange(c.id, e.target.value)}
                    className="bg-mission-surface border border-mission-border rounded px-2 py-1 text-xs text-gray-300 focus:outline-none"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button onClick={() => handleDelete(c.id)} className="text-[10px] text-mission-muted hover:text-mission-red text-center">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-mission-muted">
              <p>No campaigns found. Create one to get started.</p>
            </div>
          )}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  )
}

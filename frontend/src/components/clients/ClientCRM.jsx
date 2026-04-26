import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Plus, X, Heart, TrendingUp, Briefcase } from 'lucide-react'
import clsx from 'clsx'

function HealthScore({ score }) {
  const color = score >= 80 ? 'text-mission-green' : score >= 60 ? 'text-mission-yellow' : 'text-mission-red'
  const bar = score >= 80 ? 'bg-mission-green' : score >= 60 ? 'bg-mission-yellow' : 'bg-mission-red'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-mission-border rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full', bar)} style={{ width: `${score}%` }} />
      </div>
      <span className={clsx('text-xs font-mono font-bold w-6 text-right', color)}>{score}</span>
    </div>
  )
}

function CreateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', industry: '', email: '', budget: '' })
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
          <h3 className="text-base font-semibold text-white">New Client</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {[
            { key: 'name', label: 'Company Name *', required: true, placeholder: 'Acme Corp' },
            { key: 'industry', label: 'Industry', placeholder: 'SaaS, E-commerce, Finance...' },
            { key: 'email', label: 'Contact Email', placeholder: 'marketing@company.com' },
            { key: 'budget', label: 'Monthly Budget ($)', placeholder: '10000', type: 'number' },
          ].map(({ key, label, required, placeholder, type = 'text' }) => (
            <div key={key}>
              <label className="text-xs text-mission-muted mb-1 block">{label}</label>
              <input
                type={type}
                required={required}
                value={form[key]}
                onChange={e => setForm(s => ({ ...s, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-mission-surface border border-mission-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-mission-cyan/50"
              />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Adding...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ClientCRM({ refreshKey }) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState(null)

  const load = () => {
    setLoading(true)
    api.getClients().then(setClients).finally(() => setLoading(false))
  }

  useEffect(load, [refreshKey])

  const handleCreate = async (data) => {
    await api.createClient(data)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this client?')) return
    await api.deleteClient(id)
    setSelected(null)
    load()
  }

  const totalBudget = clients.reduce((s, c) => s + c.budget, 0)
  const avgHealth = clients.length > 0 ? Math.round(clients.reduce((s, c) => s + c.health_score, 0) / clients.length) : 0

  return (
    <div className="p-6 h-full overflow-y-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Client CRM</h2>
          <p className="text-xs text-mission-muted">{clients.length} clients · Avg health {avgHealth}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Client
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Clients', value: clients.length, icon: Briefcase, color: 'text-mission-cyan' },
          { label: 'Total Monthly Budget', value: `$${totalBudget.toLocaleString()}`, icon: TrendingUp, color: 'text-mission-yellow' },
          { label: 'Avg Health Score', value: avgHealth, icon: Heart, color: avgHealth >= 80 ? 'text-mission-green' : 'text-mission-yellow' },
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

      {/* Client Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-mission-cyan/30 border-t-mission-cyan animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {clients.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelected(selected?.id === c.id ? null : c)}
              className={clsx('card-glow cursor-pointer transition-all duration-200',
                selected?.id === c.id && 'border-mission-cyan/40 bg-mission-cyan/5')}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{c.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {c.industry && <span className="text-[10px] text-mission-muted">{c.industry}</span>}
                    {c.email && <span className="text-[10px] text-mission-muted">· {c.email}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-mission-yellow font-mono">${c.budget.toLocaleString()}</p>
                  <p className="text-[10px] text-mission-muted">monthly</p>
                </div>
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-[10px] text-mission-muted mb-1">
                  <span>Health Score</span>
                  <span>{c.campaign_count} campaigns</span>
                </div>
                <HealthScore score={c.health_score} />
              </div>

              {selected?.id === c.id && (
                <div className="mt-3 pt-3 border-t border-mission-border flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }}
                    className="text-xs text-mission-red hover:underline"
                  >
                    Delete Client
                  </button>
                </div>
              )}
            </div>
          ))}

          {clients.length === 0 && (
            <div className="col-span-2 text-center py-12 text-mission-muted">
              <p>No clients yet. Add your first client.</p>
            </div>
          )}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  )
}

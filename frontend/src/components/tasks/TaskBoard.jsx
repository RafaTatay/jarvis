import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Plus, X, CheckSquare, Clock, Eye, Check } from 'lucide-react'
import clsx from 'clsx'

const COLUMNS = [
  { key: 'todo', label: 'To Do', icon: Clock, color: 'text-gray-400' },
  { key: 'in_progress', label: 'In Progress', icon: CheckSquare, color: 'text-mission-cyan' },
  { key: 'review', label: 'Review', icon: Eye, color: 'text-mission-yellow' },
  { key: 'done', label: 'Done', icon: Check, color: 'text-mission-green' },
]

const PRIORITY_COLORS = {
  low: 'text-gray-500',
  medium: 'text-mission-yellow',
  high: 'text-mission-red',
}

function CreateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignee: '' })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try { await onCreate(form); onClose() } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">New Task</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-mission-muted mb-1 block">Task Title *</label>
            <input required value={form.title} onChange={e => setForm(s => ({ ...s, title: e.target.value }))}
              className="w-full bg-mission-surface border border-mission-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-mission-cyan/50"
              placeholder="Write 5 ad variants..." />
          </div>
          <div>
            <label className="text-xs text-mission-muted mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
              rows={2} className="w-full bg-mission-surface border border-mission-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-mission-cyan/50 resize-none"
              placeholder="Optional details..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-mission-muted mb-1 block">Priority</label>
              <select value={form.priority} onChange={e => setForm(s => ({ ...s, priority: e.target.value }))}
                className="w-full bg-mission-surface border border-mission-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-mission-cyan/50">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-mission-muted mb-1 block">Assignee</label>
              <input value={form.assignee} onChange={e => setForm(s => ({ ...s, assignee: e.target.value }))}
                className="w-full bg-mission-surface border border-mission-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-mission-cyan/50"
                placeholder="Team member..." />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TaskCard({ task, onMove, onDelete }) {
  return (
    <div className="card-glow group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-xs font-medium text-gray-200 leading-snug flex-1">{task.title}</h4>
        <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-mission-muted hover:text-mission-red transition-all">
          <X size={12} />
        </button>
      </div>
      {task.description && <p className="text-[10px] text-mission-muted mb-2 leading-snug">{task.description}</p>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={clsx('text-[10px] font-medium uppercase', PRIORITY_COLORS[task.priority])}>{task.priority}</span>
          {task.assignee && <span className="text-[10px] text-mission-muted">{task.assignee}</span>}
        </div>
        <select
          value={task.status}
          onChange={e => onMove(task.id, e.target.value)}
          className="bg-transparent text-[10px] text-mission-muted focus:outline-none cursor-pointer"
        >
          {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </div>
    </div>
  )
}

export default function TaskBoard({ refreshKey }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const load = () => {
    setLoading(true)
    api.getTasks().then(setTasks).finally(() => setLoading(false))
  }

  useEffect(load, [refreshKey])

  const handleCreate = async (data) => { await api.createTask(data); load() }
  const handleMove = async (id, status) => { await api.updateTask(id, { status }); load() }
  const handleDelete = async (id) => { await api.deleteTask(id); load() }

  const byStatus = COLUMNS.reduce((acc, col) => ({
    ...acc,
    [col.key]: tasks.filter(t => t.status === col.key),
  }), {})

  return (
    <div className="p-6 h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold text-white">Task Board</h2>
          <p className="text-xs text-mission-muted">{tasks.length} total · {byStatus.done?.length || 0} done</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> New Task
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-mission-cyan/30 border-t-mission-cyan animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3 flex-1 overflow-hidden">
          {COLUMNS.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="flex flex-col bg-mission-surface/40 rounded-xl border border-mission-border overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-mission-border shrink-0">
                <Icon size={13} className={color} />
                <span className="text-xs font-medium text-gray-300">{label}</span>
                <span className="ml-auto text-xs font-mono text-mission-muted">{byStatus[key]?.length || 0}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {(byStatus[key] || []).map(task => (
                  <TaskCard key={task.id} task={task} onMove={handleMove} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  )
}

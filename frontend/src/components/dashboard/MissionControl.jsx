import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import {
  TrendingUp, Users, Megaphone, Bot, FileText, CheckSquare,
  DollarSign, Eye, MousePointerClick, Target, Zap, AlertCircle,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import clsx from 'clsx'

const AGENT_COLORS = {
  content_writer: 'text-purple-400',
  campaign_strategist: 'text-mission-cyan',
  seo_agent: 'text-mission-green',
  social_media: 'text-pink-400',
  analytics: 'text-mission-yellow',
}

const AGENT_LABELS = {
  content_writer: 'Content Writer',
  campaign_strategist: 'Campaign Strategist',
  seo_agent: 'SEO Agent',
  social_media: 'Social Media',
  analytics: 'Analytics',
}

// Simulated sparkline data for visual richness
function genSparkline(base, points = 12) {
  return Array.from({ length: points }, (_, i) => ({
    t: i,
    v: Math.round(base * (0.7 + Math.random() * 0.6)),
  }))
}

function MetricCard({ label, value, icon: Icon, color, delta, prefix = '', suffix = '', sparkData }) {
  return (
    <div className="card-glow flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        <div className={clsx('p-1.5 rounded-lg', color.bg)}>
          <Icon size={14} className={color.text} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className={clsx('stat-value', color.text)}>
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </span>
          {delta && (
            <div className={clsx('text-xs mt-0.5', delta > 0 ? 'text-mission-green' : 'text-mission-red')}>
              {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}%
            </div>
          )}
        </div>
        {sparkData && (
          <div className="w-20 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id={`sg-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color.hex} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color.hex} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={color.hex} strokeWidth={1.5}
                  fill={`url(#sg-${label})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const cls = {
    active: 'badge-active',
    planning: 'badge-planning',
    paused: 'badge-paused',
    completed: 'badge-completed',
  }
  return <span className={cls[status] || 'badge-paused'}>{status}</span>
}

const MOCK_CHART = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  impressions: Math.round(30000 + Math.random() * 20000),
  clicks: Math.round(600 + Math.random() * 400),
  conversions: Math.round(20 + Math.random() * 30),
}))

export default function MissionControl({ refreshKey }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getDashboard()
      .then(setData)
      .finally(() => setLoading(false))
  }, [refreshKey])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-mission-cyan/30 border-t-mission-cyan animate-spin mx-auto mb-4" />
          <p className="text-mission-muted text-sm font-mono">Initializing systems...</p>
        </div>
      </div>
    )
  }

  const m = data?.metrics || {}

  const metrics = [
    { label: 'Total Clients', value: m.total_clients, icon: Users, color: { text: 'text-mission-cyan', bg: 'bg-mission-cyan/10', hex: '#00d4ff' }, delta: 12, sparkData: genSparkline(m.total_clients || 5) },
    { label: 'Active Campaigns', value: m.active_campaigns, icon: Megaphone, color: { text: 'text-mission-green', bg: 'bg-mission-green/10', hex: '#00ff88' }, delta: 8, sparkData: genSparkline(m.active_campaigns || 3) },
    { label: 'Total Budget', value: m.total_budget, prefix: '$', icon: DollarSign, color: { text: 'text-mission-yellow', bg: 'bg-mission-yellow/10', hex: '#ffd700' }, sparkData: genSparkline(m.total_budget || 100000) },
    { label: 'Impressions', value: m.total_impressions, icon: Eye, color: { text: 'text-purple-400', bg: 'bg-purple-400/10', hex: '#a78bfa' }, delta: 23, sparkData: genSparkline(m.total_impressions || 500000) },
    { label: 'Clicks', value: m.total_clicks, icon: MousePointerClick, color: { text: 'text-pink-400', bg: 'bg-pink-400/10', hex: '#f472b6' }, delta: 15, sparkData: genSparkline(m.total_clicks || 30000) },
    { label: 'Conversions', value: m.total_conversions, icon: Target, color: { text: 'text-mission-green', bg: 'bg-mission-green/10', hex: '#00ff88' }, delta: 31, sparkData: genSparkline(m.total_conversions || 1000) },
    { label: 'Agent Runs', value: m.agent_runs, icon: Bot, color: { text: 'text-mission-cyan', bg: 'bg-mission-cyan/10', hex: '#00d4ff' }, sparkData: genSparkline(m.agent_runs || 10) },
    { label: 'Content Pieces', value: m.total_content, icon: FileText, color: { text: 'text-orange-400', bg: 'bg-orange-400/10', hex: '#fb923c' }, sparkData: genSparkline(m.total_content || 20) },
  ]

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white glow-cyan">Agency Overview</h2>
          <p className="text-xs text-mission-muted mt-0.5">
            {m.total_campaigns} total campaigns · Overall CTR {m.overall_ctr}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-mission-green pulse-dot" />
          <span className="text-xs text-mission-muted font-mono">LIVE</span>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Performance Chart */}
        <div className="lg:col-span-2 card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">14-Day Performance</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={MOCK_CHART}>
              <defs>
                <linearGradient id="gImpressions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Area type="monotone" dataKey="impressions" stroke="#00d4ff" strokeWidth={2} fill="url(#gImpressions)" name="Impressions" dot={false} />
              <Area type="monotone" dataKey="clicks" stroke="#00ff88" strokeWidth={2} fill="url(#gClicks)" name="Clicks" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Conversions Bar */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Daily Conversions</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MOCK_CHART.slice(-7)}>
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="conversions" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Campaigns */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Recent Campaigns</h3>
          <div className="space-y-2">
            {(data?.recent_campaigns || []).map((c) => {
              const pct = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0
              return (
                <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-mission-surface/60 hover:bg-mission-surface transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-gray-200 truncate font-medium">{c.name}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-mission-border rounded-full overflow-hidden">
                        <div className="h-full bg-mission-cyan rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-mission-muted font-mono">{pct}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Agent Activity */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Zap size={14} className="text-mission-cyan" />
            AI Agent Activity
          </h3>
          {(data?.recent_agent_runs || []).length === 0 ? (
            <div className="text-center py-8">
              <Bot size={32} className="text-mission-muted mx-auto mb-2" />
              <p className="text-mission-muted text-sm">No agent runs yet.</p>
              <p className="text-mission-muted text-xs mt-1">Go to AI Agents to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(data?.recent_agent_runs || []).map((r) => (
                <div key={r.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-mission-surface/60">
                  <Bot size={14} className={clsx('mt-0.5 shrink-0', AGENT_COLORS[r.agent_type] || 'text-gray-400')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={clsx('text-xs font-medium', AGENT_COLORS[r.agent_type])}>{AGENT_LABELS[r.agent_type]}</span>
                      <span className="text-[10px] text-mission-muted font-mono">{r.tokens_used} tokens</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{r.prompt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

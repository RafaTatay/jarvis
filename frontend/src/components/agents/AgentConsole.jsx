import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import ReactMarkdown from 'react-markdown'
import {
  Bot, Zap, FileText, Search, Share2, BarChart2, Megaphone, Wrench,
  ChevronDown, ChevronUp, Clock, Cpu, CheckCircle2, AlertCircle,
} from 'lucide-react'
import clsx from 'clsx'

const AGENTS = [
  {
    id: 'autonomous',
    name: 'JARVIS Autonomous',
    icon: Wrench,
    color: 'text-mission-cyan',
    bg: 'bg-mission-cyan/10',
    border: 'border-mission-cyan/30',
    description: 'Plans and executes — creates clients, campaigns, tasks, content directly',
    forms: ['autonomous'],
  },
  {
    id: 'content_writer',
    name: 'Content Writer',
    icon: FileText,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20',
    description: 'Blog posts, ad copy, email sequences, landing pages',
    forms: ['write_content'],
  },
  {
    id: 'campaign_strategist',
    name: 'Campaign Strategist',
    icon: Megaphone,
    color: 'text-mission-cyan',
    bg: 'bg-mission-cyan/10',
    border: 'border-mission-cyan/20',
    description: 'Full campaign strategy & performance analysis',
    forms: ['campaign_strategy', 'campaign_analysis'],
  },
  {
    id: 'seo_agent',
    name: 'SEO Agent',
    icon: Search,
    color: 'text-mission-green',
    bg: 'bg-mission-green/10',
    border: 'border-mission-green/20',
    description: 'Keyword research & content SEO audits',
    forms: ['keyword_research', 'seo_audit'],
  },
  {
    id: 'social_media',
    name: 'Social Media',
    icon: Share2,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    border: 'border-pink-400/20',
    description: 'Platform posts, hashtags & content calendars',
    forms: ['social_posts', 'content_calendar'],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: BarChart2,
    color: 'text-mission-yellow',
    bg: 'bg-mission-yellow/10',
    border: 'border-mission-yellow/20',
    description: 'Insights from metrics & client performance reports',
    forms: ['analytics_insights', 'client_report'],
  },
]

function AgentForm({ agentId, onResult }) {
  const [activeForm, setActiveForm] = useState(AGENTS.find(a => a.id === agentId)?.forms[0] || '')
  const [loading, setLoading] = useState(false)
  const [fields, setFields] = useState({})

  const set = (k, v) => setFields(f => ({ ...f, [k]: v }))

  const FORMS = {
    autonomous: {
      label: 'Execute Goal',
      inputs: [
        { key: 'goal', label: 'Goal', type: 'textarea', required: true, placeholder: 'e.g. "Onboard a new fitness brand called Pulse Labs and create a 4-week launch campaign with 5 starter tasks"' },
        { key: 'context', label: 'Context (optional)', type: 'textarea', placeholder: 'Any additional info — brand details, constraints, preferences...' },
      ],
      run: () => api.runAutonomous({ goal: fields.goal, context: fields.context || '' }),
    },
    write_content: {
      label: 'Write Content',
      inputs: [
        { key: 'content_type', label: 'Content Type', type: 'select', options: ['blog', 'ad_copy', 'email', 'landing_page', 'product_description', 'case_study'] },
        { key: 'topic', label: 'Topic / Brief', type: 'textarea', required: true, placeholder: 'Describe what to write...' },
        { key: 'target_audience', label: 'Target Audience', placeholder: 'e.g. SaaS founders, age 30-45' },
        { key: 'brand_voice', label: 'Brand Voice', placeholder: 'professional, playful, authoritative...' },
        { key: 'keywords', label: 'Keywords (optional)', placeholder: 'comma-separated' },
      ],
      run: () => api.runContentWriter({ content_type: fields.content_type || 'blog', topic: fields.topic, brand_voice: fields.brand_voice, target_audience: fields.target_audience, keywords: fields.keywords }),
    },
    campaign_strategy: {
      label: 'Campaign Strategy',
      inputs: [
        { key: 'objective', label: 'Campaign Objective', required: true, placeholder: 'Generate 500 qualified leads for SaaS product' },
        { key: 'industry', label: 'Industry', placeholder: 'SaaS, E-commerce, Healthcare...' },
        { key: 'budget', label: 'Total Budget ($)', type: 'number', placeholder: '10000' },
        { key: 'duration_weeks', label: 'Duration (weeks)', type: 'number', placeholder: '8' },
        { key: 'target_audience', label: 'Target Audience', placeholder: 'Decision makers at SMBs...' },
      ],
      run: () => api.runCampaignStrategy({ objective: fields.objective, industry: fields.industry || 'General', budget: parseFloat(fields.budget) || 10000, duration_weeks: parseInt(fields.duration_weeks) || 8, target_audience: fields.target_audience || '' }),
    },
    campaign_analysis: {
      label: 'Analyze Performance',
      inputs: [
        { key: 'campaign_name', label: 'Campaign Name', required: true, placeholder: 'Q2 Lead Gen' },
        { key: 'impressions', label: 'Impressions', type: 'number', placeholder: '100000' },
        { key: 'clicks', label: 'Clicks', type: 'number', placeholder: '2000' },
        { key: 'conversions', label: 'Conversions', type: 'number', placeholder: '50' },
        { key: 'budget', label: 'Budget ($)', type: 'number', placeholder: '5000' },
        { key: 'spent', label: 'Spent ($)', type: 'number', placeholder: '3200' },
      ],
      run: () => api.runCampaignAnalysis({ campaign_name: fields.campaign_name, impressions: parseInt(fields.impressions) || 0, clicks: parseInt(fields.clicks) || 0, conversions: parseInt(fields.conversions) || 0, budget: parseFloat(fields.budget) || 0, spent: parseFloat(fields.spent) || 0 }),
    },
    keyword_research: {
      label: 'Keyword Research',
      inputs: [
        { key: 'topic', label: 'Topic', required: true, placeholder: 'AI marketing automation' },
        { key: 'industry', label: 'Industry', placeholder: 'SaaS, Retail...' },
        { key: 'target_market', label: 'Target Market', placeholder: 'US, Global, LATAM...' },
      ],
      run: () => api.runKeywordResearch({ topic: fields.topic, industry: fields.industry || 'General', target_market: fields.target_market }),
    },
    seo_audit: {
      label: 'SEO Content Audit',
      inputs: [
        { key: 'title', label: 'Content Title', required: true, placeholder: 'Article or page title' },
        { key: 'target_keyword', label: 'Target Keyword', required: true, placeholder: 'Main keyword to rank for' },
        { key: 'content', label: 'Content Body', type: 'textarea', placeholder: 'Paste your content here...' },
      ],
      run: () => api.runSeoAudit({ title: fields.title, content: fields.content || '', target_keyword: fields.target_keyword }),
    },
    social_posts: {
      label: 'Create Social Posts',
      inputs: [
        { key: 'topic', label: 'Topic / Message', required: true, placeholder: 'Product launch, tip, announcement...' },
        { key: 'platforms', label: 'Platforms', placeholder: 'Instagram, LinkedIn, X (comma-separated)' },
        { key: 'brand_voice', label: 'Brand Voice', placeholder: 'professional, casual, inspiring...' },
        { key: 'campaign_goal', label: 'Campaign Goal', type: 'select', options: ['awareness', 'engagement', 'conversion', 'retention'] },
      ],
      run: () => api.runSocialPosts({ topic: fields.topic, platforms: (fields.platforms || 'Instagram, LinkedIn, X').split(',').map(s => s.trim()), brand_voice: fields.brand_voice || 'professional', campaign_goal: fields.campaign_goal || 'awareness' }),
    },
    content_calendar: {
      label: 'Content Calendar',
      inputs: [
        { key: 'brand', label: 'Brand Name', required: true, placeholder: 'Acme Corp' },
        { key: 'industry', label: 'Industry', placeholder: 'SaaS, E-commerce...' },
        { key: 'weeks', label: 'Weeks', type: 'number', placeholder: '4' },
        { key: 'posting_frequency', label: 'Frequency', type: 'select', options: ['daily', '3x per week', '5x per week', 'twice daily'] },
      ],
      run: () => api.runContentCalendar({ brand: fields.brand, industry: fields.industry || 'General', weeks: parseInt(fields.weeks) || 4, posting_frequency: fields.posting_frequency || 'daily' }),
    },
    analytics_insights: {
      label: 'Analytics Insights',
      inputs: [
        { key: 'impressions', label: 'Impressions', type: 'number', placeholder: '500000' },
        { key: 'clicks', label: 'Clicks', type: 'number', placeholder: '15000' },
        { key: 'conversions', label: 'Conversions', type: 'number', placeholder: '300' },
        { key: 'revenue', label: 'Revenue ($)', type: 'number', placeholder: '45000' },
        { key: 'spend', label: 'Ad Spend ($)', type: 'number', placeholder: '8000' },
        { key: 'context', label: 'Context (optional)', placeholder: 'Q2 e-commerce campaign, targeting 25-40 female...' },
      ],
      run: () => api.runAnalyticsInsights({ metrics: { Impressions: parseInt(fields.impressions) || 0, Clicks: parseInt(fields.clicks) || 0, Conversions: parseInt(fields.conversions) || 0, Revenue: `$${fields.revenue || 0}`, 'Ad Spend': `$${fields.spend || 0}`, CTR: fields.clicks && fields.impressions ? `${(fields.clicks / fields.impressions * 100).toFixed(2)}%` : '0%' }, context: fields.context || '' }),
    },
    client_report: {
      label: 'Client Report',
      inputs: [
        { key: 'client_name', label: 'Client Name', required: true, placeholder: 'TechFlow SaaS' },
        { key: 'period', label: 'Period', placeholder: 'Q2 2024 / April 2024...' },
        { key: 'campaign_data', label: 'Campaign Data (JSON)', type: 'textarea', placeholder: '[{"name":"Campaign 1","impressions":100000,"clicks":2000,"conversions":50,"budget":5000,"spent":4200}]' },
      ],
      run: () => {
        let campaigns = []
        try { campaigns = JSON.parse(fields.campaign_data || '[]') } catch { campaigns = [] }
        return api.runClientReport({ client_name: fields.client_name, period: fields.period || 'This period', campaigns })
      },
    },
  }

  const form = FORMS[activeForm]
  const agent = AGENTS.find(a => a.id === agentId)

  const handleRun = async () => {
    if (!form) return
    setLoading(true)
    try {
      const result = await form.run()
      onResult(result)
    } catch (e) {
      onResult({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  if (!agent || !form) return null

  const formTabs = agent.forms.map(f => ({ key: f, label: FORMS[f]?.label || f }))

  return (
    <div className="space-y-3">
      {formTabs.length > 1 && (
        <div className="flex gap-1">
          {formTabs.map(({ key, label }) => (
            <button key={key} onClick={() => { setActiveForm(key); setFields({}) }}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                activeForm === key ? `${agent.bg} ${agent.color} border ${agent.border}` : 'text-gray-500 hover:text-gray-300')}>
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2.5">
        {form.inputs.map(({ key, label, type = 'text', required, placeholder, options }) => (
          <div key={key}>
            <label className="text-xs text-mission-muted mb-1 block">{label}{required && ' *'}</label>
            {type === 'textarea' ? (
              <textarea value={fields[key] || ''} onChange={e => set(key, e.target.value)} rows={3} placeholder={placeholder}
                className="w-full bg-mission-bg border border-mission-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-mission-cyan/50 resize-none" />
            ) : type === 'select' ? (
              <select value={fields[key] || options[0]} onChange={e => set(key, e.target.value)}
                className="w-full bg-mission-bg border border-mission-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-mission-cyan/50">
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input type={type} value={fields[key] || ''} onChange={e => set(key, e.target.value)} placeholder={placeholder}
                className="w-full bg-mission-bg border border-mission-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-mission-cyan/50" />
            )}
          </div>
        ))}
      </div>

      <button onClick={handleRun} disabled={loading}
        className={clsx('w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all',
          loading ? 'opacity-50 cursor-not-allowed bg-mission-cyan/20 text-mission-cyan' : `btn-primary`)}>
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Agent running...
          </>
        ) : (
          <>
            <Zap size={14} />
            Run {agent.name}
          </>
        )}
      </button>
    </div>
  )
}

function RunHistory({ runs }) {
  const [expanded, setExpanded] = useState(null)
  const AGENT_LABELS = { content_writer: 'Content Writer', campaign_strategist: 'Strategist', seo_agent: 'SEO', social_media: 'Social', analytics: 'Analytics' }
  const AGENT_COLORS = { content_writer: 'text-purple-400', campaign_strategist: 'text-mission-cyan', seo_agent: 'text-mission-green', social_media: 'text-pink-400', analytics: 'text-mission-yellow' }

  return (
    <div className="space-y-2">
      {runs.map(r => (
        <div key={r.id} className="card text-sm">
          <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="w-full flex items-center gap-3 text-left">
            <Bot size={14} className={AGENT_COLORS[r.agent_type] || 'text-gray-400'} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={clsx('text-xs font-medium', AGENT_COLORS[r.agent_type])}>{AGENT_LABELS[r.agent_type]}</span>
                <span className="text-[10px] text-mission-muted flex items-center gap-1">
                  <Clock size={9} />{new Date(r.created_at).toLocaleTimeString()}
                </span>
                <span className="text-[10px] text-mission-muted flex items-center gap-1 ml-auto">
                  <Cpu size={9} />{r.tokens_used} tokens · {r.duration_ms}ms
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate mt-0.5">{r.prompt}</p>
            </div>
            {expanded === r.id ? <ChevronUp size={12} className="text-mission-muted shrink-0" /> : <ChevronDown size={12} className="text-mission-muted shrink-0" />}
          </button>
          {expanded === r.id && r.result_preview && (
            <div className="mt-2 pt-2 border-t border-mission-border text-xs text-gray-400 leading-relaxed">
              {r.result_preview}...
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function AgentConsole({ refreshKey }) {
  const [selected, setSelected] = useState('content_writer')
  const [result, setResult] = useState(null)
  const [runs, setRuns] = useState([])

  const loadRuns = () => api.getAgentRuns(15).then(setRuns).catch(() => {})

  useEffect(loadRuns, [refreshKey])

  const handleResult = (r) => {
    setResult(r)
    loadRuns()
  }

  const agent = AGENTS.find(a => a.id === selected)

  return (
    <div className="h-full flex overflow-hidden">
      {/* Agent Selector */}
      <div className="w-52 shrink-0 border-r border-mission-border p-3 space-y-1 overflow-y-auto">
        <p className="text-[10px] text-mission-muted uppercase tracking-wider px-2 mb-2">Agents</p>
        {AGENTS.map(a => (
          <button key={a.id} onClick={() => { setSelected(a.id); setResult(null) }}
            className={clsx('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all',
              selected === a.id ? `${a.bg} ${a.color} border ${a.border}` : 'text-gray-400 hover:text-gray-200 hover:bg-white/5')}>
            <a.icon size={15} className="shrink-0" />
            <div>
              <p className="text-xs font-medium">{a.name}</p>
              <p className="text-[10px] text-mission-muted leading-snug hidden group-hover:block">{a.description}</p>
            </div>
          </button>
        ))}
        <div className="pt-3 border-t border-mission-border mt-3">
          <p className="text-[10px] text-mission-muted uppercase tracking-wider px-2 mb-2">Recent Runs</p>
          <RunHistory runs={runs} />
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Form */}
        <div className="w-96 shrink-0 border-r border-mission-border p-5 overflow-y-auto">
          {agent && (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className={clsx('p-2 rounded-lg', agent.bg)}>
                  <agent.icon size={18} className={agent.color} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{agent.name}</h3>
                  <p className="text-[10px] text-mission-muted">{agent.description}</p>
                </div>
              </div>
              <AgentForm agentId={selected} onResult={handleResult} />
            </>
          )}
        </div>

        {/* Result */}
        <div className="flex-1 p-5 overflow-y-auto">
          {result ? (
            result.error ? (
              <div className="card border-mission-red/30 bg-mission-red/5">
                <p className="text-mission-red text-sm font-medium mb-1">Agent Error</p>
                <p className="text-gray-400 text-xs">{result.error}</p>
                <p className="text-[10px] text-mission-muted mt-2">Make sure ANTHROPIC_API_KEY is set in your .env file.</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-mission-green" />
                    <span className="text-sm font-semibold text-mission-green">Agent Output</span>
                  </div>
                  <div className="flex items-center gap-3 ml-auto text-[10px] text-mission-muted font-mono">
                    <span>{result.tokens_used} tokens</span>
                    <span>{result.duration_ms}ms</span>
                  </div>
                </div>
                {result.actions && result.actions.length > 0 && (
                  <div className="mb-5 card bg-mission-cyan/5 border-mission-cyan/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Wrench size={13} className="text-mission-cyan" />
                      <span className="text-xs font-semibold text-mission-cyan uppercase tracking-wider">
                        {result.actions.length} action{result.actions.length === 1 ? '' : 's'} executed
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {result.actions.map((a, i) => {
                        const ok = !(a.result && a.result.error)
                        return (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            {ok
                              ? <CheckCircle2 size={12} className="text-mission-green shrink-0 mt-0.5" />
                              : <AlertCircle size={12} className="text-mission-red shrink-0 mt-0.5" />}
                            <div className="flex-1 min-w-0 font-mono">
                              <span className="text-mission-cyan">{a.tool}</span>
                              <span className="text-mission-muted">(</span>
                              <span className="text-gray-400">
                                {Object.entries(a.input || {}).map(([k, v]) => `${k}=${typeof v === 'string' && v.length > 30 ? v.slice(0, 30) + '…' : JSON.stringify(v)}`).join(', ')}
                              </span>
                              <span className="text-mission-muted">)</span>
                              {a.result?.id && <span className="text-mission-green ml-2">→ id {a.result.id}</span>}
                              {a.result?.error && <span className="text-mission-red ml-2">→ {a.result.error}</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                <div className="markdown-content prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{result.result}</ReactMarkdown>
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-mission-cyan/5 border border-mission-cyan/10 flex items-center justify-center mb-4">
                <Bot size={28} className="text-mission-cyan/40" />
              </div>
              <p className="text-gray-500 text-sm">Select an agent, fill the form,</p>
              <p className="text-gray-600 text-xs mt-1">and click Run to generate output.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

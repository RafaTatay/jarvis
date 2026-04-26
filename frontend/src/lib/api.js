const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Clients
  getClients: () => request('/clients'),
  getClient: (id) => request(`/clients/${id}`),
  createClient: (data) => request('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id, data) => request(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteClient: (id) => request(`/clients/${id}`, { method: 'DELETE' }),

  // Campaigns
  getCampaigns: () => request('/campaigns'),
  getCampaign: (id) => request(`/campaigns/${id}`),
  createCampaign: (data) => request('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  updateCampaign: (id, data) => request(`/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCampaign: (id) => request(`/campaigns/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (campaignId) => request(`/tasks${campaignId ? `?campaign_id=${campaignId}` : ''}`),
  createTask: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  // Content
  getContent: (campaignId) => request(`/content${campaignId ? `?campaign_id=${campaignId}` : ''}`),
  createContent: (data) => request('/content', { method: 'POST', body: JSON.stringify(data) }),
  updateContent: (id, data) => request(`/content/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteContent: (id) => request(`/content/${id}`, { method: 'DELETE' }),

  // Agent Runs
  getAgentRuns: (limit = 20) => request(`/agents/runs?limit=${limit}`),

  // Agents
  runContentWriter: (data) => request('/agents/content-writer', { method: 'POST', body: JSON.stringify(data) }),
  runCampaignStrategy: (data) => request('/agents/campaign-strategy', { method: 'POST', body: JSON.stringify(data) }),
  runCampaignAnalysis: (data) => request('/agents/campaign-analysis', { method: 'POST', body: JSON.stringify(data) }),
  runKeywordResearch: (data) => request('/agents/keyword-research', { method: 'POST', body: JSON.stringify(data) }),
  runSeoAudit: (data) => request('/agents/content-seo-audit', { method: 'POST', body: JSON.stringify(data) }),
  runSocialPosts: (data) => request('/agents/social-posts', { method: 'POST', body: JSON.stringify(data) }),
  runContentCalendar: (data) => request('/agents/content-calendar', { method: 'POST', body: JSON.stringify(data) }),
  runAnalyticsInsights: (data) => request('/agents/analytics-insights', { method: 'POST', body: JSON.stringify(data) }),
  runClientReport: (data) => request('/agents/client-report', { method: 'POST', body: JSON.stringify(data) }),
  runAutonomous: (data) => request('/agents/autonomous', { method: 'POST', body: JSON.stringify(data) }),
}

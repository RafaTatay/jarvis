import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import MissionControl from './components/dashboard/MissionControl'
import CampaignManager from './components/campaigns/CampaignManager'
import ClientCRM from './components/clients/ClientCRM'
import AgentConsole from './components/agents/AgentConsole'
import ContentPipeline from './components/content/ContentPipeline'
import TaskBoard from './components/tasks/TaskBoard'

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-mission-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar onRefresh={refresh} />
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<MissionControl refreshKey={refreshKey} />} />
              <Route path="/campaigns" element={<CampaignManager refreshKey={refreshKey} />} />
              <Route path="/clients" element={<ClientCRM refreshKey={refreshKey} />} />
              <Route path="/agents" element={<AgentConsole refreshKey={refreshKey} />} />
              <Route path="/content" element={<ContentPipeline refreshKey={refreshKey} />} />
              <Route path="/tasks" element={<TaskBoard refreshKey={refreshKey} />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

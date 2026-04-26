import { useLocation } from 'react-router-dom'
import { Bell, RefreshCw } from 'lucide-react'

const PAGE_TITLES = {
  '/': 'Mission Control',
  '/campaigns': 'Campaigns',
  '/clients': 'Client CRM',
  '/agents': 'AI Agents',
  '/content': 'Content Pipeline',
  '/tasks': 'Task Board',
}

export default function TopBar({ onRefresh }) {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] || 'JARVIS'
  const now = new Date().toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <header className="h-14 border-b border-mission-border bg-mission-surface/80 backdrop-blur flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-white">{title}</h1>
        <span className="text-xs text-mission-muted font-mono">{now}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg text-gray-400 hover:text-mission-cyan hover:bg-mission-cyan/10 transition-all"
          title="Refresh data"
        >
          <RefreshCw size={15} />
        </button>
        <button className="p-2 rounded-lg text-gray-400 hover:text-mission-yellow hover:bg-mission-yellow/10 transition-all">
          <Bell size={15} />
        </button>
        <div className="ml-2 flex items-center gap-2 pl-3 border-l border-mission-border">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-mission-cyan to-purple-500 flex items-center justify-center text-xs font-bold text-black">
            J
          </div>
          <span className="text-sm text-gray-300">Agency</span>
        </div>
      </div>
    </header>
  )
}

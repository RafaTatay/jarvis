import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Megaphone, Users, Bot, FileText, CheckSquare, Settings, Zap,
} from 'lucide-react'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Mission Control' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/agents', icon: Bot, label: 'AI Agents' },
  { to: '/content', icon: FileText, label: 'Content' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
]

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-mission-surface border-r border-mission-border flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-mission-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-mission-cyan/10 border border-mission-cyan/30 flex items-center justify-center">
            <Zap size={16} className="text-mission-cyan" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wider font-mono">JARVIS</p>
            <p className="text-[10px] text-mission-muted uppercase tracking-widest">Mission Control</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
              ${isActive
                ? 'bg-mission-cyan/10 text-mission-cyan border border-mission-cyan/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-mission-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-mission-green pulse-dot" />
          <span className="text-xs text-mission-muted">All systems operational</span>
        </div>
      </div>
    </aside>
  )
}

import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { cx } from '../../lib/cx'
import { initials } from '../../lib/format'

interface SidebarProps {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { user, logout } = useAuth()

  if (!user) return null

  const navItems = [
    { to: '/', label: 'Dashboard', end: true },
    {
      to: '/tickets',
      label:
        user.role === 'employee' ? 'Tiket Saya' : user.role === 'technician' ? 'Tiket' : 'Semua Tiket',
      end: false,
    },
    { to: '/articles', label: 'Knowledge Base', end: false },
  ]

  const adminItems =
    user.role === 'admin'
      ? [
          { to: '/admin/categories', label: 'Kategori' },
          { to: '/admin/sla', label: 'Kebijakan SLA' },
          { to: '/admin/users', label: 'Pengguna' },
          { to: '/admin/assets', label: 'Aset' },
        ]
      : []

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center gap-2.5 border-b border-zinc-200 px-5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white">
          IT
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-zinc-900">IT Helpdesk</p>
          <p className="text-[11px] text-zinc-500">Support Ticketing</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">Menu</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}

        {adminItems.length > 0 && (
          <div className="pt-4">
            <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Master Data
            </p>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cx(
                    'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-zinc-100 text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div className="border-t border-zinc-200 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900">{user.name}</p>
            <p className="truncate text-xs text-zinc-500">{user.role_label}</p>
          </div>
        </div>
        <div className="mt-1 flex gap-1">
          <NavLink
            to="/profile"
            onClick={onNavigate}
            className="flex-1 rounded-lg px-2 py-1.5 text-center text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
          >
            Profil
          </NavLink>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex-1 rounded-lg px-2 py-1.5 text-center text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-red-600"
          >
            Keluar
          </button>
        </div>
      </div>
    </div>
  )
}

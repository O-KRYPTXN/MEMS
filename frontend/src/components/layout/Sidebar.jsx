import { NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { ROUTES } from '../../constants/routes'
import { useAuthStore } from '../../store/authStore'

const Icon = ({ d, className = 'w-[17px] h-[17px] shrink-0' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { to: ROUTES.ADMIN_DASHBOARD, label: 'Dashboard', icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
      { to: ROUTES.ADMIN_DEVICES, label: 'Medical Devices', icon: 'M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3' },
      { to: ROUTES.ADMIN_WORK_ORDERS, label: 'Work Orders', icon: 'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: ROUTES.ADMIN_PM, label: 'Preventive Maintenance', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' },
      { to: ROUTES.ADMIN_INVENTORY, label: 'Spare Parts Inventory', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: ROUTES.ADMIN_USERS, label: 'Users & Permissions', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
      { to: ROUTES.ADMIN_REPORTS, label: 'Reports', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
      { to: '/admin/profile', label: 'Profile', icon: 'M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z' },
    ],
  },
]

const navLinkClass = ({ isActive }) =>
  clsx(
    'flex items-center gap-3 px-5 py-2.5 border-l-[3px] text-sm transition-colors',
    isActive
      ? 'border-l-[#3B72F6] bg-[rgba(59,114,246,0.12)] text-[#5E8FFF] font-semibold'
      : 'border-l-transparent text-[#94A3B8] hover:bg-[#1A2235] hover:text-[#E2E8F0]'
  )

const Sidebar = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <aside className="flex flex-col w-[240px] min-h-screen shrink-0 bg-[#131720] border-r border-[#1F2A40]">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1F2A40]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#3B72F6] shrink-0">
          <Icon d="M12 3v18M3 12h18" className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[#E2E8F0] font-bold text-base leading-tight">MEMS</p>
          <p className="text-[#5A6A85] text-xs leading-tight mt-0.5">Medical Equip. Mgmt.</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4 last:mb-0">
            <p className="px-5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#5A6A85]">
              {section.label}
            </p>
            {section.items.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                <Icon d={item.icon} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-3 px-4 py-3 border-t border-[#1F2A40]">
        <div className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-[#3B72F6] text-white text-xs font-semibold shrink-0">
          {user?.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#E2E8F0] text-sm font-bold truncate">{user?.name}</p>
          <p className="text-[#5A6A85] text-xs capitalize truncate">{user?.role}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center w-8 h-8 rounded-md text-[#94A3B8] hover:bg-[#1A2235] hover:text-[#E2E8F0] transition-colors shrink-0"
          aria-label="Logout"
        >
          <Icon d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </button>
      </div>
    </aside>
  )
}

export default Sidebar

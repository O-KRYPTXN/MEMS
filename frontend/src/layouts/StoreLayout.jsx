import { Outlet, useLocation, NavLink, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { ROUTES } from '../constants/routes'
import clsx from 'clsx'

const STORE_NAV_LINKS = [
  {
    section: 'Inventory',
    links: [
      { name: 'Dashboard', path: ROUTES.STORE_DASHBOARD, icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
      { name: 'Spare Parts', path: ROUTES.STORE_INVENTORY, icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' }
    ]
  },
  {
    section: 'Orders & Logistics',
    links: [
      { name: 'Part Requests', path: ROUTES.STORE_REQUESTS, icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375' },
      { name: 'Active Orders', path: ROUTES.STORE_ORDERS, icon: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z' },
      { name: 'Create Order', path: ROUTES.STORE_CREATE_ORDER, icon: 'M12 9v2.25m0 0v2.25m0-2.25h2.25m-2.25 0H9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { name: 'Rejected Orders', path: ROUTES.STORE_REJECTED, icon: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
    ]
  },
  {
    section: 'Communications',
    links: [
      { name: 'Email Log', path: ROUTES.STORE_EMAIL_LOG, icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75' }
    ]
  },
  {
    section: 'Account',
    links: [
      { name: 'My Profile', path: '/store/profile', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' }
    ]
  }
]

const pageTitles = {
  [ROUTES.STORE_DASHBOARD]: 'Central Store Dashboard',
  [ROUTES.STORE_INVENTORY]: 'Spare Parts Inventory',
  [ROUTES.STORE_REQUESTS]: 'Part Requests',
  [ROUTES.STORE_ORDERS]: 'Active External Orders',
  [ROUTES.STORE_CREATE_ORDER]: 'Create Purchase Order',
  [ROUTES.STORE_REJECTED]: 'Rejected Orders',
  [ROUTES.STORE_EMAIL_LOG]: 'Communications Log',
  ['/store/profile']: 'My Profile'
}

const Icon = ({ d, className = 'w-[17px] h-[17px] shrink-0' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

const navLinkClass = ({ isActive }) =>
  clsx(
    'flex items-center gap-3 px-5 py-2.5 border-l-[3px] text-sm transition-colors relative',
    isActive
      ? 'border-l-[#8B5CF6] bg-[rgba(139,92,246,0.12)] text-[#D8B4FE] font-semibold'
      : 'border-l-transparent text-[#94A3B8] hover:bg-[#1A2235] hover:text-[#E2E8F0]'
  )

const StoreSidebar = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <aside className="flex flex-col w-[240px] min-h-screen shrink-0 bg-[#131720] border-r border-[#1F2A40]">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1F2A40]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ background: 'linear-gradient(135deg, #8B5CF6, #A855F7)' }}>
          <Icon d="M12 3v18M3 12h18" className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[#E2E8F0] font-bold text-base leading-tight">MEMS</p>
          <p className="text-[#8B5CF6] font-semibold text-[0.65rem] leading-tight mt-0.5">Store & Inventory</p>
        </div>
      </div>

      <div className="mx-5 my-2.5 text-center mt-3">
        <div className="inline-block px-3 py-1.5 rounded-lg bg-[rgba(139,92,246,0.12)] border border-[rgba(139,92,246,0.25)] text-[#D8B4FE] text-[0.7rem] font-bold uppercase tracking-[0.08em]">
          STOREKEEPER
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {STORE_NAV_LINKS.map((section, idx) => (
          <div key={idx} className="mb-4">
            <p className="px-5 mb-2 text-[0.65rem] font-semibold uppercase tracking-wider text-[#5A6A85]">{section.section}</p>
            {section.links.map((link, lIdx) => (
              <NavLink key={lIdx} to={link.path} className={navLinkClass} end>
                <Icon d={link.icon} />
                {link.name}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-3 px-4 py-3 border-t border-[#1F2A40]">
        <div className="flex items-center justify-center w-[34px] h-[34px] rounded-full text-white text-sm font-bold shrink-0" style={{ background: 'linear-gradient(135deg, #8B5CF6, #A855F7)' }}>
          {user?.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#E2E8F0] text-[0.8125rem] font-semibold truncate">{user?.name}</p>
          <p className="text-[#D8B4FE] text-[0.7rem] font-semibold truncate">Storekeeper</p>
        </div>
        <button type="button" onClick={handleLogout} className="flex items-center justify-center w-7 h-7 rounded-md text-[#5A6A85] hover:bg-[#1F2A40] hover:text-[#E2E8F0] transition-colors shrink-0" aria-label="Logout">
          <Icon d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </button>
      </div>
    </aside>
  )
}

const StoreTopbar = ({ title }) => {
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const dateString = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }), [])

  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 h-[60px] px-7 bg-[#131720] border-b border-[#1F2A40]">
      <h1 className="text-base font-bold text-[#E2E8F0]">{title}</h1>
      <div className="flex-1" />
      <button type="button" className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8] hover:bg-[#1F2A40] hover:text-[#E2E8F0] transition-colors shrink-0" aria-label="Notifications">
        <Icon d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        {unreadCount > 0 && <span className="absolute top-[6px] right-[6px] w-2 h-2 rounded-full bg-[#EF4444] border-2 border-[#131720]" />}
      </button>
      <span className="text-[0.8rem] text-[#5A6A85] whitespace-nowrap shrink-0">{dateString}</span>
    </header>
  )
}

const StoreLayout = () => {
  const { pathname } = useLocation()
  const pageTitle = pageTitles[pathname] ?? 'Store Portal'

  return (
    <div className="flex min-h-screen bg-[#0F1117]">
      <div className="hidden md:block fixed top-0 left-0 h-screen z-30">
        <StoreSidebar />
      </div>
      <main className="flex-1 flex flex-col min-h-screen ml-0 md:ml-[240px] bg-[#0F1117]">
        <StoreTopbar title={pageTitle} />
        <div className="flex-1 flex flex-col gap-6 p-7">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default StoreLayout

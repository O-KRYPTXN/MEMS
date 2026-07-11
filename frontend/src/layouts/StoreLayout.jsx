import { Outlet, useLocation, NavLink, useNavigate } from 'react-router-dom'
import { useMemo, useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { ROUTES } from '../constants/routes'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/ui/LanguageSwitcher'
import ThemeToggle from '../components/ui/ThemeToggle'
import NotificationCenter from '../components/layout/NotificationCenter'

const STORE_NAV_LINKS = [
  {
    section: 'Inventory',
    links: [
      { tKey: 'nav.dashboard', path: ROUTES.STORE_DASHBOARD, icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
      { tKey: 'nav.inventory', path: ROUTES.STORE_INVENTORY, icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' }
    ]
  },
  {
    section: 'Orders & Logistics',
    links: [
      { tKey: 'nav.partRequests', name: 'Part Requests', path: ROUTES.STORE_REQUESTS, icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375' },
      { tKey: 'nav.orders', path: ROUTES.STORE_ORDERS, icon: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z' },
      { tKey: 'nav.createOrder', path: ROUTES.STORE_CREATE_ORDER, icon: 'M12 9v2.25m0 0v2.25m0-2.25h2.25m-2.25 0H9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { tKey: 'nav.rejectedOrders', path: ROUTES.STORE_REJECTED, icon: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
    ]
  },
  {
    section: 'Account',
    links: [
      { tKey: 'nav.profile', path: '/store/profile', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' }
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
  ['/store/profile']: 'My Profile'
}

const Icon = ({ d, className = 'w-[17px] h-[17px] shrink-0' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

const navLinkClass = ({ isActive }) =>
  clsx(
    'flex items-center gap-3 px-5 py-2.5 border-s-[3px] text-sm transition-colors relative',
    isActive
      ? 'border-s-[#8B5CF6] bg-[rgba(139,92,246,0.08)] text-[#D8B4FE] font-semibold'
      : 'border-s-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
  )

const StoreSidebar = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <aside className="flex flex-col w-[240px] min-h-screen shrink-0 bg-[var(--bg-sidebar)] border-e border-[var(--border)]">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--border)]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ background: 'linear-gradient(135deg, #8B5CF6, #A855F7)' }}>
          <Icon d="M12 3v18M3 12h18" className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[var(--text-primary)] font-bold text-base leading-tight">MEMS</p>
          <p className="text-[#8B5CF6] font-semibold text-[0.65rem] leading-tight mt-0.5">Store & Inventory</p>
        </div>
      </div>

      <div className="mx-5 my-2.5 text-center mt-3">
        <div className="inline-block px-3 py-1.5 rounded-lg bg-purple-700/10 border border-purple-700/30 dark:border-[rgba(139,92,246,0.25)] text-purple-800 dark:bg-[rgba(139,92,246,0.12)] dark:text-[#D8B4FE] text-[0.7rem] font-bold uppercase tracking-[0.08em]">
          STOREKEEPER
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {STORE_NAV_LINKS.map((section, idx) => (
          <div key={idx} className="mb-4">
            <p className="px-5 mb-2 text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{section.section}</p>
            {section.links.map((link, lIdx) => (
              <NavLink key={lIdx} to={link.path} className={navLinkClass} end>
                <Icon d={link.icon} />
                {t(link.tKey)}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--border)]">
        <div className="flex items-center justify-center w-[34px] h-[34px] rounded-full text-white text-sm font-bold shrink-0" style={{ background: 'linear-gradient(135deg, #8B5CF6, #A855F7)' }}>
          {user?.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[var(--text-primary)] text-[0.8125rem] font-semibold truncate">{user?.name}</p>
          <p className="text-[#D8B4FE] text-[0.7rem] font-semibold truncate">Storekeeper</p>
        </div>
        <button type="button" onClick={handleLogout} className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors shrink-0" aria-label="Logout">
          <Icon d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </button>
      </div>
    </aside>
  )
}

const StoreTopbar = ({ title }) => {
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const [showNotifications, setShowNotifications] = useState(false)
  const containerRef = useRef(null)
  const dateString = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }), [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 h-[60px] px-7 bg-[var(--bg-sidebar)] border-b border-[var(--border)]">
      <h1 className="text-base font-bold text-[var(--text-primary)]">{title}</h1>
      <div className="flex-1" />
      <ThemeToggle />
      <LanguageSwitcher />
      <div className="relative" ref={containerRef}>
        <button 
          type="button" 
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors shrink-0" 
          aria-label="Notifications"
        >
          <Icon d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          {unreadCount > 0 && <span className="absolute top-[6px] right-[6px] w-2 h-2 rounded-full bg-[#EF4444] border-2 border-[var(--bg-sidebar)]" />}
        </button>

        {showNotifications && (
          <NotificationCenter onClose={() => setShowNotifications(false)} />
        )}
      </div>
      <span className="text-[0.8rem] text-[var(--text-muted)] whitespace-nowrap shrink-0">{dateString}</span>
    </header>
  )
}

const StoreLayout = () => {
  const { pathname } = useLocation()
  const pageTitle = pageTitles[pathname] ?? 'Store Portal'

  return (
    <div className="flex min-h-screen bg-[var(--bg-body)]">
      <div className="hidden md:block fixed top-0 start-0 h-screen z-30">
        <StoreSidebar />
      </div>
      <main className="flex-1 flex flex-col min-h-screen ms-0 md:ms-[240px] bg-[var(--bg-body)]">
        <StoreTopbar title={pageTitle} />
        <div className="flex-1 flex flex-col gap-6 p-7">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default StoreLayout

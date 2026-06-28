import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { devices } from '../../data/devices'
import KPICard from '../../components/ui/KPICard'
import StatusBadge from '../../components/ui/StatusBadge'
import DataTable from '../../components/tables/DataTable'
import { ROUTES } from '../../constants/routes'

const ROWS_PER_PAGE = 5
const DEPT_OPTS = [
  ['', 'All Departments'], ['ICU', 'ICU'], ['ER', 'ER'], ['Surgery', 'Surgery'],
  ['Radiology', 'Radiology'], ['Cardiology', 'Cardiology'], ['Laboratory', 'Laboratory'], ['General Ward', 'General Ward'],
]

const TABS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'operational' },
  { label: 'Faulty', value: 'faulty' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Retired', value: 'decommissioned' },
]

const ICON_GRID = 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z'
const ICON_CHECK = 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
const ICON_WARN = 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
const ICON_WRENCH = 'M11.42 15.17l-5.1-5.1m0 0L11.42 4.97m-5.1 5.1h12.76'
const ICON_TABLE = 'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5'

const selectCls = 'h-9 px-2.5 bg-[#1A2235] border border-[#1F2A40] rounded-lg text-[#E2E8F0] text-[0.8125rem]'
const monoCls = 'font-mono text-[#94A3B8]'

const getPageNums = (cur, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  const end = Math.min(total, Math.max(cur + 2, 5))
  const start = Math.max(1, end - 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

const Devices = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [activeTab, setActiveTab] = useState('')
  const [view, setView] = useState('table')
  const [currentPage, setCurrentPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [viewDevice, setViewDevice] = useState(null)

  const categories = useMemo(() => [...new Set(devices.map((d) => d.category))].sort(), [])
  const tabCounts = useMemo(() => ({
    '': devices.length,
    operational: devices.filter((d) => d.status === 'operational').length,
    faulty: devices.filter((d) => d.status === 'faulty').length,
    maintenance: devices.filter((d) => d.status === 'maintenance').length,
    decommissioned: devices.filter((d) => d.status === 'decommissioned').length,
  }), [])

  const openDevice = useCallback((row) => { setViewDevice(row); setShowModal(true) }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return devices.filter((d) => {
      const matchSearch = !q || d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || d.serial.toLowerCase().includes(q)
      const matchDept = !deptFilter || d.dept === deptFilter
      const matchStatus = !statusFilter || d.status === statusFilter
      const matchCat = !categoryFilter || d.category === categoryFilter
      const matchTab = !activeTab || d.status === activeTab
      return matchSearch && matchDept && matchStatus && matchCat && matchTab
    })
  }, [search, deptFilter, statusFilter, categoryFilter, activeTab])

  useEffect(() => { setCurrentPage(1) }, [search, deptFilter, statusFilter, categoryFilter, activeTab])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE))
  const paginated = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)
  const pageNums = getPageNums(currentPage, totalPages)
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1
  const end = Math.min(currentPage * ROWS_PER_PAGE, filtered.length)

  const columns = useMemo(() => [
    { key: 'id', label: 'Asset ID', render: (val) => <span className={monoCls}>{val}</span> },
    { key: 'name', label: 'Device Name', primary: true },
    { key: 'category', label: 'Category' },
    { key: 'serial', label: 'Serial No.', render: (val) => <span className={monoCls}>{val}</span> },
    { key: 'dept', label: 'Department' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge variant={val} /> },
    { key: 'lastPm', label: 'Last PM' },
    { key: 'nextPm', label: 'Next PM' },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <button type="button" onClick={(e) => { e.stopPropagation(); openDevice(row) }}
        className="w-7 h-7 rounded-md bg-[#1A2235] border border-[#1F2A40] flex items-center justify-center text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1F2A40]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    ) },
  ], [openDevice])

  const handleTab = (value) => { setActiveTab(value); setStatusFilter(''); setCurrentPage(1) }

  const renderPagination = () => (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[#1F2A40]">
      <span className="text-[0.8rem] text-[#5A6A85]">
        {filtered.length === 0 ? 'No devices found' : `Showing ${start}–${end} of ${filtered.length} devices`}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}
          className={clsx('w-7 h-7 rounded-md bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8] text-[0.8rem] disabled:opacity-30 disabled:cursor-default')}>‹</button>
        {pageNums.map((n) => (
          <button key={n} type="button" onClick={() => setCurrentPage(n)}
            className={clsx('w-7 h-7 rounded-md text-[0.8rem]', n === currentPage ? 'bg-[#3B72F6] text-white' : 'bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8]')}>{n}</button>
        ))}
        <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}
          className={clsx('w-7 h-7 rounded-md bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8] text-[0.8rem] disabled:opacity-30 disabled:cursor-default')}>›</button>
      </div>
    </div>
  )

  const modalFields = viewDevice && [
    ['Device ID', viewDevice.id], ['Name', viewDevice.name], ['Category', viewDevice.category],
    ['Serial No.', viewDevice.serial], ['Department', viewDevice.dept],
    ['Status', <StatusBadge key="s" variant={viewDevice.status} />], ['Last PM', viewDevice.lastPm], ['Next PM Due', viewDevice.nextPm],
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[#E2E8F0]">Device Catalog</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">Browse and manage all hospital medical equipment</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Total Devices" value={devices.length} iconPath={ICON_GRID} iconVariant="blue" />
        <KPICard title="Operational" value={tabCounts.operational} iconPath={ICON_CHECK} iconVariant="green" />
        <KPICard title="Faulty" value={tabCounts.faulty} iconPath={ICON_WARN} iconVariant="red" danger />
        <KPICard title="Under Maintenance" value={tabCounts.maintenance} iconPath={ICON_WRENCH} iconVariant="orange" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 w-60 h-9 px-3 bg-[#1A2235] border border-[#1F2A40] rounded-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[15px] h-[15px] text-[#5A6A85] shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, asset ID, serial..."
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[0.8125rem] text-[#E2E8F0] placeholder:text-[#5A6A85]" />
        </div>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className={selectCls}>
          {DEPT_OPTS.map(([v, l]) => <option key={v || 'all'} value={v}>{l}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls}>
          <option value="">All Statuses</option>
          <option value="operational">Operational</option>
          <option value="faulty">Faulty</option>
          <option value="maintenance">Maintenance</option>
          <option value="decommissioned">Decommissioned</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={selectCls}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="w-px h-6 bg-[#1F2A40]" />
        <div className="flex gap-1">
          {['table', 'grid'].map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} aria-label={`${v} view`}
              className={clsx('w-8 h-8 rounded-md flex items-center justify-center', view === v ? 'bg-[#3B72F6] text-white' : 'bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8]')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d={v === 'table' ? ICON_TABLE : ICON_GRID} />
              </svg>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => navigate(ROUTES.ADMIN_ADD_DEVICE)}
          className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-[#3B72F6] hover:bg-[#2558D8] text-white text-[0.8125rem] font-semibold transition-colors ml-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[15px] h-[15px]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Device
        </button>
      </div>

      <div className="flex border-b border-[#1F2A40]">
        {TABS.map((tab) => (
          <button key={tab.label} type="button" onClick={() => handleTab(tab.value)}
            className={clsx('px-4 py-2.5 text-[0.8125rem] font-medium border-b-2 transition-colors',
              activeTab === tab.value ? 'text-[#E2E8F0] border-[#3B72F6]' : 'text-[#94A3B8] border-transparent hover:text-[#E2E8F0]')}>
            {tab.label}
            <span className="ml-1.5 px-[7px] py-px rounded-full bg-[#1F2A40] text-[#94A3B8] text-[0.7rem]">{tabCounts[tab.value]}</span>
          </button>
        ))}
      </div>

      <div className="bg-[#181D2A] border border-[#1F2A40] rounded-xl overflow-hidden">
        {view === 'table' ? (
          <DataTable columns={columns} data={paginated} emptyMessage="No devices match your filters." />
        ) : paginated.length === 0 ? (
          <p className="py-8 text-center text-[0.8125rem] text-[#5A6A85]">No devices match your filters.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
            {paginated.map((d) => (
              <div key={d.id} className="flex flex-col gap-3 p-4 border border-[#1F2A40] rounded-xl">
                <div className="flex items-start justify-between gap-2">
                  <div><div className="text-[0.875rem] font-semibold text-[#E2E8F0]">{d.name}</div><div className="text-[0.75rem] text-[#5A6A85] font-mono">{d.id} · {d.serial}</div></div>
                  <StatusBadge variant={d.status} />
                </div>
                <div className="flex justify-between text-[0.8rem]"><span className="text-[#5A6A85]">Department</span><span className="text-[#E2E8F0]">{d.dept}</span></div>
                <div className="flex justify-between text-[0.8rem]"><span className="text-[#5A6A85]">Category</span><span className="text-[#E2E8F0]">{d.category}</span></div>
                <div className="flex justify-between pt-3 border-t border-[#1F2A40]"><span className="text-[0.75rem] text-[#5A6A85]">Next PM</span><span className="text-[0.8rem] font-semibold text-[#E2E8F0]">{d.nextPm}</span></div>
              </div>
            ))}
          </div>
        )}
        {renderPagination()}
      </div>

      {showModal && viewDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="w-[400px] bg-[#181D2A] border border-[#1F2A40] rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-[#1F2A40]">
              <h2 className="text-[1.1rem] font-bold text-[#E2E8F0]">Device Details</h2>
              <button type="button" onClick={() => setShowModal(false)} className="w-7 h-7 rounded-md text-[#94A3B8] hover:text-[#E2E8F0]">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {modalFields.map(([label, val]) => (
                <div key={label}><div className="text-[0.75rem] text-[#5A6A85]">{label}</div><div className="text-[#E2E8F0] font-semibold mt-0.5">{val}</div></div>
              ))}
            </div>
            <div className="mt-6 text-right">
              <button type="button" onClick={() => setShowModal(false)} className="py-2 px-4 rounded-lg bg-[rgba(236,72,153,0.12)] border border-[rgba(236,72,153,0.25)] text-[#F472B6] text-[0.8125rem] font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Devices

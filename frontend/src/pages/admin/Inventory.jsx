import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import clsx from 'clsx'
import { inventory as initialInventory } from '../../data/inventory'
import KPICard from '../../components/ui/KPICard'
import DataTable from '../../components/tables/DataTable'

function getStatus(item) {
  if (item.qty === 0) return 'critical'
  if (item.qty <= item.min) return 'warning'
  return 'ok'
}

function getQtyColor(item) {
  if (item.qty === 0) return 'text-[#F87171]'
  if (item.qty <= Math.ceil(item.min * 0.3)) return 'text-[#F87171]'
  if (item.qty <= item.min) return 'text-[#FCD34D]'
  return 'text-[#4ADE80]'
}

const fmt = (n) =>
  '$' + Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

const STOCK_STATUS_MAP = {
  critical: {
    cls: 'bg-[rgba(239,68,68,0.12)] text-[#F87171]',
    label: 'Out of Stock'
  },
  warning: {
    cls: 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]',
    label: 'Low Stock'
  },
  ok: {
    cls: 'bg-[rgba(34,197,94,0.12)] text-[#4ADE80]',
    label: 'In Stock'
  },
}

const StockStatusBadge = ({ item }) => {
  const status = getStatus(item)
  const { cls, label } = STOCK_STATUS_MAP[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-semibold ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}

const ROWS_PER_PAGE = 10

const TABS = [
  { label: 'All Items', value: 'all' },
  { label: 'Low Stock', value: 'warning' },
  { label: 'Out of Stock', value: 'critical' },
  { label: 'Recently Added', value: 'recent' },
]

const CAT_OPTS = [
  ['', 'All'], ['Cables & Sensors', 'Cables & Sensors'],
  ['Filters & Consumables', 'Filters & Consumables'], ['Batteries & Power', 'Batteries & Power'],
  ['Spare Parts', 'Spare Parts'], ['PPE & Supplies', 'PPE & Supplies']
]

const STAT_OPTS = [
  ['', 'All'], ['ok', 'In Stock'], ['warning', 'Low Stock'], ['critical', 'Out of Stock']
]

const LOC_OPTS = [
  ['', 'All'], ['Storeroom', 'Storeroom'], ['ICU Pharmacy', 'ICU Pharmacy'], ['ER Supplies', 'ER Supplies']
]

const selectCls = 'h-[36px] px-2.5 bg-[#1A2235] border border-[#1F2A40] rounded-lg text-[#E2E8F0] text-[0.8125rem] outline-none'
const inputCls = "w-full bg-[#0d1117] border border-[#1F2A40] rounded-lg text-[#E2E8F0] text-[13px] px-[13px] py-[10px] outline-none focus:border-[#3B72F6] placeholder:text-[#4A5568]"
const labelCls = "block text-[12px] text-[#94A3B8] uppercase font-semibold tracking-[0.4px] mb-1.5"

const getPageNums = (cur, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  const end = Math.min(total, Math.max(cur + 2, 5))
  const start = Math.max(1, end - 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export default function Inventory() {
  const [inventoryList, setInventoryList] = useState(initialInventory)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  const { register, handleSubmit, reset } = useForm()

  const totalParts = inventoryList.length
  const lowStock = inventoryList.filter(i => getStatus(i) === 'warning').length
  const outOfStock = inventoryList.filter(i => getStatus(i) === 'critical').length
  const totalValue = inventoryList.reduce((sum, i) => sum + i.qty * i.price, 0)

  const baseFiltered = useMemo(() => {
    const q = search.toLowerCase()
    return inventoryList.filter(item => {
      const matchCat  = !categoryFilter || item.category === categoryFilter
      const matchLoc  = !locationFilter || item.location === locationFilter
      const matchQ    = !q ||
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      return matchCat && matchLoc && matchQ
    })
  }, [inventoryList, search, categoryFilter, locationFilter])

  const filtered = useMemo(() => {
    return baseFiltered.filter(item => {
      const s = getStatus(item)
      let tabMatch = true
      if (activeTab === 'warning')  tabMatch = s === 'warning'
      if (activeTab === 'critical') tabMatch = s === 'critical'
      if (activeTab === 'recent')   tabMatch = item.recent === true
      const statMatch = !statusFilter || s === statusFilter
      return tabMatch && statMatch
    })
  }, [baseFiltered, activeTab, statusFilter])

  useEffect(() => setCurrentPage(1), [search, categoryFilter, locationFilter, activeTab, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE))
  const paginated = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1
  const end = Math.min(currentPage * ROWS_PER_PAGE, filtered.length)
  const pageNums = getPageNums(currentPage, totalPages)

  const tabCounts = useMemo(() => ({
    all:      baseFiltered.length,
    warning:  baseFiltered.filter(i => getStatus(i) === 'warning').length,
    critical: baseFiltered.filter(i => getStatus(i) === 'critical').length,
    recent:   baseFiltered.filter(i => i.recent).length,
  }), [baseFiltered])

  const handleTabClick = (value) => {
    setActiveTab(value)
    setStatusFilter('')
  }

  const handleStatusFilterChange = (e) => {
    const val = e.target.value
    setStatusFilter(val)
    if (['warning', 'critical'].includes(val)) {
      setActiveTab(val)
    } else {
      setActiveTab('all')
    }
  }

  const columns = useMemo(() => [
    { key:'code', label:'Part Code', render: val => <span className="font-mono text-[0.775rem] text-[#94A3B8]">{val}</span> },
    { key:'name', label:'Part Name', primary: true },
    { key:'category', label:'Category' },
    { key:'unit', label:'Unit' },
    { key:'qty', label:'Stock Qty', render: (val, row) => <span className={`font-bold ${getQtyColor(row)}`}>{val}</span> },
    { key:'min', label:'Min Level' },
    { key:'location', label:'Location' },
    { key:'price', label:'Unit Price', render: val => fmt(val) },
    { key:'total', label:'Total Value', render: (_, row) => fmt(row.qty * row.price) },
    { key:'status', label:'Status', render: (_, row) => <StockStatusBadge item={row} /> },
    { key:'actions', label:'Actions', render: (_, row) => (
        <div className="flex gap-1.5">
          <button
            onClick={e => { e.stopPropagation(); setSelectedItem(row); setShowViewModal(true) }}
            className="w-7 h-7 rounded-md bg-[#1A2235] border border-[#1F2A40] flex items-center justify-center text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1F2A40]"
            title="View details"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      )
    },
  ], [])

  const renderPagination = () => (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[#1F2A40]">
      <span className="text-[0.8rem] text-[#5A6A85]">
        Showing {start}–{end} of {filtered.length} items
      </span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
          className="w-7 h-7 rounded-md bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8] text-[0.8rem] disabled:opacity-30 disabled:cursor-default">‹</button>
        {pageNums.map(n => (
          <button key={n} type="button" onClick={() => setCurrentPage(n)}
            className={clsx('w-7 h-7 rounded-md text-[0.8rem]', n === currentPage ? 'bg-[#3B72F6] text-white' : 'bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8]')}>{n}</button>
        ))}
        <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
          className="w-7 h-7 rounded-md bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8] text-[0.8rem] disabled:opacity-30 disabled:cursor-default">›</button>
      </div>
    </div>
  )

  const onAddSubmit = (data) => {
    const newCode = `INV-${String(inventoryList.length + 1).padStart(4, '0')}`
    const newItem = {
      code: newCode,
      recent: true,
      ...data,
      qty: Number(data.qty),
      min: Number(data.min),
      price: Number(data.price)
    }
    setInventoryList([newItem, ...inventoryList])
    setShowAddModal(false)
    reset()
  }

  const openAddModal = () => {
    reset({ code: '', name: '', category: '', unit: '', qty: '', min: '', location: '', price: '' })
    setShowAddModal(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">Inventory</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">Manage medical equipment parts, supplies and stock levels</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-[16px]">
        <KPICard title="Total Parts" value={totalParts} iconVariant="blue" iconPath="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        <KPICard title="Low Stock" value={lowStock} iconVariant="orange" iconPath="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        <KPICard title="Out of Stock" value={outOfStock} danger iconVariant="red" iconPath="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <div className="[&_.bg-\\[rgba\\(59\\,114\\,246\\,0\\.15\\)\\]]:bg-[rgba(20,184,166,0.15)] [&_.text-\\[\\#5E8FFF\\]]:text-[#2DD4BF]">
          <KPICard title="Total Value" value={fmt(totalValue)} iconVariant="blue" iconPath="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </div>
      </div>

      {!bannerDismissed && (outOfStock > 0 || lowStock > 0) && (
        <div className="flex items-center gap-[14px] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.3)] rounded-[12px] p-[14px] px-[18px]">
          <div className="w-[38px] h-[38px] shrink-0 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[20px] h-[20px] text-[#F87171]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-[0.875rem] font-bold text-[#F87171]">Critical Inventory Alert</div>
            <div className="text-[0.775rem] text-[#94A3B8] mt-[2px]">
              {outOfStock} items are out of stock and {lowStock} are below minimum level. Immediate reorder required.
            </div>
          </div>
          <button type="button" onClick={() => setBannerDismissed(true)} className="shrink-0 bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] text-[#F87171] rounded-[8px] py-[7px] px-[14px] text-[0.8125rem] font-semibold hover:bg-[rgba(239,68,68,0.25)] transition-colors">
            Reorder All Critical
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-[12px]">
        <div className="flex items-center gap-2 w-[240px] h-[36px] px-3 bg-[#1A2235] border border-[#1F2A40] rounded-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[15px] h-[15px] text-[#5A6A85] shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search part code, name, category…"
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[0.8125rem] text-[#E2E8F0] placeholder:text-[#5A6A85]" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={selectCls}>
          {CAT_OPTS.map(([v, l]) => <option key={v||'all'} value={v}>{v ? `Category: ${l}` : 'Category: All'}</option>)}
        </select>
        <select value={statusFilter} onChange={handleStatusFilterChange} className={selectCls}>
          {STAT_OPTS.map(([v, l]) => <option key={v||'all'} value={v}>{v ? `Stock Status: ${l}` : 'Stock Status: All'}</option>)}
        </select>
        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className={selectCls}>
          {LOC_OPTS.map(([v, l]) => <option key={v||'all'} value={v}>{v ? `Location: ${l}` : 'Location: All'}</option>)}
        </select>
        <div className="w-[1px] h-[20px] bg-[#1F2A40]"></div>
        {/* Add Item Button hidden per phase 6 requirement */}
        {false && (
          <button type="button" onClick={openAddModal} className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-[#3B72F6] hover:bg-[#2558D8] text-white text-[0.8125rem] font-semibold transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Item
          </button>
        )}
      </div>

      <div className="flex border-b border-[#1F2A40]">
        {TABS.map(tab => (
          <button key={tab.label} type="button" onClick={() => handleTabClick(tab.value)}
            className={clsx('px-4 py-2.5 text-[0.8125rem] font-medium border-b-2 transition-colors',
              activeTab === tab.value ? 'text-[#E2E8F0] border-[#3B72F6]' : 'text-[#94A3B8] border-transparent hover:text-[#E2E8F0]')}>
            {tab.label}
            <span className="ml-1.5 px-[7px] py-px rounded-full bg-[#1F2A40] text-[#94A3B8] text-[0.7rem]">{tabCounts[tab.value]}</span>
          </button>
        ))}
      </div>

      <div className="bg-[#181D2A] border border-[#1F2A40] rounded-[12px] overflow-hidden">
        <DataTable columns={columns} data={paginated} emptyMessage="No items match your current filters." />
        {renderPagination()}
      </div>

      {showViewModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(5,8,15,0.82)]" onClick={() => setShowViewModal(false)}>
          <div className="w-full max-w-[520px] bg-[#181D2A] border border-[#1F2A40] rounded-[14px] p-[28px] animate-in fade-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-[22px]">
              <div className="flex items-center gap-[10px] text-[17px] font-bold text-[#E2E8F0]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[20px] h-[20px] text-[#3B72F6]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Part Details
              </div>
              <button type="button" onClick={() => setShowViewModal(false)} className="w-[32px] h-[32px] rounded-lg border border-[#1F2A40] flex items-center justify-center text-[#64748B] hover:text-[#E2E8F0] hover:bg-[#1E293B]">✕</button>
            </div>
            
            <div className="grid grid-cols-2 gap-[16px]">
              <div><div className="text-[0.75rem] text-[#5A6A85] uppercase font-semibold">Part Code</div><div className="text-[13px] font-mono font-semibold text-[#E2E8F0] mt-1">{selectedItem.code}</div></div>
              <div><div className="text-[0.75rem] text-[#5A6A85] uppercase font-semibold">Part Name</div><div className="text-[13px] font-medium text-[#E2E8F0] mt-1">{selectedItem.name}</div></div>
              <div><div className="text-[0.75rem] text-[#5A6A85] uppercase font-semibold">Category</div><div className="text-[13px] text-[#E2E8F0] mt-1">{selectedItem.category}</div></div>
              <div><div className="text-[0.75rem] text-[#5A6A85] uppercase font-semibold">Unit</div><div className="text-[13px] text-[#E2E8F0] mt-1">{selectedItem.unit}</div></div>
              <div><div className="text-[0.75rem] text-[#5A6A85] uppercase font-semibold">Min Level</div><div className="text-[13px] text-[#E2E8F0] mt-1">{selectedItem.min}</div></div>
              <div><div className="text-[0.75rem] text-[#5A6A85] uppercase font-semibold">Stock Qty</div><div className={`text-[13px] mt-1 font-bold ${getQtyColor(selectedItem)}`}>{selectedItem.qty}</div></div>
              <div><div className="text-[0.75rem] text-[#5A6A85] uppercase font-semibold">Location</div><div className="text-[13px] text-[#E2E8F0] mt-1">{selectedItem.location}</div></div>
              <div><div className="text-[0.75rem] text-[#5A6A85] uppercase font-semibold">Unit Price</div><div className="text-[13px] text-[#E2E8F0] mt-1">{fmt(selectedItem.price)}</div></div>
              <div><div className="text-[0.75rem] text-[#5A6A85] uppercase font-semibold">Total Value</div><div className="text-[13px] font-semibold text-[#E2E8F0] mt-1">{fmt(selectedItem.qty * selectedItem.price)}</div></div>
              <div><div className="text-[0.75rem] text-[#5A6A85] uppercase font-semibold">Status</div><div className="mt-1"><StockStatusBadge item={selectedItem} /></div></div>
            </div>

            <div className="flex justify-end gap-[10px] border-t border-[#1F2A40] pt-[18px] mt-[24px]">
              <button type="button" onClick={() => setShowViewModal(false)} className="px-[20px] py-[10px] bg-transparent border border-[#1F2A40] rounded-lg text-[#94A3B8] text-[13px] font-medium hover:bg-[#1E293B] hover:text-[#E2E8F0]">Close</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(5,8,15,0.82)]" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-[480px] bg-[#181D2A] border border-[#1F2A40] rounded-[14px] p-[28px] animate-in fade-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-[22px]">
              <div className="flex items-center gap-[10px] text-[17px] font-bold text-[#E2E8F0]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[20px] h-[20px] text-[#3B72F6]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                Add Inventory Item
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="w-[32px] h-[32px] rounded-lg border border-[#1F2A40] flex items-center justify-center text-[#64748B] hover:text-[#E2E8F0] hover:bg-[#1E293B]">✕</button>
            </div>
            
            <form onSubmit={handleSubmit(onAddSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-[14px]">
                <div>
                  <label className={labelCls}>Part Code</label>
                  <input {...register('code', { required: true })} className={inputCls} placeholder="e.g. INV-0348" />
                </div>
                <div>
                  <label className={labelCls}>Unit</label>
                  <input {...register('unit', { required: true })} className={inputCls} placeholder="e.g. pcs, set, box" />
                </div>
              </div>
              
              <div>
                <label className={labelCls}>Part Name</label>
                <input {...register('name', { required: true })} className={inputCls} placeholder="Full part / item name" />
              </div>

              <div className="grid grid-cols-2 gap-[14px]">
                <div>
                  <label className={labelCls}>Category</label>
                  <select {...register('category', { required: true })} className={inputCls}>
                    <option value="">Select Category</option>
                    {CAT_OPTS.slice(1).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Location</label>
                  <select {...register('location', { required: true })} className={inputCls}>
                    <option value="">Select Location</option>
                    {LOC_OPTS.slice(1).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[14px]">
                <div>
                  <label className={labelCls}>Stock Qty</label>
                  <input type="number" min="0" {...register('qty', { required: true, min: 0 })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Min Level</label>
                  <input type="number" min="0" {...register('min', { required: true, min: 0 })} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Unit Price</label>
                <input type="number" min="0" step="0.01" {...register('price', { required: true, min: 0 })} className={inputCls} placeholder="0.00" />
              </div>

              <div className="flex justify-end gap-[10px] border-t border-[#1F2A40] pt-[18px] mt-[8px]">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-[20px] py-[10px] bg-transparent border border-[#1F2A40] rounded-lg text-[#94A3B8] text-[13px] font-medium hover:bg-[#1E293B] hover:text-[#E2E8F0]">Cancel</button>
                <button type="submit" className="px-[20px] py-[10px] bg-[#3B72F6] hover:bg-[#2558D8] rounded-lg text-white text-[13px] font-medium transition-colors flex items-center gap-[6px]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

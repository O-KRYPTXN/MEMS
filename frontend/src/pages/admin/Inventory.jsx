import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import clsx from 'clsx'
import Panel from '../../components/ui/Panel'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as partsService from '../../api/partsService'
import KPICard from '../../components/ui/KPICard'
import DataTable from '../../components/tables/DataTable'
import { useTranslation } from 'react-i18next'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'

function getStatus(item) {
  if (item.qty === 0) return 'critical'
  if (item.qty <= item.minLevel) return 'warning'
  return 'ok'
}

function getQtyColor(item) {
  if (item.qty === 0) return 'text-red-700 dark:text-[#F87171]'
  if (item.qty <= Math.ceil(item.minLevel * 0.3)) return 'text-red-700 dark:text-[#F87171]'
  if (item.qty <= item.minLevel) return 'text-amber-700 dark:text-[#FCD34D]'
  return 'text-green-700 dark:text-[#4ADE80]'
}

const fmt = (n) =>
  '$' + Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

const STOCK_STATUS_MAP = {
  critical: {
    cls: 'bg-red-700/10 text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]',
    label: 'Out of Stock'
  },
  warning: {
    cls: 'bg-yellow-700/10 text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]',
    label: 'Low Stock'
  },
  ok: {
    cls: 'bg-green-700/10 text-green-800 dark:bg-[rgba(34,197,94,0.12)] dark:text-[#4ADE80]',
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

const selectCls = 'h-[36px] px-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-[0.8125rem] outline-none'
const inputCls = "w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-[13px] px-[13px] py-[10px] outline-none focus:border-[#3B72F6] placeholder:text-[var(--text-muted)]"
const labelCls = "block text-[12px] text-[var(--text-secondary)] uppercase font-semibold tracking-[0.4px] mb-1.5"

const getPageNums = (cur, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  const end = Math.min(total, Math.max(cur + 2, 5))
  const start = Math.max(1, end - 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export default function Inventory() {
  const { t } = useTranslation()
  const { showToast } = useToastStore()
  const queryClient = useQueryClient()
  const { data: partsData, isError } = useQuery({
    queryKey: ['parts'],
    queryFn: () => partsService.getParts({ limit: 1000 })
  })

  useEffect(() => {
    if (isError) showToast(t('common.toastLoadError', 'Failed to load parts catalog'), TOAST_COLORS.error)
  }, [isError, showToast, t])
  const inventoryList = partsData?.items || []
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

  const deleteMutation = useMutation({
    mutationFn: (id) => partsService.deletePart(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['parts'])
      showToast(t('common.toastDeleted', '✓ Part deleted successfully'), TOAST_COLORS.admin)
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to delete part', TOAST_COLORS.error)
    }
  })

  const { register, handleSubmit, reset } = useForm()

  const TABS = useMemo(() => [
    { label: t('inventory.allItems'), value: 'all' },
    { label: t('inventory.lowStock'), value: 'warning' },
    { label: t('inventory.outOfStock'), value: 'critical' },
    { label: t('inventory.recentlyAdded'), value: 'recent' },
  ], [t])

  const totalParts = inventoryList.length
  const lowStock = inventoryList.filter(i => getStatus(i) === 'warning').length
  const outOfStock = inventoryList.filter(i => getStatus(i) === 'critical').length
  const totalValue = inventoryList.reduce((sum, i) => sum + i.qty * Number(i.unitPrice || 0), 0)

  const baseFiltered = useMemo(() => {
    const q = search.toLowerCase()
    return inventoryList.filter(item => {
      const matchCat  = !categoryFilter || item.category === categoryFilter
      const matchLoc  = !locationFilter || item.location === locationFilter
      const matchQ    = !q ||
        item.partCode?.toLowerCase().includes(q) ||
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
      if (activeTab === 'recent')   tabMatch = item.isRecent === true
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
    recent:   baseFiltered.filter(i => i.isRecent).length,
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
    { key:'partCode', label: t('inventory.partCode'), render: val => <span className="font-mono text-[0.775rem] text-[var(--text-muted)]">{val}</span> },
    { key:'name', label: t('inventory.partName'), primary: true },
    { key:'category', label: t('reports.category') },
    { key:'unit', label: t('inventory.unit') },
    { key:'qty', label: t('inventory.stockQty'), render: (val, row) => <span className={`font-bold ${getQtyColor(row)}`}>{val}</span> },
    { key:'minLevel', label: t('inventory.minLevel') },
    { key:'location', label: t('inventory.location') },
    { key:'unitPrice', label: t('inventory.unitPrice'), render: val => fmt(val) },
    { key:'total', label: t('inventory.totalValue'), render: (_, row) => fmt(row.qty * Number(row.unitPrice || 0)) },
    { key:'status', label: t('common.status'), render: (_, row) => <StockStatusBadge item={row} /> },
    { key:'actions', label: t('reports.actions'), render: (_, row) => (
        <div className="flex gap-1.5">
          <button
            onClick={e => { e.stopPropagation(); setSelectedItem(row); setShowViewModal(true) }}
            className="w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            title={t('reports.view')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); openEditModal(row); }}
            className="w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[#3B72F6] hover:bg-[rgba(59,114,246,0.1)] hover:border-[rgba(59,114,246,0.2)]"
            title={t('common.edit')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.89 1.14l-2.81.936.936-2.81a4.5 4.5 0 011.14-1.89l8.931-8.932z" />
            </svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); if(confirm('Are you sure you want to delete this part?')) deleteMutation.mutate(row.id); }}
            className="w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] hover:border-[rgba(239,68,68,0.2)]"
            title={t('common.delete')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )
    },
  ], [t])

  const renderPagination = () => (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
      <span className="text-[0.8rem] text-[var(--text-muted)]">
        {filtered.length === 0 ? t('common.noResults') : t('common.showingResults', { start, end, total: filtered.length })}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
          className="w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8rem] disabled:opacity-30 disabled:cursor-default">‹</button>
        {pageNums.map(n => (
          <button key={n} type="button" onClick={() => setCurrentPage(n)}
            className={clsx('w-7 h-7 rounded-md text-[0.8rem]', n === currentPage ? 'bg-[#3B72F6] text-white' : 'bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)]')}>{n}</button>
        ))}
        <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p - 1)}
          className="w-7 h-7 rounded-md bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8rem] disabled:opacity-30 disabled:cursor-default">›</button>
      </div>
    </div>
  )

  const addMutation = useMutation({
    mutationFn: (data) => partsService.createPart(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['parts'])
      setShowAddModal(false)
      reset()
      showToast(t('common.toastSaved', '✓ Part saved successfully'), TOAST_COLORS.admin)
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to save part', TOAST_COLORS.error)
    }
  })

  const editMutation = useMutation({
    mutationFn: (data) => partsService.updatePart(editingItemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['parts'])
      setShowEditModal(false)
      reset()
      showToast(t('common.toastUpdated', '✓ Part updated successfully'), TOAST_COLORS.admin)
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to update part', TOAST_COLORS.error)
    }
  })

  const onAddSubmit = (data) => {
    const newItem = {
      isRecent: true,
      ...data,
      qty: Number(data.qty),
      minLevel: Number(data.minLevel),
      unitPrice: Number(data.unitPrice)
    }
    addMutation.mutate(newItem)
  }

  const onEditSubmit = (data) => {
    editMutation.mutate({
      ...data,
      qty: Number(data.qty),
      minLevel: Number(data.minLevel),
      unitPrice: Number(data.unitPrice)
    })
  }

  const openAddModal = () => {
    reset({ name: '', category: '', unit: '', qty: '', minLevel: '', location: '', unitPrice: '' })
    setShowAddModal(true)
  }

  const openEditModal = (item) => {
    setEditingItemId(item.id)
    reset({
      name: item.name,
      category: item.category,
      unit: item.unit,
      qty: item.qty,
      minLevel: item.minLevel,
      location: item.location,
      unitPrice: item.unitPrice
    })
    setShowEditModal(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('inventory.pageTitle')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('inventory.pageSubtitle')}</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-[16px]">
        <KPICard title={t('inventory.totalParts')} value={totalParts} iconVariant="blue" iconPath="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        <KPICard title={t('inventory.lowStock')} value={lowStock} iconVariant="orange" iconPath="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        <KPICard title={t('inventory.outOfStock')} value={outOfStock} danger iconVariant="red" iconPath="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <div className="[&_.bg-\\[rgba\\(59\\,114\\,246\\,0\\.15\\)\\]]:bg-[rgba(20,184,166,0.15)] [&_.text-\\[\\#5E8FFF\\]]:text-[#2DD4BF]">
          <KPICard title={t('inventory.totalValue')} value={fmt(totalValue)} iconVariant="blue" iconPath="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </div>
      </div>

      {!bannerDismissed && (outOfStock > 0) && (
        <div className="flex items-center gap-[14px] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.3)] rounded-[12px] p-[14px] px-[18px]">
          <div className="w-[38px] h-[38px] shrink-0 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[20px] h-[20px] text-[#F87171]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-[0.875rem] font-bold text-[#F87171]">{t('inventory.criticalAlert')}</div>
            <div className="text-[0.775rem] text-[var(--text-muted)] mt-[2px]">
              {t('inventory.alertMessage', { outOfStock, lowStock })}
            </div>
          </div>
          <button type="button" onClick={() => setBannerDismissed(true)} className="shrink-0 bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] text-[#F87171] rounded-[8px] py-[7px] px-[14px] text-[0.8125rem] font-semibold hover:bg-[rgba(239,68,68,0.25)] transition-colors">
            {t('inventory.reorderAll')}
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-[12px]">
        <div className="flex items-center gap-2 w-[240px] h-[36px] px-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[15px] h-[15px] text-[var(--text-muted)] shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('inventory.searchPlaceholder')}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[0.8125rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={selectCls}>
          {CAT_OPTS.map(([v, l]) => <option key={v||'all'} value={v}>{v ? `${t('reports.category')}: ${l}` : `${t('reports.category')}: ${t('common.allStatuses')}`}</option>)}
        </select>
        <select value={statusFilter} onChange={handleStatusFilterChange} className={selectCls}>
          {STAT_OPTS.map(([v, l]) => <option key={v||'all'} value={v}>{v ? `${t('common.status')}: ${l}` : `${t('common.status')}: ${t('common.allStatuses')}`}</option>)}
        </select>
        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className={selectCls}>
          {LOC_OPTS.map(([v, l]) => <option key={v||'all'} value={v}>{v ? `${t('inventory.location')}: ${l}` : `${t('inventory.location')}: ${t('common.allStatuses')}`}</option>)}
        </select>
        <div className="w-[1px] h-[20px] bg-[var(--border)]"></div>
        <button type="button" onClick={openAddModal} className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-[#3B72F6] hover:bg-[#2558D8] text-white text-[0.8125rem] font-semibold transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('inventory.addItem')}
        </button>
      </div>

      <div className="flex border-b border-[var(--border)]">
        {TABS.map(tab => (
          <button key={tab.label} type="button" onClick={() => handleTabClick(tab.value)}
            className={clsx('px-4 py-2.5 text-[0.8125rem] font-medium border-b-2 transition-colors',
              activeTab === tab.value ? 'text-[var(--text-primary)] border-[#3B72F6]' : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)]')}>
            {tab.label}
            <span className="ml-1.5 px-[7px] py-px rounded-full bg-[var(--bg-hover)] text-[var(--text-muted)] text-[0.7rem]">{tabCounts[tab.value]}</span>
          </button>
        ))}
      </div>

      <Panel noPadding>
        <DataTable columns={columns} data={paginated} emptyMessage={t('common.noResults')} />
        {renderPagination()}
      </Panel>

      <Modal
        isOpen={showViewModal && !!selectedItem}
        onClose={() => setShowViewModal(false)}
        title={t('inventory.partDetails')}
        maxWidth="520px"
        footer={<ModalCancelBtn onClick={() => setShowViewModal(false)}>{t('common.close')}</ModalCancelBtn>}
      >
        <div className="grid grid-cols-2 gap-[16px]">
          <div><div className="text-[0.75rem] text-[var(--text-muted)] uppercase font-semibold">{t('inventory.partCode')}</div><div className="text-[13px] font-mono font-semibold text-[var(--text-primary)] mt-1">{selectedItem?.partCode}</div></div>
          <div><div className="text-[0.75rem] text-[var(--text-muted)] uppercase font-semibold">{t('inventory.partName')}</div><div className="text-[13px] font-medium text-[var(--text-primary)] mt-1">{selectedItem?.name}</div></div>
          <div><div className="text-[0.75rem] text-[var(--text-muted)] uppercase font-semibold">{t('reports.category')}</div><div className="text-[13px] text-[var(--text-primary)] mt-1">{selectedItem?.category}</div></div>
          <div><div className="text-[0.75rem] text-[var(--text-muted)] uppercase font-semibold">{t('inventory.unit')}</div><div className="text-[13px] text-[var(--text-primary)] mt-1">{selectedItem?.unit}</div></div>
          <div><div className="text-[0.75rem] text-[var(--text-muted)] uppercase font-semibold">{t('inventory.minLevel')}</div><div className="text-[13px] text-[var(--text-primary)] mt-1">{selectedItem?.minLevel}</div></div>
          <div><div className="text-[0.75rem] text-[var(--text-muted)] uppercase font-semibold">{t('inventory.stockQty')}</div><div className={`text-[13px] mt-1 font-bold ${selectedItem ? getQtyColor(selectedItem) : ''}`}>{selectedItem?.qty}</div></div>
          <div><div className="text-[0.75rem] text-[var(--text-muted)] uppercase font-semibold">{t('inventory.location')}</div><div className="text-[13px] text-[var(--text-primary)] mt-1">{selectedItem?.location}</div></div>
          <div><div className="text-[0.75rem] text-[var(--text-muted)] uppercase font-semibold">{t('inventory.unitPrice')}</div><div className="text-[13px] text-[var(--text-primary)] mt-1">{selectedItem && fmt(selectedItem.unitPrice)}</div></div>
          <div><div className="text-[0.75rem] text-[var(--text-muted)] uppercase font-semibold">{t('inventory.totalValue')}</div><div className="text-[13px] font-semibold text-[var(--text-primary)] mt-1">{selectedItem && fmt(selectedItem.qty * Number(selectedItem.unitPrice || 0))}</div></div>
          <div><div className="text-[0.75rem] text-[var(--text-muted)] uppercase font-semibold">{t('common.status')}</div><div className="mt-1">{selectedItem && <StockStatusBadge item={selectedItem} />}</div></div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t('inventory.addItem')}
        maxWidth="480px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowAddModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="add-item-form" color="#3B72F6">
              {t('inventory.saveItem')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="add-item-form" onSubmit={handleSubmit(onAddSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-[14px]">
            <div>
              <label className={labelCls}>{t('inventory.unit')}</label>
              <input {...register('unit', { required: true })} className={inputCls} placeholder="e.g. PCS, SET, BOX" />
            </div>
            <div>
              <label className={labelCls}>{t('inventory.partName')}</label>
              <input {...register('name', { required: true })} className={inputCls} placeholder="Full part / item name" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[14px]">
            <div>
              <label className={labelCls}>{t('reports.category')}</label>
              <select {...register('category', { required: true })} className={inputCls}>
                <option value="">{t('addDevice.selectCategory')}</option>
                {CAT_OPTS.slice(1).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('inventory.location')}</label>
              <select {...register('location', { required: true })} className={inputCls}>
                <option value="">{t('admin.inventory.selectLocation', 'Select Location')}</option>
                {LOC_OPTS.slice(1).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[14px]">
            <div>
              <label className={labelCls}>{t('inventory.stockQty')}</label>
              <input type="number" min="0" {...register('qty', { required: true, min: 0 })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('inventory.minLevel')}</label>
              <input type="number" min="0" {...register('minLevel', { required: true, min: 0 })} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>{t('inventory.unitPrice')}</label>
            <input type="number" min="0" step="0.01" {...register('unitPrice', { required: true, min: 0 })} className={inputCls} placeholder="0.00" />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('common.edit')}
        maxWidth="480px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowEditModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="edit-item-form" color="#3B72F6">
              {t('common.save')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="edit-item-form" onSubmit={handleSubmit(onEditSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-[14px]">
            <div>
              <label className={labelCls}>{t('inventory.unit')}</label>
              <input {...register('unit', { required: true })} className={inputCls} placeholder="e.g. PCS, SET, BOX" />
            </div>
            <div>
              <label className={labelCls}>{t('inventory.partName')}</label>
              <input {...register('name', { required: true })} className={inputCls} placeholder="Full part / item name" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[14px]">
            <div>
              <label className={labelCls}>{t('reports.category')}</label>
              <select {...register('category', { required: true })} className={inputCls}>
                <option value="">{t('addDevice.selectCategory')}</option>
                {CAT_OPTS.slice(1).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('inventory.location')}</label>
              <select {...register('location', { required: true })} className={inputCls}>
                <option value="">{t('admin.inventory.selectLocation', 'Select Location')}</option>
                {LOC_OPTS.slice(1).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[14px]">
            <div>
              <label className={labelCls}>{t('inventory.stockQty')}</label>
              <input type="number" min="0" {...register('qty', { required: true, min: 0 })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('inventory.minLevel')}</label>
              <input type="number" min="0" {...register('minLevel', { required: true, min: 0 })} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>{t('inventory.unitPrice')}</label>
            <input type="number" min="0" step="0.01" {...register('unitPrice', { required: true, min: 0 })} className={inputCls} placeholder="0.00" />
          </div>
        </form>
      </Modal>
    </div>
  )
}

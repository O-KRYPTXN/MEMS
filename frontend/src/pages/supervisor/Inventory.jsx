import { useState, useMemo, useEffect } from 'react'
import clsx from 'clsx'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import Panel from '../../components/ui/Panel'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'

import { useQuery } from '@tanstack/react-query'
import * as partsService from '../../api/partsService'

const getStatus = (qty, min) => qty === 0 ? 'Out of Stock' : qty <= min ? 'Low Stock' : 'In Stock'

const StockBadge = ({ status }) => {
  const { t } = useTranslation()
  const map = {
    'In Stock': 'bg-[rgba(34,197,94,0.12)] text-[#4ADE80]',
    'Low Stock': 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]',
    'Out of Stock': 'bg-[rgba(239,68,68,0.12)] text-[#F87171]',
  }
  const labelMap = {
    'In Stock': t('supInventory.inStock'),
    'Low Stock': t('supInventory.lowStock'),
    'Out of Stock': t('supInventory.outOfStock'),
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-bold ${map[status] ?? ''}`}>{labelMap[status] || status}</span>
}

const inputCls = "w-full bg-[#1A2235] border border-[#1F2A40] text-[#E2E8F0] px-3 py-2.5 rounded-lg text-[0.875rem] outline-none focus:border-[#14B8A6] transition-colors"
const labelCls = "block text-[12px] text-[#94A3B8] font-semibold mb-1.5"

export default function SupervisorInventory() {
  const { t } = useTranslation()
  const { showToast } = useToastStore()
  const { data: partsData, isLoading, isError } = useQuery({
    queryKey: ['parts'],
    queryFn: () => partsService.getParts({ limit: 1000 })
  })

  useEffect(() => {
    if (isError) showToast(t('common.toastLoadError', 'Failed to load parts catalog'), TOAST_COLORS.error)
  }, [isError, showToast, t])
  
  const parts = partsData?.items || []
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedPartId, setSelectedPartId] = useState('')
  const [pendingRequestsCount, setPendingRequestsCount] = useState(3)

  const ROWS = 8

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return parts.filter(p => {
      const status = getStatus(p.qty, p.minLevel)
      const matchTab = activeTab === 'all' || status === activeTab
      const matchQ = !q || p.partCode?.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
      const matchCat = !categoryFilter || p.category === categoryFilter
      return matchTab && matchQ && matchCat
    })
  }, [parts, activeTab, search, categoryFilter])

  useEffect(() => setCurrentPage(1), [activeTab, search, categoryFilter])

  const kpis = {
    total: parts.length,
    inStock: parts.filter(p => getStatus(p.qty, p.minLevel) === 'In Stock').length,
    lowStock: parts.filter(p => getStatus(p.qty, p.minLevel) === 'Low Stock').length,
    outOfStock: parts.filter(p => getStatus(p.qty, p.minLevel) === 'Out of Stock').length,
  }
  
  const counts = {
    all: parts.length,
    'In Stock': kpis.inStock,
    'Low Stock': kpis.lowStock,
    'Out of Stock': kpis.outOfStock,
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS))
  const paginated = filtered.slice((currentPage - 1) * ROWS, currentPage * ROWS)

  const handleRequestPart = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const partId = formData.get('partId')
    const qty = formData.get('qty')
    
    if (!partId) return showToast(t('supInventory.toastSelectPart'), TOAST_COLORS.error)
    
    setPendingRequestsCount(prev => prev + 1)
    setShowRequestModal(false)
    showToast(t('supInventory.toastRequestSent', { qty }), TOAST_COLORS.supervisor)
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('supInventory.pageTitle')}</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('supInventory.pageSubtitle')}</p>
        </div>
        <button onClick={() => { setSelectedPartId(''); setShowRequestModal(true) }} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#14B8A6] hover:bg-[#0D9488] text-white text-[13px] font-bold rounded-lg transition-colors shadow-lg shadow-teal-500/20 shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg> {t('supInventory.requestPart')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('supInventory.totalItems'), value: kpis.total, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />, colorClass: 'bg-[rgba(20,184,166,0.12)] text-[#14B8A6]' },
          { label: t('supInventory.lowStockAlerts'), value: kpis.lowStock, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />, colorClass: 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]' },
          { label: t('supInventory.outOfStock'), value: kpis.outOfStock, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />, colorClass: 'bg-[rgba(239,68,68,0.12)] text-[#F87171]' },
          { label: t('supInventory.pendingRequests'), value: pendingRequestsCount, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />, colorClass: 'bg-[rgba(14,165,233,0.12)] text-[#0EA5E9]' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${kpi.colorClass}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">{kpi.icon}</svg></div>
            <div><div className="text-[1.25rem] font-bold text-[var(--text-primary)] leading-none">{kpi.value}</div><div className="text-[0.75rem] text-[var(--text-muted)] font-semibold mt-1">{kpi.label}</div></div>
          </div>
        ))}
      </div>

      <div className="flex gap-[2px] bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-[10px] p-1 w-fit overflow-x-auto">
        {[{id:'all', label:t('supInventory.allParts')}, {id:'In Stock', label:t('supInventory.inStock')}, {id:'Low Stock', label:t('supInventory.lowStock')}, {id:'Out of Stock', label:t('supInventory.outOfStock')}].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={clsx("px-[18px] py-[7px] rounded-[7px] text-[0.8125rem] font-semibold transition-colors flex items-center whitespace-nowrap", activeTab === tab.id ? "bg-[var(--bg-panel)] text-[#14B8A6]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]")}>
            {tab.label}
            <span className={clsx("ml-[5px] px-[6px] py-[1px] rounded-full text-[0.65rem] font-bold", activeTab === tab.id ? "bg-[rgba(20,184,166,0.15)] text-[#14B8A6]" : "bg-[var(--bg-panel)] text-[var(--text-muted)]")}>{counts[tab.id]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col">
        <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-t-[10px] p-3 px-4 flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] h-[34px] bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 focus-within:border-[#14B8A6] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px] text-[var(--text-muted)]"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" /></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('supInventory.searchPlaceholder')} className="flex-1 min-w-0 bg-transparent border-none outline-none text-[var(--text-primary)] text-[0.8125rem]" />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-[34px] bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg text-[0.8rem] px-2 outline-none focus:border-[#14B8A6]">
            <option value="">{t('supInventory.categoryAll')}</option>
            <option value="Sensors">Sensors</option>
            <option value="Cables">Cables</option>
            <option value="Consumables">Consumables</option>
            <option value="Accessories">Accessories</option>
            <option value="Power">Power</option>
          </select>
        </div>

        <Panel noPadding className="border-t-0 rounded-t-none rounded-b-[12px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[var(--bg-table-header)] border-b border-[var(--border)]">
                {[t('supInventory.partId'), t('supInventory.partName'), t('supInventory.category'), t('supInventory.stockLevel'), t('supInventory.minLevel'), t('common.status'), t('common.actions')].map((h, i) => (
                  <th key={i} className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? <tr><td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">{t('common.loading')}</td></tr> : paginated.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">{t('supInventory.noPartsFound')}</td></tr> : paginated.map(p => {
                const status = getStatus(p.qty, p.minLevel)
                return (
                <tr key={p.id} className="hover:bg-[var(--bg-hover)]">
                  <td className="p-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">{p.partCode}</td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)] font-semibold">{p.name}</td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)]">{p.category}</td>
                  <td className="p-4 text-[13.5px] font-bold text-[var(--text-primary)]">{p.qty}</td>
                  <td className="p-4 text-[13px] text-[var(--text-muted)]">{p.minLevel}</td>
                  <td className="p-4"><StockBadge status={status} /></td>
                  <td className="p-4">
                    <button onClick={() => { setSelectedPartId(p.id); setShowRequestModal(true) }} className="bg-[rgba(20,184,166,0.12)] border border-[rgba(20,184,166,0.25)] text-[#14B8A6] px-2.5 py-1 rounded-md text-[11px] font-bold hover:bg-[rgba(20,184,166,0.2)] transition-colors">{t('supInventory.requestRestock')}</button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
          </div>
          <div className="flex justify-between items-center p-3 px-4 border-t border-[var(--border)]">
            <span className="text-[0.8rem] text-[var(--text-muted)]">{t('supInventory.showingResults', { start: filtered.length ? (currentPage - 1) * ROWS + 1 : 0, end: Math.min(currentPage * ROWS, filtered.length), total: filtered.length })}</span>
            <div className="flex gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-7 h-7 rounded bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-30">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => <button key={n} onClick={() => setCurrentPage(n)} className={clsx("w-7 h-7 rounded text-[0.8rem]", n === currentPage ? "bg-[#14B8A6] text-white" : "bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)]")}>{n}</button>)}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-7 h-7 rounded bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-30">›</button>
            </div>
          </div>
        </Panel>
      </div>

      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title={t('supInventory.requestModalTitle')}
        maxWidth="420px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowRequestModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="request-form" color="#14B8A6">
              {t('supInventory.submitRequest')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="request-form" onSubmit={handleRequestPart} className="flex flex-col gap-4 mt-1">
          <div className="bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] text-[#FCD34D] p-2.5 rounded-lg flex items-start gap-2.5 text-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 mt-0.5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="text-[0.8rem] font-medium leading-relaxed">{t('supInventory.requestDisclaimer')}</span>
          </div>
          <SelectField label={t('supInventory.selectPart')} name="partId" value={selectedPartId} onChange={e => setSelectedPartId(e.target.value)} placeholder={t('supInventory.selectInventoryPart')} options={parts.map(p => ({value: p.id, label: `${p.name} (${t('supInventory.stockLevel')}: ${p.qty})`}))} />
          <InputField type="number" label={t('supInventory.quantityRequired')} name="qty" min="1" defaultValue="1" />
          <InputField type="textarea" label={t('supInventory.reasonNotes')} name="notes" placeholder={t('supInventory.reasonPlaceholder')} />
        </form>
      </Modal>
    </div>
  )
}

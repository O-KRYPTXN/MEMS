import { useState, useMemo, useEffect } from 'react'
import clsx from 'clsx'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'



const getStatus = (qty, min) => qty === 0 ? 'Out of Stock' : qty <= min ? 'Low Stock' : 'In Stock'

const mockWOs = ['WO-2039 (ECG Monitor)', 'WO-2036 (Patient Monitor)', 'WO-2034 (Pulse Oximeter)']

const RequestStatusBadge = ({ status }) => {
  const { t } = useTranslation()
  const map = {
    'Pending': 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]',
    'Approved': 'bg-[rgba(59,130,246,0.12)] text-[#60A5FA]',
    'Fulfilled': 'bg-[rgba(34,197,94,0.12)] text-[#4ADE80]',
    'Rejected': 'bg-[rgba(239,68,68,0.12)] text-[#F87171]',
  }
  const labelMap = {
    'Pending': t('common.statusPending', 'Pending'),
    'Approved': t('common.statusApproved', 'Approved'),
    'Fulfilled': t('common.statusFulfilled', 'Fulfilled'),
    'Rejected': t('common.statusRejected', 'Rejected')
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${map[status] || ''}`}>{labelMap[status] || status}</span>
}

const StockBadge = ({ status }) => {
  const { t } = useTranslation()
  const map = {
    'In Stock': 'bg-[rgba(34,197,94,0.12)] text-[#4ADE80]',
    'Low Stock': 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]',
    'Out of Stock': 'bg-[rgba(239,68,68,0.12)] text-[#F87171]',
  }
  const labelMap = {
    'In Stock': t('common.statusInStock', 'In Stock'),
    'Low Stock': t('common.statusLowStock', 'Low Stock'),
    'Out of Stock': t('common.statusOutStock', 'Out of Stock')
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${map[status] || ''}`}>{labelMap[status] || status}</span>
}

import Panel, { PanelHeader } from '../../components/ui/Panel'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as partsService from '../../api/partsService'
import * as partRequestsService from '../../api/partRequestsService'
import { formatDate } from '../../utils/formatDate'

const inputCls = "w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] px-3 py-2.5 rounded-lg text-[0.875rem] outline-none focus:border-[#F59E0B] transition-colors"
const labelCls = "block text-[12px] text-[var(--text-muted)] font-semibold mb-1.5"

export default function TechnicianInventory() {
  const { t } = useTranslation()
  const { showToast } = useToastStore()
  const queryClient = useQueryClient()
  
  const { data: partsData, isLoading: partsLoading, isError: partsError } = useQuery({
    queryKey: ['parts'],
    queryFn: () => partsService.getParts({ limit: 1000 })
  })

  const { data: requestsData, isLoading: requestsLoading, isError: requestsError } = useQuery({
    queryKey: ['partRequests'],
    queryFn: () => partRequestsService.getPartRequests({ limit: 100 })
  })

  useEffect(() => {
    if (partsError) showToast(t('common.toastLoadError', 'Failed to load parts catalog'), TOAST_COLORS.error)
    if (requestsError) showToast(t('common.toastLoadError', 'Failed to load part requests'), TOAST_COLORS.error)
  }, [partsError, requestsError, showToast, t])

  const parts = partsData?.items || []
  const requests = requestsData?.items || []
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showReqModal, setShowReqModal] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)

  const filteredParts = useMemo(() => {
    const q = search.toLowerCase()
    return parts.filter(p => {
      const status = getStatus(p.qty, p.minLevel)
      const matchTab = activeTab === 'all' || status === activeTab
      const matchQ = !q || p.partCode?.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
      const matchCat = !categoryFilter || p.category === categoryFilter
      return matchTab && matchQ && matchCat
    })
  }, [parts, activeTab, search, categoryFilter])

  const counts = {
    all: parts.length,
    'In Stock': parts.filter(p => getStatus(p.qty, p.minLevel) === 'In Stock').length,
    'Low Stock': parts.filter(p => getStatus(p.qty, p.minLevel) === 'Low Stock').length,
    'Out of Stock': parts.filter(p => getStatus(p.qty, p.minLevel) === 'Out of Stock').length,
  }

  const createRequestMutation = useMutation({
    mutationFn: partRequestsService.createPartRequest,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['partRequests'])
      setShowReqModal(false)
      showToast(t('techInventory.toastRequestSent', { qty: data.qty, name: data.part?.name || selectedPart?.name }), TOAST_COLORS.technician)
    },
    onError: (err) => {
      showToast(err.response?.data?.message || t('common.errorOccurred', 'An error occurred'), TOAST_COLORS.error)
    }
  })

  const handleRequestSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const qty = parseInt(formData.get('qty'), 10)
    // mockWOs value logic, let's keep it but skip actually storing workOrderId since we don't have real IDs in the dropdown. Or leave it optional.
    const notes = formData.get('notes')
    
    createRequestMutation.mutate({
      partId: selectedPart.id,
      qty,
      notes
      // Not sending workOrderId as the dropdown uses mock string names, not IDs.
    })
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('techInventory.pageTitle')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('techInventory.pageSubtitle')}</p>
      </div>

      <Panel noPadding className="mb-2">
        <PanelHeader title={t('techInventory.pendingRequests')} />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[var(--bg-table-header)] border-b border-[var(--border)]">
                {['Request ID', t('techInventory.partName'), 'Qty', 'Date', t('common.status')].map(h => (
                  <th key={h} className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {requestsLoading ? <tr><td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">{t('common.loading')}</td></tr> : requests.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">{t('techInventory.noRequestsFound', 'No requests found.')}</td></tr> : requests.map(r => (
                <tr key={r.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="p-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">{r.requestNumber}</td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)] font-semibold">{r.part?.name}</td>
                  <td className="p-4 text-[13.5px] font-bold text-[var(--text-primary)]">{r.qty}</td>
                  <td className="p-4 text-[12px] text-[var(--text-muted)] whitespace-nowrap">{formatDate(r.createdAt)}</td>
                  <td className="p-4"><RequestStatusBadge status={r.status === 'PENDING' ? 'Pending' : r.status === 'APPROVED' ? 'Approved' : r.status === 'FULFILLED' ? 'Fulfilled' : 'Rejected'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="flex gap-[2px] bg-[var(--bg-card)] border border-[var(--border)] rounded-[10px] p-1 w-fit overflow-x-auto">
        {[{id:'all', label:t('techInventory.allStatus')}, {id:'In Stock', label:t('common.statusInStock', 'In Stock')}, {id:'Low Stock', label:t('common.statusLowStock', 'Low Stock')}, {id:'Out of Stock', label:t('common.statusOutStock', 'Out of Stock')}].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={clsx("px-[18px] py-[7px] rounded-[7px] text-[0.8125rem] font-semibold transition-colors flex items-center whitespace-nowrap", activeTab === tab.id ? "bg-[rgba(245,158,11,0.12)] text-[#FCD34D]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]")}>
            {tab.label}
            <span className={clsx("ms-[5px] px-[6px] py-[1px] rounded-full text-[0.65rem] font-bold", activeTab === tab.id ? "bg-[rgba(245,158,11,0.2)] text-[#F59E0B]" : "bg-[var(--bg-hover)] text-[var(--text-muted)]")}>{counts[tab.id]}</span>
          </button>
        ))}
      </div>

      <div className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-b-xl rounded-tr-xl overflow-hidden mt-[-10px]">
        <div className="bg-[var(--bg-card)] border-b border-[var(--border)] p-3 px-4 flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] h-[34px] bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 focus-within:border-[#F59E0B] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px] text-[var(--text-muted)]"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" /></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('techInventory.searchPlaceholder')} className="flex-1 min-w-0 bg-transparent border-none outline-none text-[var(--text-primary)] text-[0.8125rem]" />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-[34px] bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg text-[0.8rem] px-2 outline-none focus:border-[#F59E0B]">
            <option value="">{t('techInventory.allCategories')}</option>
            <option value="Sensors">Sensors</option>
            <option value="Cables">Cables</option>
            <option value="Consumables">Consumables</option>
            <option value="Accessories">Accessories</option>
            <option value="Power">Power</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[var(--bg-table-header)] border-b border-[var(--border)]">
                {['Part ID', t('techInventory.partName'), t('techInventory.category'), t('techInventory.stockLevel'), t('common.status'), t('techInventory.actions')].map(h => (
                  <th key={h} className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {partsLoading ? <tr><td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">{t('common.loading')}</td></tr> : filteredParts.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">{t('techInventory.noPartsFound')}</td></tr> : filteredParts.map(p => {
                const status = getStatus(p.qty, p.minLevel)
                return (
                <tr key={p.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="p-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">{p.partCode}</td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)] font-semibold">{p.name}</td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)]">{p.category}</td>
                  <td className={clsx("p-4 text-[13.5px] font-bold", p.qty === 0 ? "text-[#F87171]" : p.qty <= p.minLevel ? "text-[#FCD34D]" : "text-[var(--text-primary)]")}>{p.qty}</td>
                  <td className="p-4"><StockBadge status={status} /></td>
                  <td className="p-4">
                    <button onClick={() => { setSelectedPart(p); setShowReqModal(true) }} className="px-2.5 py-1 text-[11px] font-bold bg-transparent border border-[var(--border)] text-[var(--text-secondary)] rounded-md hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">{t('techInventory.requestPartBtn')}</button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showReqModal && !!selectedPart}
        onClose={() => setShowReqModal(false)}
        title={selectedPart ? t('techInventory.requestPartModalTitle', { name: selectedPart.name }) : 'Request Spare Part'}
        maxWidth="420px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowReqModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="request-form" color="#F59E0B" disabled={createRequestMutation.isPending}>
              {createRequestMutation.isPending ? t('common.loading', 'Loading...') : t('techInventory.submitRequest')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="request-form" onSubmit={handleRequestSubmit} className="flex flex-col gap-[14px] mt-1">
          <div>
            <label className={labelCls}>{t('techInventory.part')}</label>
            <div className="w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-secondary)] px-3 py-2.5 rounded-lg text-[0.875rem] font-semibold">{selectedPart?.name}</div>
          </div>
          <SelectField label={t('techInventory.relatedWO')} name="wo" required defaultValue="" placeholder={t('techInventory.selectWO')} options={mockWOs} />
          <InputField type="number" label={t('techInventory.quantityNeeded')} name="qty" min="1" defaultValue="1" required />
          <InputField type="textarea" label={t('techInventory.notes')} name="notes" placeholder={t('techInventory.notesPlaceholder')} required />
        </form>
      </Modal>
    </div>
  )
}

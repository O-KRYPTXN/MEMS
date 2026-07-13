import { useState } from 'react'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Panel from '../../components/ui/Panel'
import EmptyState from '../../components/ui/EmptyState'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../../utils/formatDate'

import * as partsService from '../../api/partsService'
import * as partRequestsService from '../../api/partRequestsService'

export default function StoreDashboard() {
  const [showFulfillModal, setShowFulfillModal] = useState(false)
  const [selectedReq, setSelectedReq] = useState(null)
  const [fulfillmentNotes, setFulfillmentNotes] = useState('')
  
  const { t } = useTranslation()
  const { showToast } = useToastStore()
  const queryClient = useQueryClient()

  // 1. Total Parts Query
  const { data: totalPartsData } = useQuery({
    queryKey: ['parts', 'total'],
    queryFn: () => partsService.getParts({ limit: 1 })
  })
  const totalParts = totalPartsData?.total || 0

  // 2. Low Stock Alerts Query
  const { data: lowStockData } = useQuery({
    queryKey: ['parts', 'lowStock'],
    queryFn: () => partsService.getParts({ isLowStock: 'true', limit: 50 })
  })
  // Sort critical shortages first (by lowest qty)
  const stockAlerts = (lowStockData?.items || []).sort((a, b) => a.qty - b.qty)

  // 3. Pending Requests Query
  const { data: pendingRequestsData, isLoading: isLoadingPending } = useQuery({
    queryKey: ['partRequests', 'APPROVED'],
    queryFn: () => partRequestsService.getPartRequests({ status: 'APPROVED', limit: 50 })
  })
  const requests = pendingRequestsData?.items || []
  const pendingCount = pendingRequestsData?.total || 0

  // 4. Fulfilled Requests Query (Replaces "Fulfillment Rate" KPI)
  const { data: fulfilledData } = useQuery({
    queryKey: ['partRequests', 'FULFILLED'],
    queryFn: () => partRequestsService.getPartRequests({ status: 'FULFILLED', limit: 1 })
  })
  const fulfilledCount = fulfilledData?.total || 0

  // Fulfill Mutation
  const fulfillMutation = useMutation({
    mutationFn: ({ id, notes }) => partRequestsService.updatePartRequestStatus({ id, data: { status: 'FULFILLED', notes } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] })
      queryClient.invalidateQueries({ queryKey: ['partRequests'] })
      setShowFulfillModal(false)
      setFulfillmentNotes('')
      showToast(t('storeDashboard.toastFulfilled', '✓ Request fulfilled and inventory deducted.'), TOAST_COLORS.store)
    },
    onError: (error) => {
      showToast(error.response?.data?.message || t('common.errorOccurred'), TOAST_COLORS.error)
    }
  })

  const handleFulfill = (e) => {
    e.preventDefault()
    if (!selectedReq) return
    fulfillMutation.mutate({ id: selectedReq.id, notes: fulfillmentNotes })
  }

  const kpis = [
    { label: t('storeDashboard.totalParts', 'Total Parts in Stock'), value: totalParts, bg: 'bg-purple-600/10 text-purple-700 dark:bg-[rgba(139,92,246,0.15)] dark:text-[#A78BFA]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/> },
    { label: t('storeDashboard.lowStockAlerts', 'Low Stock Alerts'), value: stockAlerts.length, bg: 'bg-amber-600/10 text-amber-700 dark:bg-[rgba(245,158,11,0.15)] dark:text-[#FCD34D]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2.25m0 2.625h.01M12 4.5l-9 15h18l-9-15z"/> },
    { label: t('storeDashboard.pendingRequests', 'Pending Requests'), value: pendingCount, bg: 'bg-blue-600/10 text-blue-700 dark:bg-[rgba(59,130,246,0.15)] dark:text-[#60A5FA]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/> },
    { label: t('storeDashboard.fulfilledRequests', 'Fulfilled Requests'), value: fulfilledCount, bg: 'bg-green-600/10 text-green-700 dark:bg-[rgba(34,197,94,0.15)] dark:text-[#4ADE80]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/> }
  ]

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('storeDashboard.pageTitle', 'Store Dashboard')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('storeDashboard.pageSubtitle', 'Overview of inventory alerts, pending orders, and recent fulfillments.')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[12px] p-[18px] flex flex-row gap-[14px] items-center">
            <div className={`w-[42px] h-[42px] rounded-[10px] flex items-center justify-center shrink-0 ${kpi.bg}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">{kpi.icon}</svg>
            </div>
            <div>
              <div className="text-[1.5rem] font-[800] text-[var(--text-primary)] leading-none">{kpi.value}</div>
              <div className="text-[0.75rem] text-[var(--text-muted)] font-semibold mt-1">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        <Panel className="flex flex-col !p-0">
          <div className="p-4 border-b border-[var(--border)]"><h2 className="text-sm font-bold text-[var(--text-primary)]">{t('storeDashboard.pendingRequestsTitle', 'Pending Department Requests')}</h2></div>
          <div className="p-4 flex flex-col gap-3">
            {isLoadingPending ? (
               <div className="text-center py-6 text-[var(--text-muted)] text-sm">{t('common.loading', 'Loading...')}</div>
            ) : requests.length === 0 ? (
              <EmptyState message={t('storeDashboard.noPendingRequests', 'No pending requests')} />
            ) : (
              requests.map(r => (
                <div key={r.id} className="bg-[var(--bg-input)] border border-[var(--border)] p-4 rounded-lg flex justify-between items-center gap-4">
                  <div className="min-w-0">
                    <span className="text-[0.7rem] font-bold uppercase tracking-wide bg-[var(--bg-card)] px-2 py-0.5 rounded text-[var(--text-secondary)] inline-block mb-1">
                      {t('common.dept')} {r.user?.department?.code || r.user?.department?.name || 'Unknown'}
                    </span>
                    <div className="text-xs text-[var(--text-muted)]">{r.requestNumber} — {formatDate(r.createdAt, 'MMM DD, HH:mm')}</div>
                    <div className="text-sm font-bold text-[var(--text-primary)] mt-1 truncate">{r.qty}x {r.part?.name}</div>
                  </div>
                  <button 
                    onClick={() => { setSelectedReq(r); setShowFulfillModal(true) }} 
                    className="bg-purple-700/10 border border-purple-700/30 dark:border-[rgba(139,92,246,0.25)] text-purple-800 dark:bg-[rgba(139,92,246,0.12)] dark:text-[#D8B4FE] hover:bg-[rgba(139,92,246,0.2)] px-4 py-1.5 rounded-md text-[0.8rem] font-bold transition-colors shrink-0"
                  >
                    {t('storeDashboard.fulfillBtn', 'Fulfill')}
                  </button>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel className="flex flex-col !p-0">
          <div className="p-4 border-b border-[var(--border)]"><h2 className="text-sm font-bold text-[var(--text-primary)]">{t('storeDashboard.criticalAlertsTitle', 'Critical Stock Alerts')}</h2></div>
          <div className="p-4 flex flex-col gap-3">
            {stockAlerts.length === 0 ? (
              <div className="text-center py-6 text-[var(--text-muted)] text-sm">{t('storeDashboard.noStockAlerts', 'No stock alerts')}</div>
            ) : (
              stockAlerts.map(i => (
                <div key={i.id} className="bg-[var(--bg-input)] border border-[var(--border)] p-3.5 rounded-lg flex justify-between items-center gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{i.name}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{i.partCode} • {t('dashboard.min')}: {i.minLevel}</div>
                  </div>
                  <div className={clsx("px-2.5 py-1 rounded-md text-xs font-bold shrink-0 whitespace-nowrap", i.qty === 0 ? "bg-red-700/10 text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]" : "bg-yellow-700/10 text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]")}>
                    {t('storeInventory.qty', 'Qty')}: {i.qty}
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      <Modal
        isOpen={showFulfillModal && !!selectedReq}
        onClose={() => { setShowFulfillModal(false); setFulfillmentNotes(''); }}
        title={selectedReq ? t('storeDashboard.fulfillReqTitle', { id: selectedReq.requestNumber }) : ''}
        maxWidth="460px"
        footer={
          <>
            <ModalCancelBtn onClick={() => { setShowFulfillModal(false); setFulfillmentNotes(''); }}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn onClick={handleFulfill} color="#8B5CF6" disabled={fulfillMutation.isPending}>
              {fulfillMutation.isPending ? t('common.loading', 'Processing...') : t('storeDashboard.confirmFulfillment', 'Confirm Fulfillment')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <div className="bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.2)] text-purple-800 dark:text-[#D8B4FE] p-4 rounded-lg text-sm leading-relaxed mb-4">
          {selectedReq ? t('storeDashboard.fulfillDisclaimer', 'You are about to fulfill {{qty}}x {{name}} for the {{dept}} department. This will deduct from current inventory.', { qty: selectedReq.qty, name: selectedReq.part?.name, dept: selectedReq.user?.department?.name || 'Unknown' }) : ''}
        </div>
        <div>
          <label className="block text-[12px] text-[var(--text-muted)] font-semibold mb-1.5">{t('storeDashboard.fulfillmentNotes', 'Fulfillment Notes')}</label>
          <textarea 
            value={fulfillmentNotes}
            onChange={(e) => setFulfillmentNotes(e.target.value)}
            className="w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] px-3 py-2.5 rounded-lg text-[0.875rem] outline-none focus:border-[#8B5CF6] transition-colors min-h-[80px] resize-y" 
            placeholder={t('storeDashboard.fulfillmentNotesPlaceholder', 'Optional fulfillment notes...')}
          ></textarea>
        </div>
      </Modal>
    </div>
  )
}

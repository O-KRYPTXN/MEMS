import React, { useState, useMemo } from 'react'
import clsx from 'clsx'
import Panel from '../../components/ui/Panel'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import InputField from '../../components/forms/InputField'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as storeOrdersService from '../../api/storeOrdersService'
import { formatDate } from '../../utils/formatDate'

function OrderStatusBadge({ status }) {
  const { t } = useTranslation()
  const map = {
    'PENDING': 'bg-slate-700/10 text-slate-800 dark:bg-[rgba(100,116,139,0.12)] dark:text-[#94A3B8]',
    'ORDERED': 'bg-yellow-700/10 text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]',
    'DELIVERED': 'bg-green-700/10 text-green-800 dark:bg-[rgba(34,197,94,0.12)] dark:text-[#4ADE80]',
    'REJECTED': 'bg-red-700/10 text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]'
  }
  const labelMap = {
    'PENDING': t('storeOrders.statusPending', 'Pending Review'),
    'ORDERED': t('storeOrders.statusOrdered', 'Ordered'),
    'DELIVERED': t('storeOrders.statusDelivered', 'Delivered'),
    'REJECTED': t('storeOrders.statusRejected', 'Rejected')
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold whitespace-nowrap ${map[status] || ''}`}>{labelMap[status]}</span>
}

export default function AdminOrders() {
  const [activeTab, setActiveTab] = useState('PENDING')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [expandedRows, setExpandedRows] = useState({})
  
  const [decision, setDecision] = useState('ORDERED')
  const [rejectionReason, setRejectionReason] = useState('')
  const [supplierResponse, setSupplierResponse] = useState('')
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  
  const { t } = useTranslation()
  const { showToast } = useToastStore()
  const queryClient = useQueryClient()

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['storeOrders'],
    queryFn: () => storeOrdersService.getStoreOrders({ limit: 500 })
  })

  const orders = ordersData?.data || []

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (activeTab === 'ALL') return true
      return o.status === activeTab
    })
  }, [orders, activeTab])

  const pendingCount = orders.filter(o => o.status === 'PENDING').length

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const reviewMutation = useMutation({
    mutationFn: storeOrdersService.updateStoreOrderStatus,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['storeOrders'])
      setShowReviewModal(false)
      showToast(t('storeOrders.toastReviewed', '✓ Order {{id}} marked as {{status}}.', { id: data.orderNumber, status: data.status }), TOAST_COLORS.admin)
    },
    onError: (err) => {
      showToast(err.response?.data?.message || t('common.errorOccurred'), TOAST_COLORS.error)
    }
  })

  const updateResponseMutation = useMutation({
    mutationFn: storeOrdersService.updateSupplierResponse,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['storeOrders'])
      setShowUpdateModal(false)
      showToast(t('storeOrders.toastResponseUpdated', '✓ Supplier response updated for {{id}}.', { id: data.orderNumber }), TOAST_COLORS.admin)
    },
    onError: (err) => {
      showToast(err.response?.data?.message || t('common.errorOccurred'), TOAST_COLORS.error)
    }
  })

  const handleReview = (e) => {
    e.preventDefault()
    if (!selectedOrder) return

    if (decision === 'REJECTED' && !rejectionReason.trim()) {
      showToast(t('storeOrders.errorReasonRequired', 'Rejection reason is required.'), TOAST_COLORS.error)
      return
    }

    reviewMutation.mutate({
      id: selectedOrder.id,
      data: {
        status: decision,
        rejectionReason: decision === 'REJECTED' ? rejectionReason : undefined
      }
    })
  }

  const tabs = ['ALL', 'PENDING', 'ORDERED', 'DELIVERED', 'REJECTED']

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('storeOrders.adminPageTitle', 'Store Purchase Orders')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('storeOrders.adminPageSubtitle', 'Review, approve or reject purchase orders from the storekeeper.')}</p>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1 mb-2 inline-flex gap-0.5 overflow-x-auto w-full sm:w-auto self-start">
        {tabs.map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)} 
            className={clsx(
              "px-4 py-2 rounded-[8px] text-[0.8125rem] font-semibold transition-colors flex items-center whitespace-nowrap", 
              activeTab === tab ? "bg-[var(--bg-hover)] text-[#3B72F6]" : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            {tab === 'ALL' ? t('common.all', 'All') : t(`storeOrders.status${tab.charAt(0) + tab.slice(1).toLowerCase()}`, tab)}
            {tab === 'PENDING' && pendingCount > 0 && (
              <span className={clsx(
                "ml-2 px-1.5 py-0.5 rounded-full text-[0.65rem] font-bold", 
                activeTab === tab ? "bg-blue-700/10 text-blue-800 dark:bg-[rgba(59,114,246,0.12)] dark:text-[#3B72F6]" : "bg-[var(--bg-input)] text-[var(--text-muted)]"
              )}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <Panel noPadding className="-mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[var(--bg-table-header)] border-b border-[var(--border)]">
                <th className="w-10"></th>
                {[t('storeOrders.poNumber', 'PO #'), t('storeOrders.supplier', 'Supplier'), t('storeOrders.itemsCount', 'Items'), t('storeOrders.date', 'Date'), t('common.status', 'Status'), t('common.actions', 'Actions')].map(h => (
                  <th key={h} className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                <tr><td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">{t('common.loading')}</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">{t('storeOrders.noOrdersFound', 'No orders found.')}</td></tr>
              ) : filteredOrders.map(o => (
                <React.Fragment key={o.id}>
                  <tr className="hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="p-4 cursor-pointer" onClick={() => toggleRow(o.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${expandedRows[o.id] ? 'rotate-90' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </td>
                    <td className="p-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">{o.orderNumber}</td>
                    <td className="p-4 text-[13px] text-[var(--text-secondary)] font-semibold">{o.supplierName || 'N/A'}</td>
                    <td className="p-4 text-[13px] text-[var(--text-primary)] font-semibold">{o.items.length} {t('storeOrders.items', 'items')}</td>
                    <td className="p-4 text-[13px] text-[var(--text-muted)] whitespace-nowrap">{formatDate(o.createdAt)}</td>
                    <td className="p-4"><OrderStatusBadge status={o.status} /></td>
                    <td className="p-4">
                      {o.status === 'PENDING' && (
                        <button 
                          onClick={() => { 
                            setSelectedOrder(o); 
                            setDecision('ORDERED');
                            setRejectionReason('');
                            setShowReviewModal(true); 
                          }} 
                          className="px-3 py-1.5 bg-blue-700/10 border border-blue-700/30 dark:border-[rgba(59,114,246,0.25)] rounded-lg text-blue-800 dark:bg-[rgba(59,114,246,0.12)] dark:text-[#3B72F6] text-[12px] font-bold hover:bg-[rgba(59,114,246,0.2)] transition-colors"
                        >
                          {t('common.review', 'Review')}
                        </button>
                      )}
                      {(o.status === 'ORDERED' || o.status === 'DELIVERED') && (
                        <button 
                          onClick={() => { 
                            setSelectedOrder(o); 
                            setSupplierResponse(o.supplierResponse || '');
                            setShowUpdateModal(true); 
                          }} 
                          className="px-3 py-1.5 bg-[rgba(100,116,139,0.12)] border border-slate-700/30 dark:border-[rgba(100,116,139,0.25)] rounded-lg text-[var(--text-secondary)] text-[12px] font-bold hover:bg-[rgba(100,116,139,0.2)] transition-colors"
                        >
                          {t('storeOrders.updateResponseBtn', 'Update Response')}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedRows[o.id] && (
                    <tr className="bg-[rgba(255,255,255,0.01)] border-b border-[var(--border)]">
                      <td></td>
                      <td colSpan={6} className="p-4 pt-2">
                        <div className="bg-[var(--bg-input)] rounded-lg border border-[var(--border)] p-3">
                          <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Order Items</h4>
                          <ul className="flex flex-col gap-2">
                            {o.items.map(item => (
                              <li key={item.id} className="flex justify-between text-sm">
                                <span className="text-[var(--text-primary)] font-medium">{item.qty}x {item.part?.name} <span className="text-[var(--text-muted)]">({item.part?.partCode})</span></span>
                                <span className="text-[var(--text-secondary)]">${Number(item.unitPrice).toFixed(2)} / ea</span>
                              </li>
                            ))}
                          </ul>
                          {o.notes && (
                            <div className="mt-3 pt-3 border-t border-[var(--border)] text-sm text-[var(--text-muted)]">
                              <span className="font-semibold">{t('storeOrders.notes', 'Notes')}:</span> {o.notes}
                            </div>
                          )}
                          {o.supplierResponse && (
                            <div className="mt-3 pt-3 border-t border-[var(--border)] text-sm text-[var(--text-primary)]">
                              <span className="font-semibold">{t('storeOrders.supplierResponse', 'Supplier Response')}:</span> {o.supplierResponse}
                            </div>
                          )}
                          {o.status === 'REJECTED' && o.rejectionReason && (
                            <div className="mt-3 pt-3 border-t border-[var(--border)] text-sm text-[#F87171]">
                              <span className="font-semibold">Rejection Reason:</span> {o.rejectionReason}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        isOpen={showReviewModal && !!selectedOrder}
        onClose={() => setShowReviewModal(false)}
        title={t('storeOrders.reviewOrderTitle', 'Review Purchase Order')}
        maxWidth="500px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowReviewModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn 
              type="submit" 
              form="review-form" 
              color={decision === 'REJECTED' ? '#EF4444' : '#3B72F6'}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? t('common.loading') : t('storeOrders.submitDecision', 'Submit Decision')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <div className="-mx-[22px] -mt-[22px] mb-4 px-[22px] py-3 bg-[rgba(59,114,246,0.07)] border-b border-[#3B72F6]/20 text-[var(--text-secondary)] text-xs font-semibold">
          {t('storeOrders.order', 'Order')}: <span className="text-[var(--text-primary)]">{selectedOrder?.orderNumber}</span> • {t('storeOrders.supplier', 'Supplier')}: <span className="text-[var(--text-primary)]">{selectedOrder?.supplierName || 'N/A'}</span>
        </div>

        <form id="review-form" onSubmit={handleReview} className="flex flex-col gap-5">
          <div className="bg-[var(--bg-input)] p-3 rounded-lg border border-[var(--border)]">
            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Requested Items</h4>
            <ul className="flex flex-col gap-1.5 text-sm">
              {selectedOrder?.items?.map(item => (
                <li key={item.id} className="flex justify-between">
                  <span className="text-[var(--text-primary)]">{item.qty}x {item.part?.name}</span>
                  <span className="text-[var(--text-secondary)]">${(Number(item.qty) * Number(item.unitPrice)).toFixed(2)}</span>
                </li>
              ))}
              <li className="flex justify-between border-t border-[var(--border)] mt-2 pt-2 font-bold text-[var(--text-primary)]">
                <span>Total Value</span>
                <span>${selectedOrder?.items?.reduce((acc, item) => acc + (Number(item.qty) * Number(item.unitPrice)), 0).toFixed(2)}</span>
              </li>
            </ul>
          </div>

          <div>
            <label className="block text-[12px] text-[var(--text-muted)] font-semibold mb-2">{t('storeOrders.decision', 'Decision')}</label>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setDecision('ORDERED')}
                className={clsx("flex-1 px-4 py-2.5 rounded-lg border text-sm font-bold transition-colors", decision === 'ORDERED' ? "bg-blue-700/10 border-[#3B72F6] text-blue-800 dark:bg-[rgba(59,114,246,0.12)] dark:text-[#3B72F6]" : "bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:border-[#3B72F6]")}
              >
                {t('common.approve', 'Approve')}
              </button>
              <button 
                type="button"
                onClick={() => setDecision('REJECTED')}
                className={clsx("flex-1 px-4 py-2.5 rounded-lg border text-sm font-bold transition-colors", decision === 'REJECTED' ? "bg-red-700/10 border-[#F87171] text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]" : "bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:border-[#F87171]")}
              >
                {t('common.reject', 'Reject')}
              </button>
            </div>
          </div>

          {decision === 'REJECTED' && (
            <InputField 
              type="textarea"
              label={t('storeOrders.rejectionReason', 'Rejection Reason (Required)')}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Explain why this order is rejected..."
              required
            />
          )}
        </form>
      </Modal>

      <Modal
        isOpen={showUpdateModal && !!selectedOrder}
        onClose={() => setShowUpdateModal(false)}
        title={t('storeOrders.updateResponseTitle', 'Update Supplier Response')}
        maxWidth="500px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowUpdateModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn 
              type="button" 
              onClick={() => {
                if (!selectedOrder) return;
                updateResponseMutation.mutate({
                  id: selectedOrder.id,
                  data: { supplierResponse }
                });
              }} 
              color="#3B72F6"
              disabled={updateResponseMutation.isPending}
            >
              {updateResponseMutation.isPending ? t('common.loading') : t('common.save', 'Save')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
            Update the latest communication or response from the supplier regarding order <span className="font-bold text-[var(--text-primary)]">{selectedOrder?.orderNumber}</span>.
          </p>
          <InputField 
            type="textarea"
            label={t('storeOrders.supplierResponse', 'Supplier Response')}
            value={supplierResponse}
            onChange={e => setSupplierResponse(e.target.value)}
            placeholder="Record the latest response..."
          />
        </div>
      </Modal>
    </div>
  )
}

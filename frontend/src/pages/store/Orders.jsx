import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import clsx from 'clsx'
import Panel from '../../components/ui/Panel'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
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

export default function StoreOrders() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('active')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [expandedRows, setExpandedRows] = useState({})
  
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
      if (activeTab === 'active') return o.status === 'PENDING' || o.status === 'ORDERED'
      if (activeTab === 'received') return o.status === 'DELIVERED'
      return false
    })
  }, [orders, activeTab])

  const activeCount = orders.filter(o => o.status === 'PENDING' || o.status === 'ORDERED').length

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const receiveMutation = useMutation({
    mutationFn: storeOrdersService.updateStoreOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries(['storeOrders'])
      queryClient.invalidateQueries(['parts']) // Invalidate parts to sync inventory
      setShowConfirmModal(false)
      showToast(t('storeOrders.toastReceived', '✓ Order {{id}} received. Inventory stock incremented.', { id: selectedOrder?.orderNumber }), TOAST_COLORS.store)
    },
    onError: (err) => {
      showToast(err.response?.data?.message || t('common.errorOccurred'), TOAST_COLORS.error)
    }
  })

  const handleReceive = (e) => {
    e.preventDefault()
    if (!selectedOrder) return
    receiveMutation.mutate({ id: selectedOrder.id, data: { status: 'DELIVERED' } })
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('storeOrders.pageTitle', 'Purchase Orders')}</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('storeOrders.pageSubtitle', 'Track parts ordered from suppliers and update inventory upon receipt.')}</p>
        </div>
        <button 
          onClick={() => navigate(ROUTES.STORE_CREATE_ORDER)} 
          className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg text-[0.8125rem] font-bold transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          {t('storeOrders.newOrder', 'New Order')}
        </button>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1 mb-2 inline-flex gap-0.5 overflow-x-auto w-full sm:w-auto">
        <button 
          onClick={() => setActiveTab('active')} 
          className={clsx(
            "px-4 py-2 rounded-[8px] text-[0.8125rem] font-semibold transition-colors flex items-center whitespace-nowrap", 
            activeTab === 'active' ? "bg-[var(--bg-hover)] text-[#8B5CF6]" : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          )}
        >
          {t('storeOrders.tabActive', 'Active Orders')}
          <span className={clsx(
            "ml-2 px-1.5 py-0.5 rounded-full text-[0.65rem] font-bold", 
            activeTab === 'active' ? "bg-[rgba(139,92,246,0.12)] text-[#8B5CF6]" : "bg-[var(--bg-input)] text-[var(--text-muted)]"
          )}>
            {activeCount}
          </span>
        </button>
        <button 
          onClick={() => setActiveTab('received')} 
          className={clsx(
            "px-4 py-2 rounded-[8px] text-[0.8125rem] font-semibold transition-colors flex items-center whitespace-nowrap", 
            activeTab === 'received' ? "bg-[var(--bg-hover)] text-[#8B5CF6]" : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          )}
        >
          {t('storeOrders.tabReceived', 'Received')}
        </button>
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
                      {o.status === 'ORDERED' && (
                        <button 
                          onClick={() => { setSelectedOrder(o); setShowConfirmModal(true); }} 
                          className="px-3 py-1.5 bg-purple-700/10 border border-purple-700/30 dark:border-[rgba(139,92,246,0.25)] rounded-lg text-purple-800 dark:bg-[rgba(139,92,246,0.12)] dark:text-[#A78BFA] text-[12px] font-bold hover:bg-[rgba(139,92,246,0.2)] transition-colors"
                        >
                          {t('storeOrders.markReceivedBtn', 'Mark Received')}
                        </button>
                      )}
                      {o.status === 'PENDING' && (
                        <span className="text-[12px] text-[var(--text-muted)] italic">Awaiting Approval</span>
                      )}
                      {o.status === 'DELIVERED' && (
                        <span className="text-[var(--text-muted)] pl-4">—</span>
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
        isOpen={showConfirmModal && !!selectedOrder}
        onClose={() => setShowConfirmModal(false)}
        title={t('storeOrders.confirmDeliveryTitle', 'Confirm Delivery')}
        maxWidth="400px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowConfirmModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="button" onClick={handleReceive} disabled={receiveMutation.isPending} color="#8B5CF6">
              {receiveMutation.isPending ? t('common.loading') : t('storeOrders.confirmBtn', 'Confirm & Update Stock')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <div className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
          {t('storeOrders.confirmDeliveryMsg', 'Are you sure you want to mark order {{id}} as delivered? This will automatically increment the inventory stock for all items in this order.', { id: selectedOrder?.orderNumber })}
        </div>
        <div className="mt-4 p-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg">
          <ul className="text-sm flex flex-col gap-1.5">
            {selectedOrder?.items?.map(item => (
              <li key={item.id} className="text-[var(--text-primary)] font-medium flex justify-between">
                <span>{item.part?.name}</span>
                <span className="text-[#4ADE80] font-bold">+{item.qty}</span>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </div>
  )
}

import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as storeOrdersService from '../../api/storeOrdersService'
import Panel from '../../components/ui/Panel'
import { formatDate } from '../../utils/formatDate'

function StatusBadge({ status }) {
  const { t } = useTranslation()
  const map = {
    'REJECTED': 'bg-red-700/10 border border-red-700/30 dark:border-[rgba(239,68,68,0.25)] text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]'
  }
  const labelMap = {
    'REJECTED': t('storeRejectedOrders.statusCancelled', 'Rejected')
  }
  return <span className={`px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide whitespace-nowrap ${map[status] || ''}`}>{labelMap[status] || status}</span>
}

export default function StoreRejectedOrders() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  
  const { t } = useTranslation()
  const { showToast } = useToastStore()

  // Fetch only REJECTED orders from backend
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['storeOrders', 'REJECTED'],
    queryFn: () => storeOrdersService.getStoreOrders({ limit: 500, status: 'REJECTED' })
  })

  const orders = ordersData?.data || []

  const uniqueSuppliers = useMemo(() => Array.from(new Set(orders.map(o => o.supplierName).filter(Boolean))), [orders])

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase()
    return orders.filter(o => {
      const matchQ = !q || 
        o.supplierName?.toLowerCase().includes(q) || 
        o.orderNumber?.toLowerCase().includes(q)
      const matchSup = !supplierFilter || o.supplierName === supplierFilter
      return matchQ && matchSup
    })
  }, [orders, search, supplierFilter])

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('storeRejectedOrders.pageTitle', 'Rejected & Cancelled Orders')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('storeRejectedOrders.pageSubtitle', 'Review purchase orders that were rejected by the admin or cancelled by suppliers.')}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 max-w-[280px] relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px] text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" /></svg>
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder={t('storeRejectedOrders.searchPlaceholder', 'Search PO, supplier...')}
            className="w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] pl-9 pr-3 py-1.5 rounded-lg text-[0.8125rem] outline-none focus:border-[#8B5CF6] transition-colors h-[36px]"
          />
        </div>
        <select 
          value={supplierFilter} 
          onChange={e => setSupplierFilter(e.target.value)} 
          className="bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-secondary)] px-3 py-1.5 rounded-lg text-[0.8125rem] outline-none focus:border-[#8B5CF6] transition-colors h-[36px]"
        >
          <option value="">{t('storeRejectedOrders.supplierAll', 'Supplier: All')}</option>
          {uniqueSuppliers.map(sup => <option key={sup} value={sup}>{sup}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <Panel className="text-center py-10 text-[var(--text-muted)]">{t('common.loading', 'Loading...')}</Panel>
        ) : filteredOrders.length === 0 ? (
          <Panel className="text-center py-10 text-[var(--text-muted)]">{t('storeRejectedOrders.noOrdersFound', 'No rejected orders found.')}</Panel>
        ) : (
          filteredOrders.map(o => (
            <Panel key={o.id} noPadding className="border-red-700/30 dark:border-[rgba(239,68,68,0.25)] flex flex-col shadow-sm">
              <div className="p-4 bg-[var(--bg-card)] border-b border-[var(--border)] flex justify-between items-center flex-wrap gap-2">
                <span className="text-sm font-bold text-[var(--text-primary)]">{o.orderNumber} • {o.supplierName || 'N/A'}</span>
                <StatusBadge status={o.status} />
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="font-semibold text-[var(--text-primary)] uppercase tracking-wider text-xs mb-2">Items</div>
                    <ul className="flex flex-col gap-1 text-sm text-[var(--text-primary)]">
                      {o.items?.map(item => (
                        <li key={item.id}>{item.qty}x {item.part?.name}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-xs text-[var(--text-muted)]">{t('storeRejectedOrders.ordered', 'Created')}: {formatDate(o.createdAt)}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{t('storeRejectedOrders.rejected', 'Rejected')}: {formatDate(o.reviewedAt)}</div>
                  </div>
                </div>

                {o.rejectionReason && (
                  <div className="bg-[rgba(239,68,68,0.08)] border border-red-500/20 text-red-400 text-sm p-3 rounded-lg leading-relaxed">
                    <span className="font-bold">{t('storeRejectedOrders.reason', 'Supplier Response')}:</span> {o.rejectionReason}
                  </div>
                )}
                
                {o.notes && (
                  <div className="text-sm text-[var(--text-secondary)] bg-[var(--bg-input)] p-3 rounded-lg">
                    <span className="font-bold text-[var(--text-muted)]">Notes: </span> {o.notes}
                  </div>
                )}
              </div>
              <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border)] flex justify-end gap-3 flex-wrap">
                <button 
                  onClick={() => navigate(`/store/orders/create`)} 
                  className="px-4 py-2 bg-purple-700/10 border border-purple-700/30 dark:border-[rgba(139,92,246,0.25)] rounded-lg text-purple-800 dark:bg-[rgba(139,92,246,0.12)] dark:text-[#D8B4FE] text-[12px] font-bold hover:bg-[rgba(139,92,246,0.2)] transition-colors"
                >
                  {t('storeRejectedOrders.reorder', 'Draft New Order')}
                </button>
              </div>
            </Panel>
          ))
        )}
      </div>
    </div>
  )
}

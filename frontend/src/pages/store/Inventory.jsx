import { useState, useMemo, useEffect } from 'react'
import clsx from 'clsx'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import Panel from '../../components/ui/Panel'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as partsService from '../../api/partsService'

const getStatus = (qty, min) => qty === 0 ? 'Out of Stock' : qty <= min ? 'Low Stock' : 'In Stock'

function StockBadge({ status }) {
  const { t } = useTranslation()
  const labelMap = {
    'In Stock': t('storeInventory.statusInStock', 'In Stock'),
    'Low Stock': t('storeInventory.statusLowStock', 'Low Stock'),
    'Out of Stock': t('storeInventory.statusOutOfStock', 'Out of Stock')
  }
  const colorMap = {
    'In Stock': 'bg-green-700/10 text-green-800 dark:bg-[rgba(34,197,94,0.12)] dark:text-[#4ADE80]',
    'Low Stock': 'bg-yellow-700/10 text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]',
    'Out of Stock': 'bg-red-700/10 text-red-800 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#F87171]'
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold whitespace-nowrap ${colorMap[status] || ''}`}>{labelMap[status] || status}</span>
}

const inputCls = "w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] px-3 py-2.5 rounded-lg text-[0.875rem] outline-none focus:border-[#8B5CF6] transition-colors"
const labelCls = "block text-[12px] text-[var(--text-muted)] font-semibold mb-1.5"

export default function StoreInventory() {
  const { t } = useTranslation()
  const { showToast } = useToastStore()
  const queryClient = useQueryClient()
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
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRestockModal, setShowRestockModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPartId, setEditingPartId] = useState(null)
  const [selectedPart, setSelectedPart] = useState(null)
  
  const [restockQty, setRestockQty] = useState(1)
  const [addFormData, setAddFormData] = useState({ name: '', category: 'Sensors', qty: 0, minLevel: 1 })
  const [editFormData, setEditFormData] = useState({ name: '', category: 'Sensors', qty: 0, minLevel: 1 })

  const ROWS_PER_PAGE = 8

  const kpiTotal = parts.length
  const kpiLow = parts.filter(p => p.qty > 0 && p.qty <= p.minLevel).length
  const kpiOut = parts.filter(p => p.qty === 0).length
  const kpiCats = new Set(parts.map(p => p.category)).size

  const filteredParts = useMemo(() => {
    const q = search.toLowerCase()
    return parts.filter(p => {
      const status = getStatus(p.qty, p.minLevel)
      const matchTab = activeTab === 'all' || p.category.toLowerCase() === activeTab.toLowerCase()
      const matchQ = !q || p.partCode?.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
      const matchStatus = !statusFilter || status === statusFilter
      return matchTab && matchQ && matchStatus
    })
  }, [parts, activeTab, search, statusFilter])

  useEffect(() => setCurrentPage(1), [activeTab, search, statusFilter])

  const totalPages = Math.ceil(filteredParts.length / ROWS_PER_PAGE) || 1
  const paginatedParts = filteredParts.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)

  const restockMutation = useMutation({
    mutationFn: ({ id, qty }) => partsService.updatePart(id, { qty }),
    onSuccess: () => {
      queryClient.invalidateQueries(['parts'])
      setShowRestockModal(false)
      setRestockQty(1)
      showToast(t('storeInventory.toastStockUpdated', '✓ Stock updated successfully.'), TOAST_COLORS.store)
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to update stock', TOAST_COLORS.error)
    }
  })

  const handleRestock = (e) => {
    e.preventDefault()
    if (!selectedPart) return
    restockMutation.mutate({ 
      id: selectedPart.id, 
      qty: selectedPart.qty + parseInt(restockQty, 10) 
    })
  }

  const addPartMutation = useMutation({
    mutationFn: (data) => partsService.createPart(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['parts'])
      setShowAddModal(false)
      setAddFormData({ name: '', category: 'Sensors', qty: 0, minLevel: 1 })
      showToast(t('storeInventory.toastPartAdded', '✓ New part added to catalog.'), TOAST_COLORS.store)
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to add part', TOAST_COLORS.error)
    }
  })

  const handleAddPart = (e) => {
    e.preventDefault()
    addPartMutation.mutate({
      name: addFormData.name,
      category: addFormData.category,
      qty: parseInt(addFormData.qty, 10),
      minLevel: parseInt(addFormData.minLevel, 10)
    })
  }

  const editPartMutation = useMutation({
    mutationFn: (data) => partsService.updatePart(editingPartId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['parts'])
      setShowEditModal(false)
      showToast(t('common.toastUpdated', '✓ Part updated successfully.'), TOAST_COLORS.store)
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to update part', TOAST_COLORS.error)
    }
  })

  const handleEditPart = (e) => {
    e.preventDefault()
    editPartMutation.mutate({
      name: editFormData.name,
      category: editFormData.category,
      qty: parseInt(editFormData.qty, 10),
      minLevel: parseInt(editFormData.minLevel, 10)
    })
  }

  const kpis = [
    { label: t('storeInventory.totalItemsTracked', 'Total Items Tracked'), value: kpiTotal, bg: 'bg-[rgba(139,92,246,0.15)] text-[#A78BFA]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/> },
    { label: t('storeInventory.lowStockAlerts', 'Low Stock Alerts'), value: kpiLow, bg: 'bg-[rgba(245,158,11,0.15)] text-[#FCD34D]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2.25m0 2.625h.01M12 4.5l-9 15h18l-9-15z"/> },
    { label: t('storeInventory.outOfStock', 'Out of Stock'), value: kpiOut, bg: 'bg-[rgba(239,68,68,0.15)] text-[#F87171]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2.25m0 2.625h.01M12 4.5l-9 15h18l-9-15z"/> },
    { label: t('storeInventory.categoriesTracked', 'Categories Tracked'), value: kpiCats, bg: 'bg-[rgba(34,197,94,0.15)] text-[#4ADE80]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/> }
  ]

  const tabs = ['All', 'Sensors', 'Cables', 'Consumables', 'Accessories', 'Power']

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('storeInventory.pageTitle', 'Inventory Catalog')}</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('storeInventory.pageSubtitle', 'Manage central store inventory levels, track stock, and process new arrivals.')}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg text-[0.8125rem] font-bold transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          {t('storeInventory.addNewPart', 'Add New Part')}
        </button>
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

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1 inline-flex gap-0.5 overflow-x-auto w-full sm:w-auto">
        {tabs.map(tab => {
          const id = tab.toLowerCase()
          return (
            <button 
              key={id} 
              onClick={() => setActiveTab(id)} 
              className={clsx(
                "px-4 py-2 rounded-[8px] text-[0.8125rem] font-semibold transition-colors flex items-center whitespace-nowrap", 
                activeTab === id ? "bg-[var(--bg-hover)] text-[#D8B4FE]" : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
            >
              {tab === 'All' ? t('storeInventory.tabAll', 'All Items') : t(`storeInventory.tab${tab}`, tab)}
            </button>
          )
        })}
      </div>

      <Panel noPadding className="-mt-4">
        <div className="bg-[var(--bg-card)] border-b border-[var(--border)] p-3 px-4 flex flex-wrap gap-3 items-center">
          <div className="flex-1 max-w-sm relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px] text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" /></svg>
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder={t('storeInventory.searchPlaceholder', 'Search part code or name...')}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] pl-9 pr-3 py-1.5 rounded-lg text-[0.8125rem] outline-none focus:border-[#8B5CF6] transition-colors h-[34px]"
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)} 
            className="bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-secondary)] px-3 py-1.5 rounded-lg text-[0.8125rem] outline-none focus:border-[#8B5CF6] transition-colors h-[34px]"
          >
            <option value="">{t('common.allStatuses', 'All Statuses')}</option>
            <option value="In Stock">{t('storeInventory.statusInStock', 'In Stock')}</option>
            <option value="Low Stock">{t('storeInventory.statusLowStock', 'Low Stock')}</option>
            <option value="Out of Stock">{t('storeInventory.statusOutOfStock', 'Out of Stock')}</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[var(--bg-table-header)] border-b border-[var(--border)]">
                {[t('storeInventory.partCode', 'Part Code'), t('storeInventory.partName', 'Part Name'), t('storeInventory.category', 'Category'), t('storeInventory.stockQty', 'Stock Qty'), t('storeInventory.minLevel', 'Min Level'), t('common.status', 'Status'), t('common.actions', 'Actions')].map(h => (
                  <th key={h} className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? <tr><td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">{t('common.loading')}</td></tr> : paginatedParts.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">{t('storeInventory.noPartsFound', 'No parts found.')}</td></tr> : paginatedParts.map(p => {
                const status = getStatus(p.qty, p.minLevel)
                const qtyColor = p.qty === 0 ? "text-[#F87171]" : p.qty <= p.minLevel ? "text-[#FCD34D]" : "text-[var(--text-primary)]"
                return (
                  <tr key={p.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="p-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">{p.partCode}</td>
                    <td className="p-4 text-[13px] text-[var(--text-secondary)] font-semibold">{p.name}</td>
                    <td className="p-4 text-[13px] text-[var(--text-secondary)]">{p.category}</td>
                    <td className={`p-4 text-[13.5px] font-bold ${qtyColor}`}>{p.qty}</td>
                    <td className="p-4 text-[13px] text-[var(--text-secondary)]">{p.minLevel}</td>
                    <td className="p-4"><StockBadge status={status} /></td>
                    <td className="p-4 flex items-center gap-2">
                      <button 
                        onClick={() => { setSelectedPart(p); setShowRestockModal(true) }} 
                        className="px-3 py-1 bg-transparent border border-[var(--border)] rounded text-[var(--text-secondary)] text-[12px] font-bold hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        {t('storeInventory.restockBtn', 'Restock')}
                      </button>
                      <button
                        onClick={() => {
                          setEditingPartId(p.id);
                          setEditFormData({ name: p.name, category: p.category, qty: p.qty, minLevel: p.minLevel });
                          setShowEditModal(true);
                        }}
                        className="w-[26px] h-[26px] rounded bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[#8B5CF6] hover:bg-[rgba(139,92,246,0.1)] hover:border-[rgba(139,92,246,0.2)] transition-colors"
                        title={t('common.edit', 'Edit')}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[12px] h-[12px]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.89 1.14l-2.81.936.936-2.81a4.5 4.5 0 011.14-1.89l8.931-8.932z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg-card)]">
            <span className="text-xs text-[var(--text-muted)] font-medium">{t('storeInventory.pageCount', 'Page {{current}} of {{total}}', { current: currentPage, total: totalPages })}</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-3 py-1.5 rounded-md bg-[var(--bg-input)] text-[var(--text-secondary)] text-xs font-bold disabled:opacity-50 hover:bg-[var(--bg-hover)] transition-colors">{t('common.prev', 'Prev')}</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-3 py-1.5 rounded-md bg-[var(--bg-input)] text-[var(--text-secondary)] text-xs font-bold disabled:opacity-50 hover:bg-[var(--bg-hover)] transition-colors">{t('common.next', 'Next')}</button>
            </div>
          </div>
        )}
      </Panel>

      <Modal
        isOpen={showRestockModal && !!selectedPart}
        onClose={() => setShowRestockModal(false)}
        title={t('storeInventory.restockPartTitle', 'Restock Part')}
        maxWidth="420px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowRestockModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="restock-form" color="#8B5CF6">
              {t('storeInventory.updateStockBtn', 'Update Stock')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="restock-form" onSubmit={handleRestock} className="flex flex-col gap-[14px]">
          <div>
            <label className={labelCls}>{t('storeInventory.selectedPart', 'Selected Part')}</label>
            <input type="text" readOnly value={`${selectedPart?.name} (${selectedPart?.partCode})`} className={inputCls + " opacity-70 cursor-not-allowed"} />
          </div>
          <InputField type="number" label={t('storeInventory.qtyToAdd', 'Quantity to Add')} min="1" value={restockQty} onChange={e => setRestockQty(e.target.value)} required />
          <InputField type="textarea" label={t('storeInventory.deliveryNotes', 'Delivery Notes (Optional)')} placeholder={t('storeInventory.deliveryNotesPlaceholder', 'Order #, Supplier, etc...')} />
        </form>
      </Modal>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t('storeInventory.addNewPartTitle', 'Add New Part')}
        maxWidth="500px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowAddModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="add-part-form" color="#8B5CF6">
              {t('storeInventory.savePartBtn', 'Save Part')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="add-part-form" onSubmit={handleAddPart} className="grid grid-cols-2 gap-4">
          <SelectField label={t('storeInventory.categoryInput', 'Category')} value={addFormData.category} onChange={e => setAddFormData(f => ({...f, category: e.target.value}))} options={['Sensors', 'Cables', 'Consumables', 'Accessories', 'Power']} required />
          <div className="col-span-2">
            <InputField label={t('storeInventory.partNameInput', 'Part Name')} value={addFormData.name} onChange={e => setAddFormData(f => ({...f, name: e.target.value}))} placeholder={t('storeInventory.partNamePlaceholder', 'Full descriptive name')} required />
          </div>
          <InputField type="number" label={t('storeInventory.initialStock', 'Initial Stock')} min="0" value={addFormData.qty} onChange={e => setAddFormData(f => ({...f, qty: e.target.value}))} required />
          <InputField type="number" label={t('storeInventory.minimumLevel', 'Minimum Level')} min="1" value={addFormData.minLevel} onChange={e => setAddFormData(f => ({...f, minLevel: e.target.value}))} required />
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('storeInventory.editPartTitle', 'Edit Part')}
        maxWidth="500px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowEditModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="edit-part-form" color="#8B5CF6">
              {t('common.save', 'Save')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="edit-part-form" onSubmit={handleEditPart} className="grid grid-cols-2 gap-4">
          <SelectField label={t('storeInventory.categoryInput', 'Category')} value={editFormData.category} onChange={e => setEditFormData(f => ({...f, category: e.target.value}))} options={['Sensors', 'Cables', 'Consumables', 'Accessories', 'Power']} required />
          <div className="col-span-2">
            <InputField label={t('storeInventory.partNameInput', 'Part Name')} value={editFormData.name} onChange={e => setEditFormData(f => ({...f, name: e.target.value}))} placeholder={t('storeInventory.partNamePlaceholder', 'Full descriptive name')} required />
          </div>
          <InputField type="number" label={t('storeInventory.stockQty', 'Stock Qty')} min="0" value={editFormData.qty} onChange={e => setEditFormData(f => ({...f, qty: e.target.value}))} required />
          <InputField type="number" label={t('storeInventory.minimumLevel', 'Minimum Level')} min="1" value={editFormData.minLevel} onChange={e => setEditFormData(f => ({...f, minLevel: e.target.value}))} required />
        </form>
      </Modal>
    </div>
  )
}

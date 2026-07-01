import { useState, useMemo, useEffect } from 'react'
import clsx from 'clsx'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'

const initialParts = [
  { id: 'PRT-1001', name: 'O2 Sensor – Nellcor', category: 'Sensors', qty: 12, min: 10 },
  { id: 'PRT-1002', name: 'ECG Patient Cable 5-Lead', category: 'Cables', qty: 3, min: 5 },
  { id: 'PRT-1003', name: 'Defibrillator Pads (Adult)', category: 'Consumables', qty: 0, min: 10 },
  { id: 'PRT-1004', name: 'Ventilator Circuit Set', category: 'Consumables', qty: 8, min: 15 },
  { id: 'PRT-1005', name: 'NIBP Cuff – Adult', category: 'Accessories', qty: 24, min: 10 },
  { id: 'PRT-1006', name: 'SpO2 Probe – Pediatric', category: 'Sensors', qty: 2, min: 5 },
  { id: 'PRT-1007', name: 'Syringe Pump Battery 12V', category: 'Power', qty: 15, min: 5 },
  { id: 'PRT-1008', name: 'Infusion Set Micro-Drip', category: 'Consumables', qty: 0, min: 20 },
]

const getStatus = (qty, min) => qty === 0 ? 'Out of Stock' : qty <= min ? 'Low Stock' : 'In Stock'

function StockBadge({ status }) {
  const { t } = useTranslation()
  const labelMap = {
    'In Stock': t('storeInventory.statusInStock', 'In Stock'),
    'Low Stock': t('storeInventory.statusLowStock', 'Low Stock'),
    'Out of Stock': t('storeInventory.statusOutOfStock', 'Out of Stock')
  }
  const colorMap = {
    'In Stock': 'bg-[rgba(34,197,94,0.12)] text-[#4ADE80]',
    'Low Stock': 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]',
    'Out of Stock': 'bg-[rgba(239,68,68,0.12)] text-[#F87171]'
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold whitespace-nowrap ${colorMap[status] || ''}`}>{labelMap[status] || status}</span>
}

const inputCls = "w-full bg-[#1A2235] border border-[#1F2A40] text-[#E2E8F0] px-3 py-2.5 rounded-lg text-[0.875rem] outline-none focus:border-[#8B5CF6] transition-colors"
const labelCls = "block text-[12px] text-[#94A3B8] font-semibold mb-1.5"

export default function StoreInventory() {
  const [parts, setParts] = useState(initialParts)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRestockModal, setShowRestockModal] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)
  
  const [restockQty, setRestockQty] = useState(1)
  const [addFormData, setAddFormData] = useState({ id: '', name: '', category: 'Sensors', qty: 0, min: 1 })
  
  const { t } = useTranslation()
  const { showToast } = useToastStore()

  const ROWS_PER_PAGE = 8

  const kpiTotal = parts.length
  const kpiLow = parts.filter(p => p.qty > 0 && p.qty <= p.min).length
  const kpiOut = parts.filter(p => p.qty === 0).length
  const kpiCats = new Set(parts.map(p => p.category)).size

  const filteredParts = useMemo(() => {
    const q = search.toLowerCase()
    return parts.filter(p => {
      const status = getStatus(p.qty, p.min)
      const matchTab = activeTab === 'all' || p.category.toLowerCase() === activeTab.toLowerCase()
      const matchQ = !q || p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
      const matchStatus = !statusFilter || status === statusFilter
      return matchTab && matchQ && matchStatus
    })
  }, [parts, activeTab, search, statusFilter])

  useEffect(() => setCurrentPage(1), [activeTab, search, statusFilter])

  const totalPages = Math.ceil(filteredParts.length / ROWS_PER_PAGE) || 1
  const paginatedParts = filteredParts.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)

  const handleRestock = (e) => {
    e.preventDefault()
    if (!selectedPart) return
    setParts(prev => prev.map(p => p.id === selectedPart.id ? { ...p, qty: p.qty + parseInt(restockQty, 10) } : p))
    setShowRestockModal(false)
    setRestockQty(1)
    showToast(t('storeInventory.toastStockUpdated', '✓ Stock updated successfully.'), TOAST_COLORS.store)
  }

  const handleAddPart = (e) => {
    e.preventDefault()
    const newPart = {
      id: addFormData.id,
      name: addFormData.name,
      category: addFormData.category,
      qty: parseInt(addFormData.qty, 10),
      min: parseInt(addFormData.min, 10)
    }
    setParts(prev => [newPart, ...prev])
    setShowAddModal(false)
    setAddFormData({ id: '', name: '', category: 'Sensors', qty: 0, min: 1 })
    showToast(t('storeInventory.toastPartAdded', '✓ New part added to catalog.'), TOAST_COLORS.store)
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
          <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">{t('storeInventory.pageTitle', 'Inventory Catalog')}</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">{t('storeInventory.pageSubtitle', 'Manage central store inventory levels, track stock, and process new arrivals.')}</p>
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
          <div key={idx} className="bg-[#181D2A] border border-[#1F2A40] rounded-[12px] p-[18px] flex flex-row gap-[14px] items-center">
            <div className={`w-[42px] h-[42px] rounded-[10px] flex items-center justify-center shrink-0 ${kpi.bg}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">{kpi.icon}</svg>
            </div>
            <div>
              <div className="text-[1.5rem] font-[800] text-[#E2E8F0] leading-none">{kpi.value}</div>
              <div className="text-[0.75rem] text-[#94A3B8] font-semibold mt-1">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#131720] border border-[#1F2A40] rounded-xl p-1 inline-flex gap-0.5 overflow-x-auto w-full sm:w-auto">
        {tabs.map(tab => {
          const id = tab.toLowerCase()
          return (
            <button 
              key={id} 
              onClick={() => setActiveTab(id)} 
              className={clsx(
                "px-4 py-2 rounded-[8px] text-[0.8125rem] font-semibold transition-colors flex items-center whitespace-nowrap", 
                activeTab === id ? "bg-[#181D2A] text-[#D8B4FE]" : "bg-transparent text-[#5A6A85] hover:text-[#94A3B8]"
              )}
            >
              {tab === 'All' ? t('storeInventory.tabAll', 'All Items') : t(`storeInventory.tab${tab}`, tab)}
            </button>
          )
        })}
      </div>

      <div className="bg-[#181D2A] border border-[#1F2A40] rounded-xl overflow-hidden -mt-4">
        <div className="bg-[#131720] border-b border-[#1F2A40] p-3 px-4 flex flex-wrap gap-3 items-center">
          <div className="flex-1 max-w-sm relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px] text-[#5A6A85] absolute left-3 top-1/2 -translate-y-1/2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" /></svg>
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder={t('storeInventory.searchPlaceholder', 'Search part code or name...')}
              className="w-full bg-[#0F1117] border border-[#1F2A40] text-[#E2E8F0] pl-9 pr-3 py-1.5 rounded-lg text-[0.8125rem] outline-none focus:border-[#8B5CF6] transition-colors h-[34px]"
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)} 
            className="bg-[#0F1117] border border-[#1F2A40] text-[#94A3B8] px-3 py-1.5 rounded-lg text-[0.8125rem] outline-none focus:border-[#8B5CF6] transition-colors h-[34px]"
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
              <tr className="bg-[#1A2235] border-b border-[#1F2A40]">
                {[t('storeInventory.partCode', 'Part Code'), t('storeInventory.partName', 'Part Name'), t('storeInventory.category', 'Category'), t('storeInventory.stockQty', 'Stock Qty'), t('storeInventory.minLevel', 'Min Level'), t('common.status', 'Status'), t('common.actions', 'Actions')].map(h => (
                  <th key={h} className="p-4 text-[0.75rem] font-bold text-[#5A6A85] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2A40]">
              {paginatedParts.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-[#5A6A85]">{t('storeInventory.noPartsFound', 'No parts found.')}</td></tr> : paginatedParts.map(p => {
                const status = getStatus(p.qty, p.min)
                const qtyColor = p.qty === 0 ? "text-[#F87171]" : p.qty <= p.min ? "text-[#FCD34D]" : "text-[#E2E8F0]"
                return (
                  <tr key={p.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="p-4 text-[13px] font-medium text-[#E2E8F0] whitespace-nowrap">{p.id}</td>
                    <td className="p-4 text-[13px] text-[#94A3B8] font-semibold">{p.name}</td>
                    <td className="p-4 text-[13px] text-[#94A3B8]">{p.category}</td>
                    <td className={`p-4 text-[13.5px] font-bold ${qtyColor}`}>{p.qty}</td>
                    <td className="p-4 text-[13px] text-[#94A3B8]">{p.min}</td>
                    <td className="p-4"><StockBadge status={status} /></td>
                    <td className="p-4">
                      <button 
                        onClick={() => { setSelectedPart(p); setShowRestockModal(true) }} 
                        className="px-3 py-1 bg-transparent border border-[#1F2A40] rounded text-[#94A3B8] text-[12px] font-bold hover:bg-[#1A2235] hover:text-[#E2E8F0] transition-colors"
                      >
                        {t('storeInventory.restockBtn', 'Restock')}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-[#1F2A40] flex items-center justify-between bg-[#131720]">
            <span className="text-xs text-[#5A6A85] font-medium">{t('storeInventory.pageCount', 'Page {{current}} of {{total}}', { current: currentPage, total: totalPages })}</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-3 py-1.5 rounded-md bg-[#1A2235] text-[#94A3B8] text-xs font-bold disabled:opacity-50 hover:bg-[#1F2A40] transition-colors">{t('common.prev', 'Prev')}</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-3 py-1.5 rounded-md bg-[#1A2235] text-[#94A3B8] text-xs font-bold disabled:opacity-50 hover:bg-[#1F2A40] transition-colors">{t('common.next', 'Next')}</button>
            </div>
          </div>
        )}
      </div>

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
            <input type="text" readOnly value={`${selectedPart?.name} (${selectedPart?.id})`} className={inputCls + " opacity-70 cursor-not-allowed"} />
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
          <InputField label={t('storeInventory.partCodeInput', 'Part Code')} value={addFormData.id} onChange={e => setAddFormData(f => ({...f, id: e.target.value}))} placeholder="e.g. PRT-2050" required />
          <SelectField label={t('storeInventory.categoryInput', 'Category')} value={addFormData.category} onChange={e => setAddFormData(f => ({...f, category: e.target.value}))} options={['Sensors', 'Cables', 'Consumables', 'Accessories', 'Power']} required />
          <div className="col-span-2">
            <InputField label={t('storeInventory.partNameInput', 'Part Name')} value={addFormData.name} onChange={e => setAddFormData(f => ({...f, name: e.target.value}))} placeholder={t('storeInventory.partNamePlaceholder', 'Full descriptive name')} required />
          </div>
          <InputField type="number" label={t('storeInventory.initialStock', 'Initial Stock')} min="0" value={addFormData.qty} onChange={e => setAddFormData(f => ({...f, qty: e.target.value}))} required />
          <InputField type="number" label={t('storeInventory.minimumLevel', 'Minimum Level')} min="1" value={addFormData.min} onChange={e => setAddFormData(f => ({...f, min: e.target.value}))} required />
        </form>
      </Modal>
    </div>
  )
}

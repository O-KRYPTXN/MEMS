import { useState, useMemo } from 'react'
import clsx from 'clsx'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'

const initialRequests = [
  { id: 'REQ-1092', part: 'O2 Sensor – Nellcor', qty: 2, wo: 'WO-2034', date: '2026-06-27', status: 'Pending' },
  { id: 'REQ-1090', part: 'ECG Patient Cable 5-Lead', qty: 1, wo: 'WO-2039', date: '2026-06-26', status: 'Approved' },
  { id: 'REQ-1088', part: 'Defibrillator Pads (Adult)', qty: 5, wo: 'WO-2045', date: '2026-06-25', status: 'Fulfilled' },
  { id: 'REQ-1085', part: 'Ventilator Circuit Set', qty: 3, wo: 'WO-2022', date: '2026-06-20', status: 'Rejected' }
]

const catalogParts = [
  { id: 'PART-1001', name: 'O2 Sensor – Nellcor', category: 'Sensors', stock: 12, min: 10, status: 'In Stock' },
  { id: 'PART-1002', name: 'ECG Patient Cable 5-Lead', category: 'Cables', stock: 3, min: 5, status: 'Low Stock' },
  { id: 'PART-1003', name: 'Defibrillator Pads (Adult)', category: 'Consumables', stock: 0, min: 10, status: 'Out of Stock' },
  { id: 'PART-1004', name: 'Ventilator Circuit Set', category: 'Consumables', stock: 8, min: 15, status: 'Low Stock' },
  { id: 'PART-1005', name: 'NIBP Cuff – Adult', category: 'Accessories', stock: 24, min: 10, status: 'In Stock' }
]

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

const inputCls = "w-full bg-[#1A2235] border border-[#1F2A40] text-[#E2E8F0] px-3 py-2.5 rounded-lg text-[0.875rem] outline-none focus:border-[#F59E0B] transition-colors"
const labelCls = "block text-[12px] text-[#94A3B8] font-semibold mb-1.5"

export default function TechnicianInventory() {
  const { t } = useTranslation()
  const [requests, setRequests] = useState(initialRequests)
  const [parts] = useState(catalogParts)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showReqModal, setShowReqModal] = useState(false)
  const [selectedPart, setSelectedPart] = useState(null)
  
  const { showToast } = useToastStore()

  const filteredParts = useMemo(() => {
    const q = search.toLowerCase()
    return parts.filter(p => {
      const matchTab = activeTab === 'all' || p.status === activeTab
      const matchQ = !q || p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
      const matchCat = !categoryFilter || p.category === categoryFilter
      return matchTab && matchQ && matchCat
    })
  }, [parts, activeTab, search, categoryFilter])

  const counts = {
    all: parts.length,
    'In Stock': parts.filter(p => p.status === 'In Stock').length,
    'Low Stock': parts.filter(p => p.status === 'Low Stock').length,
    'Out of Stock': parts.filter(p => p.status === 'Out of Stock').length,
  }

  const handleRequestSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const qty = formData.get('qty')
    const woFull = formData.get('wo')
    
    const newReq = {
      id: `REQ-${Date.now().toString().slice(-4)}`,
      part: selectedPart.name,
      qty: parseInt(qty, 10),
      wo: woFull.split(' ')[0],
      date: new Date().toLocaleDateString('en-CA'),
      status: 'Pending'
    }
    
    setRequests(prev => [newReq, ...prev])
    setShowReqModal(false)
    showToast(t('techInventory.toastRequestSent', { qty, name: selectedPart.name }), TOAST_COLORS.technician)
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">{t('techInventory.pageTitle')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">{t('techInventory.pageSubtitle')}</p>
      </div>

      <div className="bg-[#181D2A] border border-[#1F2A40] rounded-xl mb-2 overflow-hidden">
        <div className="p-4 border-b border-[#1F2A40]">
          <h2 className="text-sm font-bold text-[#E2E8F0]">{t('techInventory.pendingRequests')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#1A2235] border-b border-[#1F2A40]">
                {['Request ID', t('techInventory.partName'), 'Qty', 'Date', t('common.status')].map(h => (
                  <th key={h} className="p-4 text-[0.75rem] font-bold text-[#5A6A85] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2A40]">
              {requests.map(r => (
                <tr key={r.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="p-4 text-[13px] font-medium text-[#E2E8F0] whitespace-nowrap">{r.id}</td>
                  <td className="p-4 text-[13px] text-[#94A3B8] font-semibold">{r.part}</td>
                  <td className="p-4 text-[13.5px] font-bold text-[#E2E8F0]">{r.qty}</td>
                  <td className="p-4 text-[12px] text-[#94A3B8] whitespace-nowrap">{r.date}</td>
                  <td className="p-4"><RequestStatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-[2px] bg-[#131720] border border-[#1F2A40] rounded-[10px] p-1 w-fit overflow-x-auto">
        {[{id:'all', label:t('techInventory.allStatus')}, {id:'In Stock', label:t('common.statusInStock', 'In Stock')}, {id:'Low Stock', label:t('common.statusLowStock', 'Low Stock')}, {id:'Out of Stock', label:t('common.statusOutStock', 'Out of Stock')}].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={clsx("px-[18px] py-[7px] rounded-[7px] text-[0.8125rem] font-semibold transition-colors flex items-center whitespace-nowrap", activeTab === tab.id ? "bg-[rgba(245,158,11,0.12)] text-[#FCD34D]" : "text-[#5A6A85] hover:text-[#94A3B8]")}>
            {tab.label}
            <span className={clsx("ml-[5px] px-[6px] py-[1px] rounded-full text-[0.65rem] font-bold", activeTab === tab.id ? "bg-[rgba(245,158,11,0.2)] text-[#F59E0B]" : "bg-[#181D2A] text-[#5A6A85]")}>{counts[tab.id]}</span>
          </button>
        ))}
      </div>

      <div className="bg-[#181D2A] border border-[#1F2A40] rounded-b-xl rounded-tr-xl overflow-hidden mt-[-10px]">
        <div className="bg-[#131720] border-b border-[#1F2A40] p-3 px-4 flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] h-[34px] bg-[#0F1117] border border-[#1F2A40] rounded-lg px-3 focus-within:border-[#F59E0B] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px] text-[#5A6A85]"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" /></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('techInventory.searchPlaceholder')} className="flex-1 min-w-0 bg-transparent border-none outline-none text-[#E2E8F0] text-[0.8125rem]" />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-[34px] bg-[#0F1117] border border-[#1F2A40] text-[#94A3B8] rounded-lg text-[0.8rem] px-2 outline-none focus:border-[#F59E0B]">
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
              <tr className="bg-[#1A2235] border-b border-[#1F2A40]">
                {['Part ID', t('techInventory.partName'), t('techInventory.category'), t('techInventory.stockLevel'), t('common.status'), t('techInventory.actions')].map(h => (
                  <th key={h} className="p-4 text-[0.75rem] font-bold text-[#5A6A85] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2A40]">
              {filteredParts.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-[#5A6A85]">{t('techInventory.noPartsFound')}</td></tr> : filteredParts.map(p => (
                <tr key={p.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="p-4 text-[13px] font-medium text-[#E2E8F0] whitespace-nowrap">{p.id}</td>
                  <td className="p-4 text-[13px] text-[#94A3B8] font-semibold">{p.name}</td>
                  <td className="p-4 text-[13px] text-[#94A3B8]">{p.category}</td>
                  <td className={clsx("p-4 text-[13.5px] font-bold", p.stock === 0 ? "text-[#F87171]" : p.stock <= p.min ? "text-[#FCD34D]" : "text-[#E2E8F0]")}>{p.stock}</td>
                  <td className="p-4"><StockBadge status={p.status} /></td>
                  <td className="p-4">
                    <button onClick={() => { setSelectedPart(p); setShowReqModal(true) }} className="px-2.5 py-1 text-[11px] font-bold bg-transparent border border-[#1F2A40] text-[#94A3B8] rounded-md hover:bg-[#1A2235] hover:text-[#E2E8F0] transition-colors">{t('techInventory.requestPartBtn')}</button>
                  </td>
                </tr>
              ))}
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
            <ModalPrimaryBtn type="submit" form="request-form" color="#F59E0B">
              {t('techInventory.submitRequest')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="request-form" onSubmit={handleRequestSubmit} className="flex flex-col gap-[14px] mt-1">
          <div>
            <label className={labelCls}>{t('techInventory.part')}</label>
            <div className="w-full bg-[#131823] border border-[#1F2A40] text-[#94A3B8] px-3 py-2.5 rounded-lg text-[0.875rem] font-semibold">{selectedPart?.name}</div>
          </div>
          <SelectField label={t('techInventory.relatedWO')} name="wo" required defaultValue="" placeholder={t('techInventory.selectWO')} options={mockWOs} />
          <InputField type="number" label={t('techInventory.quantityNeeded')} name="qty" min="1" defaultValue="1" required />
          <InputField type="textarea" label={t('techInventory.notes')} name="notes" placeholder={t('techInventory.notesPlaceholder')} required />
        </form>
      </Modal>
    </div>
  )
}

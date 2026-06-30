import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import clsx from 'clsx'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'

const initialOrders = [
  { id: 'PO-9101', supplier: 'MedTech Supply Co.', item: 'Suction Catheters', qty: 100, date: '2026-05-26', status: 'pending' },
  { id: 'PO-9102', supplier: 'Global Medical Parts', item: 'O2 Sensors', qty: 20, date: '2026-05-28', status: 'ordered' },
  { id: 'PO-9103', supplier: 'Apex Healthcare', item: 'Ventilator Circuit Set', qty: 50, date: '2026-06-01', status: 'delivered' }
]

function OrderStatusBadge({ status }) {
  const map = {
    'pending': 'bg-[rgba(100,116,139,0.12)] text-[#94A3B8]',
    'ordered': 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]',
    'delivered': 'bg-[rgba(34,197,94,0.12)] text-[#4ADE80]'
  }
  const labelMap = {
    'pending': 'Pending Response',
    'ordered': 'Ordered',
    'delivered': 'Delivered'
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold whitespace-nowrap ${map[status] || ''}`}>{labelMap[status]}</span>
}

const inputCls = "w-full bg-[#1A2235] border border-[#1F2A40] text-[#E2E8F0] px-3 py-2.5 rounded-lg text-[0.875rem] outline-none focus:border-[#8B5CF6] transition-colors"
const labelCls = "block text-[12px] text-[#94A3B8] font-semibold mb-1.5"

export default function StoreOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState(initialOrders)
  const [activeTab, setActiveTab] = useState('active')
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [outcome, setOutcome] = useState(null)
  
  const { showToast } = useToastStore()

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (activeTab === 'active') return o.status === 'pending' || o.status === 'ordered'
      if (activeTab === 'received') return o.status === 'delivered'
      return false
    })
  }, [orders, activeTab])

  const activeCount = orders.filter(o => o.status === 'pending' || o.status === 'ordered').length

  const handleReceive = (id) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'delivered' } : o))
    showToast(`✓ ${id} received. Inventory stock incremented.`, TOAST_COLORS.store)
  }

  const handleLogResponse = (e) => {
    e.preventDefault()
    if (!outcome) {
      alert("Please select a response outcome.")
      return
    }

    if (outcome === 'exists') {
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'ordered' } : o))
      showToast('📧 Reply received! Status updated to Ordered.', TOAST_COLORS.store)
    } else {
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'rejected' } : o))
      showToast('❌ Item unavailable. Order cancelled.', TOAST_COLORS.error)
    }

    setShowResponseModal(false)
    setOutcome(null)
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">Purchase Orders</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">Track parts ordered from suppliers and update inventory upon receipt.</p>
        </div>
        <button 
          onClick={() => navigate(ROUTES.STORE_CREATE_ORDER)} 
          className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg text-[0.8125rem] font-bold transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          New Order
        </button>
      </div>

      <div className="bg-[#131720] border border-[#1F2A40] rounded-xl p-1 mb-2 inline-flex gap-0.5 overflow-x-auto w-full sm:w-auto">
        <button 
          onClick={() => setActiveTab('active')} 
          className={clsx(
            "px-4 py-2 rounded-[8px] text-[0.8125rem] font-semibold transition-colors flex items-center whitespace-nowrap", 
            activeTab === 'active' ? "bg-[#181D2A] text-[#8B5CF6]" : "bg-transparent text-[#5A6A85] hover:text-[#94A3B8]"
          )}
        >
          Active Orders
          <span className={clsx(
            "ml-2 px-1.5 py-0.5 rounded-full text-[0.65rem] font-bold", 
            activeTab === 'active' ? "bg-[rgba(139,92,246,0.12)] text-[#8B5CF6]" : "bg-[#1A2235] text-[#5A6A85]"
          )}>
            {activeCount}
          </span>
        </button>
        <button 
          onClick={() => setActiveTab('received')} 
          className={clsx(
            "px-4 py-2 rounded-[8px] text-[0.8125rem] font-semibold transition-colors flex items-center whitespace-nowrap", 
            activeTab === 'received' ? "bg-[#181D2A] text-[#8B5CF6]" : "bg-transparent text-[#5A6A85] hover:text-[#94A3B8]"
          )}
        >
          Received
        </button>
      </div>

      <div className="bg-[#181D2A] border border-[#1F2A40] rounded-xl overflow-hidden -mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#1A2235] border-b border-[#1F2A40]">
                {['PO #', 'Supplier', 'Items', 'Expected Delivery', 'Status', 'Actions'].map(h => (
                  <th key={h} className="p-4 text-[0.75rem] font-bold text-[#5A6A85] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2A40]">
              {filteredOrders.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-[#5A6A85]">No orders found.</td></tr> : filteredOrders.map(o => (
                <tr key={o.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="p-4 text-[13px] font-medium text-[#E2E8F0] whitespace-nowrap">{o.id}</td>
                  <td className="p-4 text-[13px] text-[#94A3B8] font-semibold">{o.supplier}</td>
                  <td className="p-4 text-[13px] text-[#E2E8F0] font-semibold">{o.item} ({o.qty})</td>
                  <td className="p-4 text-[13px] text-[#94A3B8] whitespace-nowrap">{o.date}</td>
                  <td className="p-4"><OrderStatusBadge status={o.status} /></td>
                  <td className="p-4">
                    {o.status === 'pending' && (
                      <button 
                        onClick={() => { setSelectedOrder(o); setOutcome(null); setShowResponseModal(true) }} 
                        className="px-3 py-1.5 bg-transparent border border-[rgba(139,92,246,0.35)] rounded-lg text-[#C4B5FD] text-[12px] font-bold hover:bg-[rgba(139,92,246,0.1)] transition-colors flex items-center gap-1.5"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                        Response
                      </button>
                    )}
                    {o.status === 'ordered' && (
                      <button 
                        onClick={() => handleReceive(o.id)} 
                        className="px-3 py-1.5 bg-[rgba(139,92,246,0.12)] border border-[rgba(139,92,246,0.25)] rounded-lg text-[#A78BFA] text-[12px] font-bold hover:bg-[rgba(139,92,246,0.2)] transition-colors"
                      >
                        Mark Received
                      </button>
                    )}
                    {o.status === 'delivered' && (
                      <span className="text-[#5A6A85] pl-4">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showResponseModal && !!selectedOrder}
        onClose={() => setShowResponseModal(false)}
        title="Log Supplier Response Email"
        maxWidth="500px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowResponseModal(false)} />
            <ModalPrimaryBtn type="submit" form="log-response-form" color="#8B5CF6">
              Save Log
            </ModalPrimaryBtn>
          </>
        }
      >
        <div className="-mx-[22px] -mt-[22px] mb-4 px-[22px] py-3 bg-[rgba(139,92,246,0.07)] border-b border-[#8B5CF6]/20 text-[#5A6A85] text-xs font-semibold">
          Order: <span className="text-[#94A3B8]">{selectedOrder?.id}</span> • Supplier: <span className="text-[#94A3B8]">{selectedOrder?.supplier}</span>
        </div>

        <form id="log-response-form" onSubmit={handleLogResponse} className="flex flex-col gap-[14px]">
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Sender Name" placeholder="e.g. John Doe" required />
            <InputField type="email" label="Sender Email" placeholder="e.g. rep@supplier.com" required />
            <InputField type="datetime-local" label="Date/Time" required />
            <InputField label="Subject Line" placeholder="Re: PO-9101..." required />
          </div>

          <div>
            <label className={labelCls}>Response Outcome</label>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setOutcome('exists')}
                className={clsx("flex-1 px-4 py-2.5 rounded-lg border text-sm font-bold transition-colors", outcome === 'exists' ? "bg-[rgba(74,222,128,0.12)] border-[#4ADE80] text-[#4ADE80]" : "bg-transparent border-[#1F2A40] text-[#94A3B8] hover:border-[#4ADE80]")}
              >
                ✓ Exists
              </button>
              <button 
                type="button" 
                onClick={() => setOutcome('not_exists')}
                className={clsx("flex-1 px-4 py-2.5 rounded-lg border text-sm font-bold transition-colors", outcome === 'not_exists' ? "bg-[rgba(248,113,113,0.12)] border-[#F87171] text-[#F87171]" : "bg-transparent border-[#1F2A40] text-[#94A3B8] hover:border-[#F87171]")}
              >
                ✕ Not Exists
              </button>
            </div>
          </div>

          <InputField type="textarea" label="Email Content / Notes" placeholder="Paste email body or notes here..." required />
        </form>
      </Modal>
    </div>
  )
}

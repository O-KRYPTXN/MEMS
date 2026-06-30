import { useState } from 'react'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../../components/ui/EmptyState'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'

const initialInventory = [
  { id: 'PART-1001', name: 'O2 Sensor – Nellcor', qty: 12, min: 10 },
  { id: 'PART-1002', name: 'ECG Patient Cable 5-Lead', qty: 3, min: 5 },
  { id: 'PART-1003', name: 'Defibrillator Pads (Adult)', qty: 0, min: 10 },
  { id: 'PART-1004', name: 'Ventilator Circuit Set', qty: 8, min: 15 },
  { id: 'PART-1005', name: 'NIBP Cuff – Adult', qty: 24, min: 10 }
]

const initialRequests = [
  { id: 'REQ-1092', dept: 'ICU', itemName: 'O2 Sensor – Nellcor', qty: 2, date: 'Today, 08:30 AM', status: 'Pending' },
  { id: 'REQ-1093', dept: 'ER', itemName: 'Defibrillator Pads (Adult)', qty: 5, date: 'Today, 09:15 AM', status: 'Pending' },
  { id: 'REQ-1094', dept: 'Surgery', itemName: 'ECG Patient Cable 5-Lead', qty: 1, date: 'Yesterday, 14:20 PM', status: 'Pending' }
]

export default function StoreDashboard() {
  const [inventory] = useState(initialInventory)
  const [requests, setRequests] = useState(initialRequests)
  const [showFulfillModal, setShowFulfillModal] = useState(false)
  const [selectedReq, setSelectedReq] = useState(null)
  
  const { showToast } = useToastStore()

  const totalParts = inventory.length
  const stockAlerts = inventory.filter(i => i.qty <= i.min)
  const pendingCount = requests.length
  const fulfillmentRate = "94%"

  const handleFulfill = (e) => {
    e.preventDefault()
    setRequests(prev => prev.filter(r => r.id !== selectedReq.id))
    setShowFulfillModal(false)
    showToast('✓ Request fulfilled and inventory deducted.', TOAST_COLORS.store)
  }

  const kpis = [
    { label: 'Total Parts in Stock', value: totalParts, bg: 'bg-[rgba(139,92,246,0.15)] text-[#A78BFA]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/> },
    { label: 'Low Stock Alerts', value: stockAlerts.length, bg: 'bg-[rgba(245,158,11,0.15)] text-[#FCD34D]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2.25m0 2.625h.01M12 4.5l-9 15h18l-9-15z"/> },
    { label: 'Pending Requests', value: pendingCount, bg: 'bg-[rgba(59,130,246,0.15)] text-[#60A5FA]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/> },
    { label: 'Fulfillment Rate', value: fulfillmentRate, bg: 'bg-[rgba(34,197,94,0.15)] text-[#4ADE80]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/> }
  ]

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">Store Dashboard</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">Overview of inventory alerts, pending orders, and recent fulfillments.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        <div className="bg-[#181D2A] border border-[#1F2A40] rounded-xl flex flex-col">
          <div className="p-4 border-b border-[#1F2A40]"><h2 className="text-sm font-bold text-[#E2E8F0]">Pending Department Requests</h2></div>
          <div className="p-4 flex flex-col gap-3">
            {requests.length === 0 ? (
              <EmptyState message="No pending requests" />
            ) : (
              requests.map(r => (
                <div key={r.id} className="bg-[#131720] border border-[#1F2A40] p-4 rounded-lg flex justify-between items-center gap-4">
                  <div className="min-w-0">
                    <span className="text-[0.7rem] font-bold uppercase tracking-wide bg-[#1A2235] px-2 py-0.5 rounded text-[#94A3B8] inline-block mb-1">{r.dept}</span>
                    <div className="text-xs text-[#5A6A85]">{r.id} — {r.date}</div>
                    <div className="text-sm font-bold text-[#E2E8F0] mt-1 truncate">{r.qty}x {r.itemName}</div>
                  </div>
                  <button onClick={() => { setSelectedReq(r); setShowFulfillModal(true) }} className="bg-[rgba(139,92,246,0.12)] border border-[rgba(139,92,246,0.25)] text-[#D8B4FE] hover:bg-[rgba(139,92,246,0.2)] px-4 py-1.5 rounded-md text-[0.8rem] font-bold transition-colors shrink-0">
                    Fulfill
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#181D2A] border border-[#1F2A40] rounded-xl flex flex-col">
          <div className="p-4 border-b border-[#1F2A40]"><h2 className="text-sm font-bold text-[#E2E8F0]">Critical Stock Alerts</h2></div>
          <div className="p-4 flex flex-col gap-3">
            {stockAlerts.length === 0 ? (
              <div className="text-center py-6 text-[#5A6A85] text-sm">No stock alerts</div>
            ) : (
              stockAlerts.map(i => (
                <div key={i.id} className="bg-[#131720] border border-[#1F2A40] p-3.5 rounded-lg flex justify-between items-center gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#E2E8F0] truncate">{i.name}</div>
                    <div className="text-xs text-[#5A6A85] mt-0.5">{i.id} • Min: {i.min}</div>
                  </div>
                  <div className={clsx("px-2.5 py-1 rounded-md text-xs font-bold shrink-0 whitespace-nowrap", i.qty === 0 ? "bg-[rgba(239,68,68,0.12)] text-[#F87171]" : "bg-[rgba(245,158,11,0.12)] text-[#FCD34D]")}>
                    Qty: {i.qty}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showFulfillModal && !!selectedReq}
        onClose={() => setShowFulfillModal(false)}
        title={`Fulfill Request: ${selectedReq?.id}`}
        maxWidth="460px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowFulfillModal(false)} />
            <ModalPrimaryBtn onClick={handleFulfill} color="#8B5CF6">
              Confirm Fulfillment
            </ModalPrimaryBtn>
          </>
        }
      >
        <div className="bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.2)] text-[#D8B4FE] p-4 rounded-lg text-sm leading-relaxed">
          You are about to fulfill <strong>{selectedReq?.qty}x {selectedReq?.itemName}</strong> for the <strong>{selectedReq?.dept}</strong> department. This will deduct from current inventory.
        </div>
        <div>
          <label className="block text-[12px] text-[#94A3B8] font-semibold mb-1.5">Fulfillment Notes</label>
          <textarea 
            className="w-full bg-[#1A2235] border border-[#1F2A40] text-[#E2E8F0] px-3 py-2.5 rounded-lg text-[0.875rem] outline-none focus:border-[#8B5CF6] transition-colors min-h-[80px] resize-y" 
            placeholder="Optional fulfillment notes..."
          ></textarea>
        </div>
      </Modal>
    </div>
  )
}

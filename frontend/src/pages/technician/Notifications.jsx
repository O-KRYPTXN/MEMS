import { useState } from 'react'
import clsx from 'clsx'

const initialNotifications = [
  { id: 'REQ-1092', itemName: 'O2 Sensor – Nellcor', qty: 2, wo: 'WO-2034', date: '2026-06-27', acknowledged: false },
  { id: 'REQ-1090', itemName: 'ECG Patient Cable 5-Lead', qty: 1, wo: 'WO-2039', date: '2026-06-26', acknowledged: false },
  { id: 'REQ-1088', itemName: 'Defibrillator Pads (Adult)', qty: 5, wo: 'WO-2045', date: '2026-06-25', acknowledged: false }
]

export default function TechnicianNotifications() {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [toast, setToast] = useState({ show: false, msg: '', color: '#4ADE80' })

  const unreadNotifications = notifications.filter(n => !n.acknowledged)

  const showToast = (msg, color) => {
    setToast({ show: true, msg, color })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
  }

  const handleAcknowledge = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, acknowledged: true } : n))
    showToast('✓ Marked as read', '#4ADE80')
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">Arrivals & Updates</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">Important messages about your requested devices and spare parts.</p>
      </div>

      <div className="flex flex-col gap-4">
        {unreadNotifications.length === 0 ? (
          <div className="text-center py-12 text-[#5A6A85] bg-[#181D2A] rounded-xl border border-[#1F2A40]">
            You have no new arrivals or notifications.
          </div>
        ) : (
          unreadNotifications.map(n => (
            <div key={n.id} className="bg-[#181D2A] border border-[#1F2A40] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 hover:border-[rgba(34,197,94,0.3)] transition-colors">
              <div className="w-12 h-12 rounded-full bg-[rgba(34,197,94,0.12)] text-[#4ADE80] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-[1.05rem] font-bold text-[#E2E8F0] mb-1">Item Arrived: {n.itemName}</h3>
                <p className="text-[0.85rem] text-[#94A3B8] leading-relaxed">
                  Your request ({n.id}) for <strong className="text-[#E2E8F0]">{n.qty}x {n.itemName}</strong> has been fulfilled by the storekeeper and is now available for pickup.
                </p>
                <span className="text-xs text-[#A78BFA] block mt-1.5 mb-3 font-semibold">Related Work Order: {n.wo}</span>
                <div className="text-xs text-[#5A6A85] font-medium tracking-wide uppercase">Date Requested: {n.date}</div>
              </div>

              <button 
                onClick={() => handleAcknowledge(n.id)} 
                className="bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.25)] text-[#4ADE80] px-4 py-2 rounded-lg text-[0.8rem] font-bold hover:bg-[rgba(34,197,94,0.2)] transition-colors shrink-0 w-full sm:w-auto"
              >
                Acknowledge
              </button>
            </div>
          ))
        )}
      </div>

      <div className={clsx("fixed bottom-7 right-7 z-[2000] text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl transition-transform duration-300", toast.show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none")} style={{ backgroundColor: toast.color }}>
        {toast.msg}
      </div>
    </div>
  )
}

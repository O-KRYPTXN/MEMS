import { useState, useMemo, useEffect } from 'react'
import clsx from 'clsx'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'

const initialRequests = [
  { id: 'REQ-1092', requester: 'Ahmed (Tech)', dept: 'Maintenance', itemName: 'O2 Sensor – Nellcor', qty: 2, date: '2026-06-28', status: 'Pending' },
  { id: 'REQ-1093', requester: 'Dr. Sarah', dept: 'ICU', itemName: 'Defibrillator Pads', qty: 5, date: '2026-06-28', status: 'Pending' },
  { id: 'REQ-1090', requester: 'John (Tech)', dept: 'Maintenance', itemName: 'ECG Patient Cable', qty: 1, date: '2026-06-27', status: 'Approved' },
  { id: 'REQ-1088', requester: 'Dr. Ali', dept: 'ER', itemName: 'Ventilator Circuit Set', qty: 3, date: '2026-06-25', status: 'Fulfilled' },
  { id: 'REQ-1085', requester: 'Mona (Nurse)', dept: 'Surgery', itemName: 'NIBP Cuff', qty: 2, date: '2026-06-20', status: 'Rejected', notes: 'Out of stock, please wait for PO-9081' }
]

function StatusBadge({ status }) {
  const map = {
    'Pending': 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]',
    'Approved': 'bg-[rgba(59,130,246,0.12)] text-[#60A5FA]',
    'Fulfilled': 'bg-[rgba(34,197,94,0.12)] text-[#4ADE80]',
    'Rejected': 'bg-[rgba(239,68,68,0.12)] text-[#F87171]'
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold whitespace-nowrap ${map[status] || ''}`}>{status}</span>
}

export default function StoreRequests() {
  const [requests, setRequests] = useState(initialRequests)
  const [activeTab, setActiveTab] = useState('Pending')
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  const [showModal, setShowModal] = useState(false)
  const [selectedReq, setSelectedReq] = useState(null)
  const [actionType, setActionType] = useState('') // 'review', 'fulfill'
  const [actionNotes, setActionNotes] = useState('')
  const [reviewDecision, setReviewDecision] = useState('Approve') // for review modal
  
  const { showToast } = useToastStore()

  const ROWS_PER_PAGE = 8

  const filteredReqs = useMemo(() => {
    const q = search.toLowerCase()
    return requests.filter(r => {
      const matchTab = activeTab === 'All' || r.status === activeTab
      const matchQ = !q || r.id.toLowerCase().includes(q) || r.itemName.toLowerCase().includes(q) || r.requester.toLowerCase().includes(q)
      const matchDept = !deptFilter || r.dept === deptFilter
      return matchTab && matchQ && matchDept
    })
  }, [requests, activeTab, search, deptFilter])

  useEffect(() => setCurrentPage(1), [activeTab, search, deptFilter])

  const totalPages = Math.ceil(filteredReqs.length / ROWS_PER_PAGE) || 1
  const paginatedReqs = filteredReqs.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)

  const handleAction = (e) => {
    e.preventDefault()
    if (!selectedReq) return

    let newStatus = selectedReq.status
    let toastMsg = ''

    if (actionType === 'review') {
      newStatus = reviewDecision === 'Approve' ? 'Approved' : 'Rejected'
      toastMsg = `✓ Request ${selectedReq.id} ${newStatus}`
    } else if (actionType === 'fulfill') {
      newStatus = 'Fulfilled'
      toastMsg = `✓ Request ${selectedReq.id} Fulfilled`
    }

    setRequests(prev => prev.map(r => r.id === selectedReq.id ? { ...r, status: newStatus, notes: actionNotes } : r))
    setShowModal(false)
    setActionNotes('')
    setReviewDecision('Approve')
    showToast(toastMsg, actionType === 'review' && reviewDecision === 'Reject' ? TOAST_COLORS.error : TOAST_COLORS.store)
  }

  const tabs = ['All', 'Pending', 'Approved', 'Fulfilled', 'Rejected']

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">Part Requests</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">Review, approve, and fulfill spare part requests from technicians and departments.</p>
      </div>

      <div className="bg-[#131720] border border-[#1F2A40] rounded-xl p-1 inline-flex gap-0.5 overflow-x-auto w-full sm:w-auto self-start">
        {tabs.map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={clsx(
              "px-4 py-2 rounded-[8px] text-[0.8125rem] font-semibold transition-colors flex items-center whitespace-nowrap", 
              activeTab === tab ? "bg-[#181D2A] text-[#8B5CF6]" : "bg-transparent text-[#5A6A85] hover:text-[#94A3B8]"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-[#181D2A] border border-[#1F2A40] rounded-xl overflow-hidden -mt-2">
        <div className="bg-[#131720] border-b border-[#1F2A40] p-3 px-4 flex flex-wrap gap-3 items-center">
          <div className="flex-1 max-w-sm relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px] text-[#5A6A85] absolute left-3 top-1/2 -translate-y-1/2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" /></svg>
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search ID, part name, requester..." 
              className="w-full bg-[#0F1117] border border-[#1F2A40] text-[#E2E8F0] pl-9 pr-3 py-1.5 rounded-lg text-[0.8125rem] outline-none focus:border-[#8B5CF6] transition-colors h-[34px]"
            />
          </div>
          <select 
            value={deptFilter} 
            onChange={e => setDeptFilter(e.target.value)} 
            className="bg-[#0F1117] border border-[#1F2A40] text-[#94A3B8] px-3 py-1.5 rounded-lg text-[0.8125rem] outline-none focus:border-[#8B5CF6] transition-colors h-[34px]"
          >
            <option value="">All Departments</option>
            <option value="ICU">ICU</option>
            <option value="ER">ER</option>
            <option value="Surgery">Surgery</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#1A2235] border-b border-[#1F2A40]">
                {['Req ID', 'Requester / Dept', 'Item Requested', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="p-4 text-[0.75rem] font-bold text-[#5A6A85] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2A40]">
              {paginatedReqs.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-[#5A6A85]">No requests found.</td></tr> : paginatedReqs.map(r => (
                <tr key={r.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="p-4 text-[13px] font-medium text-[#E2E8F0] whitespace-nowrap">{r.id}</td>
                  <td className="p-4 text-[13px]">
                    <div className="font-semibold text-[#E2E8F0]">{r.requester}</div>
                    <div className="text-[#94A3B8] mt-0.5 text-xs">{r.dept}</div>
                  </td>
                  <td className="p-4 text-[13px] text-[#E2E8F0] font-semibold">{r.qty}x {r.itemName}</td>
                  <td className="p-4 text-[13px] text-[#94A3B8] whitespace-nowrap">{r.date}</td>
                  <td className="p-4"><StatusBadge status={r.status} /></td>
                  <td className="p-4">
                    {r.status === 'Pending' && (
                      <button 
                        onClick={() => { setSelectedReq(r); setActionType('review'); setActionNotes(''); setShowModal(true) }} 
                        className="px-3 py-1.5 bg-transparent border border-[#1F2A40] rounded-lg text-[#D8B4FE] text-[12px] font-bold hover:bg-[#1A2235] hover:text-white transition-colors"
                      >
                        Review
                      </button>
                    )}
                    {r.status === 'Approved' && (
                      <button 
                        onClick={() => { setSelectedReq(r); setActionType('fulfill'); setActionNotes(''); setShowModal(true) }} 
                        className="px-3 py-1.5 bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.25)] rounded-lg text-[#4ADE80] text-[12px] font-bold hover:bg-[rgba(34,197,94,0.2)] transition-colors"
                      >
                        Fulfill
                      </button>
                    )}
                    {(r.status === 'Fulfilled' || r.status === 'Rejected') && (
                      r.notes ? <span className="text-xs text-[#94A3B8] italic" title={r.notes}>View Notes</span> : <span className="text-[#5A6A85] pl-4">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-[#1F2A40] flex items-center justify-between bg-[#131720]">
            <span className="text-xs text-[#5A6A85] font-medium">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1.5 rounded-md bg-[#1A2235] text-[#94A3B8] text-xs font-bold disabled:opacity-50 hover:bg-[#1F2A40] transition-colors">Prev</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1.5 rounded-md bg-[#1A2235] text-[#94A3B8] text-xs font-bold disabled:opacity-50 hover:bg-[#1F2A40] transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal && !!selectedReq}
        onClose={() => setShowModal(false)}
        title={actionType === 'review' ? 'Review Request' : 'Fulfill Request'}
        maxWidth="480px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowModal(false)} />
            <ModalPrimaryBtn 
              type="submit" 
              form="action-form" 
              color={actionType === 'review' && reviewDecision === 'Reject' ? '#EF4444' : '#10B981'}
            >
              {actionType === 'review' ? 'Submit Decision' : 'Confirm Fulfillment'}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="action-form" onSubmit={handleAction} className="flex flex-col gap-5">
          <div className="bg-[#131720] p-4 rounded-lg border border-[#1F2A40] flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="text-[#E2E8F0] font-bold">{selectedReq?.id}</span>
              <span className="text-[#94A3B8] text-sm">{selectedReq?.date}</span>
            </div>
            <div className="text-[#D8B4FE] text-sm font-semibold">{selectedReq?.qty}x {selectedReq?.itemName}</div>
            <div className="text-[#5A6A85] text-xs">Requested by: <span className="text-[#E2E8F0]">{selectedReq?.requester}</span> ({selectedReq?.dept})</div>
          </div>

          {actionType === 'review' && (
            <>
              <div>
                <label className="block text-[12px] text-[#94A3B8] font-semibold mb-2">Decision</label>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setReviewDecision('Approve')}
                    className={clsx("flex-1 px-4 py-2.5 rounded-lg border text-sm font-bold transition-colors", reviewDecision === 'Approve' ? "bg-[rgba(34,197,94,0.12)] border-[#4ADE80] text-[#4ADE80]" : "bg-transparent border-[#1F2A40] text-[#94A3B8] hover:border-[#4ADE80]")}
                  >
                    Approve
                  </button>
                  <button 
                    type="button"
                    onClick={() => setReviewDecision('Reject')}
                    className={clsx("flex-1 px-4 py-2.5 rounded-lg border text-sm font-bold transition-colors", reviewDecision === 'Reject' ? "bg-[rgba(239,68,68,0.12)] border-[#F87171] text-[#F87171]" : "bg-transparent border-[#1F2A40] text-[#94A3B8] hover:border-[#F87171]")}
                  >
                    Reject
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[12px] text-[#94A3B8] font-semibold mb-1.5">Notes (Optional)</label>
                <textarea 
                  value={actionNotes}
                  onChange={e => setActionNotes(e.target.value)}
                  className="w-full bg-[#1A2235] border border-[#1F2A40] text-[#E2E8F0] px-3 py-2.5 rounded-lg text-[0.875rem] outline-none focus:border-[#8B5CF6] transition-colors min-h-[80px] resize-y" 
                  placeholder="Reason for rejection or approval notes..."
                />
              </div>
            </>
          )}

          {actionType === 'fulfill' && (
            <>
              <div className="bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.2)] rounded-lg p-3.5 flex items-center gap-3 text-sm text-[#D8B4FE]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                <span>Marking this as fulfilled will notify the requester that the item is ready for pickup and deduct the quantity from inventory.</span>
              </div>
              <div>
                <label className="block text-[12px] text-[#94A3B8] font-semibold mb-1.5">Collection Notes (Optional)</label>
                <textarea 
                  value={actionNotes}
                  onChange={e => setActionNotes(e.target.value)}
                  className="w-full bg-[#1A2235] border border-[#1F2A40] text-[#E2E8F0] px-3 py-2.5 rounded-lg text-[0.875rem] outline-none focus:border-[#8B5CF6] transition-colors min-h-[80px] resize-y" 
                  placeholder="e.g. Please sign the collection log upon arrival..."
                />
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  )
}

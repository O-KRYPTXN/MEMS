import { useState, useMemo, useEffect } from 'react'
import clsx from 'clsx'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import EmptyState from '../../components/ui/EmptyState'
import Panel from '../../components/ui/Panel'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'

const initialRequests = [
  { id: 'REQ-1092', requester: 'Ahmed (Tech)', dept: 'Maintenance', itemName: 'O2 Sensor – Nellcor', qty: 2, date: '2026-06-28', status: 'Pending' },
  { id: 'REQ-1093', requester: 'Dr. Sarah', dept: 'ICU', itemName: 'Defibrillator Pads', qty: 5, date: '2026-06-28', status: 'Pending' },
  { id: 'REQ-1090', requester: 'John (Tech)', dept: 'Maintenance', itemName: 'ECG Patient Cable', qty: 1, date: '2026-06-27', status: 'Approved' },
  { id: 'REQ-1088', requester: 'Dr. Ali', dept: 'ER', itemName: 'Ventilator Circuit Set', qty: 3, date: '2026-06-25', status: 'Fulfilled' },
  { id: 'REQ-1085', requester: 'Mona (Nurse)', dept: 'Surgery', itemName: 'NIBP Cuff', qty: 2, date: '2026-06-20', status: 'Rejected', notes: 'Out of stock, please wait for PO-9081' }
]

function StatusBadge({ status }) {
  const { t } = useTranslation()
  const labelMap = {
    'Pending': t('storeRequests.statusPending', 'Pending'),
    'Approved': t('storeRequests.statusApproved', 'Approved'),
    'Fulfilled': t('storeRequests.statusFulfilled', 'Fulfilled'),
    'Rejected': t('storeRequests.statusRejected', 'Rejected')
  }
  const colorMap = {
    'Pending': 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]',
    'Approved': 'bg-[rgba(59,130,246,0.12)] text-[#60A5FA]',
    'Fulfilled': 'bg-[rgba(34,197,94,0.12)] text-[#4ADE80]',
    'Rejected': 'bg-[rgba(239,68,68,0.12)] text-[#F87171]'
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold whitespace-nowrap ${colorMap[status] || ''}`}>{labelMap[status] || status}</span>
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
  
  const { t } = useTranslation()
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
      toastMsg = t('storeRequests.toastReviewed', '✓ Request {{id}} {{status}}', { id: selectedReq.id, status: newStatus })
    } else if (actionType === 'fulfill') {
      newStatus = 'Fulfilled'
      toastMsg = t('storeRequests.toastFulfilled', '✓ Request {{id}} Fulfilled', { id: selectedReq.id })
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
        <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('storeRequests.pageTitle', 'Part Requests')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('storeRequests.pageSubtitle', 'Review, approve, and fulfill spare part requests from technicians and departments.')}</p>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1 inline-flex gap-0.5 overflow-x-auto w-full sm:w-auto self-start">
        {tabs.map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={clsx(
              "px-4 py-2 rounded-[8px] text-[0.8125rem] font-semibold transition-colors flex items-center whitespace-nowrap", 
              activeTab === tab ? "bg-[var(--bg-hover)] text-[#8B5CF6]" : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            {tab === 'All' ? t('storeRequests.tabAll', 'All') : t(`storeRequests.status${tab}`, tab)}
          </button>
        ))}
      </div>

      <Panel noPadding className="-mt-2">
        <div className="bg-[var(--bg-card)] border-b border-[var(--border)] p-3 px-4 flex flex-wrap gap-3 items-center">
          <div className="flex-1 max-w-sm relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px] text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" /></svg>
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder={t('storeRequests.searchPlaceholder', 'Search ID, part name, requester...')}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] pl-9 pr-3 py-1.5 rounded-lg text-[0.8125rem] outline-none focus:border-[#8B5CF6] transition-colors h-[34px]"
            />
          </div>
          <select 
            value={deptFilter} 
            onChange={e => setDeptFilter(e.target.value)} 
            className="bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-secondary)] px-3 py-1.5 rounded-lg text-[0.8125rem] outline-none focus:border-[#8B5CF6] transition-colors h-[34px]"
          >
            <option value="">{t('storeRequests.allDepts', 'All Departments')}</option>
            <option value="ICU">ICU</option>
            <option value="ER">ER</option>
            <option value="Surgery">Surgery</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[var(--bg-table-header)] border-b border-[var(--border)]">
                {[t('storeRequests.reqId', 'Req ID'), t('storeRequests.requesterDept', 'Requester / Dept'), t('storeRequests.itemRequested', 'Item Requested'), t('storeRequests.date', 'Date'), t('common.status', 'Status'), t('common.actions', 'Actions')].map(h => (
                  <th key={h} className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {paginatedReqs.length === 0 ? <tr><td colSpan={6} className="p-0"><EmptyState message={t('storeRequests.noRequestsFound', 'No requests found.')} /></td></tr> : paginatedReqs.map(r => (
                <tr key={r.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="p-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">{r.id}</td>
                  <td className="p-4 text-[13px]">
                    <div className="font-semibold text-[var(--text-primary)]">{r.requester}</div>
                    <div className="text-[var(--text-secondary)] mt-0.5 text-xs">{r.dept}</div>
                  </td>
                  <td className="p-4 text-[13px] text-[var(--text-primary)] font-semibold">{r.qty}x {r.itemName}</td>
                  <td className="p-4 text-[13px] text-[var(--text-muted)] whitespace-nowrap">{r.date}</td>
                  <td className="p-4"><StatusBadge status={r.status} /></td>
                  <td className="p-4">
                    {r.status === 'Pending' && (
                      <button 
                        onClick={() => { setSelectedReq(r); setActionType('review'); setActionNotes(''); setShowModal(true) }} 
                        className="px-3 py-1.5 bg-transparent border border-[var(--border)] rounded-lg text-[#D8B4FE] text-[12px] font-bold hover:bg-[var(--bg-hover)] hover:text-white transition-colors"
                      >
                        {t('storeRequests.reviewBtn', 'Review')}
                      </button>
                    )}
                    {r.status === 'Approved' && (
                      <button 
                        onClick={() => { setSelectedReq(r); setActionType('fulfill'); setActionNotes(''); setShowModal(true) }} 
                        className="px-3 py-1.5 bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.25)] rounded-lg text-[#4ADE80] text-[12px] font-bold hover:bg-[rgba(34,197,94,0.2)] transition-colors"
                      >
                        {t('storeRequests.fulfillBtn', 'Fulfill')}
                      </button>
                    )}
                    {(r.status === 'Fulfilled' || r.status === 'Rejected') && (
                      r.notes ? <span className="text-xs text-[var(--text-secondary)] italic" title={r.notes}>{t('storeRequests.viewNotes', 'View Notes')}</span> : <span className="text-[var(--text-muted)] pl-4">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg-card)]">
            <span className="text-xs text-[var(--text-muted)] font-medium">{t('storeRequests.pageCount', 'Page {{current}} of {{total}}', { current: currentPage, total: totalPages })}</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-3 py-1.5 rounded-md bg-[var(--bg-input)] text-[var(--text-secondary)] text-xs font-bold disabled:opacity-50 hover:bg-[var(--bg-hover)] transition-colors">{t('common.prev', 'Prev')}</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-3 py-1.5 rounded-md bg-[var(--bg-input)] text-[var(--text-secondary)] text-xs font-bold disabled:opacity-50 hover:bg-[var(--bg-hover)] transition-colors">{t('common.next', 'Next')}</button>
            </div>
          </div>
        )}
      </Panel>

      <Modal
        isOpen={showModal && !!selectedReq}
        onClose={() => setShowModal(false)}
        title={actionType === 'review' ? t('storeRequests.reviewReqTitle', 'Review Request') : t('storeRequests.fulfillReqTitle', 'Fulfill Request')}
        maxWidth="480px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn 
              type="submit" 
              form="action-form" 
              color={actionType === 'review' && reviewDecision === 'Reject' ? '#EF4444' : '#10B981'}
            >
              {actionType === 'review' ? t('storeRequests.submitDecision', 'Submit Decision') : t('storeRequests.confirmFulfillment', 'Confirm Fulfillment')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="action-form" onSubmit={handleAction} className="flex flex-col gap-5">
          <div className="bg-[var(--bg-input)] p-4 rounded-lg border border-[var(--border)] flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="text-[var(--text-primary)] font-bold">{selectedReq?.id}</span>
              <span className="text-[var(--text-secondary)] text-sm">{selectedReq?.date}</span>
            </div>
            <div className="text-[#D8B4FE] text-sm font-semibold">{selectedReq?.qty}x {selectedReq?.itemName}</div>
            <div className="text-[var(--text-muted)] text-xs">{t('storeRequests.requestedBy', 'Requested by')}: <span className="text-[var(--text-primary)]">{selectedReq?.requester}</span> ({selectedReq?.dept})</div>
          </div>

          {actionType === 'review' && (
            <>
              <div>
                <label className="block text-[12px] text-[var(--text-muted)] font-semibold mb-2">{t('storeRequests.decision', 'Decision')}</label>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setReviewDecision('Approve')}
                    className={clsx("flex-1 px-4 py-2.5 rounded-lg border text-sm font-bold transition-colors", reviewDecision === 'Approve' ? "bg-[rgba(34,197,94,0.12)] border-[#4ADE80] text-[#4ADE80]" : "bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:border-[#4ADE80]")}
                  >
                    {t('common.approve')}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setReviewDecision('Reject')}
                    className={clsx("flex-1 px-4 py-2.5 rounded-lg border text-sm font-bold transition-colors", reviewDecision === 'Reject' ? "bg-[rgba(239,68,68,0.12)] border-[#F87171] text-[#F87171]" : "bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:border-[#F87171]")}
                  >
                    {t('common.reject')}
                  </button>
                </div>
              </div>
              <InputField 
                type="textarea"
                label={t('storeRequests.notesOptional', 'Notes (Optional)')}
                value={actionNotes}
                onChange={e => setActionNotes(e.target.value)}
                placeholder={t('storeRequests.notesPlaceholder', 'Reason for rejection or approval notes...')}
              />
            </>
          )}

          {actionType === 'fulfill' && (
            <>
              <div className="bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.2)] rounded-lg p-3.5 flex items-center gap-3 text-sm text-[#D8B4FE]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                <span>{t('storeRequests.fulfillDisclaimer', 'Marking this as fulfilled will notify the requester that the item is ready for pickup and deduct the quantity from inventory.')}</span>
              </div>
              <InputField 
                type="textarea"
                label={t('storeRequests.collectionNotes', 'Collection Notes (Optional)')}
                value={actionNotes}
                onChange={e => setActionNotes(e.target.value)}
                placeholder={t('storeRequests.collectionNotesPlaceholder', 'e.g. Please sign the collection log upon arrival...')}
              />
            </>
          )}
        </form>
      </Modal>
    </div>
  )
}

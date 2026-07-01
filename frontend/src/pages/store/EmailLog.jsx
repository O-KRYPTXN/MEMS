import { useState, useMemo } from 'react'
import clsx from 'clsx'
import Modal, { ModalCancelBtn } from '../../components/ui/Modal'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'

const initialLogs = [
  { 
    id: 'MSG-001', supplier: 'MedTech Supplies Inc.', po: 'PO-8472', date: '2026-06-28 14:30', subject: 'Re: Purchase Order PO-8472 - MEMS Facility', status: 'Replied',
    thread: [
      { from: 'Storekeeper', date: '2026-06-27 09:00', body: 'Hello MedTech Supplies,\nPlease process the following order:\nOrder ID: PO-8472\nItem: O2 Sensor – Nellcor\nQuantity: 10\nExpected Delivery: 2026-07-05\n\nPlease confirm receipt.' },
      { from: 'MedTech Supplies Inc.', date: '2026-06-28 14:30', body: 'Order received. We will ship the 10x O2 Sensors tomorrow. Estimated arrival is 2026-07-02.\n\nRegards,\nSales Team' }
    ]
  },
  { 
    id: 'MSG-002', supplier: 'Global Biomed', po: 'PO-9104', date: '2026-06-26 10:15', subject: 'Action Needed: PO-9104 Delay', status: 'Action Required',
    thread: [
      { from: 'Storekeeper', date: '2026-06-20 11:20', body: 'Please process order PO-9104 for 5x Defibrillator Pads.' },
      { from: 'Global Biomed', date: '2026-06-26 10:15', body: 'We are currently out of stock for the adult pads. Would you accept the pediatric ones as a substitute, or prefer to wait until next week?' }
    ]
  },
  { 
    id: 'MSG-003', supplier: 'Apex Healthcare', po: 'PO-3321', date: '2026-06-28 08:00', subject: 'New Purchase Order PO-3321 - MEMS Facility', status: 'Pending',
    thread: [
      { from: 'Storekeeper', date: '2026-06-28 08:00', body: 'Hello Apex Healthcare,\nPlease process the following order:\nOrder ID: PO-3321\nItem: Ventilator Circuit Set\nQuantity: 20\nExpected Delivery: 2026-07-10\n\nPlease confirm receipt.' }
    ]
  }
]

const StatusDot = ({ status }) => {
  const bg = status === 'Replied' ? 'bg-[#4ADE80]' : status === 'Pending' ? 'bg-[#FCD34D]' : 'bg-[#F87171]'
  return <div className={`w-[9px] h-[9px] rounded-full shrink-0 ${bg}`} title={status} />
}

export default function StoreEmailLog() {
  const [logs, setLogs] = useState(initialLogs)
  const [search, setSearch] = useState('')
  const [poFilter, setPoFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  
  const { t } = useTranslation()
  const { showToast } = useToastStore()

  const uniquePOs = useMemo(() => Array.from(new Set(logs.map(l => l.po))), [logs])

  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase()
    return logs.filter(l => {
      const matchQ = !q || l.supplier.toLowerCase().includes(q) || l.subject.toLowerCase().includes(q) || l.po.toLowerCase().includes(q)
      const matchPO = !poFilter || l.po === poFilter
      return matchQ && matchPO
    })
  }, [logs, search, poFilter])


  const handleDelete = (e, id) => {
    e.stopPropagation()
    setLogs(prev => prev.filter(l => l.id !== id))
    showToast(t('storeEmailLog.toastDeleted', '✓ Entry deleted.'), TOAST_COLORS.warning)
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">{t('storeEmailLog.pageTitle', 'Email Log')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">{t('storeEmailLog.pageSubtitle', 'Review email communications and supplier responses regarding purchase orders.')}</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-2">
        <div className="flex-1 max-w-sm relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px] text-[#5A6A85] absolute left-3 top-1/2 -translate-y-1/2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" /></svg>
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder={t('storeEmailLog.searchPlaceholder', 'Search supplier, subject, or PO...')}
            className="w-full bg-[#1A2235] border border-[#1F2A40] text-[#E2E8F0] pl-9 pr-3 py-2 rounded-lg text-[0.8125rem] outline-none focus:border-[#8B5CF6] transition-colors"
          />
        </div>
        <select 
          value={poFilter} 
          onChange={e => setPoFilter(e.target.value)} 
          className="bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8] px-3 py-2 rounded-lg text-[0.8125rem] outline-none focus:border-[#8B5CF6] transition-colors"
        >
          <option value="">{t('storeEmailLog.poAll', 'PO: All')}</option>
          {uniquePOs.map(po => <option key={po} value={po}>{po}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLogs.length === 0 ? (
          <div className="col-span-full text-center py-10 text-[#5A6A85]">{t('storeEmailLog.noCommunications', 'No communications found.')}</div>
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} className="bg-[#181D2A] border border-[#1F2A40] rounded-xl overflow-hidden flex flex-col shadow-sm">
              <div className="p-3.5 px-4 bg-[#131720] border-b border-[#1F2A40] flex items-center gap-2.5">
                <StatusDot status={log.status} />
                <span className="text-[0.85rem] font-semibold text-[#E2E8F0] truncate flex-1">{log.supplier}</span>
              </div>
              <div className="p-4 flex-1 flex flex-col gap-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="bg-[rgba(139,92,246,0.12)] border border-[rgba(139,92,246,0.25)] text-[#D8B4FE] rounded-md px-2 py-0.5 text-[0.7rem] font-bold tracking-wide">
                    {log.po}
                  </span>
                  <span className="text-xs text-[#5A6A85]">{log.date}</span>
                </div>
                <h3 className="text-sm font-bold text-[#E2E8F0] leading-snug">{log.subject}</h3>
                <p className="text-xs text-[#94A3B8] line-clamp-2 mt-1">{log.thread[log.thread.length - 1].body}</p>
              </div>
              <div className="p-3 px-4 bg-[#131720] border-t border-[#1F2A40] flex justify-between items-center">
                <button 
                  onClick={() => { setSelectedLog(log); setShowModal(true) }} 
                  className="text-xs font-semibold flex items-center gap-1.5 transition-colors text-[#D8B4FE] hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.036c4.952-.078 9 3.926 9 8.878 0 4.952-4.048 8.956-9 8.956-2.073 0-4.03-.703-5.602-1.936L3.75 20.25l1.936-3.352A8.956 8.956 0 013 11c0-4.952 4.048-8.956 9-8.964z" /></svg>
                  {t('storeEmailLog.viewThread', 'View Full Thread')}
                </button>
                <button 
                  onClick={(e) => handleDelete(e, log.id)} 
                  className="w-[26px] h-[26px] rounded flex items-center justify-center text-[#5A6A85] hover:text-[#F87171] hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                  title="Delete Log"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={showModal && !!selectedLog}
        onClose={() => setShowModal(false)}
        title={t('storeEmailLog.emailThreadTitle', 'Email Thread: {{po}}', { po: selectedLog?.po })}
        maxWidth="600px"
        footer={<ModalCancelBtn onClick={() => setShowModal(false)}>{t('common.close', 'Close')}</ModalCancelBtn>}
      >
        <div className="mb-2">
          <h4 className="font-bold text-lg text-white mb-1 leading-snug">{selectedLog?.subject}</h4>
          <p className="text-sm text-[#D8B4FE]">{t('storeEmailLog.with', 'With:')} {selectedLog?.supplier}</p>
        </div>
        {selectedLog?.thread.map((msg, i) => (
          <div key={i} className="bg-[#131720] border border-[#1F2A40] rounded-lg p-4 relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-[#E2E8F0] text-sm">{msg.from}</span>
              <span className="w-1 h-1 rounded-full bg-[#5A6A85]" />
              <span className="text-xs text-[#5A6A85]">{msg.date}</span>
            </div>
            <div className="text-sm text-[#94A3B8] whitespace-pre-wrap leading-relaxed">{msg.body}</div>
          </div>
        ))}
      </Modal>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'

const initialRejected = [
  { 
    id: 'PO-9044', supplier: 'MedTech Supply Co.', item: 'Suction Catheters', qty: 100, 
    orderedAt: '2026-05-20', rejectedAt: '2026-05-22', 
    status: 'Cancelled', reason: 'Item discontinued by manufacturer.',
    emailThread: [
      { from: 'MedTech Supply', date: '2026-05-22 09:15', body: 'We regret to inform you that this item is discontinued.' }
    ]
  },
  { 
    id: 'PO-9081', supplier: 'Global Medical Parts', item: 'O2 Sensors', qty: 20, 
    orderedAt: '2026-06-10', rejectedAt: '2026-06-12', 
    status: 'Pending Review', reason: 'Out of stock until August.',
    emailThread: [
      { from: 'Global Medical', date: '2026-06-12 11:30', body: 'Currently out of stock. Backorder available for August.' }
    ]
  },
  { 
    id: 'PO-9085', supplier: 'Apex Healthcare', item: 'Ventilator Circuit Set', qty: 50, 
    orderedAt: '2026-06-15', rejectedAt: '2026-06-15', 
    status: 'Resolved', reason: 'Duplicate order detected.',
    emailThread: []
  }
]

function StatusBadge({ status }) {
  const map = {
    'Cancelled': 'bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] text-[#F87171]',
    'Pending Review': 'bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.25)] text-[#FCD34D]',
    'Resolved': 'bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.25)] text-[#4ADE80]'
  }
  return <span className={`px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide whitespace-nowrap ${map[status] || ''}`}>{status}</span>
}

export default function StoreRejectedOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState(initialRejected)
  const [search, setSearch] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [emailFilter, setEmailFilter] = useState('')
  const [expandedEmails, setExpandedEmails] = useState({})
  
  const { showToast } = useToastStore()

  const uniqueSuppliers = useMemo(() => Array.from(new Set(orders.map(o => o.supplier))), [orders])

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase()
    return orders.filter(o => {
      const matchQ = !q || o.supplier.toLowerCase().includes(q) || o.item.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)
      const matchSup = !supplierFilter || o.supplier === supplierFilter
      const matchEmail = !emailFilter || 
        (emailFilter === 'has_email' ? o.emailThread.length > 0 : o.emailThread.length === 0)
      return matchQ && matchSup && matchEmail
    })
  }, [orders, search, supplierFilter, emailFilter])

  const handleDelete = (id) => {
    setOrders(prev => prev.filter(o => o.id !== id))
    showToast('✓ Rejected order removed from log.', TOAST_COLORS.store)
  }

  const toggleEmails = (id) => {
    setExpandedEmails(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const kpis = [
    { label: 'Total Rejected', value: orders.length, bg: 'bg-[rgba(239,68,68,0.15)] text-[#F87171]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { label: 'Pending Review', value: orders.filter(o => o.status === 'Pending Review').length, bg: 'bg-[rgba(245,158,11,0.15)] text-[#FCD34D]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { label: 'Cancelled', value: orders.filter(o => o.status === 'Cancelled').length, bg: 'bg-[rgba(100,116,139,0.15)] text-[#94A3B8]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /> },
    { label: 'Resolved', value: orders.filter(o => o.status === 'Resolved').length, bg: 'bg-[rgba(34,197,94,0.15)] text-[#4ADE80]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> }
  ]

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">Rejected & Cancelled Orders</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">Review purchase orders that were rejected or cancelled by suppliers.</p>
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

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 max-w-[280px] relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px] text-[#5A6A85] absolute left-3 top-1/2 -translate-y-1/2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" /></svg>
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search PO, item, supplier..." 
            className="w-full bg-[#1A2235] border border-[#1F2A40] text-[#E2E8F0] pl-9 pr-3 py-1.5 rounded-lg text-[0.8125rem] outline-none focus:border-[#8B5CF6] transition-colors h-[36px]"
          />
        </div>
        <select 
          value={supplierFilter} 
          onChange={e => setSupplierFilter(e.target.value)} 
          className="bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8] px-3 py-1.5 rounded-lg text-[0.8125rem] outline-none focus:border-[#8B5CF6] transition-colors h-[36px]"
        >
          <option value="">Supplier: All</option>
          {uniqueSuppliers.map(sup => <option key={sup} value={sup}>{sup}</option>)}
        </select>
        <select 
          value={emailFilter} 
          onChange={e => setEmailFilter(e.target.value)} 
          className="bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8] px-3 py-1.5 rounded-lg text-[0.8125rem] outline-none focus:border-[#8B5CF6] transition-colors h-[36px]"
        >
          <option value="">Emails: All</option>
          <option value="has_email">Has Logged Emails</option>
          <option value="no_email">No Logged Emails</option>
        </select>
      </div>

      <div className="flex flex-col gap-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-10 text-[#5A6A85] bg-[#181D2A] border border-[#1F2A40] rounded-xl">No rejected orders found.</div>
        ) : (
          filteredOrders.map(o => (
            <div key={o.id} className="bg-[#181D2A] border border-[rgba(239,68,68,0.25)] rounded-xl overflow-hidden flex flex-col shadow-sm">
              <div className="p-4 bg-[#131720] border-b border-[#1F2A40] flex justify-between items-center flex-wrap gap-2">
                <span className="text-sm font-bold text-[#E2E8F0]">{o.id} • {o.supplier}</span>
                <StatusBadge status={o.status} />
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="font-semibold text-white">{o.item}</div>
                    <div className="text-sm text-gray-400 mt-0.5">Qty: {o.qty}</div>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-xs text-gray-400">Ordered: {o.orderedAt}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Rejected: {o.rejectedAt}</div>
                  </div>
                </div>

                <div className="bg-[rgba(239,68,68,0.08)] border border-red-500/20 text-red-400 text-sm p-3 rounded-lg leading-relaxed">
                  <span className="font-bold">Reason:</span> {o.reason}
                </div>

                <div>
                  <button 
                    onClick={() => toggleEmails(o.id)} 
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 transition-colors"
                  >
                    Supplier Emails ({o.emailThread.length})
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={clsx("w-3.5 h-3.5 transition-transform", expandedEmails[o.id] ? "rotate-180" : "rotate-0")}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  
                  {expandedEmails[o.id] && (
                    <div className="bg-[#131720] p-4 rounded-lg mt-2 flex flex-col gap-3">
                      {o.emailThread.length === 0 ? (
                        <div className="text-xs text-[#5A6A85] italic">No emails logged.</div>
                      ) : (
                        o.emailThread.map((msg, idx) => (
                          <div key={idx}>
                            <div className="text-xs text-purple-300 font-semibold mb-1">{msg.from} • {msg.date}</div>
                            <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{msg.body}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 bg-[#131720] border-t border-[#1F2A40] flex justify-end gap-3 flex-wrap">
                <button 
                  onClick={() => window.location.href = 'mailto:?subject=' + encodeURIComponent(`Regarding ${o.id}`)} 
                  className="px-4 py-2 border border-[#1F2A40] rounded-lg text-[#94A3B8] text-[12px] font-bold hover:border-[#94A3B8] hover:text-[#E2E8F0] transition-colors"
                >
                  Contact Supplier
                </button>
                <button 
                  onClick={() => navigate(`/store/orders/create?item=${encodeURIComponent(o.item)}`)} 
                  className="px-4 py-2 bg-[rgba(139,92,246,0.12)] border border-[rgba(139,92,246,0.25)] rounded-lg text-[#D8B4FE] text-[12px] font-bold hover:bg-[rgba(139,92,246,0.2)] transition-colors"
                >
                  Re-order
                </button>
                <button 
                  onClick={() => handleDelete(o.id)} 
                  className="px-4 py-2 bg-transparent border border-[rgba(239,68,68,0.25)] rounded-lg text-[#F87171] text-[12px] font-bold hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

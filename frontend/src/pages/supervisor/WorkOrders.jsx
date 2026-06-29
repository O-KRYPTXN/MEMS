import { useState, useMemo, useEffect } from 'react'
import clsx from 'clsx'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'

const initialWOs = [
  { id:'WO-2041', device:'ICU Ventilator', type:'Repair', dept:'ICU', priority:'High', tech:'Unassigned', status:'Unassigned', created:'2026-06-28', desc:'' },
  { id:'WO-2042', device:'Patient Monitor #5', type:'Repair', dept:'ICU', priority:'High', tech:'Unassigned', status:'Unassigned', created:'2026-06-28', desc:'' },
  { id:'WO-2043', device:'O2 Flow Meter', type:'Repair', dept:'ER', priority:'Medium', tech:'Unassigned', status:'Unassigned', created:'2026-06-28', desc:'' },
  { id:'WO-2040', device:'Defibrillator AED-9', type:'Preventive Maintenance', dept:'ER', priority:'Medium', tech:'J. Smith', status:'In Progress', created:'2026-06-28', desc:'' },
  { id:'WO-2039', device:'ECG Monitor E-12', type:'Repair', dept:'ICU', priority:'High', tech:'A. Hassan', status:'In Progress', created:'2026-06-28', desc:'' },
  { id:'WO-2037', device:'Infusion Pump IP-11', type:'Repair', dept:'ICU', priority:'Low', tech:'M. Youssef', status:'In Progress', created:'2026-06-28', desc:'' },
  { id:'WO-2035', device:'BP Monitor B-04', type:'Preventive Maintenance', dept:'ER', priority:'Low', tech:'R. Ibrahim', status:'In Progress', created:'2026-06-28', desc:'' },
  { id:'WO-2034', device:'Pulse Oximeter P-8', type:'Repair', dept:'ICU', priority:'Medium', tech:'S. Khalid', status:'In Progress', created:'2026-06-28', desc:'' },
  { id:'WO-2038', device:'Defibrillator AED-7', type:'Repair', dept:'ER', priority:'High', tech:'J. Smith', status:'Pending Approval', created:'2026-06-28', desc:'' },
  { id:'WO-2036', device:'Patient Monitor #3', type:'Repair', dept:'ICU', priority:'High', tech:'A. Hassan', status:'Pending Approval', created:'2026-06-28', desc:'' },
  { id:'WO-2033', device:'Infusion Pump IP-22', type:'Preventive Maintenance', dept:'ICU', priority:'Medium', tech:'S. Khalid', status:'Pending Approval', created:'2026-06-28', desc:'' },
  { id:'WO-2030', device:'O2 Concentrator', type:'Repair', dept:'ER', priority:'Low', tech:'M. Youssef', status:'Closed', created:'2026-06-28', desc:'' }
]

const teamData = [
  { name:'J. Smith', status:'busy' }, { name:'A. Hassan', status:'online' },
  { name:'M. Youssef', status:'busy' }, { name:'S. Khalid', status:'online' },
  { name:'R. Ibrahim', status:'offline' }
]

const TypeBadge = ({ type }) => {
  const map = {
    'Repair': 'bg-[rgba(239,68,68,0.12)] text-[#F87171]',
    'Preventive Maintenance': 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]',
    'Decommission': 'bg-[rgba(168,85,247,0.12)] text-[#C084FC]',
  }
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-semibold ${map[type] ?? ''}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{type}</span>
}

const WOStatusBadge = ({ status }) => {
  const map = {
    'Unassigned': 'bg-[rgba(239,68,68,0.12)] text-[#F87171]',
    'In Progress': 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]',
    'Pending Approval': 'bg-[rgba(20,184,166,0.12)] text-[#14B8A6]',
    'Closed': 'bg-[rgba(34,197,94,0.12)] text-[#4ADE80]',
  }
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-semibold ${map[status] ?? ''}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{status}</span>
}

const PriorityBadge = ({ priority }) => {
  const map = { High: 'bg-[rgba(239,68,68,0.12)] text-[#F87171]', Medium: 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]', Low: 'bg-[rgba(34,197,94,0.12)] text-[#4ADE80]' }
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-semibold ${map[priority] ?? ''}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{priority}</span>
}

const inputCls = "bg-[#1A2235] border border-[#1F2A40] text-[#E2E8F0] px-3 py-2.5 rounded-lg text-[0.875rem] focus:border-[#14B8A6] outline-none"

export default function WorkOrders() {
  const [wos, setWos] = useState(initialWOs)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  
  const [assignTargetId, setAssignTargetId] = useState(null)
  const [activeApproval, setActiveApproval] = useState(null)
  const [viewWO, setViewWO] = useState(null)
  const [toast, setToast] = useState({ show: false, msg: '', color: '#14B8A6' })
  
  const [assignForm, setAssignForm] = useState({ woId: '', tech: '', priority: 'Medium', notes: '' })
  const [approveNotes, setApproveNotes] = useState('')
  const ROWS = 8

  const showToast = (msg, color = '#14B8A6') => {
    setToast({ show: true, msg, color })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3500)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return wos.filter(w => {
      const matchTab = activeTab === 'all' || w.status === activeTab
      const matchQ = !q || w.id.toLowerCase().includes(q) || w.device.toLowerCase().includes(q) || w.tech.toLowerCase().includes(q)
      const matchType = !typeFilter || w.type === typeFilter
      const matchPri = !priorityFilter || w.priority === priorityFilter
      return matchTab && matchQ && matchType && matchPri
    })
  }, [wos, activeTab, search, typeFilter, priorityFilter])

  useEffect(() => setCurrentPage(1), [activeTab, search, typeFilter, priorityFilter])

  const counts = useMemo(() => ({
    all: wos.length,
    Unassigned: wos.filter(w => w.status === 'Unassigned').length,
    'In Progress': wos.filter(w => w.status === 'In Progress').length,
    'Pending Approval': wos.filter(w => w.status === 'Pending Approval').length,
    Closed: wos.filter(w => w.status === 'Closed').length,
  }), [wos])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS))
  const paginated = filtered.slice((currentPage - 1) * ROWS, currentPage * ROWS)

  useEffect(() => {
    if (showAssignModal) setAssignForm({ woId: assignTargetId || '', tech: '', priority: 'Medium', notes: '' })
  }, [showAssignModal, assignTargetId])

  const handleAssign = () => {
    if (!assignForm.woId) return showToast('Select a work order', '#F87171')
    if (!assignForm.tech) return showToast('Select a technician', '#F87171')
    setWos(prev => prev.map(w => w.id === assignForm.woId ? { ...w, tech: assignForm.tech, priority: assignForm.priority, status: 'In Progress' } : w))
    showToast('✓ Work order assigned successfully')
    setShowAssignModal(false)
  }

  const handleApprove = () => {
    setWos(prev => prev.map(w => w.id === activeApproval.id ? { ...w, status: 'Closed' } : w))
    showToast('✓ Work order approved — device returned to service!')
    setShowApproveModal(false)
  }

  const handleReject = () => {
    setWos(prev => prev.map(w => w.id === activeApproval.id ? { ...w, status: 'In Progress' } : w))
    showToast('⚠️ Returned to technician for revision', '#F59E0B')
    setShowApproveModal(false)
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">Work Orders</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">Assign, track and approve work orders for ICU & Emergency department</p>
        </div>
        <button onClick={() => { setAssignTargetId(null); setShowAssignModal(true) }} className="flex items-center gap-1.5 px-4 py-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white text-[13px] font-bold rounded-lg transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Assign Work Order
        </button>
      </div>

      <div className="flex gap-[2px] bg-[#131720] border border-[#1F2A40] rounded-[10px] p-1 w-fit">
        {[{id:'all', label:'All'}, {id:'Unassigned', label:'Unassigned'}, {id:'In Progress', label:'In Progress'}, {id:'Pending Approval', label:'Pending Approval'}, {id:'Closed', label:'Closed'}].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={clsx("px-[18px] py-[7px] rounded-[7px] text-[0.8125rem] font-semibold transition-colors flex items-center", activeTab === tab.id ? "bg-[#181D2A] text-[#14B8A6]" : "text-[#5A6A85] hover:text-[#94A3B8]")}>
            {tab.label}
            <span className={clsx("ml-[5px] px-[6px] py-[1px] rounded-full text-[0.65rem] font-bold", activeTab === tab.id ? "bg-[rgba(20,184,166,0.15)] text-[#14B8A6]" : "bg-[rgba(239,68,68,0.15)] text-[#F87171]")}>
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col">
        <div className="bg-[#131720] border border-[#1F2A40] rounded-t-[10px] p-3 px-4 flex gap-2.5 items-center">
          <div className="flex items-center gap-2 flex-1 max-w-[280px] h-[34px] bg-[#0F1117] border border-[#1F2A40] rounded-lg px-3 focus-within:border-[#14B8A6] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px] text-[#5A6A85]"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" /></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search work orders…" className="flex-1 min-w-0 bg-transparent border-none outline-none text-[#E2E8F0] text-[0.8125rem]" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-[34px] bg-[#0F1117] border border-[#1F2A40] text-[#94A3B8] rounded-lg text-[0.8rem] px-2 outline-none focus:border-[#14B8A6]">
            <option value="">Type: All</option>
            <option value="Repair">Repair</option>
            <option value="Preventive Maintenance">Preventive Maintenance</option>
            <option value="Decommission">Decommission</option>
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="h-[34px] bg-[#0F1117] border border-[#1F2A40] text-[#94A3B8] rounded-lg text-[0.8rem] px-2 outline-none focus:border-[#14B8A6]">
            <option value="">Priority: All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="bg-[#181D2A] border border-[#1F2A40] border-t-0 rounded-b-[12px] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1A2235] border-b border-[#1F2A40]">
                {['WO #', 'Device', 'Type', 'Dept', 'Priority', 'Assigned To', 'Status', 'Actions'].map(h => (
                  <th key={h} className="p-4 text-[0.75rem] font-bold text-[#5A6A85] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2A40]">
              {paginated.length === 0 ? <tr><td colSpan={8} className="p-8 text-center text-[#5A6A85]">No work orders found.</td></tr> : paginated.map(w => (
                <tr key={w.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="p-4 text-[13px] font-medium text-[#E2E8F0]">{w.id}</td>
                  <td className="p-4 text-[13px] text-[#94A3B8]">{w.device}</td>
                  <td className="p-4"><TypeBadge type={w.type} /></td>
                  <td className="p-4 text-[13px] text-[#94A3B8]">{w.dept}</td>
                  <td className="p-4"><PriorityBadge priority={w.priority} /></td>
                  <td className={clsx("p-4 text-[13px]", w.tech === 'Unassigned' ? 'text-[#F87171]' : 'text-[#94A3B8]')}>{w.tech}</td>
                  <td className="p-4"><WOStatusBadge status={w.status} /></td>
                  <td className="p-4 flex gap-1.5">
                    {w.status === 'Unassigned' && <button onClick={() => { setAssignTargetId(w.id); setShowAssignModal(true) }} className="bg-[rgba(59,114,246,0.12)] border border-[rgba(59,114,246,0.25)] text-[#5E8FFF] rounded-md px-[10px] py-[4px] text-[0.72rem] font-bold hover:bg-[rgba(59,114,246,0.2)]">Assign</button>}
                    {w.status === 'Pending Approval' && <button onClick={() => { setActiveApproval(w); setShowApproveModal(true) }} className="bg-[rgba(20,184,166,0.12)] border border-[rgba(20,184,166,0.25)] text-[#14B8A6] rounded-md px-[10px] py-[4px] text-[0.72rem] font-bold hover:bg-[rgba(20,184,166,0.2)]">Approve</button>}
                    {(w.status === 'In Progress' || w.status === 'Closed') && <button onClick={() => { setViewWO(w); setShowViewModal(true) }} className="w-[30px] h-[30px] rounded flex items-center justify-center border border-[#1F2A40] text-[#5A6A85] hover:bg-[#1F2A40] hover:text-[#E2E8F0] transition-colors"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center p-3 px-4 border-t border-[#1F2A40]">
            <span className="text-[0.8rem] text-[#5A6A85]">Showing {filtered.length ? (currentPage - 1) * ROWS + 1 : 0}–{Math.min(currentPage * ROWS, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-7 h-7 rounded bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8] disabled:opacity-30">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => <button key={n} onClick={() => setCurrentPage(n)} className={clsx("w-7 h-7 rounded text-[0.8rem]", n === currentPage ? "bg-[#14B8A6] text-white" : "bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8]")}>{n}</button>)}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-7 h-7 rounded bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8] disabled:opacity-30">›</button>
            </div>
          </div>
        </div>
      </div>

      <div className={clsx("fixed bottom-7 right-7 z-[100] px-5 py-3 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.4)] text-white text-[13.5px] font-semibold transition-all duration-300", toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")} style={{ backgroundColor: toast.color }}>{toast.msg}</div>

      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Work Order"
        maxWidth="460px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowAssignModal(false)} />
            <ModalPrimaryBtn onClick={handleAssign} color="#14B8A6">
              Assign Technician
            </ModalPrimaryBtn>
          </>
        }
      >
        <div className="flex flex-col gap-4 mt-1">
          <div><label className="block text-[12px] text-[#94A3B8] font-semibold mb-1.5">Work Order</label><select value={assignForm.woId} onChange={e => setAssignForm({ ...assignForm, woId: e.target.value })} className={inputCls + " w-full"}><option value="">Select work order...</option>{wos.filter(w => w.status !== 'Closed').map(w => <option key={w.id} value={w.id}>{w.id} — {w.device} ({w.tech})</option>)}</select></div>
          <div><label className="block text-[12px] text-[#94A3B8] font-semibold mb-1.5">Assign To Technician</label><select value={assignForm.tech} onChange={e => setAssignForm({ ...assignForm, tech: e.target.value })} className={inputCls + " w-full"}><option value="">Select Technician...</option>{teamData.map(t => <option key={t.name} value={t.name}>{t.name} ({t.status})</option>)}</select></div>
          <div><label className="block text-[12px] text-[#94A3B8] font-semibold mb-1.5">Priority</label><select value={assignForm.priority} onChange={e => setAssignForm({ ...assignForm, priority: e.target.value })} className={inputCls + " w-full"}><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select></div>
          <div><label className="block text-[12px] text-[#94A3B8] font-semibold mb-1.5">Notes</label><textarea value={assignForm.notes} onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })} className={inputCls + " w-full min-h-[80px] resize-none"} placeholder="Special instructions…"></textarea></div>
        </div>
      </Modal>

      <Modal
        isOpen={showApproveModal && !!activeApproval}
        onClose={() => setShowApproveModal(false)}
        title={activeApproval ? `Approve ${activeApproval.id}` : 'Approve Work Order'}
        maxWidth="460px"
        footer={
          <>
            <button onClick={handleReject} className="px-4 py-2 border border-[rgba(239,68,68,0.3)] rounded-lg text-[#F87171] text-[13px] font-bold hover:bg-[rgba(239,68,68,0.05)] transition-colors">Reject</button>
            <ModalCancelBtn onClick={() => setShowApproveModal(false)} />
            <ModalPrimaryBtn onClick={handleApprove} color="#14B8A6">
              ✓ Approve & Close
            </ModalPrimaryBtn>
          </>
        }
      >
        <div className="flex flex-col gap-5 mt-2">
          <div className="grid grid-cols-2 gap-2.5">
            {[['Work Order', activeApproval?.id], ['Device', activeApproval?.device], ['Technician', activeApproval?.tech], ['Type', activeApproval?.type]].map(([l, v]) => (
              <div key={l} className="bg-[#1A2235] rounded-lg p-3"><div className="text-[0.72rem] text-[#5A6A85] uppercase">{l}</div><div className="text-[0.875rem] font-semibold text-[#E2E8F0] mt-1">{v}</div></div>
            ))}
          </div>
          <div><label className="block text-[12px] text-[#94A3B8] font-semibold mb-1.5">Supervisor Notes</label><textarea value={approveNotes} onChange={e => setApproveNotes(e.target.value)} className={inputCls + " w-full min-h-[80px] resize-none"} placeholder="Add approval notes…"></textarea></div>
        </div>
      </Modal>

      <Modal
        isOpen={showViewModal && !!viewWO}
        onClose={() => setShowViewModal(false)}
        title={viewWO ? `Work Order ${viewWO.id}` : 'Work Order'}
        maxWidth="460px"
        footer={
          <ModalCancelBtn onClick={() => setShowViewModal(false)}>Close</ModalCancelBtn>
        }
      >
        <div className="flex flex-col gap-5 mt-2">
          <div className="grid grid-cols-2 gap-2.5">
            {[['Work Order', viewWO?.id], ['Device', viewWO?.device], ['Technician', viewWO?.tech], ['Type', viewWO?.type], ['Department', viewWO?.dept], ['Status', viewWO?.status]].map(([l, v]) => (
              <div key={l} className="bg-[#1A2235] rounded-lg p-3"><div className="text-[0.72rem] text-[#5A6A85] uppercase">{l}</div><div className="text-[0.875rem] font-semibold text-[#E2E8F0] mt-1">{v}</div></div>
            ))}
          </div>
          <div>
            <label className="block text-[12px] text-[#94A3B8] font-semibold mb-1.5">Description / Notes</label>
            <div className="bg-[#1A2235] p-2.5 rounded-md text-[0.85rem] text-[#94A3B8] whitespace-pre-wrap">{viewWO?.desc || 'No additional notes provided.'}</div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

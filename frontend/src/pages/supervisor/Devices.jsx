import { useState, useMemo, useEffect } from 'react'
import clsx from 'clsx'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'

const initialDevices = [
  { id: 'DEV-0101', name: 'ICU Ventilator V-12', category: 'Ventilators', dept: 'ICU', status: 'Faulty', lastPM: '2026-02-10', nextPM: '2026-05-10' },
  { id: 'DEV-0102', name: 'Patient Monitor PM-01', category: 'Monitors', dept: 'ICU', status: 'Operational', lastPM: '2026-03-15', nextPM: '2026-06-15' },
  { id: 'DEV-0103', name: 'Defibrillator AED-7', category: 'Defibrillators', dept: 'ER', status: 'Under Maintenance', lastPM: '2026-01-20', nextPM: '2026-04-20' },
  { id: 'DEV-0104', name: 'Infusion Pump IP-22', category: 'Infusion Pumps', dept: 'ICU', status: 'Operational', lastPM: '2026-04-01', nextPM: '2026-07-01' },
  { id: 'DEV-0105', name: 'ECG Monitor E-12', category: 'Monitors', dept: 'ICU', status: 'Under Maintenance', lastPM: '2026-03-22', nextPM: '2026-06-22' },
  { id: 'DEV-0106', name: 'O2 Flow Meter O-05', category: 'Other', dept: 'ER', status: 'Faulty', lastPM: '2026-02-28', nextPM: '2026-05-28' },
  { id: 'DEV-0107', name: 'Pulse Oximeter P-08', category: 'Monitors', dept: 'ICU', status: 'Operational', lastPM: '2026-04-10', nextPM: '2026-07-10' },
  { id: 'DEV-0108', name: 'BP Monitor B-04', category: 'Monitors', dept: 'ER', status: 'Under Maintenance', lastPM: '2026-03-05', nextPM: '2026-06-05' },
  { id: 'DEV-0109', name: 'Defibrillator AED-9', category: 'Defibrillators', dept: 'ER', status: 'Operational', lastPM: '2026-04-18', nextPM: '2026-07-18' },
  { id: 'DEV-0110', name: 'Patient Monitor PM-03', category: 'Monitors', dept: 'ICU', status: 'Repaired', lastPM: '2026-05-01', nextPM: '2026-08-01' },
  { id: 'DEV-0111', name: 'Ventilator V-09', category: 'Ventilators', dept: 'ICU', status: 'Operational', lastPM: '2026-04-05', nextPM: '2026-07-05' },
  { id: 'DEV-0112', name: 'Infusion Pump IP-11', category: 'Infusion Pumps', dept: 'ICU', status: 'Under Maintenance', lastPM: '2026-02-15', nextPM: '2026-05-15' },
]

const mockHistory = {
  'DEV-0103': [
    { date: '2026-05-10', type: 'Repair', tech: 'J. Smith', notes: 'Replaced capacitor, tested output.' },
    { date: '2026-01-20', type: 'PM', tech: 'A. Hassan', notes: 'Full inspection, calibrated shock delivery.' },
    { date: '2025-10-15', type: 'Repair', tech: 'J. Smith', notes: 'Battery replacement.' },
  ],
  'DEV-0101': [
    { date: '2026-02-10', type: 'PM', tech: 'M. Youssef', notes: 'Filter replacement, flow calibration.' },
    { date: '2025-11-10', type: 'Repair', tech: 'S. Khalid', notes: 'Replaced flow sensor.' },
  ]
}

const isPastDue = (dateStr) => new Date(dateStr) < new Date(new Date().setHours(0,0,0,0))
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const DeviceStatusBadge = ({ status }) => {
  const map = {
    'Operational': 'bg-[rgba(34,197,94,0.12)] text-[#4ADE80]',
    'Faulty': 'bg-[rgba(239,68,68,0.12)] text-[#F87171]',
    'Under Maintenance': 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]',
    'Repaired': 'bg-[rgba(20,184,166,0.12)] text-[#14B8A6]',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-bold ${map[status] ?? ''}`}>{status}</span>
}

const inputCls = "w-full bg-[#1A2235] border border-[#1F2A40] text-[#E2E8F0] px-3 py-2.5 rounded-lg text-[0.875rem] outline-none focus:border-[#14B8A6] transition-colors"
const labelCls = "block text-[12px] text-[#94A3B8] font-semibold mb-1.5"

export default function SupervisorDevices() {
  const [devices, setDevices] = useState(initialDevices)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  const [showFaultModal, setShowFaultModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [faultDeviceId, setFaultDeviceId] = useState('')
  
  const [toast, setToast] = useState({ show: false, msg: '', color: '#14B8A6' })
  const ROWS = 8

  const showToast = (msg, color = '#14B8A6') => {
    setToast({ show: true, msg, color })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3500)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return devices.filter(d => {
      const matchTab = activeTab === 'all' || d.status === activeTab
      const matchQ = !q || d.id.toLowerCase().includes(q) || d.name.toLowerCase().includes(q)
      const matchDept = !deptFilter || d.dept === deptFilter
      const matchCat = !categoryFilter || d.category === categoryFilter
      return matchTab && matchQ && matchDept && matchCat
    })
  }, [devices, activeTab, search, deptFilter, categoryFilter])

  useEffect(() => setCurrentPage(1), [activeTab, search, deptFilter, categoryFilter])

  useEffect(() => {
    if (showFaultModal) setFaultDeviceId(selectedDevice?.id || '')
  }, [showFaultModal, selectedDevice])

  const kpis = {
    total: devices.length,
    operational: devices.filter(d => d.status === 'Operational').length,
    faulty: devices.filter(d => d.status === 'Faulty').length,
    maintenance: devices.filter(d => d.status === 'Under Maintenance').length,
  }
  
  const counts = {
    all: devices.length,
    Operational: kpis.operational,
    Faulty: kpis.faulty,
    'Under Maintenance': kpis.maintenance,
    Repaired: devices.filter(d => d.status === 'Repaired').length,
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS))
  const paginated = filtered.slice((currentPage - 1) * ROWS, currentPage * ROWS)

  const handleReportFault = (e) => {
    e.preventDefault()
    if (!faultDeviceId) return showToast('Please select a device', '#F87171')
    setDevices(prev => prev.map(d => d.id === faultDeviceId ? { ...d, status: 'Faulty' } : d))
    setShowFaultModal(false)
    showToast('✓ Fault reported — Work Order created & assigned.')
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">Department Devices</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">View and manage medical devices in ICU & Emergency — report faults and view maintenance history</p>
        </div>
        <button onClick={() => { setSelectedDevice(null); setShowFaultModal(true) }} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#14B8A6] hover:bg-[#0D9488] text-white text-[13px] font-bold rounded-lg transition-colors shadow-lg shadow-teal-500/20 shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> Report Fault
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Devices', value: kpis.total, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />, colorClass: 'bg-[rgba(20,184,166,0.12)] text-[#14B8A6]' },
          { label: 'Operational', value: kpis.operational, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />, colorClass: 'bg-[rgba(74,222,128,0.12)] text-[#4ADE80]' },
          { label: 'Faulty', value: kpis.faulty, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />, colorClass: 'bg-[rgba(239,68,68,0.12)] text-[#F87171]' },
          { label: 'Under Maintenance', value: kpis.maintenance, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />, colorClass: 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-[#181D2A] border border-[#1F2A40] rounded-xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${kpi.colorClass}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">{kpi.icon}</svg></div>
            <div><div className="text-[1.25rem] font-bold text-[#E2E8F0] leading-none">{kpi.value}</div><div className="text-[0.75rem] text-[#94A3B8] font-semibold mt-1">{kpi.label}</div></div>
          </div>
        ))}
      </div>

      <div className="flex gap-[2px] bg-[#131720] border border-[#1F2A40] rounded-[10px] p-1 w-fit overflow-x-auto">
        {[{id:'all', label:'All'}, {id:'Operational', label:'Operational'}, {id:'Faulty', label:'Faulty'}, {id:'Under Maintenance', label:'Under Maintenance'}, {id:'Repaired', label:'Repaired'}].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={clsx("px-[18px] py-[7px] rounded-[7px] text-[0.8125rem] font-semibold transition-colors flex items-center whitespace-nowrap", activeTab === tab.id ? "bg-[#181D2A] text-[#14B8A6]" : "text-[#5A6A85] hover:text-[#94A3B8]")}>
            {tab.label}
            <span className={clsx("ml-[5px] px-[6px] py-[1px] rounded-full text-[0.65rem] font-bold", activeTab === tab.id ? "bg-[rgba(20,184,166,0.15)] text-[#14B8A6]" : "bg-[#181D2A] text-[#5A6A85]")}>{counts[tab.id]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col">
        <div className="bg-[#131720] border border-[#1F2A40] rounded-t-[10px] p-3 px-4 flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] h-[34px] bg-[#0F1117] border border-[#1F2A40] rounded-lg px-3 focus-within:border-[#14B8A6] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px] text-[#5A6A85]"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" /></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search devices…" className="flex-1 min-w-0 bg-transparent border-none outline-none text-[#E2E8F0] text-[0.8125rem]" />
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="h-[34px] bg-[#0F1117] border border-[#1F2A40] text-[#94A3B8] rounded-lg text-[0.8rem] px-2 outline-none focus:border-[#14B8A6]">
            <option value="">Dept: All</option>
            <option value="ICU">ICU</option>
            <option value="ER">ER</option>
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-[34px] bg-[#0F1117] border border-[#1F2A40] text-[#94A3B8] rounded-lg text-[0.8rem] px-2 outline-none focus:border-[#14B8A6]">
            <option value="">Category: All</option>
            <option value="Ventilators">Ventilators</option>
            <option value="Monitors">Monitors</option>
            <option value="Defibrillators">Defibrillators</option>
            <option value="Infusion Pumps">Infusion Pumps</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="bg-[#181D2A] border border-[#1F2A40] border-t-0 rounded-b-[12px] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#1A2235] border-b border-[#1F2A40]">
                {['Device ID', 'Name', 'Category', 'Dept', 'Status', 'Last PM', 'Next PM Due', 'Actions'].map(h => (
                  <th key={h} className="p-4 text-[0.75rem] font-bold text-[#5A6A85] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2A40]">
              {paginated.length === 0 ? <tr><td colSpan={8} className="p-8 text-center text-[#5A6A85]">No devices found.</td></tr> : paginated.map(d => (
                <tr key={d.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="p-4 text-[13px] font-medium text-[#E2E8F0] whitespace-nowrap">{d.id}</td>
                  <td className="p-4 text-[13px] text-[#94A3B8] whitespace-nowrap font-semibold">{d.name}</td>
                  <td className="p-4 text-[13px] text-[#94A3B8]">{d.category}</td>
                  <td className="p-4 text-[13px] text-[#94A3B8]">{d.dept}</td>
                  <td className="p-4"><DeviceStatusBadge status={d.status} /></td>
                  <td className="p-4 text-[12px] text-[#94A3B8] whitespace-nowrap">{formatDate(d.lastPM)}</td>
                  <td className={clsx("p-4 text-[12px] whitespace-nowrap flex items-center gap-1.5 font-semibold", isPastDue(d.nextPM) ? "text-[#F87171]" : "text-[#94A3B8]")}>
                    {formatDate(d.nextPM)}
                    {isPastDue(d.nextPM) && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {d.status === 'Operational' && <button onClick={() => { setSelectedDevice(d); setShowFaultModal(true) }} className="bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] text-[#F87171] px-2.5 py-1 rounded-md text-[11px] font-bold hover:bg-[rgba(239,68,68,0.2)] transition-colors">Report Fault</button>}
                      <button onClick={() => { setSelectedDevice(d); setShowHistoryModal(true) }} className="w-[28px] h-[28px] rounded flex items-center justify-center border border-[#1F2A40] text-[#5A6A85] hover:bg-[#1F2A40] hover:text-[#E2E8F0] transition-colors" title="Maintenance History"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
                    </div>
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
        isOpen={showFaultModal}
        onClose={() => setShowFaultModal(false)}
        title="Report Device Fault"
        maxWidth="420px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowFaultModal(false)} />
            <ModalPrimaryBtn type="submit" form="fault-form" color="#14B8A6">
              Submit Fault Report
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="fault-form" onSubmit={handleReportFault} className="flex flex-col gap-4 mt-1">
          <div className="bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] text-[#FCD34D] p-2.5 rounded-lg flex items-start gap-2.5 text-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 mt-0.5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="text-[0.8rem] font-medium leading-relaxed">A Work Order will be automatically created and status set to Faulty.</span>
          </div>
          <div>
            <label className={labelCls}>Select Device</label>
            <select value={faultDeviceId} onChange={e => setFaultDeviceId(e.target.value)} className={inputCls}>
              <option value="" disabled>Select an operational device...</option>
              {devices.filter(d => d.status === 'Operational').map(d => <option key={d.id} value={d.id}>{d.name} ({d.id})</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Fault Type</label>
            <select className={inputCls} defaultValue="Electrical Fault">
              <option value="Electrical Fault">Electrical Fault</option>
              <option value="Mechanical Damage">Mechanical Damage</option>
              <option value="Software Issue">Software Issue</option>
              <option value="Calibration Error">Calibration Error</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea className={inputCls + " min-h-[80px] resize-none"} placeholder="Describe the fault symptoms…" required></textarea>
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select className={inputCls} defaultValue="High">
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showHistoryModal && !!selectedDevice}
        onClose={() => setShowHistoryModal(false)}
        title="Maintenance History"
        maxWidth="420px"
        footer={
          <ModalCancelBtn onClick={() => setShowHistoryModal(false)}>Close</ModalCancelBtn>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="text-[#94A3B8] text-[0.85rem] font-semibold">{selectedDevice?.name}</div>
          {!mockHistory[selectedDevice?.id] ? (
            <div className="text-center py-6 text-[#5A6A85] text-sm">No maintenance history found.</div>
          ) : (
            <div className="flex flex-col">
              {mockHistory[selectedDevice.id].map((record, idx) => (
                <div key={idx} className="flex gap-4 py-3 border-b border-[#1F2A40] last:border-0 relative">
                  <div className={clsx("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0", record.type === 'Repair' ? "bg-[#F87171]" : "bg-[#14B8A6]")}></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1"><span className="text-[13px] font-bold text-[#E2E8F0]">{record.type}</span><span className="text-[#5A6A85] text-[11px] font-semibold">— {formatDate(record.date)}</span></div>
                    <div className="text-[11px] text-[#94A3B8] font-semibold mb-1">Tech: {record.tech}</div>
                    <div className="text-[12px] text-[#5A6A85] leading-relaxed">{record.notes}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

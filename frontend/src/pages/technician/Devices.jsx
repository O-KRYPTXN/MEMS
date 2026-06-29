import { useState, useMemo } from 'react'
import clsx from 'clsx'

const initialDevices = [
  { id: 'DEV-0101', name: 'ICU Ventilator V-12', dept: 'ICU', status: 'Operational', lastPM: '2026-02-10', nextPM: '2026-05-10', category: 'Respiratory', type: 'Ventilator' },
  { id: 'DEV-0102', name: 'Patient Monitor PM-01', dept: 'ICU', status: 'Faulty', lastPM: '2026-03-15', nextPM: '2026-06-15', category: 'Monitoring', type: 'Monitor' },
  { id: 'DEV-0103', name: 'Defibrillator AED-7', dept: 'ER', status: 'Operational', lastPM: '2026-01-20', nextPM: '2026-04-20', category: 'Resuscitation', type: 'Defibrillator' },
  { id: 'DEV-0104', name: 'Infusion Pump IP-22', dept: 'ICU', status: 'Operational', lastPM: '2026-04-05', nextPM: '2026-07-05', category: 'Pumps', type: 'Pump' }
]

const DeviceStatusBadge = ({ status }) => {
  const isOperational = status === 'Operational'
  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-bold", isOperational ? "bg-[rgba(34,197,94,0.12)] text-[#4ADE80]" : "bg-[rgba(239,68,68,0.12)] text-[#F87171]")}>
      {status}
    </span>
  )
}

const isPastDue = (dateStr) => new Date(dateStr) < new Date(new Date().setHours(0,0,0,0))
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const inputCls = "w-full bg-[#1A2235] border border-[#1F2A40] text-[#E2E8F0] px-3 py-2.5 rounded-lg text-[0.875rem] outline-none focus:border-[#F59E0B] transition-colors"
const labelCls = "block text-[12px] text-[#94A3B8] font-semibold mb-1.5"

export default function TechDevices() {
  const [devices, setDevices] = useState(initialDevices)
  const [search, setSearch] = useState('')
  const [showFaultModal, setShowFaultModal] = useState(false)
  const [showManualsModal, setShowManualsModal] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [toast, setToast] = useState({ show: false, msg: '' })

  const showToast = (msg) => {
    setToast({ show: true, msg })
    setTimeout(() => setToast({ show: false, msg: '' }), 3000)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return devices.filter(d => !q || d.id.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) || d.dept.toLowerCase().includes(q))
  }, [devices, search])

  const handleReportFault = (e) => {
    e.preventDefault()
    setDevices(prev => prev.map(d => d.id === selectedDevice.id ? { ...d, status: 'Faulty' } : d))
    setShowFaultModal(false)
    showToast(`✓ Fault logged. Work Order WO-${Math.floor(1000 + Math.random() * 9000)} created automatically.`)
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">Equipment Catalog</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">Search for devices in ICU/ER to view manuals, PM dates, or report faults.</p>
      </div>

      <div className="bg-[#181D2A] border border-[#1F2A40] rounded-xl overflow-hidden flex flex-col">
        <div className="border-b border-[#1F2A40] p-4 flex items-center">
          <div className="flex items-center gap-2 w-full max-w-[280px] h-[36px] bg-[#0F1117] border border-[#1F2A40] rounded-lg px-3 focus-within:border-[#F59E0B] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px] text-[#5A6A85]"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" /></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search devices..." className="flex-1 min-w-0 bg-transparent border-none outline-none text-[#E2E8F0] text-[0.8125rem]" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#1A2235] border-b border-[#1F2A40]">
                {['ID', 'Device Name', 'Dept', 'Status', 'Last PM', 'Next PM', 'Actions'].map(h => (
                  <th key={h} className="p-4 text-[0.75rem] font-bold text-[#5A6A85] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2A40]">
              {filtered.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-[#5A6A85]">No devices found.</td></tr> : filtered.map(d => (
                <tr key={d.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="p-4 text-[13px] font-medium text-[#E2E8F0] whitespace-nowrap">{d.id}</td>
                  <td className="p-4 text-[13px] text-[#94A3B8] font-semibold">{d.name}</td>
                  <td className="p-4 text-[13px] text-[#94A3B8]">{d.dept}</td>
                  <td className="p-4"><DeviceStatusBadge status={d.status} /></td>
                  <td className="p-4 text-[12px] text-[#94A3B8] whitespace-nowrap">{formatDate(d.lastPM)}</td>
                  <td className={clsx("p-4 text-[12px] whitespace-nowrap", isPastDue(d.nextPM) ? "text-[#F87171] font-bold" : "text-[#94A3B8]")}>{formatDate(d.nextPM)}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedDevice(d); setShowManualsModal(true) }} className="px-2.5 py-1 text-[11px] font-bold bg-transparent border border-[#1F2A40] text-[#94A3B8] rounded-md hover:bg-[#1A2235] hover:text-[#E2E8F0] transition-colors">Manuals</button>
                      <button disabled={d.status === 'Faulty'} onClick={() => { setSelectedDevice(d); setShowFaultModal(true) }} className="px-2.5 py-1 text-[11px] font-bold bg-transparent border border-[rgba(239,68,68,0.3)] text-[#F87171] rounded-md hover:bg-[rgba(239,68,68,0.1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Report Fault</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toast.show && (
        <div className="fixed bottom-7 right-7 z-[2000] bg-[#F59E0B] text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl transition-transform duration-300 animate-slide-up">
          {toast.msg}
        </div>
      )}

      {showFaultModal && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.6)] backdrop-blur-sm" onClick={() => setShowFaultModal(false)}>
          <div className="w-full max-w-[420px] bg-[#181D2A] border border-[#1F2A40] rounded-[14px] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#1F2A40]"><h3 className="text-[1rem] font-bold text-[#E2E8F0]">Report Fault: {selectedDevice.id}</h3><button onClick={() => setShowFaultModal(false)} className="text-[#64748B] hover:text-[#E2E8F0]">✕</button></div>
            <form onSubmit={handleReportFault} className="p-6 flex flex-col gap-[14px]">
              <div>
                <label className={labelCls}>Issue Type</label>
                <select className={inputCls} defaultValue="Electrical">
                  <option value="Electrical">Electrical</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Calibration">Calibration</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea className={inputCls + " min-h-[100px] resize-y"} placeholder="Describe the fault..." required></textarea>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowFaultModal(false)} className="px-4 py-2 border border-[#1F2A40] rounded-lg text-[#94A3B8] text-[13px] hover:border-[#94A3B8] hover:text-[#E2E8F0] font-bold">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] text-[#F87171] hover:bg-[rgba(239,68,68,0.2)] rounded-lg text-[13px] font-bold transition-colors">Submit Fault</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showManualsModal && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.6)] backdrop-blur-sm" onClick={() => setShowManualsModal(false)}>
          <div className="w-full max-w-[460px] bg-[#181D2A] border border-[#1F2A40] rounded-[14px] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#1F2A40]"><h3 className="text-[1rem] font-bold text-[#E2E8F0]">Manuals: {selectedDevice.name}</h3><button onClick={() => setShowManualsModal(false)} className="text-[#64748B] hover:text-[#E2E8F0]">✕</button></div>
            <div className="p-6 flex flex-col gap-3">
              {[
                { title: 'User Manual', size: '2.4 MB', iconColor: 'text-[#F87171]' },
                { title: 'Service Manual', size: '18.1 MB', iconColor: 'text-[#3B72F6]' },
              ].map((m, i) => (
                <div key={i} className="flex flex-row justify-between items-center p-4 border border-[#1F2A40] rounded-lg bg-[#131720]">
                  <div className="flex flex-row items-center gap-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={`w-7 h-7 ${m.iconColor}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    <div><div className="font-semibold text-[#E2E8F0] text-sm">{m.title}</div><div className="text-xs text-[#94A3B8]">PDF • {m.size}</div></div>
                  </div>
                  <button onClick={() => showToast(`✓ ${m.title} download started...`)} className="px-3 py-1.5 text-[11.5px] font-bold bg-transparent border border-[#1F2A40] text-[#94A3B8] rounded-md hover:bg-[#1A2235] hover:text-[#E2E8F0] transition-colors">Download</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

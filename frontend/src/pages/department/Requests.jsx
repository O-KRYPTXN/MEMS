import { useState, useMemo } from 'react'
import clsx from 'clsx'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'

const initialRequests = [
  { id: 'DR-1045', device: 'ICU Ventilator V500', desc: 'Screen flickering intermittently during operation.', date: '25/06/2026', status: 'In Progress', techMessage: 'Parts ordered, expected tomorrow.' },
  { id: 'DR-1046', device: 'Patient Monitor #12', desc: 'Alarm speaker not working.', date: '26/06/2026', status: 'Pending Assignment', techMessage: null },
  { id: 'DR-1047', device: 'Defibrillator AED-7', desc: 'Battery discharges very fast after full charge.', date: '27/06/2026', status: 'Pending Assignment', techMessage: null },
  { id: 'DR-1043', device: 'ECG Monitor Pro', desc: 'Thermal printer jammed.', date: '20/06/2026', status: 'Solved', techMessage: 'Cleared jam and replaced paper roll.' },
  { id: 'DR-1044', device: 'Infusion Pump IP-400', desc: 'Continuous occlusion false alarms.', date: '24/06/2026', status: 'In Progress', techMessage: 'Testing sensor calibration.' },
]

const mockDevices = ['ICU Ventilator V500', 'Patient Monitor #12', 'Defibrillator AED-7', 'ECG Monitor Pro', 'Infusion Pump IP-400', 'Syringe Pump SP-1', 'Portable Ultrasound']

const StatusBadge = ({ status }) => {
  const map = {
    'Pending Assignment': 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]',
    'In Progress': 'bg-[rgba(59,130,246,0.12)] text-[#60A5FA]',
    'Solved': 'bg-[rgba(34,197,94,0.12)] text-[#4ADE80]',
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold whitespace-nowrap ${map[status] || ''}`}>{status}</span>
}

const inputCls = "w-full bg-[#1A2235] border border-[#1F2A40] text-[#E2E8F0] px-3 py-2.5 rounded-lg text-[0.875rem] outline-none focus:border-[#EC4899] transition-colors"
const labelCls = "block text-[12px] text-[#94A3B8] font-semibold mb-1.5"

export default function DeptRequests() {
  const [requests, setRequests] = useState(initialRequests)
  const [activeTab, setActiveTab] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ device: '', desc: '' })
  
  const { showToast } = useToastStore()

  const filtered = useMemo(() => {
    return requests.filter(r => {
      if (activeTab === 'all') return true
      if (activeTab === 'Pending') return r.status === 'Pending Assignment'
      return r.status === activeTab
    })
  }, [requests, activeTab])

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'Pending Assignment').length,
    progress: requests.filter(r => r.status === 'In Progress').length,
    solved: requests.filter(r => r.status === 'Solved').length,
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.device || !formData.desc.trim()) return

    const now = new Date()
    const pad = n => n.toString().padStart(2, '0')
    const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`

    const newReq = {
      id: `DR-${Math.floor(1000 + Math.random() * 9000)}`,
      device: formData.device,
      desc: formData.desc,
      date: dateStr,
      status: 'Pending Assignment',
      techMessage: null
    }

    setRequests(prev => [newReq, ...prev])
    setShowModal(false)
    setFormData({ device: '', desc: '' })
    showToast('✓ Problem report submitted successfully.', TOAST_COLORS.department)
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">Problem Reports</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">Report device faults and track resolution status.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="flex items-center gap-2 px-4 py-2 bg-[#EC4899] hover:bg-[#BE185D] text-white rounded-lg text-[0.8125rem] font-bold transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Report New Problem
        </button>
      </div>

      <div className="bg-[#131720] border border-[#1F2A40] rounded-xl p-1 mb-2 inline-flex gap-0.5 overflow-x-auto w-full sm:w-auto">
        {[
          { id: 'all', label: 'All', count: counts.all },
          { id: 'Pending', label: 'Pending', count: counts.pending },
          { id: 'In Progress', label: 'In Progress', count: counts.progress },
          { id: 'Solved', label: 'Solved', count: counts.solved }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={clsx(
              "px-4 py-2 rounded-[8px] text-[0.8125rem] font-semibold transition-colors flex items-center whitespace-nowrap", 
              activeTab === tab.id ? "bg-[#181D2A] text-[#F472B6]" : "bg-transparent text-[#5A6A85] hover:text-[#94A3B8]"
            )}
          >
            {tab.label}
            <span className={clsx(
              "ml-2 px-1.5 py-0.5 rounded-full text-[0.65rem] font-bold", 
              activeTab === tab.id ? "bg-[rgba(236,72,153,0.12)] text-[#F472B6]" : "bg-[#1A2235] text-[#5A6A85]"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-[#181D2A] border border-[#1F2A40] rounded-xl overflow-hidden -mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#1A2235] border-b border-[#1F2A40]">
                {['Report ID', 'Device', 'Description', 'Date Submitted', 'Status', 'Message from Technician'].map(h => (
                  <th key={h} className="p-4 text-[0.75rem] font-bold text-[#5A6A85] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2A40]">
              {filtered.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-[#5A6A85]">No reports found.</td></tr> : filtered.map(r => (
                <tr key={r.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="p-4 text-[13px] font-medium text-[#E2E8F0] whitespace-nowrap">{r.id}</td>
                  <td className="p-4 text-[13px] text-[#94A3B8] font-semibold">{r.device}</td>
                  <td className="p-4 text-[13px] text-[#94A3B8] max-w-[280px]"><div className="truncate">{r.desc}</div></td>
                  <td className="p-4 text-[12px] text-[#94A3B8] whitespace-nowrap">{r.date}</td>
                  <td className="p-4"><StatusBadge status={r.status} /></td>
                  <td className="p-4">
                    {r.techMessage ? (
                      <div className="bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.2)] text-[#94A3B8] rounded-md px-2.5 py-1.5 text-xs inline-block max-w-[250px] truncate" title={r.techMessage}>
                        {r.techMessage}
                      </div>
                    ) : (
                      <span className="text-[#5A6A85] block text-center w-[50px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Report Device Problem"
        maxWidth="460px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowModal(false)} />
            <ModalPrimaryBtn type="submit" form="report-problem-form" color="#EC4899">
              Submit Report
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="report-problem-form" onSubmit={handleSubmit} className="flex flex-col gap-[14px] mt-1">
          <SelectField label="Affected Device" name="device" value={formData.device} onChange={e => setFormData({ ...formData, device: e.target.value })} placeholder="Select a device..." options={mockDevices} required />
          <InputField type="textarea" label="Problem Description" name="desc" value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} placeholder="Please describe the issue in detail..." required />
        </form>
      </Modal>
    </div>
  )
}

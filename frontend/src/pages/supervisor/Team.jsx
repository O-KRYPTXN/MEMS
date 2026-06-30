import { useState, useMemo } from 'react'
import clsx from 'clsx'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'

const initialTeam = [
  { id: 'tech-1', name: 'James Smith', initials: 'JS', title: 'Senior Biomedical Technician', color: '#3B72F6', status: 'busy', phone: '+20 100 234 5678', email: 'j.smith@hospital.eg', shift: 'Morning (07:00-15:00)', tasksActive: 2, tasksCompleted: 14, maxTasks: 5, tasks: [{ id: 'WO-2038', device: 'Defibrillator AED-7', priority: 'High' }, { id: 'WO-2040', device: 'Defibrillator AED-9', priority: 'Medium' }] },
  { id: 'tech-2', name: 'Ahmed Hassan', initials: 'AH', title: 'Biomedical Technician', color: '#14B8A6', status: 'online', phone: '+20 101 345 6789', email: 'a.hassan@hospital.eg', shift: 'Morning (07:00-15:00)', tasksActive: 1, tasksCompleted: 9, maxTasks: 5, tasks: [{ id: 'WO-2039', device: 'ECG Monitor E-12', priority: 'High' }] },
  { id: 'tech-3', name: 'Mohamed Youssef', initials: 'MY', title: 'Biomedical Technician', color: '#A855F7', status: 'busy', phone: '+20 102 456 7890', email: 'm.youssef@hospital.eg', shift: 'Afternoon (15:00-23:00)', tasksActive: 3, tasksCompleted: 22, maxTasks: 5, tasks: [{ id: 'WO-2037', device: 'Infusion Pump IP-11', priority: 'Low' }, { id: 'WO-2036', device: 'Patient Monitor #3', priority: 'High' }, { id: 'WO-2033', device: 'Infusion Pump IP-22', priority: 'Medium' }] },
  { id: 'tech-4', name: 'Sara Khalid', initials: 'SK', title: 'Biomedical Technician', color: '#F59E0B', status: 'online', phone: '+20 103 567 8901', email: 's.khalid@hospital.eg', shift: 'Morning (07:00-15:00)', tasksActive: 1, tasksCompleted: 17, maxTasks: 5, tasks: [{ id: 'WO-2034', device: 'Pulse Oximeter P-08', priority: 'Medium' }] },
  { id: 'tech-5', name: 'Rami Ibrahim', initials: 'RI', title: 'Junior Biomedical Technician', color: '#EF4444', status: 'offline', phone: '+20 104 678 9012', email: 'r.ibrahim@hospital.eg', shift: 'Night (23:00-07:00)', tasksActive: 0, tasksCompleted: 6, maxTasks: 5, tasks: [] },
]

const mockSystemTechs = [
  { email: 'new.tech@hospital.eg', name: 'New Technician', phone: '+20 109 999 9999' }
]

const PriorityBadge = ({ priority }) => {
  const map = { High: 'bg-[rgba(239,68,68,0.12)] text-[#F87171]', Medium: 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]', Low: 'bg-[rgba(34,197,94,0.12)] text-[#4ADE80]' }
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider ${map[priority] ?? ''}`}>{priority}</span>
}

const StatusDot = ({ status, className }) => {
  const bg = status === 'online' ? 'bg-[#4ADE80]' : status === 'busy' ? 'bg-[#FCD34D]' : 'bg-[#5A6A85]'
  return <div className={clsx("rounded-full", bg, className)}></div>
}

const StatusPill = ({ status }) => {
  const colors = {
    online: 'bg-[rgba(74,222,128,0.12)] border-[rgba(74,222,128,0.25)] text-[#4ADE80]',
    busy: 'bg-[rgba(252,211,77,0.12)] border-[rgba(252,211,77,0.25)] text-[#FCD34D]',
    offline: 'bg-[rgba(90,106,133,0.12)] border-[rgba(90,106,133,0.25)] text-[#5A6A85]'
  }
  const label = status === 'online' ? 'Available' : status === 'busy' ? 'Busy' : 'Offline'
  return <div className={clsx("px-2 py-0.5 rounded-full border text-[0.65rem] font-bold uppercase tracking-wider", colors[status])}>{label}</div>
}

const inputCls = "w-full bg-[#1A2235] border border-[#1F2A40] text-[#E2E8F0] px-3 py-2.5 rounded-lg text-[0.875rem] outline-none focus:border-[#14B8A6] transition-colors"
const labelCls = "block text-[12px] text-[#94A3B8] font-semibold mb-1.5"

export default function SupervisorTeam() {
  const [team, setTeam] = useState(initialTeam)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeTech, setActiveTech] = useState(null)
  const { showToast } = useToastStore()

  const totalTechs = team.length
  const activeTechs = team.filter(t => t.status !== 'offline').length
  const totalTasks = team.reduce((sum, t) => sum + t.tasksActive, 0)

  const handleAssignTask = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const wo = formData.get('wo')
    const priority = formData.get('priority')
    
    if (!wo) return showToast('Please select a work order', TOAST_COLORS.error)

    setTeam(prev => prev.map(t => {
      if (t.id === activeTech.id) {
        return { 
          ...t, 
          tasksActive: t.tasksActive + 1,
          tasks: [{ id: wo, device: 'Assigned Device (Mock)', priority }, ...t.tasks]
        }
      }
      return t
    }))
    setShowAssignModal(false)
    showToast(`Task ${wo} assigned to ${activeTech.name}`, TOAST_COLORS.supervisor)
  }

  const handleAddTech = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const email = formData.get('techEmail')
    const shift = formData.get('shift')
    const phone = formData.get('phone')
    
    if (!email) return showToast('Select a technician to add', TOAST_COLORS.error)
    
    const tech = mockSystemTechs.find(t => t.email === email)
    if (team.find(t => t.email === email)) return showToast('Technician is already on your team', TOAST_COLORS.error)

    const newTech = {
      id: `tech-${Date.now()}`,
      name: tech.name,
      initials: tech.name.split(' ').map(n => n[0]).join(''),
      title: 'Biomedical Technician',
      color: '#14B8A6',
      status: 'online',
      phone,
      email,
      shift,
      tasksActive: 0,
      tasksCompleted: 0,
      maxTasks: 5,
      tasks: []
    }
    
    setTeam(prev => [...prev, newTech])
    setShowAddModal(false)
    showToast(`✓ ${tech.name} added to your team successfully!`, TOAST_COLORS.supervisor)
  }

  const handleRemoveTech = (id) => {
    setTeam(prev => prev.filter(t => t.id !== id))
    showToast('Technician removed from team view', TOAST_COLORS.warning)
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">My Team</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">Track your technicians' workload, active assignments, and shift status</p>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-4 bg-[#181D2A] border border-[#1F2A40] rounded-lg px-4 py-2">
            {[ {s:'online', l:'Available'}, {s:'busy', l:'Busy'}, {s:'offline', l:'Offline'} ].map(lg => (
              <div key={lg.s} className="flex items-center gap-1.5"><StatusDot status={lg.s} className="w-2.5 h-2.5" /><span className="text-[11px] font-semibold text-[#94A3B8]">{lg.l}</span></div>
            ))}
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#14B8A6] hover:bg-[#0D9488] text-white text-[13px] font-bold rounded-lg transition-colors shadow-lg shadow-teal-500/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> Add Technician
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#181D2A] border border-[#1F2A40] rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[rgba(20,184,166,0.12)] text-[#14B8A6] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
          </div>
          <div><div className="text-[1.25rem] font-bold text-[#E2E8F0] leading-none">{totalTechs}</div><div className="text-[0.75rem] text-[#94A3B8] font-semibold mt-1">Total Technicians</div></div>
        </div>
        <div className="bg-[#181D2A] border border-[#1F2A40] rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[rgba(74,222,128,0.12)] text-[#4ADE80] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div><div className="text-[1.25rem] font-bold text-[#E2E8F0] leading-none">{activeTechs}</div><div className="text-[0.75rem] text-[#94A3B8] font-semibold mt-1">On Shift / Active</div></div>
        </div>
        <div className="bg-[#181D2A] border border-[#1F2A40] rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[rgba(245,158,11,0.12)] text-[#FCD34D] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
          </div>
          <div><div className="text-[1.25rem] font-bold text-[#E2E8F0] leading-none">{totalTasks}</div><div className="text-[0.75rem] text-[#94A3B8] font-semibold mt-1">Total Active Tasks</div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {team.map(t => (
          <div key={t.id} className="bg-[#181D2A] border border-[#1F2A40] rounded-xl overflow-hidden hover:-translate-y-[2px] hover:border-[#14B8A6] transition-all duration-300 flex flex-col group">
            <div className="p-5 flex items-start gap-4 relative">
              <button onClick={() => handleRemoveTech(t.id)} className="absolute top-3 right-3 text-[#5A6A85] hover:text-[#F87171] transition-colors p-1" title="Remove from view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              <div className="relative">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[15px] font-bold" style={{ backgroundColor: t.color }}>{t.initials}</div>
                <StatusDot status={t.status} className="w-3.5 h-3.5 absolute bottom-0 right-0 border-2 border-[#181D2A]" />
              </div>
              <div className="flex-1 min-w-0 pr-5">
                <div className="text-[0.95rem] font-bold text-[#E2E8F0] truncate">{t.name}</div>
                <div className="text-[0.8rem] text-[#94A3B8] truncate">{t.title}</div>
                <div className="text-[0.7rem] text-[#14B8A6] truncate mt-0.5">{t.email}</div>
                <div className="mt-2"><StatusPill status={t.status} /></div>
              </div>
            </div>
            
            <div className="px-5 pb-5 flex flex-col gap-3 flex-1">
              <div className="flex justify-between items-center text-[12.5px] border-b border-[#1A2235] pb-2"><span className="text-[#5A6A85] font-semibold">Shift</span><span className="text-[#E2E8F0]">{t.shift}</span></div>
              <div className="flex justify-between items-center text-[12.5px] border-b border-[#1A2235] pb-2"><span className="text-[#5A6A85] font-semibold">Tasks Completed (Month)</span><span className="text-[#E2E8F0] font-bold">{t.tasksCompleted}</span></div>
              
              <div className="mt-1">
                <div className="flex justify-between items-center mb-1.5"><span className="text-[12px] text-[#E2E8F0] font-bold">Active Tasks</span><span className="text-[11px] text-[#94A3B8] font-semibold">{t.tasksActive} / {t.maxTasks}</span></div>
                <div className="h-1.5 bg-[#1F2A40] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(t.tasksActive / t.maxTasks) * 100}%`, backgroundColor: t.color }}></div>
                </div>
              </div>

              <div className="mt-3 flex-1">
                <div className="text-[0.72rem] uppercase font-bold text-[#5A6A85] tracking-wider mb-2">Current Assignments</div>
                {t.tasks.length === 0 ? (
                  <div className="py-4 text-center text-[#5A6A85] text-[12px] bg-[#131720] rounded-lg border border-[#1A2235]">No active tasks — available</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {t.tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-2 bg-[#131720] border border-[#1A2235] p-2 rounded-lg">
                        <div className="text-[11.5px] font-bold text-[#14B8A6] font-mono shrink-0">{task.id}</div>
                        <div className="text-[11.5px] text-[#94A3B8] truncate flex-1" title={task.device}>{task.device}</div>
                        <PriorityBadge priority={task.priority} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[#1F2A40] p-3 px-5 flex gap-2">
              <button onClick={() => { setActiveTech(t); setShowAssignModal(true) }} className="flex-1 py-1.5 rounded-lg bg-[rgba(20,184,166,0.1)] border border-[rgba(20,184,166,0.25)] text-[#14B8A6] text-[12.5px] font-bold hover:bg-[rgba(20,184,166,0.15)] transition-colors">Assign Task</button>
              <button onClick={() => showToast(`Calling ${t.phone}...`, TOAST_COLORS.info)} className="flex-1 py-1.5 rounded-lg bg-transparent border border-[#1F2A40] text-[#94A3B8] text-[12.5px] font-bold hover:bg-[#1F2A40] hover:text-[#E2E8F0] transition-colors">Call</button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={showAssignModal && !!activeTech}
        onClose={() => setShowAssignModal(false)}
        title={activeTech ? `Assign Task to ${activeTech.name}` : 'Assign Task'}
        maxWidth="420px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowAssignModal(false)} />
            <ModalPrimaryBtn type="submit" form="assign-task-form" color="#14B8A6">
              Assign Task
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="assign-task-form" onSubmit={handleAssignTask} className="flex flex-col gap-4 mt-1">
          <div>
            <label className={labelCls}>Select Work Order</label>
            <select name="wo" className={inputCls} defaultValue="">
              <option value="" disabled>Select work order...</option>
              <option value="WO-2050">WO-2050 — Ventilator Calibration</option>
              <option value="WO-2051">WO-2051 — Monitor Repair (Urgent)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select name="priority" className={inputCls} defaultValue="Medium">
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Notes (Optional)</label>
            <textarea name="notes" className={inputCls + " min-h-[80px] resize-none"} placeholder="Special instructions…"></textarea>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Technician"
        maxWidth="420px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowAddModal(false)} />
            <ModalPrimaryBtn type="submit" form="add-tech-form" color="#14B8A6">
              Add Technician
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="add-tech-form" onSubmit={handleAddTech} className="flex flex-col gap-4 mt-1">
          <div>
            <label className={labelCls}>Select Technician</label>
            <select name="techEmail" className={inputCls} defaultValue="">
              <option value="" disabled>Select from system users...</option>
              {mockSystemTechs.map(t => <option key={t.email} value={t.email}>{t.name} ({t.email})</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Phone Number</label>
            <input name="phone" type="text" className={inputCls} defaultValue="+20 109 999 9999" />
          </div>
          <div>
            <label className={labelCls}>Assigned Shift</label>
            <select name="shift" className={inputCls} defaultValue="Morning (07:00-15:00)">
              <option value="Morning (07:00-15:00)">Morning (07:00-15:00)</option>
              <option value="Afternoon (15:00-23:00)">Afternoon (15:00-23:00)</option>
              <option value="Night (23:00-07:00)">Night (23:00-07:00)</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  )
}

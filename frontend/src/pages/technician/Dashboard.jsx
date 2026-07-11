import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import EmptyState from '../../components/ui/EmptyState'
import { useAuthStore } from '../../store/authStore'
import { ROUTES } from '../../constants/routes'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import clsx from 'clsx'
import Panel, { PanelHeader } from '../../components/ui/Panel'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { useTranslation } from 'react-i18next'

const myTasks = [
  { id: 'WO-2039', device: 'ECG Monitor E-12', type: 'Repair', dept: 'ICU', priority: 'High', status: 'In Progress', tech: 'A. Hassan' },
  { id: 'WO-2036', device: 'Patient Monitor #3', type: 'Repair', dept: 'ICU', priority: 'High', status: 'In Progress', tech: 'A. Hassan' },
  { id: 'WO-2034', device: 'Pulse Oximeter P-8', type: 'Repair', dept: 'ICU', priority: 'Medium', status: 'Waiting Parts', tech: 'A. Hassan' },
]

const TaskStatusBadge = ({ status }) => {
  const { t } = useTranslation()
  const map = {
    'In Progress': 'bg-[rgba(245,158,11,0.15)] text-[#FCD34D]',
    'Waiting Parts': 'bg-[rgba(139,92,246,0.15)] text-[#A78BFA]',
    'Pending Approval': 'bg-[rgba(245,158,11,0.15)] text-[#FCD34D]',
    'Unassigned': 'bg-[rgba(59,114,246,0.15)] text-[#60A5FA]',
    'To Do': 'bg-[rgba(59,114,246,0.15)] text-[#60A5FA]',
  }
  const labelMap = {
    'In Progress': t('techDashboard.statusInProgress'),
    'Waiting Parts': t('techDashboard.statusWaitingParts'),
    'Pending Approval': t('techDashboard.statusCompletedSolved'),
    'Unassigned': t('techDashboard.statusInProgress'), // Fallback
    'To Do': t('techDashboard.statusInProgress'), // Fallback
  }
  return <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${map[status] || map['To Do']}`}>{labelMap[status] || status}</span>
}


export default function TechnicianDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const nameFirst = user?.name?.split(' ')[0] || 'Technician'

  const [tasks, setTasks] = useState(myTasks)
  const [showModal, setShowModal] = useState(false)
  const [activeWO, setActiveWO] = useState(null)
  const [updateStatus, setUpdateStatus] = useState('In Progress')
  const [hours, setHours] = useState('1.0')
  const [notes, setNotes] = useState('')
  const { showToast } = useToastStore()

  const activeTasks = tasks.filter(task => task.status !== 'Closed' && task.status !== 'Pending Approval')
  const completedCount = tasks.filter(task => task.status === 'Closed' || task.status === 'Pending Approval').length
  const dueCount = activeTasks.filter(task => task.status === 'In Progress' || task.status === 'Unassigned').length
  const waitingCount = activeTasks.filter(task => task.status === 'Waiting Parts').length

  const handleUpdate = (e) => {
    e.preventDefault()
    let newStatus = 'In Progress'
    if (updateStatus.includes('Completed') || updateStatus.includes('Solved')) newStatus = 'Pending Approval'
    else if (updateStatus.includes('Waiting')) newStatus = 'Waiting Parts'
    
    setTasks(prev => prev.map(task => task.id === activeWO.id ? { ...task, status: newStatus } : task))
    setShowModal(false)
    showToast(t('techDashboard.toastUpdated', { id: activeWO.id }), TOAST_COLORS.technician)
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('techDashboard.pageTitle', { name: nameFirst })}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('techDashboard.pageSubtitle', { count: activeTasks.length })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('techDashboard.activeTasks'), value: activeTasks.length, icon: <path d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"/>, bg: 'bg-[rgba(245,158,11,0.15)] text-[#FCD34D]' },
          { label: t('techDashboard.dueToday'), value: dueCount, icon: <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>, bg: 'bg-[rgba(59,114,246,0.15)] text-[#60A5FA]' },
          { label: t('techDashboard.waitingParts'), value: waitingCount, icon: <path d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>, bg: 'bg-[rgba(168,85,247,0.15)] text-[#C084FC]' },
          { label: t('techDashboard.completedMonth'), value: completedCount + 6, icon: <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>, bg: 'bg-[rgba(34,197,94,0.15)] text-[#4ADE80]' },
        ].map((kpi, i) => (
          <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-[18px] flex flex-row items-center gap-[14px]">
            <div className={`w-[42px] h-[42px] rounded-[10px] flex items-center justify-center shrink-0 ${kpi.bg}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">{kpi.icon}</svg></div>
            <div><div className="text-[1.25rem] font-bold text-[var(--text-primary)] leading-none">{kpi.value}</div><div className="text-[0.75rem] text-[var(--text-muted)] font-semibold mt-1">{kpi.label}</div></div>
          </div>
        ))}
      </div>

      <Panel noPadding>
        <PanelHeader title={t('techDashboard.myTaskQueue')} action={<button onClick={() => navigate(ROUTES.TECH_WORK_ORDERS)} className="px-2.5 py-1 text-[0.75rem] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-md transition-colors">{t('techDashboard.viewAll')}</button>} />
        <div className="flex flex-col">
          {activeTasks.length === 0 ? (
            <EmptyState message={t('techDashboard.noActiveTasks')} />
          ) : (
            activeTasks.map(task => (
              <div key={task.id} className="flex flex-row items-center gap-4 p-4 px-5 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-hover)] transition-colors">
                <div className={`w-1 h-8 rounded shrink-0 ${task.priority === 'High' ? 'bg-[#F87171]' : task.priority === 'Medium' ? 'bg-[#F59E0B]' : 'bg-[#4ADE80]'}`}></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.9rem] font-bold text-[var(--text-primary)] truncate">{task.id} — {task.device}</div>
                  <div className="flex flex-row gap-3 items-center mt-1">
                    <TaskStatusBadge status={task.status} />
                    <span className="text-[var(--text-muted)] text-[0.78rem]">{task.priority} {t('techDashboard.priority')}</span>
                    <span className="text-[var(--text-muted)] text-[0.78rem]">{task.dept} {t('techDashboard.dept')}</span>
                  </div>
                </div>
                <button onClick={() => { setActiveWO(task); setUpdateStatus('In Progress'); setNotes(''); setShowModal(true) }} className="bg-yellow-700/10 border border-yellow-700/30 dark:border-[rgba(245,158,11,0.25)] text-yellow-800 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D] px-3.5 py-1.5 rounded-lg text-[0.75rem] font-bold hover:bg-[rgba(245,158,11,0.2)] transition-colors shrink-0">{t('techDashboard.quickUpdate')}</button>
              </div>
            ))
          )}
        </div>
      </Panel>

      <Modal
        isOpen={showModal && !!activeWO}
        onClose={() => setShowModal(false)}
        title={activeWO ? t('techDashboard.updateWOModalTitle', { id: activeWO.id }) : t('techDashboard.updateWOModalTitleFallback')}
        maxWidth="480px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="update-wo-form" color="#F59E0B">
              {t('techDashboard.saveUpdate')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="update-wo-form" onSubmit={handleUpdate} className="flex flex-col gap-[14px] mt-1">
          <SelectField label={t('techDashboard.status')} name="updateStatus" value={updateStatus} onChange={e => setUpdateStatus(e.target.value)} placeholder={t('techDashboard.selectStatus')} options={['In Progress', 'Waiting on Parts', 'Completed / Solved (Sent for Approval)']} />
          <InputField type="number" min="0.5" step="0.5" label={t('techDashboard.hoursLogged')} name="hours" value={hours} onChange={e => setHours(e.target.value)} />
          <InputField type="textarea" label={t('techDashboard.workNotes')} name="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('techDashboard.workNotesPlaceholder')} />
        </form>
      </Modal>
    </div>
  )
}

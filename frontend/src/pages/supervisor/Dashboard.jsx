import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import faultReportService from '../../api/faultReportService'
import StatusDonutChart from '../../components/charts/StatusDonutChart'
import EmptyState from '../../components/ui/EmptyState'
import { useForm } from 'react-hook-form'
import clsx from 'clsx'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import KPICard from '../../components/ui/KPICard'
import StatusBadge from '../../components/ui/StatusBadge'
import AlertItem from '../../components/ui/AlertItem'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import Panel, { PanelHeader } from '../../components/ui/Panel'
import { ROUTES } from '../../constants/routes'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'

// --- MOCK DATA ---
const pendingApprovals = [
  { id: 'WO-2038', device: 'Defibrillator AED-7', tech: 'J. Smith', type: 'Repair', dept: 'ER' },
  { id: 'WO-2036', device: 'Patient Monitor #3', tech: 'A. Hassan', type: 'Repair', dept: 'ICU' },
  { id: 'WO-2033', device: 'Infusion Pump IP-22', tech: 'S. Khalid', type: 'Preventive Maintenance', dept: 'ICU' },
]

const teamData = [
  { id: 'tech-1', name: 'J. Smith', initials: 'JS', color: '#3B72F6', tasks: 2, maxTasks: 5, status: 'busy' },
  { id: 'tech-2', name: 'A. Hassan', initials: 'AH', color: '#14B8A6', tasks: 1, maxTasks: 5, status: 'online' },
  { id: 'tech-3', name: 'M. Youssef', initials: 'MY', color: '#A855F7', tasks: 3, maxTasks: 5, status: 'busy' },
  { id: 'tech-4', name: 'S. Khalid', initials: 'SK', color: '#F59E0B', tasks: 0, maxTasks: 5, status: 'online' },
  { id: 'tech-5', name: 'R. Ibrahim', initials: 'RI', color: '#EF4444', tasks: 1, maxTasks: 5, status: 'online' },
]

const donutData = [
  { name: 'Completed', value: 12, color: '#4ADE80' },
  { name: 'In Progress', value: 5, color: '#FCD34D' },
  { name: 'Pending Approval', value: 3, color: '#14B8A6' },
  { name: 'Overdue', value: 4, color: '#F87171' },
]

const departmentAlerts = [
  { type: 'crit', title: 'ICU Ventilator — Reported Faulty', sub: 'WO-2041 auto-created · Unassigned', time: '2m ago' },
  { type: 'warn', title: 'PM Due: Defibrillator AED-7', sub: 'Scheduled maintenance overdue by 2 days', time: '1h ago' },
  { type: 'info', title: 'WO-2038 completed by J. Smith', sub: 'Defibrillator repaired · Awaiting your approval', time: '3h ago' },
]

// --- ICONS ---
const icons = {
  crit: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />,
  warn: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />,
  info: <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
}

export default function SupervisorDashboard() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [approvals, setApprovals] = useState(pendingApprovals)
  const [alertsDismissed, setAlertsDismissed] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [activeApproval, setActiveApproval] = useState(null)
  const { showToast } = useToastStore()
  const [approveNotes, setApproveNotes] = useState('')
  const [pendingFaults, setPendingFaults] = useState([])

  useEffect(() => {
    const fetchFaults = async () => {
      try {
        const res = await faultReportService.getFaultReports({ status: 'PENDING', limit: 3 })
        setPendingFaults(res.items || [])
      } catch (err) {
        console.error('Failed to fetch pending faults:', err)
      }
    }
    fetchFaults()
  }, [])

  const { register: regAssign, handleSubmit: submitAssign, reset: resetAssign } = useForm()

  const handleAssign = (data) => {
    if (!data.woId || !data.techId) {
      showToast(t('supervisor.toastSelectBoth'), TOAST_COLORS.error)
      return
    }
    const tech = teamData.find(t => t.id === data.techId)
    showToast(t('supervisor.toastAssigned', { name: tech?.name || 'Technician' }), TOAST_COLORS.supervisor)
    setShowAssignModal(false)
    resetAssign()
  }

  const handleApprove = () => {
    setApprovals(prev => prev.filter(w => w.id !== activeApproval.id))
    setShowApproveModal(false)
    showToast(t('supervisor.toastApproved'), TOAST_COLORS.supervisor)
  }

  const handleReject = () => {
    setShowApproveModal(false)
    showToast(t('supervisor.toastRejected'), TOAST_COLORS.warning)
  }



  return (
    <>
      <div className="flex flex-col gap-6 relative pb-10">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('supervisor.greeting', { name: user?.name?.split(' ')[0] || 'Supervisor' })} 👋</h1>
            <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">
              {t('supervisor.greetingSubtitle', { count: approvals.length })}
            </p>
          </div>
          <button 
            onClick={() => setShowAssignModal(true)} 
            className="flex items-center gap-1.5 px-4 py-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white text-[13px] font-bold rounded-lg transition-colors shadow-lg shadow-teal-500/20"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            {t('supervisor.assignWorkOrder')}
          </button>
        </div>

        {/* Approval Banner */}
        {approvals.length > 0 && (
          <div className="p-5 flex items-center justify-between gap-4 rounded-xl border border-[rgba(20,184,166,0.3)] shadow-[0_4px_24px_rgba(20,184,166,0.06)]" style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.12), rgba(14,165,233,0.08))' }}>
            <div className="flex items-center gap-5 min-w-0">
              <div className="text-[2.5rem] font-extrabold text-[#14B8A6] leading-none shrink-0">{approvals.length}</div>
              <div>
                <h3 className="text-[1rem] font-bold text-[var(--text-primary)]">{t('supervisor.pendingApprovalTitle')}</h3>
                <p className="text-[0.8rem] text-[var(--text-muted)] mt-1">{t('supervisor.pendingApprovalSubtitle')}</p>
              </div>
            </div>
            <button onClick={() => navigate(ROUTES.SUPERVISOR_WORK_ORDERS)} className="shrink-0 flex items-center gap-1.5 px-5 py-2.5 bg-[#14B8A6] hover:bg-[#0D9488] text-white text-[13px] font-bold rounded-lg transition-colors shadow-lg shadow-teal-500/20">
              {t('supervisor.reviewNow')} 
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </button>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div onClick={() => navigate(ROUTES.SUPERVISOR_WORK_ORDERS)} className="cursor-pointer">
            <KPICard title={t('supervisor.openWorkOrders')} value={5 + approvals.length} trend="warn" trendLabel="+2" iconPath="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375" iconVariant="orange" />
          </div>
          <div onClick={() => navigate(ROUTES.SUPERVISOR_WORK_ORDERS)} className="cursor-pointer">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 flex flex-col relative overflow-hidden transition-all duration-300 hover:border-[#14B8A6] hover:shadow-lg hover:shadow-teal-500/10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(20,184,166,0.15)] text-[#14B8A6]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div className="flex items-center gap-1 text-[#4ADE80] font-semibold text-[0.75rem] bg-[rgba(74,222,128,0.1)] px-2 py-0.5 rounded-full"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" /></svg>+1</div>
              </div>
              <div className="text-[1.75rem] font-bold text-[var(--text-primary)] leading-tight">{approvals.length}</div>
              <div className="text-[0.8125rem] text-[var(--text-muted)] font-semibold mt-1">{t('supervisor.pendingYourApproval')}</div>
            </div>
          </div>
          <div onClick={() => navigate(ROUTES.SUPERVISOR_FAULT_REPORTS)} className="cursor-pointer">
            <KPICard title="Pending Fault Reports" value={pendingFaults.length} trend="warn" trendLabel="Triage needed" danger iconPath="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" iconVariant="red" />
          </div>
          <div onClick={() => navigate(ROUTES.SUPERVISOR_TEAM)} className="cursor-pointer">
            <KPICard title={t('supervisor.activeTechnicians')} value={teamData.filter(t => t.status !== 'offline').length} trendLabel={t('supervisor.active')} iconPath="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" iconVariant="green" />
          </div>
        </div>

        {/* Two-Col: Approvals & Alerts */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
          <Panel noPadding className="flex flex-col">
            <PanelHeader
              title={t('supervisor.pendingApprovalTableTitle')}
              subtitle={t('supervisor.pendingApprovalTableSubtitle')}
              action={<button onClick={() => navigate(ROUTES.SUPERVISOR_WORK_ORDERS)} className="text-[13px] font-semibold text-[#14B8A6] hover:text-[#0D9488]">{t('supervisor.viewAll')}</button>}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-table-header)] border-b border-[var(--border)]">
                    <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{t('supervisor.workOrder')}</th>
                    <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{t('supervisor.device')}</th>
                    <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{t('supervisor.technician')}</th>
                    <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{t('supervisor.type')}</th>
                    <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{t('common.status')}</th>
                    <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {approvals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-0"><EmptyState message="✓ All work orders approved" /></td>
                    </tr>
                  ) : approvals.map(wo => (
                    <tr key={wo.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="p-4 font-mono text-[12px] text-[#14B8A6] font-semibold">{wo.id}</td>
                      <td className="p-4 text-[13px] text-[var(--text-primary)] font-medium">{wo.device}</td>
                      <td className="p-4 text-[13px] text-[var(--text-secondary)]">{wo.tech}</td>
                      <td className="p-4">
                        <StatusBadge variant={wo.type === 'Repair' ? 'high' : 'medium'} label={wo.type === 'Repair' ? t('supervisor.repair', 'Repair') : t('supervisor.pm', 'PM')} />
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[rgba(20,184,166,0.12)] text-[#14B8A6]">
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {t('supervisor.pendingYourApproval')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => { setActiveApproval(wo); setShowApproveModal(true) }}
                          className="px-3 py-1.5 bg-[rgba(20,184,166,0.12)] border border-[rgba(20,184,166,0.25)] text-[#14B8A6] rounded-md text-[11.5px] font-bold hover:bg-[rgba(20,184,166,0.2)] transition-colors"
                        >
                          {t('common.approve')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel noPadding className="flex flex-col flex-1">
            <PanelHeader
              title={t('supervisor.departmentAlertsTitle')}
              subtitle={t('supervisor.departmentAlertsSubtitle')}
              action={!alertsDismissed && (
                <button onClick={() => { setAlertsDismissed(true); showToast(t('supervisor.toastAllRead'), TOAST_COLORS.supervisor); }} className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-secondary)] uppercase tracking-wider">{t('supervisor.markAllRead')}</button>
              )}
            />
            <div className="flex-1 p-5 flex flex-col gap-3">
              {alertsDismissed ? (
                <div className="py-10 text-center text-[var(--text-muted)] text-sm">{t('supervisor.allCaughtUp')}</div>
              ) : (
                departmentAlerts.map((alert, i) => (
                  <AlertItem 
                    key={i} 
                    type={alert.type} 
                    title={t(alert.title, alert.title)} 
                    subtitle={t(alert.sub, alert.sub)} 
                    time={alert.time}
                    iconOverride={
                      alert.type === 'info' ? (
                        <div className="w-8 h-8 rounded-full bg-[rgba(20,184,166,0.12)] text-[#14B8A6] flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">{icons.info}</svg>
                        </div>
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${alert.type === 'crit' ? 'bg-[rgba(239,68,68,0.15)] text-[#F87171]' : 'bg-[rgba(245,158,11,0.15)] text-[#FCD34D]'}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">{alert.type === 'crit' ? icons.crit : icons.warn}</svg>
                        </div>
                      )
                    }
                  />
                ))
              )}
            </div>
          </Panel>
        </div>

        {/* Pending Fault Reports Widget */}
        <Panel noPadding className="flex flex-col">
          <PanelHeader
            title="Pending Fault Reports"
            subtitle="Recent department requests awaiting triage"
            action={<button onClick={() => navigate(ROUTES.SUPERVISOR_FAULT_REPORTS)} className="text-[13px] font-semibold text-[#14B8A6] hover:text-[#0D9488]">{t('supervisor.viewAll')}</button>}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-table-header)] border-b border-[var(--border)]">
                  <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">Report ID</th>
                  <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">Device</th>
                  <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">Department</th>
                  <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">Issue Description</th>
                  <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {pendingFaults.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">No pending fault reports.</td>
                  </tr>
                ) : pendingFaults.map(r => (
                  <tr key={r.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="p-4 text-[13px] font-medium text-[var(--text-primary)]">FR-{r.id.slice(-4).toUpperCase()}</td>
                    <td className="p-4 text-[13px] text-[var(--text-secondary)] font-semibold">{r.device?.name}</td>
                    <td className="p-4 text-[13px] text-[var(--text-secondary)]">{r.device?.department?.name}</td>
                    <td className="p-4 text-[13px] text-[var(--text-secondary)] max-w-[280px] truncate" title={r.description}>{r.description}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => navigate(ROUTES.SUPERVISOR_FAULT_REPORTS)}
                        className="px-3 py-1.5 bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-md text-[11.5px] font-bold transition-colors shadow-lg shadow-teal-500/20"
                      >
                        Convert to WO
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Device Requests Panel */}
        <Panel noPadding className="flex flex-col">
          <PanelHeader
            title={t('supervisor.deviceRequestsTitle')}
            subtitle={t('supervisor.deviceRequestsSubtitle')}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-table-header)] border-b border-[var(--border)]">
                  <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{t('supervisor.requestId')}</th>
                  <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{t('supervisor.device')}</th>
                  <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{t('supervisor.quantity')}</th>
                  <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{t('supervisor.technician')}</th>
                  <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{t('supervisor.workOrder')}</th>
                  <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{t('supervisor.date')}</th>
                  <th className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={7} className="p-0"><EmptyState message={t('supervisor.noPendingRequests')} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Two-Col: Workload & Donut */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
          <Panel noPadding className="flex flex-col">
            <PanelHeader
              title={t('supervisor.teamWorkloadTitle')}
              subtitle={t('supervisor.teamWorkloadSubtitle')}
              action={<button onClick={() => navigate(ROUTES.SUPERVISOR_TEAM)} className="text-[13px] font-semibold text-[#14B8A6] hover:text-[#0D9488]">{t('supervisor.manageTeam')}</button>}
            />
            <div className="flex-1 flex flex-col">
              {teamData.map(tech => (
                <div key={tech.id} className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: tech.color }}>
                      {tech.initials}
                    </div>
                    <div className={clsx("absolute bottom-0 end-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-panel)]", tech.status === 'online' ? 'bg-[#4ADE80]' : tech.status === 'busy' ? 'bg-[#FCD34D]' : 'bg-[var(--text-muted)]')}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">{tech.name}</div>
                    <div className="text-[11.5px] text-[var(--text-muted)] truncate">{tech.tasks} {tech.tasks === 1 ? t('supervisor.activeTask') : t('supervisor.activeTasks')}</div>
                  </div>
                  <div className="flex items-center gap-3 w-[120px]">
                    <div className="flex-1 h-[6px] bg-[var(--border)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(tech.tasks / tech.maxTasks) * 100}%`, backgroundColor: tech.color }}></div>
                    </div>
                    <span className="text-[13px] font-bold text-[var(--text-primary)] w-3">{tech.tasks}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel noPadding className="flex flex-col">
            <PanelHeader
              title={t('supervisor.woStatusTitle')}
              subtitle={t('supervisor.woStatusSubtitle')}
            />
            <div className="flex-1 flex flex-col justify-center min-h-[260px] pt-4 pb-1">
              <StatusDonutChart
                data={[
                  { name: t('status.done'), value: 12, color: '#4ADE80' },
                  { name: t('status.inProgress'), value: 5, color: '#FCD34D' },
                  { name: t('supervisor.pendingYourApproval'), value: 3, color: '#14B8A6' },
                  { name: t('status.overdue', 'Overdue'), value: 4, color: '#F87171' },
                ]}
                centerLabel={24}
                centerSubLabel={t('supervisor.totalWOs')}
              />
            </div>
          </Panel>
        </div>

      </div>

      {/* ASSIGN WO MODAL */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={t('supervisor.assignModalTitle')}
        maxWidth="460px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowAssignModal(false)}>{t('supervisor.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="assign-wo-form" color="#14B8A6">
              {t('supervisor.assignTechnician')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="assign-wo-form" onSubmit={submitAssign(handleAssign)} className="flex flex-col gap-4 mt-1">
          <SelectField label={t('supervisor.workOrder')} register={regAssign('woId')} placeholder={t('supervisor.selectWorkOrder')} options={approvals.map(wo => ({value: wo.id, label: `${wo.id} — ${wo.device} (${wo.dept})`}))} />
          <SelectField label={t('supervisor.assignTo')} register={regAssign('techId')} placeholder={t('supervisor.selectTechnician')} options={teamData.map(tech => ({value: tech.id, label: `${tech.name} — ${tech.tasks} ${tech.tasks === 1 ? t('supervisor.activeTask') : t('supervisor.activeTasks')}`}))} />
          <SelectField label={t('supervisor.priority')} register={regAssign('priority')} defaultValue="Medium" options={[t('priority.high'), t('priority.medium'), t('priority.low')]} />
          <InputField type="textarea" label={t('supervisor.notesOptional')} register={regAssign('notes')} placeholder={t('supervisor.notesPlaceholder')} />
        </form>
      </Modal>

      <Modal
        isOpen={showApproveModal && !!activeApproval}
        onClose={() => setShowApproveModal(false)}
        title={activeApproval ? `${t('supervisor.approveModalTitle')} ${activeApproval.id}` : t('supervisor.approveModalTitle')}
        maxWidth="460px"
        footer={
          <>
            <button onClick={handleReject} className="px-4 py-2 bg-transparent border border-[rgba(239,68,68,0.3)] rounded-lg text-[#F87171] text-[13px] font-bold hover:bg-[rgba(239,68,68,0.05)] transition-colors">{t('supervisor.rejectAndReturn')}</button>
            <ModalCancelBtn onClick={() => setShowApproveModal(false)}>{t('supervisor.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn onClick={handleApprove} color="#14B8A6">
              {t('supervisor.approveAndClose')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <div className="flex flex-col gap-5 mt-2">
          <div className="bg-[var(--bg-hover)] rounded-xl p-4 flex flex-col gap-2.5 border border-[var(--border)]">
            <div className="flex justify-between items-center text-[13px]"><span className="text-[var(--text-muted)]">{t('supervisor.workOrder')}</span><span className="font-semibold text-[#14B8A6] font-mono">{activeApproval?.id}</span></div>
            <div className="flex justify-between items-center text-[13px]"><span className="text-[var(--text-muted)]">{t('supervisor.device')}</span><span className="font-semibold text-[var(--text-primary)]">{activeApproval?.device}</span></div>
            <div className="flex justify-between items-center text-[13px]"><span className="text-[var(--text-muted)]">{t('supervisor.technician')}</span><span className="font-semibold text-[var(--text-primary)]">{activeApproval?.tech}</span></div>
            <div className="flex justify-between items-center text-[13px]"><span className="text-[var(--text-muted)]">{t('supervisor.type')}</span><span className="font-semibold text-[var(--text-primary)]">{activeApproval?.type === 'Repair' ? t('supervisor.repair', 'Repair') : t('supervisor.pm', 'PM')}</span></div>
          </div>
          <InputField type="textarea" label={t('supervisor.supervisorNotes')} value={approveNotes} onChange={e => setApproveNotes(e.target.value)} placeholder={t('supervisor.approveNotesPlaceholder')} />
        </div>
      </Modal>
    </>
  )
}

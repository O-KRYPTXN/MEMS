import clsx from 'clsx'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import EmptyState from '../../components/ui/EmptyState'
import Panel, { PanelHeader } from '../../components/ui/Panel'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react';
import { useState } from 'react';

const initialDevices = [
  { id: 'DEV-0101', name: 'ICU Ventilator V-12', dept: 'ICU', status: 'Operational', lastPM: '2026-02-10', nextPM: '2026-05-10', category: 'Respiratory', type: 'Ventilator' },
  { id: 'DEV-0102', name: 'Patient Monitor PM-01', dept: 'ICU', status: 'Faulty', lastPM: '2026-03-15', nextPM: '2026-06-15', category: 'Monitoring', type: 'Monitor' },
  { id: 'DEV-0103', name: 'Defibrillator AED-7', dept: 'ER', status: 'Operational', lastPM: '2026-01-20', nextPM: '2026-04-20', category: 'Resuscitation', type: 'Defibrillator' },
  { id: 'DEV-0104', name: 'Infusion Pump IP-22', dept: 'ICU', status: 'Operational', lastPM: '2026-04-05', nextPM: '2026-07-05', category: 'Pumps', type: 'Pump' }
]

const DeviceStatusBadge = ({ status }) => {
  const { t } = useTranslation()
  const isOperational = status === 'Operational'

  const labelMap = {
    'Operational': t('common.statusOperational', 'Operational'),
    'Faulty': t('common.statusFaulty', 'Faulty')
  }

  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-bold", isOperational ? "bg-[rgba(34,197,94,0.12)] text-[#4ADE80]" : "bg-[rgba(239,68,68,0.12)] text-[#F87171]")}>
      {labelMap[status] || status}
    </span>
  )
}

const isPastDue = (dateStr) => new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0))
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })


export default function TechDevices() {
  const { t } = useTranslation()
  const [devices, setDevices] = useState(initialDevices)
  const [search, setSearch] = useState('')
  const [showFaultModal, setShowFaultModal] = useState(false)
  const [showManualsModal, setShowManualsModal] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const { showToast } = useToastStore()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return devices.filter(d => !q || d.id.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) || d.dept.toLowerCase().includes(q))
  }, [devices, search])

  const handleReportFault = (e) => {
    e.preventDefault()
    setDevices(prev => prev.map(d => d.id === selectedDevice.id ? { ...d, status: 'Faulty' } : d))
    setShowFaultModal(false)
    showToast(t('common.toastFaultLogged', { id: Math.floor(1000 + Math.random() * 9000) }), TOAST_COLORS.technician)
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('techDevices.pageTitle')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('techDevices.pageSubtitle')}</p>
      </div>

      <Panel noPadding className="flex flex-col">
        <div className="border-b border-[var(--border)] p-4 flex items-center">
          <div className="flex items-center gap-2 w-full max-w-[280px] h-[36px] bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 focus-within:border-[#F59E0B] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px] text-[var(--text-muted)]"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" /></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('techDevices.searchPlaceholder')} className="flex-1 min-w-0 bg-transparent border-none outline-none text-[var(--text-primary)] text-[0.8125rem]" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[var(--bg-table-header)] border-b border-[var(--border)]">
                {[t('techDevices.id'), t('techDevices.deviceInfo'), t('techDevices.department'), t('techDevices.status'), t('techDevices.lastMaintenance'), t('techDevices.nextPM', 'Next PM'), t('techDevices.actions')].map(h => (
                  <th key={h} className="p-4 text-[0.75rem] font-bold text-[var(--text-table-header)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.length === 0 ? <tr><td colSpan={7} className="p-0"><EmptyState message={t('techDevices.noDevicesFound')} /></td></tr> : filtered.map(d => (
                <tr key={d.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="p-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">{d.id}</td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)] font-semibold">{d.name}</td>
                  <td className="p-4 text-[13px] text-[var(--text-secondary)]">{d.dept}</td>
                  <td className="p-4"><DeviceStatusBadge status={d.status} /></td>
                  <td className="p-4 text-[12px] text-[var(--text-muted)] whitespace-nowrap">{formatDate(d.lastPM)}</td>
                  <td className={clsx("p-4 text-[12px] whitespace-nowrap", isPastDue(d.nextPM) ? "text-[#F87171] font-bold" : "text-[var(--text-muted)]")}>{formatDate(d.nextPM)}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedDevice(d); setShowManualsModal(true) }} className="px-2.5 py-1 text-[11px] font-bold bg-transparent border border-[var(--border)] text-[var(--text-secondary)] rounded-md hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">{t('common.manuals', 'Manuals')}</button>
                      <button disabled={d.status === 'Faulty'} onClick={() => { setSelectedDevice(d); setShowFaultModal(true) }} className="px-2.5 py-1 text-[11px] font-bold bg-transparent border border-[rgba(239,68,68,0.3)] text-[#F87171] rounded-md hover:bg-[rgba(239,68,68,0.1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('common.reportFault', 'Report Fault')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        isOpen={showFaultModal && !!selectedDevice}
        onClose={() => setShowFaultModal(false)}
        title={selectedDevice ? t('common.reportFaultTitle', { id: selectedDevice.id }) : t('common.reportFault')}
        maxWidth="420px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowFaultModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <button type="submit" form="fault-form" className="px-4 py-2 bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] text-[#F87171] hover:bg-[rgba(239,68,68,0.2)] rounded-lg text-[13px] font-bold transition-colors">{t('common.submitFault')}</button>
          </>
        }
      >
        <form id="fault-form" onSubmit={handleReportFault} className="flex flex-col gap-[14px] mt-1">
          <SelectField label={t('common.issueType')} defaultValue="Electrical" options={['Electrical', 'Mechanical', 'Calibration']} />
          <InputField type="textarea" label={t('common.description')} placeholder={t('common.describeFault')} required />
        </form>
      </Modal>

      <Modal
        isOpen={showManualsModal && !!selectedDevice}
        onClose={() => setShowManualsModal(false)}
        title={selectedDevice ? t('common.manualsTitle', { name: selectedDevice.name }) : t('common.manuals')}
        maxWidth="460px"
      >
        <div className="flex flex-col gap-3 mt-2">
          {[
            { title: t('common.userManual', 'User Manual'), size: '2.4 MB', iconColor: 'text-[#F87171]' },
            { title: t('common.serviceManual', 'Service Manual'), size: '18.1 MB', iconColor: 'text-[#3B72F6]' },
          ].map((m, i) => (
            <div key={i} className="flex flex-row justify-between items-center p-4 border border-[var(--border)] rounded-lg bg-[var(--bg-input)]">
              <div className="flex flex-row items-center gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={`w-7 h-7 ${m.iconColor}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                <div><div className="font-semibold text-[var(--text-primary)] text-sm">{m.title}</div><div className="text-xs text-[var(--text-muted)]">PDF • {m.size}</div></div>
              </div>
              <button onClick={() => showToast(t('common.toastDownloadStarted', { title: m.title }), TOAST_COLORS.info)} className="px-3 py-1.5 text-[11.5px] font-bold bg-transparent border border-[var(--border)] text-[var(--text-secondary)] rounded-md hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">{t('common.download')}</button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

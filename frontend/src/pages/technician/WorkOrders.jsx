import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import EmptyState from '../../components/ui/EmptyState'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'

const initialWOs = [
  { id: 'WO-2039', device: 'ECG Monitor E-12', type: 'Repair', dept: 'ICU', priority: 'High', status: 'In Progress', date: '2026-06-28', timeLog: '1.5', parts: 'None', notes: '' },
  { id: 'WO-2045', device: 'Defibrillator AED-9', type: 'Preventive Maintenance', dept: 'ER', priority: 'Medium', status: 'Unassigned', date: '2026-06-28', timeLog: '0', parts: '', notes: '' },
  { id: 'WO-2036', device: 'Patient Monitor #3', type: 'Repair', dept: 'ICU', priority: 'High', status: 'In Progress', date: '2026-06-28', timeLog: '2.0', parts: 'Sensor Cable', notes: 'Diagnosing sensor issue.' },
  { id: 'WO-2034', device: 'Pulse Oximeter P-8', type: 'Repair', dept: 'ICU', priority: 'Medium', status: 'Waiting Parts', date: '2026-06-27', timeLog: '0.5', parts: '', notes: 'Waiting for replacement screen.' },
  { id: 'WO-2030', device: 'O2 Concentrator', type: 'Calibration', dept: 'ER', priority: 'Low', status: 'Solved Tasks', date: '2026-06-26', timeLog: '1.0', parts: 'None', notes: 'Calibrated output to standard.' },
  { id: 'WO-2028', device: 'Infusion Pump IP-2', type: 'Preventive Maintenance', dept: 'ICU', priority: 'Low', status: 'Unassigned', date: '2026-06-26', timeLog: '0', parts: '', notes: '' }
]

const StatusBadge = ({ status }) => {
  const { t } = useTranslation()
  const map = {
    'In Progress': 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]',
    'Waiting Parts': 'bg-[rgba(168,85,247,0.12)] text-[#C084FC]',
    'Unassigned': 'bg-[rgba(59,130,246,0.12)] text-[#60A5FA]',
    'Solved Tasks': 'bg-[rgba(34,197,94,0.12)] text-[#4ADE80]',
  }
  const labelMap = {
    'In Progress': t('common.statusInProgress', 'In Progress'),
    'Waiting Parts': t('common.statusWaitingParts', 'Waiting Parts'),
    'Unassigned': t('common.statusToDo', 'To Do'),
    'Solved Tasks': t('common.statusSolved', 'Solved Tasks')
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-bold whitespace-nowrap ${map[status] || ''}`}>{labelMap[status] || status}</span>
}

const PriorityBadge = ({ priority }) => {
  const { t } = useTranslation()
  const map = { High: 'bg-[rgba(239,68,68,0.12)] text-[#F87171]', Medium: 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]', Low: 'bg-[rgba(34,197,94,0.12)] text-[#4ADE80]' }
  const labelMap = {
    'High': t('common.priorityHigh', 'High'),
    'Medium': t('common.priorityMedium', 'Medium'),
    'Low': t('common.priorityLow', 'Low')
  }
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[0.65rem] font-bold uppercase tracking-wider ${map[priority] || ''}`}>{labelMap[priority] || priority}</span>
}

const TypeBadge = ({ type }) => {
  const { t } = useTranslation()
  const map = {
    'Repair': 'bg-[rgba(239,68,68,0.12)] text-[#F87171]',
    'Preventive Maintenance': 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]',
    'Calibration': 'bg-[rgba(59,130,246,0.12)] text-[#60A5FA]',
  }
  const labelMap = {
    'Repair': t('common.typeRepair', 'Repair'),
    'Preventive Maintenance': t('common.typePM', 'PM'),
    'Calibration': t('common.typeCalibration', 'Calibration')
  }
  const label = labelMap[type] || type
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[0.7rem] font-bold whitespace-nowrap ${map[type] || ''}`}>{label}</span>
}

const inputCls = "w-full bg-[#1A2235] border border-[#1F2A40] text-[#E2E8F0] px-3 py-2.5 rounded-lg text-[0.875rem] outline-none focus:border-[#F59E0B] transition-colors"
const labelCls = "block text-[12px] text-[#94A3B8] font-semibold mb-1.5"

export default function TechnicianWorkOrders() {
  const { t } = useTranslation()
  const [wos, setWos] = useState(initialWOs)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedWO, setSelectedWO] = useState(null)
  const [updateForm, setUpdateForm] = useState({ status: '', timeLog: '', parts: '', notes: '' })
  
  const { showToast } = useToastStore()
  const ROWS = 8

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return wos.filter(w => {
      const matchTab = activeTab === 'all' || w.status === activeTab
      const matchQ = !q || w.id.toLowerCase().includes(q) || w.device.toLowerCase().includes(q)
      const matchPri = !priorityFilter || w.priority === priorityFilter
      const matchType = !typeFilter || w.type === typeFilter
      return matchTab && matchQ && matchPri && matchType
    })
  }, [wos, activeTab, search, priorityFilter, typeFilter])

  useEffect(() => setCurrentPage(1), [activeTab, search, priorityFilter, typeFilter])

  const counts = {
    all: wos.length,
    'Unassigned': wos.filter(w => w.status === 'Unassigned').length,
    'In Progress': wos.filter(w => w.status === 'In Progress').length,
    'Waiting Parts': wos.filter(w => w.status === 'Waiting Parts').length,
    'Solved Tasks': wos.filter(w => w.status === 'Solved Tasks').length,
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS))
  const paginated = filtered.slice((currentPage - 1) * ROWS, currentPage * ROWS)

  const handleOpenUpdate = (row) => {
    setSelectedWO(row)
    setUpdateForm({ status: row.status, timeLog: row.timeLog, parts: row.parts, notes: row.notes })
    setShowUpdateModal(true)
  }

  const handleUpdateSubmit = (e) => {
    e.preventDefault()
    setWos(prev => prev.map(w => w.id === selectedWO.id ? { ...w, ...updateForm } : w))
    setShowUpdateModal(false)
    showToast(t('techWorkOrders.toastUpdated', { id: selectedWO.id }), TOAST_COLORS.technician)
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">{t('techWorkOrders.pageTitle')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">{t('techWorkOrders.pageSubtitle')}</p>
      </div>

      <div className="flex gap-[2px] bg-[#131720] border border-[#1F2A40] rounded-[10px] p-1 w-fit overflow-x-auto">
        {[{id:'all', label:t('techWorkOrders.tabAll')}, {id:'Unassigned', label:t('common.statusToDo')}, {id:'In Progress', label:t('techWorkOrders.tabInProgress')}, {id:'Waiting Parts', label:t('techWorkOrders.tabPendingParts')}, {id:'Solved Tasks', label:t('techWorkOrders.tabCompleted')}].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={clsx("px-[18px] py-[7px] rounded-[7px] text-[0.8125rem] font-semibold transition-colors flex items-center whitespace-nowrap", activeTab === tab.id ? "bg-[rgba(245,158,11,0.12)] text-[#FCD34D]" : "text-[#5A6A85] hover:text-[#94A3B8]")}>
            {tab.label}
            <span className={clsx("ml-[5px] px-[6px] py-[1px] rounded-full text-[0.65rem] font-bold", activeTab === tab.id ? "bg-[rgba(245,158,11,0.2)] text-[#F59E0B]" : "bg-[#181D2A] text-[#5A6A85]")}>{counts[tab.id]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col">
        <div className="bg-[#131720] border border-[#1F2A40] rounded-t-[10px] p-3 px-4 flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] h-[34px] bg-[#0F1117] border border-[#1F2A40] rounded-lg px-3 focus-within:border-[#F59E0B] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px] text-[#5A6A85]"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" /></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('techWorkOrders.searchPlaceholder')} className="flex-1 min-w-0 bg-transparent border-none outline-none text-[#E2E8F0] text-[0.8125rem]" />
          </div>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="h-[34px] bg-[#0F1117] border border-[#1F2A40] text-[#94A3B8] rounded-lg text-[0.8rem] px-2 outline-none focus:border-[#F59E0B]">
            <option value="">{t('common.allPriority')}</option>
            <option value="High">{t('common.priorityHigh')}</option>
            <option value="Medium">{t('common.priorityMedium')}</option>
            <option value="Low">{t('common.priorityLow')}</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-[34px] bg-[#0F1117] border border-[#1F2A40] text-[#94A3B8] rounded-lg text-[0.8rem] px-2 outline-none focus:border-[#F59E0B]">
            <option value="">{t('techWorkOrders.allTypes')}</option>
            <option value="Repair">{t('common.typeRepair')}</option>
            <option value="Preventive Maintenance">{t('common.typePM')}</option>
            <option value="Calibration">{t('common.typeCalibration')}</option>
          </select>
        </div>

        <div className="bg-[#181D2A] border border-[#1F2A40] border-t-0 rounded-b-[12px] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#1A2235] border-b border-[#1F2A40]">
                {[t('techWorkOrders.woId'), t('techWorkOrders.device'), t('techWorkOrders.type'), t('common.dept'), t('techWorkOrders.priority'), t('techWorkOrders.status'), t('techWorkOrders.dueDate', 'Due Date'), t('techWorkOrders.actions')].map(h => (
                  <th key={h} className="p-4 text-[0.75rem] font-bold text-[#5A6A85] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2A40]">
              {paginated.length === 0 ? <tr><td colSpan={8} className="p-0"><EmptyState message={t('techWorkOrders.noWorkOrders')} /></td></tr> : paginated.map(w => (
                <tr key={w.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="p-4 text-[13px] font-medium text-[#E2E8F0] whitespace-nowrap">{w.id}</td>
                  <td className="p-4 text-[13px] text-[#94A3B8] font-semibold">{w.device}</td>
                  <td className="p-4"><TypeBadge type={w.type} /></td>
                  <td className="p-4 text-[13px] text-[#94A3B8]">{w.dept}</td>
                  <td className="p-4"><PriorityBadge priority={w.priority} /></td>
                  <td className="p-4"><StatusBadge status={w.status} /></td>
                  <td className="p-4 text-[12px] text-[#94A3B8] whitespace-nowrap">{w.date}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenUpdate(w)} className="bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.25)] text-[#FCD34D] px-2.5 py-1 rounded-md text-[11px] font-bold hover:bg-[rgba(245,158,11,0.2)] transition-colors">{t('techWorkOrders.update')}</button>
                      <button onClick={() => { setSelectedWO(w); setShowViewModal(true) }} className="w-[28px] h-[28px] rounded flex items-center justify-center border border-[#1F2A40] text-[#5A6A85] hover:bg-[#1F2A40] hover:text-[#E2E8F0] transition-colors"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => <button key={n} onClick={() => setCurrentPage(n)} className={clsx("w-7 h-7 rounded text-[0.8rem]", n === currentPage ? "bg-[#F59E0B] text-white" : "bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8]")}>{n}</button>)}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-7 h-7 rounded bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8] disabled:opacity-30">›</button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showUpdateModal && !!selectedWO}
        onClose={() => setShowUpdateModal(false)}
        title={selectedWO ? t('techWorkOrders.updateWOModalTitle', { id: selectedWO.id }) : 'Update Work Order'}
        maxWidth="460px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowUpdateModal(false)}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="update-form" color="#F59E0B">
              {t('techWorkOrders.saveUpdate')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="update-form" onSubmit={handleUpdateSubmit} className="flex flex-col gap-[14px] mt-1">
          <SelectField label={t('techWorkOrders.statusLabel')} value={updateForm.status} onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })} options={[{value: 'Unassigned', label: t('common.statusToDo')}, {value: 'In Progress', label: t('common.statusInProgress')}, {value: 'Waiting Parts', label: t('common.statusWaitingParts')}, {value: 'Solved Tasks', label: t('common.statusSolved')}]} />
          <div className="flex gap-4">
            <div className="flex-1">
              <InputField type="number" label={t('techWorkOrders.hoursLogged')} step="0.5" min="0" value={updateForm.timeLog} onChange={e => setUpdateForm({ ...updateForm, timeLog: e.target.value })} />
            </div>
            <div className="flex-1">
              <InputField label={t('common.partsUsed')} value={updateForm.parts} onChange={e => setUpdateForm({ ...updateForm, parts: e.target.value })} placeholder="e.g. O2 Sensor" />
            </div>
          </div>
          <InputField type="textarea" label={t('techWorkOrders.workNotes')} value={updateForm.notes} onChange={e => setUpdateForm({ ...updateForm, notes: e.target.value })} placeholder={t('techWorkOrders.workNotesPlaceholder')} />
        </form>
      </Modal>

      <Modal
        isOpen={showViewModal && !!selectedWO}
        onClose={() => setShowViewModal(false)}
        title={selectedWO ? t('common.woDetailsTitle', { id: selectedWO.id }) : t('common.woDetails', 'Work Order Details')}
        maxWidth="500px"
        footer={
          <ModalCancelBtn onClick={() => setShowViewModal(false)}>{t('common.close')}</ModalCancelBtn>
        }
      >
        <div className="mt-2">
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {[
              { l: t('techWorkOrders.device'), v: selectedWO?.device }, { l: t('common.dept'), v: selectedWO?.dept },
              { l: t('techWorkOrders.type'), v: selectedWO ? <TypeBadge type={selectedWO.type} /> : null }, { l: t('techWorkOrders.priority'), v: selectedWO ? <PriorityBadge priority={selectedWO.priority} /> : null },
              { l: t('techWorkOrders.status'), v: selectedWO ? <StatusBadge status={selectedWO.status} /> : null }, { l: t('techWorkOrders.dueDate', 'Due Date'), v: selectedWO?.date },
              { l: t('techWorkOrders.hoursLogged'), v: `${selectedWO?.timeLog} hrs` }, { l: t('common.partsUsed', 'Parts Used'), v: selectedWO?.parts || 'None' }
            ].map((item, idx) => (
              <div key={idx} className="bg-[#1A2235] rounded-lg p-3">
                <div className="text-[11px] font-semibold text-[#5A6A85] mb-1">{item.l}</div>
                <div className="text-[13px] font-bold text-[#E2E8F0]">{item.v}</div>
              </div>
            ))}
          </div>
          <div className="bg-[#1A2235] rounded-lg p-3">
            <div className="text-[11px] font-semibold text-[#5A6A85] mb-1">{t('techWorkOrders.workNotes')}</div>
            <div className="text-[13px] text-[#94A3B8] whitespace-pre-wrap">{selectedWO?.notes || 'No notes provided yet.'}</div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

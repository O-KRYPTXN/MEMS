import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import clsx from 'clsx'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { workOrders as initialWorkOrders } from '../../data/workOrders'
import KPICard from '../../components/ui/KPICard'
import StatusBadge from '../../components/ui/StatusBadge'
import DataTable from '../../components/tables/DataTable'
import { formatDate } from '../../utils/formatDate'

const typeVariantMap = {
  'Repair':                 { variant: 'high',   label: 'Repair' },
  'Preventive Maintenance': { variant: 'medium', label: 'PM' },
  'Decommission':           { variant: 'low',    label: 'Decommission' },
}

const TypeBadge = ({ type }) => {
  const cfg = typeVariantMap[type] ?? { variant: 'low', label: type }
  return <StatusBadge variant={cfg.variant} label={cfg.label} />
}

const ROWS_PER_PAGE = 5

const TABS = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'progress' },
  { label: 'Waiting Parts', value: 'waiting' },
  { label: 'Completed', value: 'done' },
]

const DEPT_OPTS = [
  ['', 'All'], ['ICU', 'ICU'], ['ER', 'ER'], ['Surgery', 'Surgery'],
  ['Radiology', 'Radiology'], ['Cardiology', 'Cardiology']
]

const TYPE_OPTS = [
  ['', 'All'], ['Repair', 'Repair'], ['Preventive Maintenance', 'Preventive Maintenance'], ['Decommission', 'Decommission']
]

const STATUS_OPTS = [
  ['', 'All'], ['open', 'Open'], ['progress', 'In Progress'],
  ['waiting', 'Waiting Parts'], ['done', 'Completed'], ['cancelled', 'Cancelled']
]

const ASSIGN_OPTS = [
  ['', 'All'], ['J. Smith', 'J. Smith'], ['A. Hassan', 'A. Hassan'],
  ['M. Youssef', 'M. Youssef'], ['S. Khalid', 'S. Khalid']
]

const selectCls = 'h-[36px] px-2.5 bg-[#1A2235] border border-[#1F2A40] rounded-lg text-[#E2E8F0] text-[0.8125rem] outline-none'
const inputCls = "w-full bg-[#0d1117] border border-[#1F2A40] rounded-lg text-[#E2E8F0] text-[13px] px-[13px] py-[10px] outline-none focus:border-[#3B72F6] placeholder:text-[#4A5568]"
const labelCls = "block text-[12px] text-[#94A3B8] uppercase font-semibold tracking-[0.4px] mb-1.5"

const getPageNums = (cur, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  const end = Math.min(total, Math.max(cur + 2, 5))
  const start = Math.max(1, end - 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export default function WorkOrders() {
  const [woList, setWoList] = useState(initialWorkOrders)
  
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [assignedFilter, setAssignedFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [activeTab, setActiveTab] = useState('')
  
  const [currentPage, setCurrentPage] = useState(1)
  
  const [showViewModal, setShowViewModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedWO, setSelectedWO] = useState(null)
  const [editingWO, setEditingWO] = useState(null)

  const { register, handleSubmit, reset } = useForm()

  const tabCounts = useMemo(() => ({
    '': woList.length,
    open: woList.filter(w => w.status === 'open').length,
    progress: woList.filter(w => w.status === 'progress').length,
    waiting: woList.filter(w => w.status === 'waiting').length,
    done: woList.filter(w => w.status === 'done').length,
  }), [woList])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return woList.filter(wo => {
      const matchTab    = !activeTab   || wo.status === activeTab
      const matchStatus = !statusFilter|| wo.status === statusFilter
      const matchType   = !typeFilter  || wo.type === typeFilter
      const matchAssign = !assignedFilter || wo.assigned === assignedFilter
      const matchDept   = !deptFilter  || wo.dept === deptFilter
      const matchSearch = !q || [wo.id, wo.device, wo.dept, wo.assigned, wo.issue, wo.status]
        .some(v => String(v).toLowerCase().includes(q))
      return matchTab && matchStatus && matchType && matchAssign && matchDept && matchSearch
    })
  }, [woList, search, activeTab, statusFilter, typeFilter, assignedFilter, deptFilter])

  useEffect(() => setCurrentPage(1), [search, activeTab, statusFilter, typeFilter, assignedFilter, deptFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE))
  const paginated = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1
  const end = Math.min(currentPage * ROWS_PER_PAGE, filtered.length)
  const pageNums = getPageNums(currentPage, totalPages)

  const handleTabClick = (value) => {
    setActiveTab(value)
    setStatusFilter(value)
  }

  const handleStatusFilterChange = (e) => {
    const val = e.target.value
    setStatusFilter(val)
    if (['', 'open', 'progress', 'waiting', 'done'].includes(val)) {
      setActiveTab(val)
    } else {
      setActiveTab('')
    }
  }

  const columns = useMemo(() => [
    { key: 'id', label: 'WO#', render: val => <span className="font-mono text-[#3B82F6] font-semibold text-[12px]">{val}</span> },
    { key: 'device', label: 'Device Name', render: val => <span className="text-[#E2E8F0] font-medium">{val}</span> },
    { key: 'dept', label: 'Department', render: val => <span className="inline-block bg-[rgba(30,41,59,0.8)] border border-[#1F2A40] rounded-[6px] px-[9px] py-[2px] text-[11px] text-[#94A3B8]">{val}</span> },
    { key: 'issue', label: 'Issue Description', render: val => <span className="inline-block max-w-[200px] truncate text-[#94A3B8] align-middle text-[12px]" title={val}>{val}</span> },
    { key: 'type', label: 'Type', render: val => <TypeBadge type={val} /> },
    { key: 'assigned', label: 'Assigned To' },
    { key: 'status', label: 'Status', render: val => <StatusBadge variant={val} /> },
    { key: 'created', label: 'Created Date', render: val => formatDate(val) },
    { key: 'actions', label: '', render: (_, row) => (
      <div className="flex gap-1.5">
        <button
          onClick={e => { e.stopPropagation(); setSelectedWO(row); setShowViewModal(true) }}
          className="w-7 h-7 rounded-md bg-[#1A2235] border border-[#1F2A40] flex items-center justify-center text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1F2A40]"
          title="View details"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>
    )},
  ], [])

  const renderPagination = () => (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[#1F2A40]">
      <span className="text-[0.8rem] text-[#5A6A85]">
        Showing {start}–{end} of {filtered.length} work orders
      </span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
          className="w-7 h-7 rounded-md bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8] text-[0.8rem] disabled:opacity-30 disabled:cursor-default">‹</button>
        {pageNums.map(n => (
          <button key={n} type="button" onClick={() => setCurrentPage(n)}
            className={clsx('w-7 h-7 rounded-md text-[0.8rem]', n === currentPage ? 'bg-[#3B72F6] text-white' : 'bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8]')}>{n}</button>
        ))}
        <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
          className="w-7 h-7 rounded-md bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8] text-[0.8rem] disabled:opacity-30 disabled:cursor-default">›</button>
      </div>
    </div>
  )

  const onFormSubmit = (data) => {
    if (editingWO) {
      setWoList(prev => prev.map(wo => wo.id === editingWO.id ? { ...wo, ...data } : wo))
    } else {
      const lastIdNum = woList.reduce((max, wo) => {
        const num = parseInt(wo.id.split('-')[2], 10)
        return isNaN(num) ? max : Math.max(max, num)
      }, 0)
      const newId = `WO-2024-${String(lastIdNum + 1).padStart(4, '0')}`
      const newWo = {
        id: newId,
        created: new Date().toISOString().split('T')[0],
        status: 'open',
        ...data
      }
      setWoList([newWo, ...woList])
    }
    setShowFormModal(false)
    reset()
  }

  const openEditModal = () => {
    setShowViewModal(false)
    setEditingWO(selectedWO)
    reset(selectedWO)
    setShowFormModal(true)
  }

  const openCreateModal = () => {
    setEditingWO(null)
    reset({ device: '', dept: '', type: '', issue: '', assigned: '', dueDate: '' })
    setShowFormModal(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">Work Orders Hub</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">Monitor, assign, and update equipment repair requests</p>
        </div>
        <button type="button" onClick={openCreateModal} className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-[#3B72F6] hover:bg-[#2558D8] text-white text-[0.8125rem] font-semibold transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[15px] h-[15px]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Work Order
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-[16px]">
        <KPICard title="Created" value={tabCounts.open} iconVariant="blue" iconPath="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M10 3h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z M9 12h6 M9 16h4" />
        <KPICard title="In Progress" value={tabCounts.progress} iconVariant="orange" iconPath="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        <div className="[&_.bg-\\[rgba\\(59\\,114\\,246\\,0\\.15\\)\\]]:bg-[rgba(168,85,247,0.15)] [&_.text-\\[\\#5E8FFF\\]]:text-[#C084FC]">
            <KPICard title="Pending Approval" value={tabCounts.waiting} iconVariant="blue" iconPath="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12" />
        </div>
        <KPICard title="Completed" value={tabCounts.done} iconVariant="green" iconPath="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" />
      </div>

      <div className="flex flex-wrap items-center gap-[12px]">
        <div className="flex items-center gap-2 w-[240px] h-[36px] px-3 bg-[#1A2235] border border-[#1F2A40] rounded-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[15px] h-[15px] text-[#5A6A85] shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search WO#, device, department…"
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[0.8125rem] text-[#E2E8F0] placeholder:text-[#5A6A85]" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={selectCls}>
          {TYPE_OPTS.map(([v, l]) => <option key={v||'all'} value={v}>{v ? `Type: ${l}` : 'Type: All'}</option>)}
        </select>
        <select value={statusFilter} onChange={handleStatusFilterChange} className={selectCls}>
          {STATUS_OPTS.map(([v, l]) => <option key={v||'all'} value={v}>{v ? `Status: ${l}` : 'Status: All'}</option>)}
        </select>
        <select value={assignedFilter} onChange={e => setAssignedFilter(e.target.value)} className={selectCls}>
          {ASSIGN_OPTS.map(([v, l]) => <option key={v||'all'} value={v}>{v ? `Assigned To: ${l}` : 'All'}</option>)}
        </select>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className={selectCls}>
          {DEPT_OPTS.map(([v, l]) => <option key={v||'all'} value={v}>{v ? `Dept: ${l}` : 'Dept: All'}</option>)}
        </select>
      </div>

      <div className="flex border-b border-[#1F2A40]">
        {TABS.map(tab => (
          <button key={tab.label} type="button" onClick={() => handleTabClick(tab.value)}
            className={clsx('px-4 py-2.5 text-[0.8125rem] font-medium border-b-2 transition-colors',
              activeTab === tab.value ? 'text-[#E2E8F0] border-[#3B72F6]' : 'text-[#94A3B8] border-transparent hover:text-[#E2E8F0]')}>
            {tab.label}
            <span className="ml-1.5 px-[7px] py-px rounded-full bg-[#1F2A40] text-[#94A3B8] text-[0.7rem]">{tabCounts[tab.value]}</span>
          </button>
        ))}
      </div>

      <div className="bg-[#181D2A] border border-[#1F2A40] rounded-[12px] overflow-hidden">
        <DataTable columns={columns} data={paginated} emptyMessage="No work orders match your filters." />
        {renderPagination()}
      </div>

      <Modal
        isOpen={showViewModal && !!selectedWO}
        onClose={() => setShowViewModal(false)}
        title="Work Order Details"
        maxWidth="480px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowViewModal(false)}>Close</ModalCancelBtn>
            <ModalPrimaryBtn onClick={openEditModal} color="#3B72F6">Edit</ModalPrimaryBtn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-[16px]">
          <div><div className="text-[11px] text-[#5A6A85] uppercase mb-1">Work Order ID</div><div className="text-[13px] font-mono text-[#3B82F6]">{selectedWO?.id}</div></div>
          <div><div className="text-[11px] text-[#5A6A85] uppercase mb-1">Created Date</div><div className="text-[13px] text-[#E2E8F0]">{selectedWO && formatDate(selectedWO.created)}</div></div>
          <div><div className="text-[11px] text-[#5A6A85] uppercase mb-1">Device Name</div><div className="text-[13px] text-[#E2E8F0]">{selectedWO?.device}</div></div>
          <div><div className="text-[11px] text-[#5A6A85] uppercase mb-1">Department</div><div className="text-[13px] text-[#E2E8F0]">{selectedWO?.dept}</div></div>
          <div><div className="text-[11px] text-[#5A6A85] uppercase mb-1">Type/Priority</div><div className="mt-1">{selectedWO && <TypeBadge type={selectedWO.type} />}</div></div>
          <div><div className="text-[11px] text-[#5A6A85] uppercase mb-1">Status</div><div className="mt-1">{selectedWO && <StatusBadge variant={selectedWO.status} />}</div></div>
          <div><div className="text-[11px] text-[#5A6A85] uppercase mb-1">Assigned To</div><div className="text-[13px] text-[#E2E8F0]">{selectedWO?.assigned}</div></div>
          <div><div className="text-[11px] text-[#5A6A85] uppercase mb-1">Due Date</div><div className="text-[13px] text-[#E2E8F0]">{selectedWO && formatDate(selectedWO.dueDate)}</div></div>
          
          <div className="col-span-2 mt-2">
            <div className="text-[11px] text-[#5A6A85] uppercase mb-[6px]">Issue Description</div>
            <div className="bg-[#0d1117] border border-[#1F2A40] rounded-lg p-3 max-h-[140px] overflow-y-auto text-[13px] text-[#CBD5E1] whitespace-pre-wrap">
              {selectedWO?.issue}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingWO ? `Edit Work Order ${editingWO.id}` : 'New Work Order'}
        maxWidth="480px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowFormModal(false)} />
            <ModalPrimaryBtn type="submit" form="wo-form" color="#3B72F6">
              {editingWO ? 'Save Changes' : 'Create Work Order'}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="wo-form" onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
          <InputField label="Device Name" name="device" {...register('device', { required: true })} placeholder="e.g. Philips IntelliVue MX800" required />
          
          <div className="grid grid-cols-2 gap-[14px]">
            <SelectField label="Department" name="dept" {...register('dept', { required: true })} placeholder="Select Dept" options={DEPT_OPTS.slice(1).map(([v,l]) => ({value: v, label: l}))} required />
            <SelectField label="Priority/Type" name="type" {...register('type', { required: true })} placeholder="Select Type" options={TYPE_OPTS.slice(1).map(([v,l]) => ({value: v, label: l}))} required />
          </div>

          {editingWO && (
            <SelectField label="Status" name="status" {...register('status')} placeholder="Select Status" options={STATUS_OPTS.slice(1).map(([v,l]) => ({value: v, label: l}))} />
          )}

          <InputField type="textarea" label="Issue Description" name="issue" {...register('issue', { required: true })} placeholder="Describe the issue in detail…" required />

          <div className="grid grid-cols-2 gap-[14px]">
            <SelectField label="Assign To" name="assigned" {...register('assigned', { required: true })} placeholder="Select Assignee" options={ASSIGN_OPTS.slice(1).map(([v,l]) => ({value: v, label: l}))} required />
            <InputField type="date" label="Due Date" name="dueDate" {...register('dueDate')} />
          </div>
        </form>
      </Modal>
    </div>
  )
}

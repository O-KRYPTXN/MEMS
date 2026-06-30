import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import clsx from 'clsx'
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal'
import { users as rawUsers } from '../../data/users'
import KPICard from '../../components/ui/KPICard'
import DataTable from '../../components/tables/DataTable'
import { formatDate } from '../../utils/formatDate'
import { useTranslation } from 'react-i18next'

// Normalize the raw data to match the UI spec
const ROLE_MAP = {
  'admin': 'admin',
  'supervisor': 'supervisor',
  'technician': 'technician',
  'store': 'storekeeper',
  'department': 'department'
}

const initialUsers = rawUsers.map(u => ({
  ...u,
  role: ROLE_MAP[u.role] || u.role,
  lastActive: new Date().toISOString() // Mock last active
}))

const initialPendingRequests = [
  { id: 'REQ-001', name: 'Dr. Sarah Lee', email: 'slee@hospital.com', role: 'supervisor', department: 'Radiology', submitted: '2026-06-25T10:30:00Z', status: 'pending' },
  { id: 'REQ-002', name: 'John Doe', email: 'jdoe@hospital.com', role: 'technician', department: 'ICU', submitted: '2026-06-26T14:15:00Z', status: 'pending' },
]

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function getAvatarColor(role) {
  const map = { 'admin': '#3B72F6', 'supervisor': '#10B981', 'technician': '#F59E0B', 'storekeeper': '#8B5CF6' };
  return map[role] || '#3B72F6';
}

const ROLE_BADGES = {
  admin: 'bg-[rgba(239,68,68,0.15)] text-[#F87171] border border-[rgba(239,68,68,0.3)]',
  supervisor: 'bg-[rgba(59,130,246,0.15)] text-[#60A5FA] border border-[rgba(59,130,246,0.3)]',
  technician: 'bg-[rgba(34,197,94,0.15)] text-[#4ADE80] border border-[rgba(34,197,94,0.3)]',
  storekeeper: 'bg-[rgba(168,85,247,0.15)] text-[#D8B4FE] border border-[rgba(168,85,247,0.3)]',
}

const RoleBadge = ({ role }) => {
  const { t } = useTranslation()
  const cls = ROLE_BADGES[role] || 'bg-[rgba(148,163,184,0.15)] text-[#94A3B8] border border-[rgba(148,163,184,0.3)]'
  return <span className={`inline-block px-2 py-0.5 rounded-[6px] text-[11px] font-semibold ${cls}`}>{t(`roles.${role}`)}</span>
}

const PENDING_BADGES = {
  pending: 'bg-[rgba(245,158,11,0.15)] text-[#FCD34D]',
  approved: 'bg-[rgba(34,197,94,0.15)] text-[#4ADE80]',
  denied: 'bg-[rgba(239,68,68,0.15)] text-[#F87171]',
}

const PendingStatusBadge = ({ status }) => {
  const { t } = useTranslation()
  const cls = PENDING_BADGES[status.toLowerCase()] || ''
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>{t(`status.${status.toLowerCase()}`)}</span>
}

const ROWS_PER_PAGE = 10

const TABS = [
  { tKey: 'users.allRoles', value: 'all' },
  { tKey: 'users.admins', value: 'admin' },
  { tKey: 'roles.supervisor', value: 'supervisor' },
  { tKey: 'users.technicians', value: 'technician' },
  { tKey: 'roles.storekeeper', value: 'storekeeper' },
  { label: 'Pending Requests', value: 'pending' },
]

const ROLE_OPTS = [
  ['', 'all'], ['admin', 'admin'], ['supervisor', 'supervisor'],
  ['technician', 'technician'], ['storekeeper', 'storekeeper']
]

const DEPT_OPTS = [
  ['', 'All'], ['System-wide', 'System-wide'], ['ICU', 'ICU'],
  ['ER', 'ER'], ['Radiology', 'Radiology'], ['Surgery', 'Surgery']
]

const selectCls = 'h-[36px] px-2.5 bg-[#1A2235] border border-[#1F2A40] rounded-lg text-[#E2E8F0] text-[0.8125rem] outline-none'
const inputCls = "w-full bg-[#131823] border border-[#1F2A40] rounded-lg text-[#F8FAFC] text-[13px] px-[13px] py-[10px] outline-none focus:border-[#3B72F6] placeholder:text-[#4A5568]"
const labelCls = "block text-[12px] text-[#94A3B8] uppercase font-semibold tracking-[0.4px] mb-1.5"

const getPageNums = (cur, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  const end = Math.min(total, Math.max(cur + 2, 5))
  const start = Math.max(1, end - 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export default function Users() {
  const { t } = useTranslation()
  const [usersList, setUsersList] = useState(initialUsers)
  const [pendingList, setPendingList] = useState(initialPendingRequests)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  const { register, handleSubmit, reset } = useForm()

  const totalUsers = usersList.length
  const techCount = usersList.filter(u => u.role === 'technician').length
  const superCount = usersList.filter(u => u.role === 'supervisor').length
  const adminCount = usersList.filter(u => u.role === 'admin').length

  const pendingCount = pendingList.filter(p => p.status === 'pending').length

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase()
    return usersList.filter(u => {
      const matchQ = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      const matchRole = !roleFilter || u.role === roleFilter
      const matchDept = !deptFilter || u.department.includes(deptFilter)
      const matchTab = (activeTab === 'all' || activeTab === 'pending') ? true : u.role === activeTab
      return matchQ && matchRole && matchDept && matchTab
    })
  }, [usersList, search, roleFilter, deptFilter, activeTab])

  const filteredPending = useMemo(() => {
    const q = search.toLowerCase()
    return pendingList.filter(p => {
      const matchQ = p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
      const matchRole = !roleFilter || p.role === roleFilter
      const matchDept = !deptFilter || p.department.includes(deptFilter)
      return matchQ && matchRole && matchDept
    })
  }, [pendingList, search, roleFilter, deptFilter])

  useEffect(() => setCurrentPage(1), [search, roleFilter, deptFilter, activeTab])

  const currentList = activeTab === 'pending' ? filteredPending : filteredUsers
  const totalPages = Math.max(1, Math.ceil(currentList.length / ROWS_PER_PAGE))
  const paginated = currentList.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)
  const start = currentList.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1
  const end = Math.min(currentPage * ROWS_PER_PAGE, currentList.length)
  const pageNums = getPageNums(currentPage, totalPages)

  const handleApprove = (req) => {
    setPendingList(list => list.map(p => p.id === req.id ? { ...p, status: 'approved' } : p))
    setUsersList([{
      id: `USR-${String(usersList.length + 1).padStart(3, '0')}`,
      name: req.name,
      email: req.email,
      role: req.role,
      department: req.department,
      status: 'active',
      lastActive: 'Never'
    }, ...usersList])
  }

  const handleDeny = (req) => {
    setPendingList(list => list.map(p => p.id === req.id ? { ...p, status: 'denied' } : p))
  }

  const userColumns = useMemo(() => [
    { key: 'name', label: t('users.name'), 
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: getAvatarColor(row.role) }}>
            {getInitials(val)}
          </div>
          <span className="font-medium text-[#E2E8F0]">{val}</span>
        </div>
      )
    },
    { key: 'email', label: t('users.email') },
    { key: 'role', label: t('users.role'), render: val => <RoleBadge role={val} /> },
    { key: 'department', label: t('users.department') },
    { key: 'lastActive', label: t('users.lastLogin'), render: val => val !== 'Never' ? formatDate(val) : val },
    { key: 'id', label: t('users.actions'), align: 'right',
      render: (val, row) => (
        <div className="flex justify-end">
          <button onClick={(e) => { e.stopPropagation(); setSelectedUser(row); setShowEditModal(true); }} 
            className="w-7 h-7 rounded-md bg-[#1A2235] border border-[#1F2A40] flex items-center justify-center text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1F2A40]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
          </button>
        </div>
      )
    }
  ], [t])

  const pendingColumns = useMemo(() => [
    { key: 'name', label: t('users.name'), 
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: getAvatarColor(row.role) }}>
            {getInitials(val)}
          </div>
          <span className="font-medium text-[#E2E8F0]">{val}</span>
        </div>
      )
    },
    { key: 'email', label: t('users.email') },
    { key: 'role', label: t('users.role'), render: val => <RoleBadge role={val} /> },
    { key: 'department', label: t('users.department') },
    { key: 'submitted', label: 'Submitted', render: val => formatDate(val) },
    { key: 'status', label: t('users.status'), render: val => <PendingStatusBadge status={val} /> },
    { key: 'id', label: t('users.actions'), align: 'right',
      render: (val, row) => {
        if (row.status !== 'pending') return <span className="text-[#5A6A85]">—</span>
        return (
          <div className="flex justify-end gap-2">
            <button onClick={(e) => { e.stopPropagation(); handleApprove(row) }} className="px-2.5 py-1 text-[11px] font-semibold rounded-[6px] border border-[#22c55e] text-[#22c55e] hover:bg-[rgba(34,197,94,0.1)]">✓ Approve</button>
            <button onClick={(e) => { e.stopPropagation(); handleDeny(row) }} className="px-2.5 py-1 text-[11px] font-semibold rounded-[6px] border border-[#ef4444] text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)]">✕ Deny</button>
          </div>
        )
      }
    }
  ], [usersList])

  const renderPagination = () => (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[#1F2A40]">
      <span className="text-[0.8rem] text-[#5A6A85]">
        {currentList.length === 0 ? t('users.noResults') : t('users.showingResults', { start, end, total: currentList.length })}
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

  const onAddSubmit = (data) => {
    const newUser = {
      id: `USR-${String(usersList.length + 1).padStart(3, '0')}`,
      status: 'active',
      lastActive: 'Never',
      ...data
    }
    setUsersList([newUser, ...usersList])
    setShowAddModal(false)
    reset()
  }

  const onEditSubmit = (data) => {
    setUsersList(usersList.map(u => u.id === selectedUser.id ? { ...u, ...data } : u))
    setShowEditModal(false)
    setSelectedUser(null)
  }

  const openAddModal = () => {
    reset({ name: '', email: '', role: '', department: '' })
    setShowAddModal(true)
  }

  useEffect(() => {
    if (selectedUser) {
      reset({ name: selectedUser.name, email: selectedUser.email, role: selectedUser.role, department: selectedUser.department })
    }
  }, [selectedUser, reset])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">{t('users.pageTitle')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">{t('users.pageSubtitle')}</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-[16px]">
        <KPICard title={t('users.totalUsers')} value={totalUsers} iconVariant="blue" iconPath="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        <KPICard title={t('users.technicians')} value={techCount} iconVariant="green" iconPath="M11.42 15.17L17.25 9.34m-5.83 5.83l-2.83 2.83a2.828 2.828 0 11-4-4l2.83-2.83m5.83 5.83l5.66-5.66a2.828 2.828 0 00-4-4l-5.66 5.66m5.83 5.83a2.828 2.828 0 01-4 4l-5.66-5.66a2.828 2.828 0 014-4l5.66 5.66z" />
        <KPICard title={t('roles.supervisor')} value={superCount} iconVariant="orange" iconPath="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        <KPICard title={t('users.admins')} value={adminCount} danger iconVariant="red" iconPath="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </div>

      <div className="flex flex-wrap items-center gap-[12px]">
        <div className="flex items-center gap-2 w-[240px] h-[36px] px-3 bg-[#1A2235] border border-[#1F2A40] rounded-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[15px] h-[15px] text-[#5A6A85] shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('users.searchPlaceholder')}
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[0.8125rem] text-[#E2E8F0] placeholder:text-[#5A6A85]" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selectCls}>
          {ROLE_OPTS.map(([v]) => <option key={v||'all'} value={v}>{v ? `${t('users.role')}: ${t(`roles.${v}`)}` : t('users.allRoles')}</option>)}
        </select>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className={selectCls}>
          {DEPT_OPTS.map(([v, l]) => <option key={v||'all'} value={v}>{v ? `${t('users.department')}: ${l}` : `${t('users.department')}: ${t('common.all')}`}</option>)}
        </select>
        <div className="w-[1px] h-[20px] bg-[#1F2A40]"></div>
        <button type="button" onClick={openAddModal} className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-[#3B72F6] hover:bg-[#2558D8] text-white text-[0.8125rem] font-semibold transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('users.addUser')}
        </button>
      </div>

      <div className="flex border-b border-[#1F2A40] overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.tKey || tab.label} type="button" onClick={() => setActiveTab(tab.value)}
            className={clsx('px-4 py-2.5 text-[0.8125rem] font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5',
              activeTab === tab.value ? 'text-[#E2E8F0] border-[#3B72F6]' : 'text-[#94A3B8] border-transparent hover:text-[#E2E8F0]')}>
            {tab.tKey ? t(tab.tKey) : tab.label}
            {tab.value === 'pending' && pendingCount > 0 && (
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#F59E0B] text-[#000] text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-[#181D2A] border border-[#1F2A40] rounded-[12px] overflow-hidden">
        {activeTab === 'pending' ? (
          <DataTable columns={pendingColumns} data={paginated} emptyMessage={t('users.noResults')} />
        ) : (
          <DataTable columns={userColumns} data={paginated} emptyMessage={t('users.noResults')} />
        )}
        {renderPagination()}
      </div>

      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => { setShowAddModal(false); setShowEditModal(false); }}
        title={showAddModal ? t('users.addUser') : t('users.editUser')}
        maxWidth="28rem"
        footer={
          <>
            <ModalCancelBtn onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>{t('common.cancel')}</ModalCancelBtn>
            <ModalPrimaryBtn type="submit" form="user-form" color="#3B72F6">
              {t('common.save')}
            </ModalPrimaryBtn>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit(showAddModal ? onAddSubmit : onEditSubmit)} className="flex flex-col gap-4">
          <InputField label={t('users.name')} name="name" {...register('name', { required: true })} placeholder="e.g. John Doe" required />
          <InputField type="email" label={t('users.email')} name="email" {...register('email', { required: true })} placeholder="e.g. jdoe@hospital.com" required />

          <div className="grid grid-cols-2 gap-[14px]">
            <SelectField label={t('users.role')} name="role" {...register('role', { required: true })} placeholder="Select Role" options={ROLE_OPTS.slice(1).map(([v]) => ({value: v, label: t(`roles.${v}`)}))} required />
            <SelectField label={t('users.department')} name="department" {...register('department', { required: true })} placeholder="Select Department" options={['System-wide', 'ICU', 'ER', 'Radiology', 'Surgery', 'Central Stores']} required />
          </div>
        </form>
      </Modal>
    </div>
  )
}

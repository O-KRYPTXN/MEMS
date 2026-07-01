import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import FaultTrendLineChart from '../../components/charts/FaultTrendLineChart'
import StatusDonutChart from '../../components/charts/StatusDonutChart'
import DevicesByDeptBarChart from '../../components/charts/DevicesByDeptBarChart'
import clsx from 'clsx'
import KPICard from '../../components/ui/KPICard'
import Panel, { PanelHeader } from '../../components/ui/Panel'
import StatusBadge from '../../components/ui/StatusBadge'
import DataTable from '../../components/tables/DataTable'
import AlertItem from '../../components/ui/AlertItem'
import ProgressBar from '../../components/ui/ProgressBar'
import { workOrders } from '../../data/workOrders'
import { inventory } from '../../data/inventory'
import { alerts as alertsData } from '../../data/alerts'
import { ROUTES } from '../../constants/routes'
import { useTranslation } from 'react-i18next'

const statusKeyMap = {
  open: 'open',
  progress: 'inProgress',
  waiting: 'waitingParts',
  done: 'done',
}

const ICON_DEVICE = 'M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3'
const ICON_WARN = 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
const ICON_WO = 'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375'
const ICON_BOX = 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z'

const svgIcon = (d) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

const ALERT_ICONS = {
  crit: svgIcon(ICON_WARN),
  warn: svgIcon('M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z'),
  info: svgIcon('M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z'),
}

const DEPT_DEVICES = [
  { name: 'ICU', count: 512, pct: 88, color: '#3B72F6' },
  { name: 'Emergency Room', count: 418, pct: 72, color: '#F59E0B' },
  { name: 'Surgery', count: 335, pct: 58, color: '#22C55E' },
  { name: 'Radiology', count: 256, pct: 44, color: '#A855F7' },
  { name: 'Cardiology', count: 187, pct: 32, color: '#EF4444' },
  { name: 'General Ward', count: 128, pct: 22, color: '#94A3B8' },
]



const linkBtn = 'text-[0.8125rem] font-semibold text-[#5E8FFF] hover:text-[#7AA3FF] cursor-pointer bg-transparent border-0'

const Dashboard = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [alertsCleared, setAlertsCleared] = useState(false)

  const openWOCount = workOrders.filter((w) => w.status !== 'done').length
  const urgentCount = workOrders.filter((w) => w.priority === 'high' && w.status !== 'done').length

  const faultData = useMemo(
    () => [2, 1, 3, 4, 2, 5, 3, 6, 4, 3, 2, 4, 5, 7, 6, 8, 5, 4, 6, 5, 7, 9, 6, 8, 7, 5, 6, 4, 7, 5].map((v, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      return { day: d.getDate(), faults: v }
    }),
    []
  )

  const deptData = useMemo(() => [
    { name: 'ICU', value: workOrders.filter((w) => w.department === 'ICU').length, color: '#3B72F6' },
    { name: 'ER', value: workOrders.filter((w) => w.department === 'ER').length, color: '#F59E0B' },
    { name: 'Surgery', value: workOrders.filter((w) => w.department === 'Surgery').length, color: '#22C55E' },
    { name: 'Other', value: workOrders.filter((w) => !['ICU', 'ER', 'Surgery'].includes(w.department)).length, color: '#A855F7' },
  ], [])

  const totalWOs = workOrders.length
  const recentWOs = useMemo(
    () => workOrders.filter((w) => w.status !== 'done').sort((a, b) => {
      const order = { high: 1, medium: 2, low: 3 }
      return order[a.priority] - order[b.priority]
    }).slice(0, 5),
    []
  )

  const lowInventory = useMemo(() => inventory.filter((i) => i.stock <= i.minLevel), [])

  const woColumns = [
    { key: 'id', label: t('dashboard.woNumber'), primary: true },
    { key: 'device', label: t('dashboard.device') },
    { key: 'department', label: t('dashboard.department') },
    { key: 'priority', label: t('common.priority'), render: (val) => <StatusBadge variant={val} label={t(`priority.${val}`)} /> },
    { key: 'status', label: t('common.status'), render: (val) => <StatusBadge variant={val} label={t(`status.${statusKeyMap[val]}`)} /> },
  ]

  const invColumns = [
    { key: 'name', label: t('dashboard.part'), primary: true },
    { key: 'stock', label: t('dashboard.stock'), render: (val, row) => (
      <span className={clsx(val <= row.minLevel * 0.5 ? 'text-[#F87171]' : 'text-[#FCD34D]')}>{val}</span>
    ) },
    { key: 'minLevel', label: t('dashboard.min') },
  ]

  const technicians = ['J. Smith', 'A. Hassan', 'M. Youssef', 'S. Khalid']
  const techColors = ['#EF4444', '#F59E0B', '#3B72F6', '#22C55E']
  const openWOList = workOrders.filter((w) => w.status !== 'done')
  const techCounts = technicians.map((t) => openWOList.filter((w) => w.technician === t).length)
  const maxTechCount = Math.max(...techCounts, 1)

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{t('dashboard.overview')}</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('dashboard.overviewSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => alert('12 PM Work Orders generated successfully.')}
          className="inline-flex items-center gap-[7px] py-[9px] px-[18px] rounded-lg bg-[#3B72F6] hover:bg-[#2558D8] text-white text-[0.8125rem] font-semibold transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[15px] h-[15px]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('dashboard.generatePM')}
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title={t('dashboard.totalDevices')} value="2,418" iconPath={ICON_DEVICE} iconVariant="blue" trend={{ type: 'up', text: '4.2%' }} />
        <KPICard title={t('dashboard.faultRate')} value="1.8%" iconPath={ICON_WARN} iconVariant="red" danger trend={{ type: 'down', text: '+2' }} />
        <KPICard title={t('dashboard.openWorkOrders')} value={openWOCount} iconPath={ICON_WO} iconVariant="orange" trend={{ type: 'warn', text: `${urgentCount} ${t('dashboard.urgent')}` }} />
        <KPICard title={t('dashboard.pmCompliance')} value="94%" iconPath={ICON_BOX} iconVariant="green" trend={{ type: 'warn', text: 'Warning' }} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        <Panel noPadding>
          <PanelHeader title={t('dashboard.faultTrendTitle')} subtitle={t('dashboard.faultTrendSubtitle')}
            action={<button type="button" className={linkBtn}>{t('dashboard.viewReport')}</button>} />
          <div className="p-5">
            <FaultTrendLineChart data={faultData} />
          </div>
        </Panel>

        <Panel noPadding>
          <PanelHeader title={t('dashboard.woByDeptTitle')} subtitle={t('dashboard.woByDeptSubtitle')} />
          <div className="py-5">
            <StatusDonutChart
              data={deptData.map(d => ({ ...d, displayValue: totalWOs ? Math.round((d.value / totalWOs) * 100) + '%' : '0%' }))}
              centerLabel={totalWOs}
              centerSubLabel={t('dashboard.totalWOs')}
            />
          </div>
        </Panel>
      </div>

      {/* Work Orders + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        <Panel noPadding>
          <PanelHeader title={t('dashboard.recentUrgentTitle')} subtitle={t('dashboard.recentUrgentSubtitle')}
            action={<button type="button" className={linkBtn} onClick={() => navigate(ROUTES.ADMIN_WORK_ORDERS)}>{t('dashboard.viewAll')}</button>} />
          <DataTable columns={woColumns} data={recentWOs} />
        </Panel>

        <Panel noPadding>
          <PanelHeader title={t('dashboard.systemAlertsTitle')} subtitle={t('dashboard.systemAlertsSubtitle')}
            action={<button type="button" className={linkBtn} onClick={() => setAlertsCleared(true)}>{t('dashboard.markAllRead')}</button>} />
          {alertsCleared ? (
            <p className="py-8 text-center text-[0.8125rem] text-[var(--text-muted)]">{t('dashboard.allCaughtUp')}</p>
          ) : (
            alertsData.map((a, i) => (
              <AlertItem key={a.id} type={a.type} title={a.title} subtitle={a.subtitle} time={a.time}
                icon={ALERT_ICONS[a.type]} isLast={i === alertsData.length - 1} />
            ))
          )}
        </Panel>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Panel noPadding>
          <PanelHeader title={t('dashboard.technicianWorkloadTitle')} subtitle={t('dashboard.technicianWorkloadSubtitle')} />
          <div className="py-2 px-5">
            {technicians.map((tech, i) => (
              <ProgressBar key={tech} label={tech} value={`${techCounts[i]} ${techCounts[i] === 1 ? t('dashboard.task') : t('dashboard.tasks')}`}
                percentage={Math.round((techCounts[i] / maxTechCount) * 100)} color={techColors[i]} />
            ))}
          </div>
        </Panel>

        <Panel noPadding>
          <PanelHeader title={t('dashboard.inventoryStatusTitle')} subtitle={t('dashboard.inventoryStatusSubtitle')}
            action={<button type="button" className={linkBtn} onClick={() => navigate(ROUTES.ADMIN_INVENTORY)}>{t('dashboard.viewAll')}</button>} />
          <DataTable columns={invColumns} data={lowInventory} />
        </Panel>

        <Panel noPadding>
          <PanelHeader title={t('dashboard.devicesByDeptTitle')} subtitle={t('dashboard.devicesByDeptSubtitle')} />
          <div>
            <DevicesByDeptBarChart data={DEPT_DEVICES} />
          </div>
        </Panel>
      </div>
    </div>
  )
}

export default Dashboard

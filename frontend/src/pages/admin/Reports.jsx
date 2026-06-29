import { useState, useMemo, useEffect } from 'react'
import clsx from 'clsx'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell,
  BarChart, Bar, Legend
} from 'recharts'
import Modal, { ModalCancelBtn } from '../../components/ui/Modal'
import { generatedReports, quickReports } from '../../data/reports'
import KPICard from '../../components/ui/KPICard'
import DataTable from '../../components/tables/DataTable'
import { formatDate } from '../../utils/formatDate'

// --- Mock Chart Data ---
const complianceData = [
  { name: 'Jan', value: 75 }, { name: 'Feb', value: 82 }, { name: 'Mar', value: 80 },
  { name: 'Apr', value: 85 }, { name: 'May', value: 89 }, { name: 'Jun', value: 92 },
  { name: 'Jul', value: 90 }, { name: 'Aug', value: 94 }, { name: 'Sep', value: 95 },
  { name: 'Oct', value: 93 }, { name: 'Nov', value: 91 }, { name: 'Dec', value: 96 },
]

const faultData = [
  { name: 'ICU', value: 40 },
  { name: 'ER', value: 30 },
  { name: 'Surgery', value: 20 },
  { name: 'Other', value: 10 },
]
const FAULT_COLORS = ['#4ADE80', '#FCD34D', '#3B82F6', '#F87171']

const costData = [
  { name: 'Imaging', parts: 4000, labour: 2400 },
  { name: 'Monitors', parts: 3000, labour: 1398 },
  { name: 'Vents', parts: 2000, labour: 9800 },
  { name: 'Pumps', parts: 2780, labour: 3908 },
  { name: 'Lab', parts: 1890, labour: 4800 },
]

const sparePartsData = [
  { name: 'O2 Sensors', count: 145, max: 200, color: '#3b82f6' },
  { name: 'ECG Cables', count: 89, max: 200, color: '#10B981' },
  { name: 'Filters', count: 234, max: 300, color: '#F59E0B' },
  { name: 'BP Cuffs', count: 56, max: 100, color: '#8B5CF6' },
  { name: 'Batteries', count: 12, max: 50, color: '#F87171' },
]

// --- Badges ---
function FormatBadge({ format }) {
  const map = {
    PDF: 'bg-[rgba(239,68,68,0.12)] text-[#F87171] border-[rgba(239,68,68,0.25)]',
    Excel: 'bg-[rgba(34,197,94,0.12)] text-[#4ADE80] border-[rgba(34,197,94,0.25)]',
    CSV: 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D] border-[rgba(245,158,11,0.25)]',
  }
  const cls = map[format] || 'bg-[rgba(148,163,184,0.12)] text-[#94A3B8] border-[rgba(148,163,184,0.25)]'
  return <span className={`inline-block px-2 py-[1px] rounded-[4px] text-[10px] uppercase font-bold tracking-wide border ${cls}`}>{format}</span>
}

function CategoryBadge({ category }) {
  const map = {
    Equipment: 'bg-[rgba(59,130,246,0.15)] text-[#60A5FA]',
    Maintenance: 'bg-[rgba(168,85,247,0.15)] text-[#D8B4FE]',
    Inventory: 'bg-[rgba(245,158,11,0.15)] text-[#FCD34D]',
    Financial: 'bg-[rgba(34,197,94,0.15)] text-[#4ADE80]',
    Compliance: 'bg-[rgba(248,113,113,0.15)] text-[#F87171]',
  }
  const cls = map[category] || 'bg-[rgba(148,163,184,0.15)] text-[#94A3B8]'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {category}
    </span>
  )
}

const ROWS_PER_PAGE = 8

const getPageNums = (cur, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  const end = Math.min(total, Math.max(cur + 2, 5))
  const start = Math.max(1, end - 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

const selectCls = 'h-[36px] px-2.5 bg-[#1A2235] border border-[#1F2A40] rounded-lg text-[#E2E8F0] text-[0.8125rem] outline-none'

export default function Reports() {
  const [reportsList, setReportsList] = useState(generatedReports)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [formatFilter, setFormatFilter] = useState('')
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const filteredReports = useMemo(() => {
    const q = search.toLowerCase()
    return reportsList.filter(r => {
      const matchQ = !q || r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
      const matchCat = !categoryFilter || r.category === categoryFilter
      const matchFmt = !formatFilter || r.format === formatFilter
      return matchQ && matchCat && matchFmt
    })
  }, [reportsList, search, categoryFilter, formatFilter])

  useEffect(() => setCurrentPage(1), [search, categoryFilter, formatFilter])

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / ROWS_PER_PAGE))
  const paginated = filteredReports.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)
  const start = filteredReports.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1
  const end = Math.min(currentPage * ROWS_PER_PAGE, filteredReports.length)
  const pageNums = getPageNums(currentPage, totalPages)

  const handleQuickGenerate = (req) => {
    const newReport = {
      id: `RPT-00${reportsList.length + 49}`,
      name: req.label,
      category: req.category,
      format: req.format,
      date: new Date().toISOString().split('T')[0],
      by: 'Admin',
      size: `${Math.floor(Math.random() * 500 + 100)} KB`
    }
    setReportsList([newReport, ...reportsList])
    showToast(`${req.label} generated successfully!`)
  }

  const columns = useMemo(() => [
    { key: 'id', label: 'Report ID', render: val => <span className="font-mono text-[#3B82F6] font-semibold text-xs">{val}</span> },
    { key: 'name', label: 'Report Name', render: val => <div className="truncate max-w-[260px] font-medium text-[#E2E8F0]">{val}</div> },
    { key: 'category', label: 'Category', render: val => <CategoryBadge category={val} /> },
    { key: 'format', label: 'Format', render: val => <FormatBadge format={val} /> },
    { key: 'date', label: 'Generated', render: val => <span className="text-[#94A3B8]">{formatDate(val)}</span> },
    { key: 'by', label: 'Generated By' },
    { key: 'size', label: 'Size', render: val => <span className="text-[#5A6A85] text-xs font-mono">{val}</span> },
    { key: 'id', label: 'Actions', align: 'right',
      render: (val, row) => (
        <div className="flex justify-end gap-1.5">
          <button onClick={() => { setSelectedReport(row); setShowViewModal(true) }} className="w-7 h-7 rounded-md bg-[#1A2235] border border-[#1F2A40] flex items-center justify-center text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1F2A40]" title="View Report">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </button>
          <button onClick={() => showToast(`Downloading ${row.name}...`)} className="w-7 h-7 rounded-md bg-[#1A2235] border border-[#1F2A40] flex items-center justify-center text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1F2A40]" title="Download">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[14px] h-[14px]"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          </button>
        </div>
      )
    }
  ], [])

  const renderPagination = () => (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[#1F2A40]">
      <span className="text-[0.8rem] text-[#5A6A85]">
        Showing {start}–{end} of {filteredReports.length} reports
      </span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-7 h-7 rounded-md bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8] text-[0.8rem] disabled:opacity-30 disabled:cursor-default">‹</button>
        {pageNums.map(n => (
          <button key={n} type="button" onClick={() => setCurrentPage(n)} className={clsx('w-7 h-7 rounded-md text-[0.8rem]', n === currentPage ? 'bg-[#3B72F6] text-white' : 'bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8]')}>{n}</button>
        ))}
        <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-7 h-7 rounded-md bg-[#1A2235] border border-[#1F2A40] text-[#94A3B8] text-[0.8rem] disabled:opacity-30 disabled:cursor-default">›</button>
      </div>
    </div>
  )

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#181D2A] border border-[#1F2A40] p-2 rounded shadow-lg text-xs">
          <p className="font-semibold text-[#E2E8F0] mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[100] bg-[#10B981] text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">Reports & Analytics</h1>
          <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">Visualize equipment performance, maintenance compliance and operational metrics</p>
        </div>
        <div className="flex gap-2.5">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgba(239,68,68,0.3)] text-[#F87171] text-xs font-semibold hover:bg-[rgba(239,68,68,0.1)] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            Export PDF
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgba(34,197,94,0.3)] text-[#4ADE80] text-xs font-semibold hover:bg-[rgba(34,197,94,0.1)] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            Export Excel
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgba(245,158,11,0.3)] text-[#FCD34D] text-xs font-semibold hover:bg-[rgba(245,158,11,0.1)] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-[16px]">
        <KPICard title="Records Tracked" value="48" iconVariant="blue" iconPath="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        <KPICard title="WO Completion Rate" value="87%" iconVariant="green" iconPath="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <KPICard title="Total Devices Tracked" value="142" iconVariant="orange" iconPath="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
        <KPICard title="Critical Alerts" value="7" danger iconVariant="red" iconPath="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-[#181D2A] border border-[#1F2A40] rounded-xl p-5 flex flex-col">
          <div className="text-[0.875rem] font-bold text-[#E2E8F0] mb-4">PM Compliance Trend</div>
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={complianceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2A40" vertical={false} />
                <XAxis dataKey="name" stroke="#5A6A85" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#5A6A85" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={90} stroke="#F87171" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCompliance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 bg-[#181D2A] border border-[#1F2A40] rounded-xl p-5 flex flex-col items-center">
          <div className="text-[0.875rem] font-bold text-[#E2E8F0] mb-4 w-full text-left">Monthly Fault Summary by Dept</div>
          <div className="relative w-full flex-1 flex items-center justify-center min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={faultData} innerRadius="60%" outerRadius="80%" paddingAngle={2} dataKey="value" stroke="none">
                  {faultData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={FAULT_COLORS[index % FAULT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-[#E2E8F0]">181</span>
              <span className="text-[10px] text-[#5A6A85] uppercase tracking-wider font-semibold">Faults</span>
            </div>
          </div>
          <div className="flex gap-3 mt-4 flex-wrap justify-center">
            {faultData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: FAULT_COLORS[i] }}></div>
                {d.name}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#181D2A] border border-[#1F2A40] rounded-xl p-5 flex flex-col">
          <div className="text-[0.875rem] font-bold text-[#E2E8F0] mb-4">Maintenance Cost by Device Category</div>
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2A40" vertical={false} />
                <XAxis dataKey="name" stroke="#5A6A85" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#5A6A85" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip cursor={{ fill: '#1F2A40', opacity: 0.4 }} content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
                <Bar dataKey="parts" name="Parts Cost" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                <Bar dataKey="labour" name="Labour Cost" stackId="a" fill="#1F2A40" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 bg-[#181D2A] border border-[#1F2A40] rounded-xl p-5 flex flex-col">
          <div className="text-[0.875rem] font-bold text-[#E2E8F0] mb-5">Spare Parts Consumption</div>
          <div className="flex flex-col gap-4 flex-1 justify-center">
            {sparePartsData.map((part) => (
              <div key={part.name} className="w-full">
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-[12px] font-medium text-[#E2E8F0]">{part.name}</span>
                  <span className="text-[11px] font-semibold text-[#94A3B8]">{part.count} <span className="text-[#5A6A85] font-normal">/ {part.max}</span></span>
                </div>
                <div className="w-full h-[6px] rounded-full bg-[#1A2235] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(part.count / part.max) * 100}%`, backgroundColor: part.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-5 mt-2">
        <div className="bg-[#181D2A] border border-[#1F2A40] rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#1F2A40] flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 w-[220px] h-[34px] px-3 bg-[#1A2235] border border-[#1F2A40] rounded-lg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[14px] h-[14px] text-[#5A6A85] shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports..."
                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[0.8125rem] text-[#E2E8F0] placeholder:text-[#5A6A85]" />
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={selectCls + " h-[34px]"}>
              <option value="">All Categories</option>
              <option value="Equipment">Equipment</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Inventory">Inventory</option>
              <option value="Financial">Financial</option>
              <option value="Compliance">Compliance</option>
            </select>
            <select value={formatFilter} onChange={e => setFormatFilter(e.target.value)} className={selectCls + " h-[34px]"}>
              <option value="">All Formats</option>
              <option value="PDF">PDF</option>
              <option value="Excel">Excel</option>
              <option value="CSV">CSV</option>
            </select>
          </div>
          <div className="flex-1">
            <DataTable columns={columns} data={paginated} emptyMessage="No reports match your filters." />
          </div>
          {renderPagination()}
        </div>

        <div className="bg-[#181D2A] border border-[#1F2A40] rounded-xl flex flex-col">
          <div className="p-4 border-b border-[#1F2A40]">
            <div className="text-[0.875rem] font-bold text-[#E2E8F0]">Quick Generate</div>
          </div>
          <div className="flex flex-col p-2 gap-1 overflow-y-auto max-h-[460px]">
            {quickReports.map((r, i) => (
              <div key={i} onClick={() => handleQuickGenerate(r)} className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.03)] cursor-pointer transition-colors">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105" style={{ backgroundColor: `${r.icon}18`, color: r.icon }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[18px] h-[18px]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.8125rem] font-semibold text-[#E2E8F0] truncate">{r.label}</div>
                  <div className="text-[0.7rem] text-[#5A6A85] truncate mt-0.5">{r.sub}</div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <FormatBadge format={r.format} />
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 text-[#5A6A85] group-hover:text-[#E2E8F0] transition-colors"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showViewModal && !!selectedReport}
        onClose={() => setShowViewModal(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(59,130,246,0.15)] text-[#3B82F6] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#E2E8F0] tracking-normal leading-tight">Report Viewer</div>
              <div className="text-[12px] text-[#94A3B8] font-mono leading-tight mt-0.5">{selectedReport?.id} • {selectedReport?.name}</div>
            </div>
          </div>
        }
        maxWidth="42rem"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowViewModal(false)}>Close</ModalCancelBtn>
            <button type="button" onClick={() => { showToast(`Downloading ${selectedReport?.id}...`); setShowViewModal(false); }} className="px-[20px] py-[10px] bg-[#3B72F6] hover:bg-[#2558D8] rounded-lg text-white text-[13px] font-medium transition-colors flex items-center gap-[6px]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[15px] h-[15px]"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              Download {selectedReport?.format}
            </button>
          </>
        }
      >
        <div className="p-5 bg-[#131720] rounded-xl h-[320px] overflow-y-auto text-[13px] text-[#E2E8F0] font-mono leading-relaxed mt-1 border border-[#1F2A40]">
          <div className="mb-4 text-[#3B82F6] font-bold">► EXECUTIVE SUMMARY</div>
          <p className="mb-6 text-[#94A3B8]">Generated on {selectedReport && formatDate(selectedReport.date)} by {selectedReport?.by}. This document contains system-generated analytics for the category: {selectedReport?.category.toUpperCase()}.</p>
          
          <div className="mb-4 text-[#3B82F6] font-bold">► REPORT DETAILS</div>
          <div className="mb-6 space-y-2 text-[#94A3B8]">
            <div>[SYS] Querying data warehouse... OK</div>
            <div>[SYS] Applying filters for {selectedReport?.category}... OK</div>
            <div>[SYS] Formatting data as {selectedReport?.format}... OK</div>
            <br/>
            <div className="border-l-2 border-[#1F2A40] pl-3 text-[#E2E8F0]">
              Row 1: Data point Alpha - Value: {Math.floor(Math.random() * 1000)}<br/>
              Row 2: Data point Beta - Value: {Math.floor(Math.random() * 1000)}<br/>
              Row 3: Data point Gamma - Value: {Math.floor(Math.random() * 1000)}<br/>
              Row 4: Data point Delta - Value: {Math.floor(Math.random() * 1000)}<br/>
              ...<br/>
              Row 128: Data point Omega - Value: {Math.floor(Math.random() * 1000)}
            </div>
          </div>

          <div className="text-center mt-10 text-[#5A6A85] font-bold">*** END OF REPORT ***</div>
        </div>
      </Modal>
    </div>
  )
}

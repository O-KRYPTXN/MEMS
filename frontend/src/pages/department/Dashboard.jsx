import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

const initialRequests = [
  { id: 'REQ-001', device: 'ICU Ventilator V500', desc: 'Screen flickering', status: 'In Progress', date: '2026-06-25' },
  { id: 'REQ-002', device: 'Patient Monitor #12', desc: 'Alarm not triggering', status: 'Pending', date: '2026-06-26' },
  { id: 'REQ-003', device: 'Defibrillator AED-7', desc: 'Battery draining fast', status: 'Pending', date: '2026-06-27' },
  { id: 'REQ-004', device: 'ECG Monitor Pro', desc: 'Printer not working', status: 'Solved', date: '2026-06-20' },
  { id: 'REQ-005', device: 'Infusion Pump IP-400', desc: 'Occlusion false alarms', status: 'In Progress', date: '2026-06-24' },
]

export default function DeptDashboard() {
  const navigate = useNavigate()
  const [requests] = useState(initialRequests)

  const total = requests.length
  const pending = requests.filter(r => r.status === 'Pending').length
  const prog = requests.filter(r => r.status === 'In Progress').length
  const solved = requests.filter(r => r.status === 'Solved').length

  const kpis = [
    { label: 'Total Reports', value: total, bg: 'bg-[rgba(236,72,153,0.15)]', color: 'text-[#F472B6]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375"/> },
    { label: 'Pending Review', value: pending, bg: 'bg-[rgba(59,114,246,0.15)]', color: 'text-[#60A5FA]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2.25m0 1.5h.01M2.25 12a9 9 0 1118 0 9 9 0 01-18 0z"/> },
    { label: 'In Progress', value: prog, bg: 'bg-[rgba(245,158,11,0.15)]', color: 'text-[#FCD34D]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2.25m0 1.5h.01M2.25 12a9 9 0 1118 0 9 9 0 01-18 0z"/> },
    { label: 'Solved Reports', value: solved, bg: 'bg-[rgba(34,197,94,0.15)]', color: 'text-[#4ADE80]', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/> }
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">Overview</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">Monitor devices and active problem reports for your department.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-[#181D2A] border border-[#1F2A40] rounded-[12px] p-[18px] flex flex-row gap-[14px] items-center">
            <div className={`w-[42px] h-[42px] rounded-[10px] flex items-center justify-center shrink-0 ${kpi.bg} ${kpi.color}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                {kpi.icon}
              </svg>
            </div>
            <div>
              <div className="text-[1.5rem] font-[800] text-[#E2E8F0] leading-none">{kpi.value}</div>
              <div className="text-[0.75rem] text-[#94A3B8] font-semibold mt-1">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#181D2A] border border-[#1F2A40] rounded-[12px] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1F2A40]">
          <h2 className="text-[1rem] font-bold text-[#E2E8F0]">Quick Actions</h2>
        </div>
        <div className="p-5 flex flex-row gap-4 flex-wrap">
          <button 
            onClick={() => navigate(ROUTES.DEPT_REQUESTS + '?new=true')} 
            className="bg-[rgba(236,72,153,0.12)] border border-[rgba(236,72,153,0.25)] rounded-lg px-4 py-2 text-[#F472B6] text-[0.8125rem] font-semibold hover:bg-[rgba(236,72,153,0.2)] transition-colors"
          >
            Report a Device Problem
          </button>
          <button 
            onClick={() => navigate(ROUTES.DEPT_REQUESTS)} 
            className="bg-transparent border border-[#1F2A40] rounded-lg px-4 py-2 text-[#94A3B8] text-[0.8125rem] font-semibold hover:border-[#94A3B8] hover:text-[#E2E8F0] transition-colors"
          >
            View All Reports
          </button>
        </div>
      </div>
    </div>
  )
}

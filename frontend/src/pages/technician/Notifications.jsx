import { useState } from 'react'
import clsx from 'clsx'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'

import Panel from '../../components/ui/Panel'

const initialNotifications = [
  { id: 'REQ-1092', itemName: 'O2 Sensor – Nellcor', qty: 2, wo: 'WO-2034', date: '2026-06-27', acknowledged: false },
  { id: 'REQ-1090', itemName: 'ECG Patient Cable 5-Lead', qty: 1, wo: 'WO-2039', date: '2026-06-26', acknowledged: false },
  { id: 'REQ-1088', itemName: 'Defibrillator Pads (Adult)', qty: 5, wo: 'WO-2045', date: '2026-06-25', acknowledged: false }
]

export default function TechnicianNotifications() {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState(initialNotifications)
  const { showToast } = useToastStore()

  const unreadNotifications = notifications.filter(n => !n.acknowledged)

  const handleAcknowledge = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, acknowledged: true } : n))
    showToast(t('techNotifications.toastMarkedRead'), TOAST_COLORS.success)
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('techNotifications.pageTitle')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('techNotifications.pageSubtitle')}</p>
      </div>

      <div className="flex flex-col gap-4">
        {unreadNotifications.length === 0 ? (
          <Panel className="text-center py-12 text-[var(--text-muted)]">
            {t('techNotifications.noNotifications')}
          </Panel>
        ) : (
          unreadNotifications.map(n => (
            <Panel key={n.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 hover:border-[rgba(34,197,94,0.3)] transition-colors">
              <div className="w-12 h-12 rounded-full bg-[rgba(34,197,94,0.12)] text-[#4ADE80] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-[1.05rem] font-bold text-[var(--text-primary)] mb-1">{t('techNotifications.itemArrived', { name: n.itemName })}</h3>
                <p className="text-[0.85rem] text-[var(--text-secondary)] leading-relaxed">
                  {t('techNotifications.requestFulfilled', { id: n.id })} <strong className="text-[var(--text-primary)]">{n.qty}x {n.itemName}</strong> {t('techNotifications.requestFulfilledSuffix')}
                </p>
                <span className="text-xs text-[#A78BFA] block mt-1.5 mb-3 font-semibold">{t('techNotifications.relatedWO', { wo: n.wo })}</span>
                <div className="text-xs text-[var(--text-muted)] font-medium tracking-wide uppercase">{t('techNotifications.dateRequested', { date: n.date })}</div>
              </div>

              <button 
                onClick={() => handleAcknowledge(n.id)} 
                className="bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.25)] text-[#4ADE80] px-4 py-2 rounded-lg text-[0.8rem] font-bold hover:bg-[rgba(34,197,94,0.2)] transition-colors shrink-0 w-full sm:w-auto"
              >
                {t('techNotifications.acknowledge')}
              </button>
            </Panel>
          ))
        )}
      </div>
    </div>
  )
}

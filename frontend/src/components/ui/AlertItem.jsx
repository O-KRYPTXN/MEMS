import clsx from 'clsx'

const AlertItem = ({ type, title, subtitle, time, icon, isLast = false }) => {
  const typeMap = {
    crit: { bg: 'bg-[rgba(239,68,68,0.12)]', text: 'text-[#F87171]' },
    warn: { bg: 'bg-[rgba(245,158,11,0.12)]', text: 'text-[#FCD34D]' },
    info: { bg: 'bg-[rgba(59,114,246,0.12)]', text: 'text-[#5E8FFF]' },
  }

  const styles = typeMap[type] ?? typeMap.info

  return (
    <div
      role="listitem"
      className={clsx(
        'flex items-start gap-3 py-[14px] px-5 border-b border-[#1A2235]',
        isLast && 'border-b-0'
      )}
    >
      <div
        className={clsx(
          'flex items-center justify-center w-8 h-8 rounded-lg shrink-0 [&_svg]:w-4 [&_svg]:h-4',
          styles.bg,
          styles.text
        )}
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[0.8125rem] font-semibold text-[#E2E8F0] truncate">
          {title}
        </div>
        {subtitle && (
          <div className="mt-0.5 text-[0.75rem] text-[#5A6A85]">{subtitle}</div>
        )}
      </div>

      {time && (
        <div className="text-[0.7rem] text-[#5A6A85] whitespace-nowrap shrink-0">
          {time}
        </div>
      )}
    </div>
  )
}

export default AlertItem

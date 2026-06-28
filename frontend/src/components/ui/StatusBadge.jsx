import clsx from 'clsx'

const FALLBACK = {
  bg: 'bg-[rgba(148,163,184,0.12)]',
  text: 'text-[#94A3B8]',
  dot: 'bg-[#94A3B8]',
}

const StatusBadge = ({ variant, label }) => {
  const variantMap = {
    high: { bg: 'bg-[rgba(239,68,68,0.12)]', text: 'text-[#F87171]', dot: 'bg-[#F87171]' },
    medium: { bg: 'bg-[rgba(245,158,11,0.12)]', text: 'text-[#FCD34D]', dot: 'bg-[#FCD34D]' },
    low: { bg: 'bg-[rgba(34,197,94,0.12)]', text: 'text-[#4ADE80]', dot: 'bg-[#4ADE80]' },
    open: { bg: 'bg-[rgba(59,114,246,0.12)]', text: 'text-[#5E8FFF]', dot: 'bg-[#5E8FFF]' },
    progress: { bg: 'bg-[rgba(245,158,11,0.12)]', text: 'text-[#FCD34D]', dot: 'bg-[#FCD34D]' },
    done: { bg: 'bg-[rgba(34,197,94,0.12)]', text: 'text-[#4ADE80]', dot: 'bg-[#4ADE80]' },
    waiting: { bg: 'bg-[rgba(168,85,247,0.12)]', text: 'text-[#C084FC]', dot: 'bg-[#C084FC]' },
    operational: { bg: 'bg-[rgba(34,197,94,0.12)]', text: 'text-[#4ADE80]', dot: 'bg-[#4ADE80]' },
    faulty: { bg: 'bg-[rgba(239,68,68,0.12)]', text: 'text-[#F87171]', dot: 'bg-[#F87171]' },
    maintenance: { bg: 'bg-[rgba(245,158,11,0.12)]', text: 'text-[#FCD34D]', dot: 'bg-[#FCD34D]' },
    decommissioned: { bg: 'bg-[rgba(148,163,184,0.12)]', text: 'text-[#94A3B8]', dot: 'bg-[#94A3B8]' },
  }

  const defaultLabels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    open: 'Open',
    progress: 'In Progress',
    done: 'Done',
    waiting: 'Waiting Parts',
    operational: 'Operational',
    faulty: 'Faulty',
    maintenance: 'Under Maintenance',
    decommissioned: 'Decommissioned',
  }

  const styles = variantMap[variant] ?? FALLBACK
  const displayLabel = label ?? defaultLabels[variant] ?? variant

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-[5px] py-[3px] px-[9px] rounded-full text-[0.7rem] font-semibold',
        styles.bg,
        styles.text
      )}
    >
      <span className={clsx('w-[5px] h-[5px] rounded-full shrink-0', styles.dot)} />
      {displayLabel}
    </span>
  )
}

export default StatusBadge

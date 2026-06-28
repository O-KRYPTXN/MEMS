const ProgressBar = ({ label, value, percentage, color }) => (
  <div>
    <div className="flex items-center justify-between py-[14px] px-[18px] bg-[#1A2235] rounded-lg mb-1">
      <span className="text-[0.8rem] text-[#94A3B8]">{label}</span>
      <span className="text-[0.9rem] font-bold text-[#E2E8F0]">{value}</span>
    </div>
    <div className="h-1 bg-[#1F2A40] rounded-full overflow-hidden mb-2">
      <div
        className="h-full rounded-full"
        style={{ width: `${percentage}%`, backgroundColor: color }}
        aria-hidden="true"
      />
    </div>
  </div>
)

export default ProgressBar

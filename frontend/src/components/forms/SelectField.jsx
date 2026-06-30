import clsx from 'clsx'
import { forwardRef } from 'react'

const SelectField = forwardRef(({
  label, name, options, placeholder = 'Select...', required = false,
  error, value, onChange, className, ...rest
}, ref) => {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={name} className="text-xs text-[#94A3B8] font-semibold uppercase tracking-wide">
        {label}
        {required && <span className="text-[#EF4444] ml-0.5">*</span>}
      </label>

      <select
        id={name} name={name} value={value} onChange={onChange} ref={ref} {...rest}
        className={clsx(
          'w-full bg-[#0d1117] border rounded-lg',
          'text-[#E2E8F0] text-[13px] px-[13px] py-2.5',
          'outline-none transition-colors font-sans cursor-pointer',
          error ? 'border-[#EF4444]' : 'border-[#1F2A40] focus:border-[#3B72F6]'
        )}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => {
          const val = typeof opt === 'string' ? opt : opt.value
          const lbl = typeof opt === 'string' ? opt : opt.label
          return (
            <option key={val} value={val} className="bg-[#1A2235] text-[#E2E8F0]">
              {lbl}
            </option>
          )
        })}
      </select>

      {error && <span className="text-[0.7rem] text-[#EF4444]">{error}</span>}
    </div>
  )
})

SelectField.displayName = 'SelectField'
export default SelectField

import clsx from 'clsx'
import { forwardRef } from 'react'

const InputField = forwardRef(({
  label, name, type = 'text', placeholder, required = false,
  error, value, onChange, min, max, step, rows = 3, className, ...rest
}, ref) => {
  const commonClasses = clsx(
    'w-full bg-[#0d1117] border rounded-lg',
    'text-[#E2E8F0] text-[13px] px-[13px] py-2.5',
    'outline-none transition-colors font-sans',
    'placeholder:text-[#4a5568]',
    error ? 'border-[#EF4444]' : 'border-[#1F2A40] focus:border-[#3B72F6]'
  )

  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={name} className="text-xs text-[#94A3B8] font-semibold uppercase tracking-wide">
        {label}
        {required && <span className="text-[#EF4444] ml-0.5">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          id={name} name={name} rows={rows} placeholder={placeholder}
          value={value} onChange={onChange} ref={ref} {...rest}
          className={clsx(commonClasses, 'resize-y')}
        />
      ) : (
        <input
          id={name} name={name} type={type} placeholder={placeholder}
          min={min} max={max} step={step} value={value} onChange={onChange} ref={ref} {...rest}
          className={commonClasses}
        />
      )}

      {error && <span className="text-[0.7rem] text-[#EF4444]">{error}</span>}
    </div>
  )
})

InputField.displayName = 'InputField'
export default InputField

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ROUTES } from '../../constants/routes'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import clsx from 'clsx'

const categories = ['Respiratory', 'Monitoring', 'Resuscitation', 'Pumps', 'Other']
const departments = ['ICU', 'ER', 'Surgery', 'Radiology', 'General Ward']
const statuses = ['Operational', 'Under Maintenance', 'Faulty']

const labelCls = "text-[0.8rem] font-semibold text-[#94A3B8] block mb-1.5"
const inputBaseCls = "w-full bg-[#131823] border text-[#E2E8F0] px-3 py-2.5 rounded-lg text-[0.875rem] outline-none transition-colors"
const errBorder = "border-[#F87171] focus:border-[#F87171]"
const normBorder = "border-[#1F2A40] focus:border-[#3B72F6]"
const getInputCls = (err) => clsx(inputBaseCls, err ? errBorder : normBorder)
const secHeaderCls = "text-[0.7rem] font-bold text-[#5A6A85] uppercase tracking-wider mb-4 pb-2 border-b border-[#1F2A40] mt-6 first:mt-0"

export default function AddDevice() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToastStore()
  const navigate = useNavigate()

  const onSubmit = (data) => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      showToast('✓ Device added successfully!', TOAST_COLORS.success)
      setTimeout(() => {
        navigate(ROUTES.ADMIN_DEVICES)
      }, 1500)
    }, 1000)
  }

  return (
    <div className="flex flex-col relative pb-10">
      <div className="max-w-[720px] mx-auto w-full mb-6">
        <button 
          onClick={() => navigate(ROUTES.ADMIN_DEVICES)} 
          className="text-[#94A3B8] hover:text-[#E2E8F0] font-semibold text-sm flex items-center gap-2 mb-4 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          Back to Devices
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#E2E8F0]">Add New Device</h1>
          <p className="text-sm text-[#5A6A85] mt-1">Register a new medical device into the hospital equipment catalog.</p>
        </div>
      </div>

      <div className="bg-[#181D2A] border border-[#1F2A40] rounded-xl max-w-[720px] mx-auto w-full overflow-hidden shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-7 flex flex-col">
            
            {/* Section 1 */}
            <h2 className={secHeaderCls}>1. Device Identification</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Device Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. ICU Ventilator V-12"
                  className={getInputCls(errors.deviceName)} 
                  {...register('deviceName', { required: 'Device name is required' })} 
                />
                {errors.deviceName && <p className="text-[0.7rem] font-bold text-[#F87171] mt-1.5">{errors.deviceName.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Serial Number *</label>
                <input 
                  type="text" 
                  placeholder="e.g. SN-8472910"
                  className={getInputCls(errors.serialNumber)} 
                  {...register('serialNumber', { required: 'Serial number is required' })} 
                />
                {errors.serialNumber && <p className="text-[0.7rem] font-bold text-[#F87171] mt-1.5">{errors.serialNumber.message}</p>}
              </div>
            </div>

            {/* Section 2 */}
            <h2 className={secHeaderCls}>2. Classification & Location</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Category *</label>
                <select 
                  className={getInputCls(errors.category)} 
                  {...register('category', { required: 'Select a category' })}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className="text-[0.7rem] font-bold text-[#F87171] mt-1.5">{errors.category.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Department *</label>
                <select 
                  className={getInputCls(errors.department)} 
                  {...register('department', { required: 'Select a department' })}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department && <p className="text-[0.7rem] font-bold text-[#F87171] mt-1.5">{errors.department.message}</p>}
              </div>
            </div>

            {/* Section 3 */}
            <h2 className={secHeaderCls}>3. Lifecycle & Status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Purchase Date *</label>
                <input 
                  type="date" 
                  className={getInputCls(errors.purchaseDate)} 
                  {...register('purchaseDate', { required: 'Purchase date is required' })} 
                />
                {errors.purchaseDate && <p className="text-[0.7rem] font-bold text-[#F87171] mt-1.5">{errors.purchaseDate.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Current Status *</label>
                <select 
                  className={getInputCls(errors.status)} 
                  {...register('status', { required: 'Select initial status' })}
                >
                  <option value="">Select Status</option>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.status && <p className="text-[0.7rem] font-bold text-[#F87171] mt-1.5">{errors.status.message}</p>}
              </div>
            </div>

            {/* Section 4 */}
            <h2 className={secHeaderCls}>4. Additional Information</h2>
            <div>
              <label className={labelCls}>Notes (Optional)</label>
              <textarea 
                placeholder="Add any maintenance notes, warranty info or specific configurations..."
                className={clsx(getInputCls(false), "min-h-[80px] resize-y")} 
                {...register('notes')} 
              />
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-5 px-7 border-t border-[#1F2A40] bg-[#131720] flex justify-end gap-3 rounded-b-xl">
            <button 
              type="button" 
              onClick={() => navigate(ROUTES.ADMIN_DEVICES)}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-[#94A3B8] bg-transparent hover:text-[#E2E8F0] hover:bg-[#1A2235] transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-[#3B72F6] hover:bg-[#2563EB] disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[140px]"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Save Device'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

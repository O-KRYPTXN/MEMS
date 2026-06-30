import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
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
              <InputField label="Device Name *" name="deviceName" {...register('deviceName', { required: 'Device name is required' })} placeholder="e.g. ICU Ventilator V-12" required error={errors.deviceName?.message} />
              <InputField label="Serial Number *" name="serialNumber" {...register('serialNumber', { required: 'Serial number is required' })} placeholder="e.g. SN-8472910" required error={errors.serialNumber?.message} />
            </div>

            {/* Section 2 */}
            <h2 className={secHeaderCls}>2. Classification & Location</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField label="Category *" name="category" {...register('category', { required: 'Select a category' })} placeholder="Select Category" options={categories.map(c => ({value: c, label: c}))} required error={errors.category?.message} />
              <SelectField label="Department *" name="department" {...register('department', { required: 'Select a department' })} placeholder="Select Department" options={departments.map(d => ({value: d, label: d}))} required error={errors.department?.message} />
            </div>

            {/* Section 3 */}
            <h2 className={secHeaderCls}>3. Lifecycle & Status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField type="date" label="Purchase Date *" name="purchaseDate" {...register('purchaseDate', { required: 'Purchase date is required' })} required error={errors.purchaseDate?.message} />
              <SelectField label="Current Status *" name="status" {...register('status', { required: 'Select initial status' })} placeholder="Select Status" options={statuses.map(s => ({value: s, label: s}))} required error={errors.status?.message} />
            </div>

            {/* Section 4 */}
            <h2 className={secHeaderCls}>4. Additional Information</h2>
            <InputField type="textarea" label="Notes (Optional)" name="notes" {...register('notes')} placeholder="Add any maintenance notes, warranty info or specific configurations..." />

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

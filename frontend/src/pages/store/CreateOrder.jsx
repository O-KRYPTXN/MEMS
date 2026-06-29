import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

const inputCls = "w-full bg-[#1A2235] border border-[#1F2A40] text-[#E2E8F0] px-3 py-2.5 rounded-lg text-[0.875rem] outline-none focus:border-[#8B5CF6] transition-colors"
const labelCls = "block text-[0.8rem] text-[#94A3B8] font-semibold mb-1.5"

export default function StoreCreateOrder() {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    supplier: '',
    email: '',
    item: '',
    qty: 1,
    date: ''
  })
  const [toast, setToast] = useState({ show: false, msg: '' })

  useEffect(() => {
    const prefillItem = searchParams.get('item')
    if (prefillItem) setFormData(prev => ({ ...prev, item: prefillItem }))
  }, [searchParams])

  const showToast = (msg) => {
    setToast({ show: true, msg })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const id = 'PO-' + Math.floor(Math.random() * 9000 + 1000)
    const subject = encodeURIComponent('New Purchase Order ' + id + ' - MEMS Facility')
    const body = encodeURIComponent(
      'Hello ' + formData.supplier + ',\n\n' +
      'Please process the following order:\n\n' +
      'Order ID: ' + id + '\n' +
      'Item: ' + formData.item + '\n' +
      'Quantity: ' + formData.qty + '\n' +
      'Expected Delivery: ' + formData.date + '\n\n' +
      'Please confirm receipt of this order and reply with shipping details.\n\n' +
      'Thank you,\nMEMS Storekeeper'
    )
    
    window.open(`mailto:${formData.email}?subject=${subject}&body=${body}`, '_blank')

    const orders = JSON.parse(localStorage.getItem('mems_custom_orders') || '[]')
    orders.push({ ...formData, id, status: 'pending' })
    localStorage.setItem('mems_custom_orders', JSON.stringify(orders))

    showToast('✓ Order submitted and email sent to supplier.')
    setFormData({ supplier: '', email: '', item: '', qty: 1, date: '' })
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">Create Purchase Order</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">Draft a new order for spare parts and automatically email the supplier.</p>
      </div>

      <div className="bg-[#181D2A] border border-[#1F2A40] rounded-xl max-w-3xl overflow-hidden shadow-lg">
        <div className="p-5 border-b border-[#1F2A40]">
          <h2 className="text-base font-bold text-[#E2E8F0]">Order Details</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Supplier Name</label>
                <input type="text" value={formData.supplier} onChange={e => setFormData(f => ({ ...f, supplier: e.target.value }))} className={inputCls} required placeholder="e.g. MedSupply Inc." />
              </div>
              <div>
                <label className={labelCls}>Supplier Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} className={inputCls} required placeholder="sales@medsupply.com" />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Item Name / Part Code</label>
                <input type="text" value={formData.item} onChange={e => setFormData(f => ({ ...f, item: e.target.value }))} className={inputCls} required placeholder="e.g. O2 Sensor - Nellcor" />
              </div>
              <div>
                <label className={labelCls}>Quantity</label>
                <input type="number" min="1" value={formData.qty} onChange={e => setFormData(f => ({ ...f, qty: e.target.value }))} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Expected Delivery Date</label>
                <input type="date" value={formData.date} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} className={inputCls} required />
              </div>
            </div>

            <div className="bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.2)] rounded-lg p-3.5 flex items-center gap-3 text-sm text-[#D8B4FE]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
              <span>Submitting this form will generate a PO number and open your default email client with a pre-formatted message.</span>
            </div>
          </div>

          <div className="p-5 border-t border-[#1F2A40] flex justify-end gap-3 bg-[#131720]">
            <button type="button" onClick={() => setFormData({ supplier: '', email: '', item: '', qty: 1, date: '' })} className="px-4 py-2 bg-transparent border border-[#1F2A40] rounded-lg text-[#94A3B8] text-[13px] font-bold hover:border-[#94A3B8] hover:text-[#E2E8F0] transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg text-[13px] font-bold transition-colors">
              Submit & Send Email
            </button>
          </div>
        </form>
      </div>

      {toast.show && (
        <div className="fixed bottom-7 right-7 z-[2000] bg-[#8B5CF6] text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl transition-transform duration-300 animate-slide-up">
          {toast.msg}
        </div>
      )}
    </div>
  )
}

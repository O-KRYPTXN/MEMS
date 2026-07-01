import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import InputField from '../../components/forms/InputField'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'


export default function StoreCreateOrder() {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    supplier: '',
    email: '',
    item: '',
    qty: 1,
    date: ''
  })
  
  const { t } = useTranslation()
  const { showToast } = useToastStore()

  useEffect(() => {
    const prefillItem = searchParams.get('item')
    if (prefillItem) setFormData(prev => ({ ...prev, item: prefillItem }))
  }, [searchParams])

  const handleSubmit = (e) => {
    e.preventDefault()
    const id = 'PO-' + Math.floor(Math.random() * 9000 + 1000)
    const subject = encodeURIComponent(t('storeCreateOrder.emailSubject', 'New Purchase Order {{id}} - MEMS Facility', { id }))
    const body = encodeURIComponent(
      t('storeCreateOrder.emailGreeting', 'Hello {{supplier}},', { supplier: formData.supplier }) + '\n\n' +
      t('storeCreateOrder.emailProcessMsg', 'Please process the following order:') + '\n\n' +
      t('storeCreateOrder.emailOrderId', 'Order ID: {{id}}', { id }) + '\n' +
      t('storeCreateOrder.emailItem', 'Item: {{item}}', { item: formData.item }) + '\n' +
      t('storeCreateOrder.emailQty', 'Quantity: {{qty}}', { qty: formData.qty }) + '\n' +
      t('storeCreateOrder.emailDelivery', 'Expected Delivery: {{date}}', { date: formData.date }) + '\n\n' +
      t('storeCreateOrder.emailConfirmMsg', 'Please confirm receipt of this order and reply with shipping details.') + '\n\n' +
      t('storeCreateOrder.emailSignoff', 'Thank you,\nMEMS Storekeeper')
    )
    
    window.open(`mailto:${formData.email}?subject=${subject}&body=${body}`, '_blank')

    const orders = JSON.parse(localStorage.getItem('mems_custom_orders') || '[]')
    orders.push({ ...formData, id, status: 'pending' })
    localStorage.setItem('mems_custom_orders', JSON.stringify(orders))

    showToast(t('storeCreateOrder.toastSubmitted', '✓ Order submitted and email sent to supplier.'), TOAST_COLORS.store)
    setFormData({ supplier: '', email: '', item: '', qty: 1, date: '' })
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[#E2E8F0]">{t('storeCreateOrder.pageTitle', 'Create Purchase Order')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[#5A6A85]">{t('storeCreateOrder.pageSubtitle', 'Draft a new order for spare parts and automatically email the supplier.')}</p>
      </div>

      <div className="bg-[#181D2A] border border-[#1F2A40] rounded-xl max-w-3xl overflow-hidden shadow-lg">
        <div className="p-5 border-b border-[#1F2A40]">
          <h2 className="text-base font-bold text-[#E2E8F0]">{t('storeCreateOrder.orderDetails', 'Order Details')}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField label={t('storeCreateOrder.supplierName', 'Supplier Name')} name="supplier" value={formData.supplier} onChange={e => setFormData(f => ({ ...f, supplier: e.target.value }))} placeholder="e.g. MedSupply Inc." required />
              <InputField type="email" label={t('storeCreateOrder.supplierEmail', 'Supplier Email')} name="email" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} placeholder="sales@medsupply.com" required />
              <div className="md:col-span-2">
                <InputField label={t('storeCreateOrder.itemName', 'Item Name / Part Code')} name="item" value={formData.item} onChange={e => setFormData(f => ({ ...f, item: e.target.value }))} placeholder="e.g. O2 Sensor - Nellcor" required />
              </div>
              <InputField type="number" min="1" label={t('storeCreateOrder.quantity', 'Quantity')} name="qty" value={formData.qty} onChange={e => setFormData(f => ({ ...f, qty: e.target.value }))} required />
              <InputField type="date" label={t('storeCreateOrder.expectedDelivery', 'Expected Delivery Date')} name="date" value={formData.date} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} required />
            </div>

            <div className="bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.2)] rounded-lg p-3.5 flex items-center gap-3 text-sm text-[#D8B4FE]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
              <span>{t('storeCreateOrder.disclaimer', 'Submitting this form will generate a PO number and open your default email client with a pre-formatted message.')}</span>
            </div>
          </div>

          <div className="p-5 border-t border-[#1F2A40] flex justify-end gap-3 bg-[#131720]">
            <button type="button" onClick={() => setFormData({ supplier: '', email: '', item: '', qty: 1, date: '' })} className="px-4 py-2 bg-transparent border border-[#1F2A40] rounded-lg text-[#94A3B8] text-[13px] font-bold hover:border-[#94A3B8] hover:text-[#E2E8F0] transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" className="px-5 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg text-[13px] font-bold transition-colors">
              {t('storeCreateOrder.submitBtn', 'Submit & Send Email')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

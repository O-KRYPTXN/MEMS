import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import InputField from '../../components/forms/InputField'
import SelectField from '../../components/forms/SelectField'
import { useToastStore, TOAST_COLORS } from '../../store/toastStore'
import { useTranslation } from 'react-i18next'
import Panel from '../../components/ui/Panel'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as partsService from '../../api/partsService'
import * as storeOrdersService from '../../api/storeOrdersService'

export default function StoreCreateOrder() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { showToast } = useToastStore()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    supplierName: '',
    supplierEmail: '',
    notes: ''
  })

  const [items, setItems] = useState([{ partId: '', qty: 1, unitPrice: 0 }])

  const { data: partsData } = useQuery({
    queryKey: ['parts'],
    queryFn: () => partsService.getParts({ limit: 1000 })
  })

  const parts = partsData?.items || []

  const handleItemChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value

    if (field === 'partId') {
      const selectedPart = parts.find(p => p.id === value)
      if (selectedPart) {
        newItems[index].unitPrice = selectedPart.unitPrice || 0
      }
    }

    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, { partId: '', qty: 1, unitPrice: 0 }])
  }

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
  }

  const createMutation = useMutation({
    mutationFn: storeOrdersService.createStoreOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(['storeOrders'])
      showToast(t('storeCreateOrder.toastSubmitted', '✓ Order created successfully.'), TOAST_COLORS.store)
      navigate('/store/orders')
    },
    onError: (error) => {
      showToast(error.response?.data?.message || t('common.errorOccurred'), TOAST_COLORS.error)
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validation
    if (items.some(item => !item.partId || item.qty < 1 || item.unitPrice < 0)) {
      showToast(t('storeCreateOrder.errorItems', 'Please ensure all items have a part selected, positive quantity, and non-negative price.'), TOAST_COLORS.error)
      return
    }

    createMutation.mutate({
      ...formData,
      items: items.map(item => ({
        partId: item.partId,
        qty: Number(item.qty),
        unitPrice: Number(item.unitPrice)
      }))
    })
  }

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <div>
        <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">{t('storeCreateOrder.pageTitle', 'Create Purchase Order')}</h1>
        <p className="mt-[3px] text-[0.8125rem] text-[var(--text-muted)]">{t('storeCreateOrder.pageSubtitle', 'Draft a new order for spare parts.')}</p>
      </div>

      <Panel noPadding className="max-w-4xl shadow-lg">
        <div className="p-5 border-b border-[var(--border)]">
          <h2 className="text-base font-bold text-[var(--text-primary)]">{t('storeCreateOrder.orderDetails', 'Order Details')}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField label={t('storeCreateOrder.supplierName', 'Supplier Name')} value={formData.supplierName} onChange={e => setFormData(f => ({ ...f, supplierName: e.target.value }))} placeholder="e.g. MedSupply Inc." required />
              <InputField type="email" label={t('storeCreateOrder.supplierEmail', 'Supplier Email (Optional)')} value={formData.supplierEmail} onChange={e => setFormData(f => ({ ...f, supplierEmail: e.target.value }))} placeholder="sales@medsupply.com" />
            </div>

            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="bg-[var(--bg-table-header)] px-4 py-3 border-b border-[var(--border)] flex justify-between items-center">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{t('storeCreateOrder.orderItems', 'Order Items')}</h3>
                <button type="button" onClick={addItem} className="text-[12px] font-bold text-[#8B5CF6] hover:text-[#7C3AED]">+ {t('storeCreateOrder.addItem', 'Add Item')}</button>
              </div>
              <div className="p-4 flex flex-col gap-4">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-[var(--bg-input)] p-3 rounded-lg border border-[var(--border)]">
                    <div className="flex-1 w-full">
                      <SelectField
                        label={t('storeCreateOrder.part', 'Select Part')}
                        value={item.partId}
                        onChange={(e) => handleItemChange(index, 'partId', e.target.value)}
                        options={parts.map(p => ({
                          value: p.id,
                          label: `${p.name} (${p.partCode}) - Stock: ${p.qty}`
                        }))}
                        required
                      />
                    </div>
                    <div className="w-full md:w-24">
                      <InputField
                        type="number"
                        min="1"
                        label={t('storeCreateOrder.qty', 'Qty')}
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                        required
                      />
                    </div>
                    <div className="w-full md:w-32">
                      <InputField
                        type="number"
                        step="0.01"
                        min="0"
                        label={t('storeCreateOrder.unitPrice', 'Unit Price ($)')}
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        required
                      />
                    </div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(index)} className="mt-6 md:mt-0 p-2 text-[var(--text-muted)] hover:text-red-500 transition-colors">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <InputField type="textarea" label={t('storeCreateOrder.notes', 'Notes')} value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional instructions..." />
          </div>

          <div className="p-5 border-t border-[var(--border)] flex justify-end gap-3 bg-[var(--bg-card)]">
            <button type="button" onClick={() => navigate('/store/orders')} className="px-4 py-2 bg-transparent border border-[var(--border)] rounded-lg text-[var(--text-secondary)] text-[13px] font-bold hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={createMutation.isPending} className="px-5 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white rounded-lg text-[13px] font-bold transition-colors">
              {createMutation.isPending ? t('common.loading') : t('storeCreateOrder.submitBtn', 'Create Order')}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  )
}

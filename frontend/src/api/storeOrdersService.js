import api from './axios'

export const createStoreOrder = async (orderData) => {
  const { data } = await api.post('/store-orders', orderData)
  return data.data
}

export const getStoreOrders = async (params = {}) => {
  const { data } = await api.get('/store-orders', { params })
  return data
}

export const getStoreOrderById = async (id) => {
  const { data } = await api.get(`/store-orders/${id}`)
  return data.data
}

export const updateStoreOrderStatus = async ({ id, data }) => {
  const response = await api.patch(`/store-orders/${id}/status`, data)
  return response.data.data
}

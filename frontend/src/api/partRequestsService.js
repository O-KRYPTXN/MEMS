import api from './axios';

export const createPartRequest = async (data) => {
  const response = await api.post('/part-requests', data);
  return response.data.data;
};

export const getPartRequests = async (params) => {
  const response = await api.get('/part-requests', { params });
  return response.data.data;
};

export const getPartRequestById = async (id) => {
  const response = await api.get(`/part-requests/${id}`);
  return response.data.data;
};

export const updatePartRequestStatus = async ({ id, data }) => {
  const response = await api.patch(`/part-requests/${id}/status`, data);
  return response.data.data;
};

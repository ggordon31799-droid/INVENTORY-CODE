import api from './api';

export const adjustmentApi = {
  create: (data: Record<string, any>) => api.post('/api/v1/adjustments', data),
  list: (params?: Record<string, any>) => api.get('/api/v1/adjustments', { params }),
  get: (id: number) => api.get(`/api/v1/adjustments/${id}`),
};

export const cycleCountApi = {
  create: (data: Record<string, any>) => api.post('/api/v1/cycle-counts', data),
  list: (params?: Record<string, any>) => api.get('/api/v1/cycle-counts', { params }),
  get: (id: number) => api.get(`/api/v1/cycle-counts/${id}`),
  updateLine: (countId: number, lineId: number, data: Record<string, any>) =>
    api.patch(`/api/v1/cycle-counts/${countId}/lines/${lineId}`, data),
  review: (id: number) => api.post(`/api/v1/cycle-counts/${id}/review`),
  finalize: (id: number, data: Record<string, any>) =>
    api.post(`/api/v1/cycle-counts/${id}/finalize`, data),
};

export const transferApi = {
  create: (data: Record<string, any>) => api.post('/api/v1/transfers', data),
  list: (params?: Record<string, any>) => api.get('/api/v1/transfers', { params }),
};

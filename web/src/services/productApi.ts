import api from './api';

const BASE = '/api/v1/products';

export const productApi = {
  list: (params?: Record<string, any>) => api.get(BASE, { params }),
  get: (id: number) => api.get(`${BASE}/${id}`),
  create: (data: Record<string, any>) => api.post(BASE, data),
  update: (id: number, data: Record<string, any>) => api.patch(`${BASE}/${id}`, data),
  lookup: (barcode: string) => api.get(`${BASE}/lookup`, { params: { barcode } }),
  getCostHistory: (id: number, params?: Record<string, any>) =>
    api.get(`${BASE}/${id}/cost-history`, { params }),
  getLedger: (id: number, params?: Record<string, any>) =>
    api.get(`${BASE}/${id}/ledger`, { params }),
  getMappings: (id: number) => api.get(`${BASE}/${id}/mappings`),
  addMapping: (id: number, data: Record<string, any>) =>
    api.post(`${BASE}/${id}/mappings`, data),
  deleteMapping: (id: number, mappingId: number) =>
    api.delete(`${BASE}/${id}/mappings/${mappingId}`),
};

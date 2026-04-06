import api from './api';

const BASE = '/api/v1/purchase-orders';

export const purchaseOrderApi = {
  list: (params?: Record<string, any>) => api.get(BASE, { params }),
  get: (id: number) => api.get(`${BASE}/${id}`),
  create: (data: Record<string, any>) => api.post(BASE, data),
  update: (id: number, data: Record<string, any>) => api.patch(`${BASE}/${id}`, data),
  close: (id: number) => api.post(`${BASE}/${id}/close`),
  void: (id: number) => api.patch(`${BASE}/${id}/void`),
  receive: (id: number, data: Record<string, any>) => api.post(`${BASE}/${id}/receive`, data),
  getReceipts: (id: number) => api.get(`${BASE}/${id}/receipts`),
  getReceipt: (id: number) => api.get(`/api/v1/receipts/${id}`),
};

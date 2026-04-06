import api from './api';

const BASE = '/api/v1/orders';

export const orderApi = {
  list: (params?: Record<string, any>) => api.get(BASE, { params }),
  get: (id: number) => api.get(`${BASE}/${id}`),
  create: (data: Record<string, any>) => api.post(BASE, data),
  cancel: (id: number) => api.patch(`${BASE}/${id}/cancel`),
  sync: () => api.post(`${BASE}/sync`),
  today: () => api.get(`${BASE}/today`),
  scanLookup: (code: string) => api.get(`${BASE}/scan-lookup`, { params: { code } }),
  ship: (id: number, data: Record<string, any>) => api.post(`${BASE}/${id}/ship`, data),
  batchShip: (data: Record<string, any>) => api.post(`${BASE}/batch-ship`, data),
  getShipments: (id: number) => api.get(`${BASE}/${id}/shipments`),
  resolveLine: (orderId: number, lineId: number, productId: number) =>
    api.patch(`${BASE}/${orderId}/lines/${lineId}/resolve`, { product_id: productId }),
};

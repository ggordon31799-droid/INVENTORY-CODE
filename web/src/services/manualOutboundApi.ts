import api from './api';

const BASE = '/api/v1/manual-outbound';

export const manualOutboundApi = {
  list: (params?: Record<string, any>) => api.get(BASE, { params }),
  get: (id: number) => api.get(`${BASE}/${id}`),
  create: (data: Record<string, any>) => api.post(BASE, data),
  damagedReport: (params?: Record<string, any>) => api.get(`${BASE}/damaged-report`, { params }),
  updateClaimStatus: (id: number, data: Record<string, any>) =>
    api.patch(`${BASE}/${id}/claim-status`, data),
  applyCredit: (id: number, data: Record<string, any>) =>
    api.patch(`${BASE}/${id}/credit`, data),
};

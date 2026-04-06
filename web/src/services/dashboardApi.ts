import api from './api';

const BASE = '/api/v1/dashboard';

export const dashboardApi = {
  summary: () => api.get(`${BASE}/summary`),
  alerts: () => api.get(`${BASE}/alerts`),
  activity: (params?: Record<string, any>) => api.get(`${BASE}/activity`, { params }),
  todaysWork: () => api.get(`${BASE}/todays-work`),
};

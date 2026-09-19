import axios from 'axios';

let BASE_URL = localStorage.getItem('vms_guard_base_url') || 'https://smsavms.onrender.com';

export const getBaseUrl = () => BASE_URL;

export const setBaseUrl = (url) => {
  BASE_URL = url.replace(/\/+$/, '');
  localStorage.setItem('vms_guard_base_url', BASE_URL);
  api.defaults.baseURL = `${BASE_URL}/api`;
};

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('guard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const loginGuard = async (credentials) => {
  const res = await api.post('/auth/guard-login', credentials);
  return res.data;
};

// Pass Verification & Check-in / Check-out
export const verifyPass = async (passCode) => {
  const res = await api.get(`/passes/verify/${passCode}`);
  return res.data;
};

export const scanPass = async (payload) => {
  const res = await api.post('/passes/scan', payload);
  return res.data;
};

export const checkInVisitor = async (payload) => {
  const res = await api.post('/passes/check-in', payload);
  return res.data;
};

export const checkOutVisitor = async (payload) => {
  const res = await api.post('/passes/check-out', payload);
  return res.data;
};

// Gate Logs & Stats
export const getGateLogs = async (params) => {
  const res = await api.get('/gate-logs', { params });
  return res.data;
};

export const getVisitorsInside = async (params) => {
  const res = await api.get('/visitors/inside', { params });
  return res.data;
};

// Incident Reports
export const submitIncidentReport = async (reportData) => {
  const res = await api.post('/incidents', reportData);
  return res.data;
};

// Spot / Walk-in Registration
export const registerSpotVisitor = async (visitorData) => {
  const res = await api.post('/passes/spot-register', visitorData);
  return res.data;
};

export default api;

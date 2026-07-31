import axios from 'axios';

const API_BASE = '/api';

export const emergencyApi = {
  // 1. POST /api/emergency/create
  createIncident: async (payload) => {
    const res = await axios.post(`${API_BASE}/emergency/create`, payload);
    return res.data;
  },

  // 2. GET /api/emergency/pending
  getPending: async () => {
    const res = await axios.get(`${API_BASE}/emergency/pending`);
    return res.data;
  },

  // 3. POST /api/emergency/assign
  assignResponder: async (payload) => {
    const res = await axios.post(`${API_BASE}/emergency/assign`, payload);
    return res.data;
  },

  // 4. PATCH /api/emergency/status
  updateStatus: async (payload) => {
    const res = await axios.patch(`${API_BASE}/emergency/status`, payload);
    return res.data;
  },

  // 5. GET /api/emergency/active
  getActive: async () => {
    const res = await axios.get(`${API_BASE}/emergency/active`);
    return res.data;
  },

  // 6. POST /api/emergency/notify-dispatch
  notifyExternalDispatch: async (payload) => {
    const res = await axios.post(`${API_BASE}/emergency/notify-dispatch`, payload);
    return res.data;
  },

  // 7. POST /api/ai/classify-priority
  classifyPriority: async (description) => {
    const res = await axios.post(`${API_BASE}/ai/classify-priority`, { description });
    return res.data;
  },

  // Auxiliary: GET /api/emergency/responders
  getResponders: async () => {
    const res = await axios.get(`${API_BASE}/emergency/responders`);
    return res.data;
  },
};

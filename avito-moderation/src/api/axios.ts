import axios from "axios";

// базовый инстанс API
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// запрос объявления по id
export const getAdById = async (id: number | string) => {
  const res = await api.get(`/ads/${id}`);
  return res.data;
};

// одобрение объявления
export const approveAd = async (id: number | string) => {
  const res = await api.post(`/ads/${id}/approve`);
  return res.data;
};

// отклонение объявления
export const rejectAd = async (
  id: number | string,
  payload: { reason: string; comment?: string }
) => {
  const res = await api.post(`/ads/${id}/reject`, payload);
  return res.data;
};

// запрос изменений
export const requestChangesAd = async (
  id: number | string,
  payload: { reason: string; comment?: string }
) => {
  const res = await api.post(`/ads/${id}/request-changes`, payload);
  return res.data;
};

// статистика: сводка
export const getStatsSummary = async () => {
  const res = await api.get("/stats/summary");
  return res.data;
};

// статистика: активность
export const getActivityChart = async () => {
  const res = await api.get("/stats/chart/activity");
  return res.data;
};

// статистика: решения
export const getDecisionsChart = async () => {
  const res = await api.get("/stats/chart/decisions");
  return res.data;
};

// статистика: категории
export const getCategoriesChart = async () => {
  const res = await api.get("/stats/chart/categories");
  return res.data;
};

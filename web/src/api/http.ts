import axios, { type AxiosError } from 'axios';

const TOKEN_KEY = 'XXQG_TOKEN';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token: string) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export interface ApiBody<T = unknown> {
  success?: boolean;
  code?: number;
  message?: string;
  result?: T;
  timestamp?: number;
}

export interface PageResult<T = Row> {
  records?: T[];
  list?: T[];
  total?: number;
  size?: number;
  current?: number;
}

export type Row = Record<string, unknown>;

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/preins',
  timeout: 30000,
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.set('X-Access-Token', token);
  }
  return config;
});

http.interceptors.response.use(
  (response) => {
    const data = response.data as ApiBody | string | null;
    if (typeof data !== 'object' || data == null) return response;
    if (data.success === false || (typeof data.code === 'number' && data.code !== 0 && data.code !== 200)) {
      return Promise.reject(new Error(data.message || '请求失败'));
    }
    response.data = data.result;
    return response;
  },
  (error: AxiosError<ApiBody>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || '网络异常';
    if (status === 401 || status === 403) {
      setToken('');
      const path = window.location.pathname;
      if (!path.endsWith('/login')) {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.assign(`/login?redirect=${redirect}`);
      }
    }
    return Promise.reject(new Error(message));
  },
);

export async function fetchPage(url: string, params: Record<string, unknown> = {}) {
  const result = (await http.get(url, { params })).data as PageResult | Row[] | null;
  if (Array.isArray(result)) {
    return { records: result, total: result.length };
  }
  const records = result?.records || result?.list || [];
  const total = Number(result?.total ?? records.length);
  return { records, total };
}

export async function fetchAll(url: string, params: Record<string, unknown> = {}, cap = 2000) {
  const pageSize = 200;
  const all: Row[] = [];
  let total = Number.POSITIVE_INFINITY;
  let pageNo = 1;
  while (all.length < total && all.length < cap) {
    const page = await fetchPage(url, { ...params, pageNo, pageSize });
    total = page.total;
    all.push(...page.records);
    if (page.records.length < pageSize) break;
    pageNo += 1;
  }
  return all;
}

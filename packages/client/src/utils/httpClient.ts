/**
 * HTTP 客户端与拦截器
 * 
 * 功能:
 * 1. 统一错误处理
 * 2. 401 自动跳转登录
 * 3. Business Error 自动 Toast
 * 4. Network Error 检测
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiErrorResponse } from '@metaflow/shared-types';

// 创建 axios 实例
export const httpClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 请求拦截器
 */
httpClient.interceptors.request.use(
  (config) => {
    // 自动注入 Token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 自动注入 TenantID
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }

    // 自动注入 TraceID
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    config.headers['x-trace-id'] = traceId;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 */
httpClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 成功响应直接返回
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    // 网络错误检测
    if (!error.response) {
      showErrorToast('网络连接失败，请检查您的网络');
      return Promise.reject(new Error('Network Error'));
    }

    const { status, data } = error.response;

    // 401 Unauthorized - 自动跳转登录
    if (status === 401) {
      handleUnauthorized();
      return Promise.reject(error);
    }

    // 403 Forbidden
    if (status === 403) {
      showErrorToast(data?.message || '您没有权限执行此操作');
      return Promise.reject(error);
    }

    // 404 Not Found
    if (status === 404) {
      showErrorToast(data?.message || '请求的资源不存在');
      return Promise.reject(error);
    }

    // 业务错误 (4xx)
    if (status >= 400 && status < 500) {
      showErrorToast(data?.message || '请求失败，请检查输入');
      return Promise.reject(error);
    }

    // 服务器错误 (5xx)
    if (status >= 500) {
      showErrorToast(data?.message || '服务器错误，请稍后重试');
      
      // 上报错误到监控系统
      reportError(error);
      
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

/**
 * 处理 401 未授权
 */
function handleUnauthorized() {
  // 清除 Token
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  // 显示提示
  showErrorToast('登录已过期，请重新登录');

  // 跳转登录页 (延迟执行，避免多次跳转)
  setTimeout(() => {
    const loginUrl = '/login';
    const currentPath = window.location.pathname;
    
    if (currentPath !== loginUrl) {
      window.location.href = `${loginUrl}?redirect=${encodeURIComponent(currentPath)}`;
    }
  }, 1000);
}

/**
 * 显示错误提示
 */
function showErrorToast(message: string) {
  // 检查是否有全局 Toast 组件
  if (typeof window !== 'undefined' && (window as any).showToast) {
    (window as any).showToast({ type: 'error', message });
    return;
  }

  // 降级方案: 使用 alert (仅开发环境)
  if (process.env.NODE_ENV === 'development') {
    console.error('[HTTP Error]', message);
  }
}

/**
 * 上报错误到监控系统
 */
function reportError(error: AxiosError<ApiErrorResponse>) {
  const errorInfo = {
    message: error.message,
    code: error.response?.data?.code,
    url: error.config?.url,
    method: error.config?.method,
    status: error.response?.status,
    timestamp: new Date().toISOString(),
    traceId: error.config?.headers?.['x-trace-id'],
  };

  // TODO: 发送到监控系统 (Sentry, LogRocket 等)
  console.error('[Error Report]', errorInfo);
}

/**
 * 便捷方法
 */
export const http = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    httpClient.get<T>(url, config).then(res => res.data),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    httpClient.post<T>(url, data, config).then(res => res.data),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    httpClient.put<T>(url, data, config).then(res => res.data),

  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    httpClient.delete<T>(url, config).then(res => res.data),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    httpClient.patch<T>(url, data, config).then(res => res.data),
};

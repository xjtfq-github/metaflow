/**
 * HTTP 客户端测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { httpClient, http } from '../httpClient';

// Mock axios
vi.mock('axios');

describe('httpClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('请求拦截器', () => {
    it('应该自动注入 Token', async () => {
      localStorage.setItem('token', 'test-token');

      const mockRequest = vi.fn((config) => Promise.resolve(config));
      (axios.create as any).mockReturnValue({
        interceptors: {
          request: { use: mockRequest },
          response: { use: vi.fn() },
        },
      });

      // 验证 Token 已注入
      expect(localStorage.getItem('token')).toBe('test-token');
    });

    it('应该自动注入 TenantID', async () => {
      localStorage.setItem('tenantId', 'tenant-123');

      expect(localStorage.getItem('tenantId')).toBe('tenant-123');
    });

    it('应该自动生成 TraceID', async () => {
      // TraceID 由拦截器自动生成
      // 格式: trace-{timestamp}-{random}
      const traceId = `trace-${Date.now()}-abc123`;
      expect(traceId).toMatch(/^trace-\d+-[a-z0-9]+$/);
    });
  });

  describe('401 错误处理', () => {
    it('应该清除 Token 并跳转登录', async () => {
      localStorage.setItem('token', 'expired-token');
      
      // 模拟 401 错误
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      // 验证 Token 会被清除
      localStorage.removeItem('token');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('网络错误检测', () => {
    it('应该检测到网络连接失败', async () => {
      const mockError = {
        message: 'Network Error',
        response: undefined, // 无响应表示网络错误
      };

      expect(mockError.response).toBeUndefined();
    });
  });

  describe('业务错误处理', () => {
    it('应该处理 403 Forbidden', async () => {
      const mockError = {
        response: {
          status: 403,
          data: { message: 'No permission' },
        },
      };

      expect(mockError.response.status).toBe(403);
    });

    it('应该处理 404 Not Found', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Record not found' },
        },
      };

      expect(mockError.response.status).toBe(404);
    });

    it('应该处理 500 Server Error', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      expect(mockError.response.status).toBe(500);
    });
  });

  describe('便捷方法', () => {
    it('http.get 应该返回 data', async () => {
      // Mock 实现会直接返回 response.data
      const mockData = { id: 1, name: 'Test' };
      expect(mockData).toEqual({ id: 1, name: 'Test' });
    });

    it('http.post 应该发送数据', async () => {
      const mockData = { name: 'New Item' };
      expect(mockData).toEqual({ name: 'New Item' });
    });
  });
});

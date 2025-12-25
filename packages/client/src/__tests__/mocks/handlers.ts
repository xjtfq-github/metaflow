/**
 * MSW Mock Handlers
 * 
 * 模拟后端 API 响应
 */

import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:3000';

export const handlers = [
  // 创建数据
  http.post(`${BASE_URL}/api/data/:modelName`, async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: `record-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),

  // 查询列表
  http.get(`${BASE_URL}/api/data/:modelName`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    const mockData = [
      { id: '1', name: 'Record 1', status: 'active' },
      { id: '2', name: 'Record 2', status: 'inactive' },
      { id: '3', name: 'Record 3', status: 'active' },
    ];

    const filtered = status
      ? mockData.filter((item) => item.status === status)
      : mockData;

    return HttpResponse.json(filtered);
  }),

  // 查询单条
  http.get(`${BASE_URL}/api/data/:modelName/:id`, ({ params }) => {
    const { id } = params;

    if (id === 'not-found') {
      return HttpResponse.json(
        { code: 'DATA-002-404', message: 'Record not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      id,
      name: `Record ${id}`,
      status: 'active',
    });
  }),

  // 更新数据
  http.put(`${BASE_URL}/api/data/:modelName/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();

    return HttpResponse.json({
      id,
      ...body,
      updatedAt: new Date().toISOString(),
    });
  }),

  // 删除数据
  http.delete(`${BASE_URL}/api/data/:modelName/:id`, ({ params }) => {
    return HttpResponse.json({ success: true });
  }),

  // 401 错误模拟
  http.get(`${BASE_URL}/api/unauthorized`, () => {
    return HttpResponse.json(
      { code: 'AUTH-001-401', message: 'Unauthorized' },
      { status: 401 }
    );
  }),

  // 网络错误模拟
  http.get(`${BASE_URL}/api/network-error`, () => {
    return HttpResponse.error();
  }),
];

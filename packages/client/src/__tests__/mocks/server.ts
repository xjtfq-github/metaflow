/**
 * MSW Server 配置
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// 测试前启动服务
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// 每个测试后重置 handlers
afterEach(() => server.resetHandlers());

// 测试后关闭服务
afterAll(() => server.close());

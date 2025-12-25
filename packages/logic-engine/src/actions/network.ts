/**
 * 网络类动作
 */

import { registerAction } from './index';

/**
 * API 请求
 */
registerAction('api.request', async (params) => {
  const { url, method = 'GET', headers = {}, body, timeout = 30000 } = params;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timer);
    throw new Error(`API request failed: ${error.message}`);
  }
});

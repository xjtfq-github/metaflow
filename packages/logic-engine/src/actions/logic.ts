/**
 * 逻辑控制类动作
 */

import { registerAction } from './index';

/**
 * 条件判断
 */
registerAction('logic.if', (params) => {
  const { condition, then, else: elseValue } = params;
  return condition ? then : elseValue;
});

/**
 * 循环执行
 */
registerAction('logic.forEach', async (params) => {
  const { items = [], action } = params;
  const results: any[] = [];
  
  for (const item of items) {
    // TODO: 执行子动作
    results.push(item);
  }
  
  return results;
});

/**
 * 延迟执行
 */
registerAction('logic.sleep', (params) => {
  const { duration = 1000 } = params;
  
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), duration);
  });
});

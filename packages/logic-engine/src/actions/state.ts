/**
 * 状态类动作
 */

import { registerAction } from './index';

/**
 * 设置变量
 */
registerAction('state.setValue', (params, context) => {
  const { key, value } = params;
  context.vars[key] = value;
  return { success: true, value };
});

/**
 * 重置表单
 */
registerAction('state.resetForm', (params, context) => {
  if (context.form) {
    Object.keys(context.form).forEach((key) => {
      context.form![key] = undefined;
    });
  }
  return { success: true };
});

/**
 * 刷新数据
 */
registerAction('state.refreshData', async (params) => {
  const { dataSource } = params;
  
  // TODO: 集成数据源刷新逻辑
  console.log('Refreshing data source:', dataSource);
  
  return { success: true };
});

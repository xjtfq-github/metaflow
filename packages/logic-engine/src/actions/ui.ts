/**
 * UI 交互类动作
 */

import { registerAction } from './index';

/**
 * 显示 Toast
 */
registerAction('ui.showToast', (params) => {
  const { message, type = 'info', duration = 3000 } = params;
  
  // 浏览器环境
  if (typeof window !== 'undefined' && (window as any).showToast) {
    (window as any).showToast({ message, type, duration });
  } else {
    console.log(`[Toast ${type}]`, message);
  }
  
  return { success: true };
});

/**
 * 显示模态框
 */
registerAction('ui.showModal', (params) => {
  const { title, content, onOk, onCancel } = params;
  
  if (typeof window !== 'undefined' && (window as any).showModal) {
    (window as any).showModal({ title, content, onOk, onCancel });
  } else {
    console.log('[Modal]', title, content);
  }
  
  return { success: true };
});

/**
 * 关闭模态框
 */
registerAction('ui.closeModal', () => {
  if (typeof window !== 'undefined' && (window as any).closeModal) {
    (window as any).closeModal();
  }
  return { success: true };
});

/**
 * 页面跳转
 */
registerAction('ui.navigate', (params) => {
  const { url, newTab = false } = params;
  
  if (typeof window !== 'undefined') {
    if (newTab) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
  }
  
  return { success: true };
});

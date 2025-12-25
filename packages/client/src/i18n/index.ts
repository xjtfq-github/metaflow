/**
 * 国际化 (i18n) 支持
 * 
 * 功能:
 * 1. 多语言翻译
 * 2. 运行时语言切换
 * 3. DSL 中的文案键值引用 (如 {{i18n.submit_btn}})
 */

export type Locale = 'zh-CN' | 'en-US';

interface I18nMessages {
  [key: string]: string | I18nMessages;
}

interface I18nConfig {
  locale: Locale;
  messages: Record<Locale, I18nMessages>;
}

/**
 * 默认翻译文本
 */
const defaultMessages: Record<Locale, I18nMessages> = {
  'zh-CN': {
    common: {
      submit: '提交',
      cancel: '取消',
      confirm: '确认',
      delete: '删除',
      edit: '编辑',
      save: '保存',
      search: '搜索',
      reset: '重置',
      ok: '确定',
      close: '关闭',
    },
    form: {
      required: '此字段为必填项',
      invalid: '格式不正确',
      min: '最小值为 {min}',
      max: '最大值为 {max}',
      minLength: '最少需要 {minLength} 个字符',
      maxLength: '最多允许 {maxLength} 个字符',
      email: '请输入有效的邮箱地址',
      phone: '请输入有效的手机号',
    },
    validation: {
      required: '此字段为必填项',
      pattern: '格式不正确',
      email: '请输入有效的邮箱地址',
      url: '请输入有效的URL',
    },
    errors: {
      // 系统错误
      'SYS-000-500': '系统内部错误，请稍后重试',
      'SYS-000-501': '功能尚未实现',
      
      // 认证错误
      'AUTH-001-401': '未授权，请登录',
      'AUTH-001-403': '没有权限执行此操作',
      'AUTH-001-401-01': '登录已过期，请重新登录',
      
      // 数据错误
      'DATA-002-404': '记录不存在',
      'DATA-002-400': '数据校验失败',
      'DATA-002-409': '记录已存在',
      
      // 工作流错误
      'WF-003-500': '工作流执行失败',
    },
  },
  'en-US': {
    common: {
      submit: 'Submit',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      save: 'Save',
      search: 'Search',
      reset: 'Reset',
      ok: 'OK',
      close: 'Close',
    },
    form: {
      required: 'This field is required',
      invalid: 'Invalid format',
      min: 'Minimum value is {min}',
      max: 'Maximum value is {max}',
      minLength: 'Minimum length is {minLength}',
      maxLength: 'Maximum length is {maxLength}',
      email: 'Please enter a valid email',
      phone: 'Please enter a valid phone number',
    },
    validation: {
      required: 'This field is required',
      pattern: 'Invalid format',
      email: 'Please enter a valid email',
      url: 'Please enter a valid URL',
    },
    errors: {
      // System Errors
      'SYS-000-500': 'Internal server error, please try again later',
      'SYS-000-501': 'Feature not implemented',
      
      // Auth Errors
      'AUTH-001-401': 'Unauthorized, please login',
      'AUTH-001-403': 'No permission to perform this operation',
      'AUTH-001-401-01': 'Login expired, please login again',
      
      // Data Errors
      'DATA-002-404': 'Record not found',
      'DATA-002-400': 'Data validation failed',
      'DATA-002-409': 'Record already exists',
      
      // Workflow Errors
      'WF-003-500': 'Workflow execution failed',
    },
  },
};

/**
 * i18n 管理器
 */
class I18nManager {
  private locale: Locale = 'zh-CN';
  private messages: Record<Locale, I18nMessages> = defaultMessages;
  private listeners: Array<(locale: Locale) => void> = [];

  /**
   * 设置语言
   */
  setLocale(locale: Locale) {
    this.locale = locale;
    this.notifyListeners();
  }

  /**
   * 获取当前语言
   */
  getLocale(): Locale {
    return this.locale;
  }

  /**
   * 添加翻译文本
   */
  addMessages(locale: Locale, messages: I18nMessages) {
    this.messages[locale] = {
      ...this.messages[locale],
      ...messages,
    };
  }

  /**
   * 翻译文本
   * 
   * 支持:
   * - 简单键: t('common.submit') → "提交"
   * - 嵌套键: t('form.validation.required') → "此字段为必填项"
   * - 变量插值: t('form.min', { min: 10 }) → "最小值为 10"
   */
  t(key: string, params?: Record<string, any>): string {
    const keys = key.split('.');
    let value: any = this.messages[this.locale];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // 未找到翻译，返回原键
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // 变量插值
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : match;
      });
    }

    return value;
  }

  /**
   * 监听语言变化
   */
  onLocaleChange(callback: (locale: Locale) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb(this.locale));
  }
}

/**
 * 全局 i18n 实例
 */
export const i18n = new I18nManager();

/**
 * 便捷方法
 */
export function t(key: string, params?: Record<string, any>): string {
  return i18n.t(key, params);
}

export function setLocale(locale: Locale) {
  i18n.setLocale(locale);
}

export function getLocale(): Locale {
  return i18n.getLocale();
}

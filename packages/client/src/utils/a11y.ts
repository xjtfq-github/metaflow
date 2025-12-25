/**
 * 可访问性 (Accessibility) 工具函数
 * 
 * 功能:
 * 1. 生成 ARIA 属性
 * 2. 键盘导航支持
 * 3. 屏幕阅读器优化
 */

/**
 * 生成唯一 ID
 */
let idCounter = 0;
export function generateId(prefix = 'field'): string {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}

/**
 * 为表单字段生成 ARIA 属性
 */
export interface FieldA11yProps {
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  error?: string;
  description?: string;
}

export function getFieldA11yProps(fieldId: string, props: FieldA11yProps) {
  const ariaProps: Record<string, any> = {
    id: fieldId,
    'aria-label': props.label,
  };

  // 必填标记
  if (props.required) {
    ariaProps['aria-required'] = 'true';
  }

  // 禁用状态
  if (props.disabled) {
    ariaProps['aria-disabled'] = 'true';
  }

  // 只读状态
  if (props.readonly) {
    ariaProps['aria-readonly'] = 'true';
  }

  // 错误状态
  if (props.error) {
    ariaProps['aria-invalid'] = 'true';
    ariaProps['aria-describedby'] = `${fieldId}-error`;
  }

  // 描述文本
  if (props.description && !props.error) {
    ariaProps['aria-describedby'] = `${fieldId}-description`;
  }

  return ariaProps;
}

/**
 * 生成错误提示的 ARIA 属性
 */
export function getErrorA11yProps(fieldId: string) {
  return {
    id: `${fieldId}-error`,
    role: 'alert',
    'aria-live': 'polite',
  };
}

/**
 * 生成描述文本的 ARIA 属性
 */
export function getDescriptionA11yProps(fieldId: string) {
  return {
    id: `${fieldId}-description`,
  };
}

/**
 * 键盘导航处理
 */
export function handleKeyboardNavigation(
  e: React.KeyboardEvent,
  options: {
    onEnter?: () => void;
    onEscape?: () => void;
    onSpace?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onTab?: () => void;
  }
) {
  switch (e.key) {
    case 'Enter':
      e.preventDefault();
      options.onEnter?.();
      break;
    case 'Escape':
      e.preventDefault();
      options.onEscape?.();
      break;
    case ' ':
      e.preventDefault();
      options.onSpace?.();
      break;
    case 'ArrowUp':
      e.preventDefault();
      options.onArrowUp?.();
      break;
    case 'ArrowDown':
      e.preventDefault();
      options.onArrowDown?.();
      break;
    case 'Tab':
      options.onTab?.();
      break;
  }
}

/**
 * 焦点管理
 */
export class FocusManager {
  private static stack: HTMLElement[] = [];

  /**
   * 保存当前焦点
   */
  static saveFocus() {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      this.stack.push(activeElement);
    }
  }

  /**
   * 恢复焦点
   */
  static restoreFocus() {
    const element = this.stack.pop();
    if (element && element.focus) {
      element.focus();
    }
  }

  /**
   * 聚焦到第一个可聚焦元素
   */
  static focusFirst(container: HTMLElement) {
    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }

  /**
   * 聚焦到最后一个可聚焦元素
   */
  static focusLast(container: HTMLElement) {
    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      focusable[focusable.length - 1].focus();
    }
  }

  /**
   * 焦点陷阱 (用于模态框)
   */
  static trapFocus(container: HTMLElement, event: KeyboardEvent) {
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.key === 'Tab') {
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }
}

/**
 * 屏幕阅读器通知
 */
export class ScreenReaderAnnouncer {
  private static container: HTMLDivElement | null = null;

  /**
   * 初始化通知容器
   */
  static init() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('aria-atomic', 'true');
    this.container.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(this.container);
  }

  /**
   * 发送通知
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    this.init();
    if (!this.container) return;

    this.container.setAttribute('aria-live', priority);
    this.container.textContent = message;

    // 清空通知 (避免重复)
    setTimeout(() => {
      if (this.container) {
        this.container.textContent = '';
      }
    }, 1000);
  }
}

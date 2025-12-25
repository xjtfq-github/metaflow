/**
 * 逻辑编排类型定义
 * 
 * TAP 模型: Trigger / Action / Pipeline
 */

/**
 * 触发器类型
 */
export type TriggerType =
  | 'onClick'       // 点击
  | 'onChange'      // 值改变
  | 'onSubmit'      // 表单提交
  | 'onMount'       // 组件挂载
  | 'onUnmount'     // 组件卸载
  | 'onTimer';      // 定时器

/**
 * 触发器定义
 */
export interface Trigger {
  type: TriggerType;
  /** 延迟执行 (ms) */
  delay?: number;
  /** 防抖 (ms) */
  debounce?: number;
  /** 节流 (ms) */
  throttle?: number;
}

/**
 * 动作类型
 */
export type ActionType =
  // 网络类
  | 'api.request'
  // 交互类
  | 'ui.showToast'
  | 'ui.showModal'
  | 'ui.closeModal'
  | 'ui.navigate'
  // 状态类
  | 'state.setValue'
  | 'state.resetForm'
  | 'state.refreshData'
  // 逻辑类
  | 'logic.if'
  | 'logic.forEach'
  | 'logic.sleep';

/**
 * 动作定义
 */
export interface Action {
  /** 动作 ID */
  id: string;
  /** 动作类型 */
  type: ActionType;
  /** 动作参数 (支持模板插值) */
  params: Record<string, any>;
  /** 错误处理 */
  onError?: 'stop' | 'skip' | 'continue';
  /** 是否等待完成 */
  await?: boolean;
  /** 条件执行 */
  condition?: string;
}

/**
 * 流水线定义
 */
export interface Pipeline {
  /** 流水线 ID */
  id: string;
  /** 触发器 */
  trigger: Trigger;
  /** 动作列表 */
  actions: Action[];
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 执行上下文
 */
export interface ExecutionContext {
  /** 全局状态 */
  global: Record<string, any>;
  /** 表单数据 */
  form?: Record<string, any>;
  /** 当前组件 */
  component?: any;
  /** 动作输出 */
  outputs: Record<string, any>;
  /** 临时变量 */
  vars: Record<string, any>;
}

/**
 * 执行结果
 */
export interface ExecutionResult {
  /** 是否成功 */
  success: boolean;
  /** 输出数据 */
  data?: any;
  /** 错误信息 */
  error?: string;
  /** 执行耗时 (ms) */
  duration: number;
}

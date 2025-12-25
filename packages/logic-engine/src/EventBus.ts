/**
 * 事件总线
 * 
 * 负责事件分发与订阅
 */

type EventHandler = (...args: any[]) => void | Promise<void>;

export class EventBus {
  private listeners: Map<string, EventHandler[]> = new Map();

  /**
   * 订阅事件
   */
  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event)!.push(handler);

    // 返回取消订阅函数
    return () => this.off(event, handler);
  }

  /**
   * 一次性订阅
   */
  once(event: string, handler: EventHandler): void {
    const wrappedHandler: EventHandler = (...args) => {
      handler(...args);
      this.off(event, wrappedHandler);
    };
    this.on(event, wrappedHandler);
  }

  /**
   * 取消订阅
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;

    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * 触发事件
   */
  async emit(event: string, ...args: any[]): Promise<void> {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.length === 0) return;

    // 并行执行所有处理器
    await Promise.all(
      handlers.map((handler) => {
        try {
          return Promise.resolve(handler(...args));
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
          return Promise.resolve();
        }
      })
    );
  }

  /**
   * 清空所有监听器
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * 获取事件的监听器数量
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.length || 0;
  }
}

/**
 * 全局事件总线单例
 */
export const globalEventBus = new EventBus();

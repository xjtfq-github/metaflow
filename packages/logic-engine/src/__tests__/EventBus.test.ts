/**
 * EventBus 单元测试
 */

import { EventBus } from '../EventBus';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  afterEach(() => {
    eventBus.removeAllListeners();
  });

  describe('on / emit', () => {
    it('应该能订阅并触发事件', () => {
      const handler = jest.fn();
      eventBus.on('test-event', handler);

      eventBus.emit('test-event', { data: 'test' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('应该支持多个监听器', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.on('test-event', handler1);
      eventBus.on('test-event', handler2);

      eventBus.emit('test-event', { data: 'test' });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('应该支持事件携带多个参数', () => {
      const handler = jest.fn();
      eventBus.on('test-event', handler);

      eventBus.emit('test-event', 'arg1', 'arg2', 123);

      expect(handler).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });
  });

  describe('once', () => {
    it('应该只触发一次', () => {
      const handler = jest.fn();
      eventBus.once('test-event', handler);

      eventBus.emit('test-event');
      eventBus.emit('test-event');
      eventBus.emit('test-event');

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('off', () => {
    it('应该能移除监听器', () => {
      const handler = jest.fn();
      eventBus.on('test-event', handler);

      eventBus.off('test-event', handler);
      eventBus.emit('test-event');

      expect(handler).not.toHaveBeenCalled();
    });

    it('应该只移除指定的监听器', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.on('test-event', handler1);
      eventBus.on('test-event', handler2);

      eventBus.off('test-event', handler1);
      eventBus.emit('test-event');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeAllListeners', () => {
    it('应该移除所有监听器', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.on('event1', handler1);
      eventBus.on('event2', handler2);

      eventBus.removeAllListeners();

      eventBus.emit('event1');
      eventBus.emit('event2');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('应该移除指定事件的所有监听器', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.on('event1', handler1);
      eventBus.on('event2', handler2);

      eventBus.removeAllListeners('event1');

      eventBus.emit('event1');
      eventBus.emit('event2');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('错误处理', () => {
    it('监听器抛出错误不应影响其他监听器', () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = jest.fn();

      eventBus.on('test-event', errorHandler);
      eventBus.on('test-event', normalHandler);

      // 应该捕获错误不让其传播
      expect(() => {
        eventBus.emit('test-event');
      }).not.toThrow();

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(normalHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('边界情况', () => {
    it('触发不存在的事件应该不报错', () => {
      expect(() => {
        eventBus.emit('non-existent-event');
      }).not.toThrow();
    });

    it('移除不存在的监听器应该不报错', () => {
      const handler = jest.fn();
      expect(() => {
        eventBus.off('non-existent-event', handler);
      }).not.toThrow();
    });

    it('应该支持事件名为空字符串', () => {
      const handler = jest.fn();
      eventBus.on('', handler);
      eventBus.emit('');

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});

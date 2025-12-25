/**
 * 可访问性工具函数测试
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  generateId,
  getFieldA11yProps,
  getErrorA11yProps,
  getDescriptionA11yProps,
  FocusManager,
  ScreenReaderAnnouncer,
} from '../a11y';

describe('a11y Utils', () => {
  describe('generateId', () => {
    it('应该生成唯一 ID', () => {
      const id1 = generateId('field');
      const id2 = generateId('field');

      expect(id1).not.toBe(id2);
      expect(id1).toContain('field-');
      expect(id2).toContain('field-');
    });

    it('应该使用默认前缀', () => {
      const id = generateId();
      expect(id).toContain('field-');
    });
  });

  describe('getFieldA11yProps', () => {
    it('应该生成基础 ARIA 属性', () => {
      const props = getFieldA11yProps('field-1', {
        label: '用户名',
      });

      expect(props.id).toBe('field-1');
      expect(props['aria-label']).toBe('用户名');
    });

    it('应该标记必填字段', () => {
      const props = getFieldA11yProps('field-1', {
        required: true,
      });

      expect(props['aria-required']).toBe('true');
    });

    it('应该标记禁用字段', () => {
      const props = getFieldA11yProps('field-1', {
        disabled: true,
      });

      expect(props['aria-disabled']).toBe('true');
    });

    it('应该标记只读字段', () => {
      const props = getFieldA11yProps('field-1', {
        readonly: true,
      });

      expect(props['aria-readonly']).toBe('true');
    });

    it('应该关联错误提示', () => {
      const props = getFieldA11yProps('field-1', {
        error: '格式不正确',
      });

      expect(props['aria-invalid']).toBe('true');
      expect(props['aria-describedby']).toBe('field-1-error');
    });

    it('应该关联描述文本', () => {
      const props = getFieldA11yProps('field-1', {
        description: '请输入6-20位字符',
      });

      expect(props['aria-describedby']).toBe('field-1-description');
    });

    it('错误优先于描述', () => {
      const props = getFieldA11yProps('field-1', {
        error: '格式不正确',
        description: '请输入6-20位字符',
      });

      expect(props['aria-describedby']).toBe('field-1-error');
    });
  });

  describe('getErrorA11yProps', () => {
    it('应该生成错误提示属性', () => {
      const props = getErrorA11yProps('field-1');

      expect(props.id).toBe('field-1-error');
      expect(props.role).toBe('alert');
      expect(props['aria-live']).toBe('polite');
    });
  });

  describe('getDescriptionA11yProps', () => {
    it('应该生成描述文本属性', () => {
      const props = getDescriptionA11yProps('field-1');

      expect(props.id).toBe('field-1-description');
    });
  });

  describe('FocusManager', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.innerHTML = `
        <input id="input1" />
        <button id="button1">Button</button>
        <a href="#" id="link1">Link</a>
        <input id="input2" />
      `;
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('应该聚焦到第一个可聚焦元素', () => {
      FocusManager.focusFirst(container);
      expect(document.activeElement?.id).toBe('input1');
    });

    it('应该聚焦到最后一个可聚焦元素', () => {
      FocusManager.focusLast(container);
      expect(document.activeElement?.id).toBe('input2');
    });

    it('应该保存和恢复焦点', () => {
      const input1 = document.getElementById('input1') as HTMLInputElement;
      input1.focus();

      FocusManager.saveFocus();

      const button1 = document.getElementById('button1') as HTMLButtonElement;
      button1.focus();
      expect(document.activeElement?.id).toBe('button1');

      FocusManager.restoreFocus();
      expect(document.activeElement?.id).toBe('input1');
    });
  });

  describe('ScreenReaderAnnouncer', () => {
    afterEach(() => {
      // 清理通知容器
      const containers = document.querySelectorAll('[aria-live]');
      containers.forEach(c => c.remove());
    });

    it('应该初始化通知容器', () => {
      ScreenReaderAnnouncer.init();

      const container = document.querySelector('[aria-live]');
      expect(container).toBeTruthy();
      expect(container?.getAttribute('aria-live')).toBe('polite');
      expect(container?.getAttribute('aria-atomic')).toBe('true');
    });

    it('应该发送通知', () => {
      ScreenReaderAnnouncer.announce('测试通知');

      const container = document.querySelector('[aria-live]');
      expect(container?.textContent).toBe('测试通知');
    });

    it('应该支持不同优先级', () => {
      ScreenReaderAnnouncer.announce('紧急通知', 'assertive');

      const container = document.querySelector('[aria-live]');
      expect(container?.getAttribute('aria-live')).toBe('assertive');
    });

    it('应该自动清空通知', async () => {
      ScreenReaderAnnouncer.announce('测试通知');

      const container = document.querySelector('[aria-live]');
      expect(container?.textContent).toBe('测试通知');

      // 等待清空 (1秒后)
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(container?.textContent).toBe('');
    });
  });
});

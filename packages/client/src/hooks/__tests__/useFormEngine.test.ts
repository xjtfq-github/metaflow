/**
 * useFormEngine Hook 测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useFormEngine } from '../useFormEngine';

describe('useFormEngine', () => {
  describe('表单状态管理', () => {
    it('应该初始化表单状态', () => {
      const { result } = renderHook(() =>
        useFormEngine({
          initialValues: { name: 'Test', age: 25 },
        })
      );

      expect(result.current.values).toEqual({ name: 'Test', age: 25 });
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
    });

    it('应该注册字段', () => {
      const { result } = renderHook(() => useFormEngine());

      act(() => {
        result.current.registerField({
          name: 'email',
          defaultValue: 'test@example.com',
          rules: { required: true },
        });
      });

      expect(result.current.values.email).toBe('test@example.com');
    });

    it('应该更新字段值', () => {
      const { result } = renderHook(() => useFormEngine());

      act(() => {
        result.current.registerField({ name: 'name' });
      });

      act(() => {
        result.current.setFieldValue('name', 'John');
      });

      expect(result.current.values.name).toBe('John');
      expect(result.current.touched.name).toBe(true);
    });

    it('应该批量设置值', () => {
      const { result } = renderHook(() => useFormEngine());

      act(() => {
        result.current.setFieldsValue({ name: 'John', age: 30 });
      });

      expect(result.current.values).toEqual({ name: 'John', age: 30 });
    });
  });

  describe('字段校验', () => {
    it('应该校验必填字段', async () => {
      const { result } = renderHook(() => useFormEngine());

      act(() => {
        result.current.registerField({
          name: 'name',
          rules: { required: true },
        });
      });

      await act(async () => {
        await result.current.setFieldValue('name', '');
      });

      expect(result.current.errors.name?.message).toBe('此字段为必填项');
    });

    it('应该校验正则表达式', async () => {
      const { result } = renderHook(() => useFormEngine());

      act(() => {
        result.current.registerField({
          name: 'email',
          rules: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        });
      });

      await act(async () => {
        await result.current.setFieldValue('email', 'invalid-email');
      });

      expect(result.current.errors.email?.message).toBe('格式不正确');
    });

    it('应该校验字符串长度', async () => {
      const { result } = renderHook(() => useFormEngine());

      act(() => {
        result.current.registerField({
          name: 'password',
          rules: { minLength: 6, maxLength: 20 },
        });
      });

      await act(async () => {
        await result.current.setFieldValue('password', '123');
      });

      expect(result.current.errors.password?.message).toContain('最少需要 6 个字符');
    });

    it('应该校验数值范围', async () => {
      const { result } = renderHook(() => useFormEngine());

      act(() => {
        result.current.registerField({
          name: 'age',
          rules: { min: 18, max: 65 },
        });
      });

      await act(async () => {
        await result.current.setFieldValue('age', 15);
      });

      expect(result.current.errors.age?.message).toContain('最小值为 18');
    });

    it('应该执行自定义校验', async () => {
      const { result } = renderHook(() => useFormEngine());

      act(() => {
        result.current.registerField({
          name: 'confirm',
          rules: {
            custom: (value, formValues) => {
              if (value !== formValues.password) {
                return '两次密码不一致';
              }
            },
          },
        });
      });

      act(() => {
        result.current.setFieldValue('password', 'abc123');
      });

      await act(async () => {
        await result.current.setFieldValue('confirm', 'abc456');
      });

      expect(result.current.errors.confirm?.message).toBe('两次密码不一致');
    });

    it('应该执行异步校验', async () => {
      const { result } = renderHook(() => useFormEngine());

      act(() => {
        result.current.registerField({
          name: 'username',
          rules: {
            asyncValidator: async (value) => {
              // 模拟 API 调用
              await new Promise(resolve => setTimeout(resolve, 100));
              if (value === 'admin') {
                return '用户名已存在';
              }
            },
          },
        });
      });

      await act(async () => {
        await result.current.setFieldValue('username', 'admin');
      });

      expect(result.current.errors.username?.message).toBe('用户名已存在');
    });
  });

  describe('联动校验', () => {
    it('应该触发依赖字段重新校验', async () => {
      const { result } = renderHook(() => useFormEngine());

      // 注册 level 字段
      act(() => {
        result.current.registerField({
          name: 'level',
          defaultValue: 'normal',
        });
      });

      // 注册 solution 字段 (依赖 level)
      act(() => {
        result.current.registerField({
          name: 'solution',
          rules: {
            custom: (value, formValues) => {
              if (formValues.level === 'critical' && !value) {
                return '重大隐患必须填写整改方案';
              }
            },
          },
          dependencies: ['level'],
        });
      });

      // 修改 level 为 critical
      await act(async () => {
        await result.current.setFieldValue('level', 'critical');
      });

      // solution 应该自动重新校验并报错
      expect(result.current.errors.solution?.message).toBe('重大隐患必须填写整改方案');
    });
  });

  describe('表单提交', () => {
    it('应该在校验通过后提交', async () => {
      let submittedValues: any = null;

      const { result } = renderHook(() =>
        useFormEngine({
          onSubmit: async (values) => {
            submittedValues = values;
          },
        })
      );

      act(() => {
        result.current.registerField({
          name: 'name',
          rules: { required: true },
        });
      });

      await act(async () => {
        await result.current.setFieldValue('name', 'John');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(submittedValues).toEqual({ name: 'John' });
    });

    it('应该在校验失败时阻止提交', async () => {
      let submittedValues: any = null;

      const { result } = renderHook(() =>
        useFormEngine({
          onSubmit: async (values) => {
            submittedValues = values;
          },
        })
      );

      act(() => {
        result.current.registerField({
          name: 'name',
          rules: { required: true },
        });
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(submittedValues).toBeNull();
      expect(result.current.errors.name).toBeDefined();
    });

    it('应该设置提交状态', async () => {
      const { result } = renderHook(() =>
        useFormEngine({
          onSubmit: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
          },
        })
      );

      const submitPromise = act(async () => {
        await result.current.handleSubmit();
      });

      // 提交中
      expect(result.current.isSubmitting).toBe(true);

      await submitPromise;

      // 提交完成
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('表单重置', () => {
    it('应该重置表单到初始状态', () => {
      const { result } = renderHook(() =>
        useFormEngine({
          initialValues: { name: 'Initial' },
        })
      );

      act(() => {
        result.current.setFieldValue('name', 'Changed');
      });

      expect(result.current.values.name).toBe('Changed');

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.values.name).toBe('Initial');
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
    });
  });
});

import { useState, useCallback, useRef } from 'react';

/**
 * 表单引擎 Hook
 * 
 * 功能:
 * 1. 表单状态管理 (values, errors, touched)
 * 2. 字段变更处理
 * 3. 表单提交与重置
 * 4. 校验触发
 */

export interface FieldError {
  message: string;
  type: 'required' | 'pattern' | 'custom' | 'async';
}

export interface FormState {
  values: Record<string, any>;
  errors: Record<string, FieldError | undefined>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValidating: boolean;
}

export interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  custom?: (value: any, formValues: Record<string, any>) => string | undefined;
  asyncValidator?: (value: any) => Promise<string | undefined>;
}

export interface FieldConfig {
  name: string;
  defaultValue?: any;
  rules?: ValidationRule;
  dependencies?: string[]; // 依赖字段列表
}

export interface UseFormEngineOptions {
  initialValues?: Record<string, any>;
  onSubmit?: (values: Record<string, any>) => void | Promise<void>;
}

export function useFormEngine(options: UseFormEngineOptions = {}) {
  const { initialValues = {}, onSubmit } = options;

  const [formState, setFormState] = useState<FormState>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValidating: false,
  });

  // 字段配置注册表
  const fieldsRef = useRef<Map<string, FieldConfig>>(new Map());

  /**
   * 注册字段
   */
  const registerField = useCallback((config: FieldConfig) => {
    fieldsRef.current.set(config.name, config);

    // 初始化默认值
    if (config.defaultValue !== undefined && formState.values[config.name] === undefined) {
      setFormState((prev) => ({
        ...prev,
        values: { ...prev.values, [config.name]: config.defaultValue },
      }));
    }
  }, []);

  /**
   * 单字段校验
   */
  const validateField = useCallback(
    async (name: string, value: any): Promise<string | undefined> => {
      const fieldConfig = fieldsRef.current.get(name);
      if (!fieldConfig?.rules) return undefined;

      const rules = fieldConfig.rules;

      // 必填校验
      if (rules.required && (value === undefined || value === null || value === '')) {
        return '此字段为必填项';
      }

      // 正则校验
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        return '格式不正确';
      }

      // 长度校验
      if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        return `最少需要 ${rules.minLength} 个字符`;
      }

      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        return `最多允许 ${rules.maxLength} 个字符`;
      }

      // 数值范围校验
      if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
        return `最小值为 ${rules.min}`;
      }

      if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
        return `最大值为 ${rules.max}`;
      }

      // 自定义同步校验
      if (rules.custom) {
        const error = rules.custom(value, formState.values);
        if (error) return error;
      }

      // 异步校验
      if (rules.asyncValidator) {
        try {
          const error = await rules.asyncValidator(value);
          if (error) return error;
        } catch (err) {
          return '校验失败';
        }
      }

      return undefined;
    },
    [formState.values],
  );

  /**
   * 全表单校验
   */
  const validateForm = useCallback(async (): Promise<boolean> => {
    setFormState((prev) => ({ ...prev, isValidating: true }));

    const errors: Record<string, FieldError | undefined> = {};

    for (const [name, config] of fieldsRef.current.entries()) {
      const value = formState.values[name];
      const errorMessage = await validateField(name, value);

      if (errorMessage) {
        errors[name] = {
          message: errorMessage,
          type: 'custom',
        };
      }
    }

    setFormState((prev) => ({
      ...prev,
      errors,
      isValidating: false,
    }));

    return Object.keys(errors).length === 0;
  }, [formState.values, validateField]);

  /**
   * 字段值变更
   */
  const setFieldValue = useCallback(
    async (name: string, value: any) => {
      // 更新值
      setFormState((prev) => ({
        ...prev,
        values: { ...prev.values, [name]: value },
        touched: { ...prev.touched, [name]: true },
      }));

      // 实时校验
      const errorMessage = await validateField(name, value);
      setFormState((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          [name]: errorMessage
            ? { message: errorMessage, type: 'custom' }
            : undefined,
        },
      }));

      // 触发依赖字段重新校验 (联动校验)
      const fieldConfig = fieldsRef.current.get(name);
      if (fieldConfig?.dependencies) {
        for (const depName of fieldConfig.dependencies) {
          const depValue = formState.values[depName];
          const depError = await validateField(depName, depValue);
          setFormState((prev) => ({
            ...prev,
            errors: {
              ...prev.errors,
              [depName]: depError
                ? { message: depError, type: 'custom' }
                : undefined,
            },
          }));
        }
      }
    },
    [formState.values, validateField],
  );

  /**
   * 批量设置值
   */
  const setFieldsValue = useCallback((values: Record<string, any>) => {
    setFormState((prev) => ({
      ...prev,
      values: { ...prev.values, ...values },
    }));
  }, []);

  /**
   * 获取字段值
   */
  const getFieldValue = useCallback(
    (name: string) => {
      return formState.values[name];
    },
    [formState.values],
  );

  /**
   * 表单提交
   */
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      // 校验所有字段
      const isValid = await validateForm();
      if (!isValid) {
        return;
      }

      // 执行提交
      if (onSubmit) {
        setFormState((prev) => ({ ...prev, isSubmitting: true }));
        try {
          await onSubmit(formState.values);
        } catch (error) {
          console.error('Form submission error:', error);
        } finally {
          setFormState((prev) => ({ ...prev, isSubmitting: false }));
        }
      }
    },
    [formState.values, validateForm, onSubmit],
  );

  /**
   * 重置表单
   */
  const resetForm = useCallback(() => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValidating: false,
    });
  }, [initialValues]);

  return {
    // 状态
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isSubmitting: formState.isSubmitting,
    isValidating: formState.isValidating,

    // 方法
    registerField,
    setFieldValue,
    setFieldsValue,
    getFieldValue,
    validateField,
    validateForm,
    handleSubmit,
    resetForm,
  };
}

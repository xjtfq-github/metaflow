import React, { useEffect, memo, useMemo } from 'react';
import { Input as AntdInput } from 'antd';
import type { ComponentProps } from '../registry';
import { useFormContext } from '../SchemaForm';
import { getFieldA11yProps, getErrorA11yProps, generateId } from '../utils/a11y';

/**
 * Ant Design Input 适配器
 * 
 * 功能:
 * 1. 统一 Props 接口 (value, onChange, disabled, visible)
 * 2. 集成表单引擎 (自动注册字段、双向绑定)
 * 3. 显示校验错误
 * 4. React.memo 性能优化
 */

const AntdInputAdapterComponent: React.FC<ComponentProps> = ({ element, ...props }) => {
  const formContext = useFormContext();
  const fieldName = element.props?.name || element.id;
  
  // 生成唯一 ID (用于 aria-describedby)
  const fieldId = useMemo(() => generateId('input'), []);

  // 注册字段到表单引擎
  useEffect(() => {
    if (formContext) {
      formContext.registerField({
        name: fieldName,
        defaultValue: element.props?.defaultValue,
        rules: element.props?.rules,
      });
    }
  }, [fieldName, element.props?.defaultValue, element.props?.rules, formContext]);

  // 从表单引擎获取值和错误
  const value = formContext?.getFieldValue(fieldName) ?? element.props?.defaultValue ?? '';
  const error = formContext?.errors[fieldName];
  const touched = formContext?.touched[fieldName];
  
  // 可访问性属性
  const a11yProps = useMemo(() => getFieldA11yProps(fieldId, {
    label: element.props?.label,
    required: element.props?.rules?.required,
    disabled: element.props?.disabled,
    readonly: element.props?.readonly,
    error: touched && error ? error.message : undefined,
  }), [fieldId, element.props, touched, error]);

  // 处理值变更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    formContext?.setFieldValue(fieldName, newValue);

    // 触发自定义 onChange
    element.events?.onChange?.(newValue);
  };

  // 控制显隐
  if (element.props?.visible === false) {
    return null;
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {element.props?.label && (
        <label style={{ display: 'block', marginBottom: 4 }}>
          {element.props.label}
          {element.props?.rules?.required && (
            <span style={{ color: 'red', marginLeft: 4 }}>*</span>
          )}
        </label>
      )}
      
      <AntdInput
        value={value}
        onChange={handleChange}
        placeholder={element.props?.placeholder}
        disabled={element.props?.disabled}
        style={element.style}
        status={touched && error ? 'error' : undefined}
        {...a11yProps}
        {...props}
      />
      
      {touched && error && (
        <div
          {...getErrorA11yProps(fieldId)}
          style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}
        >
          {error.message}
        </div>
      )}
    </div>
  );
};

/**
 * 性能优化: 使用 React.memo 避免不必要的重渲染
 * 仅当 element.id、element.props、element.style 变化时才重新渲染
 */
export const AntdInputAdapter = memo(AntdInputAdapterComponent, (prevProps, nextProps) => {
  return (
    prevProps.element.id === nextProps.element.id &&
    JSON.stringify(prevProps.element.props) === JSON.stringify(nextProps.element.props) &&
    JSON.stringify(prevProps.element.style) === JSON.stringify(nextProps.element.style)
  );
});

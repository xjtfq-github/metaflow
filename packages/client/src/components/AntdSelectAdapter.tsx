import React, { useEffect } from 'react';
import { Select as AntdSelect } from 'antd';
import type { ComponentProps } from '../registry';
import { useFormContext } from '../SchemaForm';

/**
 * Ant Design Select 适配器
 */

export const AntdSelectAdapter: React.FC<ComponentProps> = ({ element, ...props }) => {
  const formContext = useFormContext();
  const fieldName = element.props?.name || element.id;

  useEffect(() => {
    if (formContext) {
      formContext.registerField({
        name: fieldName,
        defaultValue: element.props?.defaultValue,
        rules: element.props?.rules,
      });
    }
  }, [fieldName, element.props?.defaultValue, element.props?.rules, formContext]);

  const value = formContext?.getFieldValue(fieldName) ?? element.props?.defaultValue;
  const error = formContext?.errors[fieldName];
  const touched = formContext?.touched[fieldName];

  const handleChange = (newValue: any) => {
    formContext?.setFieldValue(fieldName, newValue);
    element.events?.onChange?.(newValue);
  };

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
      
      <AntdSelect
        value={value}
        onChange={handleChange}
        placeholder={element.props?.placeholder}
        disabled={element.props?.disabled}
        options={element.props?.options || []}
        style={{ width: '100%', ...element.style }}
        status={touched && error ? 'error' : undefined}
        {...props}
      />
      
      {touched && error && (
        <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
          {error.message}
        </div>
      )}
    </div>
  );
};

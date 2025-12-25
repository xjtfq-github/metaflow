import React, { createContext, useContext } from 'react';
import type { PageDSL } from '@metaflow/shared-types';
import { Renderer } from './renderer';
import { useFormEngine, UseFormEngineOptions } from './hooks/useFormEngine';

/**
 * 表单上下文
 */
interface FormContextValue {
  values: Record<string, any>;
  errors: Record<string, any>;
  touched: Record<string, boolean>;
  setFieldValue: (name: string, value: any) => void;
  getFieldValue: (name: string) => any;
  registerField: (config: any) => void;
}

const FormContext = createContext<FormContextValue | null>(null);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within SchemaForm');
  }
  return context;
};

/**
 * SchemaForm - 核心表单引擎
 * 
 * 功能:
 * 1. 将 Page DSL 转换为 React 组件树
 * 2. 管理表单状态 (values, errors, touched)
 * 3. 处理字段联动与依赖计算
 * 4. 统一事件分发
 */

interface SchemaFormProps extends UseFormEngineOptions {
  schema: PageDSL;
  children?: React.ReactNode;
}

export const SchemaForm: React.FC<SchemaFormProps> = ({
  schema,
  children,
  ...formOptions
}) => {
  const formEngine = useFormEngine(formOptions);

  const contextValue: FormContextValue = {
    values: formEngine.values,
    errors: formEngine.errors,
    touched: formEngine.touched,
    setFieldValue: formEngine.setFieldValue,
    getFieldValue: formEngine.getFieldValue,
    registerField: formEngine.registerField,
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form onSubmit={formEngine.handleSubmit}>
        {/* 渲染 DSL 定义的组件树 */}
        {schema.components.map((component) => (
          <Renderer key={component.id} component={component} />
        ))}
        
        {/* 自定义子元素 (如提交按钮) */}
        {children}
      </form>
    </FormContext.Provider>
  );
};

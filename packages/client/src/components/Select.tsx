/**
 * 下拉选择组件
 */
import React from 'react';
import { Select as AntSelect } from 'antd';
import type { ComponentProps } from '../registry';

export const Select: React.FC<ComponentProps> = ({ element }) => {
  const { 
    placeholder = '请选择',
    options = [
      { label: '选项1', value: '1' },
      { label: '选项2', value: '2' },
    ],
    dataSource,
    ...otherProps 
  } = element.props || {};
  
  return (
    <AntSelect 
      placeholder={placeholder}
      options={options}
      {...otherProps} 
      style={{ width: '100%', ...element.style }}
    />
  );
};

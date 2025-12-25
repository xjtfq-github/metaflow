/**
 * 日期选择组件
 */
import React from 'react';
import { DatePicker as AntDatePicker } from 'antd';
import type { ComponentProps } from '../registry';

export const DatePicker: React.FC<ComponentProps> = ({ element }) => {
  const { 
    placeholder = '选择日期',
    format = 'YYYY-MM-DD',
    ...otherProps 
  } = element.props || {};
  
  return (
    <AntDatePicker 
      placeholder={placeholder}
      format={format}
      {...otherProps} 
      style={{ width: '100%', ...element.style }}
    />
  );
};

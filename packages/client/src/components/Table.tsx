/**
 * 表格组件
 */
import React from 'react';
import { Table as AntTable } from 'antd';
import type { ComponentProps } from '../registry';

export const Table: React.FC<ComponentProps> = ({ element }) => {
  const { 
    columns = [
      { title: '列1', dataIndex: 'col1', key: 'col1' },
      { title: '列2', dataIndex: 'col2', key: 'col2' },
    ],
    dataSource,
    ...otherProps 
  } = element.props || {};
  
  // 如果dataSource是数据源配置对象，使用默认空数组
  const actualDataSource = Array.isArray(dataSource) 
    ? dataSource 
    : [{ key: '1', col1: '配置数据源后显示实际数据', col2: '-' }];
  
  return (
    <AntTable 
      columns={columns} 
      dataSource={actualDataSource} 
      {...otherProps} 
      style={element.style}
    />
  );
};

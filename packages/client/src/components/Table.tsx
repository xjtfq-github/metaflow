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
    dataSource = [
      { key: '1', col1: '数据1', col2: '数据2' },
    ],
    ...otherProps 
  } = element.props || {};
  
  return (
    <AntTable 
      columns={columns} 
      dataSource={dataSource} 
      {...otherProps} 
      style={element.style}
    />
  );
};

import React, { useEffect, useState } from 'react';
import { Input, Button, Select, DatePicker, Table, Image } from 'antd';
import type { ComponentDefinition } from '@metaflow/shared-types';

interface RenderEngineProps {
  dsl: ComponentDefinition;
}

export const RenderEngine: React.FC<RenderEngineProps> = ({ dsl }) => {
  const [dataCache, setDataCache] = useState<Record<string, any[]>>({});

  // 加载数据源数据
  const loadDataSource = async (modelName: string, query?: Record<string, any>) => {
    if (dataCache[modelName]) {
      return dataCache[modelName];
    }

    try {
      const queryString = query ? `?${new URLSearchParams(query).toString()}` : '';
      const response = await fetch(`/api/data/${modelName}${queryString}`);
      const result = await response.json();
      
      console.log('数据源API响应:', result);
      
      // 后端返回格式: { success: true, data: [...] }
      const data = result.data || [];
      
      console.log('解析后的数据:', data);
      
      setDataCache(prev => ({ ...prev, [modelName]: data }));
      return data;
    } catch (error) {
      console.error('加载数据源失败:', error);
      return [];
    }
  };

  const renderComponent = (component: ComponentDefinition): React.ReactNode => {
    const { type, props, style, children } = component;

    const commonStyle = {
      ...style,
      ...(props?.style || {}),
    };

    switch (type) {
      case 'Container':
        return (
          <div key={component.id} style={commonStyle}>
            {children?.map(child => renderComponent(child))}
          </div>
        );

      case 'Grid':
        return (
          <div
            key={component.id}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${props?.columns || 2}, 1fr)`,
              gap: props?.gap || 16,
              ...commonStyle,
            }}
          >
            {children?.map(child => renderComponent(child))}
          </div>
        );

      case 'Input':
        return <Input key={component.id} {...props} style={commonStyle} />;

      case 'Button':
        return (
          <Button key={component.id} {...props} style={commonStyle}>
            {props?.text || 'Button'}
          </Button>
        );

      case 'Text':
        return (
          <span key={component.id} style={commonStyle}>
            {props?.content || 'Text'}
          </span>
        );

      case 'Select':
        return <Select key={component.id} {...props} style={commonStyle} />;

      case 'DatePicker':
        return <DatePicker key={component.id} {...props} style={commonStyle} />;

      case 'Table': {
        // Table 需要特殊处理数据源
        const TableWrapper = () => {
          const [tableData, setTableData] = useState<any[]>([]);
          const [loading, setLoading] = useState(false);

          useEffect(() => {
            const dataSource = props?.dataSource;
            if (dataSource?.modelName && dataSource.autoLoad !== false) {
              setLoading(true);
              loadDataSource(dataSource.modelName, dataSource.query)
                .then(data => setTableData(data))
                .finally(() => setLoading(false));
            } else if (Array.isArray(props?.dataSource)) {
              // 兼容直接传入数组的情况
              setTableData(props.dataSource);
            }
          }, []);

          const { dataSource: _, ...restProps } = props || {};
          
          // 使用 dataSource.columns 或 props.columns
          const columns = props?.dataSource?.columns || props?.columns || [];
          
          console.log('Table props:', props);
          console.log('Table columns:', columns);
          console.log('Table data:', tableData);
          
          const tableProps = {
            ...restProps,
            columns,
            dataSource: tableData,
            loading,
          };

          return <Table {...tableProps} style={commonStyle} />;
        };

        return <TableWrapper key={component.id} />;
      }

      case 'Image':
        return <Image key={component.id} {...props} style={commonStyle} />;

      default:
        return (
          <div key={component.id} style={{ padding: 8, border: '1px dashed #ccc' }}>
            Unknown component: {type}
          </div>
        );
    }
  };

  return <>{renderComponent(dsl)}</>;
};

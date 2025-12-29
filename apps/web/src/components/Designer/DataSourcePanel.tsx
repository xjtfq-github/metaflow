import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Switch, Card, message } from 'antd';

interface DataSourcePanelProps {
  value?: {
    modelName?: string;
    query?: Record<string, any>;
    autoLoad?: boolean;
  };
  onChange?: (value: any) => void;
}

export const DataSourcePanel: React.FC<DataSourcePanelProps> = ({ value, onChange }) => {
  const [models, setModels] = useState<Array<{ name: string; displayName: string; fields?: any[] }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/schema');
      const data = await response.json();
      console.log('数据模型API响应:', data);
      
      const schemaList = data.data?.data || data.data || [];
      console.log('解析后的schema列表:', schemaList);
      
      const mappedModels = schemaList.map((s: any) => {
        // 解析 fields （可能是 JSON 字符串）
        let fields = [];
        try {
          fields = typeof s.fields === 'string' ? JSON.parse(s.fields) : (s.fields || []);
        } catch (e) {
          console.error('解析 fields 失败:', e);
        }
        
        return {
          name: s.name || s.entityName,
          displayName: s.label || s.displayName || s.name || s.entityName,
          fields,
        };
      });
      console.log('映射后的模型列表:', mappedModels);
      
      setModels(mappedModels);
    } catch (error) {
      console.error('加载数据模型失败:', error);
      message.error('加载数据模型失败');
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = (modelName: string) => {
    const selectedModel = models.find(m => m.name === modelName);
    
    // 自动生成 columns 配置
    const columns = selectedModel?.fields?.map((field: any) => ({
      title: field.label || field.key,
      dataIndex: field.key,
      key: field.key,
    })) || [];
    
    const newValue = { 
      ...value, 
      modelName,
      columns, // 自动设置 columns
    };
    onChange?.(newValue);
  };

  const handleChange = (field: string, val: any) => {
    const newValue = { ...value, [field]: val };
    onChange?.(newValue);
  };

  return (
    <div style={{ padding: 16 }}>
      <Card size="small" title="数据源配置">
        <Form layout="vertical">
          <Form.Item label="数据模型">
            <Select
              placeholder="选择数据模型"
              loading={loading}
              value={value?.modelName}
              onChange={handleModelChange}
              allowClear
              notFoundContent={loading ? '加载中...' : '暂无数据模型，请先在数据引擎中创建'}
            >
              {models.map((model) => (
                <Select.Option key={model.name} value={model.name}>
                  {model.displayName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="自动加载" tooltip="组件加载时自动获取数据">
            <Switch
              checked={value?.autoLoad !== false}
              onChange={(checked) => handleChange('autoLoad', checked)}
            />
          </Form.Item>

          {value?.modelName && (
            <Form.Item label="查询条件" tooltip="JSON格式的查询参数">
              <Input.TextArea
                rows={4}
                placeholder='{"status": "active"}'
                value={value?.query ? JSON.stringify(value.query, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const query = e.target.value ? JSON.parse(e.target.value) : {};
                    handleChange('query', query);
                  } catch (err) {
                    // 输入中，暂不处理
                  }
                }}
              />
            </Form.Item>
          )}
        </Form>
      </Card>
    </div>
  );
};

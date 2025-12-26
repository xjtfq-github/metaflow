/**
 * 数据源配置组件
 * 
 * 集成到现有设计器中作为数据源配置
 */

import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Form, Input, Table, message, Space, Tabs } from 'antd';
import type { ModelDSL } from '@metaflow/shared-types';
import { DataModelManager } from './DataModelManager';
import { DataRecordManager } from './DataRecordManager';

const { Option } = Select;
const { TabPane } = Tabs;

interface DataSourceConfigProps {
  value?: any;
  onChange?: (value: any) => void;
}

export const DataSourceConfig: React.FC<DataSourceConfigProps> = ({ value, onChange }) => {
  const [models, setModels] = useState<ModelDSL[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 模拟加载数据模型
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      const response = await fetch('/api/schema/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data);
      } else {
        // 模拟数据
        setModels([
          {
            id: 'user',
            entityName: 'user',
            displayName: '用户表',
            description: '系统用户信息',
            fields: [
              { key: 'id', type: 'string', required: true, label: 'ID' },
              { key: 'name', type: 'string', required: true, label: '姓名' },
              { key: 'email', type: 'string', required: true, label: '邮箱' },
              { key: 'age', type: 'number', required: false, label: '年龄' },
            ],
            version: '1.0.0',
            relations: [],
            timestamps: true,
          },
          {
            id: 'order',
            entityName: 'order',
            displayName: '订单表',
            description: '订单信息',
            fields: [
              { key: 'id', type: 'string', required: true, label: 'ID' },
              { key: 'userId', type: 'string', required: true, label: '用户ID' },
              { key: 'amount', type: 'number', required: true, label: '金额' },
              { key: 'status', type: 'string', required: true, label: '状态' },
            ],
            version: '1.0.0',
            relations: [],
            timestamps: true,
          },
        ]);
      }
    } catch (error) {
      console.error('加载数据模型失败:', error);
      message.error('加载数据模型失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理模型选择变化
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    const model = models.find(m => m.id === modelId);
    if (model && onChange) {
      onChange({
        ...value,
        modelId,
        modelName: model.displayName,
      });
    }
  };

  // 获取当前选中的模型
  const currentModel = models.find(m => m.id === selectedModel);

  return (
    <Card title="数据源配置" loading={loading}>
      <Tabs defaultActiveKey="config" tabPosition="left">
        <TabPane tab="配置" key="config">
          <Form layout="vertical">
            <Form.Item label="选择数据模型">
              <Select
                placeholder="请选择数据模型"
                value={selectedModel || undefined}
                onChange={handleModelChange}
                allowClear
              >
                {models.map(model => (
                  <Option key={model.id} value={model.id}>
                    {model.displayName}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {selectedModel && currentModel && (
              <Form.Item label="数据模型详情">
                <Card size="small">
                  <p><strong>模型ID:</strong> {currentModel.id}</p>
                  <p><strong>名称:</strong> {currentModel.displayName}</p>
                  <p><strong>描述:</strong> {currentModel.description}</p>
                  <p><strong>字段数:</strong> {currentModel.fields.length}</p>
                </Card>
              </Form.Item>
            )}
          </Form>
        </TabPane>

        <TabPane tab="模型管理" key="model">
          <DataModelManager 
            onModelSelect={(model) => {
              setSelectedModel(model.id);
              if (onChange) {
                onChange({
                  ...value,
                  modelId: model.id,
                  modelName: model.displayName,
                });
              }
            }} 
          />
        </TabPane>

        {selectedModel && currentModel && (
          <TabPane tab="数据管理" key="data">
            <DataRecordManager model={currentModel} />
          </TabPane>
        )}
      </Tabs>
    </Card>
  );
};

export default DataSourceConfig;
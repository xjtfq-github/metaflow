/**
 * 属性面板
 * 
 * 根据选中组件动态展示配置表单
 */

import React from 'react';
import { Tabs, Empty, Button, Form, Input, Switch, InputNumber, Select } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useDesignerStore } from '../../store/designer';
import type { FieldDefinition } from '@metaflow/shared-types';
import { EventPanel } from './EventPanel';
import { DataSourcePanel } from './DataSourcePanel';

export const SettingsPanel: React.FC = () => {
  const { dsl, selectedId, updateComponent, deleteComponent } = useDesignerStore();

  // 查找选中的组件
  const findComponent = (component: any, id: string): any => {
    if (component.id === id) return component;
    if (component.children) {
      for (const child of component.children) {
        const found = findComponent(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedComponent = dsl && selectedId ? findComponent(dsl, selectedId) : null;

  if (!selectedComponent) {
    return (
      <div style={{ padding: 16 }}>
        <Empty description="未选中任何组件" />
      </div>
    );
  }

  // 组件配置 Schema
  const getComponentSchema = (type: string): FieldDefinition[] => {
    const schemas: Record<string, FieldDefinition[]> = {
      Input: [
        { key: 'placeholder', type: 'string', label: '占位符' },
        { key: 'defaultValue', type: 'string', label: '默认值' },
        { key: 'disabled', type: 'boolean', label: '禁用' },
      ],
      Button: [
        { key: 'text', type: 'string', label: '按钮文字', required: true },
        { key: 'type', type: 'string', label: '类型', options: [
          { label: 'default', value: 'default' },
          { label: 'primary', value: 'primary' },
          { label: 'dashed', value: 'dashed' },
        ]},
      ],
      Text: [
        { key: 'content', type: 'string', label: '文本内容', required: true },
      ],
      Container: [
        { key: 'padding', type: 'number', label: '内边距' },
        { key: 'backgroundColor', type: 'string', label: '背景色' },
      ],
    };
    return schemas[type] || [];
  };

  const fields = getComponentSchema(selectedComponent.type);

  // 需要数据源的组件类型
  const needsDataSource = ['Table', 'Select', 'List'].includes(selectedComponent.type);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>{selectedComponent.type}</h3>
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => deleteComponent(selectedComponent.id)}
        >
          删除
        </Button>
      </div>

      <Tabs
        items={[
          {
            key: 'props',
            label: '属性',
            children: (
              <Form
                layout="vertical"
                initialValues={selectedComponent.props || {}}
                onValuesChange={(_, allValues) => {
                  updateComponent(selectedComponent.id, { props: allValues });
                }}
              >
                {fields.map((field) => {
                  const rules = field.required ? [{ required: true, message: `请输入${field.label}` }] : [];
                  
                  let input;
                  if (field.type === 'boolean') {
                    input = <Switch />;
                  } else if (field.type === 'number') {
                    input = <InputNumber style={{ width: '100%' }} />;
                  } else if (field.options) {
                    input = (
                      <Select>
                        {field.options?.map((opt) => (
                          <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                        ))}
                      </Select>
                    );
                  } else {
                    input = <Input />;
                  }
                  
                  return (
                    <Form.Item
                      key={field.key}
                      name={field.key}
                      label={field.label}
                      rules={rules}
                      valuePropName={field.type === 'boolean' ? 'checked' : 'value'}
                    >
                      {input}
                    </Form.Item>
                  );
                })}
              </Form>
            ),
          },
          {
            key: 'events',
            label: '事件',
            children: <EventPanel componentId={selectedComponent.id} />,
          },
          ...(needsDataSource ? [{
            key: 'data',
            label: '数据源',
            children: (
              <DataSourcePanel
                value={selectedComponent.props?.dataSource}
                onChange={(dataSource) => {
                  updateComponent(selectedComponent.id, { 
                    props: { 
                      ...selectedComponent.props, 
                      dataSource 
                    } 
                  });
                }}
              />
            ),
          }] : []),
          {
            key: 'style',
            label: '样式',
            children: (
              <Form
                layout="vertical"
                initialValues={selectedComponent.style || {}}
                onValuesChange={(_, allValues) => {
                  updateComponent(selectedComponent.id, { style: allValues });
                }}
              >
                <Form.Item name="width" label="宽度">
                  <Input placeholder="auto" />
                </Form.Item>
                <Form.Item name="height" label="高度">
                  <Input placeholder="auto" />
                </Form.Item>
                <Form.Item name="margin" label="外边距">
                  <Input placeholder="0" />
                </Form.Item>
                <Form.Item name="padding" label="内边距">
                  <Input placeholder="0" />
                </Form.Item>
                <Form.Item name="backgroundColor" label="背景色">
                  <Input placeholder="transparent" />
                </Form.Item>
              </Form>
            ),
          },
        ]}
      />
    </div>
  );
};

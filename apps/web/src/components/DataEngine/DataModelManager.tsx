/**
 * 数据模型管理器
 * 
 * 提供可视化数据表管理功能
 */

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, message, Space, Popconfirm } from 'antd';
import type { ModelDSL, FieldDefinition } from '@metaflow/shared-types';

const { Option } = Select;

interface DataModelManagerProps {
  onModelSelect?: (model: ModelDSL) => void;
}

export const DataModelManager: React.FC<DataModelManagerProps> = ({ onModelSelect }) => {
  const [models, setModels] = useState<ModelDSL[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelDSL | null>(null);
  const [form] = Form.useForm();

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

  const handleCreateModel = () => {
    setEditingModel(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditModel = (model: ModelDSL) => {
    setEditingModel(model);
    form.setFieldsValue({
      id: model.id,
      displayName: model.displayName,
      description: model.description,
      fields: model.fields,
    });
    setIsModalVisible(true);
  };

  const handleDeleteModel = async (modelId: string) => {
    try {
      const response = await fetch(`/api/schema/models/${modelId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        message.success('删除成功');
        loadModels();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      console.error('删除数据模型失败:', error);
      message.error('删除失败');
    }
  };

  const handleSaveModel = async (values: any) => {
    try {
      const modelData: ModelDSL = {
        id: values.id,
        displayName: values.displayName,
        description: values.description,
        entityName: values.id,
        fields: values.fields || [],
        version: '1.0.0',
        timestamps: true,
        relations: [],

      };

      if (editingModel) {
        // 更新现有模型
        const response = await fetch(`/api/schema/models/${editingModel.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(modelData),
        });
        
        if (response.ok) {
          message.success('更新成功');
        } else {
          message.error('更新失败');
          return;
        }
      } else {
        // 创建新模型
        const response = await fetch('/api/schema/models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(modelData),
        });
        
        if (response.ok) {
          message.success('创建成功');
        } else {
          message.error('创建失败');
          return;
        }
      }

      setIsModalVisible(false);
      loadModels();
    } catch (error) {
      console.error('保存数据模型失败:', error);
      message.error('保存失败');
    }
  };

  const columns = [
    {
      title: '模型ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '名称',
      dataIndex: 'displayName',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '字段数',
      dataIndex: 'fields',
      key: 'fieldCount',
      render: (fields: FieldDefinition[]) => fields.length,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ModelDSL) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => {
              onModelSelect?.(record);
            }}
          >
            查看数据
          </Button>
          <Button 
            type="link" 
            onClick={() => handleEditModel(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个数据模型吗？"
            onConfirm={() => handleDeleteModel(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleCreateModel}>
          新建数据模型
        </Button>
      </div>

      <Card>
        <Table
          dataSource={models}
          columns={columns}
          rowKey="id"
          loading={loading}
        />
      </Card>

      {/* 数据模型编辑弹窗 */}
      <Modal
        title={editingModel ? '编辑数据模型' : '新建数据模型'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveModel}
        >
          <Form.Item
            name="id"
            label="模型ID"
            rules={[{ required: true, message: '请输入模型ID' }]}
          >
            <Input placeholder="输入模型唯一标识，如: user, order" />
          </Form.Item>

          <Form.Item
            name="displayName"
            label="模型名称"
            rules={[{ required: true, message: '请输入模型名称' }]}
          >
            <Input placeholder="输入模型显示名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="输入模型描述信息" rows={3} />
          </Form.Item>

          <Form.Item label="字段配置">
            <FieldConfigForm />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

/**
 * 字段配置表单组件
 */
const FieldConfigForm: React.FC = () => {
  const [fields, setFields] = useState<FieldDefinition[]>([
    { key: 'id', label: 'ID', type: 'string', required: true }
  ]);
  const [newField, setNewField] = useState<Omit<FieldDefinition, 'id'>>({ 
    key: '', 
    label: '',
    type: 'string', 
    required: false 
  });

  const addField = () => {
    if (!newField.key) {
      message.warning('请输入字段名称');
      return;
    }
    
    // 检查字段名是否重复
    if (fields.some(f => f.key === newField.key)) {
      message.warning('字段名已存在');
      return;
    }

    setFields([...fields, { ...newField }]);
    setNewField({ key: '', label: '', type: 'string', required: false });
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="字段名"
            value={newField.key}
            onChange={(e) => setNewField({ ...newField, key: e.target.value })}
            style={{ width: 150 }}
          />
          <Select
            value={newField.type}
            onChange={(value) => setNewField({ ...newField, type: value })}
            style={{ width: 120 }}
          >
            <Option value="string">文本</Option>
            <Option value="number">数字</Option>
            <Option value="boolean">布尔</Option>
            <Option value="date">日期</Option>
            <Option value="object">对象</Option>
          </Select>
          <Button onClick={addField}>添加字段</Button>
        </Space>
      </div>

      <Table
        dataSource={fields.map((field, index) => ({ ...field, index }))}
        columns={[
          {
            title: '字段名',
            dataIndex: 'key',
            key: 'name',
          },
          {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => {
              const typeMap: Record<string, string> = {
                string: '文本',
                number: '数字',
                boolean: '布尔',
                date: '日期',
                object: '对象',
              };
              return typeMap[type] || type;
            },
          },
          {
            title: '必填',
            dataIndex: 'required',
            key: 'required',
            render: (required: boolean) => required ? '是' : '否',
          },
          {
            title: '主键',
            dataIndex: 'primaryKey',
            key: 'primaryKey',
            render: (primaryKey: boolean) => primaryKey ? '是' : '否',
          },
          {
            title: '操作',
            key: 'action',
            render: (_: any, record: FieldDefinition & { index: number }) => (
              <Button 
                type="link" 
                danger 
                onClick={() => removeField(record.index)}
              >
                删除
              </Button>
            ),
          },
        ]}
        pagination={false}
        size="small"
      />
    </div>
  );
};
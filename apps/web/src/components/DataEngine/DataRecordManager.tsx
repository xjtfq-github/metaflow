/**
 * 数据记录管理器
 * 
 * 提供数据记录的增删改查界面
 */

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, message, Space, Popconfirm, Drawer } from 'antd';
import type { ModelDSL, FieldDefinition } from '@metaflow/shared-types';

const { Option } = Select;

interface DataRecordManagerProps {
  model: ModelDSL;
}

export const DataRecordManager: React.FC<DataRecordManagerProps> = ({ model }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();

  // 模拟加载数据记录
  useEffect(() => {
    loadRecords();
  }, [model]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      const response = await fetch(`/api/data/${model.id}`);
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      } else {
        // 模拟数据
        setRecords([
          { id: '1', name: '张三', email: 'zhangsan@example.com', age: 25 },
          { id: '2', name: '李四', email: 'lisi@example.com', age: 30 },
          { id: '3', name: '王五', email: 'wangwu@example.com', age: 28 },
        ]);
      }
    } catch (error) {
      console.error('加载数据记录失败:', error);
      message.error('加载数据记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditRecord = (record: any) => {
    setEditingRecord(record);
    // 将记录数据设置到表单中
    const formValues: any = {};
    model.fields.forEach(field => {
      formValues[field.key] = record[field.key];
    });
    form.setFieldsValue(formValues);
    setIsModalVisible(true);
  };

  const handleViewRecord = (record: any) => {
    setEditingRecord(record);
    setIsDrawerVisible(true);
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const response = await fetch(`/api/data/${model.id}/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        message.success('删除成功');
        loadRecords();
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      console.error('删除数据记录失败:', error);
      message.error('删除失败');
    }
  };

  const handleSaveRecord = async (values: any) => {
    try {
      if (editingRecord) {
        // 更新现有记录
        const response = await fetch(`/api/data/${model.id}/${editingRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        
        if (response.ok) {
          message.success('更新成功');
        } else {
          message.error('更新失败');
          return;
        }
      } else {
        // 创建新记录
        const response = await fetch(`/api/data/${model.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        
        if (response.ok) {
          message.success('创建成功');
        } else {
          message.error('创建失败');
          return;
        }
      }

      setIsModalVisible(false);
      loadRecords();
    } catch (error) {
      console.error('保存数据记录失败:', error);
      message.error('保存失败');
    }
  };

  // 根据字段类型渲染对应的表单控件
  const renderFieldControl = (field: FieldDefinition) => {
    switch (field.type) {
      case 'number':
        return <InputNumber style={{ width: '100%' }} />;
      case 'boolean':
        return (
          <Select>
            <Option value={true}>是</Option>
            <Option value={false}>否</Option>
          </Select>
        );
      case 'date':
        return <Input type="date" />;
      case 'enum':
        return (
          <Select>
            {field.options?.map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
        );
      default:
        return <Input />;
    }
  };

  // 生成表格列配置
  const columns = model.fields.map(field => ({
    title: field.label,
    dataIndex: field.key,
    key: field.key,
    render: (value: any, record: any) => {
      if (field.type === 'boolean') {
        return value ? '是' : '否';
      }
      return value;
    },
  }));

  // 添加操作列
  columns.push({
    title: '操作',
    key: 'action',
    dataIndex: 'action',
    render: (_, record: any) => (
      <Space size="middle">
        <Button 
          type="link" 
          onClick={() => handleViewRecord(record)}
        >
          查看
        </Button>
        <Button 
          type="link" 
          onClick={() => handleEditRecord(record)}
        >
          编辑
        </Button>
        <Popconfirm
          title="确定要删除这条记录吗？"
          onConfirm={() => handleDeleteRecord(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger>删除</Button>
        </Popconfirm>
      </Space>
    ),
  });

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleCreateRecord}>
          新增{model.displayName}记录
        </Button>
      </div>

      <Card title={`${model.displayName}列表`}>
        <Table
          dataSource={records}
          columns={columns}
          rowKey="id"
          loading={loading}
        />
      </Card>

      {/* 数据记录编辑弹窗 */}
      <Modal
        title={editingRecord ? `编辑${model.displayName}` : `新建${model.displayName}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveRecord}
        >
          {model.fields.map(field => (
            <Form.Item
              key={field.key}
              name={field.key}
              label={field.label}
              rules={field.required ? [{ required: true, message: `请输入${field.label}` }] : []}
            >
              {renderFieldControl(field)}
            </Form.Item>
          ))}

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

      {/* 数据记录详情抽屉 */}
      <Drawer
        title={`${model.displayName}详情`}
        open={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        width={600}
      >
        {editingRecord && (
          <div>
            {model.fields.map(field => (
              <div key={field.key} style={{ marginBottom: 16 }}>
                <h4>{field.label}</h4>
                <p>
                  {field.type === 'boolean' 
                    ? (editingRecord[field.key] ? '是' : '否')
                    : editingRecord[field.key] || '-'
                  }
                </p>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
};
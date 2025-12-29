/**
 * 数据记录管理器
 * 
 * 提供数据表的增删改查功能
 */

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, message, Space, Popconfirm } from 'antd';
import type { ModelDSL, FieldDefinition } from '@metaflow/shared-types';

interface DataRecordManagerProps {
  model: ModelDSL;
  onBack?: () => void;
}

export const DataRecordManager: React.FC<DataRecordManagerProps> = ({ model, onBack }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRecords();
  }, [model.entityName]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/data/${model.entityName}`);
      const data = await response.json();
      console.log('加载数据记录响应:', data);
      
      if (!response.ok) {
        console.warn('数据记录API未实现，使用空数据');
        setRecords([]);
        return;
      }
      
      const recordList = data.data?.data || data.data || [];
      setRecords(Array.isArray(recordList) ? recordList : []);
    } catch (error) {
      console.error('加载数据记录失败:', error);
      setRecords([]);
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
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      const response = await fetch(`/api/data/${model.entityName}/${recordId}`, {
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
      let response;
      if (editingRecord) {
        response = await fetch(`/api/data/${model.entityName}/${editingRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
      } else {
        response = await fetch(`/api/data/${model.entityName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
      }
      
      if (!response.ok) {
        message.error('数据记录API未实现，请稍后再试');
        return;
      }
      
      message.success(editingRecord ? '更新成功' : '创建成功');
      setIsModalVisible(false);
      loadRecords();
    } catch (error) {
      console.error('保存数据记录失败:', error);
      message.error('保存失败');
    }
  };

  // 根据字段定义生成表格列
  const columns = [
    ...model.fields.map((field: FieldDefinition) => ({
      title: field.label || field.key,
      dataIndex: field.key,
      key: field.key,
    })),
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="middle">
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
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Button onClick={onBack} style={{ marginRight: 8 }}>返回</Button>
          <span style={{ fontSize: 16, fontWeight: 'bold' }}>
            {model.displayName || model.entityName} - 数据记录管理
          </span>
        </div>
        <Button type="primary" onClick={handleCreateRecord}>
          新建记录
        </Button>
      </div>

      <Card>
        <Table
          dataSource={records}
          columns={columns}
          rowKey="id"
          loading={loading}
        />
      </Card>

      {/* 数据记录编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑记录' : '新建记录'}
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
          {model.fields.map((field: FieldDefinition) => (
            <Form.Item
              key={field.key}
              name={field.key}
              label={field.label || field.key}
              rules={[{ required: field.required, message: `请输入${field.label || field.key}` }]}
            >
              {field.type === 'number' ? (
                <Input type="number" />
              ) : (
                <Input />
              )}
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
    </div>
  );
};

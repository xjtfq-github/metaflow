import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, RocketOutlined, EyeOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

interface App {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const AppManagerPage: React.FC<{ onDesign?: (appId: string) => void }> = ({ onDesign }) => {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [form] = Form.useForm();

  // 加载应用列表
  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/apps');
      const data = await response.json();
      if (data.success) {
        setApps(data.data);
      }
    } catch (error) {
      message.error('加载应用列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建应用
  const handleCreate = () => {
    setEditingApp(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 编辑应用
  const handleEdit = (app: App) => {
    setEditingApp(app);
    form.setFieldsValue(app);
    setModalVisible(true);
  };

  // 保存应用
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const url = editingApp ? `/api/apps/${editingApp.id}` : '/api/apps';
      const method = editingApp ? 'PUT' : 'POST';

      console.log('创建应用请求:', { url, method, values });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      console.log('响应状态:', response.status);
      const data = await response.json();
      console.log('响应数据:', data);

      if (data.success) {
        message.success(editingApp ? '更新成功' : '创建成功');
        setModalVisible(false);
        loadApps();
      } else {
        message.error(data.message || '操作失败');
      }
    } catch (error) {
      console.error('创建应用错误:', error);
      if (error instanceof Error) {
        message.error(`操作失败: ${error.message}`);
      } else {
        message.error('操作失败');
      }
    } finally {
      setLoading(false);
    }
  };

  // 删除应用
  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/apps/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        message.success('删除成功');
        loadApps();
      } else {
        message.error(data.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    } finally {
      setLoading(false);
    }
  };

  // 发布应用
  const handlePublish = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/apps/${id}/publish`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        message.success('发布成功');
        loadApps();
      } else {
        message.error(data.message || '发布失败');
      }
    } catch (error) {
      message.error('发布失败');
    } finally {
      setLoading(false);
    }
  };

  // 状态标签
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: '草稿' },
      published: { color: 'success', text: '已发布' },
      archived: { color: 'warning', text: '已归档' },
    };
    const config = statusMap[status] || statusMap.draft;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '应用名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: App) => (
        <Space>
          <span style={{ fontSize: 20 }}>{record.icon || '📱'}</span>
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 120,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (date: Date) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_: any, record: App) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onDesign?.(record.id)}
          >
            设计
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.status === 'draft' && (
            <Button
              type="link"
              size="small"
              icon={<RocketOutlined />}
              onClick={() => handlePublish(record.id)}
            >
              发布
            </Button>
          )}
          <Popconfirm
            title="确定删除此应用吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="应用管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建应用
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={apps}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingApp ? '编辑应用' : '创建应用'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={600}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="应用名称"
            name="name"
            rules={[{ required: true, message: '请输入应用名称' }]}
          >
            <Input placeholder="例如：HSE隐患排查系统" />
          </Form.Item>

          <Form.Item
            label="应用图标"
            name="icon"
            tooltip="输入Emoji图标"
          >
            <Input placeholder="例如：🔍" maxLength={2} />
          </Form.Item>

          <Form.Item
            label="应用描述"
            name="description"
            rules={[{ required: true, message: '请输入应用描述' }]}
          >
            <TextArea
              rows={4}
              placeholder="简要描述应用的功能和用途"
            />
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            initialValue="draft"
          >
            <Select>
              <Option value="draft">草稿</Option>
              <Option value="published">已发布</Option>
              <Option value="archived">已归档</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AppManagerPage;

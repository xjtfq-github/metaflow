import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm, Descriptions, Timeline } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, PauseCircleOutlined, FormOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

interface WorkflowNode {
  id: string;
  type: 'start' | 'task' | 'gateway' | 'end';
  name: string;
  config?: any;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  nodes: WorkflowNode[];
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowInstance {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'suspended';
  currentNode: string;
  startedAt: Date;
  completedAt?: Date;
}

export const WorkflowPage: React.FC<{ onDesign?: (workflowId: string) => void }> = ({ onDesign }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [startModalVisible, setStartModalVisible] = useState(false);
  const [startingWorkflow, setStartingWorkflow] = useState<Workflow | null>(null);
  const [instanceModalVisible, setInstanceModalVisible] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null);
  const [form] = Form.useForm();
  const [startForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState<'definition' | 'instance'>('definition');

  useEffect(() => {
    loadWorkflows();
    loadInstances();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/workflows');
      const data = await response.json();
      if (data.success) {
        setWorkflows(data.data);
      }
    } catch (error) {
      message.error('加载工作流列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadInstances = async () => {
    try {
      const response = await fetch('/api/workflows/instances');
      const data = await response.json();
      if (data.success) {
        setInstances(data.data);
      }
    } catch (error) {
      message.error('加载工作流实例失败');
    }
  };

  // 设计工作流
  const handleDesign = (workflowId: string) => {
    if (onDesign) {
      onDesign(workflowId);
    }
  };

  // 创建工作流
  const handleCreate = () => {
    setEditingWorkflow(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'active',
      nodes: [],
    });
    setModalVisible(true);
  };

  // 编辑工作流
  const handleEdit = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    form.setFieldsValue(workflow);
    setModalVisible(true);
  };

  // 保存工作流
  const handleSave = async () => {
    try {
      console.log('开始保存工作流...');
      const values = await form.validateFields();
      console.log('表单验证通过，提交数据:', values);
      setLoading(true);

      const url = editingWorkflow ? `/api/workflows/${editingWorkflow.id}` : '/api/workflows';
      const method = editingWorkflow ? 'PUT' : 'POST';
      console.log(`发起请求: ${method} ${url}`);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      console.log('响应状态:', response.status, response.statusText);
      const data = await response.json();
      console.log('响应数据:', data);

      if (data.success) {
        message.success(editingWorkflow ? '更新成功' : '创建成功');
        setModalVisible(false);
        loadWorkflows();
      } else {
        console.error('业务失败:', data);
        message.error(data.message || '操作失败');
      }
    } catch (error) {
      console.error('保存工作流错误:', error);
      message.error('操作失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 删除工作流
  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        message.success('删除成功');
        loadWorkflows();
      } else {
        message.error(data.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    } finally {
      setLoading(false);
    }
  };

  // 启动工作流
  const handleStart = async (workflow: Workflow) => {
    setStartingWorkflow(workflow);
    startForm.resetFields();
    setStartModalVisible(true);
  };

  // 提交启动表单
  const handleSubmitStart = async () => {
    try {
      const values = await startForm.validateFields();
      setLoading(true);

      const response = await fetch(`/api/workflows/${startingWorkflow?.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: values.title || `${startingWorkflow?.name} - ${new Date().toLocaleDateString()}`,
          variables: values.variables || {},
          initiator: 'user-1', // 实际应用中从用户上下文获取
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('流程启动成功');
        setStartModalVisible(false);
        loadInstances();
        setActiveTab('instance'); // 自动切换到实例列表
      } else {
        message.error(data.message || '启动失败');
      }
    } catch (error) {
      message.error('启动失败');
      console.error('启动流程失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 查看实例详情
  const handleViewInstance = (instance: WorkflowInstance) => {
    setSelectedInstance(instance);
    setInstanceModalVisible(true);
  };

  // 状态标签
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      active: { color: 'success', text: '活动' },
      inactive: { color: 'default', text: '未激活' },
      draft: { color: 'warning', text: '草稿' },
      running: { color: 'processing', text: '运行中' },
      completed: { color: 'success', text: '已完成' },
      failed: { color: 'error', text: '失败' },
      suspended: { color: 'warning', text: '已暂停' },
    };
    const config = statusMap[status] || statusMap.draft;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const workflowColumns = [
    {
      title: '工作流名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '节点数',
      dataIndex: 'nodes',
      key: 'nodes',
      width: 100,
      render: (nodes: WorkflowNode[]) => <Tag color="blue">{nodes?.length || 0} 个</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
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
      render: (_: any, record: Workflow) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<FormOutlined />}
            onClick={() => handleDesign(record.id)}
          >
            设计
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleStart(record)}
            disabled={record.status !== 'active'}
          >
            启动
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此工作流吗？"
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

  const instanceColumns = [
    {
      title: '实例ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      ellipsis: true,
    },
    {
      title: '工作流名称',
      dataIndex: 'workflowName',
      key: 'workflowName',
    },
    {
      title: '当前节点',
      dataIndex: 'currentNode',
      key: 'currentNode',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '开始时间',
      dataIndex: 'startedAt',
      key: 'startedAt',
      width: 180,
      render: (date: Date) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: WorkflowInstance) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => handleViewInstance(record)}
          >
            查看
          </Button>
          {record.status === 'running' && (
            <Button
              type="link"
              size="small"
              icon={<PauseCircleOutlined />}
            >
              暂停
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="工作流管理"
        extra={
          <Space>
            <Button
              type={activeTab === 'definition' ? 'primary' : 'default'}
              onClick={() => setActiveTab('definition')}
            >
              工作流定义
            </Button>
            <Button
              type={activeTab === 'instance' ? 'primary' : 'default'}
              onClick={() => setActiveTab('instance')}
            >
              运行实例
            </Button>
            {activeTab === 'definition' && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                创建工作流
              </Button>
            )}
          </Space>
        }
      >
        {activeTab === 'definition' ? (
          <Table
            columns={workflowColumns}
            dataSource={workflows}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        ) : (
          <Table
            columns={instanceColumns}
            dataSource={instances}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        )}
      </Card>

      {/* 创建/编辑工作流模态框 */}
      <Modal
        title={editingWorkflow ? '编辑工作流' : '创建工作流'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={700}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="工作流名称"
            name="name"
            rules={[{ required: true, message: '请输入工作流名称' }]}
          >
            <Input placeholder="例如：隐患整改审批流程" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <TextArea rows={3} placeholder="简要描述工作流的用途" />
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            initialValue="active"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Option value="draft">草稿</Option>
              <Option value="active">活动</Option>
              <Option value="inactive">未激活</Option>
            </Select>
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <div style={{ padding: 12, background: '#f0f2f5', borderRadius: 4 }}>
              <p style={{ margin: 0, marginBottom: 8 }}>💡 工作流节点设计功能正在开发中</p>
              <p style={{ margin: 0 }}>当前可以创建基础工作流定义，后续将提供可视化流程设计器</p>
            </div>
          </div>
        </Form>
      </Modal>

      {/* 启动流程模态框 */}
      <Modal
        title={`启动流程：${startingWorkflow?.name}`}
        open={startModalVisible}
        onOk={handleSubmitStart}
        onCancel={() => setStartModalVisible(false)}
        width={600}
        confirmLoading={loading}
        okText="启动"
        cancelText="取消"
      >
        <Form form={startForm} layout="vertical">
          <Form.Item
            label="实例标题"
            name="title"
            rules={[{ required: true, message: '请输入实例标题' }]}
            initialValue={`${startingWorkflow?.name} - ${new Date().toLocaleDateString()}`}
          >
            <Input placeholder="为本次流程实例起一个标题" />
          </Form.Item>

          <Form.Item
            label="流程描述"
            name="description"
          >
            <TextArea rows={3} placeholder="可选：简要说明本次流程的背景或目的" />
          </Form.Item>

          <div style={{ marginTop: 16 }}>
            <div style={{ padding: 12, background: '#f0f2f5', borderRadius: 4 }}>
              <p style={{ margin: 0 }}>💡 流程变量配置功能开发中</p>
              <p style={{ margin: 0, fontSize: 12, color: '#666' }}>后续将支持在启动时配置流程变量</p>
            </div>
          </div>
        </Form>
      </Modal>

      {/* 实例详情模态框 */}
      <Modal
        title="工作流实例详情"
        open={instanceModalVisible}
        onCancel={() => setInstanceModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedInstance && (
          <div>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="实例ID">{selectedInstance.id}</Descriptions.Item>
              <Descriptions.Item label="工作流">{selectedInstance.workflowName}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(selectedInstance.status)}</Descriptions.Item>
              <Descriptions.Item label="当前节点">{selectedInstance.currentNode}</Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {new Date(selectedInstance.startedAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {selectedInstance.completedAt
                  ? new Date(selectedInstance.completedAt).toLocaleString()
                  : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Card title="执行时间线" style={{ marginTop: 16 }} size="small">
              <Timeline>
                <Timeline.Item color="green">
                  开始节点 - {new Date(selectedInstance.startedAt).toLocaleString()}
                </Timeline.Item>
                <Timeline.Item color="blue">
                  {selectedInstance.currentNode} - 进行中
                </Timeline.Item>
                {selectedInstance.completedAt && (
                  <Timeline.Item color="gray">
                    结束节点 - {new Date(selectedInstance.completedAt).toLocaleString()}
                  </Timeline.Item>
                )}
              </Timeline>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WorkflowPage;

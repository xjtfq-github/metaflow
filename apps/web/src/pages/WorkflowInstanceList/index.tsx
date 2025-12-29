import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Select,
  DatePicker,
  message,
  Modal,
  Form,
  Input,
} from 'antd';
import {
  ReloadOutlined,
  EyeOutlined,
  StopOutlined,
  ProjectOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import './index.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface WorkflowInstance {
  id: string;
  workflowId: string;
  status: string;
  currentNode: string;
  variables: Record<string, any>;
  initiator: string;
  createdAt: string;
  completedAt?: string;
  workflow: {
    name: string;
    description?: string;
  };
}

interface WorkflowInstanceListProps {
  workflowId?: string;
  onViewDetail?: (instanceId: string) => void;
  onViewDiagram?: (instanceId: string) => void;
}

const WorkflowInstanceList: React.FC<WorkflowInstanceListProps> = ({
  workflowId: propWorkflowId,
  onViewDetail,
  onViewDiagram,
}) => {
  const [loading, setLoading] = useState(false);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [workflowFilter, setWorkflowFilter] = useState<string>('');
  const [workflows, setWorkflows] = useState<Array<{ id: string; name: string }>>([]);
  const [startModalVisible, setStartModalVisible] = useState(false);
  const [startForm] = Form.useForm();
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null);

  // 使用传入的 workflowId 或用户选择的
  const effectiveWorkflowId = propWorkflowId || workflowFilter;

  // 获取流程列表（用于筛选）
  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows?tenantId=tenant-1');
      const result = await response.json();
      if (result.success) {
        setWorkflows(result.data || []);
        // 如果有传入的 workflowId，加载对应的流程信息
        if (propWorkflowId) {
          const workflow = (result.data || []).find((w: any) => w.id === propWorkflowId);
          setCurrentWorkflow(workflow);
        }
      }
    } catch (error) {
      console.error('获取流程列表失败:', error);
    }
  };

  // 获取流程实例列表
  const fetchInstances = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenantId: 'tenant-1',
        pageSize: String(pageSize),
        pageNumber: String(currentPage),
      });

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      if (effectiveWorkflowId) {
        params.append('workflowId', effectiveWorkflowId);
      }

      const response = await fetch(`/api/workflows/instances?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setInstances(result.data.items);
        setTotal(result.data.total);
      } else {
        message.error(result.message || '获取流程实例失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
      console.error('获取流程实例失败:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, effectiveWorkflowId]);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  // 启动流程
  const handleStartWorkflow = async () => {
    try {
      const values = await startForm.validateFields();
      setLoading(true);

      const response = await fetch(`/api/workflows/${effectiveWorkflowId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: values.title || `${currentWorkflow?.name} - ${new Date().toLocaleDateString()}`,
          variables: {},
          initiator: 'user-1',
        }),
      });

      const result = await response.json();

      if (result.success) {
        message.success('流程启动成功');
        setStartModalVisible(false);
        startForm.resetFields();
        fetchInstances(); // 刷新实例列表
      } else {
        message.error(result.message || '启动失败');
      }
    } catch (error) {
      message.error('启动失败');
      console.error('启动流程失败:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleTerminate = async (instanceId: string) => {
    Modal.confirm({
      title: '确认终止流程',
      content: '终止后流程将无法继续执行，确定要终止吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await fetch(`/api/workflows/instances/${instanceId}/terminate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              terminatedBy: 'user-1',
            }),
          });

          const result = await response.json();

          if (result.success) {
            message.success('流程已终止');
            fetchInstances();
          } else {
            message.error(result.message || '终止失败');
          }
        } catch (error) {
          message.error('网络错误，请稍后重试');
          console.error('终止流程失败:', error);
        }
      },
    });
  };

  // 查看详情
  const handleViewDetail = (instanceId: string) => {
    if (onViewDetail) {
      onViewDetail(instanceId);
    } else {
      window.location.search = `?page=workflow-instance&instanceId=${instanceId}`;
    }
  };

  // 查看流程图
  const handleViewDiagram = (instanceId: string) => {
    if (onViewDiagram) {
      onViewDiagram(instanceId);
    } else {
      window.location.search = `?page=workflow-instance&instanceId=${instanceId}`;
    }
  };

  // 状态配置
  const statusConfig: Record<string, { color: string; text: string }> = {
    running: { color: 'processing', text: '运行中' },
    completed: { color: 'success', text: '已完成' },
    terminated: { color: 'default', text: '已终止' },
    failed: { color: 'error', text: '失败' },
  };

  // 渲染状态标签
  const renderStatusTag = (status: string) => {
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列定义
  const columns: ColumnsType<WorkflowInstance> = [
    {
      title: '流程名称',
      dataIndex: ['workflow', 'name'],
      key: 'workflowName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '实例ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      ellipsis: true,
      render: (text) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }} title={text}>
          {text.substring(0, 8)}...
        </span>
      ),
    },
    {
      title: '当前节点',
      dataIndex: 'currentNode',
      key: 'currentNode',
      width: 120,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: renderStatusTag,
    },
    {
      title: '发起人',
      dataIndex: 'initiator',
      key: 'initiator',
      width: 100,
      ellipsis: true,
    },
    {
      title: '启动时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (text) => new Date(text).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      width: 150,
      render: (text) => (text ? new Date(text).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }) : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<ProjectOutlined />}
            onClick={() => handleViewDiagram(record.id)}
          >
            流程图
          </Button>
          {record.status === 'running' && (
            <Button
              type="link"
              danger
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleTerminate(record.id)}
            >
              终止
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="workflow-instance-list">
      <Card
        title={
          <Space>
            <span>{propWorkflowId && currentWorkflow ? currentWorkflow.name : '流程实例'}</span>
            <Tag color="blue">{total} 个实例</Tag>
          </Space>
        }
        extra={
          <Space>
            {propWorkflowId && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setStartModalVisible(true)}
              >
                创建实例
              </Button>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchInstances}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        }
      >
        {/* 筛选器 - 只在没有传入 workflowId 时显示 */}
        {!propWorkflowId && (
          <div className="filter-bar" style={{ marginBottom: 16 }}>
            <Space wrap>
              <Select
                value={workflowFilter}
                onChange={setWorkflowFilter}
                style={{ width: 200 }}
                placeholder="选择流程"
                allowClear
              >
                {workflows.map((wf) => (
                  <Option key={wf.id} value={wf.id}>
                    {wf.name}
                  </Option>
                ))}
              </Select>

              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 150 }}
                placeholder="选择状态"
                allowClear
              >
                <Option value="running">运行中</Option>
                <Option value="completed">已完成</Option>
                <Option value="terminated">已终止</Option>
                <Option value="failed">失败</Option>
              </Select>
            </Space>
          </div>
        )}

        {/* 状态筛选 - 总是显示 */}
        {propWorkflowId && (
          <div className="filter-bar" style={{ marginBottom: 16 }}>
            <Space wrap>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 150 }}
                placeholder="选择状态"
                allowClear
              >
                <Option value="running">运行中</Option>
                <Option value="completed">已完成</Option>
                <Option value="terminated">已终止</Option>
                <Option value="failed">失败</Option>
              </Select>
            </Space>
          </div>
        )}

        {/* 实例列表 */}
        <Table
          columns={columns}
          dataSource={instances}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1040 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个实例`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
          }}
        />  
      </Card>

      {/* 启动流程模态框 */}
      <Modal
        title={`启动流程：${currentWorkflow?.name || ''}`}
        open={startModalVisible}
        onOk={handleStartWorkflow}
        onCancel={() => {
          setStartModalVisible(false);
          startForm.resetFields();
        }}
        confirmLoading={loading}
        okText="启动"
        cancelText="取消"
      >
        <Form form={startForm} layout="vertical">
          <Form.Item
            label="实例标题"
            name="title"
            rules={[{ required: true, message: '请输入实例标题' }]}
            initialValue={`${currentWorkflow?.name || ''} - ${new Date().toLocaleDateString()}`}
          >
            <Input placeholder="为本次流程实例起一个标题" />
          </Form.Item>

          <Form.Item
            label="流程描述"
            name="description"
          >
            <Input.TextArea rows={3} placeholder="可选：简要说明本次流程的背景或目的" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkflowInstanceList;

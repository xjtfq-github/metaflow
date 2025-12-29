import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import './index.css';

const { Search } = Input;
const { Option } = Select;

interface TaskItem {
  id: string;
  instanceId: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  assignee: string;
  status: string;
  dueDate?: string;
  createdAt: string;
  workflow: {
    name: string;
    description?: string;
  };
  instance: {
    id: string;
    status: string;
    initiator: string;
  };
}

interface TodoCenterProps {
  onViewTask?: (taskId: string) => void;
  onViewInstance?: (instanceId: string) => void;
}

const TodoCenter: React.FC<TodoCenterProps> = ({ onViewTask, onViewInstance }) => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchText, setSearchText] = useState('');

  // 获取待办任务
  const fetchTasks = React.useCallback(async () => {
    console.log('开始获取待办任务:', { currentPage, pageSize, statusFilter });
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

      console.log('请求URL:', `/api/tasks/my?${params.toString()}`);
      const response = await fetch(`/api/tasks/my?${params.toString()}`);
      console.log('响应状态:', response.status);
      const result = await response.json();
      console.log('响应数据:', result);

      if (result.success) {
        setTasks(result.data.items);
        setTotal(result.data.total);
      } else {
        message.error(result.message || '获取待办任务失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
      console.error('获取待办任务失败:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 处理任务点击
  const handleTaskClick = (task: TaskItem) => {
    if (onViewTask) {
      onViewTask(task.id);
    } else {
      // 使用 URL 参数切换页面
      window.location.search = `?page=task-detail&taskId=${task.id}`;
    }
  };

  // 查看流程详情
  const handleViewInstance = (instanceId: string) => {
    if (onViewInstance) {
      onViewInstance(instanceId);
    } else {
      // 使用 URL 参数切换页面
      window.location.search = `?page=workflow-instance&instanceId=${instanceId}`;
    }
  };

  // 状态标签渲染
  const renderStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
      pending: {
        color: 'warning',
        icon: <ClockCircleOutlined />,
        text: '待处理',
      },
      in_progress: {
        color: 'processing',
        icon: <ClockCircleOutlined />,
        text: '处理中',
      },
      completed: {
        color: 'success',
        icon: <CheckCircleOutlined />,
        text: '已完成',
      },
      rejected: {
        color: 'error',
        icon: <ExclamationCircleOutlined />,
        text: '已拒绝',
      },
      cancelled: {
        color: 'default',
        icon: <ExclamationCircleOutlined />,
        text: '已取消',
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 优先级标签
  const renderPriorityTag = (dueDate?: string) => {
    if (!dueDate) return null;

    const now = new Date();
    const due = new Date(dueDate);
    const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursLeft < 0) {
      return <Tag color="error">已超期</Tag>;
    } else if (hoursLeft < 24) {
      return <Tag color="warning">紧急</Tag>;
    } else if (hoursLeft < 72) {
      return <Tag color="processing">较急</Tag>;
    }
    return null;
  };

  // 表格列定义
  const columns: ColumnsType<TaskItem> = [
    {
      title: '任务名称',
      dataIndex: 'nodeName',
      key: 'nodeName',
      width: 200,
      render: (text, record) => (
        <a onClick={() => handleTaskClick(record)}>
          {text}
          {renderPriorityTag(record.dueDate)}
        </a>
      ),
    },
    {
      title: '所属流程',
      dataIndex: ['workflow', 'name'],
      key: 'workflowName',
      width: 200,
    },
    {
      title: '发起人',
      dataIndex: ['instance', 'initiator'],
      key: 'initiator',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: renderStatusTag,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '截止时间',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 180,
      render: (text) => text ? new Date(text).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => handleTaskClick(record)}
            disabled={record.status !== 'pending'}
          >
            处理
          </Button>
          <Button
            size="small"
            onClick={() => handleViewInstance(record.instanceId)}
          >
            查看流程
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="todo-center">
      <Card
        title={
          <Space>
            <span>待办中心</span>
            <Tag color="blue">{total} 条任务</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchTasks}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        }
      >
        {/* 过滤器 */}
        <div className="filter-bar" style={{ marginBottom: 16 }}>
          <Space>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              placeholder="选择状态"
            >
              <Option value="">全部状态</Option>
              <Option value="pending">待处理</Option>
              <Option value="in_progress">处理中</Option>
              <Option value="completed">已完成</Option>
              <Option value="rejected">已拒绝</Option>
            </Select>

            <Search
              placeholder="搜索任务名称或流程名称"
              allowClear
              style={{ width: 300 }}
              onSearch={(value) => {
                setSearchText(value);
                fetchTasks();
              }}
            />
          </Space>
        </div>

        {/* 任务列表 */}
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default TodoCenter;

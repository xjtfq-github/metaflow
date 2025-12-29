import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Timeline,
  Tag,
  Button,
  Space,
  message,
  Spin,
  Tabs,
  Table,
  Empty,
} from 'antd';
import type { TabsProps } from 'antd';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './index.css';

interface InstanceDetail {
  instance: {
    id: string;
    workflowId: string;
    status: string;
    currentNodeIds: string[];
    variables: Record<string, any>;
    context: any;
    initiator: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    errorMessage?: string;
  };
  workflow: {
    id: string;
    name: string;
    description?: string;
    nodes: any[];
    edges: any[];
  };
  tasks: any[];
  logs: any[];
}

interface WorkflowInstanceTrackingProps {
  instanceId?: string;
  onBack?: () => void;
}

const WorkflowInstanceTracking: React.FC<WorkflowInstanceTrackingProps> = ({ 
  instanceId: propInstanceId, 
  onBack 
}) => {
  // 从 props 或 URL 参数获取 instanceId
  const params = new URLSearchParams(window.location.search);
  const urlInstanceId = params.get('instanceId');
  const instanceId = propInstanceId || urlInstanceId;
  const [loading, setLoading] = useState(false);
  const [instanceDetail, setInstanceDetail] = useState<InstanceDetail | null>(null);

  // 获取实例详情
  const fetchInstanceDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workflows/instances/${instanceId}`);
      const result = await response.json();

      if (result.success) {
        setInstanceDetail(result.data);
      } else {
        message.error(result.message || '获取流程详情失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
      console.error('获取流程详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (instanceId) {
      fetchInstanceDetail();
    }
  }, [instanceId]);

  // 转换节点数据为 ReactFlow 格式
  const convertToReactFlowNodes = (): Node[] => {
    if (!instanceDetail) return [];

    const { workflow, instance } = instanceDetail;
    const currentNodeIds = instance.currentNodeIds || [];

    return workflow.nodes.map((node) => {
      const isActive = currentNodeIds.includes(node.id);
      const isCompleted = instance.status === 'completed';

      // 从 node.props.position 获取位置信息
      const position = node.props?.position || node.position || { x: 0, y: 0 };

      // 映射节点类型到 ReactFlow 支持的类型
      const getNodeType = (type: string): string => {
        const typeMap: Record<string, string> = {
          'StartEvent': 'input',
          'EndEvent': 'output',
          'UserTask': 'default',
          'ServiceTask': 'default',
          'Gateway': 'default',
        };
        return typeMap[type] || 'default';
      };

      return {
        id: node.id,
        type: getNodeType(node.type),
        position: position,
        data: {
          ...node.data,
          label: node.name || node.type,
        },
        style: {
          background: isActive ? '#1890ff' : isCompleted ? '#52c41a' : '#fff',
          color: isActive || isCompleted ? '#fff' : '#000',
          border: `2px solid ${isActive ? '#1890ff' : isCompleted ? '#52c41a' : '#d9d9d9'}`,
          padding: 10,
          borderRadius: node.type === 'Gateway' ? '50%' : 8,
          width: node.type === 'Gateway' ? 60 : 'auto',
          height: node.type === 'Gateway' ? 60 : 'auto',
        },
      };
    });
  };

  // 转换连线数据为 ReactFlow 格式
  const convertToReactFlowEdges = (): Edge[] => {
    if (!instanceDetail) return [];

    const { workflow } = instanceDetail;

    return workflow.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label || edge.condition,
      animated: false,
    }));
  };

  // 渲染状态标签
  const renderStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
      running: {
        color: 'processing',
        icon: <ClockCircleOutlined />,
        text: '进行中',
      },
      completed: {
        color: 'success',
        icon: <CheckCircleOutlined />,
        text: '已完成',
      },
      error: {
        color: 'error',
        icon: <ExclamationCircleOutlined />,
        text: '错误',
      },
      cancelled: {
        color: 'default',
        icon: <CloseCircleOutlined />,
        text: '已取消',
      },
    };

    const config = statusConfig[status] || statusConfig.running;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 任务列表列定义
  const taskColumns = [
    {
      title: '任务名称',
      dataIndex: 'nodeName',
      key: 'nodeName',
    },
    {
      title: '审批人',
      dataIndex: 'assignee',
      key: 'assignee',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: Record<string, { color: string; text: string }> = {
          pending: { color: 'warning', text: '待处理' },
          completed: { color: 'success', text: '已完成' },
          rejected: { color: 'error', text: '已拒绝' },
        };
        const { color, text } = config[status] || config.pending;
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (text: string) => text ? new Date(text).toLocaleString('zh-CN') : '-',
    },
    {
      title: '审批意见',
      dataIndex: 'comment',
      key: 'comment',
      render: (text: string) => text || '-',
    },
  ];

  if (loading || !instanceDetail) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const { instance, workflow, tasks, logs } = instanceDetail;

  // 定义 Tabs 项
  const tabItems: TabsProps['items'] = [
    {
      key: 'flow',
      label: '流程图',
      children: (
        <>
          <div style={{ height: 500, border: '1px solid #d9d9d9', borderRadius: 4 }}>
            <ReactFlow
              nodes={convertToReactFlowNodes()}
              edges={convertToReactFlowEdges()}
              fitView
              attributionPosition="bottom-left"
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
          <div style={{ marginTop: 16 }}>
            <Space>
              <Tag color="blue">蓝色：当前节点</Tag>
              <Tag color="green">绿色：已完成</Tag>
              <Tag>灰色：未到达</Tag>
            </Space>
          </div>
        </>
      ),
    },
    {
      key: 'tasks',
      label: `任务列表 (${tasks.length})`,
      children: (
        <Table
          columns={taskColumns}
          dataSource={tasks}
          rowKey="id"
          pagination={false}
        />
      ),
    },
    {
      key: 'variables',
      label: '流程变量',
      children: (
        <Descriptions bordered column={1}>
          {Object.entries(instance.variables).map(([key, value]) => (
            <Descriptions.Item key={key} label={key}>
              {JSON.stringify(value)}
            </Descriptions.Item>
          ))}
        </Descriptions>
      ),
    },
    {
      key: 'logs',
      label: `执行日志 (${logs.length})`,
      children: (
        <Timeline>
          {logs.map((log) => (
            <Timeline.Item
              key={log.id}
              color={log.level === 'error' ? 'red' : log.level === 'warn' ? 'orange' : 'blue'}
            >
              <p>
                <strong>{new Date(log.createdAt).toLocaleString('zh-CN')}</strong>
                {' '}
                <Tag color={log.level === 'error' ? 'error' : log.level === 'warn' ? 'warning' : 'default'}>
                  {log.level.toUpperCase()}
                </Tag>
              </p>
              <p>{log.message}</p>
              {log.nodeId && <p style={{ color: '#999' }}>节点: {log.nodeId}</p>}
            </Timeline.Item>
          ))}
          {logs.length === 0 && <Empty description="暂无日志" />}
        </Timeline>
      ),
    },
  ];

  return (
    <div className="workflow-instance-tracking">
      <Card
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                if (onBack) {
                  onBack();
                } else {
                  window.history.back();
                }
              }}
            >
              返回
            </Button>
            <span>{workflow.name} - 执行详情</span>
            {renderStatusTag(instance.status)}
          </Space>
        }
      >
        {/* 基本信息 */}
        <Descriptions title="流程信息" bordered column={2}>
          <Descriptions.Item label="流程名称">{workflow.name}</Descriptions.Item>
          <Descriptions.Item label="流程ID">{workflow.id}</Descriptions.Item>
          <Descriptions.Item label="实例ID">{instance.id}</Descriptions.Item>
          <Descriptions.Item label="发起人">{instance.initiator}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(instance.createdAt).toLocaleString('zh-CN')}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(instance.updatedAt).toLocaleString('zh-CN')}
          </Descriptions.Item>
          {instance.completedAt && (
            <Descriptions.Item label="完成时间">
              {new Date(instance.completedAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          )}
          {instance.errorMessage && (
            <Descriptions.Item label="错误信息" span={2}>
              <Tag color="error">{instance.errorMessage}</Tag>
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* 选项卡 */}
        <Tabs defaultActiveKey="flow" style={{ marginTop: 24 }} items={tabItems} />
      </Card>
    </div>
  );
};

export default WorkflowInstanceTracking;

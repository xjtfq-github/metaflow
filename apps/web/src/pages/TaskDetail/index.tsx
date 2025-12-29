import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Form,
  Input,
  Button,
  Space,
  message,
  Spin,
  Tag,
  Modal,
  Divider,
  Radio,
  Select,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import './index.css';

const { TextArea } = Input;
const { Option } = Select;

interface TaskDetail {
  task: {
    id: string;
    instanceId: string;
    nodeId: string;
    nodeName: string;
    nodeType: string;
    assignee: string;
    status: string;
    formData?: Record<string, any>;
    dueDate?: string;
    createdAt: string;
    completedAt?: string;
    completedBy?: string;
    comment?: string;
  };
  workflow: {
    id: string;
    name: string;
    description?: string;
  };
  instance: {
    id: string;
    status: string;
    variables: Record<string, any>;
    initiator: string;
    createdAt: string;
  };
  nodeConfig: any;
}

interface TaskDetailProps {
  taskId?: string;
  onBack?: () => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ taskId: propTaskId, onBack }) => {
  // 从 props 或 URL 参数获取 taskId
  const params = new URLSearchParams(window.location.search);
  const urlTaskId = params.get('taskId');
  const taskId = propTaskId || urlTaskId;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [delegateVisible, setDelegateVisible] = useState(false);
  const [delegateForm] = Form.useForm();

  // 获取任务详情
  const fetchTaskDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      const result = await response.json();

      if (result.success) {
        setTaskDetail(result.data);
        // 初始化表单数据
        if (result.data.instance.variables) {
          form.setFieldsValue(result.data.instance.variables);
        }
      } else {
        message.error(result.message || '获取任务详情失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
      console.error('获取任务详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchTaskDetail();
    }
  }, [taskId]);

  // 提交审批
  const handleSubmit = async (action: 'approve' | 'reject') => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const endpoint = action === 'approve' 
        ? `/api/tasks/${taskId}/complete`
        : `/api/tasks/${taskId}/reject`;

      const body = {
        formData: {
          ...values,
          approvalResult: action === 'approve' ? 'approved' : 'rejected',
        },
        completedBy: 'user-1', // 实际应用中从用户上下文获取
        comment: values.comment,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        message.success(action === 'approve' ? '审批通过' : '审批已拒绝');
        setTimeout(() => {
          if (onBack) {
            onBack();
          } else {
            window.location.search = '?page=todo';
          }
        }, 1000);
      } else {
        message.error(result.message || '操作失败');
      }
    } catch (error: any) {
      if (error.errorFields) {
        message.error('请填写必填字段');
      } else {
        message.error('网络错误，请稍后重试');
        console.error('提交审批失败:', error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 委托任务
  const handleDelegate = async () => {
    try {
      const values = await delegateForm.validateFields();
      setSubmitting(true);

      const response = await fetch(`/api/tasks/${taskId}/delegate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          delegateTo: values.delegateTo,
          delegatedBy: 'user-1',
          comment: values.comment,
        }),
      });

      const result = await response.json();

      if (result.success) {
        message.success('任务已委托');
        setDelegateVisible(false);
        delegateForm.resetFields();
        fetchTaskDetail();
      } else {
        message.error(result.message || '委托失败');
      }
    } catch (error: any) {
      if (error.errorFields) {
        message.error('请填写必填字段');
      } else {
        message.error('网络错误，请稍后重试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 渲染表单字段
  const renderFormFields = () => {
    if (!taskDetail) return null;

    const { nodeConfig, instance } = taskDetail;
    const formFields = nodeConfig?.formFields || [];

    if (formFields.length === 0) {
      // 默认显示流程变量
      return Object.keys(instance.variables).map((key) => (
        <Descriptions.Item key={key} label={key}>
          {String(instance.variables[key])}
        </Descriptions.Item>
      ));
    }

    return formFields.map((field: any) => {
      const rules = [];
      if (field.required) {
        rules.push({ required: true, message: `请输入${field.label}` });
      }

      switch (field.type) {
        case 'textarea':
          return (
            <Form.Item
              key={field.name}
              label={field.label}
              name={field.name}
              rules={rules}
            >
              <TextArea rows={4} placeholder={field.placeholder} />
            </Form.Item>
          );
        case 'select':
          return (
            <Form.Item
              key={field.name}
              label={field.label}
              name={field.name}
              rules={rules}
            >
              <Select placeholder={field.placeholder}>
                {field.options?.map((opt: any) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          );
        case 'radio':
          return (
            <Form.Item
              key={field.name}
              label={field.label}
              name={field.name}
              rules={rules}
            >
              <Radio.Group>
                {field.options?.map((opt: any) => (
                  <Radio key={opt.value} value={opt.value}>
                    {opt.label}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          );
        default:
          return (
            <Form.Item
              key={field.name}
              label={field.label}
              name={field.name}
              rules={rules}
            >
              <Input placeholder={field.placeholder} />
            </Form.Item>
          );
      }
    });
  };

  if (loading || !taskDetail) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const { task, workflow, instance } = taskDetail;
  const isPending = task.status === 'pending';

  return (
    <div className="task-detail">
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
                  window.location.search = '?page=todo';
                }
              }}
            >
              返回
            </Button>
            <span>{task.nodeName}</span>
            <Tag color={isPending ? 'warning' : 'success'}>
              {isPending ? '待处理' : '已处理'}
            </Tag>
          </Space>
        }
      >
        {/* 任务基本信息 */}
        <Descriptions title="任务信息" bordered column={2}>
          <Descriptions.Item label="任务名称">{task.nodeName}</Descriptions.Item>
          <Descriptions.Item label="任务类型">{task.nodeType}</Descriptions.Item>
          <Descriptions.Item label="所属流程">{workflow.name}</Descriptions.Item>
          <Descriptions.Item label="流程状态">
            <Tag color={instance.status === 'running' ? 'processing' : 'default'}>
              {instance.status === 'running' ? '进行中' : instance.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="发起人">{instance.initiator}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(task.createdAt).toLocaleString('zh-CN')}
          </Descriptions.Item>
          {task.dueDate && (
            <Descriptions.Item label="截止时间">
              {new Date(task.dueDate).toLocaleString('zh-CN')}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="当前处理人">{task.assignee}</Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* 流程变量 */}
        <Descriptions title="流程信息" bordered column={2}>
          {Object.entries(instance.variables).map(([key, value]) => (
            <Descriptions.Item key={key} label={key}>
              {String(value)}
            </Descriptions.Item>
          ))}
        </Descriptions>

        <Divider />

        {/* 审批表单 */}
        {isPending && (
          <>
            <h3 style={{ marginBottom: 16 }}>审批意见</h3>
            <Form form={form} layout="vertical">
              {renderFormFields()}
              
              <Form.Item
                label="审批意见"
                name="comment"
                rules={[{ required: true, message: '请填写审批意见' }]}
              >
                <TextArea rows={4} placeholder="请填写审批意见" />
              </Form.Item>
            </Form>

            <Space style={{ marginTop: 24 }}>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleSubmit('approve')}
                loading={submitting}
                size="large"
              >
                通过
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleSubmit('reject')}
                loading={submitting}
                size="large"
              >
                拒绝
              </Button>
              <Button
                icon={<SwapOutlined />}
                onClick={() => setDelegateVisible(true)}
                size="large"
              >
                委托
              </Button>
            </Space>
          </>
        )}

        {/* 已处理显示结果 */}
        {!isPending && task.formData && (
          <>
            <Divider />
            <Descriptions title="审批结果" bordered column={2}>
              <Descriptions.Item label="处理人">{task.completedBy}</Descriptions.Item>
              <Descriptions.Item label="处理时间">
                {task.completedAt ? new Date(task.completedAt).toLocaleString('zh-CN') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="审批意见" span={2}>
                {task.comment || '-'}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>

      {/* 委托对话框 */}
      <Modal
        title="委托任务"
        open={delegateVisible}
        onOk={handleDelegate}
        onCancel={() => {
          setDelegateVisible(false);
          delegateForm.resetFields();
        }}
        confirmLoading={submitting}
      >
        <Form form={delegateForm} layout="vertical">
          <Form.Item
            label="委托给"
            name="delegateTo"
            rules={[{ required: true, message: '请输入委托人' }]}
          >
            <Input placeholder="请输入委托人ID或姓名" />
          </Form.Item>
          <Form.Item label="备注" name="comment">
            <TextArea rows={3} placeholder="可选填写委托原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskDetail;

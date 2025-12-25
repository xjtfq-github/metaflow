/**
 * 待办中心
 */

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message } from 'antd';
import type { Task } from '@metaflow/shared-types';

export const TaskInbox: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [form] = Form.useForm();

  /**
   * 加载待办任务
   */
  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tasks/my');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      message.error('加载待办失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  /**
   * 处理任务
   */
  const handleComplete = async (task: Task) => {
    setSelectedTask(task);
  };

  /**
   * 提交审批
   */
  const handleSubmit = async (values: any) => {
    if (!selectedTask) return;

    try {
      await fetch(`/api/tasks/${selectedTask.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables: values }),
      });

      message.success('任务已完成');
      setSelectedTask(null);
      form.resetFields();
      loadTasks();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'nodeName',
      key: 'nodeName',
    },
    {
      title: '流程实例',
      dataIndex: 'instanceId',
      key: 'instanceId',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, task: Task) => (
        <Button type="primary" onClick={() => handleComplete(task)}>
          处理
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>我的待办</h2>
      <Table
        dataSource={tasks}
        columns={columns}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="处理任务"
        open={!!selectedTask}
        onCancel={() => {
          setSelectedTask(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="approved" label="审批意见">
            <Input.TextArea rows={4} placeholder="请输入审批意见" />
          </Form.Item>
          <Form.Item name="result" label="审批结果">
            <Button.Group>
              <Button onClick={() => form.setFieldsValue({ result: 'approve' })}>
                同意
              </Button>
              <Button onClick={() => form.setFieldsValue({ result: 'reject' })}>
                拒绝
              </Button>
            </Button.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

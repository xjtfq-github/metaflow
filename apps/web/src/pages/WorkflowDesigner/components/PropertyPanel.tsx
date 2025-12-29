import React, { useEffect } from 'react';
import { Form, Input, Select, Card } from 'antd';
import type { Node } from 'reactflow';

const { TextArea } = Input;
const { Option } = Select;

interface PropertyPanelProps {
  selectedNode: Node | null;
  onUpdate: (nodeId: string, data: any) => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedNode,
  onUpdate,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (selectedNode) {
      form.setFieldsValue({
        label: selectedNode.data.label,
        ...selectedNode.data.config,
      });
    }
  }, [selectedNode, form]);

  const handleValuesChange = (changedValues: any, allValues: any) => {
    if (!selectedNode) return;

    const { label, ...config } = allValues;
    
    onUpdate(selectedNode.id, {
      label,
      config,
    });
  };

  if (!selectedNode) {
    return (
      <div
        style={{
          width: 300,
          padding: 16,
          background: '#fff',
          borderLeft: '1px solid #d9d9d9',
        }}
      >
        <h3>属性配置</h3>
        <p style={{ color: '#999' }}>请选择一个节点</p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 300,
        padding: 16,
        background: '#fff',
        borderLeft: '1px solid #d9d9d9',
        overflowY: 'auto',
      }}
    >
      <h3 style={{ marginBottom: 16 }}>属性配置</h3>
      
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#999' }}>节点类型</div>
        <div style={{ fontWeight: 'bold' }}>{selectedNode.type}</div>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        autoComplete="off"
      >
        <Form.Item
          label="节点名称"
          name="label"
          rules={[{ required: true, message: '请输入节点名称' }]}
        >
          <Input placeholder="请输入节点名称" />
        </Form.Item>

        {/* UserTask 配置 */}
        {selectedNode.type === 'userTask' && (
          <>
            <Form.Item
              label="审批人"
              name="assignee"
              rules={[{ required: true, message: '请输入审批人' }]}
            >
              <Input placeholder="例如: ${initiator} 或 role:admin" />
            </Form.Item>

            <Form.Item label="表单Key" name="formKey">
              <Input placeholder="表单标识" />
            </Form.Item>

            <Form.Item label="超时时间" name="dueDate">
              <Input placeholder="例如: P1D (1天)" />
            </Form.Item>

            <Form.Item label="描述" name="description">
              <TextArea rows={3} placeholder="任务描述" />
            </Form.Item>
          </>
        )}

        {/* ServiceTask 配置 */}
        {selectedNode.type === 'serviceTask' && (
          <>
            <Form.Item
              label="动作类型"
              name="action"
              rules={[{ required: true, message: '请选择动作类型' }]}
            >
              <Select placeholder="选择动作">
                <Option value="sendEmail">发送邮件</Option>
                <Option value="callApi">调用API</Option>
                <Option value="executeScript">执行脚本</Option>
              </Select>
            </Form.Item>

            <Form.Item label="动作参数" name="params">
              <TextArea
                rows={4}
                placeholder='JSON格式，例如: {"to": "user@example.com"}'
              />
            </Form.Item>
          </>
        )}

        {/* Gateway 配置 */}
        {selectedNode.type === 'gateway' && (
          <>
            <Form.Item label="默认分支" name="defaultEdge">
              <Input placeholder="默认分支的边ID" />
            </Form.Item>

            <Form.Item label="描述" name="description">
              <TextArea rows={3} placeholder="网关说明" />
            </Form.Item>
          </>
        )}
      </Form>
    </div>
  );
};

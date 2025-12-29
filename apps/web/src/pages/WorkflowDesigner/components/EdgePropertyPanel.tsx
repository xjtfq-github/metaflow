import React, { useEffect } from 'react';
import { Form, Input, Card, Typography } from 'antd';
import type { Edge } from 'reactflow';

const { Title } = Typography;

interface EdgePropertyPanelProps {
  selectedEdge: Edge | null;
  onUpdate: (edgeId: string, data: any) => void;
}

export const EdgePropertyPanel: React.FC<EdgePropertyPanelProps> = ({
  selectedEdge,
  onUpdate,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (selectedEdge) {
      form.setFieldsValue({
        label: selectedEdge.data?.label || '',
        condition: selectedEdge.data?.condition || '',
      });
    }
  }, [selectedEdge, form]);

  if (!selectedEdge) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>
        请选择一个连线
      </div>
    );
  }

  const handleValuesChange = (_changedValues: any, allValues: any) => {
    onUpdate(selectedEdge.id, allValues);
  };

  return (
    <div style={{ padding: 16 }}>
      <Title level={5} style={{ marginBottom: 16 }}>
        连线属性配置
      </Title>

      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
      >
        <Form.Item label="连线名称" name="label">
          <Input placeholder="例如：同意、拒绝" />
        </Form.Item>

        <Form.Item 
          label="条件表达式" 
          name="condition"
          help="使用模板语法，例如：{{ level === '一级动火' }}"
        >
          <Input.TextArea 
            rows={3}
            placeholder="{{ variable === 'value' }}"
          />
        </Form.Item>

        <Card size="small" style={{ marginTop: 16, background: '#f5f5f5' }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            <strong>提示：</strong>
            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
              <li>网关节点的出边需要配置条件或设置默认分支</li>
              <li>条件表达式支持 ==, !=, &gt;, &lt;, &gt;=, &lt;= 等比较运算符</li>
              <li>支持 &amp;&amp;（且）、||（或）逻辑运算符</li>
              <li>变量名需要用双花括号包裹：{'{{ variableName }}'}</li>
            </ul>
          </Typography.Text>
        </Card>
      </Form>
    </div>
  );
};

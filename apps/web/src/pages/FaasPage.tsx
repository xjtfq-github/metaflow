import React, { useState } from 'react';
import { Layout, Tabs, Card, Button, Table, Modal, Form, Input, Select, Space, Tag, message } from 'antd';
import {
  CodeOutlined,
  PlayCircleOutlined,
  ApiOutlined,
  LinkOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

const { Content } = Layout;
const { TextArea } = Input;
const { Option } = Select;

export const FaasPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('scripts');
  const [scripts, setScripts] = useState<any[]>([
    {
      id: '1',
      name: '数据验证脚本',
      description: '验证用户输入数据',
      language: 'javascript',
      enabled: true,
      trigger: 'manual',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [webhooks, setWebhooks] = useState<any[]>([
    {
      id: '1',
      name: '订单状态通知',
      url: '/webhooks/order-status',
      method: 'POST',
      enabled: true,
      lastTriggeredAt: null,
    },
  ]);
  const [connectors, setConnectors] = useState<any[]>([
    {
      id: '1',
      name: 'ERP系统连接',
      type: 'http',
      enabled: true,
      createdAt: new Date().toISOString(),
    },
  ]);

  const [scriptModalVisible, setScriptModalVisible] = useState(false);
  const [executeModalVisible, setExecuteModalVisible] = useState(false);
  const [selectedScript, setSelectedScript] = useState<any>(null);
  const [form] = Form.useForm();
  const [executeForm] = Form.useForm();

  // 脚本列表列
  const scriptColumns = [
    {
      title: '脚本名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <CodeOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '语言',
      dataIndex: 'language',
      key: 'language',
      render: (lang: string) => <Tag color="blue">{lang.toUpperCase()}</Tag>,
    },
    {
      title: '触发方式',
      dataIndex: 'trigger',
      key: 'trigger',
      render: (trigger: string) => (
        <Tag color={trigger === 'manual' ? 'default' : 'green'}>
          {trigger === 'manual' ? '手动' : trigger === 'webhook' ? 'Webhook' : trigger === 'schedule' ? '定时' : '事件'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<PlayCircleOutlined />}
            onClick={() => handleExecuteScript(record)}
          >
            执行
          </Button>
          <Button type="link">编辑</Button>
          <Button type="link" danger>删除</Button>
        </Space>
      ),
    },
  ];

  // Webhook列表列
  const webhookColumns = [
    {
      title: 'Webhook名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <ApiOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      render: (url: string) => <code>{url}</code>,
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => <Tag color="blue">{method}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '最后触发',
      dataIndex: 'lastTriggeredAt',
      key: 'lastTriggeredAt',
      render: (date: string | null) => date ? new Date(date).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link">测试</Button>
          <Button type="link">编辑</Button>
          <Button type="link" danger>删除</Button>
        </Space>
      ),
    },
  ];

  // 连接器列表列
  const connectorColumns = [
    {
      title: '连接器名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <LinkOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors: any = {
          http: 'blue',
          database: 'green',
          mq: 'orange',
          file: 'purple',
        };
        return <Tag color={colors[type] || 'default'}>{type.toUpperCase()}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link">测试连接</Button>
          <Button type="link">编辑</Button>
          <Button type="link" danger>删除</Button>
        </Space>
      ),
    },
  ];

  const handleCreateScript = () => {
    form.resetFields();
    setScriptModalVisible(true);
  };

  const handleSaveScript = async () => {
    try {
      const values = await form.validateFields();
      console.log('创建脚本:', values);
      // TODO: 调用API
      message.success('脚本创建成功');
      setScriptModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleExecuteScript = (script: any) => {
    setSelectedScript(script);
    executeForm.resetFields();
    setExecuteModalVisible(true);
  };

  const handleRunScript = async () => {
    try {
      const values = await executeForm.validateFields();
      console.log('执行脚本:', selectedScript.id, values);
      // TODO: 调用API
      message.success('脚本执行成功');
      setExecuteModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <Layout style={{ height: '100%' }}>
      <Content style={{ background: '#f5f5f5', padding: 16, overflow: 'auto' }}>
        <div style={{ background: '#fff', padding: 24, borderRadius: 4, minHeight: '100%' }}>
          <h2>FaaS / Script 扩展</h2>
          
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            {/* 自定义脚本 */}
            <Tabs.TabPane tab={<span><CodeOutlined /> 自定义脚本</span>} key="scripts">
              <div style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateScript}
                >
                  创建脚本
                </Button>
              </div>
              
              <Table
                dataSource={scripts}
                columns={scriptColumns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />

              <Card title="脚本示例" style={{ marginTop: 24 }} size="small">
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`// 数据验证脚本示例
function validate(data) {
  if (!data.name || data.name.length < 2) {
    throw new Error('名称长度不能少于2个字符');
  }
  
  if (!data.email || !data.email.includes('@')) {
    throw new Error('邮箱格式不正确');
  }
  
  console.log('验证通过:', data.name);
  return { valid: true };
}

// 执行验证
validate(input);`}
                </pre>
              </Card>
            </Tabs.TabPane>

            {/* Webhook */}
            <Tabs.TabPane tab={<span><ApiOutlined /> Webhook</span>} key="webhooks">
              <div style={{ marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />}>
                  创建Webhook
                </Button>
              </div>
              
              <Table
                dataSource={webhooks}
                columns={webhookColumns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </Tabs.TabPane>

            {/* 连接器 */}
            <Tabs.TabPane tab={<span><LinkOutlined /> 连接器</span>} key="connectors">
              <div style={{ marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />}>
                  创建连接器
                </Button>
              </div>
              
              <Table
                dataSource={connectors}
                columns={connectorColumns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />

              <Card title="支持的连接器类型" style={{ marginTop: 24 }} size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Tag color="blue">HTTP</Tag> RESTful API连接器
                  </div>
                  <div>
                    <Tag color="green">DATABASE</Tag> 数据库连接器（MySQL, PostgreSQL等）
                  </div>
                  <div>
                    <Tag color="orange">MQ</Tag> 消息队列连接器（RabbitMQ, Kafka等）
                  </div>
                  <div>
                    <Tag color="purple">FILE</Tag> 文件存储连接器（OSS, S3等）
                  </div>
                </Space>
              </Card>
            </Tabs.TabPane>
          </Tabs>
        </div>
      </Content>

      {/* 创建脚本弹窗 */}
      <Modal
        title="创建自定义脚本"
        open={scriptModalVisible}
        onOk={handleSaveScript}
        onCancel={() => setScriptModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="脚本名称"
            rules={[{ required: true, message: '请输入脚本名称' }]}
          >
            <Input placeholder="例如：数据验证脚本" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="脚本功能描述" />
          </Form.Item>

          <Form.Item
            name="language"
            label="语言"
            initialValue="javascript"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="javascript">JavaScript</Option>
              <Option value="typescript">TypeScript</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="trigger"
            label="触发方式"
            initialValue="manual"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="manual">手动执行</Option>
              <Option value="webhook">Webhook触发</Option>
              <Option value="schedule">定时执行</Option>
              <Option value="event">事件触发</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="code"
            label="脚本代码"
            rules={[{ required: true, message: '请输入脚本代码' }]}
          >
            <TextArea
              rows={12}
              placeholder="// 输入JavaScript代码
function main(input) {
  console.log('输入数据:', input);
  return { success: true };
}

main(input);"
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Space>
            <Form.Item name="timeout" label="超时时间(ms)" initialValue={5000}>
              <Input type="number" style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="memoryLimit" label="内存限制(MB)" initialValue={128}>
              <Input type="number" style={{ width: 150 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      {/* 执行脚本弹窗 */}
      <Modal
        title={`执行脚本: ${selectedScript?.name}`}
        open={executeModalVisible}
        onOk={handleRunScript}
        onCancel={() => setExecuteModalVisible(false)}
        width={600}
      >
        <Form form={executeForm} layout="vertical">
          <Form.Item name="input" label="输入数据 (JSON)">
            <TextArea
              rows={6}
              placeholder='{"name": "张三", "email": "zhangsan@example.com"}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item name="triggeredBy" label="触发者">
            <Input placeholder="user-id或系统标识" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

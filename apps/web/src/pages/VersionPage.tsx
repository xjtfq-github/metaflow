import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Table, Button, Modal, Form, Input, Select, Tag, Space, Timeline, Progress, message } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;

interface AppVersion {
  id: string;
  version: string;
  status: string;
  changelog?: string;
  publishedBy?: string;
  publishedAt: Date;
  archivedAt?: Date;
}

interface Deployment {
  id: string;
  environment: string;
  status: string;
  deployedBy: string;
  deployedAt: Date;
  canaryEnabled: boolean;
  canaryPercent: number;
  version: {
    version: string;
    changelog?: string;
  };
}

export const VersionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('draft');
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [draft, setDraft] = useState<any>(null);
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [deployModalVisible, setDeployModalVisible] = useState(false);
  const [form] = Form.useForm();

  const mockAppId = 'app-1';

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // 模拟草稿数据
    setDraft({
      id: 'draft-1',
      appId: mockAppId,
      snapshot: {
        models: [{ id: 'm1', entityName: 'Order', fields: [] }],
        pages: [{ id: 'p1', name: '订单列表' }],
        workflows: [],
        metadata: {},
      },
      updatedAt: new Date(),
      updatedBy: 'user-1',
    });

    // 模拟版本列表
    setVersions([
      {
        id: 'v1',
        version: '1.0.0',
        status: 'Published',
        changelog: '初始版本发布',
        publishedBy: 'admin',
        publishedAt: new Date('2024-01-15'),
      },
      {
        id: 'v2',
        version: '1.1.0',
        status: 'Published',
        changelog: '新增订单管理功能',
        publishedBy: 'admin',
        publishedAt: new Date('2024-02-01'),
      },
      {
        id: 'v3',
        version: '1.2.0',
        status: 'Archived',
        changelog: '优化性能',
        publishedBy: 'admin',
        publishedAt: new Date('2024-03-01'),
        archivedAt: new Date('2024-03-15'),
      },
    ]);

    // 模拟部署记录
    setDeployments([
      {
        id: 'd1',
        environment: 'production',
        status: 'active',
        deployedBy: 'admin',
        deployedAt: new Date('2024-02-01'),
        canaryEnabled: false,
        canaryPercent: 0,
        version: { version: '1.1.0', changelog: '新增订单管理功能' },
      },
      {
        id: 'd2',
        environment: 'staging',
        status: 'active',
        deployedBy: 'admin',
        deployedAt: new Date('2024-03-01'),
        canaryEnabled: true,
        canaryPercent: 20,
        version: { version: '1.2.0', changelog: '优化性能' },
      },
    ]);
  };

  // 草稿管理Tab
  const renderDraftTab = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" onClick={() => setPublishModalVisible(true)}>
            发布新版本
          </Button>
          <Button>保存草稿</Button>
        </Space>
      </div>
      
      <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
        <h3>当前草稿内容</h3>
        {draft && (
          <div>
            <p><strong>模型数量:</strong> {draft.snapshot.models.length}</p>
            <p><strong>页面数量:</strong> {draft.snapshot.pages.length}</p>
            <p><strong>工作流数量:</strong> {draft.snapshot.workflows.length}</p>
            <p><strong>最后更新:</strong> {new Date(draft.updatedAt).toLocaleString()}</p>
            <p><strong>更新人:</strong> {draft.updatedBy}</p>
          </div>
        )}
      </div>
    </div>
  );

  // 版本列表Tab
  const renderVersionsTab = () => {
    const columns = [
      {
        title: '版本号',
        dataIndex: 'version',
        key: 'version',
        render: (text: string) => <Tag color="blue">{text}</Tag>,
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => (
          <Tag color={status === 'Published' ? 'green' : 'default'}>
            {status === 'Published' ? '已发布' : '已归档'}
          </Tag>
        ),
      },
      {
        title: '变更日志',
        dataIndex: 'changelog',
        key: 'changelog',
      },
      {
        title: '发布人',
        dataIndex: 'publishedBy',
        key: 'publishedBy',
      },
      {
        title: '发布时间',
        dataIndex: 'publishedAt',
        key: 'publishedAt',
        render: (date: Date) => new Date(date).toLocaleString(),
      },
      {
        title: '操作',
        key: 'action',
        render: (_: any, record: AppVersion) => (
          <Space>
            <Button size="small" onClick={() => handleRollback(record.id)}>
              回滚
            </Button>
            {record.status === 'Published' && (
              <Button size="small" onClick={() => handleArchive(record.id)}>
                归档
              </Button>
            )}
            <Button size="small" onClick={() => openDeployModal(record.id)}>
              部署
            </Button>
          </Space>
        ),
      },
    ];

    return <Table dataSource={versions} columns={columns} rowKey="id" />;
  };

  // 部署管理Tab
  const renderDeploymentsTab = () => {
    const columns = [
      {
        title: '环境',
        dataIndex: 'environment',
        key: 'environment',
        render: (env: string) => {
          const colors: Record<string, string> = {
            production: 'red',
            staging: 'orange',
            dev: 'blue',
          };
          return <Tag color={colors[env]}>{env.toUpperCase()}</Tag>;
        },
      },
      {
        title: '版本',
        dataIndex: ['version', 'version'],
        key: 'version',
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => {
          const statusMap: Record<string, { icon: any; color: string; text: string }> = {
            deploying: { icon: <ClockCircleOutlined />, color: 'processing', text: '部署中' },
            active: { icon: <CheckCircleOutlined />, color: 'success', text: '运行中' },
            failed: { icon: <CloseCircleOutlined />, color: 'error', text: '失败' },
            rollback: { icon: <ClockCircleOutlined />, color: 'default', text: '已回滚' },
          };
          const s = statusMap[status];
          return (
            <Tag icon={s.icon} color={s.color}>
              {s.text}
            </Tag>
          );
        },
      },
      {
        title: '灰度发布',
        key: 'canary',
        render: (_: any, record: Deployment) =>
          record.canaryEnabled ? (
            <div>
              <Progress percent={record.canaryPercent} size="small" />
            </div>
          ) : (
            <span>-</span>
          ),
      },
      {
        title: '部署人',
        dataIndex: 'deployedBy',
        key: 'deployedBy',
      },
      {
        title: '部署时间',
        dataIndex: 'deployedAt',
        key: 'deployedAt',
        render: (date: Date) => new Date(date).toLocaleString(),
      },
      {
        title: '操作',
        key: 'action',
        render: (_: any, record: Deployment) =>
          record.canaryEnabled && (
            <Button size="small" onClick={() => handleUpdateCanary(record.id)}>
              调整灰度
            </Button>
          ),
      },
    ];

    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={() => setDeployModalVisible(true)}>
            新建部署
          </Button>
        </div>
        <Table dataSource={deployments} columns={columns} rowKey="id" />
      </div>
    );
  };

  // 发布历史时间线
  const renderHistoryTab = () => {
    const items = versions.map(v => ({
      children: (
        <div>
          <div><strong>{v.version}</strong></div>
          <div>{v.changelog}</div>
          <div style={{ color: '#999', fontSize: 12 }}>
            {v.publishedBy} · {new Date(v.publishedAt).toLocaleString()}
          </div>
        </div>
      ),
      color: v.status === 'Published' ? 'green' : 'gray',
    }));

    return <Timeline items={items} />;
  };

  // 处理发布
  const handlePublish = async () => {
    try {
      const values = await form.validateFields();
      console.log('发布版本:', values);
      // TODO: 调用API
      message.success('版本发布成功');
      setPublishModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 处理回滚
  const handleRollback = (versionId: string) => {
    Modal.confirm({
      title: '确认回滚',
      content: '回滚将覆盖当前草稿内容，是否继续？',
      onOk: () => {
        console.log('回滚到版本:', versionId);
        // TODO: 调用API
        message.success('已回滚到指定版本');
      },
    });
  };

  // 处理归档
  const handleArchive = (versionId: string) => {
    console.log('归档版本:', versionId);
    // TODO: 调用API
    message.success('版本已归档');
  };

  // 打开部署弹窗
  const openDeployModal = (versionId: string) => {
    form.setFieldsValue({ versionId });
    setDeployModalVisible(true);
  };

  // 处理部署
  const handleDeploy = async () => {
    try {
      const values = await form.validateFields();
      console.log('部署版本:', values);
      // TODO: 调用API
      message.success('部署成功');
      setDeployModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 更新灰度配置
  const handleUpdateCanary = (deploymentId: string) => {
    Modal.confirm({
      title: '调整灰度比例',
      content: (
        <Form>
          <Form.Item label="灰度比例">
            <Input type="number" min={0} max={100} defaultValue={20} />
          </Form.Item>
        </Form>
      ),
      onOk: () => {
        console.log('更新灰度配置:', deploymentId);
        // TODO: 调用API
        message.success('灰度配置已更新');
      },
    });
  };

  const tabs = [
    { key: 'draft', label: '草稿管理', children: renderDraftTab() },
    { key: 'versions', label: '版本列表', children: renderVersionsTab() },
    { key: 'deployments', label: '部署管理', children: renderDeploymentsTab() },
    { key: 'history', label: '发布历史', children: renderHistoryTab() },
  ];

  return (
    <Layout style={{ height: '100%' }}>
      <Content
        style={{
          background: '#f5f5f5',
          padding: 16,
          overflow: 'auto',
        }}
      >
        <div style={{ background: '#fff', padding: 24, borderRadius: 4, minHeight: '100%' }}>
          <h2 style={{ marginBottom: 24 }}>版本管理</h2>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />
        </div>
      </Content>

      {/* 发布版本弹窗 */}
      <Modal
        title="发布新版本"
        open={publishModalVisible}
        onOk={handlePublish}
        onCancel={() => setPublishModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="version"
            label="版本号"
            rules={[{ required: true, message: '请输入版本号' }]}
          >
            <Input placeholder="如: 1.0.0" />
          </Form.Item>
          <Form.Item name="changelog" label="变更日志">
            <TextArea rows={4} placeholder="描述本次发布的主要变更..." />
          </Form.Item>
          <Form.Item name="runChecks" label="CI检查" valuePropName="checked">
            <Select defaultValue={true}>
              <Option value={true}>执行检查</Option>
              <Option value={false}>跳过检查</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 部署版本弹窗 */}
      <Modal
        title="部署版本"
        open={deployModalVisible}
        onOk={handleDeploy}
        onCancel={() => setDeployModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="versionId" label="版本" rules={[{ required: true }]}>
            <Select>
              {versions.map(v => (
                <Option key={v.id} value={v.id}>
                  {v.version}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="environment" label="环境" rules={[{ required: true }]}>
            <Select>
              <Option value="dev">开发环境</Option>
              <Option value="staging">预发布环境</Option>
              <Option value="production">生产环境</Option>
            </Select>
          </Form.Item>
          <Form.Item name="canaryEnabled" label="启用灰度发布" valuePropName="checked">
            <Select defaultValue={false}>
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
          <Form.Item name="canaryPercent" label="灰度比例 (%)">
            <Input type="number" min={0} max={100} defaultValue={0} />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

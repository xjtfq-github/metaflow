import React, { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Statistic, Progress, Table, Button, Modal, Form, InputNumber, message, Descriptions, Tag } from 'antd';
import { UserOutlined, AppstoreOutlined, ToolOutlined, FileTextOutlined, ApiOutlined, DatabaseOutlined } from '@ant-design/icons';

const { Content } = Layout;

interface TenantQuota {
  tenantId: string;
  maxRecords: number;
  maxStorageMB: number;
  apiRateLimit: number;
  maxUsers: number;
}

interface TenantUsage {
  records: number;
  storageMB: number;
  apiCalls: number;
  users: number;
  apps: number;
}

interface TenantStats {
  tenantId: string;
  users: number;
  apps: number;
  assets: number;
  workOrders: number;
  departments: number;
}

export const TenantManagePage: React.FC = () => {
  const [quota, setQuota] = useState<TenantQuota | null>(null);
  const [usage, setUsage] = useState<TenantUsage | null>(null);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [quotaModalVisible, setQuotaModalVisible] = useState(false);
  const [form] = Form.useForm();

  const mockTenantId = 'tenant-1';

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // 模拟配额数据
    setQuota({
      tenantId: mockTenantId,
      maxRecords: 100000,
      maxStorageMB: 5120,
      apiRateLimit: 1000,
      maxUsers: 100,
    });

    // 模拟使用量
    setUsage({
      records: 45320,
      storageMB: 2048,
      apiCalls: 456,
      users: 25,
      apps: 8,
    });

    // 模拟统计数据
    setStats({
      tenantId: mockTenantId,
      users: 25,
      apps: 8,
      assets: 156,
      workOrders: 342,
      departments: 12,
    });
  };

  // 计算使用率
  const calculateUsage = (current: number, max: number): number => {
    return Math.round((current / max) * 100);
  };

  // 获取使用率颜色
  const getUsageColor = (percentage: number): 'success' | 'normal' | 'exception' => {
    if (percentage < 70) return 'success';
    if (percentage < 90) return 'normal';
    return 'exception';
  };

  // 打开配额设置弹窗
  const openQuotaModal = () => {
    if (quota) {
      form.setFieldsValue(quota);
    }
    setQuotaModalVisible(true);
  };

  // 保存配额设置
  const handleSaveQuota = async () => {
    try {
      const values = await form.validateFields();
      console.log('保存配额:', values);
      // TODO: 调用API
      message.success('配额设置已保存');
      setQuotaModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  if (!quota || !usage || !stats) {
    return <div>加载中...</div>;
  }

  const recordsUsage = calculateUsage(usage.records, quota.maxRecords);
  const storageUsage = calculateUsage(usage.storageMB, quota.maxStorageMB);
  const apiUsage = calculateUsage(usage.apiCalls, quota.apiRateLimit);
  const usersUsage = calculateUsage(usage.users, quota.maxUsers);

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ margin: 0 }}>租户管理</h2>
            <Button type="primary" onClick={openQuotaModal}>
              配置配额
            </Button>
          </div>

          {/* 配额使用情况 */}
          <Card title="配额使用情况" style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="记录数使用"
                    value={recordsUsage}
                    suffix="%"
                    prefix={<DatabaseOutlined />}
                  />
                  <Progress
                    percent={recordsUsage}
                    status={getUsageColor(recordsUsage)}
                    style={{ marginTop: 8 }}
                  />
                  <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                    {usage.records.toLocaleString()} / {quota.maxRecords.toLocaleString()} 条
                  </div>
                </Card>
              </Col>

              <Col span={12}>
                <Card>
                  <Statistic
                    title="存储空间使用"
                    value={storageUsage}
                    suffix="%"
                    prefix={<DatabaseOutlined />}
                  />
                  <Progress
                    percent={storageUsage}
                    status={getUsageColor(storageUsage)}
                    style={{ marginTop: 8 }}
                  />
                  <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                    {usage.storageMB} / {quota.maxStorageMB} MB
                  </div>
                </Card>
              </Col>

              <Col span={12}>
                <Card>
                  <Statistic
                    title="API调用速率"
                    value={apiUsage}
                    suffix="%"
                    prefix={<ApiOutlined />}
                  />
                  <Progress
                    percent={apiUsage}
                    status={getUsageColor(apiUsage)}
                    style={{ marginTop: 8 }}
                  />
                  <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                    {usage.apiCalls} / {quota.apiRateLimit} 次/分钟
                  </div>
                </Card>
              </Col>

              <Col span={12}>
                <Card>
                  <Statistic
                    title="用户数使用"
                    value={usersUsage}
                    suffix="%"
                    prefix={<UserOutlined />}
                  />
                  <Progress
                    percent={usersUsage}
                    status={getUsageColor(usersUsage)}
                    style={{ marginTop: 8 }}
                  />
                  <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                    {usage.users} / {quota.maxUsers} 人
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>

          {/* 租户统计 */}
          <Card title="租户统计信息" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="用户总数"
                  value={stats.users}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="应用总数"
                  value={stats.apps}
                  prefix={<AppstoreOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="设备总数"
                  value={stats.assets}
                  prefix={<ToolOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 24 }}>
              <Col span={8}>
                <Statistic
                  title="工单总数"
                  value={stats.workOrders}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="部门总数"
                  value={stats.departments}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>

          {/* 配额详情 */}
          <Card title="配额配置详情">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="租户ID">
                <Tag color="blue">{quota.tenantId}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="最大记录数">
                {quota.maxRecords.toLocaleString()} 条
              </Descriptions.Item>
              <Descriptions.Item label="最大存储空间">
                {quota.maxStorageMB} MB ({(quota.maxStorageMB / 1024).toFixed(2)} GB)
              </Descriptions.Item>
              <Descriptions.Item label="API速率限制">
                {quota.apiRateLimit} 次/分钟
              </Descriptions.Item>
              <Descriptions.Item label="最大用户数">
                {quota.maxUsers} 人
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 资源隔离说明 */}
          <Card title="资源隔离机制" style={{ marginTop: 24 }}>
            <Descriptions column={1}>
              <Descriptions.Item label="应用层隔离">
                ✓ AsyncLocalStorage 上下文隔离
              </Descriptions.Item>
              <Descriptions.Item label="数据层隔离">
                ✓ Prisma Middleware 自动注入 tenantId 过滤
              </Descriptions.Item>
              <Descriptions.Item label="数据库层隔离">
                ✓ PostgreSQL RLS (行级安全) 支持
              </Descriptions.Item>
              <Descriptions.Item label="配额限制">
                ✓ 记录数、存储、API速率、用户数配额管理
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      </Content>

      {/* 配额设置弹窗 */}
      <Modal
        title="配置租户配额"
        open={quotaModalVisible}
        onOk={handleSaveQuota}
        onCancel={() => setQuotaModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="maxRecords"
            label="最大记录数"
            rules={[{ required: true, message: '请输入最大记录数' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              placeholder="如: 100000"
            />
          </Form.Item>

          <Form.Item
            name="maxStorageMB"
            label="最大存储空间 (MB)"
            rules={[{ required: true, message: '请输入最大存储空间' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="如: 5120"
            />
          </Form.Item>

          <Form.Item
            name="apiRateLimit"
            label="API调用速率限制 (次/分钟)"
            rules={[{ required: true, message: '请输入API速率限制' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="如: 1000"
            />
          </Form.Item>

          <Form.Item
            name="maxUsers"
            label="最大用户数"
            rules={[{ required: true, message: '请输入最大用户数' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="如: 100"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

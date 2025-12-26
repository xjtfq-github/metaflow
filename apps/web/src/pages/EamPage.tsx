import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Tag, Space, Progress, Card, Statistic, Row, Col, Badge } from 'antd';
import { ToolOutlined, FileTextOutlined, ScheduleOutlined, InboxOutlined, WarningOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;

interface Asset {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  status: string;
  healthScore: number;
  location: string;
  nextMaintenance?: Date;
}

interface WorkOrder {
  id: string;
  orderNo: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  asset: { name: string };
  assignee?: { name: string };
  scheduledAt: Date;
}

interface InspectionPlan {
  id: string;
  name: string;
  frequency: string;
  status: string;
  asset: { name: string };
  inspector?: { name: string };
  nextInspection?: Date;
}

interface InventoryItem {
  id: string;
  partCode: string;
  partName: string;
  quantity: number;
  minQuantity: number;
  unit: string;
}

export const EamPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [inspectionPlans, setInspectionPlans] = useState<InspectionPlan[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'asset' | 'workOrder' | 'inspection' | 'inventory'>('asset');
  const [form] = Form.useForm();

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // 模拟资产数据
    setAssets([
      {
        id: '1',
        assetCode: 'PUMP-001',
        name: '离心泵#1',
        category: 'pump',
        status: 'active',
        healthScore: 85,
        location: '采油站-A区',
        nextMaintenance: new Date('2024-12-30'),
      },
      {
        id: '2',
        assetCode: 'VALVE-001',
        name: '控制阀#1',
        category: 'valve',
        status: 'active',
        healthScore: 92,
        location: '采油站-B区',
        nextMaintenance: new Date('2025-01-15'),
      },
    ]);

    // 模拟工单数据
    setWorkOrders([
      {
        id: '1',
        orderNo: 'WO-202400001',
        title: '离心泵定期保养',
        type: 'preventive',
        priority: 'medium',
        status: 'assigned',
        asset: { name: '离心泵#1' },
        assignee: { name: '张三' },
        scheduledAt: new Date('2024-12-28'),
      },
      {
        id: '2',
        orderNo: 'WO-202400002',
        title: '控制阀紧急维修',
        type: 'emergency',
        priority: 'urgent',
        status: 'in_progress',
        asset: { name: '控制阀#1' },
        assignee: { name: '李四' },
        scheduledAt: new Date('2024-12-26'),
      },
    ]);

    // 模拟巡检计划
    setInspectionPlans([
      {
        id: '1',
        name: '泵类设备日常巡检',
        frequency: 'daily',
        status: 'active',
        asset: { name: '离心泵#1' },
        inspector: { name: '王五' },
        nextInspection: new Date('2024-12-27'),
      },
    ]);

    // 模拟库存数据
    setInventory([
      {
        id: '1',
        partCode: 'SEAL-001',
        partName: '机械密封',
        quantity: 5,
        minQuantity: 10,
        unit: '个',
      },
      {
        id: '2',
        partCode: 'BEAR-001',
        partName: '轴承',
        quantity: 15,
        minQuantity: 5,
        unit: '个',
      },
    ]);
  };

  // 概览页
  const renderOverviewTab = () => {
    const alerts = assets.filter(a => a.healthScore < 90).length;
    const pendingOrders = workOrders.filter(w => w.status === 'pending').length;
    const lowStockItems = inventory.filter(i => i.quantity <= i.minQuantity).length;

    return (
      <div>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic title="设备总数" value={assets.length} prefix={<ToolOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="待处理工单" value={pendingOrders} prefix={<FileTextOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="设备健康预警" 
                value={alerts} 
                prefix={<WarningOutlined />}
                valueStyle={{ color: alerts > 0 ? '#cf1322' : '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="库存预警" 
                value={lowStockItems} 
                prefix={<InboxOutlined />}
                valueStyle={{ color: lowStockItems > 0 ? '#cf1322' : '#3f8600' }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="近期维保计划" style={{ marginBottom: 16 }}>
          <Table
            dataSource={assets.filter(a => a.nextMaintenance)}
            columns={[
              { title: '设备编号', dataIndex: 'assetCode', key: 'assetCode' },
              { title: '设备名称', dataIndex: 'name', key: 'name' },
              { title: '位置', dataIndex: 'location', key: 'location' },
              {
                title: '健康分数',
                dataIndex: 'healthScore',
                key: 'healthScore',
                render: (score: number) => (
                  <Progress
                    percent={score}
                    size="small"
                    status={score >= 90 ? 'success' : score >= 70 ? 'normal' : 'exception'}
                  />
                ),
              },
              {
                title: '下次维保',
                dataIndex: 'nextMaintenance',
                key: 'nextMaintenance',
                render: (date: Date) => new Date(date).toLocaleDateString('zh-CN'),
              },
            ]}
            rowKey="id"
            pagination={false}
          />
        </Card>

        <Card title="库存预警">
          <Table
            dataSource={inventory.filter(i => i.quantity <= i.minQuantity)}
            columns={[
              { title: '备件编号', dataIndex: 'partCode', key: 'partCode' },
              { title: '备件名称', dataIndex: 'partName', key: 'partName' },
              {
                title: '库存',
                key: 'stock',
                render: (_: any, record: InventoryItem) => (
                  <Tag color="red">
                    {record.quantity}/{record.minQuantity} {record.unit}
                  </Tag>
                ),
              },
            ]}
            rowKey="id"
            pagination={false}
          />
        </Card>
      </div>
    );
  };

  // 资产管理页
  const renderAssetsTab = () => {
    const columns = [
      { title: '资产编号', dataIndex: 'assetCode', key: 'assetCode' },
      { title: '设备名称', dataIndex: 'name', key: 'name' },
      {
        title: '类别',
        dataIndex: 'category',
        key: 'category',
        render: (cat: string) => {
          const catMap: Record<string, string> = {
            pump: '泵',
            valve: '阀门',
            tank: '储罐',
            pipeline: '管道',
          };
          return catMap[cat] || cat;
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => {
          const colors: Record<string, string> = {
            active: 'green',
            maintenance: 'orange',
            retired: 'default',
          };
          const texts: Record<string, string> = {
            active: '运行中',
            maintenance: '维护中',
            retired: '已退役',
          };
          return <Tag color={colors[status]}>{texts[status]}</Tag>;
        },
      },
      {
        title: '健康分数',
        dataIndex: 'healthScore',
        key: 'healthScore',
        render: (score: number) => (
          <Progress
            percent={score}
            size="small"
            status={score >= 90 ? 'success' : score >= 70 ? 'normal' : 'exception'}
          />
        ),
      },
      { title: '位置', dataIndex: 'location', key: 'location' },
      {
        title: '操作',
        key: 'action',
        render: (_: any, record: Asset) => (
          <Space>
            <Button size="small">详情</Button>
            <Button size="small">维保</Button>
          </Space>
        ),
      },
    ];

    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={() => openModal('asset')}>
            新增设备
          </Button>
        </div>
        <Table dataSource={assets} columns={columns} rowKey="id" />
      </div>
    );
  };

  // 工单管理页
  const renderWorkOrdersTab = () => {
    const columns = [
      { title: '工单号', dataIndex: 'orderNo', key: 'orderNo' },
      { title: '工单标题', dataIndex: 'title', key: 'title' },
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
        render: (type: string) => {
          const typeMap: Record<string, { text: string; color: string }> = {
            preventive: { text: '预防性', color: 'blue' },
            corrective: { text: '纠正性', color: 'orange' },
            emergency: { text: '紧急', color: 'red' },
          };
          const t = typeMap[type];
          return <Tag color={t.color}>{t.text}</Tag>;
        },
      },
      {
        title: '优先级',
        dataIndex: 'priority',
        key: 'priority',
        render: (priority: string) => {
          const colors: Record<string, string> = {
            low: 'default',
            medium: 'blue',
            high: 'orange',
            urgent: 'red',
          };
          return <Tag color={colors[priority]}>{priority.toUpperCase()}</Tag>;
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => {
          const statusMap: Record<string, { text: string; color: string }> = {
            pending: { text: '待分配', color: 'default' },
            assigned: { text: '已分配', color: 'blue' },
            in_progress: { text: '进行中', color: 'processing' },
            completed: { text: '已完成', color: 'success' },
            cancelled: { text: '已取消', color: 'default' },
          };
          const s = statusMap[status];
          return <Tag color={s.color}>{s.text}</Tag>;
        },
      },
      { title: '设备', dataIndex: ['asset', 'name'], key: 'asset' },
      { title: '负责人', dataIndex: ['assignee', 'name'], key: 'assignee', render: (text: string) => text || '-' },
      {
        title: '计划时间',
        dataIndex: 'scheduledAt',
        key: 'scheduledAt',
        render: (date: Date) => new Date(date).toLocaleString('zh-CN'),
      },
      {
        title: '操作',
        key: 'action',
        render: (_: any, record: WorkOrder) => (
          <Space>
            <Button size="small">详情</Button>
            {record.status === 'pending' && <Button size="small">分配</Button>}
            {record.status === 'assigned' && <Button size="small" type="primary">开始</Button>}
            {record.status === 'in_progress' && <Button size="small" type="primary">完成</Button>}
          </Space>
        ),
      },
    ];

    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={() => openModal('workOrder')}>
            创建工单
          </Button>
        </div>
        <Table dataSource={workOrders} columns={columns} rowKey="id" />
      </div>
    );
  };

  // 巡检计划页
  const renderInspectionTab = () => {
    const columns = [
      { title: '计划名称', dataIndex: 'name', key: 'name' },
      {
        title: '频率',
        dataIndex: 'frequency',
        key: 'frequency',
        render: (freq: string) => {
          const freqMap: Record<string, string> = {
            daily: '每日',
            weekly: '每周',
            monthly: '每月',
            quarterly: '每季度',
            yearly: '每年',
          };
          return freqMap[freq] || freq;
        },
      },
      { title: '设备', dataIndex: ['asset', 'name'], key: 'asset' },
      { title: '巡检员', dataIndex: ['inspector', 'name'], key: 'inspector', render: (text: string) => text || '-' },
      {
        title: '下次巡检',
        dataIndex: 'nextInspection',
        key: 'nextInspection',
        render: (date: Date) => date ? new Date(date).toLocaleDateString('zh-CN') : '-',
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => {
          const colors: Record<string, string> = {
            active: 'green',
            suspended: 'orange',
            archived: 'default',
          };
          const texts: Record<string, string> = {
            active: '启用中',
            suspended: '已暂停',
            archived: '已归档',
          };
          return <Tag color={colors[status]}>{texts[status]}</Tag>;
        },
      },
      {
        title: '操作',
        key: 'action',
        render: () => (
          <Space>
            <Button size="small">详情</Button>
            <Button size="small">编辑</Button>
          </Space>
        ),
      },
    ];

    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={() => openModal('inspection')}>
            新建计划
          </Button>
        </div>
        <Table dataSource={inspectionPlans} columns={columns} rowKey="id" />
      </div>
    );
  };

  // 库存管理页
  const renderInventoryTab = () => {
    const columns = [
      { title: '备件编号', dataIndex: 'partCode', key: 'partCode' },
      { title: '备件名称', dataIndex: 'partName', key: 'partName' },
      {
        title: '库存状态',
        key: 'stockStatus',
        render: (_: any, record: InventoryItem) => {
          const isLow = record.quantity <= record.minQuantity;
          return (
            <Space>
              <Badge status={isLow ? 'error' : 'success'} />
              <span>{record.quantity} {record.unit}</span>
              {isLow && <Tag color="red">库存不足</Tag>}
            </Space>
          );
        },
      },
      { title: '最小库存', dataIndex: 'minQuantity', key: 'minQuantity', render: (val: number, record: InventoryItem) => `${val} ${record.unit}` },
      {
        title: '操作',
        key: 'action',
        render: (_: any, record: InventoryItem) => (
          <Space>
            <Button size="small">详情</Button>
            <Button size="small">入库</Button>
            <Button size="small">出库</Button>
          </Space>
        ),
      },
    ];

    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={() => openModal('inventory')}>
            新增备件
          </Button>
        </div>
        <Table dataSource={inventory} columns={columns} rowKey="id" />
      </div>
    );
  };

  const openModal = (type: typeof modalType) => {
    setModalType(type);
    setModalVisible(true);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('提交数据:', { type: modalType, values });
      // TODO: 调用API
      setModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const renderModalContent = () => {
    switch (modalType) {
      case 'asset':
        return (
          <>
            <Form.Item name="assetCode" label="资产编号" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="name" label="设备名称" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="category" label="设备类别" rules={[{ required: true }]}>
              <Select>
                <Option value="pump">泵</Option>
                <Option value="valve">阀门</Option>
                <Option value="tank">储罐</Option>
                <Option value="pipeline">管道</Option>
              </Select>
            </Form.Item>
            <Form.Item name="location" label="安装位置" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="manufacturer" label="制造商">
              <Input />
            </Form.Item>
            <Form.Item name="model" label="型号">
              <Input />
            </Form.Item>
          </>
        );
      case 'workOrder':
        return (
          <>
            <Form.Item name="title" label="工单标题" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="assetId" label="设备" rules={[{ required: true }]}>
              <Select>
                {assets.map(a => (
                  <Option key={a.id} value={a.id}>{a.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="type" label="工单类型" rules={[{ required: true }]}>
              <Select>
                <Option value="preventive">预防性</Option>
                <Option value="corrective">纠正性</Option>
                <Option value="emergency">紧急</Option>
              </Select>
            </Form.Item>
            <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
              <Select>
                <Option value="low">低</Option>
                <Option value="medium">中</Option>
                <Option value="high">高</Option>
                <Option value="urgent">紧急</Option>
              </Select>
            </Form.Item>
            <Form.Item name="scheduledAt" label="计划时间" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="description" label="工单描述">
              <TextArea rows={4} />
            </Form.Item>
          </>
        );
      case 'inspection':
        return (
          <>
            <Form.Item name="name" label="计划名称" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="assetId" label="设备" rules={[{ required: true }]}>
              <Select>
                {assets.map(a => (
                  <Option key={a.id} value={a.id}>{a.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="frequency" label="巡检频率" rules={[{ required: true }]}>
              <Select>
                <Option value="daily">每日</Option>
                <Option value="weekly">每周</Option>
                <Option value="monthly">每月</Option>
                <Option value="quarterly">每季度</Option>
                <Option value="yearly">每年</Option>
              </Select>
            </Form.Item>
            <Form.Item name="description" label="计划描述">
              <TextArea rows={3} />
            </Form.Item>
          </>
        );
      case 'inventory':
        return (
          <>
            <Form.Item name="partCode" label="备件编号" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="partName" label="备件名称" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="specification" label="规格型号">
              <Input />
            </Form.Item>
            <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
              <Input placeholder="如: 个, 台, 套" />
            </Form.Item>
            <Form.Item name="quantity" label="初始库存" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="minQuantity" label="最小库存" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="unitPrice" label="单价">
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </>
        );
      default:
        return null;
    }
  };

  const tabs = [
    { key: 'overview', label: '概览', icon: <ScheduleOutlined />, children: renderOverviewTab() },
    { key: 'assets', label: '设备资产', icon: <ToolOutlined />, children: renderAssetsTab() },
    { key: 'workOrders', label: '维保工单', icon: <FileTextOutlined />, children: renderWorkOrdersTab() },
    { key: 'inspection', label: '巡检计划', icon: <ScheduleOutlined />, children: renderInspectionTab() },
    { key: 'inventory', label: '备件库存', icon: <InboxOutlined />, children: renderInventoryTab() },
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
          <h2 style={{ marginBottom: 24 }}>设备维保管理(EAM)</h2>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />
        </div>
      </Content>

      <Modal
        title={
          modalType === 'asset' ? '新增设备' :
          modalType === 'workOrder' ? '创建工单' :
          modalType === 'inspection' ? '新建巡检计划' :
          '新增备件'
        }
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          {renderModalContent()}
        </Form>
      </Modal>
    </Layout>
  );
};

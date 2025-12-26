import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Table, Button, Modal, Form, Input, Select, Tree, message, Space, Tag } from 'antd';
import type { DataNode } from 'antd/es/tree';

const { Content, Sider } = Layout;
const { Option } = Select;

interface Department {
  id: string;
  name: string;
  parentId?: string;
  children?: Department[];
  path: string;
  level: number;
}

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface Policy {
  id: string;
  effect: 'ALLOW' | 'DENY';
  resource: string;
  actions: string;
  condition?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  department?: Department;
  userRoles?: Array<{ role: Role }>;
}

export const PermissionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('departments');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'department' | 'role' | 'policy' | 'userRole'>('department');
  const [form] = Form.useForm();

  // 模拟数据加载
  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // 模拟部门数据
    const mockDepts: Department[] = [
      { id: '1', name: '总公司', path: '/1/', level: 0, children: [
        { id: '2', name: '技术部', parentId: '1', path: '/1/2/', level: 1, children: [
          { id: '3', name: '前端组', parentId: '2', path: '/1/2/3/', level: 2 },
          { id: '4', name: '后端组', parentId: '2', path: '/1/2/4/', level: 2 },
        ]},
        { id: '5', name: '财务部', parentId: '1', path: '/1/5/', level: 1 },
      ]},
    ];

    // 模拟角色数据
    const mockRoles: Role[] = [
      { id: 'r1', name: '管理员', code: 'admin', description: '系统管理员' },
      { id: 'r2', name: '财务主管', code: 'finance_manager', description: '财务部门主管' },
      { id: 'r3', name: '普通员工', code: 'employee', description: '普通员工' },
    ];

    // 模拟用户数据
    const mockUsers: User[] = [
      { id: 'u1', name: '张三', email: 'zhangsan@example.com', department: mockDepts[0].children![0], userRoles: [{ role: mockRoles[0] }] },
      { id: 'u2', name: '李四', email: 'lisi@example.com', department: mockDepts[0].children![1], userRoles: [{ role: mockRoles[1] }] },
    ];

    // 模拟策略数据
    const mockPolicies: Policy[] = [
      { id: 'p1', effect: 'ALLOW', resource: '*', actions: 'read,create,update,delete' },
      { id: 'p2', effect: 'ALLOW', resource: 'Order', actions: 'read,update' },
      { id: 'p3', effect: 'DENY', resource: 'User', actions: 'delete' },
    ];

    setDepartments(mockDepts);
    setRoles(mockRoles);
    setUsers(mockUsers);
    setPolicies(mockPolicies);
  };

  // 转换部门树数据
  const convertToTreeData = (depts: Department[]): DataNode[] => {
    return depts.map(dept => ({
      title: `${dept.name} (Level ${dept.level})`,
      key: dept.id,
      children: dept.children ? convertToTreeData(dept.children) : undefined,
    }));
  };

  // 部门管理
  const renderDepartmentTab = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => openModal('department')}>
          新建部门
        </Button>
      </div>
      <Tree
        treeData={convertToTreeData(departments)}
        defaultExpandAll
        showLine
      />
    </div>
  );

  // 角色管理
  const renderRoleTab = () => {
    const columns = [
      { title: '角色名称', dataIndex: 'name', key: 'name' },
      { title: '角色编码', dataIndex: 'code', key: 'code' },
      { title: '描述', dataIndex: 'description', key: 'description' },
      {
        title: '操作',
        key: 'action',
        render: (_: any, record: Role) => (
          <Space>
            <Button size="small" onClick={() => openModal('policy', record.id)}>
              配置权限
            </Button>
            <Button size="small">编辑</Button>
          </Space>
        ),
      },
    ];

    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={() => openModal('role')}>
            新建角色
          </Button>
        </div>
        <Table dataSource={roles} columns={columns} rowKey="id" />
      </div>
    );
  };

  // 用户角色管理
  const renderUserTab = () => {
    const columns = [
      { title: '用户名', dataIndex: 'name', key: 'name' },
      { title: '邮箱', dataIndex: 'email', key: 'email' },
      { 
        title: '部门', 
        dataIndex: ['department', 'name'], 
        key: 'department',
        render: (text: string) => text || '-'
      },
      {
        title: '角色',
        key: 'roles',
        render: (_: any, record: User) => (
          <>
            {record.userRoles?.map(ur => (
              <Tag key={ur.role.id} color="blue">{ur.role.name}</Tag>
            ))}
          </>
        ),
      },
      {
        title: '操作',
        key: 'action',
        render: (_: any, record: User) => (
          <Button size="small" onClick={() => openModal('userRole', record.id)}>
            分配角色
          </Button>
        ),
      },
    ];

    return <Table dataSource={users} columns={columns} rowKey="id" />;
  };

  // 策略管理
  const renderPolicyTab = () => {
    const columns = [
      { 
        title: '效果', 
        dataIndex: 'effect', 
        key: 'effect',
        render: (effect: string) => (
          <Tag color={effect === 'ALLOW' ? 'green' : 'red'}>{effect}</Tag>
        )
      },
      { title: '资源', dataIndex: 'resource', key: 'resource' },
      { title: '操作', dataIndex: 'actions', key: 'actions' },
      { title: '条件', dataIndex: 'condition', key: 'condition', render: (text: string) => text || '-' },
    ];

    return <Table dataSource={policies} columns={columns} rowKey="id" />;
  };

  // 打开模态框
  const openModal = (type: typeof modalType, recordId?: string) => {
    setModalType(type);
    setModalVisible(true);
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('提交数据:', { type: modalType, values });
      
      // TODO: 调用API
      // await fetch('/api/organization/...', { method: 'POST', body: JSON.stringify(values) });
      
      message.success('操作成功');
      setModalVisible(false);
      // loadMockData(); // 重新加载数据
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 渲染模态框内容
  const renderModalContent = () => {
    switch (modalType) {
      case 'department':
        return (
          <>
            <Form.Item name="name" label="部门名称" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="parentId" label="上级部门">
              <Select allowClear>
                {/* 递归渲染部门选项 */}
                <Option value="">无（根部门）</Option>
              </Select>
            </Form.Item>
          </>
        );
      case 'role':
        return (
          <>
            <Form.Item name="name" label="角色名称" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="code" label="角色编码" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <Input.TextArea />
            </Form.Item>
          </>
        );
      case 'policy':
        return (
          <>
            <Form.Item name="effect" label="效果" rules={[{ required: true }]}>
              <Select>
                <Option value="ALLOW">允许</Option>
                <Option value="DENY">拒绝</Option>
              </Select>
            </Form.Item>
            <Form.Item name="resource" label="资源" rules={[{ required: true }]}>
              <Input placeholder="如: Order, User, *" />
            </Form.Item>
            <Form.Item name="actions" label="操作" rules={[{ required: true }]}>
              <Input placeholder="如: read,create,update,delete" />
            </Form.Item>
            <Form.Item name="condition" label="条件（JSON）">
              <Input.TextArea placeholder='如: {"status": {"eq": "active"}}' />
            </Form.Item>
          </>
        );
      case 'userRole':
        return (
          <Form.Item name="roleId" label="选择角色" rules={[{ required: true }]}>
            <Select>
              {roles.map(role => (
                <Option key={role.id} value={role.id}>{role.name}</Option>
              ))}
            </Select>
          </Form.Item>
        );
      default:
        return null;
    }
  };

  const tabs = [
    { key: 'departments', label: '部门管理', children: renderDepartmentTab() },
    { key: 'roles', label: '角色管理', children: renderRoleTab() },
    { key: 'users', label: '用户角色', children: renderUserTab() },
    { key: 'policies', label: '策略查看', children: renderPolicyTab() },
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
          <h2 style={{ marginBottom: 24 }}>权限管理</h2>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />
        </div>
      </Content>

      <Modal
        title={
          modalType === 'department' ? '新建部门' :
          modalType === 'role' ? '新建角色' :
          modalType === 'policy' ? '配置权限策略' :
          '分配角色'
        }
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          {renderModalContent()}
        </Form>
      </Modal>
    </Layout>
  );
};

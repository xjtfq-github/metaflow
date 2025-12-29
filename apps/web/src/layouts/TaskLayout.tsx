import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  InboxOutlined,
  CheckCircleOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const TaskLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    {
      key: '/tasks/pending',
      icon: <InboxOutlined />,
      label: '我的待办',
    },
    {
      key: '/tasks/completed',
      icon: <CheckCircleOutlined />,
      label: '已办任务',
    },
    {
      key: '/tasks/instances',
      icon: <ProjectOutlined />,
      label: '流程实例',
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Sider width={200} theme="light" style={{ background: '#fff' }}>
        <div style={{ padding: '16px', fontWeight: 'bold', fontSize: '16px' }}>
          待办中心
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Content style={{ padding: '0', background: '#f5f5f5' }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default TaskLayout;

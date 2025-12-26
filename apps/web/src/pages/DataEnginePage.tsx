/**
 * 数据引擎主页面
 * 
 * 集成数据模型管理和数据记录管理功能
 */

import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { DatabaseOutlined, TableOutlined, AppstoreOutlined } from '@ant-design/icons';
import { DataModelManager } from '../components/DataEngine/DataModelManager';
import { DataRecordManager } from '../components/DataEngine/DataRecordManager';
import { DataSourceConfig } from '../components/DataEngine/DataSourceConfig';

const { Content, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem('数据模型管理', 'models', <DatabaseOutlined />),
  getItem('数据记录管理', 'records', <TableOutlined />),
  getItem('数据源配置', 'datasource', <AppstoreOutlined />),
];

export const DataEnginePage: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('models');

  const onMenuClick = (e: { key: string }) => {
    setSelectedKey(e.key);
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={200} style={{ background: '#fff' }}>
        <div style={{ height: 64, lineHeight: '64px', paddingLeft: 24, fontWeight: 'bold', fontSize: 16 }}>
          数据引擎
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={onMenuClick}
          style={{ height: '100%', borderRight: 0 }}
          items={items}
        />
      </Sider>
      <Layout style={{ padding: '24px' }}>
        <Content
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            background: '#fff',
            borderRadius: 6,
          }}
        >
          {selectedKey === 'models' && <DataModelManager />}
          {selectedKey === 'records' && <div>请选择一个数据模型来管理记录</div>}
          {selectedKey === 'datasource' && <DataSourceConfig />}
        </Content>
      </Layout>
    </Layout>
  );
};
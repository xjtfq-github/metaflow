/**
 * 数据引擎主页面
 * 
 * 集成数据模型管理和数据记录管理功能
 */

import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { DatabaseOutlined, TableOutlined } from '@ant-design/icons';
import { DataModelManager } from '../components/DataEngine/DataModelManager';
import { DataRecordManager } from '../components/DataEngine/DataRecordManager';
import type { ModelDSL } from '@metaflow/shared-types';

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
];

export const DataEnginePage: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('models');
  const [selectedModel, setSelectedModel] = useState<ModelDSL | null>(null);

  const onMenuClick = (e: { key: string }) => {
    setSelectedKey(e.key);
    if (e.key !== 'records') {
      setSelectedModel(null);
    }
  };

  const handleModelSelect = (model: ModelDSL) => {
    setSelectedModel(model);
    setSelectedKey('records');
  };

  return (
    <Layout style={{ height: '100%' }}>
      <Sider
        width={280}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          overflow: 'auto',
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>数据引擎</h3>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={onMenuClick}
          style={{ borderRight: 0 }}
          items={items}
        />
      </Sider>
      <Content
        style={{
          background: '#f5f5f5',
          padding: 16,
          overflow: 'auto',
        }}
      >
       <div style={{ background: '#fff', padding: 24, borderRadius: 4, minHeight: '100%' }}>
          {selectedKey === 'models' && <DataModelManager onModelSelect={handleModelSelect} />}
          {selectedKey === 'records' && (
            selectedModel ? (
              <DataRecordManager 
                model={selectedModel} 
                onBack={() => {
                  setSelectedModel(null);
                  setSelectedKey('models');
                }} 
              />
            ) : (
              <div>请从数据模型管理中点击"查看数据"来管理记录</div>
            )
          )}
        </div>
      </Content>
    </Layout>
  );
};
import './App.css';
import { Designer } from './components/Designer';
import { PermissionProvider } from './contexts/PermissionContext';
import { DataEnginePage } from './pages/DataEnginePage';
import { PermissionPage } from './pages/PermissionPage';
import { VersionPage } from './pages/VersionPage';
import { EamPage } from './pages/EamPage';
import { TenantManagePage } from './pages/TenantManagePage';
import { CopilotDemoPage } from './pages/CopilotDemoPage';
import { FaasPage } from './pages/FaasPage';
import { PerformancePage } from './pages/PerformancePage';
import { ObservabilityPage } from './pages/ObservabilityPage';
import { CodegenPage } from './pages/CodegenPage';
import { DeliveryPage } from './pages/DeliveryPage';
import { AppManagerPage } from './pages/AppManagerPage';
import { WorkflowPage } from './pages/WorkflowPage';
import { CopilotAssistant } from './components/CopilotAssistant';
import { Layout, Menu, FloatButton } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import React, { useState } from 'react';

const { Header, Content } = Layout;

function App() {
  const [activePage, setActivePage] = useState('designer');
  const [copilotVisible, setCopilotVisible] = useState(false); // 'designer' or 'dataengine'

  return (
    <PermissionProvider>
      <Layout style={{ minHeight: '100vh', width: '100%' }}>
        <Header style={{ background: '#fff', padding: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 20 }}>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>MetaFlow 低代码平台</h1>
            <Menu
              mode="horizontal"
              selectedKeys={[activePage]}
              onClick={(e) => setActivePage(e.key)}
              style={{ flex: 1, minWidth: 0, marginLeft: 50 }}
            >
              <Menu.Item key="designer">页面设计器</Menu.Item>
              <Menu.Item key="apps">应用管理</Menu.Item>
              <Menu.Item key="dataengine">数据引擎</Menu.Item>
              <Menu.Item key="workflow">工作流</Menu.Item>
              <Menu.Item key="permission">权限管理</Menu.Item>
              <Menu.Item key="version">版本管理</Menu.Item>
              <Menu.Item key="eam">EAM维保</Menu.Item>
              <Menu.Item key="tenant">租户管理</Menu.Item>
              <Menu.Item key="copilot">AI助手</Menu.Item>
              <Menu.Item key="faas">FaaS扩展</Menu.Item>
              <Menu.Item key="performance">性能监控</Menu.Item>
              <Menu.Item key="observability">观测监控</Menu.Item>
              <Menu.Item key="codegen">代码生成</Menu.Item>
              <Menu.Item key="delivery">整合交付</Menu.Item>
            </Menu>
          </div>
        </Header>
        <Content style={{ background: '#f5f5f5', flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
          {activePage === 'designer' ? (
            <Designer />
          ) : activePage === 'apps' ? (
            <AppManagerPage />
          ) : activePage === 'dataengine' ? (
            <DataEnginePage />
          ) : activePage === 'workflow' ? (
            <WorkflowPage />
          ) : activePage === 'permission' ? (
            <PermissionPage />
          ) : activePage === 'version' ? (
            <VersionPage />
          ) : activePage === 'eam' ? (
            <EamPage />
          ) : activePage === 'tenant' ? (
            <TenantManagePage />
          ) : activePage === 'copilot' ? (
            <CopilotDemoPage />
          ) : activePage === 'faas' ? (
            <FaasPage />
          ) : activePage === 'performance' ? (
            <PerformancePage />
          ) : activePage === 'observability' ? (
            <ObservabilityPage />
          ) : activePage === 'codegen' ? (
            <CodegenPage />
          ) : (
            <DeliveryPage />
          )}
        </Content>
      </Layout>
      
      {/* AI Copilot 浮动按钮 */}
      <FloatButton
        icon={<RobotOutlined />}
        type="primary"
        style={{ right: 24, bottom: 24 }}
        tooltip="AI助手"
        onClick={() => setCopilotVisible(true)}
      />
      
      {/* AI Copilot 抽屉 */}
      <CopilotAssistant
        visible={copilotVisible}
        onClose={() => setCopilotVisible(false)}
      />
    </PermissionProvider>
  );
}

export default App;
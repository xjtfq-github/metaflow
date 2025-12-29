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
import { PreviewPage } from './pages/PreviewPage';
import { WorkflowPage } from './pages/WorkflowPage';
import { WorkflowDesigner } from './pages/WorkflowDesigner';
import TodoCenter from './pages/TodoCenter';
import TaskDetail from './pages/TaskDetail';
import WorkflowInstanceTracking from './pages/WorkflowInstanceTracking';
import WorkflowInstanceList from './pages/WorkflowInstanceList';
import { CopilotAssistant } from './components/CopilotAssistant';
import { Layout, Menu, FloatButton } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import React, { useState } from 'react';

const { Header, Content } = Layout;

function App() {
  const params = new URLSearchParams(window.location.search);
  const pageParam = params.get('page');
  
  const [activePage, setActivePage] = useState(pageParam || 'designer');
  const [copilotVisible, setCopilotVisible] = useState(false);
  const [currentAppId, setCurrentAppId] = useState<string | null>(null);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [currentInstanceId, setCurrentInstanceId] = useState<string | null>(null);
  const [todoSubPage, setTodoSubPage] = useState<'pending' | 'completed' | 'workflow'>('pending');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState<Array<{ id: string; name: string }>>([]);

  // 加载工作流列表
  React.useEffect(() => {
    if (activePage === 'todo') {
      console.log('开始加载工作流列表...');
      fetch('/api/workflows?tenantId=tenant-1')
        .then(res => res.json())
        .then(data => {
          console.log('工作流列表数据:', data);
          if (data.success) {
            setWorkflows(data.data || []);
            console.log('已设置工作流列表:', data.data);
          }
        })
        .catch(err => console.error('加载工作流列表失败:', err));
    }
  }, [activePage]);

  return (
    <PermissionProvider>
      {activePage === 'preview' ? (
        // 预览页面不显示 Header
        <PreviewPage />
      ) : (
        <Layout style={{ minHeight: '100vh', width: '100%' }}>
          <Header style={{ background: '#fff', padding: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 20 }}>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>MetaFlow 低代码平台</h1>
              <Menu
                mode="horizontal"
                selectedKeys={[activePage]}
                onClick={(e) => setActivePage(e.key)}
                style={{ flex: 1, minWidth: 0, marginLeft: 50 }}
                items={[
                  { key: 'apps', label: '应用管理' },
                  { key: 'designer', label: '页面设计器' },
                  { key: 'dataengine', label: '数据引擎' },
                  { key: 'workflow', label: '工作流管理' },
                  { key: 'workflow-designer', label: '流程设计器' },
                  { key: 'todo', label: '待办中心' },
                  { key: 'permission', label: '权限管理' },
                  { key: 'version', label: '版本管理' },
                  { key: 'eam', label: 'EAM维保' },
                  { key: 'tenant', label: '租户管理' },
                  { key: 'copilot', label: 'AI助手' },
                  { key: 'faas', label: 'FaaS扩展' },
                  { key: 'performance', label: '性能监控' },
                  { key: 'observability', label: '观测监控' },
                  { key: 'codegen', label: '代码生成' },
                  { key: 'delivery', label: '整合交付' },
                ]}
              />
            </div>
          </Header>
          <Content style={{ background: '#f5f5f5', flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
            {activePage === 'designer' ? (
              <Designer appId={currentAppId} />
            ) : activePage === 'apps' ? (
            <AppManagerPage onDesign={(appId) => {
              setCurrentAppId(appId);
              setActivePage('designer');
            }} />
          ) : activePage === 'dataengine' ? (
            <DataEnginePage />
          ) : activePage === 'workflow' ? (
            <WorkflowPage onDesign={(workflowId) => {
              setCurrentWorkflowId(workflowId);
              setActivePage('workflow-designer');
            }} />
          ) : activePage === 'workflow-designer' ? (
            <WorkflowDesigner workflowId={currentWorkflowId} />
          ) : activePage === 'todo' ? (
            <div style={{ display: 'flex', height: '100%', minHeight: '600px' }}>
              <div style={{ 
                width: 220, 
                background: '#fff', 
                borderRight: '1px solid #f0f0f0', 
                overflowY: 'auto',
                flexShrink: 0
              }}>
                <div style={{ padding: '16px', fontWeight: 'bold', fontSize: '16px', borderBottom: '1px solid #f0f0f0' }}>
                  待办中心
                </div>
                <div style={{ padding: '8px' }}>
                  {/* 我的待办 */}
                  <div
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: todoSubPage === 'pending' ? '#e6f7ff' : 'transparent',
                      borderRadius: 4,
                      marginBottom: 4,
                      fontWeight: todoSubPage === 'pending' ? 'bold' : 'normal',
                    }}
                    onClick={() => {
                      setTodoSubPage('pending');
                      setSelectedWorkflowId(null);
                    }}
                  >
                    📥 我的待办
                  </div>
                  {/* 已办任务 */}
                  <div
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: todoSubPage === 'completed' ? '#e6f7ff' : 'transparent',
                      borderRadius: 4,
                      marginBottom: 8,
                      fontWeight: todoSubPage === 'completed' ? 'bold' : 'normal',
                    }}
                    onClick={() => {
                      setTodoSubPage('completed');
                      setSelectedWorkflowId(null);
                    }}
                  >
                    ✅ 已办任务
                  </div>
                  {/* 分隔线 */}
                  <div style={{ borderTop: '1px solid #f0f0f0', margin: '8px 0', padding: '8px 16px', color: '#999', fontSize: '12px' }}>
                    流程列表
                  </div>
                  {/* 动态工作流列表 */}
                  {workflows.map(workflow => (
                    <div
                      key={workflow.id}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        background: todoSubPage === 'workflow' && selectedWorkflowId === workflow.id ? '#e6f7ff' : 'transparent',
                        borderRadius: 4,
                        marginBottom: 4,
                        fontWeight: todoSubPage === 'workflow' && selectedWorkflowId === workflow.id ? 'bold' : 'normal',
                      }}
                      onClick={() => {
                        setTodoSubPage('workflow');
                        setSelectedWorkflowId(workflow.id);
                      }}
                    >
                      📋 {workflow.name}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {todoSubPage === 'pending' && (
                  <TodoCenter 
                    onViewTask={(taskId) => {
                      setCurrentTaskId(taskId);
                      setActivePage('task-detail');
                    }}
                    onViewInstance={(instanceId) => {
                      setCurrentInstanceId(instanceId);
                      setActivePage('workflow-instance');
                    }}
                  />
                )}
                {todoSubPage === 'completed' && (
                  <TodoCenter 
                    onViewTask={(taskId) => {
                      setCurrentTaskId(taskId);
                      setActivePage('task-detail');
                    }}
                    onViewInstance={(instanceId) => {
                      setCurrentInstanceId(instanceId);
                      setActivePage('workflow-instance');
                    }}
                  />
                )}
                {todoSubPage === 'workflow' && selectedWorkflowId && (
                  <WorkflowInstanceList 
                    workflowId={selectedWorkflowId}
                    onViewDetail={(instanceId) => {
                      setCurrentInstanceId(instanceId);
                      setActivePage('workflow-instance');
                    }}
                    onViewDiagram={(instanceId) => {
                      setCurrentInstanceId(instanceId);
                      setActivePage('workflow-instance');
                    }}
                  />
                )}
              </div>
            </div>
          ) : activePage === 'task-detail' ? (
            <TaskDetail 
              taskId={currentTaskId || undefined}
              onBack={() => setActivePage('todo')}
            />
          ) : activePage === 'workflow-instance' ? (
            <WorkflowInstanceTracking 
              instanceId={currentInstanceId || undefined}
              onBack={() => setActivePage('todo')}
            />
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
      )}
      
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
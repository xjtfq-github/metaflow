import React, { useState } from 'react';
import { Card, Button, Input, message, Space, Tabs, Typography, Tag } from 'antd';
import { DownloadOutlined, CodeOutlined, FileTextOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { TabPane } = Tabs;
const { Title, Paragraph } = Typography;

export const CodegenPage: React.FC = () => {
  const [componentDef, setComponentDef] = useState('{\n  "id": "btn1",\n  "type": "Button",\n  "props": {\n    "type": "primary"\n  }\n}');
  const [componentName, setComponentName] = useState('MyButton');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [appId, setAppId] = useState('');

  // 生成组件代码
  const handleGenerateComponent = async () => {
    try {
      setLoading(true);
      const component = JSON.parse(componentDef);
      
      const response = await fetch('/api/codegen/component', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ component, name: componentName }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedCode(data.data.code);
        message.success('组件代码生成成功');
      } else {
        message.error(data.message || '生成失败');
      }
    } catch (error: any) {
      message.error(error.message || '生成失败');
    } finally {
      setLoading(false);
    }
  };

  // 生成并下载项目
  const handleExportProject = async () => {
    if (!appId) {
      message.warning('请输入应用ID');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/codegen/project/${appId}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        const files = data.data.files;
        
        // 显示文件列表
        const fileCount = Object.keys(files).length;
        message.success(`项目生成成功，共 ${fileCount} 个文件`);
        
        // 下载为JSON（简化版）
        const blob = new Blob([JSON.stringify(files, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${appId}-project.json`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        message.error(data.message || '导出失败');
      }
    } catch (error: any) {
      message.error(error.message || '导出失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>
        <CodeOutlined /> 出码能力与双向工程
      </Title>
      <Paragraph>
        将可视化设计的组件和页面转换为可独立运行的代码项目
      </Paragraph>

      <Tabs defaultActiveKey="1">
        {/* 组件代码生成 */}
        <TabPane tab={<span><FileTextOutlined /> 组件生成</span>} key="1">
          <Card title="生成React组件代码" size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>
                  组件名称:
                </label>
                <Input
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  placeholder="例如：MyButton"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>
                  组件定义 (JSON):
                </label>
                <TextArea
                  rows={10}
                  value={componentDef}
                  onChange={(e) => setComponentDef(e.target.value)}
                  placeholder="输入组件定义JSON"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <Button
                type="primary"
                icon={<CodeOutlined />}
                onClick={handleGenerateComponent}
                loading={loading}
              >
                生成代码
              </Button>

              {generatedCode && (
                <div>
                  <label style={{ display: 'block', marginBottom: 8 }}>
                    生成的代码:
                  </label>
                  <TextArea
                    rows={20}
                    value={generatedCode}
                    readOnly
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                </div>
              )}
            </Space>
          </Card>
        </TabPane>

        {/* 项目导出 */}
        <TabPane tab={<span><DownloadOutlined /> 项目导出</span>} key="2">
          <Card title="导出完整项目" size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Paragraph>
                  输入应用ID，导出完整的可独立运行的React项目代码
                </Paragraph>
                <Tag color="blue">React 18</Tag>
                <Tag color="green">TypeScript</Tag>
                <Tag color="orange">Ant Design</Tag>
                <Tag color="purple">Vite</Tag>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>
                  应用ID:
                </label>
                <Input
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="例如：app-123"
                />
              </div>

              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleExportProject}
                loading={loading}
                size="large"
              >
                生成并下载项目
              </Button>

              <Card size="small" title="生成的项目包含:">
                <ul>
                  <li>📦 package.json - 依赖配置</li>
                  <li>⚙️ tsconfig.json - TypeScript配置</li>
                  <li>🔧 vite.config.ts - Vite配置</li>
                  <li>📄 index.html - HTML入口</li>
                  <li>🚀 src/main.tsx - 应用入口</li>
                  <li>🎨 src/App.tsx - 路由配置</li>
                  <li>📑 src/pages/ - 页面组件</li>
                  <li>🌐 src/api/ - API客户端</li>
                  <li>📖 README.md - 使用说明</li>
                </ul>
              </Card>

              <Card size="small" title="使用说明:">
                <Paragraph>
                  下载后解压，在项目目录中执行：
                </Paragraph>
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`pnpm install
pnpm dev`}
                </pre>
                <Paragraph>
                  项目将在 http://localhost:3000 启动
                </Paragraph>
              </Card>
            </Space>
          </Card>
        </TabPane>

        {/* 功能说明 */}
        <TabPane tab="功能说明" key="3">
          <Card>
            <Title level={4}>出码能力</Title>
            <Paragraph>
              将低代码平台中的可视化设计转换为标准代码：
            </Paragraph>
            <ul>
              <li><strong>组件代码生成</strong>：单个组件 → React组件代码</li>
              <li><strong>页面代码生成</strong>：页面布局 → React页面组件</li>
              <li><strong>项目代码生成</strong>：完整应用 → 可运行的项目</li>
            </ul>

            <Title level={4} style={{ marginTop: 24 }}>双向工程（未完全实现）</Title>
            <Paragraph>
              理想情况下支持：
            </Paragraph>
            <ul>
              <li>出码：可视化设计 → 代码</li>
              <li>入码：代码 → 可视化设计</li>
              <li>同步：代码修改 ↔ 可视化更新</li>
            </ul>

            <Title level={4} style={{ marginTop: 24 }}>技术栈</Title>
            <Paragraph>
              生成的项目使用：
            </Paragraph>
            <ul>
              <li>React 18 + TypeScript</li>
              <li>Ant Design 5 UI组件库</li>
              <li>React Router 路由</li>
              <li>Vite 构建工具</li>
              <li>Axios HTTP客户端</li>
            </ul>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default CodegenPage;

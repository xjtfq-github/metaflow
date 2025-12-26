import React, { useState } from 'react';
import { Layout, Card, Row, Col, Typography, Tabs, Input, Button, Space, Tag, Alert } from 'antd';
import { 
  RobotOutlined, 
  DatabaseOutlined, 
  CodeOutlined, 
  LayoutOutlined, 
  BulbOutlined,
  ThunderboltOutlined 
} from '@ant-design/icons';

const { Content } = Layout;
const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

export const CopilotDemoPage: React.FC = () => {
  const [textToQueryInput, setTextToQueryInput] = useState('');
  const [textToQueryResult, setTextToQueryResult] = useState<any>(null);
  const [schemaInput, setSchemaInput] = useState('');
  const [schemaResult, setSchemaResult] = useState<any>(null);
  const [layoutInput, setLayoutInput] = useState('');
  const [layoutResult, setLayoutResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTextToQuery = async () => {
    setLoading(true);
    // TODO: 调用真实API
    setTimeout(() => {
      setTextToQueryResult({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      setLoading(false);
    }, 1000);
  };

  const handleGenerateSchema = async () => {
    setLoading(true);
    // TODO: 调用真实API
    setTimeout(() => {
      setSchemaResult({
        id: 'user-model',
        displayName: '用户模型',
        entityName: 'User',
        fields: [
          { key: 'name', label: '姓名', type: 'string', required: true },
          { key: 'email', label: '邮箱', type: 'string', required: true, unique: true },
          { key: 'phone', label: '手机号', type: 'string', required: false },
        ],
        version: '1.0.0',
      });
      setLoading(false);
    }, 1500);
  };

  const handleGenerateLayout = async () => {
    setLoading(true);
    // TODO: 调用真实API
    setTimeout(() => {
      setLayoutResult({
        id: 'user-list-page',
        name: '用户列表页面',
        layout: {
          type: 'container',
          children: [
            { id: 'search-1', type: 'Input', props: { placeholder: '搜索用户' } },
            { id: 'table-1', type: 'Table', props: { columns: ['姓名', '邮箱', '手机号'] } },
          ],
        },
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <Layout style={{ height: '100%' }}>
      <Content style={{ background: '#f5f5f5', padding: 16, overflow: 'auto' }}>
        <div style={{ background: '#fff', padding: 24, borderRadius: 4, minHeight: '100%' }}>
          {/* 标题 */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <RobotOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <Title level={2}>AI Copilot 智能助手</Title>
            <Paragraph type="secondary">
              利用大语言模型能力，提升低代码平台的开发效率
            </Paragraph>
          </div>

          {/* 功能介绍 */}
          <Row gutter={16} style={{ marginBottom: 32 }}>
            <Col span={6}>
              <Card>
                <DatabaseOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
                <Title level={4}>智能查询</Title>
                <Paragraph type="secondary">自然语言转Prisma查询条件</Paragraph>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <CodeOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
                <Title level={4}>生成Schema</Title>
                <Paragraph type="secondary">AI生成数据模型定义</Paragraph>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <LayoutOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 8 }} />
                <Title level={4}>生成页面</Title>
                <Paragraph type="secondary">AI生成页面布局结构</Paragraph>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <BulbOutlined style={{ fontSize: 32, color: '#fa8c16', marginBottom: 8 }} />
                <Title level={4}>代码补全</Title>
                <Paragraph type="secondary">智能代码建议和错误诊断</Paragraph>
              </Card>
            </Col>
          </Row>

          {/* 功能演示 */}
          <Card>
            <Tabs defaultActiveKey="1">
              {/* Text-to-Query */}
              <TabPane tab={<span><DatabaseOutlined /> 智能查询</span>} key="1">
                <Alert
                  message="功能说明"
                  description="输入自然语言描述，AI将自动转换为Prisma查询条件"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                
                <Space direction="vertical" style={{ width: '100%' }}>
                  <TextArea
                    rows={4}
                    placeholder="例如：查询最近10条状态为active的记录，按创建时间倒序排列"
                    value={textToQueryInput}
                    onChange={(e) => setTextToQueryInput(e.target.value)}
                  />
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={handleTextToQuery}
                    loading={loading}
                  >
                    生成查询条件
                  </Button>

                  {textToQueryResult && (
                    <Card title="生成结果" size="small">
                      <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                        {JSON.stringify(textToQueryResult, null, 2)}
                      </pre>
                      <Button type="primary" size="small" style={{ marginTop: 8 }}>
                        应用到查询
                      </Button>
                    </Card>
                  )}
                </Space>
              </TabPane>

              {/* Generate Schema */}
              <TabPane tab={<span><CodeOutlined /> 生成Schema</span>} key="2">
                <Alert
                  message="功能说明"
                  description="描述你的数据模型需求，AI将生成完整的Schema定义"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                
                <Space direction="vertical" style={{ width: '100%' }}>
                  <TextArea
                    rows={4}
                    placeholder="例如：创建一个用户管理模型，包含姓名、邮箱（唯一）、手机号字段"
                    value={schemaInput}
                    onChange={(e) => setSchemaInput(e.target.value)}
                  />
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={handleGenerateSchema}
                    loading={loading}
                  >
                    生成Schema
                  </Button>

                  {schemaResult && (
                    <Card title="生成结果" size="small">
                      <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                        {JSON.stringify(schemaResult, null, 2)}
                      </pre>
                      <Button type="primary" size="small" style={{ marginTop: 8 }}>
                        添加到模型库
                      </Button>
                    </Card>
                  )}
                </Space>
              </TabPane>

              {/* Generate Layout */}
              <TabPane tab={<span><LayoutOutlined /> 生成页面</span>} key="3">
                <Alert
                  message="功能说明"
                  description="描述你的页面需求，AI将生成页面布局结构"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                
                <Space direction="vertical" style={{ width: '100%' }}>
                  <TextArea
                    rows={4}
                    placeholder="例如：创建一个用户列表页面，包含搜索框和表格"
                    value={layoutInput}
                    onChange={(e) => setLayoutInput(e.target.value)}
                  />
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={handleGenerateLayout}
                    loading={loading}
                  >
                    生成页面布局
                  </Button>

                  {layoutResult && (
                    <Card title="生成结果" size="small">
                      <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                        {JSON.stringify(layoutResult, null, 2)}
                      </pre>
                      <Button type="primary" size="small" style={{ marginTop: 8 }}>
                        在设计器中打开
                      </Button>
                    </Card>
                  )}
                </Space>
              </TabPane>

              {/* Code Completion */}
              <TabPane tab={<span><BulbOutlined /> 代码补全</span>} key="4">
                <Alert
                  message="功能说明"
                  description="在代码编辑器中，AI会自动提供代码补全建议和错误诊断"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                
                <Card>
                  <Title level={5}>使用方式：</Title>
                  <ol>
                    <li>在设计器或代码编辑器中编写代码</li>
                    <li>AI自动检测上下文并提供补全建议</li>
                    <li>遇到错误时，AI提供诊断和修复建议</li>
                  </ol>
                  
                  <Tag color="blue">Ctrl + Space</Tag> 触发代码补全
                  <br />
                  <Tag color="green" style={{ marginTop: 8 }}>Ctrl + .</Tag> 快速修复
                </Card>
              </TabPane>
            </Tabs>
          </Card>

          {/* LLM配置说明 */}
          <Card title="LLM提供商配置" style={{ marginTop: 24 }}>
            <Paragraph>
              系统支持多种LLM提供商，可在环境变量中配置：
            </Paragraph>
            
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small">
                  <Title level={5}>OpenAI</Title>
                  <Paragraph type="secondary" style={{ fontSize: 12 }}>
                    <code>OPENAI_API_KEY</code><br />
                    <code>OPENAI_MODEL=gpt-4-turbo-preview</code>
                  </Paragraph>
                  <Tag color="green">推荐</Tag>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Title level={5}>Claude</Title>
                  <Paragraph type="secondary" style={{ fontSize: 12 }}>
                    <code>ANTHROPIC_API_KEY</code><br />
                    <code>ANTHROPIC_MODEL=claude-3</code>
                  </Paragraph>
                  <Tag color="blue">备选</Tag>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Title level={5}>Ollama (本地)</Title>
                  <Paragraph type="secondary" style={{ fontSize: 12 }}>
                    <code>OLLAMA_BASE_URL=http://localhost:11434</code><br />
                    <code>OLLAMA_MODEL=llama2</code>
                  </Paragraph>
                  <Tag color="purple">免费</Tag>
                </Card>
              </Col>
            </Row>
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

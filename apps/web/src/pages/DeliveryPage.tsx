import React, { useState } from 'react';
import { Card, Tabs, Timeline, Table, Tag, Progress, Button, Descriptions, Alert, Space, Typography, Collapse, List } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, RocketOutlined, FileTextOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

export const DeliveryPage: React.FC = () => {
  const [demoStep, setDemoStep] = useState(0);

  // 模块交付清单
  const deliveryChecklist = [
    {
      phase: '第一阶段：基础架构（Day 01-07）',
      modules: [
        { name: '元数据模型', status: 'completed', features: 'Model/Page/Logic DSL、JSON Schema验证', missing: '动态版本迁移' },
        { name: '数据引擎', status: 'completed', features: '万能路由、CRUD API、分页筛选', missing: '动态DDL生成' },
        { name: 'UI组件体系', status: 'completed', features: 'SchemaForm、20+组件适配器', missing: '移动端组件' },
        { name: '错误处理', status: 'completed', features: '错误码字典、Prisma错误映射', missing: 'AI错误诊断' },
        { name: '测试体系', status: 'completed', features: '单元测试、集成测试、E2E测试', missing: 'CI/CD流水线' },
      ],
    },
    {
      phase: '第二阶段：能力扩展（Day 08-14）',
      modules: [
        { name: '页面构建器', status: 'prototype', features: '组件注册表、运行时渲染器', missing: '拖拽设计器、撤销重做' },
        { name: '逻辑编排', status: 'prototype', features: 'EventBus原型、动作库规划', missing: '可视化逻辑设计器' },
        { name: '工作流引擎', status: 'prototype', features: 'FSM状态机、BPMN DSL', missing: '工作流持久化' },
        { name: '规则引擎', status: 'completed', features: '表达式解析、计算字段', missing: '复杂规则链' },
        { name: '权限模型', status: 'basic', features: 'RBAC字段、租户隔离', missing: 'Policy DSL' },
        { name: '版本管理', status: 'completed', features: 'Draft/Version双态', missing: '发布流水线' },
        { name: 'EAM实战', status: 'completed', features: '设备台账、维保流程', missing: '完整数据落库' },
      ],
    },
    {
      phase: '第三阶段：生产级特性（Day 15-21）',
      modules: [
        { name: '多租户实现', status: 'completed', features: 'AsyncLocalStorage、Prisma中间件、配额限流', missing: 'PostgreSQL RLS' },
        { name: 'AI Copilot', status: 'completed', features: 'Ollama集成、Text-to-Query、Chat UI', missing: 'RAG知识库' },
        { name: 'FaaS扩展', status: 'completed', features: 'isolated-vm沙箱、Webhook系统', missing: '连接器市场' },
        { name: '性能优化', status: 'completed', features: '虚拟列表、两级缓存、GIN索引', missing: '服务端渲染' },
        { name: '观测监控', status: 'completed', features: 'Pino日志、OpenTelemetry、Prometheus', missing: '分布式追踪' },
        { name: '出码能力', status: 'completed', features: '组件生成器、项目导出', missing: '双向工程' },
        { name: '整合交付', status: 'completed', features: '演示剧本、Roadmap', missing: '开源准备' },
      ],
    },
  ];

  // 状态标签映射
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      completed: { color: 'success', text: '✅ 已完成' },
      prototype: { color: 'warning', text: '🟡 原型' },
      basic: { color: 'processing', text: '🟡 基础' },
      planning: { color: 'default', text: '🟡 规划' },
    };
    const config = statusMap[status] || statusMap.planning;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 演示剧本步骤
  const demoScript = [
    {
      title: '1. 登录与概览',
      duration: '2分钟',
      actions: [
        '访问 http://localhost:3000',
        '展示多租户登录界面',
        '查看系统整体导航菜单',
      ],
    },
    {
      title: '2. 数据引擎演示',
      duration: '3分钟',
      actions: [
        '进入数据引擎页面',
        '展示模型列表（HiddenDanger）',
        '演示CRUD操作：创建、查询、更新',
        '展示分页、筛选、排序功能',
      ],
    },
    {
      title: '3. 权限与多租户',
      duration: '3分钟',
      actions: [
        '进入权限管理页面',
        '展示RBAC角色配置',
        '切换不同租户查看数据隔离',
        '演示资源配额限制',
      ],
    },
    {
      title: '4. EAM设备维保',
      duration: '4分钟',
      actions: [
        '进入EAM维保页面',
        '查看资产台账（设备列表、健康度）',
        '创建维保工单',
        '查看巡检计划和库存预警',
      ],
    },
    {
      title: '5. AI Copilot',
      duration: '3分钟',
      actions: [
        '打开AI助手浮动按钮',
        '演示Text-to-Query自然语言查询',
        '使用AI生成数据模型Schema',
        '展示代码补全建议',
      ],
    },
    {
      title: '6. FaaS扩展能力',
      duration: '3分钟',
      actions: [
        '进入FaaS扩展页面',
        '创建自定义脚本（isolated-vm沙箱）',
        '配置Webhook触发器',
        '查看脚本执行日志',
      ],
    },
    {
      title: '7. 性能与监控',
      duration: '3分钟',
      actions: [
        '进入性能监控页面',
        '查看P50/P95/P99耗时统计',
        '进入观测监控页面',
        '展示Prometheus指标、追踪数据',
      ],
    },
    {
      title: '8. 代码生成',
      duration: '3分钟',
      actions: [
        '进入代码生成页面',
        '生成React组件代码',
        '导出完整项目（React+TypeScript+Vite）',
        '展示生成的项目结构',
      ],
    },
  ];

  // 未来路线图
  const roadmap = [
    {
      phase: 'Phase 1: MVP增强（1-3个月）',
      items: [
        '完善拖拽式页面设计器',
        '实现可视化逻辑编排器',
        '补齐工作流持久化和待办中心',
        '添加PostgreSQL RLS支持',
        '补充移动端H5组件',
      ],
    },
    {
      phase: 'Phase 2: 生产就绪（3-6个月）',
      items: [
        '完整CI/CD流水线',
        '服务端渲染（SSR）',
        '分布式追踪（Jaeger）',
        'RAG知识库增强AI能力',
        '连接器市场（HTTP/DB/MQ）',
      ],
    },
    {
      phase: 'Phase 3: 企业版（6-12个月）',
      items: [
        '双向工程（代码↔可视化）',
        '多语言出码（Vue/Angular）',
        '私有化部署方案',
        'SaaS多租户版本',
        '开源社区建设',
      ],
    },
  ];

  // 技术栈统计
  const techStack = {
    frontend: ['React 18', 'TypeScript', 'Vite', 'Zustand', 'Ant Design', 'React Router', 'React Hook Form'],
    backend: ['Node.js', 'NestJS', 'Prisma ORM', 'SQLite', 'Redis', 'BullMQ'],
    devops: ['pnpm Monorepo', 'ESLint', 'Prettier', 'Vitest', 'Playwright', 'Docker'],
    ai: ['Ollama', 'LangChain.js'],
    monitoring: ['Prometheus', 'Grafana', 'OpenTelemetry', 'Pino'],
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>
        <RocketOutlined /> 整合与交付
      </Title>
      <Paragraph>
        21天MetaFlow低代码平台MVP成果总结与未来规划
      </Paragraph>

      <Tabs defaultActiveKey="checklist">
        {/* 交付清单 */}
        <TabPane tab={<span><CheckCircleOutlined /> 交付清单</span>} key="checklist">
          <Alert
            message="MVP交付状态"
            description="完成度：核心模块85%，生产级特性100%"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Collapse accordion defaultActiveKey="0">
            {deliveryChecklist.map((phase, idx) => (
              <Panel header={phase.phase} key={idx}>
                <Table
                  dataSource={phase.modules}
                  columns={[
                    {
                      title: '模块',
                      dataIndex: 'name',
                      key: 'name',
                      width: 150,
                    },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      key: 'status',
                      width: 120,
                      render: (status) => getStatusTag(status),
                    },
                    {
                      title: '已实现功能',
                      dataIndex: 'features',
                      key: 'features',
                    },
                    {
                      title: '缺失项',
                      dataIndex: 'missing',
                      key: 'missing',
                      render: (text) => <Text type="secondary">{text}</Text>,
                    },
                  ]}
                  pagination={false}
                  size="small"
                />
              </Panel>
            ))}
          </Collapse>

          <Card title="整体完成度" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>第一阶段（基础架构）</Text>
                <Progress percent={100} status="success" />
              </div>
              <div>
                <Text>第二阶段（能力扩展）</Text>
                <Progress percent={70} status="active" />
              </div>
              <div>
                <Text>第三阶段（生产级特性）</Text>
                <Progress percent={100} status="success" />
              </div>
            </Space>
          </Card>
        </TabPane>

        {/* 演示剧本 */}
        <TabPane tab={<span><FileTextOutlined /> 演示剧本</span>} key="demo">
          <Alert
            message="Hero Demo演示指南"
            description="总时长：24分钟，适合产品演示和投资人路演"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Timeline mode="left" style={{ marginTop: 24 }}>
            {demoScript.map((step, idx) => (
              <Timeline.Item
                key={idx}
                dot={idx === demoStep ? <ClockCircleOutlined style={{ fontSize: 16 }} /> : undefined}
                color={idx < demoStep ? 'green' : idx === demoStep ? 'blue' : 'gray'}
              >
                <Card
                  size="small"
                  title={step.title}
                  extra={<Tag color="blue">{step.duration}</Tag>}
                  style={{ marginBottom: 16 }}
                >
                  <List
                    dataSource={step.actions}
                    renderItem={(action) => (
                      <List.Item>
                        <Text>• {action}</Text>
                      </List.Item>
                    )}
                  />
                  {idx === demoStep && (
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => setDemoStep(demoStep + 1)}
                      style={{ marginTop: 8 }}
                    >
                      下一步
                    </Button>
                  )}
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>

          {demoStep >= demoScript.length && (
            <Alert
              message="🎉 演示完成！"
              description="您已完整展示了MetaFlow的核心能力"
              type="success"
              showIcon
              action={
                <Button size="small" onClick={() => setDemoStep(0)}>
                  重新开始
                </Button>
              }
            />
          )}
        </TabPane>

        {/* 技术栈 */}
        <TabPane tab="技术栈" key="tech">
          <Descriptions title="技术栈清单" bordered column={1}>
            <Descriptions.Item label="前端">
              <Space wrap>
                {techStack.frontend.map((tech) => (
                  <Tag key={tech} color="blue">{tech}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="后端">
              <Space wrap>
                {techStack.backend.map((tech) => (
                  <Tag key={tech} color="green">{tech}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="开发工具">
              <Space wrap>
                {techStack.devops.map((tech) => (
                  <Tag key={tech} color="orange">{tech}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="AI工具">
              <Space wrap>
                {techStack.ai.map((tech) => (
                  <Tag key={tech} color="purple">{tech}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="监控工具">
              <Space wrap>
                {techStack.monitoring.map((tech) => (
                  <Tag key={tech} color="red">{tech}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </TabPane>

        {/* 未来路线图 */}
        <TabPane tab="未来路线图" key="roadmap">
          <Alert
            message="产品路线图"
            description="从MVP到企业级产品的演进计划"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Timeline mode="alternate" style={{ marginTop: 24 }}>
            {roadmap.map((phase, idx) => (
              <Timeline.Item key={idx} color={idx === 0 ? 'green' : idx === 1 ? 'blue' : 'gray'}>
                <Card title={phase.phase} size="small">
                  <List
                    dataSource={phase.items}
                    renderItem={(item) => (
                      <List.Item>
                        <Text>• {item}</Text>
                      </List.Item>
                    )}
                  />
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>
        </TabPane>

        {/* 快速开始 */}
        <TabPane tab="快速开始" key="quickstart">
          <Card title="本地运行指南">
            <Paragraph>
              <Text strong>1. 克隆仓库</Text>
            </Paragraph>
            <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`git clone https://github.com/your-org/metaflow.git
cd metaflow`}
            </pre>

            <Paragraph style={{ marginTop: 16 }}>
              <Text strong>2. 安装依赖</Text>
            </Paragraph>
            <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`pnpm install`}
            </pre>

            <Paragraph style={{ marginTop: 16 }}>
              <Text strong>3. 初始化数据库</Text>
            </Paragraph>
            <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`cd packages/database
pnpm prisma migrate dev
pnpm prisma db seed`}
            </pre>

            <Paragraph style={{ marginTop: 16 }}>
              <Text strong>4. 启动服务</Text>
            </Paragraph>
            <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`# 启动后端
cd apps/server
pnpm dev

# 启动前端（新终端）
cd apps/web
pnpm dev`}
            </pre>

            <Paragraph style={{ marginTop: 16 }}>
              <Text strong>5. 访问系统</Text>
            </Paragraph>
            <ul>
              <li>前端：<a href="http://localhost:5173" target="_blank">http://localhost:5173</a></li>
              <li>后端API：<a href="http://localhost:3000/api" target="_blank">http://localhost:3000/api</a></li>
              <li>Swagger文档：<a href="http://localhost:3000/api/docs" target="_blank">http://localhost:3000/api/docs</a></li>
            </ul>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default DeliveryPage;

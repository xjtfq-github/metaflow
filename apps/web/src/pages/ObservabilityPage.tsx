import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Card, Table, Tag, Timeline, Row, Col, Statistic, Button, Space } from 'antd';
import {
  AimOutlined,
  LineChartOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

const { Content } = Layout;

interface Trace {
  traceId: string;
  spanId: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes?: Record<string, any>;
}

interface Log {
  level: string;
  msg: string;
  service: string;
  timestamp: string;
  [key: string]: any;
}

export const ObservabilityPage: React.FC = () => {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // TODO: 调用真实API
    setTimeout(() => {
      setTraces([
        {
          traceId: 'trace-001',
          spanId: 'span-001',
          name: 'DataService.findMany',
          startTime: Date.now() - 150,
          endTime: Date.now(),
          attributes: { model: 'App', method: 'GET' },
        },
        {
          traceId: 'trace-002',
          spanId: 'span-002',
          name: 'GET /api/apps',
          startTime: Date.now() - 250,
          endTime: Date.now() - 50,
          attributes: { statusCode: 200 },
        },
      ]);

      setLogs([
        {
          level: 'info',
          msg: 'Server started successfully',
          service: 'metaflow-server',
          timestamp: new Date().toISOString(),
          pid: 12345,
        },
        {
          level: 'debug',
          msg: 'Cache hit for key: apps:list',
          service: 'metaflow-server',
          timestamp: new Date().toISOString(),
        },
        {
          level: 'warn',
          msg: 'Slow query detected',
          service: 'metaflow-server',
          timestamp: new Date().toISOString(),
          duration: 1250,
        },
      ]);

      setHealth({
        status: 'healthy',
        uptime: 3600,
        timestamp: new Date().toISOString(),
        memory: {
          rss: 128 * 1024 * 1024,
          heapTotal: 96 * 1024 * 1024,
          heapUsed: 68 * 1024 * 1024,
        },
      });

      setLoading(false);
    }, 500);
  };

  const traceColumns = [
    {
      title: 'Trace ID',
      dataIndex: 'traceId',
      key: 'traceId',
      width: 150,
      render: (id: string) => <code style={{ fontSize: 11 }}>{id}</code>,
    },
    {
      title: 'Span名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '耗时(ms)',
      key: 'duration',
      width: 120,
      align: 'right' as const,
      render: (_: any, record: Trace) => {
        const duration = record.endTime ? record.endTime - record.startTime : 0;
        return (
          <Tag color={duration < 50 ? 'green' : duration < 200 ? 'orange' : 'red'}>
            {duration.toFixed(2)}
          </Tag>
        );
      },
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 180,
      render: (time: number) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '属性',
      dataIndex: 'attributes',
      key: 'attributes',
      render: (attrs: Record<string, any>) => (
        <Space size="small">
          {attrs && Object.entries(attrs).map(([k, v]) => (
            <Tag key={k}>{`${k}: ${v}`}</Tag>
          ))}
        </Space>
      ),
    },
  ];

  const logColumns = [
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => {
        const colors: any = {
          info: 'blue',
          debug: 'cyan',
          warn: 'orange',
          error: 'red',
        };
        return <Tag color={colors[level]}>{level.toUpperCase()}</Tag>;
      },
    },
    {
      title: '消息',
      dataIndex: 'msg',
      key: 'msg',
    },
    {
      title: '服务',
      dataIndex: 'service',
      key: 'service',
      width: 150,
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
  ];

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Layout style={{ height: '100%' }}>
      <Content style={{ background: '#f5f5f5', padding: 16, overflow: 'auto' }}>
        <div style={{ background: '#fff', padding: 24, borderRadius: 4, minHeight: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2>观测与监控体系</h2>
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
              刷新
            </Button>
          </div>

          <Tabs defaultActiveKey="1">
            {/* 分布式追踪 */}
            <Tabs.TabPane tab={<span><AimOutlined /> 分布式追踪</span>} key="1">
              <Card size="small" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic title="总Trace数" value={traces.length} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="平均耗时(ms)" value={45.6} precision={2} />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="错误率" 
                      value={0.5} 
                      suffix="%" 
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>
                </Row>
              </Card>

              <Table
                dataSource={traces}
                columns={traceColumns}
                rowKey="spanId"
                pagination={{ pageSize: 10 }}
                size="small"
              />

              <Card title="追踪架构" style={{ marginTop: 24 }} size="small">
                <Timeline
                  items={[
                    {
                      children: 'HTTP请求到达 → 自动创建Root Span',
                      color: 'blue',
                    },
                    {
                      children: 'Service方法执行 → 创建Child Span',
                      color: 'green',
                    },
                    {
                      children: '数据库查询 → 记录查询Span',
                      color: 'orange',
                    },
                    {
                      children: '响应返回 → 结束所有Span',
                      color: 'blue',
                    },
                  ]}
                />
              </Card>
            </Tabs.TabPane>

            {/* 结构化日志 */}
            <Tabs.TabPane tab={<span><FileTextOutlined /> 结构化日志</span>} key="2">
              <Card size="small" style={{ marginBottom: 16 }}>
                <Space>
                  <Tag icon={<CheckCircleOutlined />} color="success">Pino</Tag>
                  <Tag color="blue">JSON格式</Tag>
                  <Tag color="purple">ELK Stack集成</Tag>
                </Space>
              </Card>

              <Table
                dataSource={logs}
                columns={logColumns}
                rowKey={(record, index) => `${record.timestamp}-${index}`}
                pagination={{ pageSize: 20 }}
                size="small"
              />

              <Card title="日志特性" style={{ marginTop: 24 }} size="small">
                <ul style={{ marginBottom: 0 }}>
                  <li>📝 <strong>结构化输出</strong>：JSON格式，易于解析和查询</li>
                  <li>🔍 <strong>上下文关联</strong>：traceId/tenantId/userId自动注入</li>
                  <li>⚡ <strong>高性能</strong>：Pino是最快的Node.js日志库</li>
                  <li>🎨 <strong>Pretty格式</strong>：开发环境可读性优化</li>
                </ul>
              </Card>
            </Tabs.TabPane>

            {/* Prometheus指标 */}
            <Tabs.TabPane tab={<span><LineChartOutlined /> Prometheus指标</span>} key="3">
              <Card size="small" style={{ marginBottom: 16 }}>
                <div>
                  <strong>指标端点：</strong> <code>GET /api/metrics/prometheus</code>
                </div>
                <div style={{ marginTop: 8 }}>
                  <strong>抓取配置：</strong>
                </div>
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, marginTop: 8 }}>
{`scrape_configs:
  - job_name: 'metaflow'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics/prometheus'
    scrape_interval: 15s`}
                </pre>
              </Card>

              <Card title="黄金信号(Golden Signals)" size="small" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <h4>🚦 流量 (Traffic)</h4>
                    <div>
                      <code>http_requests_total</code> - 请求总数<br/>
                      <code>http_requests_per_second</code> - QPS
                    </div>

                    <h4 style={{ marginTop: 16 }}>⏱️ 延迟 (Latency)</h4>
                    <div>
                      <code>http_request_duration_p50</code> - P50延迟<br/>
                      <code>http_request_duration_p95</code> - P95延迟<br/>
                      <code>http_request_duration_p99</code> - P99延迟
                    </div>
                  </Col>
                  <Col span={12}>
                    <h4>❌ 错误 (Errors)</h4>
                    <div>
                      <code>http_errors_total</code> - 错误总数<br/>
                      <code>http_error_rate</code> - 错误率
                    </div>

                    <h4 style={{ marginTop: 16 }}>📊 饱和度 (Saturation)</h4>
                    <div>
                      <code>nodejs_heap_used_bytes</code> - 堆内存使用<br/>
                      <code>nodejs_eventloop_lag_seconds</code> - 事件循环延迟
                    </div>
                  </Col>
                </Row>
              </Card>
            </Tabs.TabPane>

            {/* 健康检查 */}
            <Tabs.TabPane tab={<span><CheckCircleOutlined /> 健康检查</span>} key="4">
              {health && (
                <>
                  <Card size="small" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Statistic
                          title="状态"
                          value={health.status}
                          valueStyle={{ color: '#3f8600' }}
                        />
                      </Col>
                      <Col span={6}>
                        <Statistic
                          title="运行时间"
                          value={formatUptime(health.uptime)}
                        />
                      </Col>
                      <Col span={6}>
                        <Statistic
                          title="RSS内存"
                          value={(health.memory.rss / 1024 / 1024).toFixed(0)}
                          suffix="MB"
                        />
                      </Col>
                      <Col span={6}>
                        <Statistic
                          title="堆内存"
                          value={(health.memory.heapUsed / 1024 / 1024).toFixed(0)}
                          suffix="MB"
                        />
                      </Col>
                    </Row>
                  </Card>

                  <Card title="监控集成" size="small">
                    <Row gutter={16}>
                      <Col span={12}>
                        <h4>📊 Grafana仪表盘</h4>
                        <ul>
                          <li>黄金信号监控</li>
                          <li>业务指标可视化</li>
                          <li>告警规则配置</li>
                        </ul>
                      </Col>
                      <Col span={12}>
                        <h4>🔔 告警通知</h4>
                        <ul>
                          <li>错误率 &gt; 5%</li>
                          <li>P95延迟 &gt; 200ms</li>
                          <li>内存使用 &gt; 80%</li>
                        </ul>
                      </Col>
                    </Row>
                  </Card>
                </>
              )}
            </Tabs.TabPane>
          </Tabs>
        </div>
      </Content>
    </Layout>
  );
};

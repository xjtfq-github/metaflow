import React, { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Statistic, Table, Button, Progress, Tag, Space, Tabs } from 'antd';
import {
  ThunderboltOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  ReloadOutlined,
  ClearOutlined,
  LineChartOutlined,
} from '@ant-design/icons';

const { Content } = Layout;

interface PerformanceReport {
  name: string;
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
}

interface CacheStats {
  size: number;
  max: number;
  calculatedSize: number;
}

interface SystemInfo {
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  uptime: number;
  nodeVersion: string;
  platform: string;
}

export const PerformancePage: React.FC = () => {
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    // 每5秒刷新一次
    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    setLoading(true);
    // TODO: 调用真实API
    setTimeout(() => {
      setReports([
        {
          name: 'GET /api/data/App',
          count: 1250,
          avgDuration: 15.6,
          minDuration: 8.2,
          maxDuration: 125.3,
          p50: 12.5,
          p95: 45.2,
          p99: 89.1,
        },
        {
          name: 'POST /api/data/App',
          count: 320,
          avgDuration: 28.4,
          minDuration: 15.1,
          maxDuration: 156.7,
          p50: 25.3,
          p95: 72.8,
          p99: 120.5,
        },
        {
          name: 'DataService.findMany',
          count: 2340,
          avgDuration: 12.3,
          minDuration: 5.2,
          maxDuration: 98.4,
          p50: 10.1,
          p95: 35.6,
          p99: 65.2,
        },
      ]);

      setCacheStats({
        size: 156,
        max: 500,
        calculatedSize: 2048576,
      });

      setSystemInfo({
        memory: {
          rss: 128,
          heapTotal: 96,
          heapUsed: 68,
          external: 12,
        },
        uptime: 3600,
        nodeVersion: 'v18.16.0',
        platform: 'darwin',
      });

      setLoading(false);
    }, 500);
  };

  const handleClearCache = () => {
    console.log('清空缓存');
    // TODO: 调用API
  };

  const handleClearMetrics = () => {
    console.log('清除指标');
    // TODO: 调用API
  };

  const performanceColumns = [
    {
      title: '指标名称',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (text: string) => <code style={{ fontSize: 12 }}>{text}</code>,
    },
    {
      title: '调用次数',
      dataIndex: 'count',
      key: 'count',
      width: 100,
      align: 'right' as const,
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: '平均耗时(ms)',
      dataIndex: 'avgDuration',
      key: 'avgDuration',
      width: 120,
      align: 'right' as const,
      render: (ms: number) => (
        <Tag color={ms < 20 ? 'green' : ms < 50 ? 'orange' : 'red'}>
          {ms.toFixed(2)}
        </Tag>
      ),
    },
    {
      title: '最小(ms)',
      dataIndex: 'minDuration',
      key: 'minDuration',
      width: 100,
      align: 'right' as const,
      render: (ms: number) => ms.toFixed(2),
    },
    {
      title: '最大(ms)',
      dataIndex: 'maxDuration',
      key: 'maxDuration',
      width: 100,
      align: 'right' as const,
      render: (ms: number) => ms.toFixed(2),
    },
    {
      title: 'P50(ms)',
      dataIndex: 'p50',
      key: 'p50',
      width: 100,
      align: 'right' as const,
      render: (ms: number) => ms.toFixed(2),
    },
    {
      title: 'P95(ms)',
      dataIndex: 'p95',
      key: 'p95',
      width: 100,
      align: 'right' as const,
      render: (ms: number) => ms.toFixed(2),
    },
    {
      title: 'P99(ms)',
      dataIndex: 'p99',
      key: 'p99',
      width: 100,
      align: 'right' as const,
      render: (ms: number) => ms.toFixed(2),
    },
  ];

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  };

  return (
    <Layout style={{ height: '100%' }}>
      <Content style={{ background: '#f5f5f5', padding: 16, overflow: 'auto' }}>
        <div style={{ background: '#fff', padding: 24, borderRadius: 4, minHeight: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2>性能监控与优化</h2>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
                刷新
              </Button>
              <Button icon={<ClearOutlined />} onClick={handleClearMetrics}>
                清除指标
              </Button>
            </Space>
          </div>

          <Tabs defaultActiveKey="1">
            {/* 性能指标 */}
            <Tabs.TabPane tab={<span><LineChartOutlined /> 性能指标</span>} key="1">
              <Table
                dataSource={reports}
                columns={performanceColumns}
                rowKey="name"
                pagination={false}
                size="small"
                scroll={{ x: 1000 }}
              />

              <Card title="性能优化建议" style={{ marginTop: 24 }} size="small">
                <ul style={{ marginBottom: 0 }}>
                  <li>
                    <strong>P95 &gt; 50ms</strong>：考虑添加缓存或优化查询
                  </li>
                  <li>
                    <strong>P99 &gt; 100ms</strong>：检查慢查询和数据库索引
                  </li>
                  <li>
                    <strong>平均耗时持续增长</strong>：可能存在内存泄漏或资源未释放
                  </li>
                </ul>
              </Card>
            </Tabs.TabPane>

            {/* 缓存统计 */}
            <Tabs.TabPane tab={<span><DatabaseOutlined /> 缓存统计</span>} key="2">
              {cacheStats && (
                <>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Card>
                        <Statistic
                          title="缓存项数量"
                          value={cacheStats.size}
                          suffix={`/ ${cacheStats.max}`}
                          prefix={<DatabaseOutlined />}
                        />
                        <Progress
                          percent={Math.round((cacheStats.size / cacheStats.max) * 100)}
                          status="active"
                          style={{ marginTop: 16 }}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card>
                        <Statistic
                          title="缓存大小"
                          value={(cacheStats.calculatedSize / 1024 / 1024).toFixed(2)}
                          suffix="MB"
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card>
                        <Statistic
                          title="缓存命中率"
                          value={92.5}
                          suffix="%"
                          valueStyle={{ color: '#3f8600' }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Card title="缓存策略" style={{ marginTop: 24 }} size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Tag color="blue">LRU</Tag> Least Recently Used - 最近最少使用
                      </div>
                      <div>
                        <Tag color="green">TTL</Tag> Time To Live - 默认5分钟过期
                      </div>
                      <div>
                        <Tag color="purple">Max 500</Tag> 最多缓存500项
                      </div>
                      <div style={{ marginTop: 16 }}>
                        <Button danger onClick={handleClearCache}>
                          清空所有缓存
                        </Button>
                      </div>
                    </Space>
                  </Card>
                </>
              )}
            </Tabs.TabPane>

            {/* 系统信息 */}
            <Tabs.TabPane tab={<span><CloudServerOutlined /> 系统信息</span>} key="3">
              {systemInfo && (
                <>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="RSS内存"
                          value={systemInfo.memory.rss}
                          suffix="MB"
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="堆内存总量"
                          value={systemInfo.memory.heapTotal}
                          suffix="MB"
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="堆内存使用"
                          value={systemInfo.memory.heapUsed}
                          suffix="MB"
                        />
                        <Progress
                          percent={Math.round(
                            (systemInfo.memory.heapUsed / systemInfo.memory.heapTotal) * 100
                          )}
                          style={{ marginTop: 16 }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="运行时间"
                          value={formatUptime(systemInfo.uptime)}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Card title="环境信息" style={{ marginTop: 24 }} size="small">
                    <Space direction="vertical">
                      <div>
                        <strong>Node版本:</strong> {systemInfo.nodeVersion}
                      </div>
                      <div>
                        <strong>平台:</strong> {systemInfo.platform}
                      </div>
                    </Space>
                  </Card>
                </>
              )}
            </Tabs.TabPane>

            {/* 优化策略 */}
            <Tabs.TabPane tab={<span><ThunderboltOutlined /> 优化策略</span>} key="4">
              <Card title="已实现的性能优化" size="small" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <h4>✅ 缓存策略</h4>
                    <ul>
                      <li>LRU缓存 - 元数据和查询结果</li>
                      <li>表达式编译缓存</li>
                      <li>自动TTL过期</li>
                    </ul>

                    <h4>✅ 数据库优化</h4>
                    <ul>
                      <li>复合索引 - status + level</li>
                      <li>路径索引 - 部门树查询</li>
                      <li>外键索引 - 关联查询</li>
                    </ul>
                  </Col>
                  <Col span={12}>
                    <h4>✅ 前端优化</h4>
                    <ul>
                      <li>虚拟列表 - 大数据渲染</li>
                      <li>组件懒加载</li>
                      <li>防抖/节流</li>
                    </ul>

                    <h4>✅ 性能监控</h4>
                    <ul>
                      <li>请求耗时统计</li>
                      <li>百分位数分析 (P50/P95/P99)</li>
                      <li>实时性能报告</li>
                    </ul>
                  </Col>
                </Row>
              </Card>

              <Card title="推荐优化方案" size="small">
                <Row gutter={16}>
                  <Col span={12}>
                    <h4>🔧 Redis缓存</h4>
                    <p>升级到Redis分布式缓存，支持集群部署</p>
                    <Tag color="orange">高级特性</Tag>

                    <h4>🔧 数据库连接池</h4>
                    <p>优化连接池配置，提升并发性能</p>
                    <Tag color="orange">推荐</Tag>
                  </Col>
                  <Col span={12}>
                    <h4>🔧 CDN加速</h4>
                    <p>静态资源使用CDN分发</p>
                    <Tag color="blue">生产环境</Tag>

                    <h4>🔧 查询优化</h4>
                    <p>使用EXPLAIN分析慢查询</p>
                    <Tag color="green">最佳实践</Tag>
                  </Col>
                </Row>
              </Card>
            </Tabs.TabPane>
          </Tabs>
        </div>
      </Content>
    </Layout>
  );
};

/**
 * 性能测试脚本
 * 
 * 使用 Node.js 原生 fetch 进行 HTTP 压测
 * 测试目标: CRUD 接口性能
 * 
 * 运行方式:
 * node perf-test.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TENANT_ID = 'tenant-1';
const CONCURRENT_REQUESTS = 50; // 并发数
const TOTAL_REQUESTS = 1000; // 总请求数

// 性能统计
const stats = {
  total: 0,
  success: 0,
  failed: 0,
  times: [],
  errors: [],
};

/**
 * 发送单个请求
 */
async function makeRequest(method, url, body = null) {
  const startTime = Date.now();
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': TENANT_ID,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const duration = Date.now() - startTime;

    stats.total++;
    stats.times.push(duration);

    if (response.ok) {
      stats.success++;
      return { success: true, duration, status: response.status };
    } else {
      stats.failed++;
      const error = await response.text();
      stats.errors.push({ status: response.status, error });
      return { success: false, duration, status: response.status, error };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    stats.total++;
    stats.failed++;
    stats.times.push(duration);
    stats.errors.push({ error: error.message });
    return { success: false, duration, error: error.message };
  }
}

/**
 * 批量执行请求
 */
async function runBatch(requestFn, count, concurrency) {
  const results = [];
  const batches = Math.ceil(count / concurrency);

  console.log(`开始测试: ${count} 个请求, 并发数 ${concurrency}`);

  for (let i = 0; i < batches; i++) {
    const batchSize = Math.min(concurrency, count - i * concurrency);
    const promises = Array.from({ length: batchSize }, () => requestFn());
    
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);

    const progress = ((i + 1) / batches * 100).toFixed(1);
    process.stdout.write(`\r进度: ${progress}% (${stats.success} 成功, ${stats.failed} 失败)`);
  }

  console.log('\n');
  return results;
}

/**
 * 计算统计信息
 */
function calculateStats() {
  if (stats.times.length === 0) return {};

  const sorted = stats.times.sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);

  return {
    total: stats.total,
    success: stats.success,
    failed: stats.failed,
    successRate: ((stats.success / stats.total) * 100).toFixed(2) + '%',
    avgTime: (sum / sorted.length).toFixed(2) + 'ms',
    minTime: sorted[0] + 'ms',
    maxTime: sorted[sorted.length - 1] + 'ms',
    p50: sorted[Math.floor(sorted.length * 0.5)] + 'ms',
    p90: sorted[Math.floor(sorted.length * 0.9)] + 'ms',
    p95: sorted[Math.floor(sorted.length * 0.95)] + 'ms',
    p99: sorted[Math.floor(sorted.length * 0.99)] + 'ms',
  };
}

/**
 * 测试 1: GET 查询性能
 */
async function testGetPerformance() {
  console.log('\n========== 测试 1: GET 查询性能 ==========');
  
  // 重置统计
  Object.assign(stats, { total: 0, success: 0, failed: 0, times: [], errors: [] });

  await runBatch(
    () => makeRequest('GET', `${BASE_URL}/api/data/User?_limit=10`),
    TOTAL_REQUESTS,
    CONCURRENT_REQUESTS,
  );

  const result = calculateStats();
  console.table(result);
  
  return result;
}

/**
 * 测试 2: POST 创建性能
 */
async function testPostPerformance() {
  console.log('\n========== 测试 2: POST 创建性能 ==========');
  
  // 重置统计
  Object.assign(stats, { total: 0, success: 0, failed: 0, times: [], errors: [] });

  let counter = 0;
  await runBatch(
    () => makeRequest('POST', `${BASE_URL}/api/apps`, {
      name: `PerfTest-${Date.now()}-${counter++}`,
      description: 'Performance test app',
    }),
    Math.min(TOTAL_REQUESTS, 100), // 限制创建数量
    CONCURRENT_REQUESTS,
  );

  const result = calculateStats();
  console.table(result);
  
  return result;
}

/**
 * 测试 3: 缓存命中率
 */
async function testCachePerformance() {
  console.log('\n========== 测试 3: 缓存性能 ==========');
  
  // 第一次请求 (冷启动)
  console.log('冷启动请求...');
  Object.assign(stats, { total: 0, success: 0, failed: 0, times: [], errors: [] });
  
  await runBatch(
    () => makeRequest('GET', `${BASE_URL}/api/data/App?_limit=10`),
    100,
    10,
  );

  const coldStart = calculateStats();
  console.log('冷启动结果:');
  console.table(coldStart);

  // 第二次请求 (缓存命中)
  console.log('\n缓存命中请求...');
  Object.assign(stats, { total: 0, success: 0, failed: 0, times: [], errors: [] });
  
  await runBatch(
    () => makeRequest('GET', `${BASE_URL}/api/data/App?_limit=10`),
    100,
    10,
  );

  const cacheHit = calculateStats();
  console.log('缓存命中结果:');
  console.table(cacheHit);

  const improvement = (
    ((parseFloat(coldStart.avgTime) - parseFloat(cacheHit.avgTime)) /
      parseFloat(coldStart.avgTime)) *
    100
  ).toFixed(2);

  console.log(`\n缓存性能提升: ${improvement}%`);
  
  return { coldStart, cacheHit, improvement: improvement + '%' };
}

/**
 * 主函数
 */
async function main() {
  console.log('MetaFlow 性能测试');
  console.log('====================');
  console.log(`API 地址: ${BASE_URL}`);
  console.log(`租户 ID: ${TENANT_ID}`);
  console.log(`总请求数: ${TOTAL_REQUESTS}`);
  console.log(`并发数: ${CONCURRENT_REQUESTS}`);
  console.log('====================\n');

  try {
    // 检查服务可用性
    console.log('检查服务可用性...');
    await makeRequest('GET', `${BASE_URL}/api/cache/stats`);
    console.log('✅ 服务正常\n');

    // 运行测试
    const results = {
      get: await testGetPerformance(),
      post: await testPostPerformance(),
      cache: await testCachePerformance(),
    };

    // 生成报告
    console.log('\n\n========== 性能测试报告 ==========');
    console.log(JSON.stringify(results, null, 2));
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

main();

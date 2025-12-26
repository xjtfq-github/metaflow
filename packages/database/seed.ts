import { PrismaClient } from './src/generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始预置演示数据...');

  // 1. 创建租户
  const tenant = await prisma.tenant.upsert({
    where: { code: 'tenant-001' },
    update: {},
    create: {
      id: 'tenant-001',
      code: 'tenant-001',
      name: '油田演示租户',
    },
  });

  console.log('✅ 租户创建成功:', tenant.name);

  // 2. 创建部门
  const dept1 = await prisma.department.upsert({
    where: { id: 'dept-001' },
    update: {},
    create: {
      id: 'dept-001',
      name: '第一采油厂',
      path: '/dept-001',
      level: 1,
      tenantId: tenant.id,
    },
  });

  const dept2 = await prisma.department.upsert({
    where: { id: 'dept-002' },
    update: {},
    create: {
      id: 'dept-002',
      name: 'HSE安全部',
      path: '/dept-002',
      level: 1,
      tenantId: tenant.id,
    },
  });

  console.log('✅ 部门创建成功:', dept1.name, dept2.name);

  // 3. 创建角色
  const adminRole = await prisma.role.upsert({
    where: { id: 'role-admin' },
    update: {},
    create: {
      id: 'role-admin',
      name: '系统管理员',
      code: 'admin',
      tenantId: tenant.id,
    },
  });

  const operatorRole = await prisma.role.upsert({
    where: { id: 'role-operator' },
    update: {},
    create: {
      id: 'role-operator',
      name: '操作员',
      code: 'operator',
      tenantId: tenant.id,
    },
  });

  console.log('✅ 角色创建成功:', adminRole.name, operatorRole.name);

  // 4. 创建用户
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@oilfield.com' },
    update: {},
    create: {
      email: 'admin@oilfield.com',
      name: '管理员',
      password: 'hashed_password',
      tenantId: tenant.id,
      departmentId: dept2.id,
    },
  });

  const operatorUser = await prisma.user.upsert({
    where: { email: 'operator@oilfield.com' },
    update: {},
    create: {
      email: 'operator@oilfield.com',
      name: '操作员',
      password: 'hashed_password',
      tenantId: tenant.id,
      departmentId: dept1.id,
    },
  });

  console.log('✅ 用户创建成功:', adminUser.name, operatorUser.name);

  // 5. 创建应用
  const app = await prisma.app.upsert({
    where: { id: 'app-001' },
    update: {},
    create: {
      id: 'app-001',
      name: 'HSE隐患排查系统',
      description: '油田隐患排查与整改管理应用',
      icon: '🔍',
      status: 'published',
      createdBy: adminUser.id,
      tenantId: tenant.id,
    },
  });

  console.log('✅ 应用创建成功:', app.name);

  // 6. 创建隐患数据
  const dangers = [
    {
      id: 'danger-001',
      title: '采油树阀门泄漏',
      description: '1号井采油树根部阀门发现轻微泄漏，有天然气溢出',
      location: '第一采油厂-1号井场',
      level: 'major',
      status: 'open',
      reporterId: operatorUser.id,
      tenantId: tenant.id,
    },
    {
      id: 'danger-002',
      title: '消防器材过期',
      description: '2号站灭火器已过检验期，需立即更换',
      location: '第一采油厂-2号站',
      level: 'minor',
      status: 'rectifying',
      reporterId: operatorUser.id,
      tenantId: tenant.id,
    },
    {
      id: 'danger-003',
      title: '高压管线腐蚀',
      description: '输油管线A段发现严重腐蚀，存在爆裂风险',
      location: '第一采油厂-A段管线',
      level: 'critical',
      status: 'closed',
      reporterId: adminUser.id,
      tenantId: tenant.id,
    },
  ];

  for (const danger of dangers) {
    await prisma.hiddenDanger.upsert({
      where: { id: danger.id },
      update: {},
      create: danger,
    });
  }

  console.log(`✅ 隐患数据创建成功: ${dangers.length}条`);

  // 7. 创建EAM资产数据
  const assets = [
    {
      id: 'asset-001',
      assetCode: 'PUMP-001',
      name: '离心泵#1',
      category: '泵类设备',
      status: 'running',
      healthScore: 85,
      location: '第一采油厂-泵房',
      tenantId: tenant.id,
    },
    {
      id: 'asset-002',
      assetCode: 'VALVE-001',
      name: '控制阀#1',
      category: '阀门',
      status: 'maintenance',
      healthScore: 60,
      location: '第一采油厂-1号井场',
      tenantId: tenant.id,
    },
  ];

  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { id: asset.id },
      update: {},
      create: asset,
    });
  }

  console.log(`✅ 资产数据创建成功: ${assets.length}条`);

  // 8. 创建工单数据
  const workOrders = [
    {
      id: 'wo-001',
      orderNo: 'WO-202400001',
      title: '离心泵定期保养',
      description: '执行离心泵季度保养计划',
      type: 'preventive',
      priority: 'medium',
      status: 'assigned',
      assetId: 'asset-001',
      assigneeId: operatorUser.id,
      tenantId: tenant.id,
      scheduledAt: new Date('2024-12-28'),
    },
    {
      id: 'wo-002',
      orderNo: 'WO-202400002',
      title: '控制阀紧急维修',
      description: '阀门卡滞，需紧急维修',
      type: 'emergency',
      priority: 'urgent',
      status: 'in_progress',
      assetId: 'asset-002',
      assigneeId: operatorUser.id,
      tenantId: tenant.id,
      scheduledAt: new Date('2024-12-26'),
    },
  ];

  for (const wo of workOrders) {
    await prisma.workOrder.upsert({
      where: { id: wo.id },
      update: {},
      create: wo,
    });
  }

  console.log(`✅ 工单数据创建成功: ${workOrders.length}条`);

  // 9. 创建巡检计划
  const inspectionPlan = await prisma.inspectionPlan.upsert({
    where: { id: 'plan-001' },
    update: {},
    create: {
      id: 'plan-001',
      name: '泵类设备日常巡检',
      frequency: 'daily',
      status: 'active',
      checkItems: JSON.stringify(['检查运转声音', '检查温度', '检查泄漏']),
      assetId: 'asset-001',
      inspectorId: operatorUser.id,
      tenantId: tenant.id,
    },
  });

  console.log('✅ 巡检计划创建成功:', inspectionPlan.name);

  // 10. 创建库存数据
  const inventory = [
    {
      id: 'inv-001',
      partCode: 'SEAL-001',
      partName: '机械密封',
      quantity: 5,
      minQuantity: 10,
      unit: '个',
      tenantId: tenant.id,
    },
    {
      id: 'inv-002',
      partCode: 'BEAR-001',
      partName: '轴承',
      quantity: 15,
      minQuantity: 5,
      unit: '个',
      tenantId: tenant.id,
    },
  ];

  for (const item of inventory) {
    await prisma.inventoryItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
  }

  console.log(`✅ 库存数据创建成功: ${inventory.length}条`);

  console.log('\n🎉 演示数据预置完成！');
  console.log('\n登录信息:');
  console.log('管理员 - admin@oilfield.com / password');
  console.log('操作员 - operator@oilfield.com / password');
}

main()
  .catch((e) => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from './src/generated/client';

const prisma = new PrismaClient();

async function main() {
  // 创建租户
  const tenant = await prisma.tenant.upsert({
    where: { code: 'tenant-001' },
    update: {},
    create: {
      id: 'tenant-001',
      code: 'tenant-001',
      name: '测试租户',
    },
  });

  console.log('创建租户:', tenant);

  // 创建用户
  const user = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      name: '管理员',
      password: 'hashed_password',
      roles: '["admin"]',
      tenantId: tenant.id,
    },
  });

  console.log('创建用户:', user);

  // 创建应用
  const app = await prisma.app.upsert({
    where: { id: 'app-001' },
    update: {},
    create: {
      id: 'app-001',
      name: '隐患排查系统',
      description: 'HSE隐患排查应用',
      icon: '🔍',
      status: 'draft',
      createdBy: user.id,
      tenantId: tenant.id,
    },
  });

  console.log('创建应用:', app);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

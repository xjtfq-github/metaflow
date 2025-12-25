# MetaFlow 低代码平台

> **MetaFlow**: Data-First, AI-Native, No-Lockin 的企业级低代码平台

## 📋 Day 01 已完成项

本项目当前已完成 **Day 01: 目标与范围界定** 的基础设施搭建:

### ✅ 完成项

- [x] Monorepo 架构 (pnpm workspace)
- [x] 技术选型确认
  - [x] 前端: React 19 + TypeScript + Vite
  - [x] 后端: NestJS 11 + Prisma 7
  - [x] 数据库: SQLite (MVP) / PostgreSQL (生产)
  - [x] 状态管理: Zustand
  - [x] 拖拽库: dnd-kit
  - [x] 组件库: Ant Design 5
  - [x] AI SDK: LangChain.js
- [x] 包结构初始化
  - `@metaflow/database` - Prisma ORM + 多租户中间件
  - `@metaflow/shared-types` - 共享类型定义
  - `@metaflow/client` - 前端渲染器
  - `@metaflow/ui` - UI 组件注册表
  - `@metaflow/logic-engine` - 事件总线与逻辑编排
  - `@metaflow/utils` - 工具函数
  - `@metaflow/validation` - Zod Schema 验证

### 📦 项目结构

```
metaflow/
├── apps/
│   ├── server/          # NestJS 后端服务
│   └── web/             # React 前端应用
├── packages/
│   ├── client/          # 渲染引擎
│   ├── database/        # Prisma + 多租户
│   ├── shared-types/    # 共享类型
│   ├── ui/              # UI 组件注册表
│   ├── logic-engine/    # 事件总线与逻辑
│   ├── utils/           # 工具函数
│   └── validation/      # Schema 验证
└── pnpm-workspace.yaml
```

## 🚀 快速开始

### 环境要求

- Node.js >= 20.0.0
- pnpm >= 10.0.0

### 安装依赖

```bash
# 安装所有依赖 (包括 workspace 内部依赖)
pnpm install
```

### 初始化数据库

```bash
# 进入 database 包
cd packages/database

# 生成 Prisma Client
pnpm generate

# 创建数据库 (SQLite)
npx prisma db push

# (可选) 查看数据库
npx prisma studio
```

### 启动开发环境

```bash
# 启动后端服务 (端口 3000)
cd apps/server
pnpm start:dev

# 启动前端应用 (端口 5173)
cd apps/web
pnpm dev
```

## 📚 学习进度

- [x] Day 01: 目标与范围界定 - **当前位置**
- [ ] Day 02: 总体架构与多租户设计
- [ ] Day 03: 元数据模型与 DSL 设计
- [ ] ...

## 🔗 相关链接

- [项目文档](../book/书稿.md)
- [Day 01 章节](../book/days/day01_目标与范围界定.md)

## 📄 许可证

ISC

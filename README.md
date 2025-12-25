# MetaFlow 低代码平台

> 21天搭建企业级低代码平台：从0到1实战指南

## 项目简介

MetaFlow 是一个企业级低代码平台，支持可视化设计、数据建模、工作流配置、权限管理等功能。

## 核心特性

- **可视化设计器**：拖拽式页面构建器
- **元数据驱动**：基于DSL的动态渲染
- **工作流引擎**：BPMN标准流程编排
- **规则引擎**：表达式计算与依赖图
- **数据引擎**：动态API生成与CRUD

## 技术栈

- **前端**：React 18 + TypeScript + Zustand
- **后端**：NestJS + Prisma + PostgreSQL
- **组件库**：Ant Design
- **拖拽**：@dnd-kit

## 快速开始

```bash
pnpm install
pnpm dev
```

## 项目结构

```
metaflow/
├── apps/           # 应用层
│   ├── server/     # 后端服务
│   └── web/        # 前端应用
└── packages/       # 公共包
    ├── client/     # 客户端组件
    ├── database/   # 数据库访问
    ├── logic-engine/ # 逻辑引擎
    └── shared-types/ # 共享类型
```

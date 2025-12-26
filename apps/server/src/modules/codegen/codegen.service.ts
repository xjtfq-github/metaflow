import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@metaflow/database';
import { componentGenerator } from './component-generator';
import { projectGenerator } from './project-generator';

@Injectable()
export class CodegenService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 生成单个组件代码
   */
  async generateComponentCode(componentDef: any, componentName: string): Promise<string> {
    return componentGenerator.generateComponent(componentDef, componentName);
  }

  /**
   * 生成页面代码
   */
  async generatePageCode(pageId: string): Promise<string> {
    // TODO: 从数据库获取页面定义
    const pageDef = {
      id: pageId,
      name: 'GeneratedPage',
      components: [],
    };

    return projectGenerator['generatePage'](pageDef);
  }

  /**
   * 生成整个应用项目
   */
  async generateProject(appId: string): Promise<Map<string, string>> {
    // 从数据库获取应用信息
    const app = await this.prisma.app.findUnique({
      where: { id: appId },
    });

    if (!app) {
      throw new Error('Application not found');
    }

    // 简化版：使用模拟数据
    const projectConfig = {
      name: app.name,
      version: '1.0.0',
      pages: [
        {
          id: '1',
          name: 'HomePage',
          routes: '/',
          components: [],
        },
      ],
      models: [],
    };

    return projectGenerator.generateProject(projectConfig);
  }

  /**
   * 导出项目为 ZIP
   */
  async exportProjectAsZip(appId: string): Promise<Buffer> {
    const files = await this.generateProject(appId);
    
    // TODO: 使用 archiver 或 jszip 打包
    // 简化版：返回文件列表的 JSON
    const fileList: any = {};
    files.forEach((content, path) => {
      fileList[path] = content;
    });

    return Buffer.from(JSON.stringify(fileList, null, 2));
  }
}

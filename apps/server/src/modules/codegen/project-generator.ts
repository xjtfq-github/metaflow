/**
 * 项目代码生成器
 * 
 * 生成完整的可独立运行的项目代码
 */

import { componentGenerator } from './component-generator';

interface PageDef {
  id: string;
  name: string;
  components: any[];
  routes?: string;
}

interface ProjectConfig {
  name: string;
  version: string;
  pages: PageDef[];
  models?: any[];
}

export class ProjectGenerator {
  /**
   * 生成完整项目
   */
  generateProject(config: ProjectConfig): Map<string, string> {
    const files = new Map<string, string>();
    
    // 生成 package.json
    files.set('package.json', this.generatePackageJson(config));
    
    // 生成 tsconfig.json
    files.set('tsconfig.json', this.generateTsConfig());
    
    // 生成 vite.config.ts
    files.set('vite.config.ts', this.generateViteConfig());
    
    // 生成 index.html
    files.set('index.html', this.generateIndexHtml(config));
    
    // 生成 src/main.tsx
    files.set('src/main.tsx', this.generateMain());
    
    // 生成 src/App.tsx
    files.set('src/App.tsx', this.generateApp(config));
    
    // 生成页面组件
    config.pages.forEach(page => {
      const pagePath = `src/pages/${page.name}.tsx`;
      files.set(pagePath, this.generatePage(page));
    });
    
    // 生成 API 客户端
    if (config.models && config.models.length > 0) {
      files.set('src/api/client.ts', this.generateApiClient(config.models));
    }
    
    // 生成 README
    files.set('README.md', this.generateReadme(config));
    
    return files;
  }

  /**
   * 生成 package.json
   */
  private generatePackageJson(config: ProjectConfig): string {
    return JSON.stringify({
      name: config.name,
      version: config.version,
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
      },
      dependencies: {
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'react-router-dom': '^6.20.0',
        'antd': '^5.12.0',
        'axios': '^1.6.0',
      },
      devDependencies: {
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        '@vitejs/plugin-react': '^4.2.0',
        'typescript': '^5.3.0',
        'vite': '^5.0.0',
      },
    }, null, 2);
  }

  /**
   * 生成 tsconfig.json
   */
  private generateTsConfig(): string {
    return JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
      },
      include: ['src'],
      references: [{ path: './tsconfig.node.json' }],
    }, null, 2);
  }

  /**
   * 生成 vite.config.ts
   */
  private generateViteConfig(): string {
    return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});`;
  }

  /**
   * 生成 index.html
   */
  private generateIndexHtml(config: ProjectConfig): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
  }

  /**
   * 生成 main.tsx
   */
  private generateMain(): string {
    return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'antd/dist/reset.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
  }

  /**
   * 生成 App.tsx
   */
  private generateApp(config: ProjectConfig): string {
    const imports = config.pages
      .map(page => `import ${page.name} from './pages/${page.name}';`)
      .join('\n');
    
    const routes = config.pages
      .map(page => {
        const path = page.routes || `/${page.name.toLowerCase()}`;
        return `        <Route path="${path}" element={<${page.name} />} />`;
      })
      .join('\n');
    
    return `import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
${imports}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
${routes}
        <Route path="/" element={<Navigate to="${config.pages[0]?.routes || `/${config.pages[0]?.name.toLowerCase()}`}" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;`;
  }

  /**
   * 生成页面组件
   */
  private generatePage(page: PageDef): string {
    if (page.components && page.components.length > 0) {
      // 使用组件生成器生成页面
      const rootComponent = {
        id: 'root',
        type: 'div',
        children: page.components,
      };
      return componentGenerator.generateComponent(rootComponent, page.name);
    }
    
    // 默认模板
    return `import React from 'react';
import { Card } from 'antd';

export const ${page.name}: React.FC = () => {
  return (
    <Card title="${page.name}">
      <p>页面内容</p>
    </Card>
  );
};

export default ${page.name};`;
  }

  /**
   * 生成 API 客户端
   */
  private generateApiClient(models: any[]): string {
    const modelNames = models.map(m => m.entityName || m.name);
    
    return `import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
});

// API 方法
${modelNames.map(name => `
export const ${name}Api = {
  list: (params?: any) => client.get('/${name.toLowerCase()}', { params }),
  get: (id: string) => client.get(\`/${name.toLowerCase()}/\${id}\`),
  create: (data: any) => client.post('/${name.toLowerCase()}', data),
  update: (id: string, data: any) => client.put(\`/${name.toLowerCase()}/\${id}\`, data),
  delete: (id: string) => client.delete(\`/${name.toLowerCase()}/\${id}\`),
};`).join('\n')}

export default client;`;
  }

  /**
   * 生成 README
   */
  private generateReadme(config: ProjectConfig): string {
    return `# ${config.name}

由 MetaFlow 低代码平台自动生成

## 快速开始

\`\`\`bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
\`\`\`

## 项目结构

\`\`\`
src/
  ├── pages/          # 页面组件
  ├── api/            # API 客户端
  ├── App.tsx         # 应用入口
  └── main.tsx        # 主文件
\`\`\`

## 技术栈

- React 18
- TypeScript
- Ant Design
- React Router
- Vite

## 生成信息

- 生成时间: ${new Date().toISOString()}
- MetaFlow 版本: 1.0.0
`;
  }
}

export const projectGenerator = new ProjectGenerator();

/**
 * 组件代码生成器
 * 
 * 将 ComponentDefinition 转换为 React 组件代码
 */

interface ComponentDef {
  id: string;
  type: string;
  props?: Record<string, any>;
  children?: ComponentDef[];
  events?: Record<string, string>;
  style?: Record<string, any>;
}

export class ComponentGenerator {
  /**
   * 生成 React 组件代码
   */
  generateComponent(component: ComponentDef, componentName: string): string {
    const imports = this.generateImports(component);
    const componentCode = this.generateComponentBody(component, componentName);
    
    return `${imports}\n\n${componentCode}`;
  }

  /**
   * 生成导入语句
   */
  private generateImports(component: ComponentDef): string {
    const antdComponents = new Set<string>();
    
    this.collectAntdComponents(component, antdComponents);
    
    const imports: string[] = [];
    
    if (antdComponents.size > 0) {
      imports.push(`import { ${Array.from(antdComponents).sort().join(', ')} } from 'antd';`);
    }
    
    imports.push(`import React, { useState } from 'react';`);
    
    return imports.join('\n');
  }

  /**
   * 收集需要的 Ant Design 组件
   */
  private collectAntdComponents(component: ComponentDef, set: Set<string>): void {
    const antdComponents = [
      'Button', 'Input', 'Table', 'Form', 'Select', 'DatePicker',
      'Checkbox', 'Radio', 'Switch', 'Upload', 'Modal', 'Card',
      'Tabs', 'Menu', 'Dropdown', 'Pagination', 'Space'
    ];
    
    if (antdComponents.includes(component.type)) {
      set.add(component.type);
    }
    
    component.children?.forEach(child => this.collectAntdComponents(child, set));
  }

  /**
   * 生成组件主体
   */
  private generateComponentBody(component: ComponentDef, componentName: string): string {
    const stateDeclarations = this.generateStateDeclarations(component);
    const eventHandlers = this.generateEventHandlers(component);
    const jsx = this.generateJSX(component, 0);
    
    return `export const ${componentName}: React.FC = () => {
${stateDeclarations}
${eventHandlers}
  return (
${jsx}
  );
};`;
  }

  /**
   * 生成状态声明
   */
  private generateStateDeclarations(component: ComponentDef): string {
    const states: string[] = [];
    
    // 根据组件类型生成必要的状态
    if (component.type === 'Table') {
      states.push(`  const [data, setData] = useState([]);`);
      states.push(`  const [loading, setLoading] = useState(false);`);
    }
    
    if (component.type === 'Form') {
      states.push(`  const [form] = Form.useForm();`);
    }
    
    if (component.type === 'Modal') {
      states.push(`  const [visible, setVisible] = useState(false);`);
    }
    
    return states.length > 0 ? states.join('\n') + '\n' : '';
  }

  /**
   * 生成事件处理函数
   */
  private generateEventHandlers(component: ComponentDef): string {
    const handlers: string[] = [];
    
    if (component.events) {
      Object.entries(component.events).forEach(([eventName, handlerCode]) => {
        const handlerName = this.getHandlerName(eventName);
        handlers.push(`  const ${handlerName} = () => {\n    ${handlerCode}\n  };\n`);
      });
    }
    
    component.children?.forEach(child => {
      const childHandlers = this.generateEventHandlers(child);
      if (childHandlers) {
        handlers.push(childHandlers);
      }
    });
    
    return handlers.join('\n');
  }

  /**
   * 生成 JSX
   */
  private generateJSX(component: ComponentDef, indent: number): string {
    const indentStr = '  '.repeat(indent + 2);
    const props = this.generateProps(component);
    const style = component.style ? ` style={${JSON.stringify(component.style)}}` : '';
    
    if (!component.children || component.children.length === 0) {
      return `${indentStr}<${component.type}${props}${style} />`;
    }
    
    const childrenJSX = component.children
      .map(child => this.generateJSX(child, indent + 1))
      .join('\n');
    
    return `${indentStr}<${component.type}${props}${style}>
${childrenJSX}
${indentStr}</${component.type}>`;
  }

  /**
   * 生成属性字符串
   */
  private generateProps(component: ComponentDef): string {
    const props: string[] = [];
    
    if (component.props) {
      Object.entries(component.props).forEach(([key, value]) => {
        if (typeof value === 'string') {
          props.push(`${key}="${value}"`);
        } else if (typeof value === 'boolean') {
          props.push(value ? key : `${key}={false}`);
        } else {
          props.push(`${key}={${JSON.stringify(value)}}`);
        }
      });
    }
    
    if (component.events) {
      Object.keys(component.events).forEach(eventName => {
        const handlerName = this.getHandlerName(eventName);
        props.push(`${eventName}={${handlerName}}`);
      });
    }
    
    return props.length > 0 ? ' ' + props.join(' ') : '';
  }

  /**
   * 获取事件处理函数名
   */
  private getHandlerName(eventName: string): string {
    return `handle${eventName.substring(2)}`; // onClick -> handleClick
  }
}

export const componentGenerator = new ComponentGenerator();

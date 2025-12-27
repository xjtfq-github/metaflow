/**
 * 设计器主布局
 * 
 * 三栏结构: 物料区 | 画布区 | 属性区
 */

import React from 'react';
import { Layout } from 'antd';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDesignerStore } from '../../store/designer';
import type { ComponentDefinition } from '@metaflow/shared-types';
import { MaterialPanel } from './MaterialPanel';
import { Canvas } from './Canvas';
import { SettingsPanel } from './SettingsPanel';
import { Toolbar } from './Toolbar';

const { Header, Content, Sider } = Layout;

export const Designer: React.FC<{ appId?: string | null }> = ({ appId }) => {
  const { addComponent, loadApp } = useDesignerStore();
  
  // 加载应用配置
  React.useEffect(() => {
    if (appId) {
      loadApp(appId);
    }
  }, [appId, loadApp]);
  
  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  /**
   * 处理拖拽结束
   */
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over) return;

    // 从物料区拖拽到画布
    if (active.data.current?.type === 'material') {
      const componentType = active.data.current.componentType;
      const targetId = over.id;

      // 生成新组件
      const newComponent: ComponentDefinition = {
        id: `${componentType}-${Date.now()}`,
        type: componentType,
        props: getDefaultProps(componentType),
        style: {},
      };

      addComponent(targetId, newComponent);
    }
  };
  
  /**
   * 获取组件默认属性
   */
  const getDefaultProps = (type: string): Record<string, any> => {
    const defaults: Record<string, any> = {
      Input: { placeholder: '请输入...' },
      Button: { text: '按钮' },
      Text: { content: '文本内容' },
      Container: {},
      Grid: { columns: 2, gap: 16 },
      Select: { 
        placeholder: '请选择',
        options: [
          { label: '选项1', value: '1' },
          { label: '选项2', value: '2' },
        ]
      },
      DatePicker: { placeholder: '选择日期' },
      Table: {
        columns: [
          { title: '姓名', dataIndex: 'name' },
          { title: '年龄', dataIndex: 'age' },
        ],
        dataSource: [
          { name: '张三', age: 28 },
          { name: '李四', age: 32 },
        ]
      },
      Image: { src: 'https://via.placeholder.com/150', alt: '图片' },
    };
    return defaults[type] || {};
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <Layout style={{ height: '100%' }}>
        {/* 顶部工具栏 */}
        <Header style={{ background: '#fff', padding: '0 16px', borderBottom: '1px solid #f0f0f0' }}>
          <Toolbar />
        </Header>

        <Layout>
          {/* 左侧物料区 */}
          <Sider
            width={280}
            style={{
              background: '#fff',
              borderRight: '1px solid #f0f0f0',
              overflow: 'auto',
            }}
          >
            <MaterialPanel />
          </Sider>

          {/* 中间画布区 */}
          <Content
            style={{
              background: '#f5f5f5',
              padding: 16,
              overflow: 'auto',
            }}
          >
            <Canvas />
          </Content>

          {/* 右侧属性区 */}
          <Sider
            width={320}
            style={{
              background: '#fff',
              borderLeft: '1px solid #f0f0f0',
              overflow: 'auto',
            }}
          >
            <SettingsPanel />
          </Sider>
        </Layout>
      </Layout>
    </DndContext>
  );
};

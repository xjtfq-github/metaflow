/**
 * 画布区
 * 
 * 支持拖拽放置、组件选中、嵌套容器
 */

import React, { useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useDesignerStore } from '../../store/designer';
import { registry } from '@metaflow/client/src/registry';
import { Container } from '@metaflow/client/src/components/Container';
import { Grid } from '@metaflow/client/src/components/Grid';
import { Text } from '@metaflow/client/src/components/Text';
import { Table } from '@metaflow/client/src/components/Table';
import { Button } from '@metaflow/client/src/components/Button';
import { Input } from '@metaflow/client/src/components/Input';
import { Select } from '@metaflow/client/src/components/Select';
import { DatePicker } from '@metaflow/client/src/components/DatePicker';
import type { ComponentDefinition } from '@metaflow/shared-types';

// 注册核心组件
registry.register('Container', Container);
registry.register('Grid', Grid);
registry.register('Text', Text);
registry.register('Table', Table);
registry.register('Button', Button);
registry.register('Input', Input);
registry.register('Select', Select);
registry.register('DatePicker', DatePicker);

/**
 * 画布尺寸配置
 */
const CANVAS_SIZES = {
  desktop: { width: '100%', maxWidth: 1200 },
  tablet: { width: 768, maxWidth: 768 },
  mobile: { width: 375, maxWidth: 375 },
};

export const Canvas: React.FC = () => {
  const { dsl, selectedId, isPreview, canvasMode, setDSL, selectComponent } = useDesignerStore();

  // 初始化默认 DSL
  useEffect(() => {
    if (!dsl) {
      setDSL({
        id: 'root',
        type: 'Container',
        props: {},
        style: {
          minHeight: 600,
          padding: 24,
          backgroundColor: '#fff',
        },
        children: [],
      });
    }
  }, [dsl, setDSL]);

  if (!dsl) return null;

  const canvasSize = CANVAS_SIZES[canvasMode];

  return (
    <div
      style={{
        width: canvasSize.width,
        maxWidth: canvasSize.maxWidth,
        margin: '0 auto',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        minHeight: 600,
        position: 'relative',
      }}
    >
      {isPreview ? (
        // 预览模式: 纯渲染
        <EditableCanvas component={dsl} selectedId={null} onSelect={() => {}} />
      ) : (
        // 编辑模式: 可选中
        <EditableCanvas component={dsl} selectedId={selectedId} onSelect={selectComponent} />
      )}
    </div>
  );
};

/**
 * 可编辑画布 (递归渲染组件树)
 */
const EditableCanvas: React.FC<{
  component: ComponentDefinition;
  selectedId: string | null;
  onSelect: (id: string) => void;
}> = ({ component, selectedId, onSelect }) => {
  const isSelected = component.id === selectedId;
  
  // 设置为可放置区域
  const { setNodeRef, isOver } = useDroppable({
    id: component.id,
  });
  
  // 获取组件实例
  const Component = registry.get(component.type);
  
  if (!Component) {
    return <div style={{ color: 'red' }}>Unknown: {component.type}</div>;
  }
  
  // 递归渲染子组件，使它们也可编辑
  const children = component.children?.map((child) => (
    <EditableCanvas key={child.id} component={child} selectedId={selectedId} onSelect={onSelect} />
  ));

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(component.id);
      }}
      style={{
        position: 'relative',
        outline: isSelected ? '2px solid #1890ff' : isOver ? '2px dashed #52c41a' : 'none',
        cursor: 'pointer',
        minHeight: component.type === 'Container' ? 100 : undefined,
        transition: 'outline 0.2s',
      }}
    >
      {/* 渲染当前组件 */}
      <Component element={component} {...component.props}>
        {children}
      </Component>

      {/* 选中标识 */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: -20,
            left: 0,
            fontSize: 12,
            color: '#fff',
            background: '#1890ff',
            padding: '2px 8px',
            borderRadius: 2,
            zIndex: 10,
          }}
        >
          {component.type}
        </div>
      )}
      
      {/* 拖放提示 */}
      {isOver && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 14,
            color: '#52c41a',
            background: 'rgba(82, 196, 26, 0.1)',
            padding: '8px 16px',
            borderRadius: 4,
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >
          放置到此处
        </div>
      )}
    </div>
  );
};

/**
 * 物料面板
 * 
 * 展示可拖拽的组件列表
 */

import React, { useState } from 'react';
import { Input, Collapse, Card } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useDraggable } from '@dnd-kit/core';
import type { ComponentDefinition } from '@metaflow/shared-types';

/**
 * 组件物料定义
 */
const MATERIALS = {
  layout: [
    { type: 'Container', label: '容器', icon: '📦' },
    { type: 'Grid', label: '栅格', icon: '⊞' },
  ],
  form: [
    { type: 'Input', label: '输入框', icon: '📝' },
    { type: 'Select', label: '下拉选择', icon: '🔽' },
    { type: 'DatePicker', label: '日期选择', icon: '📅' },
    { type: 'Button', label: '按钮', icon: '🔘' },
  ],
  display: [
    { type: 'Text', label: '文本', icon: '📄' },
    { type: 'Image', label: '图片', icon: '🖼️' },
    { type: 'Table', label: '表格', icon: '📊' },
  ],
};

/**
 * 可拖拽的物料项
 */
const DraggableMaterial: React.FC<{
  type: string;
  label: string;
  icon: string;
}> = ({ type, label, icon }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `material-${type}`,
    data: {
      type: 'material',
      componentType: type,
    },
  });

  return (
    <Card
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      size="small"
      hoverable
      style={{
        marginBottom: 8,
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span>{label}</span>
      </div>
    </Card>
  );
};

export const MaterialPanel: React.FC = () => {
  const [searchText, setSearchText] = useState('');

  // 过滤物料
  const filterMaterials = (materials: typeof MATERIALS.layout) => {
    if (!searchText) return materials;
    return materials.filter((m) =>
      m.label.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 16 }}>组件库</h3>

      {/* 搜索框 */}
      <Input
        placeholder="搜索组件..."
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16 }}
      />

      {/* 分类折叠面板 */}
      <Collapse 
        defaultActiveKey={['layout', 'form', 'display']} 
        ghost
        items={[
          {
            key: 'layout',
            label: '布局组件',
            children: filterMaterials(MATERIALS.layout).map((material) => (
              <DraggableMaterial key={material.type} {...material} />
            )),
          },
          {
            key: 'form',
            label: '表单组件',
            children: filterMaterials(MATERIALS.form).map((material) => (
              <DraggableMaterial key={material.type} {...material} />
            )),
          },
          {
            key: 'display',
            label: '展示组件',
            children: filterMaterials(MATERIALS.display).map((material) => (
              <DraggableMaterial key={material.type} {...material} />
            )),
          },
        ]}
      />
    </div>
  );
};

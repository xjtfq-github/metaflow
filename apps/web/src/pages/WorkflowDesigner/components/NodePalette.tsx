import React from 'react';
import { Card } from 'antd';

const nodeTemplates = [
  { type: 'start', label: '开始', icon: '▶️', color: '#52c41a' },
  { type: 'end', label: '结束', icon: '⏹️', color: '#ff4d4f' },
  { type: 'userTask', label: '用户任务', icon: '👤', color: '#1890ff' },
  { type: 'serviceTask', label: '服务任务', icon: '⚙️', color: '#722ed1' },
  { type: 'gateway', label: '网关', icon: '◆', color: '#fa8c16' },
];

export const NodePalette: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      style={{
        width: 200,
        padding: 16,
        background: '#f5f5f5',
        borderRight: '1px solid #d9d9d9',
        overflowY: 'auto',
      }}
    >
      <h3 style={{ marginBottom: 16 }}>节点类型</h3>
      
      {nodeTemplates.map((template) => (
        <Card
          key={template.type}
          size="small"
          style={{
            marginBottom: 12,
            cursor: 'grab',
            borderLeft: `3px solid ${template.color}`,
          }}
          draggable
          onDragStart={(e) => onDragStart(e, template.type)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>{template.icon}</span>
            <span>{template.label}</span>
          </div>
        </Card>
      ))}
    </div>
  );
};

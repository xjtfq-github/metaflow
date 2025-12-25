/**
 * 自动任务节点
 */

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ThunderboltOutlined } from '@ant-design/icons';

export const ServiceTaskNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div
      style={{
        padding: '16px 24px',
        borderRadius: 8,
        background: '#fff',
        border: selected ? '2px solid #1890ff' : '2px solid #722ed1',
        minWidth: 160,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ThunderboltOutlined style={{ fontSize: 18, color: '#722ed1' }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{data.label || '自动任务'}</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>系统自动执行</div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </div>
  );
};

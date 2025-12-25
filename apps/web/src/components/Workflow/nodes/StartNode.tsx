/**
 * 开始节点
 */

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { PlayCircleOutlined } from '@ant-design/icons';

export const StartNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div
      style={{
        padding: '12px 20px',
        borderRadius: '50%',
        background: '#52c41a',
        color: '#fff',
        border: selected ? '2px solid #1890ff' : '2px solid #52c41a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
        minHeight: 80,
        cursor: 'pointer',
      }}
    >
      <PlayCircleOutlined style={{ fontSize: 24 }} />
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </div>
  );
};

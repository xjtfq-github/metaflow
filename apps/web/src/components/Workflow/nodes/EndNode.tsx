/**
 * 结束节点
 */

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { CheckCircleOutlined } from '@ant-design/icons';

export const EndNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div
      style={{
        padding: '12px 20px',
        borderRadius: '50%',
        background: '#f5222d',
        color: '#fff',
        border: selected ? '2px solid #1890ff' : '2px solid #f5222d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
        minHeight: 80,
        cursor: 'pointer',
      }}
    >
      <CheckCircleOutlined style={{ fontSize: 24 }} />
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
    </div>
  );
};

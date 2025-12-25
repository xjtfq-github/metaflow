/**
 * 网关节点 (条件分支)
 */

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BranchesOutlined } from '@ant-design/icons';

export const GatewayNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 4,
        background: '#faad14',
        color: '#fff',
        border: selected ? '2px solid #1890ff' : '2px solid #faad14',
        transform: 'rotate(45deg)',
        minWidth: 80,
        minHeight: 80,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555', transform: 'rotate(-45deg)' }}
      />
      
      <div style={{ transform: 'rotate(-45deg)' }}>
        <BranchesOutlined style={{ fontSize: 24 }} />
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555', transform: 'rotate(-45deg)' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555', transform: 'rotate(-45deg)' }}
      />
    </div>
  );
};

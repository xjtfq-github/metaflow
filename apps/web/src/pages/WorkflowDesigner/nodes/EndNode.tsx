import React from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

export const EndNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        border: '3px solid #ff4d4f',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
      }}
    >
      <Handle type="target" position={Position.Top} />
      <span>⏹️</span>
    </div>
  );
};

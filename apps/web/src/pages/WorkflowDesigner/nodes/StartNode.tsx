import React from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

export const StartNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        border: '3px solid #52c41a',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
      }}
    >
      <span>▶️</span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

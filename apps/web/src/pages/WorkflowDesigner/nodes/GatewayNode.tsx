import React from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

export const GatewayNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div style={{ position: 'relative' }}>
      <Handle type="target" position={Position.Top} style={{ top: -10 }} />
      
      <div
        style={{
          width: 60,
          height: 60,
          transform: 'rotate(45deg)',
          border: '3px solid #fa8c16',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ transform: 'rotate(-45deg)', fontSize: 20 }}>X</span>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ bottom: -10 }} />
      <Handle type="source" position={Position.Left} id="left" style={{ left: -10, top: '50%' }} />
      <Handle type="source" position={Position.Right} id="right" style={{ right: -10, top: '50%' }} />
    </div>
  );
};

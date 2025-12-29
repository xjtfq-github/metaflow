import React from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Card } from 'antd';
import { ApiOutlined } from '@ant-design/icons';

export const ServiceTaskNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <Card
      size="small"
      styles={{
        body: { padding: 12 },
      }}
      style={{
        minWidth: 150,
        border: '2px solid #722ed1',
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ApiOutlined style={{ fontSize: 16, color: '#722ed1' }} />
        <span>{data.label || '服务任务'}</span>
      </div>

      {data.config?.action && (
        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
          {data.config.action}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
};

import React from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Card } from 'antd';
import { UserOutlined } from '@ant-design/icons';

export const UserTaskNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <Card
      size="small"
      styles={{
        body: { padding: 12 },
      }}
      style={{
        minWidth: 150,
        border: '2px solid #1890ff',
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <UserOutlined style={{ fontSize: 16, color: '#1890ff' }} />
        <span>{data.label || '用户任务'}</span>
      </div>

      {data.config?.assignee && (
        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
          {data.config.assignee}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
};

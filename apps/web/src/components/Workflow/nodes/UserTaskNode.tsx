/**
 * 人工任务节点
 */

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { UserOutlined } from '@ant-design/icons';

export const UserTaskNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <div
      style={{
        padding: '16px 24px',
        borderRadius: 8,
        background: '#fff',
        border: selected ? '2px solid #1890ff' : '2px solid #d9d9d9',
        minWidth: 160,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <UserOutlined style={{ fontSize: 18, color: '#1890ff' }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{data.label || '人工任务'}</div>
          {data.assignee && (
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              审批人: {data.assignee}
            </div>
          )}
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </div>
  );
};

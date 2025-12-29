import React from 'react';
import { type EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

export const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      
      {/* 显示连线标签 */}
      {(data?.label || data?.condition) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: '#fff',
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid #d9d9d9',
              fontSize: 12,
              pointerEvents: 'all',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {data.label || (data.condition && `条件: ${data.condition}`)}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

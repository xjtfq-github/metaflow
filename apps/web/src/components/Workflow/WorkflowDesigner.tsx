/**
 * 工作流设计器 (ReactFlow 集成)
 * 
 * 核心功能:
 * - 自定义节点 (StartEvent/UserTask/Gateway/EndEvent)
 * - 连线与条件配置
 * - 属性面板同步
 */

import React, { useCallback, useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, addEdge, Connection, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '../../store/workflow';
import { StartNode } from './nodes/StartNode';
import { EndNode } from './nodes/EndNode';
import { UserTaskNode } from './nodes/UserTaskNode';
import { ServiceTaskNode } from './nodes/ServiceTaskNode';
import { GatewayNode } from './nodes/GatewayNode';

/**
 * 注册自定义节点类型
 */
const nodeTypes = {
  StartEvent: StartNode,
  EndEvent: EndNode,
  UserTask: UserTaskNode,
  ServiceTask: ServiceTaskNode,
  Gateway: GatewayNode,
};

export const WorkflowDesigner: React.FC = () => {
  const { workflow, addEdge: addWorkflowEdge, selectNode } = useWorkflowStore();

  // ReactFlow 节点/边状态
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 连线回调
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        id: `edge-${Date.now()}`,
        source: params.source!,
        target: params.target!,
      };
      setEdges((eds) => addEdge(params, eds));
      addWorkflowEdge(newEdge);
    },
    [addWorkflowEdge, setEdges]
  );

  // 节点点击
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

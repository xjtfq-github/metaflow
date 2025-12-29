import { type Node, type Edge } from 'reactflow';
import type { WorkflowDSL, WorkflowNode, WorkflowEdge } from '@metaflow/shared-types';

export function convertToDSL(
  nodes: Node[],
  edges: Edge[],
  workflowName: string = 'New Workflow'
): WorkflowDSL {
  const workflowNodes: WorkflowNode[] = nodes.map((node) => {
    // 映射节点类型
    let nodeType: WorkflowNode['type'];
    switch (node.type) {
      case 'start':
        nodeType = 'StartEvent';
        break;
      case 'end':
        nodeType = 'EndEvent';
        break;
      case 'userTask':
        nodeType = 'UserTask';
        break;
      case 'serviceTask':
        nodeType = 'ServiceTask';
        break;
      case 'gateway':
        nodeType = 'Gateway';
        break;
      default:
        nodeType = 'UserTask';
    }

    return {
      id: node.id,
      type: nodeType,
      name: node.data.label || node.type,
      props: {
        ...node.data.config,
        position: node.position, // 保存节点位置
      },
    };
  });

  const workflowEdges: WorkflowEdge[] = edges.map((edge) => ({
    id: edge.id || `${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    condition: edge.data?.condition,
    label: edge.data?.label || edge.label, // 使用 label 字段
  }));

  return {
    id: `workflow-${Date.now()}`,
    name: workflowName,
    version: '1.0.0',
    nodes: workflowNodes,
    edges: workflowEdges,
  };
}

export function convertFromDSL(dsl: WorkflowDSL): {
  nodes: Node[];
  edges: Edge[];
} {
  // 防御性检查：确保 nodes 和 edges 存在
  if (!dsl.nodes || !Array.isArray(dsl.nodes)) {
    console.warn('Invalid DSL: nodes is missing or not an array', dsl);
    return { nodes: [], edges: [] };
  }

  const nodes: Node[] = dsl.nodes.map((node, index) => {
    // 映射节点类型
    let nodeType: string;
    switch (node.type) {
      case 'StartEvent':
        nodeType = 'start';
        break;
      case 'EndEvent':
        nodeType = 'end';
        break;
      case 'UserTask':
        nodeType = 'userTask';
        break;
      case 'ServiceTask':
        nodeType = 'serviceTask';
        break;
      case 'Gateway':
        nodeType = 'gateway';
        break;
      default:
        nodeType = 'userTask';
    }

    // 从 props 中读取保存的位置，如果没有则使用默认布局
    const position = node.props?.position || {
      x: 100 + (index % 3) * 250,
      y: 100 + Math.floor(index / 3) * 150
    };

    // 从 props 中移除 position 字段，其余作为 config
    const { position: _, ...config } = node.props || {};

    return {
      id: node.id,
      type: nodeType,
      position,
      data: {
        label: node.name || node.type,
        config,
      },
    };
  });

  // 防御性检查：确保 edges 存在
  const edges: Edge[] = (dsl.edges && Array.isArray(dsl.edges)) 
    ? dsl.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label, // 使用 label 字段
        data: {
          condition: edge.condition,
          label: edge.label,
        },
      }))
    : [];

  return { nodes, edges };
}

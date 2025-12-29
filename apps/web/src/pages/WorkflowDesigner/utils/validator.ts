import type { Node, Edge } from 'reactflow';

export interface ValidationError {
  nodeId?: string;
  edgeId?: string;
  message: string;
  level: 'error' | 'warning';
}

/**
 * 验证工作流合法性
 */
export function validateWorkflow(nodes: Node[], edges: Edge[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. 检查是否有开始节点
  const startNodes = nodes.filter((n) => n.type === 'start');
  if (startNodes.length === 0) {
    errors.push({
      message: '缺少开始节点',
      level: 'error',
    });
  } else if (startNodes.length > 1) {
    errors.push({
      message: '只能有一个开始节点',
      level: 'error',
    });
  }

  // 2. 检查是否有结束节点
  const endNodes = nodes.filter((n) => n.type === 'end');
  if (endNodes.length === 0) {
    errors.push({
      message: '至少需要一个结束节点',
      level: 'error',
    });
  }

  // 3. 检查节点可达性
  if (startNodes.length === 1) {
    const reachableNodeIds = findReachableNodes(startNodes[0].id, nodes, edges);
    nodes.forEach((node) => {
      if (!reachableNodeIds.has(node.id)) {
        errors.push({
          nodeId: node.id,
          message: `节点 "${node.data.label || node.id}" 不可达`,
          level: 'warning',
        });
      }
    });
  }

  // 4. 检查 UserTask 必填配置
  nodes.forEach((node) => {
    if (node.type === 'userTask') {
      if (!node.data.config?.assignee) {
        errors.push({
          nodeId: node.id,
          message: `用户任务 "${node.data.label}" 未配置审批人`,
          level: 'error',
        });
      }
    }
  });

  // 5. 检查 Gateway 配置
  nodes.forEach((node) => {
    if (node.type === 'gateway') {
      const outgoingEdges = edges.filter((e) => e.source === node.id);
      
      if (outgoingEdges.length === 0) {
        errors.push({
          nodeId: node.id,
          message: `网关 "${node.data.label}" 没有出边`,
          level: 'error',
        });
      } else {
        const hasCondition = outgoingEdges.some((e) => e.data?.condition);
        const hasDefault = node.data.config?.defaultEdge;
        
        if (!hasCondition && !hasDefault) {
          errors.push({
            nodeId: node.id,
            message: `网关 "${node.data.label}" 必须配置条件或默认分支`,
            level: 'error',
          });
        }
      }
    }
  });

  // 6. 检查孤立边
  edges.forEach((edge) => {
    const sourceExists = nodes.some((n) => n.id === edge.source);
    const targetExists = nodes.some((n) => n.id === edge.target);
    
    if (!sourceExists || !targetExists) {
      errors.push({
        edgeId: edge.id,
        message: `连线 "${edge.id}" 的源节点或目标节点不存在`,
        level: 'error',
      });
    }
  });

  return errors;
}

/**
 * 查找从 startNodeId 可达的所有节点
 */
function findReachableNodes(
  startNodeId: string,
  nodes: Node[],
  edges: Edge[]
): Set<string> {
  const reachable = new Set<string>();
  const queue = [startNodeId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (reachable.has(currentId)) continue;

    reachable.add(currentId);

    // 找到所有出边
    const outgoingEdges = edges.filter((e) => e.source === currentId);
    outgoingEdges.forEach((edge) => {
      if (!reachable.has(edge.target)) {
        queue.push(edge.target);
      }
    });
  }

  return reachable;
}

/**
 * 验证连线合法性
 */
export function validateConnection(
  sourceNodeId: string,
  targetNodeId: string,
  nodes: Node[],
  edges: Edge[]
): { valid: boolean; message?: string } {
  const sourceNode = nodes.find((n) => n.id === sourceNodeId);
  const targetNode = nodes.find((n) => n.id === targetNodeId);

  if (!sourceNode || !targetNode) {
    return { valid: false, message: '源节点或目标节点不存在' };
  }

  // 开始节点只能有一条出边
  if (sourceNode.type === 'start') {
    const existingEdges = edges.filter((e) => e.source === sourceNodeId);
    if (existingEdges.length > 0) {
      return { valid: false, message: '开始节点只能有一条出边' };
    }
  }

  // 结束节点不能有出边
  if (sourceNode.type === 'end') {
    return { valid: false, message: '结束节点不能有出边' };
  }

  // 不能自连
  if (sourceNodeId === targetNodeId) {
    return { valid: false, message: '不能连接到自身' };
  }

  // 检查是否已存在相同连线
  const duplicateEdge = edges.find(
    (e) => e.source === sourceNodeId && e.target === targetNodeId
  );
  if (duplicateEdge) {
    return { valid: false, message: '已存在相同的连线' };
  }

  return { valid: true };
}

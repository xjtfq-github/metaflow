import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';

/**
 * 自动布局算法 - 使用 dagre 布局
 */
export function autoLayout(nodes: Node[], edges: Edge[]): Node[] {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: 'TB',  // Top to Bottom
    nodesep: 80,    // 节点间距
    ranksep: 100,   // 层级间距
  });

  // 添加节点
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: 180,  // 节点宽度
      height: 80   // 节点高度
    });
  });

  // 添加边
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // 计算布局
  dagre.layout(dagreGraph);

  // 更新节点位置
  return nodes.map((node) => {
    const position = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: position.x - 90,  // 居中对齐（width / 2）
        y: position.y - 40,  // 居中对齐（height / 2）
      },
    };
  });
}

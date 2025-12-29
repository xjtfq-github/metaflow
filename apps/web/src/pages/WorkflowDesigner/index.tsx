import React, { useCallback, useState, useEffect } from 'react';
import { Button, Space, message, Modal, Input, Spin, Alert, List } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, ZoomInOutlined, ZoomOutOutlined, DeleteOutlined, FullscreenOutlined, BlockOutlined, UndoOutlined, RedoOutlined } from '@ant-design/icons';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  useNodesState,
  useEdgesState,
  type OnConnect,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { NodePalette } from './components/NodePalette';
import { PropertyPanel } from './components/PropertyPanel';
import { EdgePropertyPanel } from './components/EdgePropertyPanel';
import { StartNode } from './nodes/StartNode';
import { EndNode } from './nodes/EndNode';
import { UserTaskNode } from './nodes/UserTaskNode';
import { ServiceTaskNode } from './nodes/ServiceTaskNode';
import { GatewayNode } from './nodes/GatewayNode';
import { CustomEdge } from './edges/CustomEdge';
import { convertToDSL, convertFromDSL } from './hooks/useDSLConverter';
import { validateWorkflow, type ValidationError } from './utils/validator';
import { autoLayout } from './utils/layout';

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  userTask: UserTaskNode,
  serviceTask: ServiceTaskNode,
  gateway: GatewayNode,
};

const edgeTypes = {
  default: CustomEdge,
};

const initialNodes: Node[] = [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 250, y: 50 },
    data: { label: '开始' },
  },
];

const WorkflowDesignerContent: React.FC<{ workflowId?: string | null }> = ({ workflowId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  
  // 历史记录（手动实现）
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  // 加载工作流
  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    }
  }, [workflowId]);

  // 记录历史
  useEffect(() => {
    // 初始化或加载工作流后不记录
    if (nodes.length === 0 && edges.length === 0) return;
    if (loading) return;

    const currentState = { nodes, edges };
    
    // 如果当前不是最新状态，截断后面的历史
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    
    // 限制历史记录数量（50步）
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  }, [nodes, edges]);

  const loadWorkflow = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workflows/${id}`);
      const result = await response.json();
      
      console.log('后端返回的原始数据:', result);
      
      if (result.success && result.data) {
        const workflow = result.data;
        console.log('workflow 对象:', workflow);
        console.log('workflow.nodes 原始值:', workflow.nodes);
        console.log('workflow.edges 原始值:', workflow.edges);
        
        setWorkflowName(workflow.name || '');
        
        // 后端返回的 nodes 和 edges 是 JSON 字符串，需要解析
        const nodes = typeof workflow.nodes === 'string' 
          ? JSON.parse(workflow.nodes) 
          : workflow.nodes;
        const edges = typeof workflow.edges === 'string' 
          ? JSON.parse(workflow.edges) 
          : workflow.edges;
        
        console.log('解析后的数据:', { nodes, edges });
        
        // 总是尝试转换 DSL，即使 nodes 为空
        const dsl = { ...workflow, nodes: nodes || [], edges: edges || [] };
        const { nodes: loadedNodes, edges: loadedEdges } = convertFromDSL(dsl);
        console.log('转换后的数据:', { loadedNodes, loadedEdges });
        setNodes(loadedNodes);
        setEdges(loadedEdges);
      } else {
        message.error('加载工作流失败');
      }
    } catch (error) {
      console.error('加载失败:', error);
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      // 验证连线合法性
      const sourceNode = nodes.find((n) => n.id === params.source);
      
      // StartEvent 只能有一条出边
      if (sourceNode?.type === 'start') {
        const existingEdges = edges.filter((e) => e.source === params.source);
        if (existingEdges.length > 0) {
          message.error('开始节点只能有一条出边');
          return;
        }
      }

      // EndEvent 不能有出边
      if (sourceNode?.type === 'end') {
        message.error('结束节点不能有出边');
        return;
      }

      setEdges((eds) => addEdge(params, eds));
    },
    [nodes, edges, setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeLabels: Record<string, string> = {
        start: '开始',
        end: '结束',
        userTask: '用户任务',
        serviceTask: '服务任务',
        gateway: '网关',
      };

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: nodeLabels[type] || type },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const handleNodeUpdate = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...data,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const handleEdgeUpdate = useCallback((edgeId: string, data: any) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === edgeId) {
          return {
            ...edge,
            data: {
              ...edge.data,
              ...data,
            },
            label: data.label,
          };
        }
        return edge;
      })
    );
  }, [setEdges]);

  const handleDelete = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
      ));
      setSelectedNode(null);
      message.success('已删除节点');
    } else if (selectedEdge) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
      setSelectedEdge(null);
      message.success('已删除连线');
    } else {
      message.warning('请先选择节点或连线');
    }
  }, [selectedNode, selectedEdge, setNodes, setEdges]);

  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) {
      message.warning('画布中没有节点');
      return;
    }
    const layoutedNodes = autoLayout(nodes, edges);
    setNodes(layoutedNodes);
    message.success('布局完成');
  }, [nodes, edges, setNodes]);

  // 撤销
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // 重做
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const onSave = useCallback(() => {
    // 保存前验证
    const errors = validateWorkflow(nodes, edges);
    setValidationErrors(errors);
    
    const hasErrors = errors.some((e) => e.level === 'error');
    if (hasErrors) {
      message.error('流程验证失败，请修复错误后再保存');
      return;
    }
    
    setSaveModalVisible(true);
  }, [nodes, edges]);

  const handleSaveConfirm = useCallback(async () => {
    if (!workflowName.trim()) {
      message.error('请输入工作流名称');
      return;
    }

    try {
      console.log('保存前的 nodes:', nodes);
      console.log('保存前的 edges:', edges);
      
      const dsl = convertToDSL(nodes, edges, workflowName);
      console.log('转换后的 DSL:', dsl);
      
      const url = workflowId ? `/api/workflows/${workflowId}` : '/api/workflows';
      const method = workflowId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dsl),
      });

      const result = await response.json();
      
      if (result.success) {
        message.success(workflowId ? '保存成功' : '创建成功');
        setSaveModalVisible(false);
      } else {
        message.error(result.message || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    }
  }, [nodes, edges, workflowName, workflowId]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 左侧节点面板 */}
      <NodePalette />

      {/* 中间画布 */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
          }}>
            <Spin size="large" tip="加载中..." />
          </div>
        )}
        
        {/* 顶部工具栏 */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 10,
            background: '#fff',
            padding: '8px 12px',
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Space>
            <Button 
              icon={<UndoOutlined />} 
              disabled={historyIndex <= 0}
              onClick={handleUndo}
              title="撤销"
            >
              撤销
            </Button>
            <Button 
              icon={<RedoOutlined />} 
              disabled={historyIndex >= history.length - 1}
              onClick={handleRedo}
              title="重做"
            >
              重做
            </Button>
            <Button type="primary" onClick={onSave}>
              保存
            </Button>
            <Button onClick={() => {
              const errors = validateWorkflow(nodes, edges);
              setValidationErrors(errors);
              if (errors.length === 0) {
                message.success('流程验证通过');
              } else {
                const errorCount = errors.filter(e => e.level === 'error').length;
                const warningCount = errors.filter(e => e.level === 'warning').length;
                message.warning(`发现 ${errorCount} 个错误，${warningCount} 个警告`);
              }
            }}>
              验证
            </Button>
            <Button icon={<ZoomInOutlined />} onClick={() => zoomIn()} title="放大" />
            <Button icon={<ZoomOutOutlined />} onClick={() => zoomOut()} title="缩小" />
            <Button icon={<FullscreenOutlined />} onClick={() => fitView()} title="适应画布" />
            <Button icon={<BlockOutlined />} onClick={handleAutoLayout} title="自动布局">
              布局
            </Button>
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              disabled={!selectedNode && !selectedEdge}
              onClick={handleDelete}
              title="删除选中"
            >
              删除
            </Button>
          </Space>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onInit={setReactFlowInstance}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* 右侧属性面板 */}
      <div style={{ width: 300, borderLeft: '1px solid #ddd', overflowY: 'auto' }}>
        {/* 验证错误提示 */}
        {validationErrors.length > 0 && (
          <div style={{ padding: 16, borderBottom: '1px solid #ddd' }}>
            <Alert
              type={validationErrors.some(e => e.level === 'error') ? 'error' : 'warning'}
              message={
                <div>
                  <strong>验证结果</strong>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    {validationErrors.filter(e => e.level === 'error').length} 个错误，
                    {validationErrors.filter(e => e.level === 'warning').length} 个警告
                  </div>
                </div>
              }
              closable
              onClose={() => setValidationErrors([])}
              style={{ marginBottom: 8 }}
            />
            <List
              size="small"
              dataSource={validationErrors}
              renderItem={(error) => (
                <List.Item style={{ padding: '4px 0', cursor: 'pointer' }}>
                  <div
                    style={{ fontSize: 12, display: 'flex', alignItems: 'start', gap: 4 }}
                    onClick={() => {
                      if (error.nodeId) {
                        const node = nodes.find(n => n.id === error.nodeId);
                        if (node) setSelectedNode(node);
                      } else if (error.edgeId) {
                        const edge = edges.find(e => e.id === error.edgeId);
                        if (edge) setSelectedEdge(edge);
                      }
                    }}
                  >
                    {error.level === 'error' ? (
                      <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                    ) : (
                      <CheckCircleOutlined style={{ color: '#faad14' }} />
                    )}
                    <span>{error.message}</span>
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}
        
        {selectedNode ? (
          <PropertyPanel selectedNode={selectedNode} onUpdate={handleNodeUpdate} />
        ) : selectedEdge ? (
          <EdgePropertyPanel selectedEdge={selectedEdge} onUpdate={handleEdgeUpdate} />
        ) : (
          <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>
            请选择节点或连线
          </div>
        )}
      </div>

      {/* 保存对话框 */}
      <Modal
        title="保存工作流"
        open={saveModalVisible}
        onOk={handleSaveConfirm}
        onCancel={() => {
          setSaveModalVisible(false);
          setWorkflowName('');
        }}
      >
        <Input
          placeholder="请输入工作流名称"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export const WorkflowDesigner: React.FC<{ workflowId?: string | null }> = ({ workflowId }) => {
  return (
    <ReactFlowProvider>
      <WorkflowDesignerContent workflowId={workflowId} />
    </ReactFlowProvider>
  );
};

export default WorkflowDesigner;

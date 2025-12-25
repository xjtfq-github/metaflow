/**
 * 工作流设计器 Store
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';
import type { WorkflowDSL, WorkflowNode, WorkflowEdge } from '@metaflow/shared-types';

interface WorkflowDesignerStore {
  // 状态
  workflow: WorkflowDSL | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isPreview: boolean;

  // 动作
  setWorkflow: (workflow: WorkflowDSL) => void;
  addNode: (node: WorkflowNode) => void;
  updateNode: (id: string, updates: Partial<WorkflowNode>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: WorkflowEdge) => void;
  updateEdge: (id: string, updates: Partial<WorkflowEdge>) => void;
  deleteEdge: (id: string) => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  togglePreview: () => void;
  exportJSON: () => string;
}

export const useWorkflowStore = create<WorkflowDesignerStore>()(
  temporal(
    immer((set, get) => ({
      workflow: null,
      selectedNodeId: null,
      selectedEdgeId: null,
      isPreview: false,

      setWorkflow: (workflow) =>
        set((state) => {
          state.workflow = workflow;
        }),

      addNode: (node) =>
        set((state) => {
          if (!state.workflow) return;
          state.workflow.nodes.push(node);
        }),

      updateNode: (id, updates) =>
        set((state) => {
          if (!state.workflow) return;
          const node = state.workflow.nodes.find((n) => n.id === id);
          if (node) {
            Object.assign(node, updates);
          }
        }),

      deleteNode: (id) =>
        set((state) => {
          if (!state.workflow) return;
          state.workflow.nodes = state.workflow.nodes.filter((n) => n.id !== id);
          state.workflow.edges = state.workflow.edges.filter(
            (e) => e.source !== id && e.target !== id
          );
          if (state.selectedNodeId === id) {
            state.selectedNodeId = null;
          }
        }),

      addEdge: (edge) =>
        set((state) => {
          if (!state.workflow) return;
          state.workflow.edges.push(edge);
        }),

      updateEdge: (id, updates) =>
        set((state) => {
          if (!state.workflow) return;
          const edge = state.workflow.edges.find((e) => e.id === id);
          if (edge) {
            Object.assign(edge, updates);
          }
        }),

      deleteEdge: (id) =>
        set((state) => {
          if (!state.workflow) return;
          state.workflow.edges = state.workflow.edges.filter((e) => e.id !== id);
          if (state.selectedEdgeId === id) {
            state.selectedEdgeId = null;
          }
        }),

      selectNode: (id) =>
        set((state) => {
          state.selectedNodeId = id;
          state.selectedEdgeId = null;
        }),

      selectEdge: (id) =>
        set((state) => {
          state.selectedEdgeId = id;
          state.selectedNodeId = null;
        }),

      togglePreview: () =>
        set((state) => {
          state.isPreview = !state.isPreview;
        }),

      exportJSON: () => {
        const { workflow } = get();
        return JSON.stringify(workflow, null, 2);
      },
    })),
    {
      limit: 20,
      partialize: (state) => ({ workflow: state.workflow }),
    }
  )
);

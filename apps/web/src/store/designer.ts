/**
 * 设计器状态管理
 * 
 * 使用 Zustand + Immer + Zundo 实现:
 * - DSL 树状态管理
 * - 撤销/重做
 * - 组件选中状态
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';
import type { ComponentDefinition } from '@metaflow/shared-types';

export interface DesignerState {
  // DSL 树
  dsl: ComponentDefinition | null;
  
  // 当前选中的组件 ID
  selectedId: string | null;
  
  // 是否处于预览模式
  isPreview: boolean;
  
  // 是否显示源码
  showCode: boolean;
  
  // 画布尺寸模式
  canvasMode: 'desktop' | 'tablet' | 'mobile';
}

export interface DesignerActions {
  // 设置 DSL
  setDSL: (dsl: ComponentDefinition) => void;
  
  // 加载应用
  loadApp: (appId: string) => Promise<void>;
  
  // 添加组件
  addComponent: (parentId: string, component: ComponentDefinition, index?: number) => void;
  
  // 更新组件
  updateComponent: (id: string, updates: Partial<ComponentDefinition>) => void;
  
  // 删除组件
  deleteComponent: (id: string) => void;
  
  // 移动组件
  moveComponent: (id: string, targetParentId: string, index: number) => void;
  
  // 选中组件
  selectComponent: (id: string | null) => void;
  
  // 切换预览模式
  togglePreview: () => void;
  
  // 切换源码模式
  toggleCode: () => void;
  
  // 切换画布尺寸
  setCanvasMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
}

type DesignerStore = DesignerState & DesignerActions;

/**
 * 递归查找组件
 */
function findComponent(
  component: ComponentDefinition,
  id: string
): ComponentDefinition | null {
  if (component.id === id) return component;
  
  if (component.children) {
    for (const child of component.children) {
      const found = findComponent(child, id);
      if (found) return found;
    }
  }
  
  return null;
}

/**
 * 递归删除组件
 */
function removeComponent(
  component: ComponentDefinition,
  id: string
): boolean {
  if (!component.children) return false;
  
  const index = component.children.findIndex((c) => c.id === id);
  if (index !== -1) {
    component.children.splice(index, 1);
    return true;
  }
  
  for (const child of component.children) {
    if (removeComponent(child, id)) return true;
  }
  
  return false;
}

/**
 * 创建设计器 Store
 */
export const useDesignerStore = create<DesignerStore>()((
  temporal(
    immer((set) => ({
      // 初始状态
      dsl: null,
      selectedId: null,
      isPreview: false,
      showCode: false,
      canvasMode: 'desktop',

      // Actions
      setDSL: (dsl) =>
        set((state) => {
          state.dsl = dsl;
        }),

      loadApp: async (appId) => {
        try {
          const response = await fetch(`/api/apps/${appId}`);
          const data = await response.json();
          console.log('加载应用DSL响应:', data);
          
          // 兼容嵌套data格式
          const appData = data.data?.data || data.data;
          const dsl = appData?.dsl;
          
          if (dsl) {
            set((state) => {
              state.dsl = dsl;
              state.selectedId = null;
            });
            console.log('加载应用DSL成功:', dsl);
          } else {
            console.warn('应用没有DSL配置');
          }
        } catch (error) {
          console.error('加载应用配置失败:', error);
        }
      },

      addComponent: (parentId, component, index) =>
        set((state) => {
          if (!state.dsl) return;

          const parent = findComponent(state.dsl, parentId);
          if (!parent) return;

          if (!parent.children) {
            parent.children = [];
          }

          if (index !== undefined) {
            parent.children.splice(index, 0, component);
          } else {
            parent.children.push(component);
          }
        }),

      updateComponent: (id, updates) =>
        set((state) => {
          if (!state.dsl) return;

          const component = findComponent(state.dsl, id);
          if (!component) return;

          Object.assign(component, updates);
        }),

      deleteComponent: (id) =>
        set((state) => {
          if (!state.dsl) return;
          
          // 不能删除根节点
          if (state.dsl.id === id) return;

          removeComponent(state.dsl, id);

          // 如果删除的是选中的组件,清除选中
          if (state.selectedId === id) {
            state.selectedId = null;
          }
        }),

      moveComponent: (id, targetParentId, index) =>
        set((state) => {
          if (!state.dsl) return;

          // 找到要移动的组件
          const component = findComponent(state.dsl, id);
          if (!component) return;

          // 先删除
          removeComponent(state.dsl, id);

          // 再添加到新位置
          const targetParent = findComponent(state.dsl, targetParentId);
          if (!targetParent) return;

          if (!targetParent.children) {
            targetParent.children = [];
          }

          targetParent.children.splice(index, 0, component);
        }),

      selectComponent: (id) =>
        set((state) => {
          state.selectedId = id;
        }),

      togglePreview: () =>
        set((state) => {
          state.isPreview = !state.isPreview;
        }),

      toggleCode: () =>
        set((state) => {
          state.showCode = !state.showCode;
        }),

      setCanvasMode: (mode) =>
        set((state) => {
          state.canvasMode = mode;
        }),
    })),
    {
      // 撤销/重做配置
      limit: 20,
      equality: (a, b) => a === b,
      partialize: (state) => ({
        dsl: state.dsl,
      }) as any,
    }
  )
));

/**
 * 撤销/重做 Hooks
 * Zundo 2.x 直接使用 store 状态
 */
export const useUndo = () => {
  const undo = useDesignerStore((state: any) => state.undo);
  return undo;
};

export const useRedo = () => {
  const redo = useDesignerStore((state: any) => state.redo);
  return redo;
};

export const useCanUndo = () => {
  const pastStates = useDesignerStore((state: any) => state.pastStates);
  return pastStates?.length > 0;
};

export const useCanRedo = () => {
  const futureStates = useDesignerStore((state: any) => state.futureStates);
  return futureStates?.length > 0;
};

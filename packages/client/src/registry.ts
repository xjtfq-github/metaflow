import React, { ComponentType } from 'react';
import { ComponentDefinition } from '@metaflow/shared-types';

export interface ComponentProps {
  element: ComponentDefinition;
  children?: React.ReactNode;
  [key: string]: any;
}

export type MetaComponent = ComponentType<ComponentProps>;

class ComponentRegistry {
  private components = new Map<string, MetaComponent>();

  register(type: string, component: MetaComponent) {
    if (this.components.has(type)) {
      console.warn(`Component type "${type}" is already registered. Overwriting.`);
    }
    this.components.set(type, component);
  }

  get(type: string): MetaComponent | undefined {
    return this.components.get(type);
  }

  has(type: string): boolean {
    return this.components.has(type);
  }
}

export const registry = new ComponentRegistry();

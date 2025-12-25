import React from 'react';
import { ComponentDefinition } from '@metaflow/shared-types';
import { registry } from './registry';
import { ErrorBoundary } from './components/ErrorBoundary';

interface RendererProps {
  component: ComponentDefinition;
}

export const Renderer: React.FC<RendererProps> = ({ component }) => {
  const Component = registry.get(component.type);

  if (!Component) {
    console.warn(`Renderer: Component type "${component.type}" not found.`);
    return <div style={{ color: 'red', border: '1px dashed red', padding: 4 }}>Unknown: {component.type}</div>;
  }

  // Pass children recursively
  const children = component.children?.map((child) => (
    <Renderer key={child.id} component={child} />
  ));

  return (
    <ErrorBoundary>
      <Component element={component} {...component.props}>
        {children}
      </Component>
    </ErrorBoundary>
  );
};

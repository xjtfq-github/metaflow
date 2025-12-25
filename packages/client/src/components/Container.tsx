import React from 'react';
import { ComponentProps } from '../registry';

export const Container: React.FC<ComponentProps> = ({ element, children, ...props }) => {
  return (
    <div style={{ padding: 10, border: '1px solid #ccc', ...element.style }} {...props}>
      {children}
    </div>
  );
};

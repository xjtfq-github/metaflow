import React from 'react';
import { ComponentProps } from '../registry';

export const Button: React.FC<ComponentProps> = ({ element, ...props }) => {
  return (
    <button
      onClick={() => console.log('Button clicked', element.events)}
      style={element.style}
      {...props}
    >
      {element.props?.text || 'Button'}
    </button>
  );
};

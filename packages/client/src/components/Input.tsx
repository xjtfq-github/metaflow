import React from 'react';
import { ComponentProps } from '../registry';

export const Input: React.FC<ComponentProps> = ({ element, ...props }) => {
  return (
    <input
      placeholder={element.props?.placeholder}
      style={element.style}
      {...props}
    />
  );
};

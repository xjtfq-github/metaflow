/**
 * 文本组件
 */
import React from 'react';
import type { ComponentProps } from '../registry';

export const Text: React.FC<ComponentProps> = ({ element, children }) => {
  const { content = '文本内容', ...otherProps } = element.props || {};
  
  return (
    <div {...otherProps} style={element.style}>
      {content}
      {children}
    </div>
  );
};

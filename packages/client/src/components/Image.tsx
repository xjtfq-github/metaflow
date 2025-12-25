/**
 * 图片组件
 */
import React from 'react';
import type { ComponentProps } from '../registry';

export const Image: React.FC<ComponentProps> = ({ element }) => {
  const { src = 'https://via.placeholder.com/150', alt = '图片', ...otherProps } = element.props || {};
  
  return (
    <img 
      src={src} 
      alt={alt} 
      {...otherProps} 
      style={{ maxWidth: '100%', ...element.style }} 
    />
  );
};

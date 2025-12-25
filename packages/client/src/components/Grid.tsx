/**
 * 栅格布局组件
 */
import React from 'react';
import { Row, Col } from 'antd';
import type { ComponentProps } from '../registry';

export const Grid: React.FC<ComponentProps> = ({ element, children }) => {
  const { gutter = 16, columns = 2 } = element.props || {};
  
  // 将子组件分配到列中
  const childrenArray = React.Children.toArray(children);
  const span = 24 / columns;
  
  return (
    <Row gutter={gutter} style={element.style}>
      {childrenArray.map((child, index) => (
        <Col key={index} span={span}>
          {child}
        </Col>
      ))}
    </Row>
  );
};

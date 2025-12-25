import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * VirtualList - 虚拟滚动列表
 * 
 * 功能:
 * 1. 仅渲染可视区域内的项目
 * 2. 大幅减少 DOM 节点数量
 * 3. 适用于 500+ 字段的超长表单
 * 
 * 原理:
 * - 计算可视区域高度
 * - 根据滚动位置计算可见项目范围
 * - 动态渲染可见项目
 * - 使用占位符撑开总高度
 */

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number; // 每个项目的固定高度
  containerHeight: number; // 容器高度
  overscan?: number; // 预渲染的额外项目数量 (避免滚动时闪烁)
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
  renderItem,
  className,
  onScroll,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // 总高度
  const totalHeight = items.length * itemHeight;

  // 可见项目数量
  const visibleCount = Math.ceil(containerHeight / itemHeight);

  // 开始索引 (考虑 overscan)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);

  // 结束索引 (考虑 overscan)
  const endIndex = Math.min(
    items.length - 1,
    startIndex + visibleCount + overscan * 2
  );

  // 可见项目
  const visibleItems = items.slice(startIndex, endIndex + 1);

  // 上方偏移量
  const offsetY = startIndex * itemHeight;

  // 处理滚动
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={className}
      style={{
        height: containerHeight,
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      {/* 占位符 (撑开总高度) */}
      <div style={{ height: totalHeight }} />

      {/* 可见项目 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(${offsetY}px)`,
        }}
      >
        {visibleItems.map((item, index) => {
          const actualIndex = startIndex + index;
          return (
            <div
              key={actualIndex}
              style={{
                height: itemHeight,
                overflow: 'hidden',
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * VirtualForm - 虚拟滚动表单
 * 
 * 用于渲染超长表单 (500+ 字段)
 */

interface VirtualFormProps {
  fields: Array<{
    id: string;
    component: React.ReactNode;
  }>;
  containerHeight?: number;
  itemHeight?: number;
}

export const VirtualForm: React.FC<VirtualFormProps> = ({
  fields,
  containerHeight = 600,
  itemHeight = 80, // 每个字段平均高度
}) => {
  return (
    <VirtualList
      items={fields}
      itemHeight={itemHeight}
      containerHeight={containerHeight}
      overscan={5}
      renderItem={(field) => (
        <div key={field.id} style={{ padding: '8px 0' }}>
          {field.component}
        </div>
      )}
    />
  );
};

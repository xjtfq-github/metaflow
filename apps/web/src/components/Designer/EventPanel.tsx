/**
 * 事件配置面板
 * 
 * 管理组件的事件与逻辑流水线
 */

import React, { useState } from 'react';
import { Button, List, Modal, Space, Select, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Pipeline, TriggerType } from '@metaflow/shared-types';
import { ActionEditor } from './ActionEditor';

interface EventPanelProps {
  componentId: string;
}

/**
 * 支持的事件类型
 */
const EVENT_TYPES: { label: string; value: TriggerType }[] = [
  { label: '点击 (onClick)', value: 'onClick' },
  { label: '值改变 (onChange)', value: 'onChange' },
  { label: '组件挂载 (onMount)', value: 'onMount' },
  { label: '组件卸载 (onUnmount)', value: 'onUnmount' },
];

export const EventPanel: React.FC<EventPanelProps> = ({ componentId }) => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  /**
   * 添加新事件
   */
  const handleAddEvent = () => {
    const newPipeline: Pipeline = {
      id: `pipeline-${Date.now()}`,
      trigger: {
        type: 'onClick',
      },
      actions: [],
      enabled: true,
    };
    setEditingPipeline(newPipeline);
    setIsModalVisible(true);
  };

  /**
   * 编辑事件
   */
  const handleEditEvent = (pipeline: Pipeline) => {
    setEditingPipeline(pipeline);
    setIsModalVisible(true);
  };

  /**
   * 删除事件
   */
  const handleDeleteEvent = (pipelineId: string) => {
    setPipelines((prev) => prev.filter((p) => p.id !== pipelineId));
  };

  /**
   * 保存事件配置
   */
  const handleSaveEvent = (pipeline: Pipeline) => {
    setPipelines((prev) => {
      const index = prev.findIndex((p) => p.id === pipeline.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = pipeline;
        return updated;
      }
      return [...prev, pipeline];
    });
    setIsModalVisible(false);
    setEditingPipeline(null);
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddEvent}>
          新增交互
        </Button>
      </div>

      {pipelines.length === 0 ? (
        <Empty description="暂无事件配置" />
      ) : (
        <List
          dataSource={pipelines}
          renderItem={(pipeline) => (
            <List.Item
              actions={[
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEditEvent(pipeline)}
                />,
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteEvent(pipeline.id)}
                />,
              ]}
            >
              <List.Item.Meta
                title={`${EVENT_TYPES.find((t) => t.value === pipeline.trigger.type)?.label || pipeline.trigger.type}`}
                description={`${pipeline.actions.length} 个动作`}
              />
            </List.Item>
          )}
        />
      )}

      {/* 事件编辑弹窗 */}
      <Modal
        title="配置事件"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingPipeline(null);
        }}
        footer={null}
        width={800}
      >
        {editingPipeline && (
          <EventEditor pipeline={editingPipeline} onSave={handleSaveEvent} />
        )}
      </Modal>
    </div>
  );
};

/**
 * 事件编辑器
 */
const EventEditor: React.FC<{
  pipeline: Pipeline;
  onSave: (pipeline: Pipeline) => void;
}> = ({ pipeline: initialPipeline, onSave }) => {
  const [pipeline, setPipeline] = useState<Pipeline>(initialPipeline);

  return (
    <div>
      {/* 触发器选择 */}
      <div style={{ marginBottom: 24 }}>
        <h4>触发时机</h4>
        <Select
          value={pipeline.trigger.type}
          onChange={(value) => {
            setPipeline({
              ...pipeline,
              trigger: { ...pipeline.trigger, type: value },
            });
          }}
          style={{ width: '100%' }}
          options={EVENT_TYPES}
        />
      </div>

      {/* 动作编排器 */}
      <div style={{ marginBottom: 24 }}>
        <h4>动作流程</h4>
        <ActionEditor
          actions={pipeline.actions}
          onChange={(actions) => {
            setPipeline({ ...pipeline, actions });
          }}
        />
      </div>

      {/* 保存按钮 */}
      <div style={{ textAlign: 'right' }}>
        <Button type="primary" onClick={() => onSave(pipeline)}>
          保存
        </Button>
      </div>
    </div>
  );
};

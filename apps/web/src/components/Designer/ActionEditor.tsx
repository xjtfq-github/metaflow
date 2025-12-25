/**
 * 动作编排器
 * 
 * 线性流 UI,像搭积木一样添加动作节点
 */

import React, { useState } from 'react';
import { Button, Card, Select, Input, InputNumber, Space, Collapse, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import type { Action, ActionType } from '@metaflow/shared-types';

const { Panel } = Collapse;

interface ActionEditorProps {
  actions: Action[];
  onChange: (actions: Action[]) => void;
}

/**
 * 动作类型定义
 */
const ACTION_TYPES: { label: string; value: ActionType; category: string }[] = [
  // 网络类
  { label: 'API 请求', value: 'api.request', category: '网络' },
  // 交互类
  { label: '显示 Toast', value: 'ui.showToast', category: '交互' },
  { label: '显示弹窗', value: 'ui.showModal', category: '交互' },
  { label: '关闭弹窗', value: 'ui.closeModal', category: '交互' },
  { label: '页面跳转', value: 'ui.navigate', category: '交互' },
  // 状态类
  { label: '设置变量', value: 'state.setValue', category: '状态' },
  { label: '重置表单', value: 'state.resetForm', category: '状态' },
  { label: '刷新数据', value: 'state.refreshData', category: '状态' },
  // 逻辑类
  { label: '条件判断', value: 'logic.if', category: '逻辑' },
  { label: '循环执行', value: 'logic.forEach', category: '逻辑' },
  { label: '延迟执行', value: 'logic.sleep', category: '逻辑' },
];

export const ActionEditor: React.FC<ActionEditorProps> = ({ actions, onChange }) => {
  /**
   * 添加动作
   */
  const handleAddAction = () => {
    const newAction: Action = {
      id: `action-${Date.now()}`,
      type: 'ui.showToast',
      params: {},
      await: true,
      onError: 'stop',
    };
    onChange([...actions, newAction]);
  };

  /**
   * 更新动作
   */
  const handleUpdateAction = (index: number, updates: Partial<Action>) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  /**
   * 删除动作
   */
  const handleDeleteAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  /**
   * 移动动作
   */
  const handleMoveAction = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= actions.length) return;

    const updated = [...actions];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  return (
    <div>
      {actions.length === 0 ? (
        <Empty description="暂无动作,点击下方添加" />
      ) : (
        <Collapse>
          {actions.map((action, index) => (
            <Panel
              key={action.id}
              header={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    {index + 1}. {ACTION_TYPES.find((t) => t.value === action.type)?.label || action.type}
                  </span>
                  <Space onClick={(e) => e.stopPropagation()}>
                    <Button
                      type="text"
                      size="small"
                      icon={<UpOutlined />}
                      disabled={index === 0}
                      onClick={() => handleMoveAction(index, 'up')}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<DownOutlined />}
                      disabled={index === actions.length - 1}
                      onClick={() => handleMoveAction(index, 'down')}
                    />
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteAction(index)}
                    />
                  </Space>
                </div>
              }
            >
              <ActionParamsEditor
                action={action}
                onChange={(updates) => handleUpdateAction(index, updates)}
              />
            </Panel>
          ))}
        </Collapse>
      )}

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={handleAddAction}
        style={{ width: '100%', marginTop: 16 }}
      >
        添加动作
      </Button>
    </div>
  );
};

/**
 * 动作参数编辑器
 */
const ActionParamsEditor: React.FC<{
  action: Action;
  onChange: (updates: Partial<Action>) => void;
}> = ({ action, onChange }) => {
  return (
    <div>
      {/* 动作类型 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>动作类型</label>
        <Select
          value={action.type}
          onChange={(type) => onChange({ type, params: {} })}
          style={{ width: '100%' }}
        >
          {['网络', '交互', '状态', '逻辑'].map((category) => (
            <Select.OptGroup key={category} label={category}>
              {ACTION_TYPES.filter((t) => t.category === category).map((type) => (
                <Select.Option key={type.value} value={type.value}>
                  {type.label}
                </Select.Option>
              ))}
            </Select.OptGroup>
          ))}
        </Select>
      </div>

      {/* 动作参数 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>参数配置</label>
        <ActionParamsForm action={action} onChange={(params) => onChange({ params })} />
      </div>

      {/* 错误处理 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>失败时</label>
        <Select
          value={action.onError}
          onChange={(onError) => onChange({ onError })}
          style={{ width: '100%' }}
          options={[
            { label: '终止流程', value: 'stop' },
            { label: '跳过此步', value: 'skip' },
            { label: '继续执行', value: 'continue' },
          ]}
        />
      </div>
    </div>
  );
};

/**
 * 根据动作类型渲染参数表单
 */
const ActionParamsForm: React.FC<{
  action: Action;
  onChange: (params: Record<string, any>) => void;
}> = ({ action, onChange }) => {
  const updateParam = (key: string, value: any) => {
    onChange({ ...action.params, [key]: value });
  };

  // API 请求
  if (action.type === 'api.request') {
    return (
      <>
        <Input
          placeholder="URL (支持 {{ }} 插值)"
          value={action.params.url || ''}
          onChange={(e) => updateParam('url', e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <Select
          placeholder="请求方法"
          value={action.params.method || 'GET'}
          onChange={(value) => updateParam('method', value)}
          style={{ width: '100%', marginBottom: 8 }}
          options={[
            { label: 'GET', value: 'GET' },
            { label: 'POST', value: 'POST' },
            { label: 'PUT', value: 'PUT' },
            { label: 'DELETE', value: 'DELETE' },
          ]}
        />
      </>
    );
  }

  // Toast
  if (action.type === 'ui.showToast') {
    return (
      <>
        <Input
          placeholder="提示消息 (支持 {{ }} 插值)"
          value={action.params.message || ''}
          onChange={(e) => updateParam('message', e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <Select
          placeholder="类型"
          value={action.params.type || 'info'}
          onChange={(value) => updateParam('type', value)}
          style={{ width: '100%' }}
          options={[
            { label: '信息', value: 'info' },
            { label: '成功', value: 'success' },
            { label: '警告', value: 'warning' },
            { label: '错误', value: 'error' },
          ]}
        />
      </>
    );
  }

  // 页面跳转
  if (action.type === 'ui.navigate') {
    return (
      <Input
        placeholder="跳转 URL (支持 {{ }} 插值)"
        value={action.params.url || ''}
        onChange={(e) => updateParam('url', e.target.value)}
      />
    );
  }

  // 设置变量
  if (action.type === 'state.setValue') {
    return (
      <>
        <Input
          placeholder="变量名"
          value={action.params.key || ''}
          onChange={(e) => updateParam('key', e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <Input
          placeholder="变量值 (支持 {{ }} 插值)"
          value={action.params.value || ''}
          onChange={(e) => updateParam('value', e.target.value)}
        />
      </>
    );
  }

  // 延迟执行
  if (action.type === 'logic.sleep') {
    return (
      <InputNumber
        placeholder="延迟时间 (毫秒)"
        value={action.params.duration || 1000}
        onChange={(value) => updateParam('duration', value)}
        style={{ width: '100%' }}
        min={0}
      />
    );
  }

  // 默认
  return <Input.TextArea placeholder="参数 JSON" rows={4} />;
};

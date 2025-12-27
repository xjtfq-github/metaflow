/**
 * 工具栏
 * 
 * 撤销/重做、预览、保存、源码模式
 */

import React from 'react';
import { Button, Space, Radio, message } from 'antd';
import {
  UndoOutlined,
  RedoOutlined,
  EyeOutlined,
  SaveOutlined,
  CodeOutlined,
  DesktopOutlined,
  TabletOutlined,
  MobileOutlined,
} from '@ant-design/icons';
import { useDesignerStore, useUndo, useRedo, useCanUndo, useCanRedo } from '../../store/designer';

export const Toolbar: React.FC<{ appId?: string | null }> = ({ appId }) => {
  const { dsl, isPreview, showCode, canvasMode, togglePreview, toggleCode, setCanvasMode } = useDesignerStore();
  
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const handleSave = async () => {
    if (!dsl || !appId) {
      message.warning('没有可保存的内容');
      return;
    }
    
    try {
      const response = await fetch(`/api/apps/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dsl }),
      });
      
      const data = await response.json();
      const isSuccess = data.success !== false;
      
      if (isSuccess) {
        message.success('保存成功');
      } else {
        message.error(data.message || '保存失败');
      }
    } catch (error) {
      console.error('保存错误:', error);
      message.error('保存失败');
    }
  };

  const handleExportCode = () => {
    if (!dsl) return;
    
    const code = JSON.stringify(dsl, null, 2);
    const blob = new Blob([code], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'page.json';
    a.click();
    URL.revokeObjectURL(url);
    message.success('导出成功');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
      <Space>
        <h2 style={{ margin: 0 }}>MetaFlow Designer</h2>
      </Space>

      <Space>
        {/* 撤销/重做 */}
        <Button icon={<UndoOutlined />} onClick={undo} disabled={!canUndo} title="撤销 (Ctrl+Z)">
          撤销
        </Button>
        <Button icon={<RedoOutlined />} onClick={redo} disabled={!canRedo} title="重做 (Ctrl+Y)">
          重做
        </Button>

        {/* 画布尺寸 */}
        <Radio.Group value={canvasMode} onChange={(e) => setCanvasMode(e.target.value)}>
          <Radio.Button value="desktop">
            <DesktopOutlined /> 桌面
          </Radio.Button>
          <Radio.Button value="tablet">
            <TabletOutlined /> 平板
          </Radio.Button>
          <Radio.Button value="mobile">
            <MobileOutlined /> 手机
          </Radio.Button>
        </Radio.Group>

        {/* 预览 */}
        <Button
          icon={<EyeOutlined />}
          onClick={togglePreview}
          type={isPreview ? 'primary' : 'default'}
        >
          {isPreview ? '退出预览' : '预览'}
        </Button>

        {/* 源码 */}
        <Button icon={<CodeOutlined />} onClick={toggleCode}>
          {showCode ? '隐藏源码' : '查看源码'}
        </Button>

        {/* 导出 */}
        <Button onClick={handleExportCode}>导出</Button>

        {/* 保存 */}
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
          保存
        </Button>
      </Space>
    </div>
  );
};

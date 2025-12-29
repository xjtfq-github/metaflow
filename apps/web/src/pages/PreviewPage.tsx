import React, { useEffect, useState } from 'react';
import { Spin, Result } from 'antd';
import { RenderEngine } from '../components/RenderEngine';
import type { ComponentDefinition } from '@metaflow/shared-types';

export const PreviewPage: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const appId = params.get('appId');
  const [dsl, setDsl] = useState<ComponentDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!appId) return;

    const loadApp = async () => {
      try {
        const response = await fetch(`/api/apps/${appId}`);
        const data = await response.json();
        
        const appData = data.data?.data || data.data;
        if (!appData?.dsl) {
          setError('应用没有页面配置');
          return;
        }

        setDsl(appData.dsl);
      } catch (err) {
        setError('加载应用失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadApp();
  }, [appId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (error || !dsl) {
    return (
      <div style={{ padding: 24 }}>
        <Result status="warning" title={error || '页面不存在'} />
      </div>
    );
  }

  return <RenderEngine dsl={dsl} />;
};

export default PreviewPage;

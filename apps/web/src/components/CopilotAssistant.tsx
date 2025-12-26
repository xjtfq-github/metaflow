import React, { useState } from 'react';
import { Drawer, Input, Button, Card, Tag, Space, List, Spin, message } from 'antd';
import { 
  RobotOutlined, 
  SendOutlined, 
  BulbOutlined, 
  CodeOutlined, 
  DatabaseOutlined, 
  LayoutOutlined 
} from '@ant-design/icons';

const { TextArea } = Input;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'code' | 'schema' | 'layout';
  data?: any;
}

interface CopilotAssistantProps {
  visible: boolean;
  onClose: () => void;
}

export const CopilotAssistant: React.FC<CopilotAssistantProps> = ({ visible, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是MetaFlow AI助手。我可以帮你：\n\n1. 🔍 自然语言查询数据\n2. 📊 生成数据模型Schema\n3. 🎨 生成页面布局\n4. 💡 代码补全建议\n5. 🐛 错误诊断和修复',
      type: 'text',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  // 快捷功能按钮
  const features = [
    { key: 'query', label: '智能查询', icon: <DatabaseOutlined />, color: 'blue' },
    { key: 'schema', label: '生成Schema', icon: <CodeOutlined />, color: 'green' },
    { key: 'layout', label: '生成页面', icon: <LayoutOutlined />, color: 'purple' },
    { key: 'complete', label: '代码补全', icon: <BulbOutlined />, color: 'orange' },
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      let response;

      // 根据激活的功能调用不同的API
      if (activeFeature === 'query') {
        response = await callTextToQuery(input);
      } else if (activeFeature === 'schema') {
        response = await callGenerateSchema(input);
      } else if (activeFeature === 'layout') {
        response = await callGenerateLayout(input);
      } else {
        // 默认为聊天
        response = await callChat(input);
      }

      setMessages(prev => [...prev, response]);
    } catch (error) {
      message.error('AI请求失败: ' + (error as Error).message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，我遇到了一些问题。请稍后再试。',
        type: 'text',
      }]);
    } finally {
      setLoading(false);
    }
  };

  // 调用Text-to-Query API
  const callTextToQuery = async (query: string): Promise<Message> => {
    console.log('调用 text-to-query API:', query);
    
    // TODO: 调用真实API
    // const response = await fetch('/api/copilot/text-to-query', {...});
    
    // 模拟响应
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      role: 'assistant',
      content: '以下是查询条件：',
      type: 'code',
      data: {
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    };
  };

  // 调用生成Schema API
  const callGenerateSchema = async (description: string): Promise<Message> => {
    console.log('调用 generate-schema API:', description);
    
    // TODO: 调用真实API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      role: 'assistant',
      content: '已生成Schema：',
      type: 'schema',
      data: {
        id: 'generated-model',
        displayName: '示例模型',
        entityName: 'ExampleModel',
        fields: [
          { key: 'name', label: '名称', type: 'string', required: true },
          { key: 'status', label: '状态', type: 'string', required: false },
        ],
      },
    };
  };

  // 调用生成页面布局API
  const callGenerateLayout = async (description: string): Promise<Message> => {
    console.log('调用 generate-page API:', description);
    
    // TODO: 调用真实API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      role: 'assistant',
      content: '已生成页面布局：',
      type: 'layout',
      data: {
        id: 'generated-page',
        name: '示例页面',
        layout: {
          type: 'container',
          children: [
            { id: 'table-1', type: 'Table', props: { dataSource: [] } },
          ],
        },
      },
    };
  };

  // 默认聊天
  const callChat = async (text: string): Promise<Message> => {
    console.log('默认聊天:', text);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      role: 'assistant',
      content: `我明白了："${text}"。\n\n请选择一个功能来获得更具体的帮助，或者告诉我你想做什么。`,
      type: 'text',
    };
  };

  // 渲染消息
  const renderMessage = (msg: Message, index: number) => {
    const isUser = msg.role === 'user';

    return (
      <div
        key={index}
        style={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginBottom: 16,
        }}
      >
        <Card
          size="small"
          style={{
            maxWidth: '80%',
            background: isUser ? '#1890ff' : '#f0f0f0',
            color: isUser ? '#fff' : '#000',
            borderRadius: 8,
          }}
          bodyStyle={{ padding: '8px 12px' }}
        >
          {!isUser && msg.type === 'text' && (
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
          )}
          
          {!isUser && (msg.type === 'code' || msg.type === 'schema' || msg.type === 'layout') && (
            <div>
              <div style={{ marginBottom: 8 }}>{msg.content}</div>
              <pre
                style={{
                  background: '#fff',
                  padding: 12,
                  borderRadius: 4,
                  overflow: 'auto',
                  maxHeight: 300,
                  color: '#000',
                }}
              >
                {JSON.stringify(msg.data, null, 2)}
              </pre>
              <Button size="small" type="primary" style={{ marginTop: 8 }}>
                应用此结果
              </Button>
            </div>
          )}

          {isUser && (
            <div>{msg.content}</div>
          )}
        </Card>
      </div>
    );
  };

  return (
    <Drawer
      title={
        <Space>
          <RobotOutlined style={{ fontSize: 20 }} />
          <span>AI Copilot 助手</span>
        </Space>
      }
      placement="right"
      width={500}
      open={visible}
      onClose={onClose}
    >
      {/* 功能快捷按钮 */}
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          {features.map(feat => (
            <Tag
              key={feat.key}
              icon={feat.icon}
              color={activeFeature === feat.key ? feat.color : 'default'}
              style={{ cursor: 'pointer', padding: '4px 12px' }}
              onClick={() => setActiveFeature(activeFeature === feat.key ? null : feat.key)}
            >
              {feat.label}
            </Tag>
          ))}
        </Space>
      </div>

      {/* 消息列表 */}
      <div
        style={{
          height: 'calc(100vh - 300px)',
          overflowY: 'auto',
          marginBottom: 16,
          padding: '0 8px',
        }}
      >
        {messages.map((msg, idx) => renderMessage(msg, idx))}
        {loading && (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Spin tip="AI思考中..." />
          </div>
        )}
      </div>

      {/* 输入框 */}
      <div style={{ display: 'flex', gap: 8 }}>
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            activeFeature === 'query' ? '例如：查询最近10条状态为active的记录' :
            activeFeature === 'schema' ? '例如：创建一个用户管理模型，包含姓名、邮箱、手机号' :
            activeFeature === 'layout' ? '例如：创建一个用户列表页面，包含表格和搜索' :
            '输入你的问题或需求...'
          }
          autoSize={{ minRows: 2, maxRows: 4 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{ height: 'auto' }}
        >
          发送
        </Button>
      </div>

      <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
        {activeFeature && <div>当前模式: <Tag color="blue">{features.find(f => f.key === activeFeature)?.label}</Tag></div>}
        <div>提示: Shift + Enter 换行，Enter 发送</div>
      </div>
    </Drawer>
  );
};

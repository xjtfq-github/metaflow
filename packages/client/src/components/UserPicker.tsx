import React, { useState, useEffect } from 'react';
import { Modal, Tree, Input, Empty } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import type { ComponentProps } from '../registry';
import { useFormContext } from '../SchemaForm';

/**
 * UserPicker - 用户选择器
 * 
 * 功能:
 * 1. 部门树筛选
 * 2. 模态弹窗选择
 * 3. 存储 UserID，展示 UserName
 * 4. 支持单选/多选
 */

interface User {
  id: string;
  name: string;
  deptId: string;
  avatar?: string;
}

interface Department {
  id: string;
  name: string;
  parentId?: string;
  children?: Department[];
}

interface UserPickerProps extends ComponentProps {
  // 自定义配置
  apiUrl?: string; // 用户列表 API
  deptApiUrl?: string; // 部门树 API
  multiple?: boolean; // 是否多选
  maxCount?: number; // 最多选择数量
}

export const UserPicker: React.FC<UserPickerProps> = ({ element, apiUrl, deptApiUrl, multiple = false, maxCount }) => {
  const formContext = useFormContext();
  const fieldName = element.props?.name || element.id;

  const [visible, setVisible] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  // 注册字段
  useEffect(() => {
    if (formContext) {
      formContext.registerField({
        name: fieldName,
        defaultValue: element.props?.defaultValue || (multiple ? [] : null),
        rules: element.props?.rules,
      });
    }
  }, [fieldName, element.props?.defaultValue, element.props?.rules, formContext, multiple]);

  // 获取选中的值 (UserID 或 UserID[])
  const value = formContext?.getFieldValue(fieldName);
  const error = formContext?.errors[fieldName];
  const touched = formContext?.touched[fieldName];

  // 加载部门树
  const loadDepartments = async () => {
    if (!deptApiUrl) {
      // Mock 数据
      setDepartments([
        {
          id: 'dept-1',
          name: '技术部',
          children: [
            { id: 'dept-1-1', name: '前端组', parentId: 'dept-1' },
            { id: 'dept-1-2', name: '后端组', parentId: 'dept-1' },
          ],
        },
        {
          id: 'dept-2',
          name: '业务部',
          children: [
            { id: 'dept-2-1', name: '销售组', parentId: 'dept-2' },
          ],
        },
      ]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(deptApiUrl);
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Failed to load departments:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载用户列表
  const loadUsers = async (deptId?: string) => {
    if (!apiUrl) {
      // Mock 数据
      setUsers([
        { id: 'user-1', name: '张三', deptId: 'dept-1-1' },
        { id: 'user-2', name: '李四', deptId: 'dept-1-2' },
        { id: 'user-3', name: '王五', deptId: 'dept-2-1' },
      ]);
      return;
    }

    try {
      setLoading(true);
      const url = deptId ? `${apiUrl}?deptId=${deptId}` : apiUrl;
      const response = await fetch(url);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  // 打开选择器
  const handleOpen = () => {
    setVisible(true);
    loadDepartments();
    loadUsers();
  };

  // 选择用户
  const handleSelectUser = (user: User) => {
    if (multiple) {
      const currentValue = value || [];
      const exists = currentValue.includes(user.id);

      let newValue;
      if (exists) {
        newValue = currentValue.filter((id: string) => id !== user.id);
      } else {
        if (maxCount && currentValue.length >= maxCount) {
          alert(`最多只能选择 ${maxCount} 个用户`);
          return;
        }
        newValue = [...currentValue, user.id];
      }

      formContext?.setFieldValue(fieldName, newValue);
    } else {
      formContext?.setFieldValue(fieldName, user.id);
      setVisible(false);
    }
  };

  // 确认选择
  const handleOk = () => {
    setVisible(false);
  };

  // 获取显示名称
  const getDisplayName = (): string => {
    if (!value) return '';

    if (multiple && Array.isArray(value)) {
      const selectedUsers = users.filter(u => value.includes(u.id));
      return selectedUsers.map(u => u.name).join(', ');
    } else {
      const selectedUser = users.find(u => u.id === value);
      return selectedUser?.name || value;
    }
  };

  // 过滤用户
  const filteredUsers = users.filter(user => {
    if (selectedDeptId && user.deptId !== selectedDeptId) return false;
    if (searchText && !user.name.includes(searchText)) return false;
    return true;
  });

  if (element.props?.visible === false) {
    return null;
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {element.props?.label && (
        <label style={{ display: 'block', marginBottom: 4 }}>
          {element.props.label}
          {element.props?.rules?.required && (
            <span style={{ color: 'red', marginLeft: 4 }}>*</span>
          )}
        </label>
      )}

      <Input
        value={getDisplayName()}
        onClick={handleOpen}
        readOnly
        placeholder={element.props?.placeholder || '请选择用户'}
        suffix={<UserOutlined />}
        status={touched && error ? 'error' : undefined}
        style={element.style}
      />

      {touched && error && (
        <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
          {error.message}
        </div>
      )}

      <Modal
        title={element.props?.label || '选择用户'}
        open={visible}
        onOk={handleOk}
        onCancel={() => setVisible(false)}
        width={800}
        bodyStyle={{ display: 'flex', height: 500 }}
      >
        {/* 左侧: 部门树 */}
        <div style={{ width: 250, borderRight: '1px solid #f0f0f0', paddingRight: 16 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
            <TeamOutlined /> 部门
          </div>
          <Tree
            treeData={departments.map(dept => ({
              title: dept.name,
              key: dept.id,
              children: dept.children?.map(child => ({
                title: child.name,
                key: child.id,
              })),
            }))}
            onSelect={(keys) => {
              const deptId = keys[0] as string;
              setSelectedDeptId(deptId);
              loadUsers(deptId);
            }}
          />
        </div>

        {/* 右侧: 用户列表 */}
        <div style={{ flex: 1, paddingLeft: 16 }}>
          <Input.Search
            placeholder="搜索用户"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ marginBottom: 8 }}
          />

          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {filteredUsers.length === 0 ? (
              <Empty description="暂无用户" />
            ) : (
              filteredUsers.map(user => {
                const isSelected = multiple
                  ? value?.includes(user.id)
                  : value === user.id;

                return (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                      borderRadius: 4,
                      marginBottom: 4,
                      border: isSelected ? '1px solid #1890ff' : '1px solid transparent',
                    }}
                  >
                    <UserOutlined style={{ marginRight: 8 }} />
                    {user.name}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

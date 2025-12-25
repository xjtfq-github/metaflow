/**
 * SchemaForm 组件测试
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SchemaForm } from '../components/SchemaForm';
import type { FormSchema } from '@metaflow/shared-types';

describe('SchemaForm', () => {
  const mockSchema: FormSchema = {
    fields: [
      {
        name: 'username',
        type: 'string',
        label: '用户名',
        required: true,
        rules: {
          required: true,
          minLength: 3,
        },
      },
      {
        name: 'email',
        type: 'string',
        label: '邮箱',
        required: true,
        rules: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
      },
      {
        name: 'age',
        type: 'number',
        label: '年龄',
        rules: {
          min: 18,
          max: 100,
        },
      },
    ],
  };

  it('应该根据 Schema 渲染表单字段', () => {
    render(<SchemaForm schema={mockSchema} onSubmit={() => {}} />);

    expect(screen.getByLabelText('用户名')).toBeInTheDocument();
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument();
    expect(screen.getByLabelText('年龄')).toBeInTheDocument();
  });

  it('应该显示必填字段标记', () => {
    render(<SchemaForm schema={mockSchema} onSubmit={() => {}} />);

    const usernameLabel = screen.getByText(/用户名/);
    expect(usernameLabel.parentElement).toHaveTextContent('*');
  });

  it('应该验证必填字段', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<SchemaForm schema={mockSchema} onSubmit={onSubmit} />);

    const submitButton = screen.getByRole('button', { name: /提交/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('此字段为必填项')).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('应该验证最小长度', async () => {
    const user = userEvent.setup();
    render(<SchemaForm schema={mockSchema} onSubmit={() => {}} />);

    const usernameInput = screen.getByLabelText('用户名');
    await user.type(usernameInput, 'ab'); // 少于 3 个字符

    await user.tab(); // 触发 blur

    await waitFor(() => {
      expect(screen.getByText(/最少需要 3 个字符/)).toBeInTheDocument();
    });
  });

  it('应该验证邮箱格式', async () => {
    const user = userEvent.setup();
    render(<SchemaForm schema={mockSchema} onSubmit={() => {}} />);

    const emailInput = screen.getByLabelText('邮箱');
    await user.type(emailInput, 'invalid-email');

    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('格式不正确')).toBeInTheDocument();
    });
  });

  it('应该验证数字范围', async () => {
    const user = userEvent.setup();
    render(<SchemaForm schema={mockSchema} onSubmit={() => {}} />);

    const ageInput = screen.getByLabelText('年龄');
    await user.type(ageInput, '15'); // 小于 18

    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/最小值为 18/)).toBeInTheDocument();
    });
  });

  it('应该在通过验证后提交表单', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<SchemaForm schema={mockSchema} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('用户名'), 'testuser');
    await user.type(screen.getByLabelText('邮箱'), 'test@example.com');
    await user.type(screen.getByLabelText('年龄'), '25');

    const submitButton = screen.getByRole('button', { name: /提交/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        age: 25,
      });
    });
  });

  it('应该支持初始值', () => {
    const initialValues = {
      username: 'existinguser',
      email: 'existing@example.com',
      age: 30,
    };

    render(
      <SchemaForm
        schema={mockSchema}
        initialValues={initialValues}
        onSubmit={() => {}}
      />
    );

    expect(screen.getByDisplayValue('existinguser')).toBeInTheDocument();
    expect(screen.getByDisplayValue('existing@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
  });

  it('应该支持禁用状态', () => {
    render(<SchemaForm schema={mockSchema} onSubmit={() => {}} disabled />);

    expect(screen.getByLabelText('用户名')).toBeDisabled();
    expect(screen.getByLabelText('邮箱')).toBeDisabled();
    expect(screen.getByLabelText('年龄')).toBeDisabled();
  });
});

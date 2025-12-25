/**
 * Renderer 渲染测试
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Renderer } from '../renderer';
import type { PageDSL } from '@metaflow/shared-types';

describe('Renderer', () => {
  it('应该渲染简单的 Input 组件', () => {
    const pageDSL: PageDSL = {
      type: 'page',
      version: '1.0',
      id: 'test-page',
      name: 'TestPage',
      title: 'Test Page',
      layout: { type: 'grid', columns: 1 },
      components: [
        {
          id: 'input-1',
          type: 'Input',
          props: {
            name: 'username',
            label: '用户名',
            placeholder: '请输入用户名',
          },
        },
      ],
    };

    render(<Renderer dsl={pageDSL} />);

    expect(screen.getByLabelText('用户名')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入用户名')).toBeInTheDocument();
  });

  it('应该渲染多个组件', () => {
    const pageDSL: PageDSL = {
      type: 'page',
      version: '1.0',
      id: 'test-page',
      name: 'TestPage',
      title: 'Test Page',
      layout: { type: 'grid', columns: 2 },
      components: [
        {
          id: 'input-1',
          type: 'Input',
          props: { name: 'field1', label: 'Field 1' },
        },
        {
          id: 'input-2',
          type: 'Input',
          props: { name: 'field2', label: 'Field 2' },
        },
        {
          id: 'select-1',
          type: 'Select',
          props: {
            name: 'status',
            label: 'Status',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ],
          },
        },
      ],
    };

    render(<Renderer dsl={pageDSL} />);

    expect(screen.getByLabelText('Field 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Field 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
  });

  it('应该渲染嵌套布局', () => {
    const pageDSL: PageDSL = {
      type: 'page',
      version: '1.0',
      id: 'test-page',
      name: 'TestPage',
      title: 'Test Page',
      layout: { type: 'grid', columns: 1 },
      components: [
        {
          id: 'container-1',
          type: 'Container',
          props: {
            title: 'User Info',
          },
          children: [
            {
              id: 'input-name',
              type: 'Input',
              props: { name: 'name', label: 'Name' },
            },
            {
              id: 'input-email',
              type: 'Input',
              props: { name: 'email', label: 'Email' },
            },
          ],
        },
      ],
    };

    render(<Renderer dsl={pageDSL} />);

    expect(screen.getByText('User Info')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('应该处理未知组件类型', () => {
    const pageDSL: PageDSL = {
      type: 'page',
      version: '1.0',
      id: 'test-page',
      name: 'TestPage',
      title: 'Test Page',
      layout: { type: 'grid', columns: 1 },
      components: [
        {
          id: 'unknown-1',
          type: 'UnknownComponent',
          props: {},
        },
      ],
    };

    render(<Renderer dsl={pageDSL} />);

    expect(screen.getByText(/Unknown component type/)).toBeInTheDocument();
  });

  it('应该支持条件渲染', () => {
    const pageDSL: PageDSL = {
      type: 'page',
      version: '1.0',
      id: 'test-page',
      name: 'TestPage',
      title: 'Test Page',
      layout: { type: 'grid', columns: 1 },
      components: [
        {
          id: 'input-1',
          type: 'Input',
          props: { name: 'field1', label: 'Field 1' },
          visible: true,
        },
        {
          id: 'input-2',
          type: 'Input',
          props: { name: 'field2', label: 'Field 2' },
          visible: false,
        },
      ],
    };

    render(<Renderer dsl={pageDSL} />);

    expect(screen.getByLabelText('Field 1')).toBeInTheDocument();
    expect(screen.queryByLabelText('Field 2')).not.toBeInTheDocument();
  });
});

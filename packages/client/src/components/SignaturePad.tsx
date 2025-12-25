import React, { useRef, useState, useEffect } from 'react';
import { Button, Space } from 'antd';
import { ClearOutlined, CheckOutlined } from '@ant-design/icons';
import type { ComponentProps } from '../registry';
import { useFormContext } from '../SchemaForm';

/**
 * SignaturePad - 电子签名板
 * 
 * 功能:
 * 1. 基于 Canvas 实现手写签名
 * 2. 生成 Base64 图片
 * 3. 用于票证签发、确认单签名
 */

interface SignaturePadProps extends ComponentProps {
  width?: number;
  height?: number;
  penColor?: string;
  penWidth?: number;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  element,
  width = 400,
  height = 200,
  penColor = '#000',
  penWidth = 2,
}) => {
  const formContext = useFormContext();
  const fieldName = element.props?.name || element.id;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (formContext) {
      formContext.registerField({
        name: fieldName,
        defaultValue: element.props?.defaultValue || null,
        rules: element.props?.rules,
      });
    }
  }, [fieldName, element.props?.defaultValue, element.props?.rules, formContext]);

  const value = formContext?.getFieldValue(fieldName);
  const error = formContext?.errors[fieldName];
  const touched = formContext?.touched[fieldName];

  /**
   * 开始绘制
   */
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const point = getPoint(e);
    
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  /**
   * 绘制中
   */
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const point = getPoint(e);
    
    ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    setIsEmpty(false);
  };

  /**
   * 结束绘制
   */
  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveSignature();
    }
  };

  /**
   * 获取坐标点
   */
  const getPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      // Touch event
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  /**
   * 保存签名
   */
  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    // 转换为 Base64
    const base64 = canvas.toDataURL('image/png');
    formContext?.setFieldValue(fieldName, base64);
  };

  /**
   * 清空签名
   */
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    formContext?.setFieldValue(fieldName, null);
  };

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

      <div
        style={{
          border: touched && error ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
          borderRadius: 4,
          padding: 8,
          backgroundColor: '#fafafa',
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            display: 'block',
            backgroundColor: '#fff',
            cursor: 'crosshair',
            touchAction: 'none',
          }}
        />

        <Space style={{ marginTop: 8 }}>
          <Button
            size="small"
            icon={<ClearOutlined />}
            onClick={clearSignature}
            disabled={isEmpty}
          >
            清空
          </Button>

          {!isEmpty && (
            <span style={{ color: '#52c41a', fontSize: 12 }}>
              <CheckOutlined /> 签名已保存
            </span>
          )}
        </Space>
      </div>

      {touched && error && (
        <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
          {error.message}
        </div>
      )}

      {/* 预览签名 */}
      {value && !isEmpty && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>签名预览:</div>
          <img
            src={value}
            alt="Signature"
            style={{
              maxWidth: '100%',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              backgroundColor: '#fff',
            }}
          />
        </div>
      )}
    </div>
  );
};

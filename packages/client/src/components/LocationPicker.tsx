import React, { useState, useEffect, useRef } from 'react';
import { Button, Space } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import type { ComponentProps } from '../registry';
import { useFormContext } from '../SchemaForm';

/**
 * LocationPicker - 地理位置选择器
 * 
 * 功能:
 * 1. 调用 GPS 获取经纬度
 * 2. 支持电子围栏校验 (防止"假巡检")
 * 3. 显示地址信息
 */

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number; // 精度 (米)
}

interface Fence {
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // 半径 (米)
}

interface LocationPickerProps extends ComponentProps {
  fence?: Fence; // 电子围栏配置
  showMap?: boolean; // 是否显示地图
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ element, fence, showMap = false }) => {
  const formContext = useFormContext();
  const fieldName = element.props?.name || element.id;

  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [fenceError, setFenceError] = useState<string | null>(null);

  useEffect(() => {
    if (formContext) {
      formContext.registerField({
        name: fieldName,
        defaultValue: element.props?.defaultValue || null,
        rules: element.props?.rules,
      });
    }
  }, [fieldName, element.props?.defaultValue, element.props?.rules, formContext]);

  const value = formContext?.getFieldValue(fieldName) as Location | null;
  const error = formContext?.errors[fieldName];
  const touched = formContext?.touched[fieldName];

  /**
   * 计算两点距离 (Haversine 公式)
   */
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371000; // 地球半径 (米)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  /**
   * 校验电子围栏
   */
  const validateFence = (loc: Location): boolean => {
    if (!fence) return true;

    const distance = calculateDistance(
      loc.latitude,
      loc.longitude,
      fence.latitude,
      fence.longitude
    );

    if (distance > fence.radius) {
      setFenceError(`您当前位置距离 ${fence.name} ${Math.round(distance)}米，超出允许范围 ${fence.radius}米`);
      return false;
    }

    setFenceError(null);
    return true;
  };

  /**
   * 获取当前位置
   */
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('您的浏览器不支持地理定位');
      return;
    }

    setLoading(true);
    setFenceError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const loc: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        // 反向地理编码 (获取地址)
        try {
          // 这里可以调用地图 API (如高德、百度) 获取地址
          // 示例: 使用 OpenStreetMap Nominatim API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${loc.latitude}&lon=${loc.longitude}&format=json`
          );
          const data = await response.json();
          loc.address = data.display_name;
        } catch (error) {
          console.error('Failed to get address:', error);
        }

        // 电子围栏校验
        const isValid = validateFence(loc);

        if (isValid) {
          setLocation(loc);
          formContext?.setFieldValue(fieldName, loc);
        }

        setLoading(false);
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('用户拒绝了地理定位请求');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('位置信息不可用');
            break;
          case error.TIMEOUT:
            alert('获取位置超时');
            break;
        }
      },
      {
        enableHighAccuracy: true, // 高精度
        timeout: 10000,
        maximumAge: 0,
      }
    );
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

      <Space direction="vertical" style={{ width: '100%' }}>
        <Button
          icon={<EnvironmentOutlined />}
          onClick={getCurrentLocation}
          loading={loading}
          block
        >
          {loading ? '定位中...' : '获取当前位置'}
        </Button>

        {value && (
          <div
            style={{
              padding: 12,
              backgroundColor: '#f5f5f5',
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            <div><strong>经度:</strong> {value.longitude.toFixed(6)}</div>
            <div><strong>纬度:</strong> {value.latitude.toFixed(6)}</div>
            {value.accuracy && (
              <div><strong>精度:</strong> ±{Math.round(value.accuracy)}米</div>
            )}
            {value.address && (
              <div><strong>地址:</strong> {value.address}</div>
            )}
            {fence && (
              <div style={{ color: '#52c41a', marginTop: 4 }}>
                ✓ 在 {fence.name} 范围内
              </div>
            )}
          </div>
        )}

        {fenceError && (
          <div
            style={{
              padding: 12,
              backgroundColor: '#fff2f0',
              border: '1px solid #ffccc7',
              borderRadius: 4,
              color: '#ff4d4f',
              fontSize: 12,
            }}
          >
            ⚠️ {fenceError}
          </div>
        )}

        {touched && error && (
          <div style={{ color: '#ff4d4f', fontSize: 12 }}>
            {error.message}
          </div>
        )}
      </Space>
    </div>
  );
};

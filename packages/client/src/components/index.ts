import { registry } from '../registry';
import { Button } from './Button';
import { Input } from './Input';
import { Container } from './Container';
import { Text } from './Text';
import { Image } from './Image';
import { Table } from './Table';
import { Grid } from './Grid';
import { Select } from './Select';
import { DatePicker } from './DatePicker';
import { AntdInputAdapter } from './AntdInputAdapter';
import { AntdSelectAdapter } from './AntdSelectAdapter';
import { AntdDatePickerAdapter } from './AntdDatePickerAdapter';
import { UserPicker } from './UserPicker';
import { LocationPicker } from './LocationPicker';
import { SignaturePad } from './SignaturePad';

export { ErrorBoundary } from './ErrorBoundary';
export { VirtualList, VirtualForm } from './VirtualList';

export function registerCoreComponents() {
  // 基础布局组件
  registry.register('Container', Container);
  registry.register('Grid', Grid);
  
  // 基础表单组件
  registry.register('Button', Button);
  registry.register('Input', Input);
  registry.register('Select', Select);
  registry.register('DatePicker', DatePicker);
  
  // 展示组件
  registry.register('Text', Text);
  registry.register('Image', Image);
  registry.register('Table', Table);
  
  // Ant Design 适配组件 (用于表单场景)
  registry.register('AntdInput', AntdInputAdapter);
  registry.register('AntdSelect', AntdSelectAdapter);
  registry.register('AntdDatePicker', AntdDatePickerAdapter);
  
  // 业务组件 (工业/移动端专用)
  registry.register('UserPicker', UserPicker);
  registry.register('LocationPicker', LocationPicker);
  registry.register('SignaturePad', SignaturePad);
}

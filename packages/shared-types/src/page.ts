export type LayoutType = 'default' | 'blank' | 'sidebar' | 'header';

export interface ComponentDefinition {
  id: string;
  type: string; // e.g. "Button", "Table"
  props?: Record<string, any>;
  children?: ComponentDefinition[];
  events?: Record<string, any>; // e.g. { onClick: "submitForm" }
  style?: Record<string, any>;
}

export interface PageDSL {
  id: string;
  version: string;
  name: string;
  layout: LayoutType;
  components: ComponentDefinition[];
  state?: Record<string, any>;
  styles?: Record<string, any>;
}

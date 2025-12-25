/**
 * 模板插值引擎
 * 
 * 支持 {{ }} 语法访问上下文变量
 */

/**
 * 解析模板字符串
 * 
 * @example
 * interpolate('Hello {{ user.name }}', { user: { name: 'John' } })
 * // => 'Hello John'
 */
export function interpolate(template: string, context: Record<string, any>): string {
  if (typeof template !== 'string') {
    return template;
  }

  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, path) => {
    const value = getValueByPath(context, path);
    return value !== undefined ? String(value) : match;
  });
}

/**
 * 根据路径获取对象值
 * 
 * @example
 * getValueByPath({ user: { name: 'John' } }, 'user.name')
 * // => 'John'
 */
function getValueByPath(obj: any, path: string): any {
  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined;
    }
    value = value[key];
  }

  return value;
}

/**
 * 递归插值对象
 */
export function interpolateObject<T = any>(obj: T, context: Record<string, any>): T {
  if (typeof obj === 'string') {
    return interpolate(obj, context) as any;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => interpolateObject(item, context)) as any;
  }

  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = interpolateObject(value, context);
    }
    return result;
  }

  return obj;
}

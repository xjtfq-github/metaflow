export const tenantMiddleware = (tenantId: string) => {
  return async (params, next) => {
    // 自动添加 tenant_id 过滤条件
    if (params.model && (params.action === 'findUnique' || params.action === 'findFirst' || params.action === 'findMany')) {
      if (!params.args) {
        params.args = {};
      }
      if (!params.args.where) {
        params.args.where = {};
      }
      // Only add if model has tenantId field. 
      // In a real app, we should check metadata, but here we assume convention or check specific models.
      // For simplicity, let's assume models other than Tenant need this.
      if (params.model !== 'Tenant') {
         (params.args.where as any).tenantId = tenantId;
      }
    }
    
    // 创建操作自动添加 tenant_id
    if (params.action === 'create') {
      if (params.args.data) {
         if (params.model !== 'Tenant') {
            (params.args.data as any).tenantId = tenantId;
         }
      }
    }

    // Update/Delete also need protection
    if (params.action === 'update' || params.action === 'delete' || params.action === 'updateMany' || params.action === 'deleteMany') {
        if (params.args.where) {
             if (params.model !== 'Tenant') {
                (params.args.where as any).tenantId = tenantId;
             }
        }
    }
    
    return next(params);
  };
};

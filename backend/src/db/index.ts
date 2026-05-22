import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

export const tenantContext = new AsyncLocalStorage<string>();

const basePrisma = new PrismaClient();

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const tenantId = tenantContext.getStore();
        
        // Exclude models that are NOT tenant-specific or don't need injection
        if (model === 'Tenant' || !tenantId) {
          return query(args);
        }

        if (!args) {
          (args as any) = {};
        }

        // Inject tenantId for reads, updates, and deletes
        if (['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany', 'count', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(operation)) {
          (args as any).where = { ...(args as any).where, tenantId };
        }

        // Inject tenantId for creates
        if (['create'].includes(operation)) {
          (args as any).data = { ...(args as any).data, tenantId };
        } else if (['createMany'].includes(operation)) {
          if (Array.isArray((args as any).data)) {
            (args as any).data = (args as any).data.map((d: any) => ({ ...d, tenantId }));
          } else {
            (args as any).data = { ...((args as any).data as any), tenantId };
          }
        } else if (['upsert'].includes(operation)) {
          (args as any).create = { ...(args as any).create, tenantId };
          (args as any).update = { ...(args as any).update, tenantId };
        }

        console.log(`[PRISMA] ${model}.${operation} for tenant: ${tenantId}`);
        // console.log(`[PRISMA ARGS]`, JSON.stringify(args));

        return query(args);
      },
    },
  },
});

// Cast to PrismaClient to avoid complex type signature issues in controllers
export default prisma as unknown as PrismaClient;

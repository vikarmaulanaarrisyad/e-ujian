"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantContext = void 0;
const client_1 = require("@prisma/client");
const async_hooks_1 = require("async_hooks");
exports.tenantContext = new async_hooks_1.AsyncLocalStorage();
const basePrisma = new client_1.PrismaClient();
const prisma = basePrisma.$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                const tenantId = exports.tenantContext.getStore();
                // Exclude models that are NOT tenant-specific or don't need injection
                if (model === 'Tenant' || !tenantId) {
                    return query(args);
                }
                if (!args) {
                    args = {};
                }
                // Inject tenantId for reads, updates, and deletes
                if (['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany', 'count', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(operation)) {
                    args.where = { ...args.where, tenantId };
                }
                // Inject tenantId for creates
                if (['create'].includes(operation)) {
                    args.data = { ...args.data, tenantId };
                }
                else if (['createMany'].includes(operation)) {
                    if (Array.isArray(args.data)) {
                        args.data = args.data.map((d) => ({ ...d, tenantId }));
                    }
                    else {
                        args.data = { ...args.data, tenantId };
                    }
                }
                else if (['upsert'].includes(operation)) {
                    args.create = { ...args.create, tenantId };
                    args.update = { ...args.update, tenantId };
                }
                console.log(`[PRISMA] ${model}.${operation} for tenant: ${tenantId}`);
                // console.log(`[PRISMA ARGS]`, JSON.stringify(args));
                return query(args);
            },
        },
    },
});
// Cast to PrismaClient to avoid complex type signature issues in controllers
exports.default = prisma;

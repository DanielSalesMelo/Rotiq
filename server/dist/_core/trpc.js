"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatcherProcedure = exports.masterAdminProcedure = exports.monitorProcedure = exports.adminProcedure = exports.protectedProcedure = exports.publicProcedure = exports.router = void 0;
const const_1 = require("@shared/const");
const server_1 = require("@trpc/server");
const superjson_1 = __importDefault(require("superjson"));
const t = server_1.initTRPC.context().create({
    transformer: superjson_1.default,
});
exports.router = t.router;
exports.publicProcedure = t.procedure;
// Roles do sistema Rotiq:
// - user: operador básico (adiciona e edita, não deleta)
// - dispatcher: despachante (cria e gerencia viagens)
// - monitor: pode mover para lixeira (soft delete), mas não restaurar
// - admin: acesso total à empresa, pode restaurar da lixeira
// - master_admin: acesso total a todas as empresas
const requireUser = t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user) {
        throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: const_1.UNAUTHED_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
});
exports.protectedProcedure = t.procedure.use(requireUser);
// Admin ou superior (admin, master_admin)
exports.adminProcedure = t.procedure.use(t.middleware(async (opts) => {
    const { ctx, next } = opts;
    const adminRoles = ["admin", "master_admin"];
    if (!ctx.user || !adminRoles.includes(ctx.user.role)) {
        throw new server_1.TRPCError({ code: "FORBIDDEN", message: const_1.NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
}));
// Monitor ou superior — pode fazer soft delete
exports.monitorProcedure = t.procedure.use(t.middleware(async (opts) => {
    const { ctx, next } = opts;
    const monitorRoles = ["monitor", "admin", "master_admin"];
    if (!ctx.user || !monitorRoles.includes(ctx.user.role)) {
        throw new server_1.TRPCError({
            code: "FORBIDDEN",
            message: "Acesso negado. Apenas monitores e administradores podem realizar esta ação.",
        });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
}));
// Master admin apenas
exports.masterAdminProcedure = t.procedure.use(t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "master_admin") {
        throw new server_1.TRPCError({
            code: "FORBIDDEN",
            message: "Acesso negado. Apenas o administrador master pode realizar esta ação.",
        });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
}));
// Despachante ou superior
exports.dispatcherProcedure = t.procedure.use(t.middleware(async (opts) => {
    const { ctx, next } = opts;
    const dispatcherRoles = ["dispatcher", "monitor", "admin", "master_admin"];
    if (!ctx.user || !dispatcherRoles.includes(ctx.user.role)) {
        throw new server_1.TRPCError({
            code: "FORBIDDEN",
            message: "Acesso negado. Apenas despachantes e administradores podem realizar esta ação.",
        });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
}));

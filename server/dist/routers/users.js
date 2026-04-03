"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const trpc_1 = require("../_core/trpc");
const zod_1 = require("zod");
const db_1 = require("../db");
const server_1 = require("@trpc/server");
exports.usersRouter = (0, trpc_1.router)({
    // Listar todos os usuários (apenas para admins)
    listAll: trpc_1.publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user) {
            throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
        }
        if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
            throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        try {
            const allUsers = await (0, db_1.getAllUsers)();
            return allUsers.map(user => ({
                id: user.id,
                name: user.name || "",
                lastName: user.lastName || "",
                email: user.email || "",
                phone: user.phone || "",
                role: user.role,
                status: user.status,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }));
        }
        catch (error) {
            console.error("Erro ao listar usuários:", error);
            throw new server_1.TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao listar usuários" });
        }
    }),
    // Atualizar dados do usuário
    update: trpc_1.publicProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().optional(),
        lastName: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        phone: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
            throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
        }
        if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
            throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        try {
            const updateData = {};
            if (input.name !== undefined)
                updateData.name = input.name;
            if (input.lastName !== undefined)
                updateData.lastName = input.lastName;
            if (input.email !== undefined)
                updateData.email = input.email;
            if (input.phone !== undefined)
                updateData.phone = input.phone;
            await (0, db_1.updateUser)(input.id, updateData);
            return { success: true };
        }
        catch (error) {
            console.error("Erro ao atualizar usuário:", error);
            throw new server_1.TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao atualizar usuário" });
        }
    }),
    // Aprovar usuário (mudar status de pending para approved)
    approve: trpc_1.publicProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
    }))
        .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
            throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
        }
        if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
            throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        try {
            await (0, db_1.updateUser)(input.id, { status: "approved" });
            return { success: true };
        }
        catch (error) {
            console.error("Erro ao aprovar usuário:", error);
            throw new server_1.TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao aprovar usuário" });
        }
    }),
    // Rejeitar usuário (mudar status de pending para rejected)
    reject: trpc_1.publicProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
    }))
        .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
            throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
        }
        if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
            throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        try {
            await (0, db_1.updateUser)(input.id, { status: "rejected" });
            return { success: true };
        }
        catch (error) {
            console.error("Erro ao rejeitar usuário:", error);
            throw new server_1.TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao rejeitar usuário" });
        }
    }),
    // Deletar usuário
    delete: trpc_1.publicProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
    }))
        .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
            throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
        }
        if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
            throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        try {
            await (0, db_1.deleteUser)(input.id);
            return { success: true };
        }
        catch (error) {
            console.error("Erro ao deletar usuário:", error);
            throw new server_1.TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao deletar usuário" });
        }
    }),
});

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getAllUsers, updateUser, deleteUser } from "../db";
import { TRPCError } from "@trpc/server";

export const usersRouter = router({
  // Listar todos os usuários (apenas para admins)
  listAll: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
    }

    if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
    }

    try {
      const allUsers = await getAllUsers();
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
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao listar usuários" });
    }
  }),

  // Atualizar dados do usuário
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
      }

      if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      try {
        const updateData: Record<string, unknown> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.lastName !== undefined) updateData.lastName = input.lastName;
        if (input.email !== undefined) updateData.email = input.email;
        if (input.phone !== undefined) updateData.phone = input.phone;

        await updateUser(input.id, updateData);
        return { success: true };
      } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao atualizar usuário" });
      }
    }),

  // Aprovar usuário (mudar status de pending para approved)
  approve: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
      }

      if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      try {
        await updateUser(input.id, { status: "approved" });
        return { success: true };
      } catch (error) {
        console.error("Erro ao aprovar usuário:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao aprovar usuário" });
      }
    }),

  // Rejeitar usuário (mudar status de pending para rejected)
  reject: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
      }

      if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      try {
        await updateUser(input.id, { status: "rejected" });
        return { success: true };
      } catch (error) {
        console.error("Erro ao rejeitar usuário:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao rejeitar usuário" });
      }
    }),

  // Deletar usuário
  delete: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });
      }

      if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      try {
        await deleteUser(input.id);
        return { success: true };
      } catch (error) {
        console.error("Erro ao deletar usuário:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao deletar usuário" });
      }
    }),
});

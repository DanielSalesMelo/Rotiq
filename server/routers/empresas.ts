import { masterAdminProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { empresas, users } from "../drizzle/schema";
import { eq, and, isNull, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomBytes, randomUUID } from "crypto";

// Gera um código de convite único: 8 caracteres alfanuméricos maiúsculos
function gerarCodigoConvite(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0, O, 1, I para evitar confusão
  let codigo = "";
  const bytes = randomBytes(8);
  for (let i = 0; i < 8; i++) {
    codigo += chars[bytes[i] % chars.length];
  }
  return codigo;
}

// Gera um UUID v4 para identificar a empresa de forma segura
function gerarEmpresaUUID(): string {
  return randomUUID();
}

export const empresasRouter = router({
  // ─── LISTAR TODAS AS EMPRESAS (master_admin) ───────────────────────────────
  list: masterAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

    const lista = await db
      .select()
      .from(empresas)
      .where(isNull(empresas.deletedAt))
      .orderBy(empresas.nome);

    return lista;
  }),

  // ─── OBTER EMPRESA POR ID (admin da empresa ou master_admin) ──────────────
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      // Admin só pode ver sua própria empresa; master_admin vê qualquer uma
      if (ctx.user.role !== "master_admin" && (ctx.user as any).empresaId !== input.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado a esta empresa" });
      }

      const [empresa] = await db
        .select()
        .from(empresas)
        .where(and(eq(empresas.id, input.id), isNull(empresas.deletedAt)))
        .limit(1);

      if (!empresa) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada" });
      }

      return empresa;
    }),

  // ─── CRIAR EMPRESA (master_admin e admin) ───────────────────────────────────
  criar: adminProcedure
    .input(
      z.object({
        nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
        cnpj: z.string().optional(),
        telefone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        endereco: z.string().optional(),
        cidade: z.string().optional(),
        estado: z.string().max(2).optional(),
        tipoEmpresa: z.enum(["independente", "matriz", "filial"]).default("independente"),
        matrizId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      // Admin comum só pode criar filiais da sua empresa
      if (ctx.user.role === "admin" && input.tipoEmpresa === "independente") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admins podem criar apenas filiais de sua empresa. Solicite ao master_admin para criar empresas independentes."
        });
      }

      // Se for admin criando filial, vincular à sua empresa como matriz
      if (ctx.user.role === "admin" && input.tipoEmpresa === "filial") {
        const matrizId = (ctx.user as any).empresaId;
        if (!matrizId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Admin não vinculado a uma empresa. Entre em contato com o master_admin."
          });
        }
        input.matrizId = matrizId;
      }

      // Gerar código de convite único
      let codigoConvite = gerarCodigoConvite();
      // Garantir unicidade do código
      let tentativas = 0;
      while (tentativas < 10) {
        const [existente] = await db
          .select({ id: empresas.id })
          .from(empresas)
          .where(eq(empresas.codigoConvite, codigoConvite))
          .limit(1);
        if (!existente) break;
        codigoConvite = gerarCodigoConvite();
        tentativas++;
      }

      const [novaEmpresa] = await db
        .insert(empresas)
        .values({
          nome: input.nome,
          cnpj: input.cnpj || null,
          telefone: input.telefone || null,
          email: input.email || null,
          endereco: input.endereco || null,
          cidade: input.cidade || null,
          estado: input.estado || null,
          codigoConvite,
          tipoEmpresa: input.tipoEmpresa,
          matrizId: input.matrizId || null,
          ativo: true,
        })
        .returning();

      return {
        success: true,
        empresa: novaEmpresa,
        codigoConvite,
        mensagem: `Empresa criada com sucesso! Código de convite: ${codigoConvite}`,
      };
    }),

    // ─── ATUALIZAR EMPRESA (master_admin apenas) ────────────────────────────
  atualizar: adminProcedure
    .input(
      z.object({
        id: z.number(),
        nome: z.string().min(2).optional(),
        cnpj: z.string().optional(),
        telefone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        endereco: z.string().optional(),
        cidade: z.string().optional(),
        estado: z.string().max(2).optional(),
        ativo: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      // Admin só pode atualizar sua própria empresa
      if (ctx.user.role === "admin" && (ctx.user as any).empresaId !== input.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você só pode atualizar sua própria empresa" });
      }

      const { id, ...dados } = input;
      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      if (dados.nome !== undefined) updateData.nome = dados.nome;
      if (dados.cnpj !== undefined) updateData.cnpj = dados.cnpj;
      if (dados.telefone !== undefined) updateData.telefone = dados.telefone;
      if (dados.email !== undefined) updateData.email = dados.email;
      if (dados.endereco !== undefined) updateData.endereco = dados.endereco;
      if (dados.cidade !== undefined) updateData.cidade = dados.cidade;
      if (dados.estado !== undefined) updateData.estado = dados.estado;
      if (dados.ativo !== undefined) updateData.ativo = dados.ativo;

      await db.update(empresas).set(updateData as any).where(eq(empresas.id, id));

      return { success: true };
    }),

  // ─── REGENERAR CÓDIGO DE CONVITE (master_admin apenas) ────────────────────
  regenerarConvite: masterAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      // Verificar se empresa existe
      const [empresa] = await db
        .select()
        .from(empresas)
        .where(and(eq(empresas.id, input.id), isNull(empresas.deletedAt)))
        .limit(1);

      if (!empresa) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada" });
      }

      // Gerar novo código único
      let novoCodigoConvite = gerarCodigoConvite();
      let tentativas = 0;
      while (tentativas < 10) {
        const [existente] = await db
          .select({ id: empresas.id })
          .from(empresas)
          .where(eq(empresas.codigoConvite, novoCodigoConvite))
          .limit(1);
        if (!existente) break;
        novoCodigoConvite = gerarCodigoConvite();
        tentativas++;
      }

      await db
        .update(empresas)
        .set({ codigoConvite: novoCodigoConvite, updatedAt: new Date() })
        .where(eq(empresas.id, input.id));

      return {
        success: true,
        codigoConvite: novoCodigoConvite,
        mensagem: `Código de convite regenerado: ${novoCodigoConvite}`,
      };
    }),

  // ─── DESATIVAR/ATIVAR EMPRESA (master_admin apenas) ───────────────────────
  toggleAtivo: masterAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      const [empresa] = await db
        .select()
        .from(empresas)
        .where(and(eq(empresas.id, input.id), isNull(empresas.deletedAt)))
        .limit(1);

      if (!empresa) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada" });
      }

      await db
        .update(empresas)
        .set({ ativo: !empresa.ativo, updatedAt: new Date() })
        .where(eq(empresas.id, input.id));

      return {
        success: true,
        ativo: !empresa.ativo,
        mensagem: !empresa.ativo ? "Empresa ativada com sucesso" : "Empresa desativada com sucesso",
      };
    }),

  // ─── DELETAR EMPRESA (master_admin apenas) ────────────────────────────────
  deletar: masterAdminProcedure
    .input(
      z.object({
        id: z.number(),
        motivo: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      await db
        .update(empresas)
        .set({
          deletedAt: new Date(),
          deletedBy: ctx.user.id,
          deleteReason: input.motivo || null,
          ativo: false,
          updatedAt: new Date(),
        })
        .where(eq(empresas.id, input.id));

      return { success: true };
    }),

  // ─── VALIDAR CÓDIGO DE CONVITE (público — usado no cadastro) ──────────────
  validarConvite: protectedProcedure
    .input(z.object({ codigo: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      const codigoUpper = input.codigo.trim().toUpperCase();
      const idNumerico = parseInt(input.codigo);

      const [empresa] = await db
        .select({ id: empresas.id, nome: empresas.nome, codigoConvite: empresas.codigoConvite, ativo: empresas.ativo })
        .from(empresas)
        .where(
          and(
            isNull(empresas.deletedAt),
            eq(empresas.ativo, true),
            !isNaN(idNumerico)
              ? or(eq(empresas.id, idNumerico), eq(empresas.codigoConvite, codigoUpper))
              : eq(empresas.codigoConvite, codigoUpper)
          )
        )
        .limit(1);

      if (!empresa) {
        return { valido: false, empresa: null };
      }

      return {
        valido: true,
        empresa: {
          id: empresa.id,
          nome: empresa.nome,
          codigoConvite: empresa.codigoConvite,
        },
      };
    }),

  // ─── LISTAR USUÁRIOS DE UMA EMPRESA (master_admin ou admin da empresa) ────
  listarUsuarios: protectedProcedure
    .input(z.object({ empresaId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      // Master admin pode ver qualquer empresa; admin só sua empresa; usuário comum só sua empresa
      if (ctx.user.role !== "master_admin" && (ctx.user as any).empresaId !== input.empresaId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você só pode visualizar usuários da sua empresa" });
      }

      const lista = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          status: users.status,
          empresaId: users.empresaId,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.empresaId, input.empresaId));

      return lista;
    }),
});

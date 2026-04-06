import { masterAdminProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { empresas, users } from "../drizzle/schema";
import { eq, and, isNull, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomBytes, randomUUID } from "crypto";

function gerarCodigoConvite(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "";
  const bytes = randomBytes(8);
  for (let i = 0; i < 8; i++) {
    codigo += chars[bytes[i] % chars.length];
  }
  return codigo;
}

function gerarEmpresaUUID(): string {
  return randomUUID();
}

export const empresasRouter = router({
  list: masterAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
    return await db.select().from(empresas).where(isNull(empresas.deletedAt)).orderBy(empresas.nome);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
      if (ctx.user.role !== "master_admin" && (ctx.user as any).empresaId !== input.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const [empresa] = await db.select().from(empresas).where(and(eq(empresas.id, input.id), isNull(empresas.deletedAt))).limit(1);
      if (!empresa) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada" });
      return empresa;
    }),

  validarConvite: protectedProcedure
    .input(z.object({ codigo: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      const codigoUpper = input.codigo.trim().toUpperCase();
      const idNumerico = parseInt(input.codigo);

      const empresa = (await db
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
        .limit(1)
      )[0];

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

  listarUsuarios: protectedProcedure
    .input(z.object({ empresaId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
      if (ctx.user.role !== "master_admin" && (ctx.user as any).empresaId !== input.empresaId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      return await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, status: users.status, empresaId: users.empresaId, createdAt: users.createdAt }).from(users).where(eq(users.empresaId, input.empresaId));
    }),
});

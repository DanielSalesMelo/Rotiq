"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multasRouter = void 0;
const trpc_1 = require("../_core/trpc");
const db_1 = require("../db");
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
const errorHandler_1 = require("../helpers/errorHandler");
exports.multasRouter = (0, trpc_1.router)({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "multas.list");
            const rows = await db.execute((0, drizzle_orm_1.sql) `
          SELECT m.*, 
            v.placa as veiculoPlaca, v.modelo as veiculoModelo,
            f.nome as motoristaNome
          FROM multas m
          LEFT JOIN veiculos v ON v.id = m.veiculoId
          LEFT JOIN funcionarios f ON f.id = m.motoristaId
          WHERE m.empresaId = ${input.empresaId} AND m.deletedAt IS NULL
          ORDER BY m.data DESC
        `);
            return rows[0] ?? [];
        });
    }),
    create: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        empresaId: zod_1.z.number(),
        veiculoId: zod_1.z.number(),
        motoristaId: zod_1.z.number().nullable().optional(),
        data: zod_1.z.string(),
        local: zod_1.z.string().optional(),
        descricao: zod_1.z.string().min(1),
        numeroAuto: zod_1.z.string().optional(),
        pontos: zod_1.z.number().default(0),
        valor: zod_1.z.number().min(0),
        vencimento: zod_1.z.string().optional(),
        status: zod_1.z.enum(["pendente", "pago", "recorrido", "cancelado"]).default("pendente"),
        responsavel: zod_1.z.enum(["motorista", "empresa"]).default("motorista"),
        observacoes: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "multas.create");
            await db.execute((0, drizzle_orm_1.sql) `
          INSERT INTO multas (empresaId, veiculoId, motoristaId, data, local, descricao, numeroAuto, pontos, valor, vencimento, status, responsavel, observacoes)
          VALUES (${input.empresaId}, ${input.veiculoId}, ${input.motoristaId ?? null}, ${input.data}, ${input.local ?? null}, ${input.descricao}, ${input.numeroAuto ?? null}, ${input.pontos}, ${input.valor}, ${input.vencimento ?? null}, ${input.status}, ${input.responsavel}, ${input.observacoes ?? null})
        `);
            return { success: true };
        });
    }),
    updateStatus: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        status: zod_1.z.enum(["pendente", "pago", "recorrido", "cancelado"]),
    }))
        .mutation(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "multas.updateStatus");
            await db.execute((0, drizzle_orm_1.sql) `UPDATE multas SET status = ${input.status} WHERE id = ${input.id}`);
            return { success: true };
        });
    }),
    delete: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number(), userId: zod_1.z.number(), reason: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "multas.delete");
            await db.execute((0, drizzle_orm_1.sql) `UPDATE multas SET deletedAt = NOW(), deletedBy = ${input.userId}, deleteReason = ${input.reason ?? null} WHERE id = ${input.id}`);
            return { success: true };
        });
    }),
    stats: trpc_1.protectedProcedure
        .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "multas.stats");
            const rows = await db.execute((0, drizzle_orm_1.sql) `
          SELECT 
            COUNT(*) as total,
            SUM(valor) as totalValor,
            SUM(pontos) as totalPontos,
            SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
            SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END) as valorPendente
          FROM multas WHERE empresaId = ${input.empresaId} AND deletedAt IS NULL
        `);
            const r = (rows[0] ?? [])[0] ?? {};
            return {
                total: Number(r.total) || 0,
                totalValor: Number(r.totalValor) || 0,
                totalPontos: Number(r.totalPontos) || 0,
                pendentes: Number(r.pendentes) || 0,
                valorPendente: Number(r.valorPendente) || 0,
            };
        });
    }),
});

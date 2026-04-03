"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.veiculosRouter = void 0;
const trpc_1 = require("../_core/trpc");
const db_1 = require("../db");
const schema_1 = require("../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const errorHandler_1 = require("../helpers/errorHandler");
// Apenas placa e tipo são obrigatórios — todo o resto é opcional
const veiculoInput = zod_1.z.object({
    empresaId: zod_1.z.number(),
    placa: zod_1.z.string().min(1, "Placa é obrigatória").max(10).transform(v => v.toUpperCase().trim()),
    tipo: zod_1.z.enum(["van", "toco", "truck", "cavalo", "carreta", "empilhadeira", "paletera", "outro"]),
    cavaloPrincipalId: zod_1.z.number().nullable().optional(),
    marca: zod_1.z.string().max(100).optional(),
    modelo: zod_1.z.string().max(100).optional(),
    ano: zod_1.z.number().min(1900).max(2100).nullable().optional(),
    cor: zod_1.z.string().max(50).optional(),
    renavam: zod_1.z.string().max(20).optional(),
    chassi: zod_1.z.string().max(30).optional(),
    capacidadeCarga: zod_1.z.string().nullable().optional(),
    motoristaId: zod_1.z.number().nullable().optional(),
    ajudanteId: zod_1.z.number().nullable().optional(),
    kmAtual: zod_1.z.number().nullable().optional(),
    mediaConsumo: zod_1.z.string().nullable().optional(),
    vencimentoCrlv: zod_1.z.string().nullable().optional(),
    vencimentoSeguro: zod_1.z.string().nullable().optional(),
    classificacao: zod_1.z.number().min(0).max(5).optional(),
    observacoes: zod_1.z.string().optional(),
});
function parseDate(d) {
    if (!d)
        return null;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
}
exports.veiculosRouter = (0, trpc_1.router)({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        empresaId: zod_1.z.number(),
        tipo: zod_1.z.enum(["van", "toco", "truck", "cavalo", "carreta", "empilhadeira", "paletera", "outro"]).optional(),
        apenasAtivos: zod_1.z.boolean().default(true),
    }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "veiculos.list");
            return db.select().from(schema_1.veiculos)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.veiculos.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.veiculos.deletedAt), input.apenasAtivos ? (0, drizzle_orm_1.eq)(schema_1.veiculos.ativo, true) : undefined, input.tipo ? (0, drizzle_orm_1.eq)(schema_1.veiculos.tipo, input.tipo) : undefined))
                .orderBy(schema_1.veiculos.placa);
        }, "veiculos.list");
    }),
    listCavalos: trpc_1.protectedProcedure
        .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "veiculos.listCavalos");
            return db.select().from(schema_1.veiculos)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.veiculos.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_1.veiculos.tipo, "cavalo"), (0, drizzle_orm_1.eq)(schema_1.veiculos.ativo, true), (0, drizzle_orm_1.isNull)(schema_1.veiculos.deletedAt)))
                .orderBy(schema_1.veiculos.placa);
        }, "veiculos.listCavalos");
    }),
    getById: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "veiculos.getById");
            const rows = await db.select().from(schema_1.veiculos)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.veiculos.id, input.id), (0, drizzle_orm_1.isNull)(schema_1.veiculos.deletedAt)))
                .limit(1);
            return rows[0] ?? null;
        }, "veiculos.getById");
    }),
    create: trpc_1.protectedProcedure
        .input(veiculoInput)
        .mutation(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "veiculos.create");
            const [result] = await db.insert(schema_1.veiculos).values({
                ...input,
                capacidadeCarga: input.capacidadeCarga ?? null,
                mediaConsumo: input.mediaConsumo ?? null,
                vencimentoCrlv: parseDate(input.vencimentoCrlv),
                vencimentoSeguro: parseDate(input.vencimentoSeguro),
                ativo: true,
            });
            return { id: result.insertId };
        }, "veiculos.create");
    }),
    update: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }).merge(veiculoInput.partial()))
        .mutation(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "veiculos.update");
            const { id, ...data } = input;
            await db.update(schema_1.veiculos).set({
                ...data,
                placa: data.placa ? data.placa.toUpperCase().trim() : undefined,
                vencimentoCrlv: data.vencimentoCrlv !== undefined ? parseDate(data.vencimentoCrlv) : undefined,
                vencimentoSeguro: data.vencimentoSeguro !== undefined ? parseDate(data.vencimentoSeguro) : undefined,
                updatedAt: new Date(),
            }).where((0, drizzle_orm_1.eq)(schema_1.veiculos.id, id));
            return { success: true };
        }, "veiculos.update");
    }),
    softDelete: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number(), reason: zod_1.z.string().min(1, "Informe o motivo da exclusão") }))
        .mutation(async ({ input, ctx }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "veiculos.softDelete");
            await db.update(schema_1.veiculos).set({
                deletedAt: new Date(),
                deletedBy: ctx.user.id,
                deleteReason: input.reason,
                ativo: false,
            }).where((0, drizzle_orm_1.eq)(schema_1.veiculos.id, input.id));
            return { success: true };
        }, "veiculos.softDelete");
    }),
    restore: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "veiculos.restore");
            await db.update(schema_1.veiculos).set({
                deletedAt: null,
                deletedBy: null,
                deleteReason: null,
                ativo: true,
            }).where((0, drizzle_orm_1.eq)(schema_1.veiculos.id, input.id));
            return { success: true };
        }, "veiculos.restore");
    }),
    getUltimoKm: trpc_1.protectedProcedure
        .input(zod_1.z.object({ veiculoId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "veiculos.getUltimoKm");
            // Busca o maior KM entre viagens, abastecimentos e odômetro do veículo
            const rows = await db.execute((0, drizzle_orm_1.sql) `
          SELECT GREATEST(
            COALESCE((SELECT MAX(kmChegada) FROM viagens WHERE veiculoId = ${input.veiculoId} AND kmChegada IS NOT NULL), 0),
            COALESCE((SELECT MAX(kmSaida) FROM viagens WHERE veiculoId = ${input.veiculoId} AND kmSaida IS NOT NULL), 0),
            COALESCE((SELECT MAX(kmAtual) FROM abastecimentos WHERE veiculoId = ${input.veiculoId} AND kmAtual IS NOT NULL), 0),
            COALESCE((SELECT kmAtual FROM veiculos WHERE id = ${input.veiculoId}), 0)
          ) as ultimoKm
        `);
            const r = (rows[0] ?? [])[0] ?? {};
            const km = Number(r.ultimoKm) || null;
            return { kmAtual: km };
        }, "veiculos.getUltimoKm");
    }),
    listDeleted: trpc_1.protectedProcedure
        .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "veiculos.listDeleted");
            return db.select().from(schema_1.veiculos)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.veiculos.empresaId, input.empresaId), (0, drizzle_orm_1.isNotNull)(schema_1.veiculos.deletedAt)))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.veiculos.deletedAt));
        }, "veiculos.listDeleted");
    }),
});

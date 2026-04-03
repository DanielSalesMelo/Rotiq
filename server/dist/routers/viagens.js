"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.viagensRouter = void 0;
const trpc_1 = require("../_core/trpc");
const db_1 = require("../db");
const schema_1 = require("../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const errorHandler_1 = require("../helpers/errorHandler");
// Apenas veículo é obrigatório para criar uma viagem — resto pode ser preenchido depois
const viagemInput = zod_1.z.object({
    empresaId: zod_1.z.number(),
    tipo: zod_1.z.enum(["entrega", "viagem"]).optional(),
    veiculoId: zod_1.z.number(),
    cavaloPrincipalId: zod_1.z.number().nullable().optional(),
    motoristaId: zod_1.z.number().nullable().optional(),
    ajudante1Id: zod_1.z.number().nullable().optional(),
    ajudante2Id: zod_1.z.number().nullable().optional(),
    ajudante3Id: zod_1.z.number().nullable().optional(),
    origem: zod_1.z.string().optional(),
    destino: zod_1.z.string().optional(),
    dataSaida: zod_1.z.string().nullable().optional(),
    dataChegada: zod_1.z.string().nullable().optional(),
    kmSaida: zod_1.z.number().nullable().optional(),
    kmChegada: zod_1.z.number().nullable().optional(),
    kmRodado: zod_1.z.number().nullable().optional(),
    descricaoCarga: zod_1.z.string().optional(),
    pesoCarga: zod_1.z.string().nullable().optional(),
    freteTotalIda: zod_1.z.string().nullable().optional(),
    freteTotalVolta: zod_1.z.string().nullable().optional(),
    freteTotal: zod_1.z.string().nullable().optional(),
    adiantamento: zod_1.z.string().nullable().optional(),
    saldoViagem: zod_1.z.string().nullable().optional(),
    totalDespesas: zod_1.z.string().nullable().optional(),
    mediaConsumo: zod_1.z.string().nullable().optional(),
    status: zod_1.z.enum(["planejada", "em_andamento", "concluida", "cancelada"]).optional(),
    observacoes: zod_1.z.string().optional(),
    teveProblema: zod_1.z.boolean().optional(),
    voltouComCarga: zod_1.z.boolean().optional(),
    observacoesChegada: zod_1.z.string().optional(),
    tipoCarga: zod_1.z.string().optional(),
    notaFiscal: zod_1.z.string().optional(),
});
exports.viagensRouter = (0, trpc_1.router)({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        empresaId: zod_1.z.number(),
        status: zod_1.z.enum(["planejada", "em_andamento", "concluida", "cancelada"]).optional(),
        tipo: zod_1.z.enum(["entrega", "viagem"]).optional(),
        limit: zod_1.z.number().default(50),
    }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "viagens.list");
            const rows = await db.select({
                id: schema_1.viagens.id,
                tipo: schema_1.viagens.tipo,
                status: schema_1.viagens.status,
                origem: schema_1.viagens.origem,
                destino: schema_1.viagens.destino,
                dataSaida: schema_1.viagens.dataSaida,
                dataChegada: schema_1.viagens.dataChegada,
                kmSaida: schema_1.viagens.kmSaida,
                kmChegada: schema_1.viagens.kmChegada,
                kmRodado: schema_1.viagens.kmRodado,
                tipoCarga: schema_1.viagens.tipoCarga,
                teveProblema: schema_1.viagens.teveProblema,
                voltouComCarga: schema_1.viagens.voltouComCarga,
                freteTotal: schema_1.viagens.freteTotal,
                totalDespesas: schema_1.viagens.totalDespesas,
                saldoViagem: schema_1.viagens.saldoViagem,
                adiantamento: schema_1.viagens.adiantamento,
                pesoCarga: schema_1.viagens.pesoCarga,
                descricaoCarga: schema_1.viagens.descricaoCarga,
                notaFiscal: schema_1.viagens.notaFiscal,
                createdAt: schema_1.viagens.createdAt,
                motoristaNome: schema_1.funcionarios.nome,
                veiculoPlaca: schema_1.veiculos.placa,
                veiculoTipo: schema_1.veiculos.tipo,
                veiculoCapacidade: schema_1.veiculos.capacidadeCarga,
            }).from(schema_1.viagens)
                .leftJoin(schema_1.funcionarios, (0, drizzle_orm_1.eq)(schema_1.viagens.motoristaId, schema_1.funcionarios.id))
                .leftJoin(schema_1.veiculos, (0, drizzle_orm_1.eq)(schema_1.viagens.veiculoId, schema_1.veiculos.id))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.viagens.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.viagens.deletedAt), input.status ? (0, drizzle_orm_1.eq)(schema_1.viagens.status, input.status) : undefined, input.tipo ? (0, drizzle_orm_1.eq)(schema_1.viagens.tipo, input.tipo) : undefined))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.viagens.dataSaida))
                .limit(input.limit);
            return rows;
        }, "viagens.list");
    }),
    getById: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "viagens.getById");
            const rows = await db.select().from(schema_1.viagens)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.viagens.id, input.id), (0, drizzle_orm_1.isNull)(schema_1.viagens.deletedAt)))
                .limit(1);
            if (!rows[0])
                return null;
            const despesas = await db.select().from(schema_1.despesasViagem)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.despesasViagem.viagemId, input.id), (0, drizzle_orm_1.isNull)(schema_1.despesasViagem.deletedAt)));
            return { ...rows[0], despesas };
        }, "viagens.getById");
    }),
    create: trpc_1.protectedProcedure
        .input(viagemInput)
        .mutation(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "viagens.create");
            const [result] = await db.insert(schema_1.viagens).values({
                ...input,
                dataSaida: input.dataSaida ? new Date(input.dataSaida) : null,
                dataChegada: input.dataChegada ? new Date(input.dataChegada) : null,
                status: input.status ?? "planejada",
            });
            return { id: result.insertId };
        }, "viagens.create");
    }),
    update: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }).merge(viagemInput.partial()))
        .mutation(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "viagens.update");
            const { id, ...data } = input;
            await db.update(schema_1.viagens).set({
                ...data,
                dataSaida: data.dataSaida !== undefined ? (data.dataSaida ? new Date(data.dataSaida) : null) : undefined,
                dataChegada: data.dataChegada !== undefined ? (data.dataChegada ? new Date(data.dataChegada) : null) : undefined,
                updatedAt: new Date(),
            }).where((0, drizzle_orm_1.eq)(schema_1.viagens.id, id));
            return { success: true };
        }, "viagens.update");
    }),
    updateStatus: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        status: zod_1.z.enum(["planejada", "em_andamento", "concluida", "cancelada"]),
        kmChegada: zod_1.z.number().optional(),
        dataChegada: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "viagens.updateStatus");
            await db.update(schema_1.viagens).set({
                status: input.status,
                kmChegada: input.kmChegada,
                dataChegada: input.dataChegada ? new Date(input.dataChegada) : undefined,
                updatedAt: new Date(),
            }).where((0, drizzle_orm_1.eq)(schema_1.viagens.id, input.id));
            return { success: true };
        }, "viagens.updateStatus");
    }),
    softDelete: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number(), reason: zod_1.z.string().min(1, "Informe o motivo da exclusão") }))
        .mutation(async ({ input, ctx }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "viagens.softDelete");
            await db.update(schema_1.viagens).set({
                deletedAt: new Date(),
                deletedBy: ctx.user.id,
                deleteReason: input.reason,
            }).where((0, drizzle_orm_1.eq)(schema_1.viagens.id, input.id));
            return { success: true };
        }, "viagens.softDelete");
    }),
    restore: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "viagens.restore");
            await db.update(schema_1.viagens).set({
                deletedAt: null,
                deletedBy: null,
                deleteReason: null,
            }).where((0, drizzle_orm_1.eq)(schema_1.viagens.id, input.id));
            return { success: true };
        }, "viagens.restore");
    }),
    listDeleted: trpc_1.protectedProcedure
        .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "viagens.listDeleted");
            return db.select().from(schema_1.viagens)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.viagens.empresaId, input.empresaId), (0, drizzle_orm_1.isNotNull)(schema_1.viagens.deletedAt)))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.viagens.deletedAt));
        }, "viagens.listDeleted");
    }),
    // Despesas da viagem
    addDespesa: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        viagemId: zod_1.z.number(),
        empresaId: zod_1.z.number(),
        tipo: zod_1.z.enum(["combustivel", "pedagio", "borracharia", "estacionamento", "oficina", "telefone", "descarga", "diaria", "alimentacao", "outro"]),
        descricao: zod_1.z.string().optional(),
        valor: zod_1.z.string(),
        data: zod_1.z.string().optional(),
        comprovante: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "viagens.addDespesa");
            const [result] = await db.insert(schema_1.despesasViagem).values({
                ...input,
                data: input.data ? new Date(input.data) : null,
            });
            // Atualizar total de despesas na viagem
            const totalRows = await db.select({
                total: (0, drizzle_orm_1.sql) `SUM(${schema_1.despesasViagem.valor})`,
            }).from(schema_1.despesasViagem)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.despesasViagem.viagemId, input.viagemId), (0, drizzle_orm_1.isNull)(schema_1.despesasViagem.deletedAt)));
            const novoTotal = String(Number(totalRows[0]?.total) || 0);
            await db.update(schema_1.viagens).set({ totalDespesas: novoTotal, updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.viagens.id, input.viagemId));
            return { id: result.insertId };
        }, "viagens.addDespesa");
    }),
    // Veículos em viagem (status em_andamento) com motorista vinculado
    veiculosEmViagem: trpc_1.protectedProcedure
        .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "viagens.veiculosEmViagem");
            const rows = await db.select({
                veiculoId: schema_1.viagens.veiculoId,
                motoristaId: schema_1.viagens.motoristaId,
                veiculoPlaca: schema_1.veiculos.placa,
                motoristaNome: schema_1.funcionarios.nome,
                origem: schema_1.viagens.origem,
                destino: schema_1.viagens.destino,
            }).from(schema_1.viagens)
                .leftJoin(schema_1.veiculos, (0, drizzle_orm_1.eq)(schema_1.viagens.veiculoId, schema_1.veiculos.id))
                .leftJoin(schema_1.funcionarios, (0, drizzle_orm_1.eq)(schema_1.viagens.motoristaId, schema_1.funcionarios.id))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.viagens.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_1.viagens.status, "em_andamento"), (0, drizzle_orm_1.isNull)(schema_1.viagens.deletedAt)));
            return rows;
        }, "viagens.veiculosEmViagem");
    }),
    // Resumo financeiro para dashboard
    resumoFinanceiro: trpc_1.protectedProcedure
        .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "viagens.resumoFinanceiro");
            const rows = await db.select({
                status: schema_1.viagens.status,
                totalFrete: (0, drizzle_orm_1.sql) `SUM(${schema_1.viagens.freteTotal})`,
                totalDespesas: (0, drizzle_orm_1.sql) `SUM(${schema_1.viagens.totalDespesas})`,
                totalSaldo: (0, drizzle_orm_1.sql) `SUM(${schema_1.viagens.saldoViagem})`,
                quantidade: (0, drizzle_orm_1.sql) `COUNT(*)`,
            }).from(schema_1.viagens)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.viagens.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.viagens.deletedAt)))
                .groupBy(schema_1.viagens.status);
            return rows;
        }, "viagens.resumoFinanceiro");
    }),
});

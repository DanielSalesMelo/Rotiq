"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.financeiroRouter = void 0;
const trpc_1 = require("../_core/trpc");
const db_1 = require("../db");
const schema_1 = require("../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const errorHandler_1 = require("../helpers/errorHandler");
const server_1 = require("@trpc/server");
function parseDate(d) {
    if (!d)
        return null;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
}
exports.financeiroRouter = (0, trpc_1.router)({
    // ─── CONTAS A PAGAR ───────────────────────────────────────────────────────
    pagar: (0, trpc_1.router)({
        list: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            empresaId: zod_1.z.number(),
            status: zod_1.z.enum(["pendente", "pago", "vencido", "cancelado"]).optional(),
            limit: zod_1.z.number().default(50),
        }))
            .query(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "financeiro.pagar.list");
                return db.select().from(schema_1.contasPagar)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contasPagar.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.contasPagar.deletedAt), input.status ? (0, drizzle_orm_1.eq)(schema_1.contasPagar.status, input.status) : undefined))
                    .orderBy(schema_1.contasPagar.dataVencimento)
                    .limit(input.limit);
            }, "financeiro.pagar.list");
        }),
        create: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            empresaId: zod_1.z.number(),
            descricao: zod_1.z.string().min(1, "Descrição é obrigatória"),
            categoria: zod_1.z.enum(["combustivel", "manutencao", "salario", "freelancer", "pedagio", "seguro", "ipva", "licenciamento", "pneu", "outro"]),
            valor: zod_1.z.string(),
            dataVencimento: zod_1.z.string(),
            dataPagamento: zod_1.z.string().nullable().optional(),
            status: zod_1.z.enum(["pendente", "pago", "vencido", "cancelado"]).default("pendente"),
            fornecedor: zod_1.z.string().optional(),
            notaFiscal: zod_1.z.string().optional(),
            veiculoId: zod_1.z.number().nullable().optional(),
            funcionarioId: zod_1.z.number().nullable().optional(),
            viagemId: zod_1.z.number().nullable().optional(),
            observacoes: zod_1.z.string().optional(),
        }))
            .mutation(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "financeiro.pagar.create");
                const [result] = await db.insert(schema_1.contasPagar).values({
                    ...input,
                    dataVencimento: new Date(input.dataVencimento),
                    dataPagamento: parseDate(input.dataPagamento),
                });
                return { id: result.insertId };
            }, "financeiro.pagar.create");
        }),
        update: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            id: zod_1.z.number(),
            descricao: zod_1.z.string().optional(),
            valor: zod_1.z.string().optional(),
            dataVencimento: zod_1.z.string().optional(),
            dataPagamento: zod_1.z.string().nullable().optional(),
            status: zod_1.z.enum(["pendente", "pago", "vencido", "cancelado"]).optional(),
            observacoes: zod_1.z.string().optional(),
        }))
            .mutation(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "financeiro.pagar.update");
                const { id, dataVencimento, dataPagamento, ...rest } = input;
                await db.update(schema_1.contasPagar).set({
                    ...rest,
                    ...(dataVencimento ? { dataVencimento: new Date(dataVencimento) } : {}),
                    ...(dataPagamento !== undefined ? { dataPagamento: parseDate(dataPagamento) } : {}),
                    updatedAt: new Date(),
                }).where((0, drizzle_orm_1.eq)(schema_1.contasPagar.id, id));
                return { success: true };
            }, "financeiro.pagar.update");
        }),
        softDelete: trpc_1.protectedProcedure
            .input(zod_1.z.object({ id: zod_1.z.number(), reason: zod_1.z.string().min(1, "Informe o motivo") }))
            .mutation(async ({ input, ctx }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "financeiro.pagar.softDelete");
                await db.update(schema_1.contasPagar).set({
                    deletedAt: new Date(),
                    deletedBy: ctx.user.id,
                    deleteReason: input.reason,
                }).where((0, drizzle_orm_1.eq)(schema_1.contasPagar.id, input.id));
                return { success: true };
            }, "financeiro.pagar.softDelete");
        }),
        resumo: trpc_1.protectedProcedure
            .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
            .query(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "financeiro.pagar.resumo");
                const hoje = new Date();
                const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                const inicioMesStr = inicioMes.toISOString();
                const rows = await db.select({
                    status: schema_1.contasPagar.status,
                    total: (0, drizzle_orm_1.sql) `SUM(${schema_1.contasPagar.valor})`,
                })
                    .from(schema_1.contasPagar)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contasPagar.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.contasPagar.deletedAt)))
                    .groupBy(schema_1.contasPagar.status);
                const result = { pendente: 0, vencido: 0, pagoMes: 0 };
                rows.forEach(r => {
                    if (r.status === "pendente")
                        result.pendente = Number(r.total) || 0;
                    if (r.status === "vencido")
                        result.vencido = Number(r.total) || 0;
                });
                const pagoRows = await db.select({ total: (0, drizzle_orm_1.sql) `SUM(${schema_1.contasPagar.valor})` })
                    .from(schema_1.contasPagar)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contasPagar.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_1.contasPagar.status, "pago"), (0, drizzle_orm_1.gte)(schema_1.contasPagar.dataPagamento, (0, drizzle_orm_1.sql) `${inicioMesStr}::timestamp`), (0, drizzle_orm_1.isNull)(schema_1.contasPagar.deletedAt)));
                result.pagoMes = Number(pagoRows[0]?.total) || 0;
                return result;
            }, "financeiro.pagar.resumo");
        }),
    }),
    // ─── CONTAS A RECEBER ─────────────────────────────────────────────────────
    receber: (0, trpc_1.router)({
        list: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            empresaId: zod_1.z.number(),
            status: zod_1.z.enum(["pendente", "recebido", "vencido", "cancelado"]).optional(),
            limit: zod_1.z.number().default(50),
        }))
            .query(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "financeiro.receber.list");
                return db.select().from(schema_1.contasReceber)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contasReceber.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.contasReceber.deletedAt), input.status ? (0, drizzle_orm_1.eq)(schema_1.contasReceber.status, input.status) : undefined))
                    .orderBy(schema_1.contasReceber.dataVencimento)
                    .limit(input.limit);
            }, "financeiro.receber.list");
        }),
        create: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            empresaId: zod_1.z.number(),
            descricao: zod_1.z.string().min(1, "Descrição é obrigatória"),
            categoria: zod_1.z.enum(["frete", "cte", "devolucao", "outro"]),
            valor: zod_1.z.string(),
            dataVencimento: zod_1.z.string(),
            dataRecebimento: zod_1.z.string().nullable().optional(),
            status: zod_1.z.enum(["pendente", "recebido", "vencido", "cancelado"]).default("pendente"),
            cliente: zod_1.z.string().optional(),
            notaFiscal: zod_1.z.string().optional(),
            cteNumero: zod_1.z.string().optional(),
            viagemId: zod_1.z.number().nullable().optional(),
            observacoes: zod_1.z.string().optional(),
        }))
            .mutation(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "financeiro.receber.create");
                const [result] = await db.insert(schema_1.contasReceber).values({
                    ...input,
                    dataVencimento: new Date(input.dataVencimento),
                    dataRecebimento: parseDate(input.dataRecebimento),
                });
                return { id: result.insertId };
            }, "financeiro.receber.create");
        }),
        update: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            id: zod_1.z.number(),
            descricao: zod_1.z.string().optional(),
            valor: zod_1.z.string().optional(),
            dataVencimento: zod_1.z.string().optional(),
            dataRecebimento: zod_1.z.string().nullable().optional(),
            status: zod_1.z.enum(["pendente", "recebido", "vencido", "cancelado"]).optional(),
            observacoes: zod_1.z.string().optional(),
        }))
            .mutation(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "financeiro.receber.update");
                const { id, dataVencimento, dataRecebimento, ...rest } = input;
                await db.update(schema_1.contasReceber).set({
                    ...rest,
                    ...(dataVencimento ? { dataVencimento: new Date(dataVencimento) } : {}),
                    ...(dataRecebimento !== undefined ? { dataRecebimento: parseDate(dataRecebimento) } : {}),
                    updatedAt: new Date(),
                }).where((0, drizzle_orm_1.eq)(schema_1.contasReceber.id, id));
                return { success: true };
            }, "financeiro.receber.update");
        }),
        softDelete: trpc_1.protectedProcedure
            .input(zod_1.z.object({ id: zod_1.z.number(), reason: zod_1.z.string().min(1, "Informe o motivo") }))
            .mutation(async ({ input, ctx }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "financeiro.receber.softDelete");
                await db.update(schema_1.contasReceber).set({
                    deletedAt: new Date(),
                    deletedBy: ctx.user.id,
                    deleteReason: input.reason,
                }).where((0, drizzle_orm_1.eq)(schema_1.contasReceber.id, input.id));
                return { success: true };
            }, "financeiro.receber.softDelete");
        }),
        resumo: trpc_1.protectedProcedure
            .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
            .query(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "financeiro.receber.resumo");
                const hoje = new Date();
                const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                const inicioMesStr = inicioMes.toISOString();
                const rows = await db.select({
                    status: schema_1.contasReceber.status,
                    total: (0, drizzle_orm_1.sql) `SUM(${schema_1.contasReceber.valor})`,
                })
                    .from(schema_1.contasReceber)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contasReceber.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.contasReceber.deletedAt)))
                    .groupBy(schema_1.contasReceber.status);
                const result = { pendente: 0, vencido: 0, recebidoMes: 0 };
                rows.forEach(r => {
                    if (r.status === "pendente")
                        result.pendente = Number(r.total) || 0;
                    if (r.status === "vencido")
                        result.vencido = Number(r.total) || 0;
                });
                const recRows = await db.select({ total: (0, drizzle_orm_1.sql) `SUM(${schema_1.contasReceber.valor})` })
                    .from(schema_1.contasReceber)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contasReceber.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_1.contasReceber.status, "recebido"), (0, drizzle_orm_1.gte)(schema_1.contasReceber.dataRecebimento, (0, drizzle_orm_1.sql) `${inicioMesStr}::timestamp`), (0, drizzle_orm_1.isNull)(schema_1.contasReceber.deletedAt)));
                result.recebidoMes = Number(recRows[0]?.total) || 0;
                return result;
            }, "financeiro.receber.resumo");
        }),
    }),
    // ─── ADIANTAMENTOS ────────────────────────────────────────────────────────
    adiantamentos: (0, trpc_1.router)({
        list: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            empresaId: zod_1.z.number(),
            funcionarioId: zod_1.z.number().optional(),
            status: zod_1.z.enum(["pendente", "acertado", "cancelado"]).optional(),
            limit: zod_1.z.number().default(50),
        }))
            .query(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "financeiro.adiantamentos.list");
                return db.select().from(schema_1.adiantamentos)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.adiantamentos.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.adiantamentos.deletedAt), input.funcionarioId ? (0, drizzle_orm_1.eq)(schema_1.adiantamentos.funcionarioId, input.funcionarioId) : undefined, input.status ? (0, drizzle_orm_1.eq)(schema_1.adiantamentos.status, input.status) : undefined))
                    .orderBy((0, drizzle_orm_1.desc)(schema_1.adiantamentos.data))
                    .limit(input.limit);
            }, "financeiro.adiantamentos.list");
        }),
        create: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            empresaId: zod_1.z.number(),
            funcionarioId: zod_1.z.number(),
            viagemId: zod_1.z.number().nullable().optional(),
            valor: zod_1.z.string(),
            formaPagamento: zod_1.z.enum(["dinheiro", "pix", "transferencia", "cartao"]),
            data: zod_1.z.string(),
            observacoes: zod_1.z.string().optional(),
        }))
            .mutation(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "financeiro.adiantamentos.create");
                const [result] = await db.insert(schema_1.adiantamentos).values({
                    ...input,
                    data: new Date(input.data),
                    status: "pendente",
                });
                return { id: result.insertId };
            }, "financeiro.adiantamentos.create");
        }),
        acertar: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            id: zod_1.z.number(),
            valorAcertado: zod_1.z.string(),
            dataAcerto: zod_1.z.string(),
            observacoes: zod_1.z.string().optional(),
        }))
            .mutation(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "financeiro.adiantamentos.acertar");
                const rows = await db.select().from(schema_1.adiantamentos)
                    .where((0, drizzle_orm_1.eq)(schema_1.adiantamentos.id, input.id)).limit(1);
                const adiant = rows[0];
                if (!adiant) {
                    throw new server_1.TRPCError({ code: "NOT_FOUND", message: "Adiantamento não encontrado." });
                }
                const saldo = Number(adiant.valor) - Number(input.valorAcertado);
                await db.update(schema_1.adiantamentos).set({
                    valorAcertado: input.valorAcertado,
                    dataAcerto: new Date(input.dataAcerto),
                    saldo: String(saldo),
                    status: "acertado",
                    observacoes: input.observacoes,
                    updatedAt: new Date(),
                }).where((0, drizzle_orm_1.eq)(schema_1.adiantamentos.id, input.id));
                return { success: true, saldo };
            }, "financeiro.adiantamentos.acertar");
        }),
        softDelete: trpc_1.protectedProcedure
            .input(zod_1.z.object({ id: zod_1.z.number(), reason: zod_1.z.string().min(1, "Informe o motivo") }))
            .mutation(async ({ input, ctx }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "financeiro.adiantamentos.softDelete");
                await db.update(schema_1.adiantamentos).set({
                    deletedAt: new Date(),
                    deletedBy: ctx.user.id,
                    deleteReason: input.reason,
                }).where((0, drizzle_orm_1.eq)(schema_1.adiantamentos.id, input.id));
                return { success: true };
            }, "financeiro.adiantamentos.softDelete");
        }),
    }),
    // ─── DASHBOARD FINANCEIRO COMPLETO ────────────────────────────────────────
    dashboard: trpc_1.protectedProcedure
        .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "financeiro.dashboard");
            const hoje = new Date();
            const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
            const em7dias = new Date(hoje);
            em7dias.setDate(hoje.getDate() + 7);
            // Contas a pagar por status
            const pagarRows = await db.select({
                status: schema_1.contasPagar.status,
                total: (0, drizzle_orm_1.sql) `SUM(${schema_1.contasPagar.valor})`,
                count: (0, drizzle_orm_1.sql) `COUNT(*)`,
            })
                .from(schema_1.contasPagar)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contasPagar.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.contasPagar.deletedAt)))
                .groupBy(schema_1.contasPagar.status);
            // Contas a receber por status
            const receberRows = await db.select({
                status: schema_1.contasReceber.status,
                total: (0, drizzle_orm_1.sql) `SUM(${schema_1.contasReceber.valor})`,
                count: (0, drizzle_orm_1.sql) `COUNT(*)`,
            })
                .from(schema_1.contasReceber)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contasReceber.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.contasReceber.deletedAt)))
                .groupBy(schema_1.contasReceber.status);
            // Adiantamentos pendentes
            const adiantRows = await db.select({
                total: (0, drizzle_orm_1.sql) `SUM(${schema_1.adiantamentos.valor})`,
                count: (0, drizzle_orm_1.sql) `COUNT(*)`,
            })
                .from(schema_1.adiantamentos)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.adiantamentos.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_1.adiantamentos.status, "pendente"), (0, drizzle_orm_1.isNull)(schema_1.adiantamentos.deletedAt)));
            // Resumo de viagens concluídas no mês (fretes recebidos vs despesas)
            const viagensRows = await db.select({
                totalFrete: (0, drizzle_orm_1.sql) `SUM(${schema_1.viagens.freteTotal})`,
                totalDespesas: (0, drizzle_orm_1.sql) `SUM(${schema_1.viagens.totalDespesas})`,
                totalSaldo: (0, drizzle_orm_1.sql) `SUM(${schema_1.viagens.saldoViagem})`,
                quantidade: (0, drizzle_orm_1.sql) `COUNT(*)`,
            })
                .from(schema_1.viagens)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.viagens.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_1.viagens.status, "concluida"), (0, drizzle_orm_1.gte)(schema_1.viagens.dataChegada, inicioMes), (0, drizzle_orm_1.isNull)(schema_1.viagens.deletedAt)));
            const totalPagar = Number(pagarRows.find(r => r.status === "pendente")?.total) || 0;
            const totalVencido = Number(pagarRows.find(r => r.status === "vencido")?.total) || 0;
            const totalReceber = Number(receberRows.find(r => r.status === "pendente")?.total) || 0;
            const totalAdiantamentos = Number(adiantRows[0]?.total) || 0;
            const totalFreteMes = Number(viagensRows[0]?.totalFrete) || 0;
            const totalDespesasMes = Number(viagensRows[0]?.totalDespesas) || 0;
            const lucroMes = totalFreteMes - totalDespesasMes;
            const margemMes = totalFreteMes > 0 ? (lucroMes / totalFreteMes) * 100 : 0;
            return {
                // Contas
                totalPagar,
                totalVencido,
                totalReceber,
                totalAdiantamentos,
                saldoProjetado: totalReceber - totalPagar,
                // Viagens do mês
                totalFreteMes,
                totalDespesasMes,
                lucroMes: Math.round(lucroMes * 100) / 100,
                margemMes: Math.round(margemMes * 10) / 10,
                viagensConcluidas: Number(viagensRows[0]?.quantidade) || 0,
                // Alertas
                alertas: {
                    contasVencidas: Number(pagarRows.find(r => r.status === "vencido")?.count) || 0,
                    adiantamentosPendentes: Number(adiantRows[0]?.count) || 0,
                    contasReceberVencidas: Number(receberRows.find(r => r.status === "vencido")?.count) || 0,
                },
            };
        }, "financeiro.dashboard");
    }),
});

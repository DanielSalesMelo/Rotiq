"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.frotaRouter = void 0;
const trpc_1 = require("../_core/trpc");
const db_1 = require("../db");
const schema_1 = require("../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const errorHandler_1 = require("../helpers/errorHandler");
function parseDate(d) {
    if (!d)
        return null;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
}
exports.frotaRouter = (0, trpc_1.router)({
    // ─── ABASTECIMENTOS ───────────────────────────────────────────────────────
    abastecimentos: (0, trpc_1.router)({
        list: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            empresaId: zod_1.z.number(),
            veiculoId: zod_1.z.number().optional(),
            motoristaId: zod_1.z.number().optional(),
            tipoCombustivel: zod_1.z.enum(["diesel", "arla", "gasolina", "etanol", "gas", "outro"]).optional(),
            tipoAbastecimento: zod_1.z.enum(["interno", "externo"]).optional(),
            dataInicio: zod_1.z.string().optional(),
            dataFim: zod_1.z.string().optional(),
            busca: zod_1.z.string().optional(),
            limit: zod_1.z.number().default(100),
        }))
            .query(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "abastecimentos.list");
                return db.select().from(schema_1.abastecimentos)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.abastecimentos.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.abastecimentos.deletedAt), input.veiculoId ? (0, drizzle_orm_1.eq)(schema_1.abastecimentos.veiculoId, input.veiculoId) : undefined, input.motoristaId ? (0, drizzle_orm_1.eq)(schema_1.abastecimentos.motoristaId, input.motoristaId) : undefined, input.tipoCombustivel ? (0, drizzle_orm_1.eq)(schema_1.abastecimentos.tipoCombustivel, input.tipoCombustivel) : undefined, input.tipoAbastecimento ? (0, drizzle_orm_1.eq)(schema_1.abastecimentos.tipoAbastecimento, input.tipoAbastecimento) : undefined, input.dataInicio ? (0, drizzle_orm_1.gte)(schema_1.abastecimentos.data, new Date(input.dataInicio)) : undefined, input.dataFim ? (0, drizzle_orm_1.lte)(schema_1.abastecimentos.data, new Date(input.dataFim + "T23:59:59")) : undefined))
                    .orderBy((0, drizzle_orm_1.desc)(schema_1.abastecimentos.data))
                    .limit(input.limit);
            }, "abastecimentos.list");
        }),
        create: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            empresaId: zod_1.z.number(),
            veiculoId: zod_1.z.number(),
            motoristaId: zod_1.z.number().nullable().optional(),
            data: zod_1.z.string(),
            tipoCombustivel: zod_1.z.enum(["diesel", "arla", "gasolina", "etanol", "gas", "outro"]),
            quantidade: zod_1.z.string(),
            valorUnitario: zod_1.z.string().nullable().optional(),
            valorTotal: zod_1.z.string().nullable().optional(),
            kmAtual: zod_1.z.number().nullable().optional(),
            kmRodado: zod_1.z.number().nullable().optional(),
            mediaConsumo: zod_1.z.string().nullable().optional(),
            local: zod_1.z.string().optional(),
            tipoAbastecimento: zod_1.z.enum(["interno", "externo"]).default("interno"),
            notaFiscal: zod_1.z.string().optional(),
            observacoes: zod_1.z.string().optional(),
        }))
            .mutation(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "abastecimentos.create");
                const [result] = await db.insert(schema_1.abastecimentos).values({
                    ...input,
                    data: new Date(input.data),
                });
                return { id: result.insertId };
            }, "abastecimentos.create");
        }),
        update: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            id: zod_1.z.number(),
            data: zod_1.z.string().optional(),
            tipoCombustivel: zod_1.z.enum(["diesel", "arla", "gasolina", "etanol", "gas", "outro"]).optional(),
            quantidade: zod_1.z.string().optional(),
            valorUnitario: zod_1.z.string().nullable().optional(),
            valorTotal: zod_1.z.string().nullable().optional(),
            kmAtual: zod_1.z.number().nullable().optional(),
            local: zod_1.z.string().optional(),
            observacoes: zod_1.z.string().optional(),
        }))
            .mutation(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "abastecimentos.update");
                const { id, data, ...rest } = input;
                await db.update(schema_1.abastecimentos).set({
                    ...rest,
                    ...(data ? { data: new Date(data) } : {}),
                    updatedAt: new Date(),
                }).where((0, drizzle_orm_1.eq)(schema_1.abastecimentos.id, id));
                return { success: true };
            }, "abastecimentos.update");
        }),
        softDelete: trpc_1.protectedProcedure
            .input(zod_1.z.object({ id: zod_1.z.number(), reason: zod_1.z.string().min(1, "Informe o motivo") }))
            .mutation(async ({ input, ctx }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "abastecimentos.softDelete");
                await db.update(schema_1.abastecimentos).set({
                    deletedAt: new Date(),
                    deletedBy: ctx.user.id,
                    deleteReason: input.reason,
                }).where((0, drizzle_orm_1.eq)(schema_1.abastecimentos.id, input.id));
                return { success: true };
            }, "abastecimentos.softDelete");
        }),
        resumoPorVeiculo: trpc_1.protectedProcedure
            .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
            .query(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "abastecimentos.resumoPorVeiculo");
                return db.select({
                    veiculoId: schema_1.abastecimentos.veiculoId,
                    totalLitros: (0, drizzle_orm_1.sql) `SUM(${schema_1.abastecimentos.quantidade})`,
                    totalValor: (0, drizzle_orm_1.sql) `SUM(${schema_1.abastecimentos.valorTotal})`,
                    mediaConsumo: (0, drizzle_orm_1.sql) `AVG(${schema_1.abastecimentos.mediaConsumo})`,
                    ultimoAbastecimento: (0, drizzle_orm_1.sql) `MAX(${schema_1.abastecimentos.data})`,
                })
                    .from(schema_1.abastecimentos)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.abastecimentos.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.abastecimentos.deletedAt)))
                    .groupBy(schema_1.abastecimentos.veiculoId);
            }, "abastecimentos.resumoPorVeiculo");
        }),
        // Preço médio do diesel nos últimos 30 dias (para calculadora)
        precioMedioDiesel: trpc_1.protectedProcedure
            .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
            .query(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "abastecimentos.precioMedioDiesel");
                const trintaDiasAtras = new Date();
                trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
                const rows = await db.select({
                    media: (0, drizzle_orm_1.sql) `AVG(${schema_1.abastecimentos.valorUnitario})`,
                })
                    .from(schema_1.abastecimentos)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.abastecimentos.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_1.abastecimentos.tipoCombustivel, "diesel"), (0, drizzle_orm_1.isNull)(schema_1.abastecimentos.deletedAt), (0, drizzle_orm_1.gte)(schema_1.abastecimentos.data, trintaDiasAtras)));
                return { precioMedio: Number(rows[0]?.media) || 6.5 }; // fallback R$6,50
            }, "abastecimentos.precioMedioDiesel");
        }),
    }),
    // ─── MANUTENÇÕES ──────────────────────────────────────────────────────────
    manutencoes: (0, trpc_1.router)({
        list: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            empresaId: zod_1.z.number(),
            veiculoId: zod_1.z.number().optional(),
            tipo: zod_1.z.enum(["preventiva", "corretiva", "revisao", "pneu", "eletrica", "funilaria", "outro"]).optional(),
            dataInicio: zod_1.z.string().optional(),
            dataFim: zod_1.z.string().optional(),
            busca: zod_1.z.string().optional(),
            limit: zod_1.z.number().default(100),
        }))
            .query(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "manutencoes.list");
                return db.select().from(schema_1.manutencoes)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.manutencoes.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.manutencoes.deletedAt), input.veiculoId ? (0, drizzle_orm_1.eq)(schema_1.manutencoes.veiculoId, input.veiculoId) : undefined, input.tipo ? (0, drizzle_orm_1.eq)(schema_1.manutencoes.tipo, input.tipo) : undefined, input.dataInicio ? (0, drizzle_orm_1.gte)(schema_1.manutencoes.data, new Date(input.dataInicio)) : undefined, input.dataFim ? (0, drizzle_orm_1.lte)(schema_1.manutencoes.data, new Date(input.dataFim + "T23:59:59")) : undefined))
                    .orderBy((0, drizzle_orm_1.desc)(schema_1.manutencoes.data))
                    .limit(input.limit);
            }, "manutencoes.list");
        }),
        create: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            empresaId: zod_1.z.number(),
            veiculoId: zod_1.z.number(),
            data: zod_1.z.string(),
            tipo: zod_1.z.enum(["preventiva", "corretiva", "revisao", "pneu", "eletrica", "funilaria", "outro"]),
            descricao: zod_1.z.string().min(1, "Descrição é obrigatória"),
            empresa: zod_1.z.string().optional(),
            valor: zod_1.z.string().nullable().optional(),
            kmAtual: zod_1.z.number().nullable().optional(),
            proximaManutencaoKm: zod_1.z.number().nullable().optional(),
            proximaManutencaoData: zod_1.z.string().nullable().optional(),
            notaFiscal: zod_1.z.string().optional(),
            observacoes: zod_1.z.string().optional(),
        }))
            .mutation(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "manutencoes.create");
                const [result] = await db.insert(schema_1.manutencoes).values({
                    ...input,
                    data: new Date(input.data),
                    proximaManutencaoData: parseDate(input.proximaManutencaoData),
                });
                return { id: result.insertId };
            }, "manutencoes.create");
        }),
        update: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            id: zod_1.z.number(),
            data: zod_1.z.string().optional(),
            tipo: zod_1.z.enum(["preventiva", "corretiva", "revisao", "pneu", "eletrica", "funilaria", "outro"]).optional(),
            descricao: zod_1.z.string().optional(),
            empresa: zod_1.z.string().optional(),
            valor: zod_1.z.string().nullable().optional(),
            kmAtual: zod_1.z.number().nullable().optional(),
            observacoes: zod_1.z.string().optional(),
        }))
            .mutation(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "manutencoes.update");
                const { id, data, ...rest } = input;
                await db.update(schema_1.manutencoes).set({
                    ...rest,
                    ...(data ? { data: new Date(data) } : {}),
                    updatedAt: new Date(),
                }).where((0, drizzle_orm_1.eq)(schema_1.manutencoes.id, id));
                return { success: true };
            }, "manutencoes.update");
        }),
        softDelete: trpc_1.protectedProcedure
            .input(zod_1.z.object({ id: zod_1.z.number(), reason: zod_1.z.string().min(1, "Informe o motivo") }))
            .mutation(async ({ input, ctx }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "manutencoes.softDelete");
                await db.update(schema_1.manutencoes).set({
                    deletedAt: new Date(),
                    deletedBy: ctx.user.id,
                    deleteReason: input.reason,
                }).where((0, drizzle_orm_1.eq)(schema_1.manutencoes.id, input.id));
                return { success: true };
            }, "manutencoes.softDelete");
        }),
        totalPorVeiculo: trpc_1.protectedProcedure
            .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
            .query(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "manutencoes.totalPorVeiculo");
                return db.select({
                    veiculoId: schema_1.manutencoes.veiculoId,
                    totalValor: (0, drizzle_orm_1.sql) `SUM(${schema_1.manutencoes.valor})`,
                    quantidade: (0, drizzle_orm_1.sql) `COUNT(*)`,
                    ultimaManutencao: (0, drizzle_orm_1.sql) `MAX(${schema_1.manutencoes.data})`,
                })
                    .from(schema_1.manutencoes)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.manutencoes.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.manutencoes.deletedAt)))
                    .groupBy(schema_1.manutencoes.veiculoId);
            }, "manutencoes.totalPorVeiculo");
        }),
    }),
    // ─── CONTROLE TANQUE ──────────────────────────────────────────────────────
    tanque: (0, trpc_1.router)({
        list: trpc_1.protectedProcedure
            .input(zod_1.z.object({ empresaId: zod_1.z.number(), limit: zod_1.z.number().default(50) }))
            .query(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "tanque.list");
                return db.select().from(schema_1.controleTanque)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.controleTanque.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.controleTanque.deletedAt)))
                    .orderBy((0, drizzle_orm_1.desc)(schema_1.controleTanque.data))
                    .limit(input.limit);
            }, "tanque.list");
        }),
        saldoAtual: trpc_1.protectedProcedure
            .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
            .query(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "tanque.saldoAtual");
                const rows = await db.select({
                    tipo: schema_1.controleTanque.tipo,
                    saldo: (0, drizzle_orm_1.sql) `SUM(CASE WHEN ${schema_1.controleTanque.operacao} = 'entrada' THEN ${schema_1.controleTanque.quantidade} ELSE -${schema_1.controleTanque.quantidade} END)`,
                })
                    .from(schema_1.controleTanque)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.controleTanque.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.controleTanque.deletedAt)))
                    .groupBy(schema_1.controleTanque.tipo);
                const result = { diesel: 0, arla: 0 };
                rows.forEach(r => {
                    if (r.tipo === "diesel")
                        result.diesel = Number(r.saldo) || 0;
                    if (r.tipo === "arla")
                        result.arla = Number(r.saldo) || 0;
                });
                return result;
            }, "tanque.saldoAtual");
        }),
        create: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            empresaId: zod_1.z.number(),
            tipo: zod_1.z.enum(["diesel", "arla"]),
            data: zod_1.z.string(),
            operacao: zod_1.z.enum(["entrada", "saida"]),
            quantidade: zod_1.z.string(),
            valorUnitario: zod_1.z.string().nullable().optional(),
            valorTotal: zod_1.z.string().nullable().optional(),
            fornecedor: zod_1.z.string().optional(),
            notaFiscal: zod_1.z.string().optional(),
            veiculoId: zod_1.z.number().nullable().optional(),
            motoristaId: zod_1.z.number().nullable().optional(),
            observacoes: zod_1.z.string().optional(),
        }))
            .mutation(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "tanque.create");
                const [result] = await db.insert(schema_1.controleTanque).values({
                    ...input,
                    data: new Date(input.data),
                });
                return { id: result.insertId };
            }, "tanque.create");
        }),
        // Custo médio ponderado do tanque
        custoMedio: trpc_1.protectedProcedure
            .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
            .query(async ({ input }) => {
            return (0, errorHandler_1.safeDb)(async () => {
                const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "tanque.custoMedio");
                // Buscar todas as entradas (compras) com valor unitário
                const entradas = await db.select()
                    .from(schema_1.controleTanque)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.controleTanque.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_1.controleTanque.operacao, "entrada"), (0, drizzle_orm_1.isNull)(schema_1.controleTanque.deletedAt), (0, drizzle_orm_1.isNotNull)(schema_1.controleTanque.valorUnitario)))
                    .orderBy(schema_1.controleTanque.data);
                // Calcular custo médio ponderado por tipo
                const calcMedia = (tipo) => {
                    const items = entradas.filter(e => e.tipo === tipo);
                    let saldoQtd = 0;
                    let saldoValor = 0;
                    const historico = [];
                    for (const item of items) {
                        const qtd = Number(item.quantidade) || 0;
                        const valUnit = Number(item.valorUnitario) || 0;
                        const valTotal = qtd * valUnit;
                        saldoQtd += qtd;
                        saldoValor += valTotal;
                        const custoMedioAtual = saldoQtd > 0 ? saldoValor / saldoQtd : 0;
                        historico.push({
                            data: String(item.data),
                            quantidade: qtd,
                            valorUnitario: valUnit,
                            valorTotal: valTotal,
                            custoMedio: Math.round(custoMedioAtual * 1000) / 1000,
                            fornecedor: item.fornecedor,
                        });
                    }
                    // Descontar saídas do saldo (mas não altera custo médio)
                    return {
                        custoMedio: saldoQtd > 0 ? Math.round((saldoValor / saldoQtd) * 1000) / 1000 : 0,
                        totalComprado: Math.round(saldoQtd * 100) / 100,
                        totalInvestido: Math.round(saldoValor * 100) / 100,
                        ultimaCompra: items.length > 0 ? {
                            data: String(items[items.length - 1].data),
                            valorUnitario: Number(items[items.length - 1].valorUnitario) || 0,
                            fornecedor: items[items.length - 1].fornecedor,
                        } : null,
                        historicoCompras: historico.slice(-20), // últimas 20 compras
                    };
                };
                return {
                    diesel: calcMedia("diesel"),
                    arla: calcMedia("arla"),
                };
            }, "tanque.custoMedio");
        }),
    }),
    // ─── CALCULADORA DE VIAGEM ────────────────────────────────────────────────
    calcularCustoViagem: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        empresaId: zod_1.z.number(),
        veiculoId: zod_1.z.number(),
        distanciaKm: zod_1.z.number().min(1, "Distância deve ser maior que zero"),
        freteTotal: zod_1.z.number().min(0),
        diasViagem: zod_1.z.number().min(1).default(1),
        // Ajudantes para calcular diárias
        ajudante1Id: zod_1.z.number().nullable().optional(),
        ajudante2Id: zod_1.z.number().nullable().optional(),
        ajudante3Id: zod_1.z.number().nullable().optional(),
        // Custos extras estimados
        pedagioEstimado: zod_1.z.number().default(0),
        outrosCustos: zod_1.z.number().default(0),
        // Preço do diesel (se não informado, usa média dos últimos 30 dias)
        precoDiesel: zod_1.z.number().nullable().optional(),
    }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "frota.calcularCustoViagem");
            // 1. Buscar dados do veículo (média de consumo)
            const veiculoRows = await db.select({
                mediaConsumo: schema_1.veiculos.mediaConsumo,
                tipo: schema_1.veiculos.tipo,
            }).from(schema_1.veiculos).where((0, drizzle_orm_1.eq)(schema_1.veiculos.id, input.veiculoId)).limit(1);
            const veiculo = veiculoRows[0];
            const mediaConsumo = Number(veiculo?.mediaConsumo) || 3.5; // fallback 3,5 km/l
            // 2. Preço do diesel: usa o informado ou calcula média dos últimos 30 dias
            let precoDiesel = input.precoDiesel;
            if (!precoDiesel) {
                const trintaDiasAtras = new Date();
                trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
                const precoRows = await db.select({
                    media: (0, drizzle_orm_1.sql) `AVG(${schema_1.abastecimentos.valorUnitario})`,
                }).from(schema_1.abastecimentos)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.abastecimentos.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_1.abastecimentos.tipoCombustivel, "diesel"), (0, drizzle_orm_1.isNull)(schema_1.abastecimentos.deletedAt), (0, drizzle_orm_1.gte)(schema_1.abastecimentos.data, trintaDiasAtras)));
                precoDiesel = Number(precoRows[0]?.media) || 6.5;
            }
            // 3. Calcular custo de combustível
            const litrosNecessarios = input.distanciaKm / mediaConsumo;
            const custoCombustivel = litrosNecessarios * precoDiesel;
            // 4. Calcular diárias do motorista (buscar valor do veículo → motorista padrão)
            let custoDiariasMotorista = 0;
            const veiculoComMotorista = await db.select({
                motoristaId: schema_1.veiculos.motoristaId,
            }).from(schema_1.veiculos).where((0, drizzle_orm_1.eq)(schema_1.veiculos.id, input.veiculoId)).limit(1);
            if (veiculoComMotorista[0]?.motoristaId) {
                const motoristaRows = await db.select({
                    valorDiaria: schema_1.funcionarios.valorDiaria,
                    tipoCobranca: schema_1.funcionarios.tipoCobranca,
                }).from(schema_1.funcionarios).where((0, drizzle_orm_1.eq)(schema_1.funcionarios.id, veiculoComMotorista[0].motoristaId)).limit(1);
                const motorista = motoristaRows[0];
                if (motorista?.tipoCobranca === "diaria" && motorista.valorDiaria) {
                    custoDiariasMotorista = Number(motorista.valorDiaria) * input.diasViagem;
                }
            }
            // 5. Calcular diárias dos ajudantes
            let custoDiariasAjudantes = 0;
            const ajudanteIds = [input.ajudante1Id, input.ajudante2Id, input.ajudante3Id].filter(Boolean);
            for (const ajId of ajudanteIds) {
                const ajRows = await db.select({
                    valorDiaria: schema_1.funcionarios.valorDiaria,
                    tipoCobranca: schema_1.funcionarios.tipoCobranca,
                }).from(schema_1.funcionarios).where((0, drizzle_orm_1.eq)(schema_1.funcionarios.id, ajId)).limit(1);
                const aj = ajRows[0];
                if (aj?.tipoCobranca === "diaria" && aj.valorDiaria) {
                    custoDiariasAjudantes += Number(aj.valorDiaria) * input.diasViagem;
                }
            }
            // 6. Totais e margem
            const custoTotal = custoCombustivel + custoDiariasMotorista + custoDiariasAjudantes + input.pedagioEstimado + input.outrosCustos;
            const lucroEstimado = input.freteTotal - custoTotal;
            const margemPercent = input.freteTotal > 0 ? (lucroEstimado / input.freteTotal) * 100 : 0;
            // 7. Classificação da viagem
            let classificacao;
            if (margemPercent >= 30)
                classificacao = "otimo";
            else if (margemPercent >= 15)
                classificacao = "bom";
            else if (margemPercent >= 0)
                classificacao = "atencao";
            else
                classificacao = "prejuizo";
            return {
                // Inputs usados
                distanciaKm: input.distanciaKm,
                freteTotal: input.freteTotal,
                diasViagem: input.diasViagem,
                mediaConsumoVeiculo: mediaConsumo,
                precoDieselUsado: precoDiesel,
                // Custos detalhados
                litrosNecessarios: Math.round(litrosNecessarios * 10) / 10,
                custoCombustivel: Math.round(custoCombustivel * 100) / 100,
                custoDiariasMotorista: Math.round(custoDiariasMotorista * 100) / 100,
                custoDiariasAjudantes: Math.round(custoDiariasAjudantes * 100) / 100,
                pedagioEstimado: input.pedagioEstimado,
                outrosCustos: input.outrosCustos,
                // Resultado
                custoTotal: Math.round(custoTotal * 100) / 100,
                lucroEstimado: Math.round(lucroEstimado * 100) / 100,
                margemPercent: Math.round(margemPercent * 10) / 10,
                classificacao,
            };
        }, "frota.calcularCustoViagem");
    }),
    // ─── SIMULAÇÕES DE VIAGEM ─────────────────────────────────────────────────
    listSimulacoes: trpc_1.protectedProcedure
        .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "frota.listSimulacoes");
            const rows = await db.execute((0, drizzle_orm_1.sql) `
          SELECT * FROM simulacoes_viagem
          WHERE empresaId = ${input.empresaId}
          ORDER BY createdAt DESC
          LIMIT 50
        `);
            return (rows[0] ?? []);
        }, "frota.listSimulacoes");
    }),
    salvarSimulacao: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        empresaId: zod_1.z.number(),
        veiculoId: zod_1.z.number().optional(),
        descricao: zod_1.z.string().min(1),
        origem: zod_1.z.string().optional(),
        destino: zod_1.z.string().optional(),
        distanciaKm: zod_1.z.number(),
        valorFrete: zod_1.z.number(),
        custoTotal: zod_1.z.number(),
        margemBruta: zod_1.z.number(),
        margemPct: zod_1.z.number(),
        detalhes: zod_1.z.string().optional(),
        observacoes: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input, ctx }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "frota.salvarSimulacao");
            await db.execute((0, drizzle_orm_1.sql) `
          INSERT INTO simulacoes_viagem
            (empresaId, veiculoId, descricao, origem, destino, distanciaKm, valorFrete, custoTotal, margemBruta, margemPct, detalhes, observacoes, createdBy)
          VALUES
            (${input.empresaId}, ${input.veiculoId ?? null}, ${input.descricao}, ${input.origem ?? null}, ${input.destino ?? null},
             ${input.distanciaKm}, ${input.valorFrete}, ${input.custoTotal}, ${input.margemBruta}, ${input.margemPct},
             ${input.detalhes ?? null}, ${input.observacoes ?? null}, ${ctx.user?.name ?? null})
        `);
            return { success: true };
        }, "frota.salvarSimulacao");
    }),
});

"use strict";
/**
 * Router de Custos Operacionais — Rotiq
 *
 * Calcula o custo REAL de operação de cada veículo considerando:
 * - Combustível (abastecimentos reais)
 * - Manutenções (preventivas e corretivas)
 * - Custos fixos (seguro, IPVA, licenciamento)
 * - Pneus (rateados por km)
 * - Diárias de motoristas e ajudantes
 *
 * Também gerencia alertas de manutenção preventiva por km.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.custosRouter = void 0;
const trpc_1 = require("../_core/trpc");
const db_1 = require("../db");
const schema_1 = require("../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const errorHandler_1 = require("../helpers/errorHandler");
exports.custosRouter = (0, trpc_1.router)({
    /**
     * Custo por km de um veículo em um período.
     * Considera: combustível + manutenções + custos fixos rateados.
     */
    custoPorKm: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        empresaId: zod_1.z.number(),
        veiculoId: zod_1.z.number(),
        dataInicio: zod_1.z.string().optional(), // ISO date string
        dataFim: zod_1.z.string().optional(),
    }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "custos.custoPorKm");
            const dataInicio = input.dataInicio ? new Date(input.dataInicio) : new Date(new Date().getFullYear(), 0, 1);
            const dataFim = input.dataFim ? new Date(input.dataFim) : new Date();
            // 1. Combustível no período
            const combustivelRows = await db.select({
                totalLitros: (0, drizzle_orm_1.sql) `SUM(${schema_1.abastecimentos.quantidade})`,
                totalValor: (0, drizzle_orm_1.sql) `SUM(${schema_1.abastecimentos.valorTotal})`,
                mediaConsumo: (0, drizzle_orm_1.sql) `AVG(${schema_1.abastecimentos.mediaConsumo})`,
            }).from(schema_1.abastecimentos)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.abastecimentos.veiculoId, input.veiculoId), (0, drizzle_orm_1.eq)(schema_1.abastecimentos.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.abastecimentos.deletedAt), (0, drizzle_orm_1.gte)(schema_1.abastecimentos.data, dataInicio), (0, drizzle_orm_1.lte)(schema_1.abastecimentos.data, dataFim)));
            const custoCombustivel = Number(combustivelRows[0]?.totalValor) || 0;
            const mediaConsumo = Number(combustivelRows[0]?.mediaConsumo) || 0;
            // 2. Manutenções no período (preventivas + corretivas + pneus)
            const manutRows = await db.select({
                tipo: schema_1.manutencoes.tipo,
                totalValor: (0, drizzle_orm_1.sql) `SUM(${schema_1.manutencoes.valor})`,
                quantidade: (0, drizzle_orm_1.sql) `COUNT(*)`,
            }).from(schema_1.manutencoes)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.manutencoes.veiculoId, input.veiculoId), (0, drizzle_orm_1.eq)(schema_1.manutencoes.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.manutencoes.deletedAt), (0, drizzle_orm_1.gte)(schema_1.manutencoes.data, dataInicio), (0, drizzle_orm_1.lte)(schema_1.manutencoes.data, dataFim)))
                .groupBy(schema_1.manutencoes.tipo);
            const custoManutencoes = manutRows.reduce((sum, r) => sum + (Number(r.totalValor) || 0), 0);
            const custoPneus = Number(manutRows.find(r => r.tipo === "pneu")?.totalValor) || 0;
            const custoPreventiva = Number(manutRows.find(r => r.tipo === "preventiva")?.totalValor) || 0;
            const custoCorretiva = Number(manutRows.find(r => r.tipo === "corretiva")?.totalValor) || 0;
            // 3. Custos fixos do veículo no período (seguro, IPVA, licenciamento)
            const custosFixosRows = await db.select({
                categoria: schema_1.contasPagar.categoria,
                totalValor: (0, drizzle_orm_1.sql) `SUM(${schema_1.contasPagar.valor})`,
            }).from(schema_1.contasPagar)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contasPagar.veiculoId, input.veiculoId), (0, drizzle_orm_1.eq)(schema_1.contasPagar.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.contasPagar.deletedAt), (0, drizzle_orm_1.gte)(schema_1.contasPagar.dataVencimento, dataInicio), (0, drizzle_orm_1.lte)(schema_1.contasPagar.dataVencimento, dataFim)))
                .groupBy(schema_1.contasPagar.categoria);
            const custoSeguro = Number(custosFixosRows.find(r => r.categoria === "seguro")?.totalValor) || 0;
            const custoIpva = Number(custosFixosRows.find(r => r.categoria === "ipva")?.totalValor) || 0;
            const custoLicenciamento = Number(custosFixosRows.find(r => r.categoria === "licenciamento")?.totalValor) || 0;
            const custoFixoTotal = custoSeguro + custoIpva + custoLicenciamento;
            // 4. KM rodado no período (via viagens concluídas)
            const kmRows = await db.select({
                kmTotal: (0, drizzle_orm_1.sql) `SUM(${schema_1.viagens.kmRodado})`,
                quantidadeViagens: (0, drizzle_orm_1.sql) `COUNT(*)`,
            }).from(schema_1.viagens)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.viagens.veiculoId, input.veiculoId), (0, drizzle_orm_1.eq)(schema_1.viagens.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_1.viagens.status, "concluida"), (0, drizzle_orm_1.isNull)(schema_1.viagens.deletedAt), (0, drizzle_orm_1.gte)(schema_1.viagens.dataSaida, dataInicio), (0, drizzle_orm_1.lte)(schema_1.viagens.dataSaida, dataFim)));
            const kmRodado = Number(kmRows[0]?.kmTotal) || 0;
            const quantidadeViagens = Number(kmRows[0]?.quantidadeViagens) || 0;
            // 5. Custo total e custo por km
            const custoTotal = custoCombustivel + custoManutencoes + custoFixoTotal;
            const custoPorKm = kmRodado > 0 ? custoTotal / kmRodado : 0;
            return {
                periodo: { dataInicio: dataInicio.toISOString(), dataFim: dataFim.toISOString() },
                kmRodado,
                quantidadeViagens,
                mediaConsumo,
                // Detalhamento dos custos
                custos: {
                    combustivel: Math.round(custoCombustivel * 100) / 100,
                    manutencaoPreventiva: Math.round(custoPreventiva * 100) / 100,
                    manutencaoCorretiva: Math.round(custoCorretiva * 100) / 100,
                    pneus: Math.round(custoPneus * 100) / 100,
                    outrasManutencoes: Math.round((custoManutencoes - custoPreventiva - custoCorretiva - custoPneus) * 100) / 100,
                    seguro: Math.round(custoSeguro * 100) / 100,
                    ipva: Math.round(custoIpva * 100) / 100,
                    licenciamento: Math.round(custoLicenciamento * 100) / 100,
                    total: Math.round(custoTotal * 100) / 100,
                },
                custoPorKm: Math.round(custoPorKm * 100) / 100,
                // Participação percentual de cada custo
                participacao: custoTotal > 0 ? {
                    combustivel: Math.round((custoCombustivel / custoTotal) * 1000) / 10,
                    manutencoes: Math.round((custoManutencoes / custoTotal) * 1000) / 10,
                    fixos: Math.round((custoFixoTotal / custoTotal) * 1000) / 10,
                } : { combustivel: 0, manutencoes: 0, fixos: 0 },
            };
        }, "custos.custoPorKm");
    }),
    /**
     * Custo real de uma viagem específica.
     * Considera combustível consumido, despesas registradas e diárias.
     */
    custoRealViagem: trpc_1.protectedProcedure
        .input(zod_1.z.object({ viagemId: zod_1.z.number(), empresaId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "custos.custoRealViagem");
            // Dados da viagem
            const viagemRows = await db.select().from(schema_1.viagens)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.viagens.id, input.viagemId), (0, drizzle_orm_1.isNull)(schema_1.viagens.deletedAt)))
                .limit(1);
            const viagem = viagemRows[0];
            if (!viagem)
                return null;
            // Abastecimentos vinculados à viagem (pelo período dataSaida → dataChegada)
            let custoCombustivel = 0;
            if (viagem.dataSaida && viagem.dataChegada) {
                const combRows = await db.select({
                    total: (0, drizzle_orm_1.sql) `SUM(${schema_1.abastecimentos.valorTotal})`,
                    litros: (0, drizzle_orm_1.sql) `SUM(${schema_1.abastecimentos.quantidade})`,
                }).from(schema_1.abastecimentos)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.abastecimentos.veiculoId, viagem.veiculoId), (0, drizzle_orm_1.eq)(schema_1.abastecimentos.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.abastecimentos.deletedAt), (0, drizzle_orm_1.gte)(schema_1.abastecimentos.data, viagem.dataSaida), (0, drizzle_orm_1.lte)(schema_1.abastecimentos.data, viagem.dataChegada)));
                custoCombustivel = Number(combRows[0]?.total) || 0;
            }
            // Custo de manutenção rateado por km (custo médio por km × km da viagem)
            const kmViagem = Number(viagem.kmRodado) || 0;
            const manutRows = await db.select({
                totalValor: (0, drizzle_orm_1.sql) `SUM(${schema_1.manutencoes.valor})`,
                kmTotal: (0, drizzle_orm_1.sql) `SUM(${schema_1.manutencoes.kmAtual})`,
            }).from(schema_1.manutencoes)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.manutencoes.veiculoId, viagem.veiculoId), (0, drizzle_orm_1.eq)(schema_1.manutencoes.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.manutencoes.deletedAt)));
            const custoManutPorKm = Number(manutRows[0]?.kmTotal) > 0
                ? (Number(manutRows[0]?.totalValor) || 0) / Number(manutRows[0]?.kmTotal)
                : 0;
            const custoManutRateado = custoManutPorKm * kmViagem;
            // Diárias dos funcionários
            const diasViagem = viagem.dataSaida && viagem.dataChegada
                ? Math.ceil((viagem.dataChegada.getTime() - viagem.dataSaida.getTime()) / (1000 * 60 * 60 * 24)) || 1
                : 1;
            let custoDiarias = 0;
            const funcIds = [viagem.motoristaId, viagem.ajudante1Id, viagem.ajudante2Id, viagem.ajudante3Id].filter(Boolean);
            for (const fId of funcIds) {
                const fRows = await db.select({
                    valorDiaria: schema_1.funcionarios.valorDiaria,
                    tipoCobranca: schema_1.funcionarios.tipoCobranca,
                }).from(schema_1.funcionarios).where((0, drizzle_orm_1.eq)(schema_1.funcionarios.id, fId)).limit(1);
                const f = fRows[0];
                if (f?.tipoCobranca === "diaria" && f.valorDiaria) {
                    custoDiarias += Number(f.valorDiaria) * diasViagem;
                }
            }
            // Despesas registradas na viagem
            const totalDespesasRegistradas = Number(viagem.totalDespesas) || 0;
            const freteTotal = Number(viagem.freteTotal) || 0;
            // Custo total real
            const custoTotalReal = custoCombustivel + custoManutRateado + custoDiarias + totalDespesasRegistradas;
            const lucroReal = freteTotal - custoTotalReal;
            const margemReal = freteTotal > 0 ? (lucroReal / freteTotal) * 100 : 0;
            let classificacao;
            if (margemReal >= 30)
                classificacao = "otimo";
            else if (margemReal >= 15)
                classificacao = "bom";
            else if (margemReal >= 0)
                classificacao = "atencao";
            else
                classificacao = "prejuizo";
            return {
                viagemId: input.viagemId,
                kmRodado: kmViagem,
                diasViagem,
                freteTotal,
                custos: {
                    combustivel: Math.round(custoCombustivel * 100) / 100,
                    manutencaoRateada: Math.round(custoManutRateado * 100) / 100,
                    diarias: Math.round(custoDiarias * 100) / 100,
                    despesasRegistradas: Math.round(totalDespesasRegistradas * 100) / 100,
                    total: Math.round(custoTotalReal * 100) / 100,
                },
                lucroReal: Math.round(lucroReal * 100) / 100,
                margemReal: Math.round(margemReal * 10) / 10,
                classificacao,
            };
        }, "custos.custoRealViagem");
    }),
    /**
     * Alertas de manutenção preventiva por km.
     * Retorna veículos que estão próximos ou ultrapassaram o km programado.
     */
    alertasManutencao: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        empresaId: zod_1.z.number(),
        margemAlertaKm: zod_1.z.number().default(500), // alertar quando faltar X km
    }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "custos.alertasManutencao");
            // Buscar veículos com próxima manutenção programada por km
            const veiculosRows = await db.select({
                id: schema_1.veiculos.id,
                placa: schema_1.veiculos.placa,
                tipo: schema_1.veiculos.tipo,
                kmAtual: schema_1.veiculos.kmAtual,
            }).from(schema_1.veiculos)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.veiculos.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_1.veiculos.ativo, true), (0, drizzle_orm_1.isNull)(schema_1.veiculos.deletedAt)));
            const alertas = [];
            for (const v of veiculosRows) {
                if (!v.kmAtual)
                    continue;
                // Buscar última manutenção com próximo km programado
                const ultimaManut = await db.select({
                    proximaManutencaoKm: schema_1.manutencoes.proximaManutencaoKm,
                    proximaManutencaoData: schema_1.manutencoes.proximaManutencaoData,
                    tipo: schema_1.manutencoes.tipo,
                    data: schema_1.manutencoes.data,
                }).from(schema_1.manutencoes)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.manutencoes.veiculoId, v.id), (0, drizzle_orm_1.eq)(schema_1.manutencoes.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.manutencoes.deletedAt)))
                    .orderBy((0, drizzle_orm_1.desc)(schema_1.manutencoes.data))
                    .limit(5);
                for (const m of ultimaManut) {
                    if (!m.proximaManutencaoKm)
                        continue;
                    const kmRestante = m.proximaManutencaoKm - Number(v.kmAtual);
                    const vencida = kmRestante < 0;
                    const proximaDeVencer = kmRestante >= 0 && kmRestante <= input.margemAlertaKm;
                    if (vencida || proximaDeVencer) {
                        alertas.push({
                            veiculoId: v.id,
                            placa: v.placa,
                            tipo: v.tipo,
                            kmAtual: Number(v.kmAtual),
                            tipoManutencao: m.tipo,
                            proximaManutencaoKm: m.proximaManutencaoKm,
                            kmRestante,
                            vencida,
                            proximaManutencaoData: m.proximaManutencaoData,
                            urgencia: vencida ? "critica" : kmRestante <= 200 ? "alta" : "media",
                        });
                    }
                }
            }
            return alertas.sort((a, b) => a.kmRestante - b.kmRestante);
        }, "custos.alertasManutencao");
    }),
    /**
     * Comparativo de custo por km entre todos os veículos da frota.
     * Útil para identificar veículos com custo acima da média.
     */
    comparativoCustoPorKm: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        empresaId: zod_1.z.number(),
        meses: zod_1.z.number().default(3), // últimos N meses
    }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "custos.comparativoCustoPorKm");
            const dataInicio = new Date();
            dataInicio.setMonth(dataInicio.getMonth() - input.meses);
            // Custo de combustível por veículo
            const combRows = await db.select({
                veiculoId: schema_1.abastecimentos.veiculoId,
                totalCombustivel: (0, drizzle_orm_1.sql) `SUM(${schema_1.abastecimentos.valorTotal})`,
                totalLitros: (0, drizzle_orm_1.sql) `SUM(${schema_1.abastecimentos.quantidade})`,
            }).from(schema_1.abastecimentos)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.abastecimentos.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.abastecimentos.deletedAt), (0, drizzle_orm_1.gte)(schema_1.abastecimentos.data, dataInicio)))
                .groupBy(schema_1.abastecimentos.veiculoId);
            // Custo de manutenção por veículo
            const manutRows = await db.select({
                veiculoId: schema_1.manutencoes.veiculoId,
                totalManutencao: (0, drizzle_orm_1.sql) `SUM(${schema_1.manutencoes.valor})`,
            }).from(schema_1.manutencoes)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.manutencoes.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.manutencoes.deletedAt), (0, drizzle_orm_1.gte)(schema_1.manutencoes.data, dataInicio)))
                .groupBy(schema_1.manutencoes.veiculoId);
            // KM rodado por veículo (via viagens)
            const kmRows = await db.select({
                veiculoId: schema_1.viagens.veiculoId,
                kmTotal: (0, drizzle_orm_1.sql) `SUM(${schema_1.viagens.kmRodado})`,
                freteTotal: (0, drizzle_orm_1.sql) `SUM(${schema_1.viagens.freteTotal})`,
                quantidadeViagens: (0, drizzle_orm_1.sql) `COUNT(*)`,
            }).from(schema_1.viagens)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.viagens.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_1.viagens.status, "concluida"), (0, drizzle_orm_1.isNull)(schema_1.viagens.deletedAt), (0, drizzle_orm_1.gte)(schema_1.viagens.dataSaida, dataInicio)))
                .groupBy(schema_1.viagens.veiculoId);
            // Dados dos veículos
            const veiculosRows = await db.select({
                id: schema_1.veiculos.id,
                placa: schema_1.veiculos.placa,
                tipo: schema_1.veiculos.tipo,
                mediaConsumo: schema_1.veiculos.mediaConsumo,
            }).from(schema_1.veiculos)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.veiculos.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_1.veiculos.ativo, true), (0, drizzle_orm_1.isNull)(schema_1.veiculos.deletedAt)));
            // Montar resultado consolidado
            const resultado = veiculosRows.map(v => {
                const comb = combRows.find(r => r.veiculoId === v.id);
                const manut = manutRows.find(r => r.veiculoId === v.id);
                const km = kmRows.find(r => r.veiculoId === v.id);
                const custoCombustivel = Number(comb?.totalCombustivel) || 0;
                const custoManutencao = Number(manut?.totalManutencao) || 0;
                const custoTotal = custoCombustivel + custoManutencao;
                const kmRodado = Number(km?.kmTotal) || 0;
                const custoPorKm = kmRodado > 0 ? custoTotal / kmRodado : 0;
                const freteTotal = Number(km?.freteTotal) || 0;
                const lucro = freteTotal - custoTotal;
                const margem = freteTotal > 0 ? (lucro / freteTotal) * 100 : 0;
                return {
                    veiculoId: v.id,
                    placa: v.placa,
                    tipo: v.tipo,
                    kmRodado,
                    quantidadeViagens: Number(km?.quantidadeViagens) || 0,
                    custoCombustivel: Math.round(custoCombustivel * 100) / 100,
                    custoManutencao: Math.round(custoManutencao * 100) / 100,
                    custoTotal: Math.round(custoTotal * 100) / 100,
                    custoPorKm: Math.round(custoPorKm * 100) / 100,
                    freteTotal: Math.round(freteTotal * 100) / 100,
                    lucro: Math.round(lucro * 100) / 100,
                    margem: Math.round(margem * 10) / 10,
                };
            });
            // Calcular média da frota para comparação
            const veiculosComKm = resultado.filter(r => r.kmRodado > 0);
            const mediaCustoPorKm = veiculosComKm.length > 0
                ? veiculosComKm.reduce((sum, r) => sum + r.custoPorKm, 0) / veiculosComKm.length
                : 0;
            return {
                periodo: { dataInicio: dataInicio.toISOString(), meses: input.meses },
                mediaCustoPorKm: Math.round(mediaCustoPorKm * 100) / 100,
                veiculos: resultado
                    .map(r => ({
                    ...r,
                    acimaDaMedia: r.custoPorKm > mediaCustoPorKm * 1.2, // 20% acima da média = alerta
                }))
                    .sort((a, b) => b.custoPorKm - a.custoPorKm),
            };
        }, "custos.comparativoCustoPorKm");
    }),
});

import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { abastecimentos, manutencoes, controleTanque, veiculos, funcionarios } from "../../drizzle/schema";
import { eq, and, isNull, isNotNull, desc, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { safeDb, requireDb } from "../helpers/errorHandler";

function parseDate(d: string | null | undefined): Date | null {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export const frotaRouter = router({
  // ─── ABASTECIMENTOS ───────────────────────────────────────────────────────
  abastecimentos: router({
    list: protectedProcedure
      .input(z.object({
        empresaId: z.number(),
        veiculoId: z.number().optional(),
        limit: z.number().default(50),
      }))
      .query(async ({ input }) => {
        return safeDb(async () => {
          const db = requireDb(await getDb(), "abastecimentos.list");
          return db.select().from(abastecimentos)
            .where(and(
              eq(abastecimentos.empresaId, input.empresaId),
              isNull(abastecimentos.deletedAt),
              input.veiculoId ? eq(abastecimentos.veiculoId, input.veiculoId) : undefined,
            ))
            .orderBy(desc(abastecimentos.data))
            .limit(input.limit);
        }, "abastecimentos.list");
      }),

    create: protectedProcedure
      .input(z.object({
        empresaId: z.number(),
        veiculoId: z.number(),
        motoristaId: z.number().nullable().optional(),
        data: z.string(),
        tipoCombustivel: z.enum(["diesel", "arla", "gasolina", "etanol", "gas", "outro"]),
        quantidade: z.string(),
        valorUnitario: z.string().nullable().optional(),
        valorTotal: z.string().nullable().optional(),
        kmAtual: z.number().nullable().optional(),
        kmRodado: z.number().nullable().optional(),
        mediaConsumo: z.string().nullable().optional(),
        local: z.string().optional(),
        tipoAbastecimento: z.enum(["interno", "externo"]).default("interno"),
        notaFiscal: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return safeDb(async () => {
          const db = requireDb(await getDb(), "abastecimentos.create");
          const [result] = await db.insert(abastecimentos).values({
            ...input,
            data: new Date(input.data),
          });
          return { id: (result as any).insertId };
        }, "abastecimentos.create");
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.string().optional(),
        tipoCombustivel: z.enum(["diesel", "arla", "gasolina", "etanol", "gas", "outro"]).optional(),
        quantidade: z.string().optional(),
        valorUnitario: z.string().nullable().optional(),
        valorTotal: z.string().nullable().optional(),
        kmAtual: z.number().nullable().optional(),
        local: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return safeDb(async () => {
          const db = requireDb(await getDb(), "abastecimentos.update");
          const { id, data, ...rest } = input;
          await db.update(abastecimentos).set({
            ...rest,
            ...(data ? { data: new Date(data) } : {}),
            updatedAt: new Date(),
          }).where(eq(abastecimentos.id, id));
          return { success: true };
        }, "abastecimentos.update");
      }),

    softDelete: protectedProcedure
      .input(z.object({ id: z.number(), reason: z.string().min(1, "Informe o motivo") }))
      .mutation(async ({ input, ctx }) => {
        return safeDb(async () => {
          const db = requireDb(await getDb(), "abastecimentos.softDelete");
          await db.update(abastecimentos).set({
            deletedAt: new Date(),
            deletedBy: ctx.user!.id,
            deleteReason: input.reason,
          }).where(eq(abastecimentos.id, input.id));
          return { success: true };
        }, "abastecimentos.softDelete");
      }),

    resumoPorVeiculo: protectedProcedure
      .input(z.object({ empresaId: z.number() }))
      .query(async ({ input }) => {
        return safeDb(async () => {
          const db = requireDb(await getDb(), "abastecimentos.resumoPorVeiculo");
          return db.select({
            veiculoId: abastecimentos.veiculoId,
            totalLitros: sql<number>`SUM(${abastecimentos.quantidade})`,
            totalValor: sql<number>`SUM(${abastecimentos.valorTotal})`,
            mediaConsumo: sql<number>`AVG(${abastecimentos.mediaConsumo})`,
            ultimoAbastecimento: sql<string>`MAX(${abastecimentos.data})`,
          })
            .from(abastecimentos)
            .where(and(eq(abastecimentos.empresaId, input.empresaId), isNull(abastecimentos.deletedAt)))
            .groupBy(abastecimentos.veiculoId);
        }, "abastecimentos.resumoPorVeiculo");
      }),

    // Preço médio do diesel nos últimos 30 dias (para calculadora)
    precioMedioDiesel: protectedProcedure
      .input(z.object({ empresaId: z.number() }))
      .query(async ({ input }) => {
        return safeDb(async () => {
          const db = requireDb(await getDb(), "abastecimentos.precioMedioDiesel");
          const trintaDiasAtras = new Date();
          trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
          const rows = await db.select({
            media: sql<number>`AVG(${abastecimentos.valorUnitario})`,
          })
            .from(abastecimentos)
            .where(and(
              eq(abastecimentos.empresaId, input.empresaId),
              eq(abastecimentos.tipoCombustivel, "diesel"),
              isNull(abastecimentos.deletedAt),
              gte(abastecimentos.data, trintaDiasAtras),
            ));
          return { precioMedio: Number(rows[0]?.media) || 6.5 }; // fallback R$6,50
        }, "abastecimentos.precioMedioDiesel");
      }),
  }),

  // ─── MANUTENÇÕES ──────────────────────────────────────────────────────────
  manutencoes: router({
    list: protectedProcedure
      .input(z.object({
        empresaId: z.number(),
        veiculoId: z.number().optional(),
        limit: z.number().default(50),
      }))
      .query(async ({ input }) => {
        return safeDb(async () => {
          const db = requireDb(await getDb(), "manutencoes.list");
          return db.select().from(manutencoes)
            .where(and(
              eq(manutencoes.empresaId, input.empresaId),
              isNull(manutencoes.deletedAt),
              input.veiculoId ? eq(manutencoes.veiculoId, input.veiculoId) : undefined,
            ))
            .orderBy(desc(manutencoes.data))
            .limit(input.limit);
        }, "manutencoes.list");
      }),

    create: protectedProcedure
      .input(z.object({
        empresaId: z.number(),
        veiculoId: z.number(),
        data: z.string(),
        tipo: z.enum(["preventiva", "corretiva", "revisao", "pneu", "eletrica", "funilaria", "outro"]),
        descricao: z.string().min(1, "Descrição é obrigatória"),
        empresa: z.string().optional(),
        valor: z.string().nullable().optional(),
        kmAtual: z.number().nullable().optional(),
        proximaManutencaoKm: z.number().nullable().optional(),
        proximaManutencaoData: z.string().nullable().optional(),
        notaFiscal: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return safeDb(async () => {
          const db = requireDb(await getDb(), "manutencoes.create");
          const [result] = await db.insert(manutencoes).values({
            ...input,
            data: new Date(input.data),
            proximaManutencaoData: parseDate(input.proximaManutencaoData),
          });
          return { id: (result as any).insertId };
        }, "manutencoes.create");
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.string().optional(),
        tipo: z.enum(["preventiva", "corretiva", "revisao", "pneu", "eletrica", "funilaria", "outro"]).optional(),
        descricao: z.string().optional(),
        empresa: z.string().optional(),
        valor: z.string().nullable().optional(),
        kmAtual: z.number().nullable().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return safeDb(async () => {
          const db = requireDb(await getDb(), "manutencoes.update");
          const { id, data, ...rest } = input;
          await db.update(manutencoes).set({
            ...rest,
            ...(data ? { data: new Date(data) } : {}),
            updatedAt: new Date(),
          }).where(eq(manutencoes.id, id));
          return { success: true };
        }, "manutencoes.update");
      }),

    softDelete: protectedProcedure
      .input(z.object({ id: z.number(), reason: z.string().min(1, "Informe o motivo") }))
      .mutation(async ({ input, ctx }) => {
        return safeDb(async () => {
          const db = requireDb(await getDb(), "manutencoes.softDelete");
          await db.update(manutencoes).set({
            deletedAt: new Date(),
            deletedBy: ctx.user!.id,
            deleteReason: input.reason,
          }).where(eq(manutencoes.id, input.id));
          return { success: true };
        }, "manutencoes.softDelete");
      }),

    totalPorVeiculo: protectedProcedure
      .input(z.object({ empresaId: z.number() }))
      .query(async ({ input }) => {
        return safeDb(async () => {
          const db = requireDb(await getDb(), "manutencoes.totalPorVeiculo");
          return db.select({
            veiculoId: manutencoes.veiculoId,
            totalValor: sql<number>`SUM(${manutencoes.valor})`,
            quantidade: sql<number>`COUNT(*)`,
            ultimaManutencao: sql<string>`MAX(${manutencoes.data})`,
          })
            .from(manutencoes)
            .where(and(eq(manutencoes.empresaId, input.empresaId), isNull(manutencoes.deletedAt)))
            .groupBy(manutencoes.veiculoId);
        }, "manutencoes.totalPorVeiculo");
      }),
  }),

  // ─── CONTROLE TANQUE ──────────────────────────────────────────────────────
  tanque: router({
    list: protectedProcedure
      .input(z.object({ empresaId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return safeDb(async () => {
          const db = requireDb(await getDb(), "tanque.list");
          return db.select().from(controleTanque)
            .where(and(eq(controleTanque.empresaId, input.empresaId), isNull(controleTanque.deletedAt)))
            .orderBy(desc(controleTanque.data))
            .limit(input.limit);
        }, "tanque.list");
      }),

    saldoAtual: protectedProcedure
      .input(z.object({ empresaId: z.number() }))
      .query(async ({ input }) => {
        return safeDb(async () => {
          const db = requireDb(await getDb(), "tanque.saldoAtual");
          const rows = await db.select({
            tipo: controleTanque.tipo,
            saldo: sql<number>`SUM(CASE WHEN ${controleTanque.operacao} = 'entrada' THEN ${controleTanque.quantidade} ELSE -${controleTanque.quantidade} END)`,
          })
            .from(controleTanque)
            .where(and(eq(controleTanque.empresaId, input.empresaId), isNull(controleTanque.deletedAt)))
            .groupBy(controleTanque.tipo);
          const result = { diesel: 0, arla: 0 };
          rows.forEach(r => {
            if (r.tipo === "diesel") result.diesel = Number(r.saldo) || 0;
            if (r.tipo === "arla") result.arla = Number(r.saldo) || 0;
          });
          return result;
        }, "tanque.saldoAtual");
      }),

    create: protectedProcedure
      .input(z.object({
        empresaId: z.number(),
        tipo: z.enum(["diesel", "arla"]),
        data: z.string(),
        operacao: z.enum(["entrada", "saida"]),
        quantidade: z.string(),
        valorUnitario: z.string().nullable().optional(),
        valorTotal: z.string().nullable().optional(),
        fornecedor: z.string().optional(),
        notaFiscal: z.string().optional(),
        veiculoId: z.number().nullable().optional(),
        motoristaId: z.number().nullable().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return safeDb(async () => {
          const db = requireDb(await getDb(), "tanque.create");
          const [result] = await db.insert(controleTanque).values({
            ...input,
            data: new Date(input.data),
          });
          return { id: (result as any).insertId };
        }, "tanque.create");
      }),
  }),

  // ─── CALCULADORA DE VIAGEM ────────────────────────────────────────────────
  calcularCustoViagem: protectedProcedure
    .input(z.object({
      empresaId: z.number(),
      veiculoId: z.number(),
      distanciaKm: z.number().min(1, "Distância deve ser maior que zero"),
      freteTotal: z.number().min(0),
      diasViagem: z.number().min(1).default(1),
      // Ajudantes para calcular diárias
      ajudante1Id: z.number().nullable().optional(),
      ajudante2Id: z.number().nullable().optional(),
      ajudante3Id: z.number().nullable().optional(),
      // Custos extras estimados
      pedagioEstimado: z.number().default(0),
      outrosCustos: z.number().default(0),
      // Preço do diesel (se não informado, usa média dos últimos 30 dias)
      precoDiesel: z.number().nullable().optional(),
    }))
    .query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "frota.calcularCustoViagem");

        // 1. Buscar dados do veículo (média de consumo)
        const veiculoRows = await db.select({
          mediaConsumo: veiculos.mediaConsumo,
          tipo: veiculos.tipo,
        }).from(veiculos).where(eq(veiculos.id, input.veiculoId)).limit(1);
        const veiculo = veiculoRows[0];
        const mediaConsumo = Number(veiculo?.mediaConsumo) || 3.5; // fallback 3,5 km/l

        // 2. Preço do diesel: usa o informado ou calcula média dos últimos 30 dias
        let precoDiesel = input.precoDiesel;
        if (!precoDiesel) {
          const trintaDiasAtras = new Date();
          trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
          const precoRows = await db.select({
            media: sql<number>`AVG(${abastecimentos.valorUnitario})`,
          }).from(abastecimentos)
            .where(and(
              eq(abastecimentos.empresaId, input.empresaId),
              eq(abastecimentos.tipoCombustivel, "diesel"),
              isNull(abastecimentos.deletedAt),
              gte(abastecimentos.data, trintaDiasAtras),
            ));
          precoDiesel = Number(precoRows[0]?.media) || 6.5;
        }

        // 3. Calcular custo de combustível
        const litrosNecessarios = input.distanciaKm / mediaConsumo;
        const custoCombustivel = litrosNecessarios * precoDiesel;

        // 4. Calcular diárias do motorista (buscar valor do veículo → motorista padrão)
        let custoDiariasMotorista = 0;
        const veiculoComMotorista = await db.select({
          motoristaId: veiculos.motoristaId,
        }).from(veiculos).where(eq(veiculos.id, input.veiculoId)).limit(1);

        if (veiculoComMotorista[0]?.motoristaId) {
          const motoristaRows = await db.select({
            valorDiaria: funcionarios.valorDiaria,
            tipoCobranca: funcionarios.tipoCobranca,
          }).from(funcionarios).where(eq(funcionarios.id, veiculoComMotorista[0].motoristaId)).limit(1);
          const motorista = motoristaRows[0];
          if (motorista?.tipoCobranca === "diaria" && motorista.valorDiaria) {
            custoDiariasMotorista = Number(motorista.valorDiaria) * input.diasViagem;
          }
        }

        // 5. Calcular diárias dos ajudantes
        let custoDiariasAjudantes = 0;
        const ajudanteIds = [input.ajudante1Id, input.ajudante2Id, input.ajudante3Id].filter(Boolean) as number[];
        for (const ajId of ajudanteIds) {
          const ajRows = await db.select({
            valorDiaria: funcionarios.valorDiaria,
            tipoCobranca: funcionarios.tipoCobranca,
          }).from(funcionarios).where(eq(funcionarios.id, ajId)).limit(1);
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
        let classificacao: "otimo" | "bom" | "atencao" | "prejuizo";
        if (margemPercent >= 30) classificacao = "otimo";
        else if (margemPercent >= 15) classificacao = "bom";
        else if (margemPercent >= 0) classificacao = "atencao";
        else classificacao = "prejuizo";

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
});

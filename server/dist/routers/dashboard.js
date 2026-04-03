"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const trpc_1 = require("../_core/trpc");
const schema_1 = require("../drizzle/schema");
const db_1 = require("../db");
const schema_2 = require("../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
exports.dashboardRouter = (0, trpc_1.router)({
    // Resumo geral da empresa
    resumo: trpc_1.protectedProcedure
        .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const db = await (0, db_1.getDb)();
        if (!db)
            return null;
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const em7dias = new Date(hoje);
        em7dias.setDate(hoje.getDate() + 7);
        // Veículos ativos
        const veiculosRows = await db.select({
            total: (0, drizzle_orm_1.sql) `COUNT(*)`,
        }).from(schema_2.veiculos)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_2.veiculos.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_2.veiculos.ativo, true), (0, drizzle_orm_1.isNull)(schema_2.veiculos.deletedAt)));
        // Funcionários ativos
        const funcRows = await db.select({
            funcao: schema_2.funcionarios.funcao,
            total: (0, drizzle_orm_1.sql) `COUNT(*)`,
        }).from(schema_2.funcionarios)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_2.funcionarios.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_2.funcionarios.ativo, true), (0, drizzle_orm_1.isNull)(schema_2.funcionarios.deletedAt)))
            .groupBy(schema_2.funcionarios.funcao);
        // Abastecimentos do mês
        const abastRows = await db.select({
            total: (0, drizzle_orm_1.sql) `SUM(${schema_2.abastecimentos.valorTotal})`,
            litros: (0, drizzle_orm_1.sql) `SUM(${schema_2.abastecimentos.quantidade})`,
        }).from(schema_2.abastecimentos)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_2.abastecimentos.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_2.abastecimentos.deletedAt), (0, drizzle_orm_1.gte)(schema_2.abastecimentos.data, inicioMes)));
        // Manutenções do mês
        const manutRows = await db.select({
            total: (0, drizzle_orm_1.sql) `SUM(${schema_2.manutencoes.valor})`,
            count: (0, drizzle_orm_1.sql) `COUNT(*)`,
        }).from(schema_2.manutencoes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_2.manutencoes.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_2.manutencoes.deletedAt), (0, drizzle_orm_1.gte)(schema_2.manutencoes.data, inicioMes)));
        // Viagens ativas
        const viagensRows = await db.select({
            status: schema_2.viagens.status,
            total: (0, drizzle_orm_1.sql) `COUNT(*)`,
        }).from(schema_2.viagens)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_2.viagens.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_2.viagens.deletedAt)))
            .groupBy(schema_2.viagens.status);
        // Contas vencendo em 7 dias
        const contasVencendo = await db.select({
            total: (0, drizzle_orm_1.sql) `COUNT(*)`,
            valor: (0, drizzle_orm_1.sql) `SUM(${schema_2.contasPagar.valor})`,
        }).from(schema_2.contasPagar)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_2.contasPagar.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_2.contasPagar.status, "pendente"), (0, drizzle_orm_1.lte)(schema_2.contasPagar.dataVencimento, em7dias), (0, drizzle_orm_1.gte)(schema_2.contasPagar.dataVencimento, hoje), (0, drizzle_orm_1.isNull)(schema_2.contasPagar.deletedAt)));
        // Freelancers para pagar esta semana
        const freelancers = await db.select().from(schema_2.funcionarios)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_2.funcionarios.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_2.funcionarios.tipoContrato, "freelancer"), (0, drizzle_orm_1.isNull)(schema_2.funcionarios.deletedAt)));
        const freelancersParaPagar = freelancers.filter(f => {
            if (!f.diaPagamento)
                return false;
            const diaAtual = hoje.getDate();
            const diff = f.diaPagamento - diaAtual;
            return diff >= 0 && diff <= 7;
        });
        // Documentos vencendo (CNH, CRLV, Seguro)
        const cnhVencendo = await db.select({
            count: (0, drizzle_orm_1.sql) `COUNT(*)`,
        }).from(schema_2.funcionarios)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_2.funcionarios.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_2.funcionarios.deletedAt), (0, drizzle_orm_1.lte)(schema_2.funcionarios.vencimentoCnh, em7dias), (0, drizzle_orm_1.gte)(schema_2.funcionarios.vencimentoCnh, hoje)));
        const crlvVencendo = await db.select({
            count: (0, drizzle_orm_1.sql) `COUNT(*)`,
        }).from(schema_2.veiculos)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_2.veiculos.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_2.veiculos.deletedAt), (0, drizzle_orm_1.lte)(schema_2.veiculos.vencimentoCrlv, em7dias), (0, drizzle_orm_1.gte)(schema_2.veiculos.vencimentoCrlv, hoje)));
        return {
            veiculos: {
                total: Number(veiculosRows[0]?.total) || 0,
            },
            funcionarios: {
                motoristas: Number(funcRows.find(f => f.funcao === "motorista")?.total) || 0,
                ajudantes: Number(funcRows.find(f => f.funcao === "ajudante")?.total) || 0,
                total: funcRows.reduce((acc, f) => acc + Number(f.total), 0),
            },
            combustivel: {
                valorMes: Number(abastRows[0]?.total) || 0,
                litrosMes: Number(abastRows[0]?.litros) || 0,
            },
            manutencao: {
                valorMes: Number(manutRows[0]?.total) || 0,
                quantidadeMes: Number(manutRows[0]?.count) || 0,
            },
            viagens: {
                emAndamento: Number(viagensRows.find(v => v.status === "em_andamento")?.total) || 0,
                planejadas: Number(viagensRows.find(v => v.status === "planejada")?.total) || 0,
                concluidasMes: Number(viagensRows.find(v => v.status === "concluida")?.total) || 0,
            },
            alertas: {
                contasVencendo7dias: Number(contasVencendo[0]?.total) || 0,
                valorContasVencendo: Number(contasVencendo[0]?.valor) || 0,
                freelancersParaPagar: freelancersParaPagar.length,
                cnhVencendo: Number(cnhVencendo[0]?.count) || 0,
                crlvVencendo: Number(crlvVencendo[0]?.count) || 0,
            },
        };
    }),
    // Gerenciamento de usuários
    listUsers: trpc_1.protectedProcedure
        .input(zod_1.z.object({ empresaId: zod_1.z.number().optional() }))
        .query(async () => {
        const db = await (0, db_1.getDb)();
        if (!db)
            return [];
        return db.select().from(schema_1.users).orderBy(schema_1.users.createdAt);
    }),
    updateUserRole: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        userId: zod_1.z.number(),
        role: zod_1.z.enum(["user", "admin", "master_admin", "monitor", "dispatcher"]),
    }))
        .mutation(async ({ input, ctx }) => {
        const db = await (0, db_1.getDb)();
        if (!db)
            throw new Error("Banco indisponível");
        const currentRole = ctx.user?.role;
        if (currentRole !== "admin" && currentRole !== "master_admin") {
            throw new Error("Sem permissão para alterar níveis de acesso");
        }
        if (input.role === "master_admin" && currentRole !== "master_admin") {
            throw new Error("Apenas master_admin pode promover outros a master_admin");
        }
        await db.update(schema_1.users)
            .set({ role: input.role })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, input.userId));
        return { success: true };
    }),
    // Lista de empresas
    empresas: (0, trpc_1.router)({
        list: trpc_1.protectedProcedure.query(async () => {
            const db = await (0, db_1.getDb)();
            if (!db)
                return [];
            return db.select().from(schema_2.empresas)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_2.empresas.ativo, true), (0, drizzle_orm_1.isNull)(schema_2.empresas.deletedAt)))
                .orderBy(schema_2.empresas.nome);
        }),
        getById: trpc_1.protectedProcedure
            .input(zod_1.z.object({ id: zod_1.z.number() }))
            .query(async ({ input }) => {
            const db = await (0, db_1.getDb)();
            if (!db)
                return null;
            const rows = await db.select().from(schema_2.empresas)
                .where((0, drizzle_orm_1.eq)(schema_2.empresas.id, input.id)).limit(1);
            return rows[0] ?? null;
        }),
    }),
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.funcionariosRouter = void 0;
const trpc_1 = require("../_core/trpc");
const db_1 = require("../db");
const schema_1 = require("../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const errorHandler_1 = require("../helpers/errorHandler");
// Apenas nome e função são obrigatórios — todo o resto é opcional
const funcionarioInput = zod_1.z.object({
    empresaId: zod_1.z.number(),
    nome: zod_1.z.string().min(1, "Nome é obrigatório").max(255),
    funcao: zod_1.z.enum(["motorista", "ajudante", "despachante", "gerente", "admin", "outro"]),
    tipoContrato: zod_1.z.enum(["clt", "freelancer", "terceirizado", "estagiario"]).default("clt"),
    cpf: zod_1.z.string().max(14).optional(),
    rg: zod_1.z.string().max(20).optional(),
    telefone: zod_1.z.string().max(20).optional(),
    email: zod_1.z.string().email("E-mail inválido").max(320).optional().or(zod_1.z.literal("")),
    // CLT
    salario: zod_1.z.string().nullable().optional(),
    dataAdmissao: zod_1.z.string().nullable().optional(),
    dataDemissao: zod_1.z.string().nullable().optional(),
    // Freelancer
    valorDiaria: zod_1.z.string().nullable().optional(),
    valorMensal: zod_1.z.string().nullable().optional(),
    tipoCobranca: zod_1.z.enum(["diaria", "mensal", "por_viagem"]).nullable().optional(),
    dataInicioContrato: zod_1.z.string().nullable().optional(),
    dataFimContrato: zod_1.z.string().nullable().optional(),
    diaPagamento: zod_1.z.number().min(1).max(31).nullable().optional(),
    // Motorista
    cnh: zod_1.z.string().max(20).optional(),
    categoriaCnh: zod_1.z.string().max(5).optional(),
    vencimentoCnh: zod_1.z.string().nullable().optional(),
    mopp: zod_1.z.boolean().optional(),
    vencimentoMopp: zod_1.z.string().nullable().optional(),
    vencimentoAso: zod_1.z.string().nullable().optional(),
    // Bancário
    banco: zod_1.z.string().max(100).optional(),
    agencia: zod_1.z.string().max(10).optional(),
    conta: zod_1.z.string().max(20).optional(),
    tipoConta: zod_1.z.enum(["corrente", "poupanca", "pix"]).nullable().optional(),
    chavePix: zod_1.z.string().max(255).optional(),
    observacoes: zod_1.z.string().optional(),
    foto: zod_1.z.string().optional(),
});
function parseDate(d) {
    if (!d)
        return null;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
}
exports.funcionariosRouter = (0, trpc_1.router)({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        empresaId: zod_1.z.number(),
        funcao: zod_1.z.enum(["motorista", "ajudante", "despachante", "gerente", "admin", "outro"]).optional(),
        tipoContrato: zod_1.z.enum(["clt", "freelancer", "terceirizado", "estagiario"]).optional(),
    }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "funcionarios.list");
            return db.select().from(schema_1.funcionarios)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.funcionarios.empresaId, input.empresaId), (0, drizzle_orm_1.isNull)(schema_1.funcionarios.deletedAt), input.funcao ? (0, drizzle_orm_1.eq)(schema_1.funcionarios.funcao, input.funcao) : undefined, input.tipoContrato ? (0, drizzle_orm_1.eq)(schema_1.funcionarios.tipoContrato, input.tipoContrato) : undefined))
                .orderBy(schema_1.funcionarios.nome);
        }, "funcionarios.list");
    }),
    listMotoristas: trpc_1.protectedProcedure
        .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "funcionarios.listMotoristas");
            return db.select().from(schema_1.funcionarios)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.funcionarios.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_1.funcionarios.funcao, "motorista"), (0, drizzle_orm_1.isNull)(schema_1.funcionarios.deletedAt)))
                .orderBy(schema_1.funcionarios.nome);
        }, "funcionarios.listMotoristas");
    }),
    listAjudantes: trpc_1.protectedProcedure
        .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "funcionarios.listAjudantes");
            return db.select().from(schema_1.funcionarios)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.funcionarios.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_1.funcionarios.funcao, "ajudante"), (0, drizzle_orm_1.isNull)(schema_1.funcionarios.deletedAt)))
                .orderBy(schema_1.funcionarios.nome);
        }, "funcionarios.listAjudantes");
    }),
    getById: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "funcionarios.getById");
            const rows = await db.select().from(schema_1.funcionarios)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.funcionarios.id, input.id), (0, drizzle_orm_1.isNull)(schema_1.funcionarios.deletedAt)))
                .limit(1);
            return rows[0] ?? null;
        }, "funcionarios.getById");
    }),
    freelancersPendentes: trpc_1.protectedProcedure
        .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "funcionarios.freelancersPendentes");
            const hoje = new Date();
            const rows = await db.select().from(schema_1.funcionarios)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.funcionarios.empresaId, input.empresaId), (0, drizzle_orm_1.eq)(schema_1.funcionarios.tipoContrato, "freelancer"), (0, drizzle_orm_1.isNull)(schema_1.funcionarios.deletedAt)));
            return rows.filter(f => {
                if (!f.diaPagamento)
                    return false;
                const diaAtual = hoje.getDate();
                const diff = f.diaPagamento - diaAtual;
                return diff >= 0 && diff <= 7;
            });
        }, "funcionarios.freelancersPendentes");
    }),
    create: trpc_1.protectedProcedure
        .input(funcionarioInput)
        .mutation(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "funcionarios.create");
            const [result] = await db.insert(schema_1.funcionarios).values({
                ...input,
                email: input.email || null,
                salario: input.salario ?? null,
                valorDiaria: input.valorDiaria ?? null,
                valorMensal: input.valorMensal ?? null,
                dataAdmissao: parseDate(input.dataAdmissao),
                dataDemissao: parseDate(input.dataDemissao),
                dataInicioContrato: parseDate(input.dataInicioContrato),
                dataFimContrato: parseDate(input.dataFimContrato),
                vencimentoCnh: parseDate(input.vencimentoCnh),
                vencimentoMopp: parseDate(input.vencimentoMopp),
                vencimentoAso: parseDate(input.vencimentoAso),
                ativo: true,
            });
            return { id: result.insertId };
        }, "funcionarios.create");
    }),
    update: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }).merge(funcionarioInput.partial()))
        .mutation(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "funcionarios.update");
            const { id, ...data } = input;
            await db.update(schema_1.funcionarios).set({
                ...data,
                email: data.email !== undefined ? (data.email || null) : undefined,
                dataAdmissao: data.dataAdmissao !== undefined ? parseDate(data.dataAdmissao) : undefined,
                dataDemissao: data.dataDemissao !== undefined ? parseDate(data.dataDemissao) : undefined,
                dataInicioContrato: data.dataInicioContrato !== undefined ? parseDate(data.dataInicioContrato) : undefined,
                dataFimContrato: data.dataFimContrato !== undefined ? parseDate(data.dataFimContrato) : undefined,
                vencimentoCnh: data.vencimentoCnh !== undefined ? parseDate(data.vencimentoCnh) : undefined,
                vencimentoMopp: data.vencimentoMopp !== undefined ? parseDate(data.vencimentoMopp) : undefined,
                vencimentoAso: data.vencimentoAso !== undefined ? parseDate(data.vencimentoAso) : undefined,
                updatedAt: new Date(),
            }).where((0, drizzle_orm_1.eq)(schema_1.funcionarios.id, id));
            return { success: true };
        }, "funcionarios.update");
    }),
    softDelete: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number(), reason: zod_1.z.string().min(1, "Informe o motivo da exclusão") }))
        .mutation(async ({ input, ctx }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "funcionarios.softDelete");
            await db.update(schema_1.funcionarios).set({
                deletedAt: new Date(),
                deletedBy: ctx.user.id,
                deleteReason: input.reason,
                ativo: false,
            }).where((0, drizzle_orm_1.eq)(schema_1.funcionarios.id, input.id));
            return { success: true };
        }, "funcionarios.softDelete");
    }),
    restore: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "funcionarios.restore");
            await db.update(schema_1.funcionarios).set({
                deletedAt: null,
                deletedBy: null,
                deleteReason: null,
                ativo: true,
            }).where((0, drizzle_orm_1.eq)(schema_1.funcionarios.id, input.id));
            return { success: true };
        }, "funcionarios.restore");
    }),
    listDeleted: trpc_1.protectedProcedure
        .input(zod_1.z.object({ empresaId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return (0, errorHandler_1.safeDb)(async () => {
            const db = (0, errorHandler_1.requireDb)(await (0, db_1.getDb)(), "funcionarios.listDeleted");
            return db.select().from(schema_1.funcionarios)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.funcionarios.empresaId, input.empresaId), (0, drizzle_orm_1.isNotNull)(schema_1.funcionarios.deletedAt)))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.funcionarios.deletedAt));
        }, "funcionarios.listDeleted");
    }),
});

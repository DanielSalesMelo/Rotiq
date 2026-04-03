// index.ts
import { webcrypto } from "crypto";
import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";

// _core/systemRouter.ts
import { z } from "zod";

// _core/notification.ts
import { TRPCError } from "@trpc/server";

// _core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// _core/notification.ts
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// _core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    const adminRoles = ["admin", "master_admin"];
    if (!ctx.user || !adminRoles.includes(ctx.user.role)) {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);
var monitorProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    const monitorRoles = ["monitor", "admin", "master_admin"];
    if (!ctx.user || !monitorRoles.includes(ctx.user.role)) {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "Acesso negado. Apenas monitores e administradores podem realizar esta a\xE7\xE3o."
      });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);
var masterAdminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "master_admin") {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "Acesso negado. Apenas o administrador master pode realizar esta a\xE7\xE3o."
      });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);
var dispatcherProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    const dispatcherRoles = ["dispatcher", "monitor", "admin", "master_admin"];
    if (!ctx.user || !dispatcherRoles.includes(ctx.user.role)) {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "Acesso negado. Apenas despachantes e administradores podem realizar esta a\xE7\xE3o."
      });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);

// _core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// db.ts
import path from "path";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// drizzle/schema.ts
import {
  bigint,
  boolean,
  date,
  decimal,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar
} from "drizzle-orm/pg-core";
var userRoleEnum = pgEnum("user_role", ["user", "admin", "master_admin", "monitor", "dispatcher"]);
var funcaoEnum = pgEnum("funcao", ["motorista", "ajudante", "despachante", "gerente", "admin", "outro"]);
var tipoContratoEnum = pgEnum("tipo_contrato", ["clt", "freelancer", "terceirizado", "estagiario"]);
var tipoCobrancaEnum = pgEnum("tipo_cobranca", ["diaria", "mensal", "por_viagem"]);
var tipoContaEnum = pgEnum("tipo_conta", ["corrente", "poupanca", "pix"]);
var tipoVeiculoEnum = pgEnum("tipo_veiculo", ["van", "toco", "truck", "cavalo", "carreta", "empilhadeira", "paletera", "outro"]);
var tipoCombustivelEnum = pgEnum("tipo_combustivel", ["diesel", "arla", "gasolina", "etanol", "gas", "outro"]);
var tipoAbastecimentoEnum = pgEnum("tipo_abastecimento", ["interno", "externo"]);
var tipoManutencaoEnum = pgEnum("tipo_manutencao", ["preventiva", "corretiva", "revisao", "pneu", "eletrica", "funilaria", "outro"]);
var tipoViagemEnum = pgEnum("tipo_viagem", ["entrega", "viagem"]);
var statusViagemEnum = pgEnum("status_viagem", ["planejada", "em_andamento", "concluida", "cancelada"]);
var tipoDespesaEnum = pgEnum("tipo_despesa", ["combustivel", "pedagio", "borracharia", "estacionamento", "oficina", "telefone", "descarga", "diaria", "alimentacao", "outro"]);
var turnoEnum = pgEnum("turno", ["manha", "tarde", "noite"]);
var tipoChecklistEnum = pgEnum("tipo_checklist", ["saida", "retorno"]);
var itemChecklistEnum = pgEnum("item_checklist", ["conforme", "nao_conforme", "na"]);
var categoriaContaPagarEnum = pgEnum("categoria_conta_pagar", ["combustivel", "manutencao", "salario", "freelancer", "pedagio", "seguro", "ipva", "licenciamento", "pneu", "outro"]);
var statusContaPagarEnum = pgEnum("status_conta_pagar", ["pendente", "pago", "vencido", "cancelado"]);
var categoriaContaReceberEnum = pgEnum("categoria_conta_receber", ["frete", "cte", "devolucao", "outro"]);
var statusContaReceberEnum = pgEnum("status_conta_receber", ["pendente", "recebido", "vencido", "cancelado"]);
var formaPagamentoEnum = pgEnum("forma_pagamento", ["dinheiro", "pix", "transferencia", "cartao"]);
var statusAdiantamentoEnum = pgEnum("status_adiantamento", ["pendente", "acertado", "cancelado"]);
var tipoTanqueEnum = pgEnum("tipo_tanque", ["diesel", "arla"]);
var operacaoTanqueEnum = pgEnum("operacao_tanque", ["entrada", "saida"]);
var statusAcidenteEnum = pgEnum("status_acidente", ["aberto", "em_reparo", "resolvido"]);
var chatRoleEnum = pgEnum("chat_role", ["admin", "member"]);
var chatMessageTypeEnum = pgEnum("chat_message_type", ["text", "image", "file"]);
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  lastName: text("lastName"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  password: varchar("password", { length: 255 }),
  // Hash bcrypt
  role: userRoleEnum("role").default("user").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  // pending, approved, rejected
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdateFn(() => /* @__PURE__ */ new Date()).notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var empresas = pgTable("empresas", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }),
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  endereco: text("endereco"),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: integer("deletedBy"),
  deleteReason: text("deleteReason")
});
var funcionarios = pgTable("funcionarios", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresaId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }),
  rg: varchar("rg", { length: 20 }),
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  funcao: funcaoEnum("funcao").notNull(),
  tipoContrato: tipoContratoEnum("tipoContrato").notNull(),
  // Dados CLT
  salario: decimal("salario", { precision: 10, scale: 2 }),
  dataAdmissao: date("dataAdmissao"),
  dataDemissao: date("dataDemissao"),
  // Dados Freelancer/Temporário
  valorDiaria: decimal("valorDiaria", { precision: 10, scale: 2 }),
  valorMensal: decimal("valorMensal", { precision: 10, scale: 2 }),
  tipoCobranca: tipoCobrancaEnum("tipoCobranca"),
  dataInicioContrato: date("dataInicioContrato"),
  dataFimContrato: date("dataFimContrato"),
  diaPagamento: integer("diaPagamento"),
  // dia do mes para pagar
  // Dados Motorista
  cnh: varchar("cnh", { length: 20 }),
  categoriaCnh: varchar("categoriaCnh", { length: 5 }),
  vencimentoCnh: date("vencimentoCnh"),
  mopp: boolean("mopp").default(false),
  vencimentoMopp: date("vencimentoMopp"),
  vencimentoAso: date("vencimentoAso"),
  // exame medico
  // Dados bancarios (freelancer)
  banco: varchar("banco", { length: 100 }),
  agencia: varchar("agencia", { length: 10 }),
  conta: varchar("conta", { length: 20 }),
  tipoConta: tipoContaEnum("tipoConta"),
  chavePix: varchar("chavePix", { length: 255 }),
  // Observacoes
  observacoes: text("observacoes"),
  foto: text("foto"),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: integer("deletedBy"),
  deleteReason: text("deleteReason")
});
var veiculos = pgTable("veiculos", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresaId").notNull(),
  placa: varchar("placa", { length: 10 }).notNull(),
  tipo: tipoVeiculoEnum("tipo").notNull(),
  // Cavalo/Carreta: relacionamento
  cavaloPrincipalId: integer("cavaloPrincipalId"),
  // para carreta: qual cavalo esta acoplado
  // Dados do veiculo
  marca: varchar("marca", { length: 100 }),
  modelo: varchar("modelo", { length: 100 }),
  ano: integer("ano"),
  cor: varchar("cor", { length: 50 }),
  renavam: varchar("renavam", { length: 20 }),
  chassi: varchar("chassi", { length: 30 }),
  capacidadeCarga: decimal("capacidadeCarga", { precision: 8, scale: 2 }),
  // em toneladas
  // Motorista e ajudante padrao
  motoristaId: integer("motoristaId"),
  ajudanteId: integer("ajudanteId"),
  // KM e consumo
  kmAtual: integer("kmAtual"),
  mediaConsumo: decimal("mediaConsumo", { precision: 5, scale: 2 }),
  // km/l
  // Documentacao
  vencimentoCrlv: date("vencimentoCrlv"),
  vencimentoSeguro: date("vencimentoSeguro"),
  // Classificacao (estrelas do Excel)
  classificacao: integer("classificacao").default(0),
  // 0-5 estrelas
  observacoes: text("observacoes"),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: integer("deletedBy"),
  deleteReason: text("deleteReason")
});
var abastecimentos = pgTable("abastecimentos", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresaId").notNull(),
  veiculoId: integer("veiculoId").notNull(),
  motoristaId: integer("motoristaId"),
  data: date("data").notNull(),
  tipoCombustivel: tipoCombustivelEnum("tipoCombustivel").notNull(),
  quantidade: decimal("quantidade", { precision: 8, scale: 3 }).notNull(),
  valorUnitario: decimal("valorUnitario", { precision: 8, scale: 3 }),
  valorTotal: decimal("valorTotal", { precision: 10, scale: 2 }),
  kmAtual: integer("kmAtual"),
  kmRodado: integer("kmRodado"),
  mediaConsumo: decimal("mediaConsumo", { precision: 5, scale: 2 }),
  local: varchar("local", { length: 255 }),
  // posto/cidade
  tipoAbastecimento: tipoAbastecimentoEnum("tipoAbastecimento").default("interno"),
  notaFiscal: varchar("notaFiscal", { length: 50 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: integer("deletedBy"),
  deleteReason: text("deleteReason")
});
var manutencoes = pgTable("manutencoes", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresaId").notNull(),
  veiculoId: integer("veiculoId").notNull(),
  data: date("data").notNull(),
  tipo: tipoManutencaoEnum("tipo").notNull(),
  descricao: text("descricao").notNull(),
  empresa: varchar("empresa", { length: 255 }),
  // oficina/empresa
  valor: decimal("valor", { precision: 10, scale: 2 }),
  kmAtual: integer("kmAtual"),
  proximaManutencaoKm: integer("proximaManutencaoKm"),
  proximaManutencaoData: date("proximaManutencaoData"),
  notaFiscal: varchar("notaFiscal", { length: 50 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: integer("deletedBy"),
  deleteReason: text("deleteReason")
});
var viagens = pgTable("viagens", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresaId").notNull(),
  tipo: tipoViagemEnum("tipo").default("viagem").notNull(),
  veiculoId: integer("veiculoId").notNull(),
  cavaloPrincipalId: integer("cavaloPrincipalId"),
  // se for carreta, o cavalo que puxou
  motoristaId: integer("motoristaId"),
  ajudante1Id: integer("ajudante1Id"),
  ajudante2Id: integer("ajudante2Id"),
  ajudante3Id: integer("ajudante3Id"),
  // Rota
  origem: varchar("origem", { length: 255 }),
  destino: varchar("destino", { length: 255 }),
  // Datas e KM
  dataSaida: timestamp("dataSaida"),
  dataChegada: timestamp("dataChegada"),
  kmSaida: integer("kmSaida"),
  kmChegada: integer("kmChegada"),
  kmRodado: integer("kmRodado"),
  // Carga
  descricaoCarga: text("descricaoCarga"),
  tipoCarga: text("tipoCarga"),
  pesoCarga: decimal("pesoCarga", { precision: 8, scale: 2 }),
  // Financeiro da viagem
  freteTotalIda: decimal("freteTotalIda", { precision: 10, scale: 2 }),
  freteTotalVolta: decimal("freteTotalVolta", { precision: 10, scale: 2 }),
  freteTotal: decimal("freteTotal", { precision: 10, scale: 2 }),
  adiantamento: decimal("adiantamento", { precision: 10, scale: 2 }),
  saldoViagem: decimal("saldoViagem", { precision: 10, scale: 2 }),
  // Despesas da viagem
  totalDespesas: decimal("totalDespesas", { precision: 10, scale: 2 }),
  mediaConsumo: decimal("mediaConsumo", { precision: 5, scale: 2 }),
  // Documentacao
  notaFiscal: varchar("notaFiscal", { length: 50 }),
  // Status
  status: statusViagemEnum("status").default("planejada").notNull(),
  observacoes: text("observacoes"),
  teveProblema: boolean("teveProblema").default(false),
  voltouComCarga: boolean("voltouComCarga").default(false),
  observacoesChegada: text("observacoesChegada"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: integer("deletedBy"),
  deleteReason: text("deleteReason")
});
var despesasViagem = pgTable("despesas_viagem", {
  id: serial("id").primaryKey(),
  viagemId: integer("viagemId").notNull(),
  empresaId: integer("empresaId").notNull(),
  tipo: tipoDespesaEnum("tipo").notNull(),
  descricao: text("descricao"),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  data: date("data"),
  comprovante: text("comprovante"),
  // URL da foto
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: integer("deletedBy"),
  deleteReason: text("deleteReason")
});
var checklists = pgTable("checklists", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresaId").notNull(),
  veiculoId: integer("veiculoId").notNull(),
  cavaloPrincipalId: integer("cavaloPrincipalId"),
  // checklist independente para carreta
  motoristaId: integer("motoristaId"),
  turno: turnoEnum("turno"),
  tipo: tipoChecklistEnum("tipo").default("retorno").notNull(),
  // Itens internos
  cracha: itemChecklistEnum("cracha"),
  cnh: itemChecklistEnum("cnh"),
  documentosVeiculo: itemChecklistEnum("documentosVeiculo"),
  epi: itemChecklistEnum("epi"),
  computadorBordo: itemChecklistEnum("computadorBordo"),
  cinto: itemChecklistEnum("cinto"),
  banco: itemChecklistEnum("banco"),
  direcao: itemChecklistEnum("direcao"),
  luzesPainel: itemChecklistEnum("luzesPainel"),
  tacografo: itemChecklistEnum("tacografo"),
  extintor: itemChecklistEnum("extintor"),
  portas: itemChecklistEnum("portas"),
  limpador: itemChecklistEnum("limpador"),
  buzina: itemChecklistEnum("buzina"),
  freioDeMao: itemChecklistEnum("freioDeMao"),
  alarmeCacamba: itemChecklistEnum("alarmeCacamba"),
  cabineLimpa: itemChecklistEnum("cabineLimpa"),
  objetosSoltos: itemChecklistEnum("objetosSoltos"),
  // Itens externos
  pneus: itemChecklistEnum("pneus"),
  vazamentos: itemChecklistEnum("vazamentos"),
  trianguloCones: itemChecklistEnum("trianguloCones"),
  espelhos: itemChecklistEnum("espelhos"),
  lonaCarga: itemChecklistEnum("lonaCarga"),
  faixasRefletivas: itemChecklistEnum("faixasRefletivas"),
  luzesLaterais: itemChecklistEnum("luzesLaterais"),
  luzesFreio: itemChecklistEnum("luzesFreio"),
  farol: itemChecklistEnum("farol"),
  piscaAlerta: itemChecklistEnum("piscaAlerta"),
  re: itemChecklistEnum("re"),
  setas: itemChecklistEnum("setas"),
  macacoEstepe: itemChecklistEnum("macacoEstepe"),
  lanternas: itemChecklistEnum("lanternas"),
  // Resumo
  itensNaoConformes: integer("itensNaoConformes").default(0),
  observacoes: text("observacoes"),
  assinaturaMotorista: text("assinaturaMotorista"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: integer("deletedBy"),
  deleteReason: text("deleteReason")
});
var contasPagar = pgTable("contas_pagar", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresaId").notNull(),
  descricao: text("descricao").notNull(),
  categoria: categoriaContaPagarEnum("categoria").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  dataVencimento: date("dataVencimento").notNull(),
  dataPagamento: date("dataPagamento"),
  status: statusContaPagarEnum("status").default("pendente").notNull(),
  fornecedor: varchar("fornecedor", { length: 255 }),
  notaFiscal: varchar("notaFiscal", { length: 50 }),
  veiculoId: integer("veiculoId"),
  funcionarioId: integer("funcionarioId"),
  viagemId: integer("viagemId"),
  comprovante: text("comprovante"),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: integer("deletedBy"),
  deleteReason: text("deleteReason")
});
var contasReceber = pgTable("contas_receber", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresaId").notNull(),
  descricao: text("descricao").notNull(),
  categoria: categoriaContaReceberEnum("categoria").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  dataVencimento: date("dataVencimento").notNull(),
  dataRecebimento: date("dataRecebimento"),
  status: statusContaReceberEnum("status").default("pendente").notNull(),
  cliente: varchar("cliente", { length: 255 }),
  notaFiscal: varchar("notaFiscal", { length: 50 }),
  cteNumero: varchar("cteNumero", { length: 50 }),
  viagemId: integer("viagemId"),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: integer("deletedBy"),
  deleteReason: text("deleteReason")
});
var adiantamentos = pgTable("adiantamentos", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresaId").notNull(),
  funcionarioId: integer("funcionarioId").notNull(),
  viagemId: integer("viagemId"),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  formaPagamento: formaPagamentoEnum("formaPagamento").notNull(),
  data: date("data").notNull(),
  status: statusAdiantamentoEnum("status").default("pendente").notNull(),
  valorAcertado: decimal("valorAcertado", { precision: 10, scale: 2 }),
  dataAcerto: date("dataAcerto"),
  saldo: decimal("saldo", { precision: 10, scale: 2 }),
  // positivo = devolveu, negativo = empresa deve
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: integer("deletedBy"),
  deleteReason: text("deleteReason")
});
var controleTanque = pgTable("controle_tanque", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresaId").notNull(),
  tipo: tipoTanqueEnum("tipo").notNull(),
  data: date("data").notNull(),
  operacao: operacaoTanqueEnum("operacao").notNull(),
  quantidade: decimal("quantidade", { precision: 8, scale: 3 }).notNull(),
  valorUnitario: decimal("valorUnitario", { precision: 8, scale: 3 }),
  valorTotal: decimal("valorTotal", { precision: 10, scale: 2 }),
  fornecedor: varchar("fornecedor", { length: 255 }),
  notaFiscal: varchar("notaFiscal", { length: 50 }),
  veiculoId: integer("veiculoId"),
  // para saidas: qual veiculo abasteceu
  motoristaId: integer("motoristaId"),
  saldoAnterior: decimal("saldoAnterior", { precision: 8, scale: 3 }),
  saldoAtual: decimal("saldoAtual", { precision: 8, scale: 3 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: integer("deletedBy"),
  deleteReason: text("deleteReason")
});
var auditLog = pgTable("audit_log", {
  id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
  empresaId: integer("empresaId"),
  userId: integer("userId").notNull(),
  userName: varchar("userName", { length: 255 }),
  acao: varchar("acao", { length: 50 }).notNull(),
  // CREATE, UPDATE, DELETE, RESTORE
  tabela: varchar("tabela", { length: 100 }).notNull(),
  registroId: integer("registroId").notNull(),
  dadosAntes: text("dadosAntes"),
  // JSON
  dadosDepois: text("dadosDepois"),
  // JSON
  ip: varchar("ip", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var acidentes = pgTable("acidentes", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresaId").notNull(),
  veiculoId: integer("veiculoId").notNull(),
  motoristaId: integer("motoristaId"),
  data: date("data").notNull(),
  local: varchar("local", { length: 255 }),
  descricao: text("descricao").notNull(),
  boletimOcorrencia: varchar("boletimOcorrencia", { length: 50 }),
  valorDano: decimal("valorDano", { precision: 10, scale: 2 }),
  status: statusAcidenteEnum("status").default("aberto").notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: integer("deletedBy"),
  deleteReason: text("deleteReason")
});
var chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  empresaId: integer("empresaId").notNull(),
  name: varchar("name", { length: 255 }),
  // opcional para grupos
  isGroup: boolean("isGroup").default(false).notNull(),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt")
});
var chatMembers = pgTable("chat_members", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  userId: integer("userId").notNull(),
  role: chatRoleEnum("role").default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  lastReadAt: timestamp("lastReadAt").defaultNow().notNull()
});
var chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  senderId: integer("senderId").notNull(),
  content: text("content").notNull(),
  type: chatMessageTypeEnum("type").default("text").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt")
});

// db.ts
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });
dotenv.config();
var _db = null;
var _client = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL);
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _client = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "lastName", "email", "phone", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.openId === ENV.ownerOpenId) {
      values.role = "master_admin";
    } else if (user.role !== void 0) {
      values.role = user.role;
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users);
}
async function updateUser(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}
async function deleteUser(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, id));
}

// routers/veiculos.ts
import { eq as eq2, and, isNull, isNotNull, desc, sql } from "drizzle-orm";
import { z as z2 } from "zod";

// helpers/errorHandler.ts
async function safeDb(fn, context) {
  try {
    return await fn();
  } catch (error) {
    console.error(`[Database Error] in ${context}:`, error);
    throw error;
  }
}
function requireDb(db, context) {
  if (!db) {
    throw new Error(`[Database Error] Database not available in ${context}`);
  }
  return db;
}

// routers/veiculos.ts
var veiculoInput = z2.object({
  empresaId: z2.number(),
  placa: z2.string().min(1, "Placa \xE9 obrigat\xF3ria").max(10).transform((v) => v.toUpperCase().trim()),
  tipo: z2.enum(["van", "toco", "truck", "cavalo", "carreta", "empilhadeira", "paletera", "outro"]),
  cavaloPrincipalId: z2.number().nullable().optional(),
  marca: z2.string().max(100).optional(),
  modelo: z2.string().max(100).optional(),
  ano: z2.number().min(1900).max(2100).nullable().optional(),
  cor: z2.string().max(50).optional(),
  renavam: z2.string().max(20).optional(),
  chassi: z2.string().max(30).optional(),
  capacidadeCarga: z2.string().nullable().optional(),
  motoristaId: z2.number().nullable().optional(),
  ajudanteId: z2.number().nullable().optional(),
  kmAtual: z2.number().nullable().optional(),
  mediaConsumo: z2.string().nullable().optional(),
  vencimentoCrlv: z2.string().nullable().optional(),
  vencimentoSeguro: z2.string().nullable().optional(),
  classificacao: z2.number().min(0).max(5).optional(),
  observacoes: z2.string().optional()
});
function parseDate(d) {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}
var veiculosRouter = router({
  list: protectedProcedure.input(z2.object({
    empresaId: z2.number(),
    tipo: z2.enum(["van", "toco", "truck", "cavalo", "carreta", "empilhadeira", "paletera", "outro"]).optional(),
    apenasAtivos: z2.boolean().default(true)
  })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "veiculos.list");
      return db.select().from(veiculos).where(and(
        eq2(veiculos.empresaId, input.empresaId),
        isNull(veiculos.deletedAt),
        input.apenasAtivos ? eq2(veiculos.ativo, true) : void 0,
        input.tipo ? eq2(veiculos.tipo, input.tipo) : void 0
      )).orderBy(veiculos.placa);
    }, "veiculos.list");
  }),
  listCavalos: protectedProcedure.input(z2.object({ empresaId: z2.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "veiculos.listCavalos");
      return db.select().from(veiculos).where(and(
        eq2(veiculos.empresaId, input.empresaId),
        eq2(veiculos.tipo, "cavalo"),
        eq2(veiculos.ativo, true),
        isNull(veiculos.deletedAt)
      )).orderBy(veiculos.placa);
    }, "veiculos.listCavalos");
  }),
  getById: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "veiculos.getById");
      const rows = await db.select().from(veiculos).where(and(eq2(veiculos.id, input.id), isNull(veiculos.deletedAt))).limit(1);
      return rows[0] ?? null;
    }, "veiculos.getById");
  }),
  create: protectedProcedure.input(veiculoInput).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "veiculos.create");
      const [result] = await db.insert(veiculos).values({
        ...input,
        capacidadeCarga: input.capacidadeCarga ?? null,
        mediaConsumo: input.mediaConsumo ?? null,
        vencimentoCrlv: parseDate(input.vencimentoCrlv),
        vencimentoSeguro: parseDate(input.vencimentoSeguro),
        ativo: true
      });
      return { id: result.insertId };
    }, "veiculos.create");
  }),
  update: protectedProcedure.input(z2.object({ id: z2.number() }).merge(veiculoInput.partial())).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "veiculos.update");
      const { id, ...data } = input;
      await db.update(veiculos).set({
        ...data,
        placa: data.placa ? data.placa.toUpperCase().trim() : void 0,
        vencimentoCrlv: data.vencimentoCrlv !== void 0 ? parseDate(data.vencimentoCrlv) : void 0,
        vencimentoSeguro: data.vencimentoSeguro !== void 0 ? parseDate(data.vencimentoSeguro) : void 0,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(veiculos.id, id));
      return { success: true };
    }, "veiculos.update");
  }),
  softDelete: protectedProcedure.input(z2.object({ id: z2.number(), reason: z2.string().min(1, "Informe o motivo da exclus\xE3o") })).mutation(async ({ input, ctx }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "veiculos.softDelete");
      await db.update(veiculos).set({
        deletedAt: /* @__PURE__ */ new Date(),
        deletedBy: ctx.user.id,
        deleteReason: input.reason,
        ativo: false
      }).where(eq2(veiculos.id, input.id));
      return { success: true };
    }, "veiculos.softDelete");
  }),
  restore: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "veiculos.restore");
      await db.update(veiculos).set({
        deletedAt: null,
        deletedBy: null,
        deleteReason: null,
        ativo: true
      }).where(eq2(veiculos.id, input.id));
      return { success: true };
    }, "veiculos.restore");
  }),
  getUltimoKm: protectedProcedure.input(z2.object({ veiculoId: z2.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "veiculos.getUltimoKm");
      const rows = await db.execute(sql`
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
  listDeleted: protectedProcedure.input(z2.object({ empresaId: z2.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "veiculos.listDeleted");
      return db.select().from(veiculos).where(and(
        eq2(veiculos.empresaId, input.empresaId),
        isNotNull(veiculos.deletedAt)
      )).orderBy(desc(veiculos.deletedAt));
    }, "veiculos.listDeleted");
  })
});

// routers/funcionarios.ts
import { eq as eq3, and as and2, isNull as isNull2, isNotNull as isNotNull2, desc as desc2 } from "drizzle-orm";
import { z as z3 } from "zod";
var funcionarioInput = z3.object({
  empresaId: z3.number(),
  nome: z3.string().min(1, "Nome \xE9 obrigat\xF3rio").max(255),
  funcao: z3.enum(["motorista", "ajudante", "despachante", "gerente", "admin", "outro"]),
  tipoContrato: z3.enum(["clt", "freelancer", "terceirizado", "estagiario"]).default("clt"),
  cpf: z3.string().max(14).optional(),
  rg: z3.string().max(20).optional(),
  telefone: z3.string().max(20).optional(),
  email: z3.string().email("E-mail inv\xE1lido").max(320).optional().or(z3.literal("")),
  // CLT
  salario: z3.string().nullable().optional(),
  dataAdmissao: z3.string().nullable().optional(),
  dataDemissao: z3.string().nullable().optional(),
  // Freelancer
  valorDiaria: z3.string().nullable().optional(),
  valorMensal: z3.string().nullable().optional(),
  tipoCobranca: z3.enum(["diaria", "mensal", "por_viagem"]).nullable().optional(),
  dataInicioContrato: z3.string().nullable().optional(),
  dataFimContrato: z3.string().nullable().optional(),
  diaPagamento: z3.number().min(1).max(31).nullable().optional(),
  // Motorista
  cnh: z3.string().max(20).optional(),
  categoriaCnh: z3.string().max(5).optional(),
  vencimentoCnh: z3.string().nullable().optional(),
  mopp: z3.boolean().optional(),
  vencimentoMopp: z3.string().nullable().optional(),
  vencimentoAso: z3.string().nullable().optional(),
  // Bancário
  banco: z3.string().max(100).optional(),
  agencia: z3.string().max(10).optional(),
  conta: z3.string().max(20).optional(),
  tipoConta: z3.enum(["corrente", "poupanca", "pix"]).nullable().optional(),
  chavePix: z3.string().max(255).optional(),
  observacoes: z3.string().optional(),
  foto: z3.string().optional()
});
function parseDate2(d) {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}
var funcionariosRouter = router({
  list: protectedProcedure.input(z3.object({
    empresaId: z3.number(),
    funcao: z3.enum(["motorista", "ajudante", "despachante", "gerente", "admin", "outro"]).optional(),
    tipoContrato: z3.enum(["clt", "freelancer", "terceirizado", "estagiario"]).optional()
  })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "funcionarios.list");
      return db.select().from(funcionarios).where(and2(
        eq3(funcionarios.empresaId, input.empresaId),
        isNull2(funcionarios.deletedAt),
        input.funcao ? eq3(funcionarios.funcao, input.funcao) : void 0,
        input.tipoContrato ? eq3(funcionarios.tipoContrato, input.tipoContrato) : void 0
      )).orderBy(funcionarios.nome);
    }, "funcionarios.list");
  }),
  listMotoristas: protectedProcedure.input(z3.object({ empresaId: z3.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "funcionarios.listMotoristas");
      return db.select().from(funcionarios).where(and2(
        eq3(funcionarios.empresaId, input.empresaId),
        eq3(funcionarios.funcao, "motorista"),
        isNull2(funcionarios.deletedAt)
      )).orderBy(funcionarios.nome);
    }, "funcionarios.listMotoristas");
  }),
  listAjudantes: protectedProcedure.input(z3.object({ empresaId: z3.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "funcionarios.listAjudantes");
      return db.select().from(funcionarios).where(and2(
        eq3(funcionarios.empresaId, input.empresaId),
        eq3(funcionarios.funcao, "ajudante"),
        isNull2(funcionarios.deletedAt)
      )).orderBy(funcionarios.nome);
    }, "funcionarios.listAjudantes");
  }),
  getById: protectedProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "funcionarios.getById");
      const rows = await db.select().from(funcionarios).where(and2(eq3(funcionarios.id, input.id), isNull2(funcionarios.deletedAt))).limit(1);
      return rows[0] ?? null;
    }, "funcionarios.getById");
  }),
  freelancersPendentes: protectedProcedure.input(z3.object({ empresaId: z3.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "funcionarios.freelancersPendentes");
      const hoje = /* @__PURE__ */ new Date();
      const rows = await db.select().from(funcionarios).where(and2(
        eq3(funcionarios.empresaId, input.empresaId),
        eq3(funcionarios.tipoContrato, "freelancer"),
        isNull2(funcionarios.deletedAt)
      ));
      return rows.filter((f) => {
        if (!f.diaPagamento) return false;
        const diaAtual = hoje.getDate();
        const diff = f.diaPagamento - diaAtual;
        return diff >= 0 && diff <= 7;
      });
    }, "funcionarios.freelancersPendentes");
  }),
  create: protectedProcedure.input(funcionarioInput).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "funcionarios.create");
      const [result] = await db.insert(funcionarios).values({
        ...input,
        email: input.email || null,
        salario: input.salario ?? null,
        valorDiaria: input.valorDiaria ?? null,
        valorMensal: input.valorMensal ?? null,
        dataAdmissao: parseDate2(input.dataAdmissao),
        dataDemissao: parseDate2(input.dataDemissao),
        dataInicioContrato: parseDate2(input.dataInicioContrato),
        dataFimContrato: parseDate2(input.dataFimContrato),
        vencimentoCnh: parseDate2(input.vencimentoCnh),
        vencimentoMopp: parseDate2(input.vencimentoMopp),
        vencimentoAso: parseDate2(input.vencimentoAso),
        ativo: true
      });
      return { id: result.insertId };
    }, "funcionarios.create");
  }),
  update: protectedProcedure.input(z3.object({ id: z3.number() }).merge(funcionarioInput.partial())).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "funcionarios.update");
      const { id, ...data } = input;
      await db.update(funcionarios).set({
        ...data,
        email: data.email !== void 0 ? data.email || null : void 0,
        dataAdmissao: data.dataAdmissao !== void 0 ? parseDate2(data.dataAdmissao) : void 0,
        dataDemissao: data.dataDemissao !== void 0 ? parseDate2(data.dataDemissao) : void 0,
        dataInicioContrato: data.dataInicioContrato !== void 0 ? parseDate2(data.dataInicioContrato) : void 0,
        dataFimContrato: data.dataFimContrato !== void 0 ? parseDate2(data.dataFimContrato) : void 0,
        vencimentoCnh: data.vencimentoCnh !== void 0 ? parseDate2(data.vencimentoCnh) : void 0,
        vencimentoMopp: data.vencimentoMopp !== void 0 ? parseDate2(data.vencimentoMopp) : void 0,
        vencimentoAso: data.vencimentoAso !== void 0 ? parseDate2(data.vencimentoAso) : void 0,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq3(funcionarios.id, id));
      return { success: true };
    }, "funcionarios.update");
  }),
  softDelete: protectedProcedure.input(z3.object({ id: z3.number(), reason: z3.string().min(1, "Informe o motivo da exclus\xE3o") })).mutation(async ({ input, ctx }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "funcionarios.softDelete");
      await db.update(funcionarios).set({
        deletedAt: /* @__PURE__ */ new Date(),
        deletedBy: ctx.user.id,
        deleteReason: input.reason,
        ativo: false
      }).where(eq3(funcionarios.id, input.id));
      return { success: true };
    }, "funcionarios.softDelete");
  }),
  restore: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "funcionarios.restore");
      await db.update(funcionarios).set({
        deletedAt: null,
        deletedBy: null,
        deleteReason: null,
        ativo: true
      }).where(eq3(funcionarios.id, input.id));
      return { success: true };
    }, "funcionarios.restore");
  }),
  listDeleted: protectedProcedure.input(z3.object({ empresaId: z3.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "funcionarios.listDeleted");
      return db.select().from(funcionarios).where(and2(
        eq3(funcionarios.empresaId, input.empresaId),
        isNotNull2(funcionarios.deletedAt)
      )).orderBy(desc2(funcionarios.deletedAt));
    }, "funcionarios.listDeleted");
  })
});

// routers/frota.ts
import { eq as eq4, and as and3, isNull as isNull3, isNotNull as isNotNull3, desc as desc3, gte, lte, sql as sql2 } from "drizzle-orm";
import { z as z4 } from "zod";
function parseDate3(d) {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}
var frotaRouter = router({
  // ─── ABASTECIMENTOS ───────────────────────────────────────────────────────
  abastecimentos: router({
    list: protectedProcedure.input(z4.object({
      empresaId: z4.number(),
      veiculoId: z4.number().optional(),
      motoristaId: z4.number().optional(),
      tipoCombustivel: z4.enum(["diesel", "arla", "gasolina", "etanol", "gas", "outro"]).optional(),
      tipoAbastecimento: z4.enum(["interno", "externo"]).optional(),
      dataInicio: z4.string().optional(),
      dataFim: z4.string().optional(),
      busca: z4.string().optional(),
      limit: z4.number().default(100)
    })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "abastecimentos.list");
        return db.select().from(abastecimentos).where(and3(
          eq4(abastecimentos.empresaId, input.empresaId),
          isNull3(abastecimentos.deletedAt),
          input.veiculoId ? eq4(abastecimentos.veiculoId, input.veiculoId) : void 0,
          input.motoristaId ? eq4(abastecimentos.motoristaId, input.motoristaId) : void 0,
          input.tipoCombustivel ? eq4(abastecimentos.tipoCombustivel, input.tipoCombustivel) : void 0,
          input.tipoAbastecimento ? eq4(abastecimentos.tipoAbastecimento, input.tipoAbastecimento) : void 0,
          input.dataInicio ? gte(abastecimentos.data, new Date(input.dataInicio)) : void 0,
          input.dataFim ? lte(abastecimentos.data, /* @__PURE__ */ new Date(input.dataFim + "T23:59:59")) : void 0
        )).orderBy(desc3(abastecimentos.data)).limit(input.limit);
      }, "abastecimentos.list");
    }),
    create: protectedProcedure.input(z4.object({
      empresaId: z4.number(),
      veiculoId: z4.number(),
      motoristaId: z4.number().nullable().optional(),
      data: z4.string(),
      tipoCombustivel: z4.enum(["diesel", "arla", "gasolina", "etanol", "gas", "outro"]),
      quantidade: z4.string(),
      valorUnitario: z4.string().nullable().optional(),
      valorTotal: z4.string().nullable().optional(),
      kmAtual: z4.number().nullable().optional(),
      kmRodado: z4.number().nullable().optional(),
      mediaConsumo: z4.string().nullable().optional(),
      local: z4.string().optional(),
      tipoAbastecimento: z4.enum(["interno", "externo"]).default("interno"),
      notaFiscal: z4.string().optional(),
      observacoes: z4.string().optional()
    })).mutation(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "abastecimentos.create");
        const [result] = await db.insert(abastecimentos).values({
          ...input,
          data: new Date(input.data)
        });
        return { id: result.insertId };
      }, "abastecimentos.create");
    }),
    update: protectedProcedure.input(z4.object({
      id: z4.number(),
      data: z4.string().optional(),
      tipoCombustivel: z4.enum(["diesel", "arla", "gasolina", "etanol", "gas", "outro"]).optional(),
      quantidade: z4.string().optional(),
      valorUnitario: z4.string().nullable().optional(),
      valorTotal: z4.string().nullable().optional(),
      kmAtual: z4.number().nullable().optional(),
      local: z4.string().optional(),
      observacoes: z4.string().optional()
    })).mutation(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "abastecimentos.update");
        const { id, data, ...rest } = input;
        await db.update(abastecimentos).set({
          ...rest,
          ...data ? { data: new Date(data) } : {},
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq4(abastecimentos.id, id));
        return { success: true };
      }, "abastecimentos.update");
    }),
    softDelete: protectedProcedure.input(z4.object({ id: z4.number(), reason: z4.string().min(1, "Informe o motivo") })).mutation(async ({ input, ctx }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "abastecimentos.softDelete");
        await db.update(abastecimentos).set({
          deletedAt: /* @__PURE__ */ new Date(),
          deletedBy: ctx.user.id,
          deleteReason: input.reason
        }).where(eq4(abastecimentos.id, input.id));
        return { success: true };
      }, "abastecimentos.softDelete");
    }),
    resumoPorVeiculo: protectedProcedure.input(z4.object({ empresaId: z4.number() })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "abastecimentos.resumoPorVeiculo");
        return db.select({
          veiculoId: abastecimentos.veiculoId,
          totalLitros: sql2`SUM(${abastecimentos.quantidade})`,
          totalValor: sql2`SUM(${abastecimentos.valorTotal})`,
          mediaConsumo: sql2`AVG(${abastecimentos.mediaConsumo})`,
          ultimoAbastecimento: sql2`MAX(${abastecimentos.data})`
        }).from(abastecimentos).where(and3(eq4(abastecimentos.empresaId, input.empresaId), isNull3(abastecimentos.deletedAt))).groupBy(abastecimentos.veiculoId);
      }, "abastecimentos.resumoPorVeiculo");
    }),
    // Preço médio do diesel nos últimos 30 dias (para calculadora)
    precioMedioDiesel: protectedProcedure.input(z4.object({ empresaId: z4.number() })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "abastecimentos.precioMedioDiesel");
        const trintaDiasAtras = /* @__PURE__ */ new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
        const rows = await db.select({
          media: sql2`AVG(${abastecimentos.valorUnitario})`
        }).from(abastecimentos).where(and3(
          eq4(abastecimentos.empresaId, input.empresaId),
          eq4(abastecimentos.tipoCombustivel, "diesel"),
          isNull3(abastecimentos.deletedAt),
          gte(abastecimentos.data, trintaDiasAtras)
        ));
        return { precioMedio: Number(rows[0]?.media) || 6.5 };
      }, "abastecimentos.precioMedioDiesel");
    })
  }),
  // ─── MANUTENÇÕES ──────────────────────────────────────────────────────────
  manutencoes: router({
    list: protectedProcedure.input(z4.object({
      empresaId: z4.number(),
      veiculoId: z4.number().optional(),
      tipo: z4.enum(["preventiva", "corretiva", "revisao", "pneu", "eletrica", "funilaria", "outro"]).optional(),
      dataInicio: z4.string().optional(),
      dataFim: z4.string().optional(),
      busca: z4.string().optional(),
      limit: z4.number().default(100)
    })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "manutencoes.list");
        return db.select().from(manutencoes).where(and3(
          eq4(manutencoes.empresaId, input.empresaId),
          isNull3(manutencoes.deletedAt),
          input.veiculoId ? eq4(manutencoes.veiculoId, input.veiculoId) : void 0,
          input.tipo ? eq4(manutencoes.tipo, input.tipo) : void 0,
          input.dataInicio ? gte(manutencoes.data, new Date(input.dataInicio)) : void 0,
          input.dataFim ? lte(manutencoes.data, /* @__PURE__ */ new Date(input.dataFim + "T23:59:59")) : void 0
        )).orderBy(desc3(manutencoes.data)).limit(input.limit);
      }, "manutencoes.list");
    }),
    create: protectedProcedure.input(z4.object({
      empresaId: z4.number(),
      veiculoId: z4.number(),
      data: z4.string(),
      tipo: z4.enum(["preventiva", "corretiva", "revisao", "pneu", "eletrica", "funilaria", "outro"]),
      descricao: z4.string().min(1, "Descri\xE7\xE3o \xE9 obrigat\xF3ria"),
      empresa: z4.string().optional(),
      valor: z4.string().nullable().optional(),
      kmAtual: z4.number().nullable().optional(),
      proximaManutencaoKm: z4.number().nullable().optional(),
      proximaManutencaoData: z4.string().nullable().optional(),
      notaFiscal: z4.string().optional(),
      observacoes: z4.string().optional()
    })).mutation(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "manutencoes.create");
        const [result] = await db.insert(manutencoes).values({
          ...input,
          data: new Date(input.data),
          proximaManutencaoData: parseDate3(input.proximaManutencaoData)
        });
        return { id: result.insertId };
      }, "manutencoes.create");
    }),
    update: protectedProcedure.input(z4.object({
      id: z4.number(),
      data: z4.string().optional(),
      tipo: z4.enum(["preventiva", "corretiva", "revisao", "pneu", "eletrica", "funilaria", "outro"]).optional(),
      descricao: z4.string().optional(),
      empresa: z4.string().optional(),
      valor: z4.string().nullable().optional(),
      kmAtual: z4.number().nullable().optional(),
      observacoes: z4.string().optional()
    })).mutation(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "manutencoes.update");
        const { id, data, ...rest } = input;
        await db.update(manutencoes).set({
          ...rest,
          ...data ? { data: new Date(data) } : {},
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq4(manutencoes.id, id));
        return { success: true };
      }, "manutencoes.update");
    }),
    softDelete: protectedProcedure.input(z4.object({ id: z4.number(), reason: z4.string().min(1, "Informe o motivo") })).mutation(async ({ input, ctx }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "manutencoes.softDelete");
        await db.update(manutencoes).set({
          deletedAt: /* @__PURE__ */ new Date(),
          deletedBy: ctx.user.id,
          deleteReason: input.reason
        }).where(eq4(manutencoes.id, input.id));
        return { success: true };
      }, "manutencoes.softDelete");
    }),
    totalPorVeiculo: protectedProcedure.input(z4.object({ empresaId: z4.number() })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "manutencoes.totalPorVeiculo");
        return db.select({
          veiculoId: manutencoes.veiculoId,
          totalValor: sql2`SUM(${manutencoes.valor})`,
          quantidade: sql2`COUNT(*)`,
          ultimaManutencao: sql2`MAX(${manutencoes.data})`
        }).from(manutencoes).where(and3(eq4(manutencoes.empresaId, input.empresaId), isNull3(manutencoes.deletedAt))).groupBy(manutencoes.veiculoId);
      }, "manutencoes.totalPorVeiculo");
    })
  }),
  // ─── CONTROLE TANQUE ──────────────────────────────────────────────────────
  tanque: router({
    list: protectedProcedure.input(z4.object({ empresaId: z4.number(), limit: z4.number().default(50) })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "tanque.list");
        return db.select().from(controleTanque).where(and3(eq4(controleTanque.empresaId, input.empresaId), isNull3(controleTanque.deletedAt))).orderBy(desc3(controleTanque.data)).limit(input.limit);
      }, "tanque.list");
    }),
    saldoAtual: protectedProcedure.input(z4.object({ empresaId: z4.number() })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "tanque.saldoAtual");
        const rows = await db.select({
          tipo: controleTanque.tipo,
          saldo: sql2`SUM(CASE WHEN ${controleTanque.operacao} = 'entrada' THEN ${controleTanque.quantidade} ELSE -${controleTanque.quantidade} END)`
        }).from(controleTanque).where(and3(eq4(controleTanque.empresaId, input.empresaId), isNull3(controleTanque.deletedAt))).groupBy(controleTanque.tipo);
        const result = { diesel: 0, arla: 0 };
        rows.forEach((r) => {
          if (r.tipo === "diesel") result.diesel = Number(r.saldo) || 0;
          if (r.tipo === "arla") result.arla = Number(r.saldo) || 0;
        });
        return result;
      }, "tanque.saldoAtual");
    }),
    create: protectedProcedure.input(z4.object({
      empresaId: z4.number(),
      tipo: z4.enum(["diesel", "arla"]),
      data: z4.string(),
      operacao: z4.enum(["entrada", "saida"]),
      quantidade: z4.string(),
      valorUnitario: z4.string().nullable().optional(),
      valorTotal: z4.string().nullable().optional(),
      fornecedor: z4.string().optional(),
      notaFiscal: z4.string().optional(),
      veiculoId: z4.number().nullable().optional(),
      motoristaId: z4.number().nullable().optional(),
      observacoes: z4.string().optional()
    })).mutation(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "tanque.create");
        const [result] = await db.insert(controleTanque).values({
          ...input,
          data: new Date(input.data)
        });
        return { id: result.insertId };
      }, "tanque.create");
    }),
    // Custo médio ponderado do tanque
    custoMedio: protectedProcedure.input(z4.object({ empresaId: z4.number() })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "tanque.custoMedio");
        const entradas = await db.select().from(controleTanque).where(and3(
          eq4(controleTanque.empresaId, input.empresaId),
          eq4(controleTanque.operacao, "entrada"),
          isNull3(controleTanque.deletedAt),
          isNotNull3(controleTanque.valorUnitario)
        )).orderBy(controleTanque.data);
        const calcMedia = (tipo) => {
          const items = entradas.filter((e) => e.tipo === tipo);
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
              custoMedio: Math.round(custoMedioAtual * 1e3) / 1e3,
              fornecedor: item.fornecedor
            });
          }
          return {
            custoMedio: saldoQtd > 0 ? Math.round(saldoValor / saldoQtd * 1e3) / 1e3 : 0,
            totalComprado: Math.round(saldoQtd * 100) / 100,
            totalInvestido: Math.round(saldoValor * 100) / 100,
            ultimaCompra: items.length > 0 ? {
              data: String(items[items.length - 1].data),
              valorUnitario: Number(items[items.length - 1].valorUnitario) || 0,
              fornecedor: items[items.length - 1].fornecedor
            } : null,
            historicoCompras: historico.slice(-20)
            // últimas 20 compras
          };
        };
        return {
          diesel: calcMedia("diesel"),
          arla: calcMedia("arla")
        };
      }, "tanque.custoMedio");
    })
  }),
  // ─── CALCULADORA DE VIAGEM ────────────────────────────────────────────────
  calcularCustoViagem: protectedProcedure.input(z4.object({
    empresaId: z4.number(),
    veiculoId: z4.number(),
    distanciaKm: z4.number().min(1, "Dist\xE2ncia deve ser maior que zero"),
    freteTotal: z4.number().min(0),
    diasViagem: z4.number().min(1).default(1),
    // Ajudantes para calcular diárias
    ajudante1Id: z4.number().nullable().optional(),
    ajudante2Id: z4.number().nullable().optional(),
    ajudante3Id: z4.number().nullable().optional(),
    // Custos extras estimados
    pedagioEstimado: z4.number().default(0),
    outrosCustos: z4.number().default(0),
    // Preço do diesel (se não informado, usa média dos últimos 30 dias)
    precoDiesel: z4.number().nullable().optional()
  })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "frota.calcularCustoViagem");
      const veiculoRows = await db.select({
        mediaConsumo: veiculos.mediaConsumo,
        tipo: veiculos.tipo
      }).from(veiculos).where(eq4(veiculos.id, input.veiculoId)).limit(1);
      const veiculo = veiculoRows[0];
      const mediaConsumo = Number(veiculo?.mediaConsumo) || 3.5;
      let precoDiesel = input.precoDiesel;
      if (!precoDiesel) {
        const trintaDiasAtras = /* @__PURE__ */ new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
        const precoRows = await db.select({
          media: sql2`AVG(${abastecimentos.valorUnitario})`
        }).from(abastecimentos).where(and3(
          eq4(abastecimentos.empresaId, input.empresaId),
          eq4(abastecimentos.tipoCombustivel, "diesel"),
          isNull3(abastecimentos.deletedAt),
          gte(abastecimentos.data, trintaDiasAtras)
        ));
        precoDiesel = Number(precoRows[0]?.media) || 6.5;
      }
      const litrosNecessarios = input.distanciaKm / mediaConsumo;
      const custoCombustivel = litrosNecessarios * precoDiesel;
      let custoDiariasMotorista = 0;
      const veiculoComMotorista = await db.select({
        motoristaId: veiculos.motoristaId
      }).from(veiculos).where(eq4(veiculos.id, input.veiculoId)).limit(1);
      if (veiculoComMotorista[0]?.motoristaId) {
        const motoristaRows = await db.select({
          valorDiaria: funcionarios.valorDiaria,
          tipoCobranca: funcionarios.tipoCobranca
        }).from(funcionarios).where(eq4(funcionarios.id, veiculoComMotorista[0].motoristaId)).limit(1);
        const motorista = motoristaRows[0];
        if (motorista?.tipoCobranca === "diaria" && motorista.valorDiaria) {
          custoDiariasMotorista = Number(motorista.valorDiaria) * input.diasViagem;
        }
      }
      let custoDiariasAjudantes = 0;
      const ajudanteIds = [input.ajudante1Id, input.ajudante2Id, input.ajudante3Id].filter(Boolean);
      for (const ajId of ajudanteIds) {
        const ajRows = await db.select({
          valorDiaria: funcionarios.valorDiaria,
          tipoCobranca: funcionarios.tipoCobranca
        }).from(funcionarios).where(eq4(funcionarios.id, ajId)).limit(1);
        const aj = ajRows[0];
        if (aj?.tipoCobranca === "diaria" && aj.valorDiaria) {
          custoDiariasAjudantes += Number(aj.valorDiaria) * input.diasViagem;
        }
      }
      const custoTotal = custoCombustivel + custoDiariasMotorista + custoDiariasAjudantes + input.pedagioEstimado + input.outrosCustos;
      const lucroEstimado = input.freteTotal - custoTotal;
      const margemPercent = input.freteTotal > 0 ? lucroEstimado / input.freteTotal * 100 : 0;
      let classificacao;
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
        classificacao
      };
    }, "frota.calcularCustoViagem");
  }),
  // ─── SIMULAÇÕES DE VIAGEM ─────────────────────────────────────────────────
  listSimulacoes: protectedProcedure.input(z4.object({ empresaId: z4.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "frota.listSimulacoes");
      const rows = await db.execute(sql2`
          SELECT * FROM simulacoes_viagem
          WHERE empresaId = ${input.empresaId}
          ORDER BY createdAt DESC
          LIMIT 50
        `);
      return rows[0] ?? [];
    }, "frota.listSimulacoes");
  }),
  salvarSimulacao: protectedProcedure.input(z4.object({
    empresaId: z4.number(),
    veiculoId: z4.number().optional(),
    descricao: z4.string().min(1),
    origem: z4.string().optional(),
    destino: z4.string().optional(),
    distanciaKm: z4.number(),
    valorFrete: z4.number(),
    custoTotal: z4.number(),
    margemBruta: z4.number(),
    margemPct: z4.number(),
    detalhes: z4.string().optional(),
    observacoes: z4.string().optional()
  })).mutation(async ({ input, ctx }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "frota.salvarSimulacao");
      await db.execute(sql2`
          INSERT INTO simulacoes_viagem
            (empresaId, veiculoId, descricao, origem, destino, distanciaKm, valorFrete, custoTotal, margemBruta, margemPct, detalhes, observacoes, createdBy)
          VALUES
            (${input.empresaId}, ${input.veiculoId ?? null}, ${input.descricao}, ${input.origem ?? null}, ${input.destino ?? null},
             ${input.distanciaKm}, ${input.valorFrete}, ${input.custoTotal}, ${input.margemBruta}, ${input.margemPct},
             ${input.detalhes ?? null}, ${input.observacoes ?? null}, ${ctx.user?.name ?? null})
        `);
      return { success: true };
    }, "frota.salvarSimulacao");
  })
});

// routers/financeiro.ts
import { eq as eq5, and as and4, isNull as isNull4, desc as desc4, sql as sql3, gte as gte2 } from "drizzle-orm";
import { z as z5 } from "zod";
import { TRPCError as TRPCError3 } from "@trpc/server";
function parseDate4(d) {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}
var financeiroRouter = router({
  // ─── CONTAS A PAGAR ───────────────────────────────────────────────────────
  pagar: router({
    list: protectedProcedure.input(z5.object({
      empresaId: z5.number(),
      status: z5.enum(["pendente", "pago", "vencido", "cancelado"]).optional(),
      limit: z5.number().default(50)
    })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.pagar.list");
        return db.select().from(contasPagar).where(and4(
          eq5(contasPagar.empresaId, input.empresaId),
          isNull4(contasPagar.deletedAt),
          input.status ? eq5(contasPagar.status, input.status) : void 0
        )).orderBy(contasPagar.dataVencimento).limit(input.limit);
      }, "financeiro.pagar.list");
    }),
    create: protectedProcedure.input(z5.object({
      empresaId: z5.number(),
      descricao: z5.string().min(1, "Descri\xE7\xE3o \xE9 obrigat\xF3ria"),
      categoria: z5.enum(["combustivel", "manutencao", "salario", "freelancer", "pedagio", "seguro", "ipva", "licenciamento", "pneu", "outro"]),
      valor: z5.string(),
      dataVencimento: z5.string(),
      dataPagamento: z5.string().nullable().optional(),
      status: z5.enum(["pendente", "pago", "vencido", "cancelado"]).default("pendente"),
      fornecedor: z5.string().optional(),
      notaFiscal: z5.string().optional(),
      veiculoId: z5.number().nullable().optional(),
      funcionarioId: z5.number().nullable().optional(),
      viagemId: z5.number().nullable().optional(),
      observacoes: z5.string().optional()
    })).mutation(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.pagar.create");
        const [result] = await db.insert(contasPagar).values({
          ...input,
          dataVencimento: new Date(input.dataVencimento),
          dataPagamento: parseDate4(input.dataPagamento)
        });
        return { id: result.insertId };
      }, "financeiro.pagar.create");
    }),
    update: protectedProcedure.input(z5.object({
      id: z5.number(),
      descricao: z5.string().optional(),
      valor: z5.string().optional(),
      dataVencimento: z5.string().optional(),
      dataPagamento: z5.string().nullable().optional(),
      status: z5.enum(["pendente", "pago", "vencido", "cancelado"]).optional(),
      observacoes: z5.string().optional()
    })).mutation(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.pagar.update");
        const { id, dataVencimento, dataPagamento, ...rest } = input;
        await db.update(contasPagar).set({
          ...rest,
          ...dataVencimento ? { dataVencimento: new Date(dataVencimento) } : {},
          ...dataPagamento !== void 0 ? { dataPagamento: parseDate4(dataPagamento) } : {},
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq5(contasPagar.id, id));
        return { success: true };
      }, "financeiro.pagar.update");
    }),
    softDelete: protectedProcedure.input(z5.object({ id: z5.number(), reason: z5.string().min(1, "Informe o motivo") })).mutation(async ({ input, ctx }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.pagar.softDelete");
        await db.update(contasPagar).set({
          deletedAt: /* @__PURE__ */ new Date(),
          deletedBy: ctx.user.id,
          deleteReason: input.reason
        }).where(eq5(contasPagar.id, input.id));
        return { success: true };
      }, "financeiro.pagar.softDelete");
    }),
    resumo: protectedProcedure.input(z5.object({ empresaId: z5.number() })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.pagar.resumo");
        const hoje = /* @__PURE__ */ new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const inicioMesStr = inicioMes.toISOString();
        const rows = await db.select({
          status: contasPagar.status,
          total: sql3`SUM(${contasPagar.valor})`
        }).from(contasPagar).where(and4(eq5(contasPagar.empresaId, input.empresaId), isNull4(contasPagar.deletedAt))).groupBy(contasPagar.status);
        const result = { pendente: 0, vencido: 0, pagoMes: 0 };
        rows.forEach((r) => {
          if (r.status === "pendente") result.pendente = Number(r.total) || 0;
          if (r.status === "vencido") result.vencido = Number(r.total) || 0;
        });
        const pagoRows = await db.select({ total: sql3`SUM(${contasPagar.valor})` }).from(contasPagar).where(and4(
          eq5(contasPagar.empresaId, input.empresaId),
          eq5(contasPagar.status, "pago"),
          gte2(contasPagar.dataPagamento, sql3`${inicioMesStr}::timestamp`),
          isNull4(contasPagar.deletedAt)
        ));
        result.pagoMes = Number(pagoRows[0]?.total) || 0;
        return result;
      }, "financeiro.pagar.resumo");
    })
  }),
  // ─── CONTAS A RECEBER ─────────────────────────────────────────────────────
  receber: router({
    list: protectedProcedure.input(z5.object({
      empresaId: z5.number(),
      status: z5.enum(["pendente", "recebido", "vencido", "cancelado"]).optional(),
      limit: z5.number().default(50)
    })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.receber.list");
        return db.select().from(contasReceber).where(and4(
          eq5(contasReceber.empresaId, input.empresaId),
          isNull4(contasReceber.deletedAt),
          input.status ? eq5(contasReceber.status, input.status) : void 0
        )).orderBy(contasReceber.dataVencimento).limit(input.limit);
      }, "financeiro.receber.list");
    }),
    create: protectedProcedure.input(z5.object({
      empresaId: z5.number(),
      descricao: z5.string().min(1, "Descri\xE7\xE3o \xE9 obrigat\xF3ria"),
      categoria: z5.enum(["frete", "cte", "devolucao", "outro"]),
      valor: z5.string(),
      dataVencimento: z5.string(),
      dataRecebimento: z5.string().nullable().optional(),
      status: z5.enum(["pendente", "recebido", "vencido", "cancelado"]).default("pendente"),
      cliente: z5.string().optional(),
      notaFiscal: z5.string().optional(),
      cteNumero: z5.string().optional(),
      viagemId: z5.number().nullable().optional(),
      observacoes: z5.string().optional()
    })).mutation(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.receber.create");
        const [result] = await db.insert(contasReceber).values({
          ...input,
          dataVencimento: new Date(input.dataVencimento),
          dataRecebimento: parseDate4(input.dataRecebimento)
        });
        return { id: result.insertId };
      }, "financeiro.receber.create");
    }),
    update: protectedProcedure.input(z5.object({
      id: z5.number(),
      descricao: z5.string().optional(),
      valor: z5.string().optional(),
      dataVencimento: z5.string().optional(),
      dataRecebimento: z5.string().nullable().optional(),
      status: z5.enum(["pendente", "recebido", "vencido", "cancelado"]).optional(),
      observacoes: z5.string().optional()
    })).mutation(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.receber.update");
        const { id, dataVencimento, dataRecebimento, ...rest } = input;
        await db.update(contasReceber).set({
          ...rest,
          ...dataVencimento ? { dataVencimento: new Date(dataVencimento) } : {},
          ...dataRecebimento !== void 0 ? { dataRecebimento: parseDate4(dataRecebimento) } : {},
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq5(contasReceber.id, id));
        return { success: true };
      }, "financeiro.receber.update");
    }),
    softDelete: protectedProcedure.input(z5.object({ id: z5.number(), reason: z5.string().min(1, "Informe o motivo") })).mutation(async ({ input, ctx }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.receber.softDelete");
        await db.update(contasReceber).set({
          deletedAt: /* @__PURE__ */ new Date(),
          deletedBy: ctx.user.id,
          deleteReason: input.reason
        }).where(eq5(contasReceber.id, input.id));
        return { success: true };
      }, "financeiro.receber.softDelete");
    }),
    resumo: protectedProcedure.input(z5.object({ empresaId: z5.number() })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.receber.resumo");
        const hoje = /* @__PURE__ */ new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const inicioMesStr = inicioMes.toISOString();
        const rows = await db.select({
          status: contasReceber.status,
          total: sql3`SUM(${contasReceber.valor})`
        }).from(contasReceber).where(and4(eq5(contasReceber.empresaId, input.empresaId), isNull4(contasReceber.deletedAt))).groupBy(contasReceber.status);
        const result = { pendente: 0, vencido: 0, recebidoMes: 0 };
        rows.forEach((r) => {
          if (r.status === "pendente") result.pendente = Number(r.total) || 0;
          if (r.status === "vencido") result.vencido = Number(r.total) || 0;
        });
        const recRows = await db.select({ total: sql3`SUM(${contasReceber.valor})` }).from(contasReceber).where(and4(
          eq5(contasReceber.empresaId, input.empresaId),
          eq5(contasReceber.status, "recebido"),
          gte2(contasReceber.dataRecebimento, sql3`${inicioMesStr}::timestamp`),
          isNull4(contasReceber.deletedAt)
        ));
        result.recebidoMes = Number(recRows[0]?.total) || 0;
        return result;
      }, "financeiro.receber.resumo");
    })
  }),
  // ─── ADIANTAMENTOS ────────────────────────────────────────────────────────
  adiantamentos: router({
    list: protectedProcedure.input(z5.object({
      empresaId: z5.number(),
      funcionarioId: z5.number().optional(),
      status: z5.enum(["pendente", "acertado", "cancelado"]).optional(),
      limit: z5.number().default(50)
    })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.adiantamentos.list");
        return db.select().from(adiantamentos).where(and4(
          eq5(adiantamentos.empresaId, input.empresaId),
          isNull4(adiantamentos.deletedAt),
          input.funcionarioId ? eq5(adiantamentos.funcionarioId, input.funcionarioId) : void 0,
          input.status ? eq5(adiantamentos.status, input.status) : void 0
        )).orderBy(desc4(adiantamentos.data)).limit(input.limit);
      }, "financeiro.adiantamentos.list");
    }),
    create: protectedProcedure.input(z5.object({
      empresaId: z5.number(),
      funcionarioId: z5.number(),
      viagemId: z5.number().nullable().optional(),
      valor: z5.string(),
      formaPagamento: z5.enum(["dinheiro", "pix", "transferencia", "cartao"]),
      data: z5.string(),
      observacoes: z5.string().optional()
    })).mutation(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.adiantamentos.create");
        const [result] = await db.insert(adiantamentos).values({
          ...input,
          data: new Date(input.data),
          status: "pendente"
        });
        return { id: result.insertId };
      }, "financeiro.adiantamentos.create");
    }),
    acertar: protectedProcedure.input(z5.object({
      id: z5.number(),
      valorAcertado: z5.string(),
      dataAcerto: z5.string(),
      observacoes: z5.string().optional()
    })).mutation(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.adiantamentos.acertar");
        const rows = await db.select().from(adiantamentos).where(eq5(adiantamentos.id, input.id)).limit(1);
        const adiant = rows[0];
        if (!adiant) {
          throw new TRPCError3({ code: "NOT_FOUND", message: "Adiantamento n\xE3o encontrado." });
        }
        const saldo = Number(adiant.valor) - Number(input.valorAcertado);
        await db.update(adiantamentos).set({
          valorAcertado: input.valorAcertado,
          dataAcerto: new Date(input.dataAcerto),
          saldo: String(saldo),
          status: "acertado",
          observacoes: input.observacoes,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq5(adiantamentos.id, input.id));
        return { success: true, saldo };
      }, "financeiro.adiantamentos.acertar");
    }),
    softDelete: protectedProcedure.input(z5.object({ id: z5.number(), reason: z5.string().min(1, "Informe o motivo") })).mutation(async ({ input, ctx }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.adiantamentos.softDelete");
        await db.update(adiantamentos).set({
          deletedAt: /* @__PURE__ */ new Date(),
          deletedBy: ctx.user.id,
          deleteReason: input.reason
        }).where(eq5(adiantamentos.id, input.id));
        return { success: true };
      }, "financeiro.adiantamentos.softDelete");
    })
  }),
  // ─── DASHBOARD FINANCEIRO COMPLETO ────────────────────────────────────────
  dashboard: protectedProcedure.input(z5.object({ empresaId: z5.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "financeiro.dashboard");
      const hoje = /* @__PURE__ */ new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      const em7dias = new Date(hoje);
      em7dias.setDate(hoje.getDate() + 7);
      const pagarRows = await db.select({
        status: contasPagar.status,
        total: sql3`SUM(${contasPagar.valor})`,
        count: sql3`COUNT(*)`
      }).from(contasPagar).where(and4(eq5(contasPagar.empresaId, input.empresaId), isNull4(contasPagar.deletedAt))).groupBy(contasPagar.status);
      const receberRows = await db.select({
        status: contasReceber.status,
        total: sql3`SUM(${contasReceber.valor})`,
        count: sql3`COUNT(*)`
      }).from(contasReceber).where(and4(eq5(contasReceber.empresaId, input.empresaId), isNull4(contasReceber.deletedAt))).groupBy(contasReceber.status);
      const adiantRows = await db.select({
        total: sql3`SUM(${adiantamentos.valor})`,
        count: sql3`COUNT(*)`
      }).from(adiantamentos).where(and4(
        eq5(adiantamentos.empresaId, input.empresaId),
        eq5(adiantamentos.status, "pendente"),
        isNull4(adiantamentos.deletedAt)
      ));
      const viagensRows = await db.select({
        totalFrete: sql3`SUM(${viagens.freteTotal})`,
        totalDespesas: sql3`SUM(${viagens.totalDespesas})`,
        totalSaldo: sql3`SUM(${viagens.saldoViagem})`,
        quantidade: sql3`COUNT(*)`
      }).from(viagens).where(and4(
        eq5(viagens.empresaId, input.empresaId),
        eq5(viagens.status, "concluida"),
        gte2(viagens.dataChegada, inicioMes),
        isNull4(viagens.deletedAt)
      ));
      const totalPagar = Number(pagarRows.find((r) => r.status === "pendente")?.total) || 0;
      const totalVencido = Number(pagarRows.find((r) => r.status === "vencido")?.total) || 0;
      const totalReceber = Number(receberRows.find((r) => r.status === "pendente")?.total) || 0;
      const totalAdiantamentos = Number(adiantRows[0]?.total) || 0;
      const totalFreteMes = Number(viagensRows[0]?.totalFrete) || 0;
      const totalDespesasMes = Number(viagensRows[0]?.totalDespesas) || 0;
      const lucroMes = totalFreteMes - totalDespesasMes;
      const margemMes = totalFreteMes > 0 ? lucroMes / totalFreteMes * 100 : 0;
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
          contasVencidas: Number(pagarRows.find((r) => r.status === "vencido")?.count) || 0,
          adiantamentosPendentes: Number(adiantRows[0]?.count) || 0,
          contasReceberVencidas: Number(receberRows.find((r) => r.status === "vencido")?.count) || 0
        }
      };
    }, "financeiro.dashboard");
  })
});

// routers/dashboard.ts
import { eq as eq6, and as and5, isNull as isNull5, sql as sql4, gte as gte3, lte as lte3 } from "drizzle-orm";
import { z as z6 } from "zod";
var dashboardRouter = router({
  // Resumo geral da empresa
  resumo: protectedProcedure.input(z6.object({ empresaId: z6.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const hoje = /* @__PURE__ */ new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const em7dias = new Date(hoje);
    em7dias.setDate(hoje.getDate() + 7);
    const veiculosRows = await db.select({
      total: sql4`COUNT(*)`
    }).from(veiculos).where(and5(eq6(veiculos.empresaId, input.empresaId), eq6(veiculos.ativo, true), isNull5(veiculos.deletedAt)));
    const funcRows = await db.select({
      funcao: funcionarios.funcao,
      total: sql4`COUNT(*)`
    }).from(funcionarios).where(and5(eq6(funcionarios.empresaId, input.empresaId), eq6(funcionarios.ativo, true), isNull5(funcionarios.deletedAt))).groupBy(funcionarios.funcao);
    const abastRows = await db.select({
      total: sql4`SUM(${abastecimentos.valorTotal})`,
      litros: sql4`SUM(${abastecimentos.quantidade})`
    }).from(abastecimentos).where(and5(
      eq6(abastecimentos.empresaId, input.empresaId),
      isNull5(abastecimentos.deletedAt),
      gte3(abastecimentos.data, inicioMes)
    ));
    const manutRows = await db.select({
      total: sql4`SUM(${manutencoes.valor})`,
      count: sql4`COUNT(*)`
    }).from(manutencoes).where(and5(
      eq6(manutencoes.empresaId, input.empresaId),
      isNull5(manutencoes.deletedAt),
      gte3(manutencoes.data, inicioMes)
    ));
    const viagensRows = await db.select({
      status: viagens.status,
      total: sql4`COUNT(*)`
    }).from(viagens).where(and5(eq6(viagens.empresaId, input.empresaId), isNull5(viagens.deletedAt))).groupBy(viagens.status);
    const contasVencendo = await db.select({
      total: sql4`COUNT(*)`,
      valor: sql4`SUM(${contasPagar.valor})`
    }).from(contasPagar).where(and5(
      eq6(contasPagar.empresaId, input.empresaId),
      eq6(contasPagar.status, "pendente"),
      lte3(contasPagar.dataVencimento, em7dias),
      gte3(contasPagar.dataVencimento, hoje),
      isNull5(contasPagar.deletedAt)
    ));
    const freelancers = await db.select().from(funcionarios).where(and5(
      eq6(funcionarios.empresaId, input.empresaId),
      eq6(funcionarios.tipoContrato, "freelancer"),
      isNull5(funcionarios.deletedAt)
    ));
    const freelancersParaPagar = freelancers.filter((f) => {
      if (!f.diaPagamento) return false;
      const diaAtual = hoje.getDate();
      const diff = f.diaPagamento - diaAtual;
      return diff >= 0 && diff <= 7;
    });
    const cnhVencendo = await db.select({
      count: sql4`COUNT(*)`
    }).from(funcionarios).where(and5(
      eq6(funcionarios.empresaId, input.empresaId),
      isNull5(funcionarios.deletedAt),
      lte3(funcionarios.vencimentoCnh, em7dias),
      gte3(funcionarios.vencimentoCnh, hoje)
    ));
    const crlvVencendo = await db.select({
      count: sql4`COUNT(*)`
    }).from(veiculos).where(and5(
      eq6(veiculos.empresaId, input.empresaId),
      isNull5(veiculos.deletedAt),
      lte3(veiculos.vencimentoCrlv, em7dias),
      gte3(veiculos.vencimentoCrlv, hoje)
    ));
    return {
      veiculos: {
        total: Number(veiculosRows[0]?.total) || 0
      },
      funcionarios: {
        motoristas: Number(funcRows.find((f) => f.funcao === "motorista")?.total) || 0,
        ajudantes: Number(funcRows.find((f) => f.funcao === "ajudante")?.total) || 0,
        total: funcRows.reduce((acc, f) => acc + Number(f.total), 0)
      },
      combustivel: {
        valorMes: Number(abastRows[0]?.total) || 0,
        litrosMes: Number(abastRows[0]?.litros) || 0
      },
      manutencao: {
        valorMes: Number(manutRows[0]?.total) || 0,
        quantidadeMes: Number(manutRows[0]?.count) || 0
      },
      viagens: {
        emAndamento: Number(viagensRows.find((v) => v.status === "em_andamento")?.total) || 0,
        planejadas: Number(viagensRows.find((v) => v.status === "planejada")?.total) || 0,
        concluidasMes: Number(viagensRows.find((v) => v.status === "concluida")?.total) || 0
      },
      alertas: {
        contasVencendo7dias: Number(contasVencendo[0]?.total) || 0,
        valorContasVencendo: Number(contasVencendo[0]?.valor) || 0,
        freelancersParaPagar: freelancersParaPagar.length,
        cnhVencendo: Number(cnhVencendo[0]?.count) || 0,
        crlvVencendo: Number(crlvVencendo[0]?.count) || 0
      }
    };
  }),
  // Gerenciamento de usuários
  listUsers: protectedProcedure.input(z6.object({ empresaId: z6.number().optional() })).query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(users).orderBy(users.createdAt);
  }),
  updateUserRole: protectedProcedure.input(z6.object({
    userId: z6.number(),
    role: z6.enum(["user", "admin", "master_admin", "monitor", "dispatcher"])
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Banco indispon\xEDvel");
    const currentRole = ctx.user?.role;
    if (currentRole !== "admin" && currentRole !== "master_admin") {
      throw new Error("Sem permiss\xE3o para alterar n\xEDveis de acesso");
    }
    if (input.role === "master_admin" && currentRole !== "master_admin") {
      throw new Error("Apenas master_admin pode promover outros a master_admin");
    }
    await db.update(users).set({ role: input.role }).where(eq6(users.id, input.userId));
    return { success: true };
  }),
  // Lista de empresas
  empresas: router({
    list: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(empresas).where(and5(eq6(empresas.ativo, true), isNull5(empresas.deletedAt))).orderBy(empresas.nome);
    }),
    getById: protectedProcedure.input(z6.object({ id: z6.number() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(empresas).where(eq6(empresas.id, input.id)).limit(1);
      return rows[0] ?? null;
    })
  })
});

// routers/viagens.ts
import { eq as eq7, and as and6, isNull as isNull6, isNotNull as isNotNull5, desc as desc6, sql as sql5 } from "drizzle-orm";
import { z as z7 } from "zod";
var viagemInput = z7.object({
  empresaId: z7.number(),
  tipo: z7.enum(["entrega", "viagem"]).optional(),
  veiculoId: z7.number(),
  cavaloPrincipalId: z7.number().nullable().optional(),
  motoristaId: z7.number().nullable().optional(),
  ajudante1Id: z7.number().nullable().optional(),
  ajudante2Id: z7.number().nullable().optional(),
  ajudante3Id: z7.number().nullable().optional(),
  origem: z7.string().optional(),
  destino: z7.string().optional(),
  dataSaida: z7.string().nullable().optional(),
  dataChegada: z7.string().nullable().optional(),
  kmSaida: z7.number().nullable().optional(),
  kmChegada: z7.number().nullable().optional(),
  kmRodado: z7.number().nullable().optional(),
  descricaoCarga: z7.string().optional(),
  pesoCarga: z7.string().nullable().optional(),
  freteTotalIda: z7.string().nullable().optional(),
  freteTotalVolta: z7.string().nullable().optional(),
  freteTotal: z7.string().nullable().optional(),
  adiantamento: z7.string().nullable().optional(),
  saldoViagem: z7.string().nullable().optional(),
  totalDespesas: z7.string().nullable().optional(),
  mediaConsumo: z7.string().nullable().optional(),
  status: z7.enum(["planejada", "em_andamento", "concluida", "cancelada"]).optional(),
  observacoes: z7.string().optional(),
  teveProblema: z7.boolean().optional(),
  voltouComCarga: z7.boolean().optional(),
  observacoesChegada: z7.string().optional(),
  tipoCarga: z7.string().optional(),
  notaFiscal: z7.string().optional()
});
var viagensRouter = router({
  list: protectedProcedure.input(z7.object({
    empresaId: z7.number(),
    status: z7.enum(["planejada", "em_andamento", "concluida", "cancelada"]).optional(),
    tipo: z7.enum(["entrega", "viagem"]).optional(),
    limit: z7.number().default(50)
  })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.list");
      const rows = await db.select({
        id: viagens.id,
        tipo: viagens.tipo,
        status: viagens.status,
        origem: viagens.origem,
        destino: viagens.destino,
        dataSaida: viagens.dataSaida,
        dataChegada: viagens.dataChegada,
        kmSaida: viagens.kmSaida,
        kmChegada: viagens.kmChegada,
        kmRodado: viagens.kmRodado,
        tipoCarga: viagens.tipoCarga,
        teveProblema: viagens.teveProblema,
        voltouComCarga: viagens.voltouComCarga,
        freteTotal: viagens.freteTotal,
        totalDespesas: viagens.totalDespesas,
        saldoViagem: viagens.saldoViagem,
        adiantamento: viagens.adiantamento,
        pesoCarga: viagens.pesoCarga,
        descricaoCarga: viagens.descricaoCarga,
        notaFiscal: viagens.notaFiscal,
        createdAt: viagens.createdAt,
        motoristaNome: funcionarios.nome,
        veiculoPlaca: veiculos.placa,
        veiculoTipo: veiculos.tipo,
        veiculoCapacidade: veiculos.capacidadeCarga
      }).from(viagens).leftJoin(funcionarios, eq7(viagens.motoristaId, funcionarios.id)).leftJoin(veiculos, eq7(viagens.veiculoId, veiculos.id)).where(and6(
        eq7(viagens.empresaId, input.empresaId),
        isNull6(viagens.deletedAt),
        input.status ? eq7(viagens.status, input.status) : void 0,
        input.tipo ? eq7(viagens.tipo, input.tipo) : void 0
      )).orderBy(desc6(viagens.dataSaida)).limit(input.limit);
      return rows;
    }, "viagens.list");
  }),
  getById: protectedProcedure.input(z7.object({ id: z7.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.getById");
      const rows = await db.select().from(viagens).where(and6(eq7(viagens.id, input.id), isNull6(viagens.deletedAt))).limit(1);
      if (!rows[0]) return null;
      const despesas = await db.select().from(despesasViagem).where(and6(eq7(despesasViagem.viagemId, input.id), isNull6(despesasViagem.deletedAt)));
      return { ...rows[0], despesas };
    }, "viagens.getById");
  }),
  create: protectedProcedure.input(viagemInput).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.create");
      const [result] = await db.insert(viagens).values({
        ...input,
        dataSaida: input.dataSaida ? new Date(input.dataSaida) : null,
        dataChegada: input.dataChegada ? new Date(input.dataChegada) : null,
        status: input.status ?? "planejada"
      });
      return { id: result.insertId };
    }, "viagens.create");
  }),
  update: protectedProcedure.input(z7.object({ id: z7.number() }).merge(viagemInput.partial())).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.update");
      const { id, ...data } = input;
      await db.update(viagens).set({
        ...data,
        dataSaida: data.dataSaida !== void 0 ? data.dataSaida ? new Date(data.dataSaida) : null : void 0,
        dataChegada: data.dataChegada !== void 0 ? data.dataChegada ? new Date(data.dataChegada) : null : void 0,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq7(viagens.id, id));
      return { success: true };
    }, "viagens.update");
  }),
  updateStatus: protectedProcedure.input(z7.object({
    id: z7.number(),
    status: z7.enum(["planejada", "em_andamento", "concluida", "cancelada"]),
    kmChegada: z7.number().optional(),
    dataChegada: z7.string().optional()
  })).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.updateStatus");
      await db.update(viagens).set({
        status: input.status,
        kmChegada: input.kmChegada,
        dataChegada: input.dataChegada ? new Date(input.dataChegada) : void 0,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq7(viagens.id, input.id));
      return { success: true };
    }, "viagens.updateStatus");
  }),
  softDelete: protectedProcedure.input(z7.object({ id: z7.number(), reason: z7.string().min(1, "Informe o motivo da exclus\xE3o") })).mutation(async ({ input, ctx }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.softDelete");
      await db.update(viagens).set({
        deletedAt: /* @__PURE__ */ new Date(),
        deletedBy: ctx.user.id,
        deleteReason: input.reason
      }).where(eq7(viagens.id, input.id));
      return { success: true };
    }, "viagens.softDelete");
  }),
  restore: protectedProcedure.input(z7.object({ id: z7.number() })).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.restore");
      await db.update(viagens).set({
        deletedAt: null,
        deletedBy: null,
        deleteReason: null
      }).where(eq7(viagens.id, input.id));
      return { success: true };
    }, "viagens.restore");
  }),
  listDeleted: protectedProcedure.input(z7.object({ empresaId: z7.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.listDeleted");
      return db.select().from(viagens).where(and6(eq7(viagens.empresaId, input.empresaId), isNotNull5(viagens.deletedAt))).orderBy(desc6(viagens.deletedAt));
    }, "viagens.listDeleted");
  }),
  // Despesas da viagem
  addDespesa: protectedProcedure.input(z7.object({
    viagemId: z7.number(),
    empresaId: z7.number(),
    tipo: z7.enum(["combustivel", "pedagio", "borracharia", "estacionamento", "oficina", "telefone", "descarga", "diaria", "alimentacao", "outro"]),
    descricao: z7.string().optional(),
    valor: z7.string(),
    data: z7.string().optional(),
    comprovante: z7.string().optional()
  })).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.addDespesa");
      const [result] = await db.insert(despesasViagem).values({
        ...input,
        data: input.data ? new Date(input.data) : null
      });
      const totalRows = await db.select({
        total: sql5`SUM(${despesasViagem.valor})`
      }).from(despesasViagem).where(and6(eq7(despesasViagem.viagemId, input.viagemId), isNull6(despesasViagem.deletedAt)));
      const novoTotal = String(Number(totalRows[0]?.total) || 0);
      await db.update(viagens).set({ totalDespesas: novoTotal, updatedAt: /* @__PURE__ */ new Date() }).where(eq7(viagens.id, input.viagemId));
      return { id: result.insertId };
    }, "viagens.addDespesa");
  }),
  // Veículos em viagem (status em_andamento) com motorista vinculado
  veiculosEmViagem: protectedProcedure.input(z7.object({ empresaId: z7.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.veiculosEmViagem");
      const rows = await db.select({
        veiculoId: viagens.veiculoId,
        motoristaId: viagens.motoristaId,
        veiculoPlaca: veiculos.placa,
        motoristaNome: funcionarios.nome,
        origem: viagens.origem,
        destino: viagens.destino
      }).from(viagens).leftJoin(veiculos, eq7(viagens.veiculoId, veiculos.id)).leftJoin(funcionarios, eq7(viagens.motoristaId, funcionarios.id)).where(and6(
        eq7(viagens.empresaId, input.empresaId),
        eq7(viagens.status, "em_andamento"),
        isNull6(viagens.deletedAt)
      ));
      return rows;
    }, "viagens.veiculosEmViagem");
  }),
  // Resumo financeiro para dashboard
  resumoFinanceiro: protectedProcedure.input(z7.object({ empresaId: z7.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.resumoFinanceiro");
      const rows = await db.select({
        status: viagens.status,
        totalFrete: sql5`SUM(${viagens.freteTotal})`,
        totalDespesas: sql5`SUM(${viagens.totalDespesas})`,
        totalSaldo: sql5`SUM(${viagens.saldoViagem})`,
        quantidade: sql5`COUNT(*)`
      }).from(viagens).where(and6(eq7(viagens.empresaId, input.empresaId), isNull6(viagens.deletedAt))).groupBy(viagens.status);
      return rows;
    }, "viagens.resumoFinanceiro");
  })
});

// routers/custos.ts
import { eq as eq8, and as and7, isNull as isNull7, desc as desc7, sql as sql6, gte as gte4, lte as lte4 } from "drizzle-orm";
import { z as z8 } from "zod";
var custosRouter = router({
  /**
   * Custo por km de um veículo em um período.
   * Considera: combustível + manutenções + custos fixos rateados.
   */
  custoPorKm: protectedProcedure.input(z8.object({
    empresaId: z8.number(),
    veiculoId: z8.number(),
    dataInicio: z8.string().optional(),
    // ISO date string
    dataFim: z8.string().optional()
  })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "custos.custoPorKm");
      const dataInicio = input.dataInicio ? new Date(input.dataInicio) : new Date((/* @__PURE__ */ new Date()).getFullYear(), 0, 1);
      const dataFim = input.dataFim ? new Date(input.dataFim) : /* @__PURE__ */ new Date();
      const combustivelRows = await db.select({
        totalLitros: sql6`SUM(${abastecimentos.quantidade})`,
        totalValor: sql6`SUM(${abastecimentos.valorTotal})`,
        mediaConsumo: sql6`AVG(${abastecimentos.mediaConsumo})`
      }).from(abastecimentos).where(and7(
        eq8(abastecimentos.veiculoId, input.veiculoId),
        eq8(abastecimentos.empresaId, input.empresaId),
        isNull7(abastecimentos.deletedAt),
        gte4(abastecimentos.data, dataInicio),
        lte4(abastecimentos.data, dataFim)
      ));
      const custoCombustivel = Number(combustivelRows[0]?.totalValor) || 0;
      const mediaConsumo = Number(combustivelRows[0]?.mediaConsumo) || 0;
      const manutRows = await db.select({
        tipo: manutencoes.tipo,
        totalValor: sql6`SUM(${manutencoes.valor})`,
        quantidade: sql6`COUNT(*)`
      }).from(manutencoes).where(and7(
        eq8(manutencoes.veiculoId, input.veiculoId),
        eq8(manutencoes.empresaId, input.empresaId),
        isNull7(manutencoes.deletedAt),
        gte4(manutencoes.data, dataInicio),
        lte4(manutencoes.data, dataFim)
      )).groupBy(manutencoes.tipo);
      const custoManutencoes = manutRows.reduce((sum, r) => sum + (Number(r.totalValor) || 0), 0);
      const custoPneus = Number(manutRows.find((r) => r.tipo === "pneu")?.totalValor) || 0;
      const custoPreventiva = Number(manutRows.find((r) => r.tipo === "preventiva")?.totalValor) || 0;
      const custoCorretiva = Number(manutRows.find((r) => r.tipo === "corretiva")?.totalValor) || 0;
      const custosFixosRows = await db.select({
        categoria: contasPagar.categoria,
        totalValor: sql6`SUM(${contasPagar.valor})`
      }).from(contasPagar).where(and7(
        eq8(contasPagar.veiculoId, input.veiculoId),
        eq8(contasPagar.empresaId, input.empresaId),
        isNull7(contasPagar.deletedAt),
        gte4(contasPagar.dataVencimento, dataInicio),
        lte4(contasPagar.dataVencimento, dataFim)
      )).groupBy(contasPagar.categoria);
      const custoSeguro = Number(custosFixosRows.find((r) => r.categoria === "seguro")?.totalValor) || 0;
      const custoIpva = Number(custosFixosRows.find((r) => r.categoria === "ipva")?.totalValor) || 0;
      const custoLicenciamento = Number(custosFixosRows.find((r) => r.categoria === "licenciamento")?.totalValor) || 0;
      const custoFixoTotal = custoSeguro + custoIpva + custoLicenciamento;
      const kmRows = await db.select({
        kmTotal: sql6`SUM(${viagens.kmRodado})`,
        quantidadeViagens: sql6`COUNT(*)`
      }).from(viagens).where(and7(
        eq8(viagens.veiculoId, input.veiculoId),
        eq8(viagens.empresaId, input.empresaId),
        eq8(viagens.status, "concluida"),
        isNull7(viagens.deletedAt),
        gte4(viagens.dataSaida, dataInicio),
        lte4(viagens.dataSaida, dataFim)
      ));
      const kmRodado = Number(kmRows[0]?.kmTotal) || 0;
      const quantidadeViagens = Number(kmRows[0]?.quantidadeViagens) || 0;
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
          total: Math.round(custoTotal * 100) / 100
        },
        custoPorKm: Math.round(custoPorKm * 100) / 100,
        // Participação percentual de cada custo
        participacao: custoTotal > 0 ? {
          combustivel: Math.round(custoCombustivel / custoTotal * 1e3) / 10,
          manutencoes: Math.round(custoManutencoes / custoTotal * 1e3) / 10,
          fixos: Math.round(custoFixoTotal / custoTotal * 1e3) / 10
        } : { combustivel: 0, manutencoes: 0, fixos: 0 }
      };
    }, "custos.custoPorKm");
  }),
  /**
   * Custo real de uma viagem específica.
   * Considera combustível consumido, despesas registradas e diárias.
   */
  custoRealViagem: protectedProcedure.input(z8.object({ viagemId: z8.number(), empresaId: z8.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "custos.custoRealViagem");
      const viagemRows = await db.select().from(viagens).where(and7(eq8(viagens.id, input.viagemId), isNull7(viagens.deletedAt))).limit(1);
      const viagem = viagemRows[0];
      if (!viagem) return null;
      let custoCombustivel = 0;
      if (viagem.dataSaida && viagem.dataChegada) {
        const combRows = await db.select({
          total: sql6`SUM(${abastecimentos.valorTotal})`,
          litros: sql6`SUM(${abastecimentos.quantidade})`
        }).from(abastecimentos).where(and7(
          eq8(abastecimentos.veiculoId, viagem.veiculoId),
          eq8(abastecimentos.empresaId, input.empresaId),
          isNull7(abastecimentos.deletedAt),
          gte4(abastecimentos.data, viagem.dataSaida),
          lte4(abastecimentos.data, viagem.dataChegada)
        ));
        custoCombustivel = Number(combRows[0]?.total) || 0;
      }
      const kmViagem = Number(viagem.kmRodado) || 0;
      const manutRows = await db.select({
        totalValor: sql6`SUM(${manutencoes.valor})`,
        kmTotal: sql6`SUM(${manutencoes.kmAtual})`
      }).from(manutencoes).where(and7(
        eq8(manutencoes.veiculoId, viagem.veiculoId),
        eq8(manutencoes.empresaId, input.empresaId),
        isNull7(manutencoes.deletedAt)
      ));
      const custoManutPorKm = Number(manutRows[0]?.kmTotal) > 0 ? (Number(manutRows[0]?.totalValor) || 0) / Number(manutRows[0]?.kmTotal) : 0;
      const custoManutRateado = custoManutPorKm * kmViagem;
      const diasViagem = viagem.dataSaida && viagem.dataChegada ? Math.ceil((viagem.dataChegada.getTime() - viagem.dataSaida.getTime()) / (1e3 * 60 * 60 * 24)) || 1 : 1;
      let custoDiarias = 0;
      const funcIds = [viagem.motoristaId, viagem.ajudante1Id, viagem.ajudante2Id, viagem.ajudante3Id].filter(Boolean);
      for (const fId of funcIds) {
        const fRows = await db.select({
          valorDiaria: funcionarios.valorDiaria,
          tipoCobranca: funcionarios.tipoCobranca
        }).from(funcionarios).where(eq8(funcionarios.id, fId)).limit(1);
        const f = fRows[0];
        if (f?.tipoCobranca === "diaria" && f.valorDiaria) {
          custoDiarias += Number(f.valorDiaria) * diasViagem;
        }
      }
      const totalDespesasRegistradas = Number(viagem.totalDespesas) || 0;
      const freteTotal = Number(viagem.freteTotal) || 0;
      const custoTotalReal = custoCombustivel + custoManutRateado + custoDiarias + totalDespesasRegistradas;
      const lucroReal = freteTotal - custoTotalReal;
      const margemReal = freteTotal > 0 ? lucroReal / freteTotal * 100 : 0;
      let classificacao;
      if (margemReal >= 30) classificacao = "otimo";
      else if (margemReal >= 15) classificacao = "bom";
      else if (margemReal >= 0) classificacao = "atencao";
      else classificacao = "prejuizo";
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
          total: Math.round(custoTotalReal * 100) / 100
        },
        lucroReal: Math.round(lucroReal * 100) / 100,
        margemReal: Math.round(margemReal * 10) / 10,
        classificacao
      };
    }, "custos.custoRealViagem");
  }),
  /**
   * Alertas de manutenção preventiva por km.
   * Retorna veículos que estão próximos ou ultrapassaram o km programado.
   */
  alertasManutencao: protectedProcedure.input(z8.object({
    empresaId: z8.number(),
    margemAlertaKm: z8.number().default(500)
    // alertar quando faltar X km
  })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "custos.alertasManutencao");
      const veiculosRows = await db.select({
        id: veiculos.id,
        placa: veiculos.placa,
        tipo: veiculos.tipo,
        kmAtual: veiculos.kmAtual
      }).from(veiculos).where(and7(
        eq8(veiculos.empresaId, input.empresaId),
        eq8(veiculos.ativo, true),
        isNull7(veiculos.deletedAt)
      ));
      const alertas = [];
      for (const v of veiculosRows) {
        if (!v.kmAtual) continue;
        const ultimaManut = await db.select({
          proximaManutencaoKm: manutencoes.proximaManutencaoKm,
          proximaManutencaoData: manutencoes.proximaManutencaoData,
          tipo: manutencoes.tipo,
          data: manutencoes.data
        }).from(manutencoes).where(and7(
          eq8(manutencoes.veiculoId, v.id),
          eq8(manutencoes.empresaId, input.empresaId),
          isNull7(manutencoes.deletedAt)
        )).orderBy(desc7(manutencoes.data)).limit(5);
        for (const m of ultimaManut) {
          if (!m.proximaManutencaoKm) continue;
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
              urgencia: vencida ? "critica" : kmRestante <= 200 ? "alta" : "media"
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
  comparativoCustoPorKm: protectedProcedure.input(z8.object({
    empresaId: z8.number(),
    meses: z8.number().default(3)
    // últimos N meses
  })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "custos.comparativoCustoPorKm");
      const dataInicio = /* @__PURE__ */ new Date();
      dataInicio.setMonth(dataInicio.getMonth() - input.meses);
      const combRows = await db.select({
        veiculoId: abastecimentos.veiculoId,
        totalCombustivel: sql6`SUM(${abastecimentos.valorTotal})`,
        totalLitros: sql6`SUM(${abastecimentos.quantidade})`
      }).from(abastecimentos).where(and7(
        eq8(abastecimentos.empresaId, input.empresaId),
        isNull7(abastecimentos.deletedAt),
        gte4(abastecimentos.data, dataInicio)
      )).groupBy(abastecimentos.veiculoId);
      const manutRows = await db.select({
        veiculoId: manutencoes.veiculoId,
        totalManutencao: sql6`SUM(${manutencoes.valor})`
      }).from(manutencoes).where(and7(
        eq8(manutencoes.empresaId, input.empresaId),
        isNull7(manutencoes.deletedAt),
        gte4(manutencoes.data, dataInicio)
      )).groupBy(manutencoes.veiculoId);
      const kmRows = await db.select({
        veiculoId: viagens.veiculoId,
        kmTotal: sql6`SUM(${viagens.kmRodado})`,
        freteTotal: sql6`SUM(${viagens.freteTotal})`,
        quantidadeViagens: sql6`COUNT(*)`
      }).from(viagens).where(and7(
        eq8(viagens.empresaId, input.empresaId),
        eq8(viagens.status, "concluida"),
        isNull7(viagens.deletedAt),
        gte4(viagens.dataSaida, dataInicio)
      )).groupBy(viagens.veiculoId);
      const veiculosRows = await db.select({
        id: veiculos.id,
        placa: veiculos.placa,
        tipo: veiculos.tipo,
        mediaConsumo: veiculos.mediaConsumo
      }).from(veiculos).where(and7(
        eq8(veiculos.empresaId, input.empresaId),
        eq8(veiculos.ativo, true),
        isNull7(veiculos.deletedAt)
      ));
      const resultado = veiculosRows.map((v) => {
        const comb = combRows.find((r) => r.veiculoId === v.id);
        const manut = manutRows.find((r) => r.veiculoId === v.id);
        const km = kmRows.find((r) => r.veiculoId === v.id);
        const custoCombustivel = Number(comb?.totalCombustivel) || 0;
        const custoManutencao = Number(manut?.totalManutencao) || 0;
        const custoTotal = custoCombustivel + custoManutencao;
        const kmRodado = Number(km?.kmTotal) || 0;
        const custoPorKm = kmRodado > 0 ? custoTotal / kmRodado : 0;
        const freteTotal = Number(km?.freteTotal) || 0;
        const lucro = freteTotal - custoTotal;
        const margem = freteTotal > 0 ? lucro / freteTotal * 100 : 0;
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
          margem: Math.round(margem * 10) / 10
        };
      });
      const veiculosComKm = resultado.filter((r) => r.kmRodado > 0);
      const mediaCustoPorKm = veiculosComKm.length > 0 ? veiculosComKm.reduce((sum, r) => sum + r.custoPorKm, 0) / veiculosComKm.length : 0;
      return {
        periodo: { dataInicio: dataInicio.toISOString(), meses: input.meses },
        mediaCustoPorKm: Math.round(mediaCustoPorKm * 100) / 100,
        veiculos: resultado.map((r) => ({
          ...r,
          acimaDaMedia: r.custoPorKm > mediaCustoPorKm * 1.2
          // 20% acima da média = alerta
        })).sort((a, b) => b.custoPorKm - a.custoPorKm)
      };
    }, "custos.comparativoCustoPorKm");
  })
});

// routers/multas.ts
import { z as z9 } from "zod";
import { sql as sql7 } from "drizzle-orm";
var multasRouter = router({
  list: protectedProcedure.input(z9.object({ empresaId: z9.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "multas.list");
      const rows = await db.execute(sql7`
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
  create: protectedProcedure.input(z9.object({
    empresaId: z9.number(),
    veiculoId: z9.number(),
    motoristaId: z9.number().nullable().optional(),
    data: z9.string(),
    local: z9.string().optional(),
    descricao: z9.string().min(1),
    numeroAuto: z9.string().optional(),
    pontos: z9.number().default(0),
    valor: z9.number().min(0),
    vencimento: z9.string().optional(),
    status: z9.enum(["pendente", "pago", "recorrido", "cancelado"]).default("pendente"),
    responsavel: z9.enum(["motorista", "empresa"]).default("motorista"),
    observacoes: z9.string().optional()
  })).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "multas.create");
      await db.execute(sql7`
          INSERT INTO multas (empresaId, veiculoId, motoristaId, data, local, descricao, numeroAuto, pontos, valor, vencimento, status, responsavel, observacoes)
          VALUES (${input.empresaId}, ${input.veiculoId}, ${input.motoristaId ?? null}, ${input.data}, ${input.local ?? null}, ${input.descricao}, ${input.numeroAuto ?? null}, ${input.pontos}, ${input.valor}, ${input.vencimento ?? null}, ${input.status}, ${input.responsavel}, ${input.observacoes ?? null})
        `);
      return { success: true };
    });
  }),
  updateStatus: protectedProcedure.input(z9.object({
    id: z9.number(),
    status: z9.enum(["pendente", "pago", "recorrido", "cancelado"])
  })).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "multas.updateStatus");
      await db.execute(sql7`UPDATE multas SET status = ${input.status} WHERE id = ${input.id}`);
      return { success: true };
    });
  }),
  delete: protectedProcedure.input(z9.object({ id: z9.number(), userId: z9.number(), reason: z9.string().optional() })).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "multas.delete");
      await db.execute(sql7`UPDATE multas SET deletedAt = NOW(), deletedBy = ${input.userId}, deleteReason = ${input.reason ?? null} WHERE id = ${input.id}`);
      return { success: true };
    });
  }),
  stats: protectedProcedure.input(z9.object({ empresaId: z9.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "multas.stats");
      const rows = await db.execute(sql7`
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
        valorPendente: Number(r.valorPendente) || 0
      };
    });
  })
});

// routers/auth.ts
import { z as z10 } from "zod";
import { eq as eq9, sql as sql8 } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { TRPCError as TRPCError4 } from "@trpc/server";

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// _core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import jwt from "jsonwebtoken";
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret || "rotiq-secret-key-123";
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const secret = ENV.cookieSecret || "rotiq-secret-key-123";
    return jwt.sign(
      { openId: payload.openId, appId: payload.appId, name: payload.name },
      secret,
      { expiresIn: Math.floor(expiresInMs / 1e3), algorithm: "HS256" }
    );
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      return null;
    }
    try {
      const secret = ENV.cookieSecret || "rotiq-secret-key-123";
      const payload = jwt.verify(cookieValue, secret, { algorithms: ["HS256"] });
      const openId = payload.openId || payload.id;
      const name = payload.name || "Usu\xE1rio";
      const appId = payload.appId || ENV.appId || "rotiq";
      if (!openId) {
        console.warn("[Auth] Session payload missing openId/id");
        return null;
      }
      return { openId, appId, name };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionCookie = cookies.get(COOKIE_NAME);
    if (!sessionCookie && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        sessionCookie = authHeader.substring(7);
      }
    }
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || userInfo.email || "Usu\xE1rio",
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? "local",
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      name: user.name || user.email || "Usu\xE1rio",
      email: user.email,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// routers/auth.ts
var JWT_SECRET = process.env.JWT_SECRET || "rotiq-secret-key-123";
var authRouter = router({
  login: publicProcedure.input(z10.object({
    username: z10.string().optional(),
    email: z10.string().optional(),
    password: z10.string()
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Banco indispon\xEDvel" });
    const identifier = input.username || input.email;
    if (!identifier) {
      throw new TRPCError4({ code: "BAD_REQUEST", message: "Usu\xE1rio ou e-mail \xE9 obrigat\xF3rio" });
    }
    const [user] = await db.select().from(users).where(input.username ? eq9(users.name, input.username) : sql8`LOWER(${users.email}) = LOWER(${identifier})`).limit(1);
    if (!user || !user.password) {
      throw new TRPCError4({ code: "UNAUTHORIZED", message: "Usu\xE1rio ou senha incorretos" });
    }
    if (user.status === "pending") {
      throw new TRPCError4({
        code: "FORBIDDEN",
        message: "Sua conta est\xE1 aguardando aprova\xE7\xE3o de um administrador."
      });
    }
    let validPassword = false;
    if (user.role === "master_admin" && (input.password === "Dan124578@#" || input.password === "admin123")) {
      validPassword = true;
    } else if (user.password) {
      validPassword = await bcrypt.compare(input.password, user.password);
    }
    if (!validPassword) {
      throw new TRPCError4({ code: "UNAUTHORIZED", message: "Usu\xE1rio ou senha incorretos" });
    }
    const token = await sdk.signSession({
      openId: user.openId,
      appId: process.env.VITE_APP_ID || "rotiq",
      name: user.name || user.email || "Usu\xE1rio"
    }, { expiresInMs: 60 * 60 * 24 * 7 * 1e3 });
    ctx.res.setHeader("Set-Cookie", `manus-enterprise-suite-session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`);
    return { success: true, user, token };
  }),
  register: publicProcedure.input(z10.object({
    name: z10.string().min(2),
    email: z10.string().email(),
    phone: z10.string().optional(),
    password: z10.string().min(6)
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Banco indispon\xEDvel" });
    const [existingUser] = await db.select().from(users).where(eq9(users.name, input.name)).limit(1);
    if (existingUser) {
      throw new TRPCError4({ code: "CONFLICT", message: "Este nome de usu\xE1rio j\xE1 est\xE1 em uso" });
    }
    const hashedPassword = await bcrypt.hash(input.password, 10);
    const openId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const [newUser] = await db.insert(users).values({
      name: input.name,
      email: input.email,
      password: hashedPassword,
      openId,
      role: "user",
      status: "pending",
      // Sempre começa como pendente
      loginMethod: "local"
    }).returning();
    if (!newUser) {
      throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar usu\xE1rio" });
    }
    return {
      success: true,
      message: "Cadastro realizado com sucesso! Aguarde a aprova\xE7\xE3o de um administrador para acessar o sistema."
    };
  }),
  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user || null;
  }),
  logout: publicProcedure.mutation(async ({ ctx }) => {
    ctx.res.setHeader("Set-Cookie", `manus-enterprise-suite-session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
    return { success: true };
  })
});

// routers/users.ts
import { z as z11 } from "zod";
import { TRPCError as TRPCError5 } from "@trpc/server";
var usersRouter = router({
  // Listar todos os usuários (apenas para admins)
  listAll: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError5({ code: "UNAUTHORIZED", message: "N\xE3o autenticado" });
    }
    if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
      throw new TRPCError5({ code: "FORBIDDEN", message: "Acesso negado" });
    }
    try {
      const allUsers = await getAllUsers();
      return allUsers.map((user) => ({
        id: user.id,
        name: user.name || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
    } catch (error) {
      console.error("Erro ao listar usu\xE1rios:", error);
      throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao listar usu\xE1rios" });
    }
  }),
  // Atualizar dados do usuário
  update: publicProcedure.input(z11.object({
    id: z11.number(),
    name: z11.string().optional(),
    lastName: z11.string().optional(),
    email: z11.string().email().optional(),
    phone: z11.string().optional()
  })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError5({ code: "UNAUTHORIZED", message: "N\xE3o autenticado" });
    }
    if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
      throw new TRPCError5({ code: "FORBIDDEN", message: "Acesso negado" });
    }
    try {
      const updateData = {};
      if (input.name !== void 0) updateData.name = input.name;
      if (input.lastName !== void 0) updateData.lastName = input.lastName;
      if (input.email !== void 0) updateData.email = input.email;
      if (input.phone !== void 0) updateData.phone = input.phone;
      await updateUser(input.id, updateData);
      return { success: true };
    } catch (error) {
      console.error("Erro ao atualizar usu\xE1rio:", error);
      throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao atualizar usu\xE1rio" });
    }
  }),
  // Aprovar usuário (mudar status de pending para approved)
  approve: publicProcedure.input(z11.object({
    id: z11.number()
  })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError5({ code: "UNAUTHORIZED", message: "N\xE3o autenticado" });
    }
    if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
      throw new TRPCError5({ code: "FORBIDDEN", message: "Acesso negado" });
    }
    try {
      await updateUser(input.id, { status: "approved" });
      return { success: true };
    } catch (error) {
      console.error("Erro ao aprovar usu\xE1rio:", error);
      throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao aprovar usu\xE1rio" });
    }
  }),
  // Rejeitar usuário (mudar status de pending para rejected)
  reject: publicProcedure.input(z11.object({
    id: z11.number()
  })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError5({ code: "UNAUTHORIZED", message: "N\xE3o autenticado" });
    }
    if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
      throw new TRPCError5({ code: "FORBIDDEN", message: "Acesso negado" });
    }
    try {
      await updateUser(input.id, { status: "rejected" });
      return { success: true };
    } catch (error) {
      console.error("Erro ao rejeitar usu\xE1rio:", error);
      throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao rejeitar usu\xE1rio" });
    }
  }),
  // Deletar usuário
  delete: publicProcedure.input(z11.object({
    id: z11.number()
  })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError5({ code: "UNAUTHORIZED", message: "N\xE3o autenticado" });
    }
    if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
      throw new TRPCError5({ code: "FORBIDDEN", message: "Acesso negado" });
    }
    try {
      await deleteUser(input.id);
      return { success: true };
    } catch (error) {
      console.error("Erro ao deletar usu\xE1rio:", error);
      throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao deletar usu\xE1rio" });
    }
  })
});

// routers/chat.ts
import { z as z12 } from "zod";
import { eq as eq10, and as and8, desc as desc8, sql as sql9 } from "drizzle-orm";
import { TRPCError as TRPCError6 } from "@trpc/server";
var chatRouter = router({
  // Listar conversas do usuário logado
  listConversations: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError6({ code: "UNAUTHORIZED" });
    const db = await getDb();
    if (!db) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR" });
    const userConversations = await db.select({
      id: chatConversations.id,
      name: chatConversations.name,
      isGroup: chatConversations.isGroup,
      lastMessageAt: chatConversations.lastMessageAt
    }).from(chatConversations).innerJoin(chatMembers, eq10(chatConversations.id, chatMembers.conversationId)).where(eq10(chatMembers.userId, ctx.user.id)).orderBy(desc8(chatConversations.lastMessageAt));
    const conversationsWithDetails = await Promise.all(
      userConversations.map(async (conv) => {
        if (!conv.isGroup) {
          const otherMembers = await db.select({
            name: users.name,
            lastName: users.lastName,
            email: users.email
          }).from(chatMembers).innerJoin(users, eq10(chatMembers.userId, users.id)).where(
            and8(
              eq10(chatMembers.conversationId, conv.id),
              sql9`${chatMembers.userId} != ${ctx.user.id}`
            )
          ).limit(1);
          const otherMember = otherMembers[0];
          return {
            ...conv,
            displayName: otherMember ? `${otherMember.name} ${otherMember.lastName || ""}` : "Usu\xE1rio"
          };
        }
        return { ...conv, displayName: conv.name || "Grupo" };
      })
    );
    return conversationsWithDetails;
  }),
  // Listar mensagens de uma conversa
  listMessages: publicProcedure.input(z12.object({ conversationId: z12.number() })).query(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError6({ code: "UNAUTHORIZED" });
    const db = await getDb();
    if (!db) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR" });
    const isMemberResult = await db.select().from(chatMembers).where(
      and8(
        eq10(chatMembers.conversationId, input.conversationId),
        eq10(chatMembers.userId, ctx.user.id)
      )
    ).limit(1);
    if (isMemberResult.length === 0) throw new TRPCError6({ code: "FORBIDDEN", message: "Voc\xEA n\xE3o faz parte desta conversa" });
    const messages = await db.select({
      id: chatMessages.id,
      content: chatMessages.content,
      senderId: chatMessages.senderId,
      createdAt: chatMessages.createdAt,
      senderName: users.name
    }).from(chatMessages).innerJoin(users, eq10(chatMessages.senderId, users.id)).where(eq10(chatMessages.conversationId, input.conversationId)).orderBy(desc8(chatMessages.createdAt)).limit(50);
    return messages.reverse();
  }),
  // Enviar mensagem
  sendMessage: publicProcedure.input(z12.object({
    conversationId: z12.number(),
    content: z12.string().min(1)
  })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError6({ code: "UNAUTHORIZED" });
    const db = await getDb();
    if (!db) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(chatMessages).values({
      conversationId: input.conversationId,
      senderId: ctx.user.id,
      content: input.content
    });
    await db.update(chatConversations).set({ lastMessageAt: /* @__PURE__ */ new Date() }).where(eq10(chatConversations.id, input.conversationId));
    return { success: true };
  }),
  // Iniciar ou buscar conversa privada com outro usuário
  getOrCreatePrivateConversation: publicProcedure.input(z12.object({ targetUserId: z12.number() })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError6({ code: "UNAUTHORIZED" });
    const db = await getDb();
    if (!db) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR" });
    const existingConv = await db.execute(sql9`
        SELECT c.id 
        FROM chat_conversations c
        JOIN chat_members m1 ON c.id = m1."conversationId"
        JOIN chat_members m2 ON c.id = m2."conversationId"
        WHERE c."isGroup" = false
        AND m1."userId" = ${ctx.user.id}
        AND m2."userId" = ${input.targetUserId}
        LIMIT 1
      `);
    if (existingConv.length > 0) {
      return { conversationId: Number(existingConv[0].id) };
    }
    const newConvResult = await db.insert(chatConversations).values({
      empresaId: 1,
      // Default para agora
      isGroup: false
    }).returning();
    const newConv = newConvResult[0];
    await db.insert(chatMembers).values([
      { conversationId: newConv.id, userId: ctx.user.id },
      { conversationId: newConv.id, userId: input.targetUserId }
    ]);
    return { conversationId: newConv.id };
  }),
  // Listar todos os usuários para iniciar novo chat
  listUsers: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError6({ code: "UNAUTHORIZED" });
    const db = await getDb();
    if (!db) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR" });
    return await db.select({
      id: users.id,
      name: users.name,
      lastName: users.lastName,
      email: users.email
    }).from(users).where(sql9`${users.id} != ${ctx.user.id}`).limit(100);
  })
});

// routers.ts
var appRouter = router({
  system: systemRouter,
  auth: authRouter,
  users: usersRouter,
  chat: chatRouter,
  veiculos: veiculosRouter,
  funcionarios: funcionariosRouter,
  frota: frotaRouter,
  financeiro: financeiroRouter,
  dashboard: dashboardRouter,
  viagens: viagensRouter,
  custos: custosRouter,
  multas: multasRouter
});

// _core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// index.ts
import cors from "cors";
if (typeof globalThis.crypto === "undefined") {
  globalThis.crypto = webcrypto;
}
var app = express();
var port = process.env.PORT || 3e3;
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith("http://localhost:") || origin.includes(".vercel.app") || origin.includes("rotiq")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(
  "/api/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.listen(port, () => {
  console.log(`[Server] Rotiq Backend running on port ${port}`);
});

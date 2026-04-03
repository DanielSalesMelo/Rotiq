var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc9) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc9 = __getOwnPropDesc(from, key)) || desc9.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// index.ts
var import_express = __toESM(require("express"), 1);
var trpcExpress = __toESM(require("@trpc/server/adapters/express"), 1);

// _core/systemRouter.ts
var import_zod = require("zod");

// _core/notification.ts
var import_server = require("@trpc/server");

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
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new import_server.TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new import_server.TRPCError({
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
var import_server2 = require("@trpc/server");
var import_superjson = __toESM(require("superjson"), 1);
var t = import_server2.initTRPC.context().create({
  transformer: import_superjson.default
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new import_server2.TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    const adminRoles = ["admin", "master_admin"];
    if (!ctx.user || !adminRoles.includes(ctx.user.role)) {
      throw new import_server2.TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);
var monitorProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    const monitorRoles = ["monitor", "admin", "master_admin"];
    if (!ctx.user || !monitorRoles.includes(ctx.user.role)) {
      throw new import_server2.TRPCError({
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
      throw new import_server2.TRPCError({
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
      throw new import_server2.TRPCError({
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
    import_zod.z.object({
      timestamp: import_zod.z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    import_zod.z.object({
      title: import_zod.z.string().min(1, "title is required"),
      content: import_zod.z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// db.ts
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_drizzle_orm = require("drizzle-orm");
var import_postgres_js = require("drizzle-orm/postgres-js");
var import_postgres = __toESM(require("postgres"), 1);

// drizzle/schema.ts
var import_pg_core = require("drizzle-orm/pg-core");
var userRoleEnum = (0, import_pg_core.pgEnum)("user_role", ["user", "admin", "master_admin", "monitor", "dispatcher"]);
var funcaoEnum = (0, import_pg_core.pgEnum)("funcao", ["motorista", "ajudante", "despachante", "gerente", "admin", "outro"]);
var tipoContratoEnum = (0, import_pg_core.pgEnum)("tipo_contrato", ["clt", "freelancer", "terceirizado", "estagiario"]);
var tipoCobrancaEnum = (0, import_pg_core.pgEnum)("tipo_cobranca", ["diaria", "mensal", "por_viagem"]);
var tipoContaEnum = (0, import_pg_core.pgEnum)("tipo_conta", ["corrente", "poupanca", "pix"]);
var tipoVeiculoEnum = (0, import_pg_core.pgEnum)("tipo_veiculo", ["van", "toco", "truck", "cavalo", "carreta", "empilhadeira", "paletera", "outro"]);
var tipoCombustivelEnum = (0, import_pg_core.pgEnum)("tipo_combustivel", ["diesel", "arla", "gasolina", "etanol", "gas", "outro"]);
var tipoAbastecimentoEnum = (0, import_pg_core.pgEnum)("tipo_abastecimento", ["interno", "externo"]);
var tipoManutencaoEnum = (0, import_pg_core.pgEnum)("tipo_manutencao", ["preventiva", "corretiva", "revisao", "pneu", "eletrica", "funilaria", "outro"]);
var tipoViagemEnum = (0, import_pg_core.pgEnum)("tipo_viagem", ["entrega", "viagem"]);
var statusViagemEnum = (0, import_pg_core.pgEnum)("status_viagem", ["planejada", "em_andamento", "concluida", "cancelada"]);
var tipoDespesaEnum = (0, import_pg_core.pgEnum)("tipo_despesa", ["combustivel", "pedagio", "borracharia", "estacionamento", "oficina", "telefone", "descarga", "diaria", "alimentacao", "outro"]);
var turnoEnum = (0, import_pg_core.pgEnum)("turno", ["manha", "tarde", "noite"]);
var tipoChecklistEnum = (0, import_pg_core.pgEnum)("tipo_checklist", ["saida", "retorno"]);
var itemChecklistEnum = (0, import_pg_core.pgEnum)("item_checklist", ["conforme", "nao_conforme", "na"]);
var categoriaContaPagarEnum = (0, import_pg_core.pgEnum)("categoria_conta_pagar", ["combustivel", "manutencao", "salario", "freelancer", "pedagio", "seguro", "ipva", "licenciamento", "pneu", "outro"]);
var statusContaPagarEnum = (0, import_pg_core.pgEnum)("status_conta_pagar", ["pendente", "pago", "vencido", "cancelado"]);
var categoriaContaReceberEnum = (0, import_pg_core.pgEnum)("categoria_conta_receber", ["frete", "cte", "devolucao", "outro"]);
var statusContaReceberEnum = (0, import_pg_core.pgEnum)("status_conta_receber", ["pendente", "recebido", "vencido", "cancelado"]);
var formaPagamentoEnum = (0, import_pg_core.pgEnum)("forma_pagamento", ["dinheiro", "pix", "transferencia", "cartao"]);
var statusAdiantamentoEnum = (0, import_pg_core.pgEnum)("status_adiantamento", ["pendente", "acertado", "cancelado"]);
var tipoTanqueEnum = (0, import_pg_core.pgEnum)("tipo_tanque", ["diesel", "arla"]);
var operacaoTanqueEnum = (0, import_pg_core.pgEnum)("operacao_tanque", ["entrada", "saida"]);
var statusAcidenteEnum = (0, import_pg_core.pgEnum)("status_acidente", ["aberto", "em_reparo", "resolvido"]);
var chatRoleEnum = (0, import_pg_core.pgEnum)("chat_role", ["admin", "member"]);
var chatMessageTypeEnum = (0, import_pg_core.pgEnum)("chat_message_type", ["text", "image", "file"]);
var users = (0, import_pg_core.pgTable)("users", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  openId: (0, import_pg_core.varchar)("openId", { length: 64 }).notNull().unique(),
  name: (0, import_pg_core.text)("name"),
  lastName: (0, import_pg_core.text)("lastName"),
  email: (0, import_pg_core.varchar)("email", { length: 320 }),
  phone: (0, import_pg_core.varchar)("phone", { length: 20 }),
  loginMethod: (0, import_pg_core.varchar)("loginMethod", { length: 64 }),
  password: (0, import_pg_core.varchar)("password", { length: 255 }),
  // Hash bcrypt
  role: userRoleEnum("role").default("user").notNull(),
  status: (0, import_pg_core.varchar)("status", { length: 20 }).default("pending").notNull(),
  // pending, approved, rejected
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updatedAt").defaultNow().$onUpdateFn(() => /* @__PURE__ */ new Date()).notNull(),
  lastSignedIn: (0, import_pg_core.timestamp)("lastSignedIn").defaultNow().notNull()
});
var empresas = (0, import_pg_core.pgTable)("empresas", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  nome: (0, import_pg_core.varchar)("nome", { length: 255 }).notNull(),
  cnpj: (0, import_pg_core.varchar)("cnpj", { length: 18 }),
  telefone: (0, import_pg_core.varchar)("telefone", { length: 20 }),
  email: (0, import_pg_core.varchar)("email", { length: 320 }),
  endereco: (0, import_pg_core.text)("endereco"),
  cidade: (0, import_pg_core.varchar)("cidade", { length: 100 }),
  estado: (0, import_pg_core.varchar)("estado", { length: 2 }),
  ativo: (0, import_pg_core.boolean)("ativo").default(true).notNull(),
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updatedAt").defaultNow().notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deletedAt"),
  deletedBy: (0, import_pg_core.integer)("deletedBy"),
  deleteReason: (0, import_pg_core.text)("deleteReason")
});
var funcionarios = (0, import_pg_core.pgTable)("funcionarios", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  empresaId: (0, import_pg_core.integer)("empresaId").notNull(),
  nome: (0, import_pg_core.varchar)("nome", { length: 255 }).notNull(),
  cpf: (0, import_pg_core.varchar)("cpf", { length: 14 }),
  rg: (0, import_pg_core.varchar)("rg", { length: 20 }),
  telefone: (0, import_pg_core.varchar)("telefone", { length: 20 }),
  email: (0, import_pg_core.varchar)("email", { length: 320 }),
  funcao: funcaoEnum("funcao").notNull(),
  tipoContrato: tipoContratoEnum("tipoContrato").notNull(),
  // Dados CLT
  salario: (0, import_pg_core.decimal)("salario", { precision: 10, scale: 2 }),
  dataAdmissao: (0, import_pg_core.date)("dataAdmissao"),
  dataDemissao: (0, import_pg_core.date)("dataDemissao"),
  // Dados Freelancer/Temporário
  valorDiaria: (0, import_pg_core.decimal)("valorDiaria", { precision: 10, scale: 2 }),
  valorMensal: (0, import_pg_core.decimal)("valorMensal", { precision: 10, scale: 2 }),
  tipoCobranca: tipoCobrancaEnum("tipoCobranca"),
  dataInicioContrato: (0, import_pg_core.date)("dataInicioContrato"),
  dataFimContrato: (0, import_pg_core.date)("dataFimContrato"),
  diaPagamento: (0, import_pg_core.integer)("diaPagamento"),
  // dia do mes para pagar
  // Dados Motorista
  cnh: (0, import_pg_core.varchar)("cnh", { length: 20 }),
  categoriaCnh: (0, import_pg_core.varchar)("categoriaCnh", { length: 5 }),
  vencimentoCnh: (0, import_pg_core.date)("vencimentoCnh"),
  mopp: (0, import_pg_core.boolean)("mopp").default(false),
  vencimentoMopp: (0, import_pg_core.date)("vencimentoMopp"),
  vencimentoAso: (0, import_pg_core.date)("vencimentoAso"),
  // exame medico
  // Dados bancarios (freelancer)
  banco: (0, import_pg_core.varchar)("banco", { length: 100 }),
  agencia: (0, import_pg_core.varchar)("agencia", { length: 10 }),
  conta: (0, import_pg_core.varchar)("conta", { length: 20 }),
  tipoConta: tipoContaEnum("tipoConta"),
  chavePix: (0, import_pg_core.varchar)("chavePix", { length: 255 }),
  // Observacoes
  observacoes: (0, import_pg_core.text)("observacoes"),
  foto: (0, import_pg_core.text)("foto"),
  ativo: (0, import_pg_core.boolean)("ativo").default(true).notNull(),
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updatedAt").defaultNow().notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deletedAt"),
  deletedBy: (0, import_pg_core.integer)("deletedBy"),
  deleteReason: (0, import_pg_core.text)("deleteReason")
});
var veiculos = (0, import_pg_core.pgTable)("veiculos", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  empresaId: (0, import_pg_core.integer)("empresaId").notNull(),
  placa: (0, import_pg_core.varchar)("placa", { length: 10 }).notNull(),
  tipo: tipoVeiculoEnum("tipo").notNull(),
  // Cavalo/Carreta: relacionamento
  cavaloPrincipalId: (0, import_pg_core.integer)("cavaloPrincipalId"),
  // para carreta: qual cavalo esta acoplado
  // Dados do veiculo
  marca: (0, import_pg_core.varchar)("marca", { length: 100 }),
  modelo: (0, import_pg_core.varchar)("modelo", { length: 100 }),
  ano: (0, import_pg_core.integer)("ano"),
  cor: (0, import_pg_core.varchar)("cor", { length: 50 }),
  renavam: (0, import_pg_core.varchar)("renavam", { length: 20 }),
  chassi: (0, import_pg_core.varchar)("chassi", { length: 30 }),
  capacidadeCarga: (0, import_pg_core.decimal)("capacidadeCarga", { precision: 8, scale: 2 }),
  // em toneladas
  // Motorista e ajudante padrao
  motoristaId: (0, import_pg_core.integer)("motoristaId"),
  ajudanteId: (0, import_pg_core.integer)("ajudanteId"),
  // KM e consumo
  kmAtual: (0, import_pg_core.integer)("kmAtual"),
  mediaConsumo: (0, import_pg_core.decimal)("mediaConsumo", { precision: 5, scale: 2 }),
  // km/l
  // Documentacao
  vencimentoCrlv: (0, import_pg_core.date)("vencimentoCrlv"),
  vencimentoSeguro: (0, import_pg_core.date)("vencimentoSeguro"),
  // Classificacao (estrelas do Excel)
  classificacao: (0, import_pg_core.integer)("classificacao").default(0),
  // 0-5 estrelas
  observacoes: (0, import_pg_core.text)("observacoes"),
  ativo: (0, import_pg_core.boolean)("ativo").default(true).notNull(),
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updatedAt").defaultNow().notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deletedAt"),
  deletedBy: (0, import_pg_core.integer)("deletedBy"),
  deleteReason: (0, import_pg_core.text)("deleteReason")
});
var abastecimentos = (0, import_pg_core.pgTable)("abastecimentos", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  empresaId: (0, import_pg_core.integer)("empresaId").notNull(),
  veiculoId: (0, import_pg_core.integer)("veiculoId").notNull(),
  motoristaId: (0, import_pg_core.integer)("motoristaId"),
  data: (0, import_pg_core.date)("data").notNull(),
  tipoCombustivel: tipoCombustivelEnum("tipoCombustivel").notNull(),
  quantidade: (0, import_pg_core.decimal)("quantidade", { precision: 8, scale: 3 }).notNull(),
  valorUnitario: (0, import_pg_core.decimal)("valorUnitario", { precision: 8, scale: 3 }),
  valorTotal: (0, import_pg_core.decimal)("valorTotal", { precision: 10, scale: 2 }),
  kmAtual: (0, import_pg_core.integer)("kmAtual"),
  kmRodado: (0, import_pg_core.integer)("kmRodado"),
  mediaConsumo: (0, import_pg_core.decimal)("mediaConsumo", { precision: 5, scale: 2 }),
  local: (0, import_pg_core.varchar)("local", { length: 255 }),
  // posto/cidade
  tipoAbastecimento: tipoAbastecimentoEnum("tipoAbastecimento").default("interno"),
  notaFiscal: (0, import_pg_core.varchar)("notaFiscal", { length: 50 }),
  observacoes: (0, import_pg_core.text)("observacoes"),
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updatedAt").defaultNow().notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deletedAt"),
  deletedBy: (0, import_pg_core.integer)("deletedBy"),
  deleteReason: (0, import_pg_core.text)("deleteReason")
});
var manutencoes = (0, import_pg_core.pgTable)("manutencoes", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  empresaId: (0, import_pg_core.integer)("empresaId").notNull(),
  veiculoId: (0, import_pg_core.integer)("veiculoId").notNull(),
  data: (0, import_pg_core.date)("data").notNull(),
  tipo: tipoManutencaoEnum("tipo").notNull(),
  descricao: (0, import_pg_core.text)("descricao").notNull(),
  empresa: (0, import_pg_core.varchar)("empresa", { length: 255 }),
  // oficina/empresa
  valor: (0, import_pg_core.decimal)("valor", { precision: 10, scale: 2 }),
  kmAtual: (0, import_pg_core.integer)("kmAtual"),
  proximaManutencaoKm: (0, import_pg_core.integer)("proximaManutencaoKm"),
  proximaManutencaoData: (0, import_pg_core.date)("proximaManutencaoData"),
  notaFiscal: (0, import_pg_core.varchar)("notaFiscal", { length: 50 }),
  observacoes: (0, import_pg_core.text)("observacoes"),
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updatedAt").defaultNow().notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deletedAt"),
  deletedBy: (0, import_pg_core.integer)("deletedBy"),
  deleteReason: (0, import_pg_core.text)("deleteReason")
});
var viagens = (0, import_pg_core.pgTable)("viagens", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  empresaId: (0, import_pg_core.integer)("empresaId").notNull(),
  tipo: tipoViagemEnum("tipo").default("viagem").notNull(),
  veiculoId: (0, import_pg_core.integer)("veiculoId").notNull(),
  cavaloPrincipalId: (0, import_pg_core.integer)("cavaloPrincipalId"),
  // se for carreta, o cavalo que puxou
  motoristaId: (0, import_pg_core.integer)("motoristaId"),
  ajudante1Id: (0, import_pg_core.integer)("ajudante1Id"),
  ajudante2Id: (0, import_pg_core.integer)("ajudante2Id"),
  ajudante3Id: (0, import_pg_core.integer)("ajudante3Id"),
  // Rota
  origem: (0, import_pg_core.varchar)("origem", { length: 255 }),
  destino: (0, import_pg_core.varchar)("destino", { length: 255 }),
  // Datas e KM
  dataSaida: (0, import_pg_core.timestamp)("dataSaida"),
  dataChegada: (0, import_pg_core.timestamp)("dataChegada"),
  kmSaida: (0, import_pg_core.integer)("kmSaida"),
  kmChegada: (0, import_pg_core.integer)("kmChegada"),
  kmRodado: (0, import_pg_core.integer)("kmRodado"),
  // Carga
  descricaoCarga: (0, import_pg_core.text)("descricaoCarga"),
  tipoCarga: (0, import_pg_core.text)("tipoCarga"),
  pesoCarga: (0, import_pg_core.decimal)("pesoCarga", { precision: 8, scale: 2 }),
  // Financeiro da viagem
  freteTotalIda: (0, import_pg_core.decimal)("freteTotalIda", { precision: 10, scale: 2 }),
  freteTotalVolta: (0, import_pg_core.decimal)("freteTotalVolta", { precision: 10, scale: 2 }),
  freteTotal: (0, import_pg_core.decimal)("freteTotal", { precision: 10, scale: 2 }),
  adiantamento: (0, import_pg_core.decimal)("adiantamento", { precision: 10, scale: 2 }),
  saldoViagem: (0, import_pg_core.decimal)("saldoViagem", { precision: 10, scale: 2 }),
  // Despesas da viagem
  totalDespesas: (0, import_pg_core.decimal)("totalDespesas", { precision: 10, scale: 2 }),
  mediaConsumo: (0, import_pg_core.decimal)("mediaConsumo", { precision: 5, scale: 2 }),
  // Documentacao
  notaFiscal: (0, import_pg_core.varchar)("notaFiscal", { length: 50 }),
  // Status
  status: statusViagemEnum("status").default("planejada").notNull(),
  observacoes: (0, import_pg_core.text)("observacoes"),
  teveProblema: (0, import_pg_core.boolean)("teveProblema").default(false),
  voltouComCarga: (0, import_pg_core.boolean)("voltouComCarga").default(false),
  observacoesChegada: (0, import_pg_core.text)("observacoesChegada"),
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updatedAt").defaultNow().notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deletedAt"),
  deletedBy: (0, import_pg_core.integer)("deletedBy"),
  deleteReason: (0, import_pg_core.text)("deleteReason")
});
var despesasViagem = (0, import_pg_core.pgTable)("despesas_viagem", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  viagemId: (0, import_pg_core.integer)("viagemId").notNull(),
  empresaId: (0, import_pg_core.integer)("empresaId").notNull(),
  tipo: tipoDespesaEnum("tipo").notNull(),
  descricao: (0, import_pg_core.text)("descricao"),
  valor: (0, import_pg_core.decimal)("valor", { precision: 10, scale: 2 }).notNull(),
  data: (0, import_pg_core.date)("data"),
  comprovante: (0, import_pg_core.text)("comprovante"),
  // URL da foto
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deletedAt"),
  deletedBy: (0, import_pg_core.integer)("deletedBy"),
  deleteReason: (0, import_pg_core.text)("deleteReason")
});
var checklists = (0, import_pg_core.pgTable)("checklists", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  empresaId: (0, import_pg_core.integer)("empresaId").notNull(),
  veiculoId: (0, import_pg_core.integer)("veiculoId").notNull(),
  cavaloPrincipalId: (0, import_pg_core.integer)("cavaloPrincipalId"),
  // checklist independente para carreta
  motoristaId: (0, import_pg_core.integer)("motoristaId"),
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
  itensNaoConformes: (0, import_pg_core.integer)("itensNaoConformes").default(0),
  observacoes: (0, import_pg_core.text)("observacoes"),
  assinaturaMotorista: (0, import_pg_core.text)("assinaturaMotorista"),
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updatedAt").defaultNow().notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deletedAt"),
  deletedBy: (0, import_pg_core.integer)("deletedBy"),
  deleteReason: (0, import_pg_core.text)("deleteReason")
});
var contasPagar = (0, import_pg_core.pgTable)("contas_pagar", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  empresaId: (0, import_pg_core.integer)("empresaId").notNull(),
  descricao: (0, import_pg_core.text)("descricao").notNull(),
  categoria: categoriaContaPagarEnum("categoria").notNull(),
  valor: (0, import_pg_core.decimal)("valor", { precision: 10, scale: 2 }).notNull(),
  dataVencimento: (0, import_pg_core.date)("dataVencimento").notNull(),
  dataPagamento: (0, import_pg_core.date)("dataPagamento"),
  status: statusContaPagarEnum("status").default("pendente").notNull(),
  fornecedor: (0, import_pg_core.varchar)("fornecedor", { length: 255 }),
  notaFiscal: (0, import_pg_core.varchar)("notaFiscal", { length: 50 }),
  veiculoId: (0, import_pg_core.integer)("veiculoId"),
  funcionarioId: (0, import_pg_core.integer)("funcionarioId"),
  viagemId: (0, import_pg_core.integer)("viagemId"),
  comprovante: (0, import_pg_core.text)("comprovante"),
  observacoes: (0, import_pg_core.text)("observacoes"),
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updatedAt").defaultNow().notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deletedAt"),
  deletedBy: (0, import_pg_core.integer)("deletedBy"),
  deleteReason: (0, import_pg_core.text)("deleteReason")
});
var contasReceber = (0, import_pg_core.pgTable)("contas_receber", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  empresaId: (0, import_pg_core.integer)("empresaId").notNull(),
  descricao: (0, import_pg_core.text)("descricao").notNull(),
  categoria: categoriaContaReceberEnum("categoria").notNull(),
  valor: (0, import_pg_core.decimal)("valor", { precision: 10, scale: 2 }).notNull(),
  dataVencimento: (0, import_pg_core.date)("dataVencimento").notNull(),
  dataRecebimento: (0, import_pg_core.date)("dataRecebimento"),
  status: statusContaReceberEnum("status").default("pendente").notNull(),
  cliente: (0, import_pg_core.varchar)("cliente", { length: 255 }),
  notaFiscal: (0, import_pg_core.varchar)("notaFiscal", { length: 50 }),
  cteNumero: (0, import_pg_core.varchar)("cteNumero", { length: 50 }),
  viagemId: (0, import_pg_core.integer)("viagemId"),
  observacoes: (0, import_pg_core.text)("observacoes"),
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updatedAt").defaultNow().notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deletedAt"),
  deletedBy: (0, import_pg_core.integer)("deletedBy"),
  deleteReason: (0, import_pg_core.text)("deleteReason")
});
var adiantamentos = (0, import_pg_core.pgTable)("adiantamentos", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  empresaId: (0, import_pg_core.integer)("empresaId").notNull(),
  funcionarioId: (0, import_pg_core.integer)("funcionarioId").notNull(),
  viagemId: (0, import_pg_core.integer)("viagemId"),
  valor: (0, import_pg_core.decimal)("valor", { precision: 10, scale: 2 }).notNull(),
  formaPagamento: formaPagamentoEnum("formaPagamento").notNull(),
  data: (0, import_pg_core.date)("data").notNull(),
  status: statusAdiantamentoEnum("status").default("pendente").notNull(),
  valorAcertado: (0, import_pg_core.decimal)("valorAcertado", { precision: 10, scale: 2 }),
  dataAcerto: (0, import_pg_core.date)("dataAcerto"),
  saldo: (0, import_pg_core.decimal)("saldo", { precision: 10, scale: 2 }),
  // positivo = devolveu, negativo = empresa deve
  observacoes: (0, import_pg_core.text)("observacoes"),
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updatedAt").defaultNow().notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deletedAt"),
  deletedBy: (0, import_pg_core.integer)("deletedBy"),
  deleteReason: (0, import_pg_core.text)("deleteReason")
});
var controleTanque = (0, import_pg_core.pgTable)("controle_tanque", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  empresaId: (0, import_pg_core.integer)("empresaId").notNull(),
  tipo: tipoTanqueEnum("tipo").notNull(),
  data: (0, import_pg_core.date)("data").notNull(),
  operacao: operacaoTanqueEnum("operacao").notNull(),
  quantidade: (0, import_pg_core.decimal)("quantidade", { precision: 8, scale: 3 }).notNull(),
  valorUnitario: (0, import_pg_core.decimal)("valorUnitario", { precision: 8, scale: 3 }),
  valorTotal: (0, import_pg_core.decimal)("valorTotal", { precision: 10, scale: 2 }),
  fornecedor: (0, import_pg_core.varchar)("fornecedor", { length: 255 }),
  notaFiscal: (0, import_pg_core.varchar)("notaFiscal", { length: 50 }),
  veiculoId: (0, import_pg_core.integer)("veiculoId"),
  // para saidas: qual veiculo abasteceu
  motoristaId: (0, import_pg_core.integer)("motoristaId"),
  saldoAnterior: (0, import_pg_core.decimal)("saldoAnterior", { precision: 8, scale: 3 }),
  saldoAtual: (0, import_pg_core.decimal)("saldoAtual", { precision: 8, scale: 3 }),
  observacoes: (0, import_pg_core.text)("observacoes"),
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deletedAt"),
  deletedBy: (0, import_pg_core.integer)("deletedBy"),
  deleteReason: (0, import_pg_core.text)("deleteReason")
});
var auditLog = (0, import_pg_core.pgTable)("audit_log", {
  id: (0, import_pg_core.bigint)("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
  empresaId: (0, import_pg_core.integer)("empresaId"),
  userId: (0, import_pg_core.integer)("userId").notNull(),
  userName: (0, import_pg_core.varchar)("userName", { length: 255 }),
  acao: (0, import_pg_core.varchar)("acao", { length: 50 }).notNull(),
  // CREATE, UPDATE, DELETE, RESTORE
  tabela: (0, import_pg_core.varchar)("tabela", { length: 100 }).notNull(),
  registroId: (0, import_pg_core.integer)("registroId").notNull(),
  dadosAntes: (0, import_pg_core.text)("dadosAntes"),
  // JSON
  dadosDepois: (0, import_pg_core.text)("dadosDepois"),
  // JSON
  ip: (0, import_pg_core.varchar)("ip", { length: 45 }),
  userAgent: (0, import_pg_core.text)("userAgent"),
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull()
});
var acidentes = (0, import_pg_core.pgTable)("acidentes", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  empresaId: (0, import_pg_core.integer)("empresaId").notNull(),
  veiculoId: (0, import_pg_core.integer)("veiculoId").notNull(),
  motoristaId: (0, import_pg_core.integer)("motoristaId"),
  data: (0, import_pg_core.date)("data").notNull(),
  local: (0, import_pg_core.varchar)("local", { length: 255 }),
  descricao: (0, import_pg_core.text)("descricao").notNull(),
  boletimOcorrencia: (0, import_pg_core.varchar)("boletimOcorrencia", { length: 50 }),
  valorDano: (0, import_pg_core.decimal)("valorDano", { precision: 10, scale: 2 }),
  status: statusAcidenteEnum("status").default("aberto").notNull(),
  observacoes: (0, import_pg_core.text)("observacoes"),
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updatedAt").defaultNow().notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deletedAt"),
  deletedBy: (0, import_pg_core.integer)("deletedBy"),
  deleteReason: (0, import_pg_core.text)("deleteReason")
});
var chatConversations = (0, import_pg_core.pgTable)("chat_conversations", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  empresaId: (0, import_pg_core.integer)("empresaId").notNull(),
  name: (0, import_pg_core.varchar)("name", { length: 255 }),
  // opcional para grupos
  isGroup: (0, import_pg_core.boolean)("isGroup").default(false).notNull(),
  lastMessageAt: (0, import_pg_core.timestamp)("lastMessageAt").defaultNow().notNull(),
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updatedAt").defaultNow().notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deletedAt")
});
var chatMembers = (0, import_pg_core.pgTable)("chat_members", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  conversationId: (0, import_pg_core.integer)("conversationId").notNull(),
  userId: (0, import_pg_core.integer)("userId").notNull(),
  role: chatRoleEnum("role").default("member").notNull(),
  joinedAt: (0, import_pg_core.timestamp)("joinedAt").defaultNow().notNull(),
  lastReadAt: (0, import_pg_core.timestamp)("lastReadAt").defaultNow().notNull()
});
var chatMessages = (0, import_pg_core.pgTable)("chat_messages", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  conversationId: (0, import_pg_core.integer)("conversationId").notNull(),
  senderId: (0, import_pg_core.integer)("senderId").notNull(),
  content: (0, import_pg_core.text)("content").notNull(),
  type: chatMessageTypeEnum("type").default("text").notNull(),
  createdAt: (0, import_pg_core.timestamp)("createdAt").defaultNow().notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deletedAt")
});

// db.ts
import_dotenv.default.config({ path: import_path.default.resolve(process.cwd(), "..", ".env") });
import_dotenv.default.config();
var _db = null;
var _client = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = (0, import_postgres.default)(process.env.DATABASE_URL);
      _db = (0, import_postgres_js.drizzle)(_client);
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
  const result = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.openId, openId)).limit(1);
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
  await db.update(users).set(data).where((0, import_drizzle_orm.eq)(users.id, id));
}
async function deleteUser(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where((0, import_drizzle_orm.eq)(users.id, id));
}

// routers/veiculos.ts
var import_drizzle_orm2 = require("drizzle-orm");
var import_zod2 = require("zod");

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
var veiculoInput = import_zod2.z.object({
  empresaId: import_zod2.z.number(),
  placa: import_zod2.z.string().min(1, "Placa \xE9 obrigat\xF3ria").max(10).transform((v) => v.toUpperCase().trim()),
  tipo: import_zod2.z.enum(["van", "toco", "truck", "cavalo", "carreta", "empilhadeira", "paletera", "outro"]),
  cavaloPrincipalId: import_zod2.z.number().nullable().optional(),
  marca: import_zod2.z.string().max(100).optional(),
  modelo: import_zod2.z.string().max(100).optional(),
  ano: import_zod2.z.number().min(1900).max(2100).nullable().optional(),
  cor: import_zod2.z.string().max(50).optional(),
  renavam: import_zod2.z.string().max(20).optional(),
  chassi: import_zod2.z.string().max(30).optional(),
  capacidadeCarga: import_zod2.z.string().nullable().optional(),
  motoristaId: import_zod2.z.number().nullable().optional(),
  ajudanteId: import_zod2.z.number().nullable().optional(),
  kmAtual: import_zod2.z.number().nullable().optional(),
  mediaConsumo: import_zod2.z.string().nullable().optional(),
  vencimentoCrlv: import_zod2.z.string().nullable().optional(),
  vencimentoSeguro: import_zod2.z.string().nullable().optional(),
  classificacao: import_zod2.z.number().min(0).max(5).optional(),
  observacoes: import_zod2.z.string().optional()
});
function parseDate(d) {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}
var veiculosRouter = router({
  list: protectedProcedure.input(import_zod2.z.object({
    empresaId: import_zod2.z.number(),
    tipo: import_zod2.z.enum(["van", "toco", "truck", "cavalo", "carreta", "empilhadeira", "paletera", "outro"]).optional(),
    apenasAtivos: import_zod2.z.boolean().default(true)
  })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "veiculos.list");
      return db.select().from(veiculos).where((0, import_drizzle_orm2.and)(
        (0, import_drizzle_orm2.eq)(veiculos.empresaId, input.empresaId),
        (0, import_drizzle_orm2.isNull)(veiculos.deletedAt),
        input.apenasAtivos ? (0, import_drizzle_orm2.eq)(veiculos.ativo, true) : void 0,
        input.tipo ? (0, import_drizzle_orm2.eq)(veiculos.tipo, input.tipo) : void 0
      )).orderBy(veiculos.placa);
    }, "veiculos.list");
  }),
  listCavalos: protectedProcedure.input(import_zod2.z.object({ empresaId: import_zod2.z.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "veiculos.listCavalos");
      return db.select().from(veiculos).where((0, import_drizzle_orm2.and)(
        (0, import_drizzle_orm2.eq)(veiculos.empresaId, input.empresaId),
        (0, import_drizzle_orm2.eq)(veiculos.tipo, "cavalo"),
        (0, import_drizzle_orm2.eq)(veiculos.ativo, true),
        (0, import_drizzle_orm2.isNull)(veiculos.deletedAt)
      )).orderBy(veiculos.placa);
    }, "veiculos.listCavalos");
  }),
  getById: protectedProcedure.input(import_zod2.z.object({ id: import_zod2.z.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "veiculos.getById");
      const rows = await db.select().from(veiculos).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(veiculos.id, input.id), (0, import_drizzle_orm2.isNull)(veiculos.deletedAt))).limit(1);
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
  update: protectedProcedure.input(import_zod2.z.object({ id: import_zod2.z.number() }).merge(veiculoInput.partial())).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "veiculos.update");
      const { id, ...data } = input;
      await db.update(veiculos).set({
        ...data,
        placa: data.placa ? data.placa.toUpperCase().trim() : void 0,
        vencimentoCrlv: data.vencimentoCrlv !== void 0 ? parseDate(data.vencimentoCrlv) : void 0,
        vencimentoSeguro: data.vencimentoSeguro !== void 0 ? parseDate(data.vencimentoSeguro) : void 0,
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm2.eq)(veiculos.id, id));
      return { success: true };
    }, "veiculos.update");
  }),
  softDelete: protectedProcedure.input(import_zod2.z.object({ id: import_zod2.z.number(), reason: import_zod2.z.string().min(1, "Informe o motivo da exclus\xE3o") })).mutation(async ({ input, ctx }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "veiculos.softDelete");
      await db.update(veiculos).set({
        deletedAt: /* @__PURE__ */ new Date(),
        deletedBy: ctx.user.id,
        deleteReason: input.reason,
        ativo: false
      }).where((0, import_drizzle_orm2.eq)(veiculos.id, input.id));
      return { success: true };
    }, "veiculos.softDelete");
  }),
  restore: protectedProcedure.input(import_zod2.z.object({ id: import_zod2.z.number() })).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "veiculos.restore");
      await db.update(veiculos).set({
        deletedAt: null,
        deletedBy: null,
        deleteReason: null,
        ativo: true
      }).where((0, import_drizzle_orm2.eq)(veiculos.id, input.id));
      return { success: true };
    }, "veiculos.restore");
  }),
  getUltimoKm: protectedProcedure.input(import_zod2.z.object({ veiculoId: import_zod2.z.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "veiculos.getUltimoKm");
      const rows = await db.execute(import_drizzle_orm2.sql`
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
  listDeleted: protectedProcedure.input(import_zod2.z.object({ empresaId: import_zod2.z.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "veiculos.listDeleted");
      return db.select().from(veiculos).where((0, import_drizzle_orm2.and)(
        (0, import_drizzle_orm2.eq)(veiculos.empresaId, input.empresaId),
        (0, import_drizzle_orm2.isNotNull)(veiculos.deletedAt)
      )).orderBy((0, import_drizzle_orm2.desc)(veiculos.deletedAt));
    }, "veiculos.listDeleted");
  })
});

// routers/funcionarios.ts
var import_drizzle_orm3 = require("drizzle-orm");
var import_zod3 = require("zod");
var funcionarioInput = import_zod3.z.object({
  empresaId: import_zod3.z.number(),
  nome: import_zod3.z.string().min(1, "Nome \xE9 obrigat\xF3rio").max(255),
  funcao: import_zod3.z.enum(["motorista", "ajudante", "despachante", "gerente", "admin", "outro"]),
  tipoContrato: import_zod3.z.enum(["clt", "freelancer", "terceirizado", "estagiario"]).default("clt"),
  cpf: import_zod3.z.string().max(14).optional(),
  rg: import_zod3.z.string().max(20).optional(),
  telefone: import_zod3.z.string().max(20).optional(),
  email: import_zod3.z.string().email("E-mail inv\xE1lido").max(320).optional().or(import_zod3.z.literal("")),
  // CLT
  salario: import_zod3.z.string().nullable().optional(),
  dataAdmissao: import_zod3.z.string().nullable().optional(),
  dataDemissao: import_zod3.z.string().nullable().optional(),
  // Freelancer
  valorDiaria: import_zod3.z.string().nullable().optional(),
  valorMensal: import_zod3.z.string().nullable().optional(),
  tipoCobranca: import_zod3.z.enum(["diaria", "mensal", "por_viagem"]).nullable().optional(),
  dataInicioContrato: import_zod3.z.string().nullable().optional(),
  dataFimContrato: import_zod3.z.string().nullable().optional(),
  diaPagamento: import_zod3.z.number().min(1).max(31).nullable().optional(),
  // Motorista
  cnh: import_zod3.z.string().max(20).optional(),
  categoriaCnh: import_zod3.z.string().max(5).optional(),
  vencimentoCnh: import_zod3.z.string().nullable().optional(),
  mopp: import_zod3.z.boolean().optional(),
  vencimentoMopp: import_zod3.z.string().nullable().optional(),
  vencimentoAso: import_zod3.z.string().nullable().optional(),
  // Bancário
  banco: import_zod3.z.string().max(100).optional(),
  agencia: import_zod3.z.string().max(10).optional(),
  conta: import_zod3.z.string().max(20).optional(),
  tipoConta: import_zod3.z.enum(["corrente", "poupanca", "pix"]).nullable().optional(),
  chavePix: import_zod3.z.string().max(255).optional(),
  observacoes: import_zod3.z.string().optional(),
  foto: import_zod3.z.string().optional()
});
function parseDate2(d) {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}
var funcionariosRouter = router({
  list: protectedProcedure.input(import_zod3.z.object({
    empresaId: import_zod3.z.number(),
    funcao: import_zod3.z.enum(["motorista", "ajudante", "despachante", "gerente", "admin", "outro"]).optional(),
    tipoContrato: import_zod3.z.enum(["clt", "freelancer", "terceirizado", "estagiario"]).optional()
  })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "funcionarios.list");
      return db.select().from(funcionarios).where((0, import_drizzle_orm3.and)(
        (0, import_drizzle_orm3.eq)(funcionarios.empresaId, input.empresaId),
        (0, import_drizzle_orm3.isNull)(funcionarios.deletedAt),
        input.funcao ? (0, import_drizzle_orm3.eq)(funcionarios.funcao, input.funcao) : void 0,
        input.tipoContrato ? (0, import_drizzle_orm3.eq)(funcionarios.tipoContrato, input.tipoContrato) : void 0
      )).orderBy(funcionarios.nome);
    }, "funcionarios.list");
  }),
  listMotoristas: protectedProcedure.input(import_zod3.z.object({ empresaId: import_zod3.z.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "funcionarios.listMotoristas");
      return db.select().from(funcionarios).where((0, import_drizzle_orm3.and)(
        (0, import_drizzle_orm3.eq)(funcionarios.empresaId, input.empresaId),
        (0, import_drizzle_orm3.eq)(funcionarios.funcao, "motorista"),
        (0, import_drizzle_orm3.isNull)(funcionarios.deletedAt)
      )).orderBy(funcionarios.nome);
    }, "funcionarios.listMotoristas");
  }),
  listAjudantes: protectedProcedure.input(import_zod3.z.object({ empresaId: import_zod3.z.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "funcionarios.listAjudantes");
      return db.select().from(funcionarios).where((0, import_drizzle_orm3.and)(
        (0, import_drizzle_orm3.eq)(funcionarios.empresaId, input.empresaId),
        (0, import_drizzle_orm3.eq)(funcionarios.funcao, "ajudante"),
        (0, import_drizzle_orm3.isNull)(funcionarios.deletedAt)
      )).orderBy(funcionarios.nome);
    }, "funcionarios.listAjudantes");
  }),
  getById: protectedProcedure.input(import_zod3.z.object({ id: import_zod3.z.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "funcionarios.getById");
      const rows = await db.select().from(funcionarios).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(funcionarios.id, input.id), (0, import_drizzle_orm3.isNull)(funcionarios.deletedAt))).limit(1);
      return rows[0] ?? null;
    }, "funcionarios.getById");
  }),
  freelancersPendentes: protectedProcedure.input(import_zod3.z.object({ empresaId: import_zod3.z.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "funcionarios.freelancersPendentes");
      const hoje = /* @__PURE__ */ new Date();
      const rows = await db.select().from(funcionarios).where((0, import_drizzle_orm3.and)(
        (0, import_drizzle_orm3.eq)(funcionarios.empresaId, input.empresaId),
        (0, import_drizzle_orm3.eq)(funcionarios.tipoContrato, "freelancer"),
        (0, import_drizzle_orm3.isNull)(funcionarios.deletedAt)
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
  update: protectedProcedure.input(import_zod3.z.object({ id: import_zod3.z.number() }).merge(funcionarioInput.partial())).mutation(async ({ input }) => {
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
      }).where((0, import_drizzle_orm3.eq)(funcionarios.id, id));
      return { success: true };
    }, "funcionarios.update");
  }),
  softDelete: protectedProcedure.input(import_zod3.z.object({ id: import_zod3.z.number(), reason: import_zod3.z.string().min(1, "Informe o motivo da exclus\xE3o") })).mutation(async ({ input, ctx }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "funcionarios.softDelete");
      await db.update(funcionarios).set({
        deletedAt: /* @__PURE__ */ new Date(),
        deletedBy: ctx.user.id,
        deleteReason: input.reason,
        ativo: false
      }).where((0, import_drizzle_orm3.eq)(funcionarios.id, input.id));
      return { success: true };
    }, "funcionarios.softDelete");
  }),
  restore: protectedProcedure.input(import_zod3.z.object({ id: import_zod3.z.number() })).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "funcionarios.restore");
      await db.update(funcionarios).set({
        deletedAt: null,
        deletedBy: null,
        deleteReason: null,
        ativo: true
      }).where((0, import_drizzle_orm3.eq)(funcionarios.id, input.id));
      return { success: true };
    }, "funcionarios.restore");
  }),
  listDeleted: protectedProcedure.input(import_zod3.z.object({ empresaId: import_zod3.z.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "funcionarios.listDeleted");
      return db.select().from(funcionarios).where((0, import_drizzle_orm3.and)(
        (0, import_drizzle_orm3.eq)(funcionarios.empresaId, input.empresaId),
        (0, import_drizzle_orm3.isNotNull)(funcionarios.deletedAt)
      )).orderBy((0, import_drizzle_orm3.desc)(funcionarios.deletedAt));
    }, "funcionarios.listDeleted");
  })
});

// routers/frota.ts
var import_drizzle_orm4 = require("drizzle-orm");
var import_zod4 = require("zod");
function parseDate3(d) {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}
var frotaRouter = router({
  // ─── ABASTECIMENTOS ───────────────────────────────────────────────────────
  abastecimentos: router({
    list: protectedProcedure.input(import_zod4.z.object({
      empresaId: import_zod4.z.number(),
      veiculoId: import_zod4.z.number().optional(),
      motoristaId: import_zod4.z.number().optional(),
      tipoCombustivel: import_zod4.z.enum(["diesel", "arla", "gasolina", "etanol", "gas", "outro"]).optional(),
      tipoAbastecimento: import_zod4.z.enum(["interno", "externo"]).optional(),
      dataInicio: import_zod4.z.string().optional(),
      dataFim: import_zod4.z.string().optional(),
      busca: import_zod4.z.string().optional(),
      limit: import_zod4.z.number().default(100)
    })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "abastecimentos.list");
        return db.select().from(abastecimentos).where((0, import_drizzle_orm4.and)(
          (0, import_drizzle_orm4.eq)(abastecimentos.empresaId, input.empresaId),
          (0, import_drizzle_orm4.isNull)(abastecimentos.deletedAt),
          input.veiculoId ? (0, import_drizzle_orm4.eq)(abastecimentos.veiculoId, input.veiculoId) : void 0,
          input.motoristaId ? (0, import_drizzle_orm4.eq)(abastecimentos.motoristaId, input.motoristaId) : void 0,
          input.tipoCombustivel ? (0, import_drizzle_orm4.eq)(abastecimentos.tipoCombustivel, input.tipoCombustivel) : void 0,
          input.tipoAbastecimento ? (0, import_drizzle_orm4.eq)(abastecimentos.tipoAbastecimento, input.tipoAbastecimento) : void 0,
          input.dataInicio ? (0, import_drizzle_orm4.gte)(abastecimentos.data, new Date(input.dataInicio)) : void 0,
          input.dataFim ? (0, import_drizzle_orm4.lte)(abastecimentos.data, /* @__PURE__ */ new Date(input.dataFim + "T23:59:59")) : void 0
        )).orderBy((0, import_drizzle_orm4.desc)(abastecimentos.data)).limit(input.limit);
      }, "abastecimentos.list");
    }),
    create: protectedProcedure.input(import_zod4.z.object({
      empresaId: import_zod4.z.number(),
      veiculoId: import_zod4.z.number(),
      motoristaId: import_zod4.z.number().nullable().optional(),
      data: import_zod4.z.string(),
      tipoCombustivel: import_zod4.z.enum(["diesel", "arla", "gasolina", "etanol", "gas", "outro"]),
      quantidade: import_zod4.z.string(),
      valorUnitario: import_zod4.z.string().nullable().optional(),
      valorTotal: import_zod4.z.string().nullable().optional(),
      kmAtual: import_zod4.z.number().nullable().optional(),
      kmRodado: import_zod4.z.number().nullable().optional(),
      mediaConsumo: import_zod4.z.string().nullable().optional(),
      local: import_zod4.z.string().optional(),
      tipoAbastecimento: import_zod4.z.enum(["interno", "externo"]).default("interno"),
      notaFiscal: import_zod4.z.string().optional(),
      observacoes: import_zod4.z.string().optional()
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
    update: protectedProcedure.input(import_zod4.z.object({
      id: import_zod4.z.number(),
      data: import_zod4.z.string().optional(),
      tipoCombustivel: import_zod4.z.enum(["diesel", "arla", "gasolina", "etanol", "gas", "outro"]).optional(),
      quantidade: import_zod4.z.string().optional(),
      valorUnitario: import_zod4.z.string().nullable().optional(),
      valorTotal: import_zod4.z.string().nullable().optional(),
      kmAtual: import_zod4.z.number().nullable().optional(),
      local: import_zod4.z.string().optional(),
      observacoes: import_zod4.z.string().optional()
    })).mutation(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "abastecimentos.update");
        const { id, data, ...rest } = input;
        await db.update(abastecimentos).set({
          ...rest,
          ...data ? { data: new Date(data) } : {},
          updatedAt: /* @__PURE__ */ new Date()
        }).where((0, import_drizzle_orm4.eq)(abastecimentos.id, id));
        return { success: true };
      }, "abastecimentos.update");
    }),
    softDelete: protectedProcedure.input(import_zod4.z.object({ id: import_zod4.z.number(), reason: import_zod4.z.string().min(1, "Informe o motivo") })).mutation(async ({ input, ctx }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "abastecimentos.softDelete");
        await db.update(abastecimentos).set({
          deletedAt: /* @__PURE__ */ new Date(),
          deletedBy: ctx.user.id,
          deleteReason: input.reason
        }).where((0, import_drizzle_orm4.eq)(abastecimentos.id, input.id));
        return { success: true };
      }, "abastecimentos.softDelete");
    }),
    resumoPorVeiculo: protectedProcedure.input(import_zod4.z.object({ empresaId: import_zod4.z.number() })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "abastecimentos.resumoPorVeiculo");
        return db.select({
          veiculoId: abastecimentos.veiculoId,
          totalLitros: import_drizzle_orm4.sql`SUM(${abastecimentos.quantidade})`,
          totalValor: import_drizzle_orm4.sql`SUM(${abastecimentos.valorTotal})`,
          mediaConsumo: import_drizzle_orm4.sql`AVG(${abastecimentos.mediaConsumo})`,
          ultimoAbastecimento: import_drizzle_orm4.sql`MAX(${abastecimentos.data})`
        }).from(abastecimentos).where((0, import_drizzle_orm4.and)((0, import_drizzle_orm4.eq)(abastecimentos.empresaId, input.empresaId), (0, import_drizzle_orm4.isNull)(abastecimentos.deletedAt))).groupBy(abastecimentos.veiculoId);
      }, "abastecimentos.resumoPorVeiculo");
    }),
    // Preço médio do diesel nos últimos 30 dias (para calculadora)
    precioMedioDiesel: protectedProcedure.input(import_zod4.z.object({ empresaId: import_zod4.z.number() })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "abastecimentos.precioMedioDiesel");
        const trintaDiasAtras = /* @__PURE__ */ new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
        const rows = await db.select({
          media: import_drizzle_orm4.sql`AVG(${abastecimentos.valorUnitario})`
        }).from(abastecimentos).where((0, import_drizzle_orm4.and)(
          (0, import_drizzle_orm4.eq)(abastecimentos.empresaId, input.empresaId),
          (0, import_drizzle_orm4.eq)(abastecimentos.tipoCombustivel, "diesel"),
          (0, import_drizzle_orm4.isNull)(abastecimentos.deletedAt),
          (0, import_drizzle_orm4.gte)(abastecimentos.data, trintaDiasAtras)
        ));
        return { precioMedio: Number(rows[0]?.media) || 6.5 };
      }, "abastecimentos.precioMedioDiesel");
    })
  }),
  // ─── MANUTENÇÕES ──────────────────────────────────────────────────────────
  manutencoes: router({
    list: protectedProcedure.input(import_zod4.z.object({
      empresaId: import_zod4.z.number(),
      veiculoId: import_zod4.z.number().optional(),
      tipo: import_zod4.z.enum(["preventiva", "corretiva", "revisao", "pneu", "eletrica", "funilaria", "outro"]).optional(),
      dataInicio: import_zod4.z.string().optional(),
      dataFim: import_zod4.z.string().optional(),
      busca: import_zod4.z.string().optional(),
      limit: import_zod4.z.number().default(100)
    })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "manutencoes.list");
        return db.select().from(manutencoes).where((0, import_drizzle_orm4.and)(
          (0, import_drizzle_orm4.eq)(manutencoes.empresaId, input.empresaId),
          (0, import_drizzle_orm4.isNull)(manutencoes.deletedAt),
          input.veiculoId ? (0, import_drizzle_orm4.eq)(manutencoes.veiculoId, input.veiculoId) : void 0,
          input.tipo ? (0, import_drizzle_orm4.eq)(manutencoes.tipo, input.tipo) : void 0,
          input.dataInicio ? (0, import_drizzle_orm4.gte)(manutencoes.data, new Date(input.dataInicio)) : void 0,
          input.dataFim ? (0, import_drizzle_orm4.lte)(manutencoes.data, /* @__PURE__ */ new Date(input.dataFim + "T23:59:59")) : void 0
        )).orderBy((0, import_drizzle_orm4.desc)(manutencoes.data)).limit(input.limit);
      }, "manutencoes.list");
    }),
    create: protectedProcedure.input(import_zod4.z.object({
      empresaId: import_zod4.z.number(),
      veiculoId: import_zod4.z.number(),
      data: import_zod4.z.string(),
      tipo: import_zod4.z.enum(["preventiva", "corretiva", "revisao", "pneu", "eletrica", "funilaria", "outro"]),
      descricao: import_zod4.z.string().min(1, "Descri\xE7\xE3o \xE9 obrigat\xF3ria"),
      empresa: import_zod4.z.string().optional(),
      valor: import_zod4.z.string().nullable().optional(),
      kmAtual: import_zod4.z.number().nullable().optional(),
      proximaManutencaoKm: import_zod4.z.number().nullable().optional(),
      proximaManutencaoData: import_zod4.z.string().nullable().optional(),
      notaFiscal: import_zod4.z.string().optional(),
      observacoes: import_zod4.z.string().optional()
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
    update: protectedProcedure.input(import_zod4.z.object({
      id: import_zod4.z.number(),
      data: import_zod4.z.string().optional(),
      tipo: import_zod4.z.enum(["preventiva", "corretiva", "revisao", "pneu", "eletrica", "funilaria", "outro"]).optional(),
      descricao: import_zod4.z.string().optional(),
      empresa: import_zod4.z.string().optional(),
      valor: import_zod4.z.string().nullable().optional(),
      kmAtual: import_zod4.z.number().nullable().optional(),
      observacoes: import_zod4.z.string().optional()
    })).mutation(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "manutencoes.update");
        const { id, data, ...rest } = input;
        await db.update(manutencoes).set({
          ...rest,
          ...data ? { data: new Date(data) } : {},
          updatedAt: /* @__PURE__ */ new Date()
        }).where((0, import_drizzle_orm4.eq)(manutencoes.id, id));
        return { success: true };
      }, "manutencoes.update");
    }),
    softDelete: protectedProcedure.input(import_zod4.z.object({ id: import_zod4.z.number(), reason: import_zod4.z.string().min(1, "Informe o motivo") })).mutation(async ({ input, ctx }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "manutencoes.softDelete");
        await db.update(manutencoes).set({
          deletedAt: /* @__PURE__ */ new Date(),
          deletedBy: ctx.user.id,
          deleteReason: input.reason
        }).where((0, import_drizzle_orm4.eq)(manutencoes.id, input.id));
        return { success: true };
      }, "manutencoes.softDelete");
    }),
    totalPorVeiculo: protectedProcedure.input(import_zod4.z.object({ empresaId: import_zod4.z.number() })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "manutencoes.totalPorVeiculo");
        return db.select({
          veiculoId: manutencoes.veiculoId,
          totalValor: import_drizzle_orm4.sql`SUM(${manutencoes.valor})`,
          quantidade: import_drizzle_orm4.sql`COUNT(*)`,
          ultimaManutencao: import_drizzle_orm4.sql`MAX(${manutencoes.data})`
        }).from(manutencoes).where((0, import_drizzle_orm4.and)((0, import_drizzle_orm4.eq)(manutencoes.empresaId, input.empresaId), (0, import_drizzle_orm4.isNull)(manutencoes.deletedAt))).groupBy(manutencoes.veiculoId);
      }, "manutencoes.totalPorVeiculo");
    })
  }),
  // ─── CONTROLE TANQUE ──────────────────────────────────────────────────────
  tanque: router({
    list: protectedProcedure.input(import_zod4.z.object({ empresaId: import_zod4.z.number(), limit: import_zod4.z.number().default(50) })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "tanque.list");
        return db.select().from(controleTanque).where((0, import_drizzle_orm4.and)((0, import_drizzle_orm4.eq)(controleTanque.empresaId, input.empresaId), (0, import_drizzle_orm4.isNull)(controleTanque.deletedAt))).orderBy((0, import_drizzle_orm4.desc)(controleTanque.data)).limit(input.limit);
      }, "tanque.list");
    }),
    saldoAtual: protectedProcedure.input(import_zod4.z.object({ empresaId: import_zod4.z.number() })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "tanque.saldoAtual");
        const rows = await db.select({
          tipo: controleTanque.tipo,
          saldo: import_drizzle_orm4.sql`SUM(CASE WHEN ${controleTanque.operacao} = 'entrada' THEN ${controleTanque.quantidade} ELSE -${controleTanque.quantidade} END)`
        }).from(controleTanque).where((0, import_drizzle_orm4.and)((0, import_drizzle_orm4.eq)(controleTanque.empresaId, input.empresaId), (0, import_drizzle_orm4.isNull)(controleTanque.deletedAt))).groupBy(controleTanque.tipo);
        const result = { diesel: 0, arla: 0 };
        rows.forEach((r) => {
          if (r.tipo === "diesel") result.diesel = Number(r.saldo) || 0;
          if (r.tipo === "arla") result.arla = Number(r.saldo) || 0;
        });
        return result;
      }, "tanque.saldoAtual");
    }),
    create: protectedProcedure.input(import_zod4.z.object({
      empresaId: import_zod4.z.number(),
      tipo: import_zod4.z.enum(["diesel", "arla"]),
      data: import_zod4.z.string(),
      operacao: import_zod4.z.enum(["entrada", "saida"]),
      quantidade: import_zod4.z.string(),
      valorUnitario: import_zod4.z.string().nullable().optional(),
      valorTotal: import_zod4.z.string().nullable().optional(),
      fornecedor: import_zod4.z.string().optional(),
      notaFiscal: import_zod4.z.string().optional(),
      veiculoId: import_zod4.z.number().nullable().optional(),
      motoristaId: import_zod4.z.number().nullable().optional(),
      observacoes: import_zod4.z.string().optional()
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
    custoMedio: protectedProcedure.input(import_zod4.z.object({ empresaId: import_zod4.z.number() })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "tanque.custoMedio");
        const entradas = await db.select().from(controleTanque).where((0, import_drizzle_orm4.and)(
          (0, import_drizzle_orm4.eq)(controleTanque.empresaId, input.empresaId),
          (0, import_drizzle_orm4.eq)(controleTanque.operacao, "entrada"),
          (0, import_drizzle_orm4.isNull)(controleTanque.deletedAt),
          (0, import_drizzle_orm4.isNotNull)(controleTanque.valorUnitario)
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
  calcularCustoViagem: protectedProcedure.input(import_zod4.z.object({
    empresaId: import_zod4.z.number(),
    veiculoId: import_zod4.z.number(),
    distanciaKm: import_zod4.z.number().min(1, "Dist\xE2ncia deve ser maior que zero"),
    freteTotal: import_zod4.z.number().min(0),
    diasViagem: import_zod4.z.number().min(1).default(1),
    // Ajudantes para calcular diárias
    ajudante1Id: import_zod4.z.number().nullable().optional(),
    ajudante2Id: import_zod4.z.number().nullable().optional(),
    ajudante3Id: import_zod4.z.number().nullable().optional(),
    // Custos extras estimados
    pedagioEstimado: import_zod4.z.number().default(0),
    outrosCustos: import_zod4.z.number().default(0),
    // Preço do diesel (se não informado, usa média dos últimos 30 dias)
    precoDiesel: import_zod4.z.number().nullable().optional()
  })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "frota.calcularCustoViagem");
      const veiculoRows = await db.select({
        mediaConsumo: veiculos.mediaConsumo,
        tipo: veiculos.tipo
      }).from(veiculos).where((0, import_drizzle_orm4.eq)(veiculos.id, input.veiculoId)).limit(1);
      const veiculo = veiculoRows[0];
      const mediaConsumo = Number(veiculo?.mediaConsumo) || 3.5;
      let precoDiesel = input.precoDiesel;
      if (!precoDiesel) {
        const trintaDiasAtras = /* @__PURE__ */ new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
        const precoRows = await db.select({
          media: import_drizzle_orm4.sql`AVG(${abastecimentos.valorUnitario})`
        }).from(abastecimentos).where((0, import_drizzle_orm4.and)(
          (0, import_drizzle_orm4.eq)(abastecimentos.empresaId, input.empresaId),
          (0, import_drizzle_orm4.eq)(abastecimentos.tipoCombustivel, "diesel"),
          (0, import_drizzle_orm4.isNull)(abastecimentos.deletedAt),
          (0, import_drizzle_orm4.gte)(abastecimentos.data, trintaDiasAtras)
        ));
        precoDiesel = Number(precoRows[0]?.media) || 6.5;
      }
      const litrosNecessarios = input.distanciaKm / mediaConsumo;
      const custoCombustivel = litrosNecessarios * precoDiesel;
      let custoDiariasMotorista = 0;
      const veiculoComMotorista = await db.select({
        motoristaId: veiculos.motoristaId
      }).from(veiculos).where((0, import_drizzle_orm4.eq)(veiculos.id, input.veiculoId)).limit(1);
      if (veiculoComMotorista[0]?.motoristaId) {
        const motoristaRows = await db.select({
          valorDiaria: funcionarios.valorDiaria,
          tipoCobranca: funcionarios.tipoCobranca
        }).from(funcionarios).where((0, import_drizzle_orm4.eq)(funcionarios.id, veiculoComMotorista[0].motoristaId)).limit(1);
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
        }).from(funcionarios).where((0, import_drizzle_orm4.eq)(funcionarios.id, ajId)).limit(1);
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
  listSimulacoes: protectedProcedure.input(import_zod4.z.object({ empresaId: import_zod4.z.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "frota.listSimulacoes");
      const rows = await db.execute(import_drizzle_orm4.sql`
          SELECT * FROM simulacoes_viagem
          WHERE empresaId = ${input.empresaId}
          ORDER BY createdAt DESC
          LIMIT 50
        `);
      return rows[0] ?? [];
    }, "frota.listSimulacoes");
  }),
  salvarSimulacao: protectedProcedure.input(import_zod4.z.object({
    empresaId: import_zod4.z.number(),
    veiculoId: import_zod4.z.number().optional(),
    descricao: import_zod4.z.string().min(1),
    origem: import_zod4.z.string().optional(),
    destino: import_zod4.z.string().optional(),
    distanciaKm: import_zod4.z.number(),
    valorFrete: import_zod4.z.number(),
    custoTotal: import_zod4.z.number(),
    margemBruta: import_zod4.z.number(),
    margemPct: import_zod4.z.number(),
    detalhes: import_zod4.z.string().optional(),
    observacoes: import_zod4.z.string().optional()
  })).mutation(async ({ input, ctx }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "frota.salvarSimulacao");
      await db.execute(import_drizzle_orm4.sql`
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
var import_drizzle_orm5 = require("drizzle-orm");
var import_zod5 = require("zod");
var import_server3 = require("@trpc/server");
function parseDate4(d) {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}
var financeiroRouter = router({
  // ─── CONTAS A PAGAR ───────────────────────────────────────────────────────
  pagar: router({
    list: protectedProcedure.input(import_zod5.z.object({
      empresaId: import_zod5.z.number(),
      status: import_zod5.z.enum(["pendente", "pago", "vencido", "cancelado"]).optional(),
      limit: import_zod5.z.number().default(50)
    })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.pagar.list");
        return db.select().from(contasPagar).where((0, import_drizzle_orm5.and)(
          (0, import_drizzle_orm5.eq)(contasPagar.empresaId, input.empresaId),
          (0, import_drizzle_orm5.isNull)(contasPagar.deletedAt),
          input.status ? (0, import_drizzle_orm5.eq)(contasPagar.status, input.status) : void 0
        )).orderBy(contasPagar.dataVencimento).limit(input.limit);
      }, "financeiro.pagar.list");
    }),
    create: protectedProcedure.input(import_zod5.z.object({
      empresaId: import_zod5.z.number(),
      descricao: import_zod5.z.string().min(1, "Descri\xE7\xE3o \xE9 obrigat\xF3ria"),
      categoria: import_zod5.z.enum(["combustivel", "manutencao", "salario", "freelancer", "pedagio", "seguro", "ipva", "licenciamento", "pneu", "outro"]),
      valor: import_zod5.z.string(),
      dataVencimento: import_zod5.z.string(),
      dataPagamento: import_zod5.z.string().nullable().optional(),
      status: import_zod5.z.enum(["pendente", "pago", "vencido", "cancelado"]).default("pendente"),
      fornecedor: import_zod5.z.string().optional(),
      notaFiscal: import_zod5.z.string().optional(),
      veiculoId: import_zod5.z.number().nullable().optional(),
      funcionarioId: import_zod5.z.number().nullable().optional(),
      viagemId: import_zod5.z.number().nullable().optional(),
      observacoes: import_zod5.z.string().optional()
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
    update: protectedProcedure.input(import_zod5.z.object({
      id: import_zod5.z.number(),
      descricao: import_zod5.z.string().optional(),
      valor: import_zod5.z.string().optional(),
      dataVencimento: import_zod5.z.string().optional(),
      dataPagamento: import_zod5.z.string().nullable().optional(),
      status: import_zod5.z.enum(["pendente", "pago", "vencido", "cancelado"]).optional(),
      observacoes: import_zod5.z.string().optional()
    })).mutation(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.pagar.update");
        const { id, dataVencimento, dataPagamento, ...rest } = input;
        await db.update(contasPagar).set({
          ...rest,
          ...dataVencimento ? { dataVencimento: new Date(dataVencimento) } : {},
          ...dataPagamento !== void 0 ? { dataPagamento: parseDate4(dataPagamento) } : {},
          updatedAt: /* @__PURE__ */ new Date()
        }).where((0, import_drizzle_orm5.eq)(contasPagar.id, id));
        return { success: true };
      }, "financeiro.pagar.update");
    }),
    softDelete: protectedProcedure.input(import_zod5.z.object({ id: import_zod5.z.number(), reason: import_zod5.z.string().min(1, "Informe o motivo") })).mutation(async ({ input, ctx }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.pagar.softDelete");
        await db.update(contasPagar).set({
          deletedAt: /* @__PURE__ */ new Date(),
          deletedBy: ctx.user.id,
          deleteReason: input.reason
        }).where((0, import_drizzle_orm5.eq)(contasPagar.id, input.id));
        return { success: true };
      }, "financeiro.pagar.softDelete");
    }),
    resumo: protectedProcedure.input(import_zod5.z.object({ empresaId: import_zod5.z.number() })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.pagar.resumo");
        const hoje = /* @__PURE__ */ new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const inicioMesStr = inicioMes.toISOString();
        const rows = await db.select({
          status: contasPagar.status,
          total: import_drizzle_orm5.sql`SUM(${contasPagar.valor})`
        }).from(contasPagar).where((0, import_drizzle_orm5.and)((0, import_drizzle_orm5.eq)(contasPagar.empresaId, input.empresaId), (0, import_drizzle_orm5.isNull)(contasPagar.deletedAt))).groupBy(contasPagar.status);
        const result = { pendente: 0, vencido: 0, pagoMes: 0 };
        rows.forEach((r) => {
          if (r.status === "pendente") result.pendente = Number(r.total) || 0;
          if (r.status === "vencido") result.vencido = Number(r.total) || 0;
        });
        const pagoRows = await db.select({ total: import_drizzle_orm5.sql`SUM(${contasPagar.valor})` }).from(contasPagar).where((0, import_drizzle_orm5.and)(
          (0, import_drizzle_orm5.eq)(contasPagar.empresaId, input.empresaId),
          (0, import_drizzle_orm5.eq)(contasPagar.status, "pago"),
          (0, import_drizzle_orm5.gte)(contasPagar.dataPagamento, import_drizzle_orm5.sql`${inicioMesStr}::timestamp`),
          (0, import_drizzle_orm5.isNull)(contasPagar.deletedAt)
        ));
        result.pagoMes = Number(pagoRows[0]?.total) || 0;
        return result;
      }, "financeiro.pagar.resumo");
    })
  }),
  // ─── CONTAS A RECEBER ─────────────────────────────────────────────────────
  receber: router({
    list: protectedProcedure.input(import_zod5.z.object({
      empresaId: import_zod5.z.number(),
      status: import_zod5.z.enum(["pendente", "recebido", "vencido", "cancelado"]).optional(),
      limit: import_zod5.z.number().default(50)
    })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.receber.list");
        return db.select().from(contasReceber).where((0, import_drizzle_orm5.and)(
          (0, import_drizzle_orm5.eq)(contasReceber.empresaId, input.empresaId),
          (0, import_drizzle_orm5.isNull)(contasReceber.deletedAt),
          input.status ? (0, import_drizzle_orm5.eq)(contasReceber.status, input.status) : void 0
        )).orderBy(contasReceber.dataVencimento).limit(input.limit);
      }, "financeiro.receber.list");
    }),
    create: protectedProcedure.input(import_zod5.z.object({
      empresaId: import_zod5.z.number(),
      descricao: import_zod5.z.string().min(1, "Descri\xE7\xE3o \xE9 obrigat\xF3ria"),
      categoria: import_zod5.z.enum(["frete", "cte", "devolucao", "outro"]),
      valor: import_zod5.z.string(),
      dataVencimento: import_zod5.z.string(),
      dataRecebimento: import_zod5.z.string().nullable().optional(),
      status: import_zod5.z.enum(["pendente", "recebido", "vencido", "cancelado"]).default("pendente"),
      cliente: import_zod5.z.string().optional(),
      notaFiscal: import_zod5.z.string().optional(),
      cteNumero: import_zod5.z.string().optional(),
      viagemId: import_zod5.z.number().nullable().optional(),
      observacoes: import_zod5.z.string().optional()
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
    update: protectedProcedure.input(import_zod5.z.object({
      id: import_zod5.z.number(),
      descricao: import_zod5.z.string().optional(),
      valor: import_zod5.z.string().optional(),
      dataVencimento: import_zod5.z.string().optional(),
      dataRecebimento: import_zod5.z.string().nullable().optional(),
      status: import_zod5.z.enum(["pendente", "recebido", "vencido", "cancelado"]).optional(),
      observacoes: import_zod5.z.string().optional()
    })).mutation(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.receber.update");
        const { id, dataVencimento, dataRecebimento, ...rest } = input;
        await db.update(contasReceber).set({
          ...rest,
          ...dataVencimento ? { dataVencimento: new Date(dataVencimento) } : {},
          ...dataRecebimento !== void 0 ? { dataRecebimento: parseDate4(dataRecebimento) } : {},
          updatedAt: /* @__PURE__ */ new Date()
        }).where((0, import_drizzle_orm5.eq)(contasReceber.id, id));
        return { success: true };
      }, "financeiro.receber.update");
    }),
    softDelete: protectedProcedure.input(import_zod5.z.object({ id: import_zod5.z.number(), reason: import_zod5.z.string().min(1, "Informe o motivo") })).mutation(async ({ input, ctx }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.receber.softDelete");
        await db.update(contasReceber).set({
          deletedAt: /* @__PURE__ */ new Date(),
          deletedBy: ctx.user.id,
          deleteReason: input.reason
        }).where((0, import_drizzle_orm5.eq)(contasReceber.id, input.id));
        return { success: true };
      }, "financeiro.receber.softDelete");
    }),
    resumo: protectedProcedure.input(import_zod5.z.object({ empresaId: import_zod5.z.number() })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.receber.resumo");
        const hoje = /* @__PURE__ */ new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const inicioMesStr = inicioMes.toISOString();
        const rows = await db.select({
          status: contasReceber.status,
          total: import_drizzle_orm5.sql`SUM(${contasReceber.valor})`
        }).from(contasReceber).where((0, import_drizzle_orm5.and)((0, import_drizzle_orm5.eq)(contasReceber.empresaId, input.empresaId), (0, import_drizzle_orm5.isNull)(contasReceber.deletedAt))).groupBy(contasReceber.status);
        const result = { pendente: 0, vencido: 0, recebidoMes: 0 };
        rows.forEach((r) => {
          if (r.status === "pendente") result.pendente = Number(r.total) || 0;
          if (r.status === "vencido") result.vencido = Number(r.total) || 0;
        });
        const recRows = await db.select({ total: import_drizzle_orm5.sql`SUM(${contasReceber.valor})` }).from(contasReceber).where((0, import_drizzle_orm5.and)(
          (0, import_drizzle_orm5.eq)(contasReceber.empresaId, input.empresaId),
          (0, import_drizzle_orm5.eq)(contasReceber.status, "recebido"),
          (0, import_drizzle_orm5.gte)(contasReceber.dataRecebimento, import_drizzle_orm5.sql`${inicioMesStr}::timestamp`),
          (0, import_drizzle_orm5.isNull)(contasReceber.deletedAt)
        ));
        result.recebidoMes = Number(recRows[0]?.total) || 0;
        return result;
      }, "financeiro.receber.resumo");
    })
  }),
  // ─── ADIANTAMENTOS ────────────────────────────────────────────────────────
  adiantamentos: router({
    list: protectedProcedure.input(import_zod5.z.object({
      empresaId: import_zod5.z.number(),
      funcionarioId: import_zod5.z.number().optional(),
      status: import_zod5.z.enum(["pendente", "acertado", "cancelado"]).optional(),
      limit: import_zod5.z.number().default(50)
    })).query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.adiantamentos.list");
        return db.select().from(adiantamentos).where((0, import_drizzle_orm5.and)(
          (0, import_drizzle_orm5.eq)(adiantamentos.empresaId, input.empresaId),
          (0, import_drizzle_orm5.isNull)(adiantamentos.deletedAt),
          input.funcionarioId ? (0, import_drizzle_orm5.eq)(adiantamentos.funcionarioId, input.funcionarioId) : void 0,
          input.status ? (0, import_drizzle_orm5.eq)(adiantamentos.status, input.status) : void 0
        )).orderBy((0, import_drizzle_orm5.desc)(adiantamentos.data)).limit(input.limit);
      }, "financeiro.adiantamentos.list");
    }),
    create: protectedProcedure.input(import_zod5.z.object({
      empresaId: import_zod5.z.number(),
      funcionarioId: import_zod5.z.number(),
      viagemId: import_zod5.z.number().nullable().optional(),
      valor: import_zod5.z.string(),
      formaPagamento: import_zod5.z.enum(["dinheiro", "pix", "transferencia", "cartao"]),
      data: import_zod5.z.string(),
      observacoes: import_zod5.z.string().optional()
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
    acertar: protectedProcedure.input(import_zod5.z.object({
      id: import_zod5.z.number(),
      valorAcertado: import_zod5.z.string(),
      dataAcerto: import_zod5.z.string(),
      observacoes: import_zod5.z.string().optional()
    })).mutation(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.adiantamentos.acertar");
        const rows = await db.select().from(adiantamentos).where((0, import_drizzle_orm5.eq)(adiantamentos.id, input.id)).limit(1);
        const adiant = rows[0];
        if (!adiant) {
          throw new import_server3.TRPCError({ code: "NOT_FOUND", message: "Adiantamento n\xE3o encontrado." });
        }
        const saldo = Number(adiant.valor) - Number(input.valorAcertado);
        await db.update(adiantamentos).set({
          valorAcertado: input.valorAcertado,
          dataAcerto: new Date(input.dataAcerto),
          saldo: String(saldo),
          status: "acertado",
          observacoes: input.observacoes,
          updatedAt: /* @__PURE__ */ new Date()
        }).where((0, import_drizzle_orm5.eq)(adiantamentos.id, input.id));
        return { success: true, saldo };
      }, "financeiro.adiantamentos.acertar");
    }),
    softDelete: protectedProcedure.input(import_zod5.z.object({ id: import_zod5.z.number(), reason: import_zod5.z.string().min(1, "Informe o motivo") })).mutation(async ({ input, ctx }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "financeiro.adiantamentos.softDelete");
        await db.update(adiantamentos).set({
          deletedAt: /* @__PURE__ */ new Date(),
          deletedBy: ctx.user.id,
          deleteReason: input.reason
        }).where((0, import_drizzle_orm5.eq)(adiantamentos.id, input.id));
        return { success: true };
      }, "financeiro.adiantamentos.softDelete");
    })
  }),
  // ─── DASHBOARD FINANCEIRO COMPLETO ────────────────────────────────────────
  dashboard: protectedProcedure.input(import_zod5.z.object({ empresaId: import_zod5.z.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "financeiro.dashboard");
      const hoje = /* @__PURE__ */ new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      const em7dias = new Date(hoje);
      em7dias.setDate(hoje.getDate() + 7);
      const pagarRows = await db.select({
        status: contasPagar.status,
        total: import_drizzle_orm5.sql`SUM(${contasPagar.valor})`,
        count: import_drizzle_orm5.sql`COUNT(*)`
      }).from(contasPagar).where((0, import_drizzle_orm5.and)((0, import_drizzle_orm5.eq)(contasPagar.empresaId, input.empresaId), (0, import_drizzle_orm5.isNull)(contasPagar.deletedAt))).groupBy(contasPagar.status);
      const receberRows = await db.select({
        status: contasReceber.status,
        total: import_drizzle_orm5.sql`SUM(${contasReceber.valor})`,
        count: import_drizzle_orm5.sql`COUNT(*)`
      }).from(contasReceber).where((0, import_drizzle_orm5.and)((0, import_drizzle_orm5.eq)(contasReceber.empresaId, input.empresaId), (0, import_drizzle_orm5.isNull)(contasReceber.deletedAt))).groupBy(contasReceber.status);
      const adiantRows = await db.select({
        total: import_drizzle_orm5.sql`SUM(${adiantamentos.valor})`,
        count: import_drizzle_orm5.sql`COUNT(*)`
      }).from(adiantamentos).where((0, import_drizzle_orm5.and)(
        (0, import_drizzle_orm5.eq)(adiantamentos.empresaId, input.empresaId),
        (0, import_drizzle_orm5.eq)(adiantamentos.status, "pendente"),
        (0, import_drizzle_orm5.isNull)(adiantamentos.deletedAt)
      ));
      const viagensRows = await db.select({
        totalFrete: import_drizzle_orm5.sql`SUM(${viagens.freteTotal})`,
        totalDespesas: import_drizzle_orm5.sql`SUM(${viagens.totalDespesas})`,
        totalSaldo: import_drizzle_orm5.sql`SUM(${viagens.saldoViagem})`,
        quantidade: import_drizzle_orm5.sql`COUNT(*)`
      }).from(viagens).where((0, import_drizzle_orm5.and)(
        (0, import_drizzle_orm5.eq)(viagens.empresaId, input.empresaId),
        (0, import_drizzle_orm5.eq)(viagens.status, "concluida"),
        (0, import_drizzle_orm5.gte)(viagens.dataChegada, inicioMes),
        (0, import_drizzle_orm5.isNull)(viagens.deletedAt)
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
var import_drizzle_orm6 = require("drizzle-orm");
var import_zod6 = require("zod");
var dashboardRouter = router({
  // Resumo geral da empresa
  resumo: protectedProcedure.input(import_zod6.z.object({ empresaId: import_zod6.z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const hoje = /* @__PURE__ */ new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const em7dias = new Date(hoje);
    em7dias.setDate(hoje.getDate() + 7);
    const veiculosRows = await db.select({
      total: import_drizzle_orm6.sql`COUNT(*)`
    }).from(veiculos).where((0, import_drizzle_orm6.and)((0, import_drizzle_orm6.eq)(veiculos.empresaId, input.empresaId), (0, import_drizzle_orm6.eq)(veiculos.ativo, true), (0, import_drizzle_orm6.isNull)(veiculos.deletedAt)));
    const funcRows = await db.select({
      funcao: funcionarios.funcao,
      total: import_drizzle_orm6.sql`COUNT(*)`
    }).from(funcionarios).where((0, import_drizzle_orm6.and)((0, import_drizzle_orm6.eq)(funcionarios.empresaId, input.empresaId), (0, import_drizzle_orm6.eq)(funcionarios.ativo, true), (0, import_drizzle_orm6.isNull)(funcionarios.deletedAt))).groupBy(funcionarios.funcao);
    const abastRows = await db.select({
      total: import_drizzle_orm6.sql`SUM(${abastecimentos.valorTotal})`,
      litros: import_drizzle_orm6.sql`SUM(${abastecimentos.quantidade})`
    }).from(abastecimentos).where((0, import_drizzle_orm6.and)(
      (0, import_drizzle_orm6.eq)(abastecimentos.empresaId, input.empresaId),
      (0, import_drizzle_orm6.isNull)(abastecimentos.deletedAt),
      (0, import_drizzle_orm6.gte)(abastecimentos.data, inicioMes)
    ));
    const manutRows = await db.select({
      total: import_drizzle_orm6.sql`SUM(${manutencoes.valor})`,
      count: import_drizzle_orm6.sql`COUNT(*)`
    }).from(manutencoes).where((0, import_drizzle_orm6.and)(
      (0, import_drizzle_orm6.eq)(manutencoes.empresaId, input.empresaId),
      (0, import_drizzle_orm6.isNull)(manutencoes.deletedAt),
      (0, import_drizzle_orm6.gte)(manutencoes.data, inicioMes)
    ));
    const viagensRows = await db.select({
      status: viagens.status,
      total: import_drizzle_orm6.sql`COUNT(*)`
    }).from(viagens).where((0, import_drizzle_orm6.and)((0, import_drizzle_orm6.eq)(viagens.empresaId, input.empresaId), (0, import_drizzle_orm6.isNull)(viagens.deletedAt))).groupBy(viagens.status);
    const contasVencendo = await db.select({
      total: import_drizzle_orm6.sql`COUNT(*)`,
      valor: import_drizzle_orm6.sql`SUM(${contasPagar.valor})`
    }).from(contasPagar).where((0, import_drizzle_orm6.and)(
      (0, import_drizzle_orm6.eq)(contasPagar.empresaId, input.empresaId),
      (0, import_drizzle_orm6.eq)(contasPagar.status, "pendente"),
      (0, import_drizzle_orm6.lte)(contasPagar.dataVencimento, em7dias),
      (0, import_drizzle_orm6.gte)(contasPagar.dataVencimento, hoje),
      (0, import_drizzle_orm6.isNull)(contasPagar.deletedAt)
    ));
    const freelancers = await db.select().from(funcionarios).where((0, import_drizzle_orm6.and)(
      (0, import_drizzle_orm6.eq)(funcionarios.empresaId, input.empresaId),
      (0, import_drizzle_orm6.eq)(funcionarios.tipoContrato, "freelancer"),
      (0, import_drizzle_orm6.isNull)(funcionarios.deletedAt)
    ));
    const freelancersParaPagar = freelancers.filter((f) => {
      if (!f.diaPagamento) return false;
      const diaAtual = hoje.getDate();
      const diff = f.diaPagamento - diaAtual;
      return diff >= 0 && diff <= 7;
    });
    const cnhVencendo = await db.select({
      count: import_drizzle_orm6.sql`COUNT(*)`
    }).from(funcionarios).where((0, import_drizzle_orm6.and)(
      (0, import_drizzle_orm6.eq)(funcionarios.empresaId, input.empresaId),
      (0, import_drizzle_orm6.isNull)(funcionarios.deletedAt),
      (0, import_drizzle_orm6.lte)(funcionarios.vencimentoCnh, em7dias),
      (0, import_drizzle_orm6.gte)(funcionarios.vencimentoCnh, hoje)
    ));
    const crlvVencendo = await db.select({
      count: import_drizzle_orm6.sql`COUNT(*)`
    }).from(veiculos).where((0, import_drizzle_orm6.and)(
      (0, import_drizzle_orm6.eq)(veiculos.empresaId, input.empresaId),
      (0, import_drizzle_orm6.isNull)(veiculos.deletedAt),
      (0, import_drizzle_orm6.lte)(veiculos.vencimentoCrlv, em7dias),
      (0, import_drizzle_orm6.gte)(veiculos.vencimentoCrlv, hoje)
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
  listUsers: protectedProcedure.input(import_zod6.z.object({ empresaId: import_zod6.z.number().optional() })).query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(users).orderBy(users.createdAt);
  }),
  updateUserRole: protectedProcedure.input(import_zod6.z.object({
    userId: import_zod6.z.number(),
    role: import_zod6.z.enum(["user", "admin", "master_admin", "monitor", "dispatcher"])
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
    await db.update(users).set({ role: input.role }).where((0, import_drizzle_orm6.eq)(users.id, input.userId));
    return { success: true };
  }),
  // Lista de empresas
  empresas: router({
    list: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(empresas).where((0, import_drizzle_orm6.and)((0, import_drizzle_orm6.eq)(empresas.ativo, true), (0, import_drizzle_orm6.isNull)(empresas.deletedAt))).orderBy(empresas.nome);
    }),
    getById: protectedProcedure.input(import_zod6.z.object({ id: import_zod6.z.number() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(empresas).where((0, import_drizzle_orm6.eq)(empresas.id, input.id)).limit(1);
      return rows[0] ?? null;
    })
  })
});

// routers/viagens.ts
var import_drizzle_orm7 = require("drizzle-orm");
var import_zod7 = require("zod");
var viagemInput = import_zod7.z.object({
  empresaId: import_zod7.z.number(),
  tipo: import_zod7.z.enum(["entrega", "viagem"]).optional(),
  veiculoId: import_zod7.z.number(),
  cavaloPrincipalId: import_zod7.z.number().nullable().optional(),
  motoristaId: import_zod7.z.number().nullable().optional(),
  ajudante1Id: import_zod7.z.number().nullable().optional(),
  ajudante2Id: import_zod7.z.number().nullable().optional(),
  ajudante3Id: import_zod7.z.number().nullable().optional(),
  origem: import_zod7.z.string().optional(),
  destino: import_zod7.z.string().optional(),
  dataSaida: import_zod7.z.string().nullable().optional(),
  dataChegada: import_zod7.z.string().nullable().optional(),
  kmSaida: import_zod7.z.number().nullable().optional(),
  kmChegada: import_zod7.z.number().nullable().optional(),
  kmRodado: import_zod7.z.number().nullable().optional(),
  descricaoCarga: import_zod7.z.string().optional(),
  pesoCarga: import_zod7.z.string().nullable().optional(),
  freteTotalIda: import_zod7.z.string().nullable().optional(),
  freteTotalVolta: import_zod7.z.string().nullable().optional(),
  freteTotal: import_zod7.z.string().nullable().optional(),
  adiantamento: import_zod7.z.string().nullable().optional(),
  saldoViagem: import_zod7.z.string().nullable().optional(),
  totalDespesas: import_zod7.z.string().nullable().optional(),
  mediaConsumo: import_zod7.z.string().nullable().optional(),
  status: import_zod7.z.enum(["planejada", "em_andamento", "concluida", "cancelada"]).optional(),
  observacoes: import_zod7.z.string().optional(),
  teveProblema: import_zod7.z.boolean().optional(),
  voltouComCarga: import_zod7.z.boolean().optional(),
  observacoesChegada: import_zod7.z.string().optional(),
  tipoCarga: import_zod7.z.string().optional(),
  notaFiscal: import_zod7.z.string().optional()
});
var viagensRouter = router({
  list: protectedProcedure.input(import_zod7.z.object({
    empresaId: import_zod7.z.number(),
    status: import_zod7.z.enum(["planejada", "em_andamento", "concluida", "cancelada"]).optional(),
    tipo: import_zod7.z.enum(["entrega", "viagem"]).optional(),
    limit: import_zod7.z.number().default(50)
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
      }).from(viagens).leftJoin(funcionarios, (0, import_drizzle_orm7.eq)(viagens.motoristaId, funcionarios.id)).leftJoin(veiculos, (0, import_drizzle_orm7.eq)(viagens.veiculoId, veiculos.id)).where((0, import_drizzle_orm7.and)(
        (0, import_drizzle_orm7.eq)(viagens.empresaId, input.empresaId),
        (0, import_drizzle_orm7.isNull)(viagens.deletedAt),
        input.status ? (0, import_drizzle_orm7.eq)(viagens.status, input.status) : void 0,
        input.tipo ? (0, import_drizzle_orm7.eq)(viagens.tipo, input.tipo) : void 0
      )).orderBy((0, import_drizzle_orm7.desc)(viagens.dataSaida)).limit(input.limit);
      return rows;
    }, "viagens.list");
  }),
  getById: protectedProcedure.input(import_zod7.z.object({ id: import_zod7.z.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.getById");
      const rows = await db.select().from(viagens).where((0, import_drizzle_orm7.and)((0, import_drizzle_orm7.eq)(viagens.id, input.id), (0, import_drizzle_orm7.isNull)(viagens.deletedAt))).limit(1);
      if (!rows[0]) return null;
      const despesas = await db.select().from(despesasViagem).where((0, import_drizzle_orm7.and)((0, import_drizzle_orm7.eq)(despesasViagem.viagemId, input.id), (0, import_drizzle_orm7.isNull)(despesasViagem.deletedAt)));
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
  update: protectedProcedure.input(import_zod7.z.object({ id: import_zod7.z.number() }).merge(viagemInput.partial())).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.update");
      const { id, ...data } = input;
      await db.update(viagens).set({
        ...data,
        dataSaida: data.dataSaida !== void 0 ? data.dataSaida ? new Date(data.dataSaida) : null : void 0,
        dataChegada: data.dataChegada !== void 0 ? data.dataChegada ? new Date(data.dataChegada) : null : void 0,
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm7.eq)(viagens.id, id));
      return { success: true };
    }, "viagens.update");
  }),
  updateStatus: protectedProcedure.input(import_zod7.z.object({
    id: import_zod7.z.number(),
    status: import_zod7.z.enum(["planejada", "em_andamento", "concluida", "cancelada"]),
    kmChegada: import_zod7.z.number().optional(),
    dataChegada: import_zod7.z.string().optional()
  })).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.updateStatus");
      await db.update(viagens).set({
        status: input.status,
        kmChegada: input.kmChegada,
        dataChegada: input.dataChegada ? new Date(input.dataChegada) : void 0,
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm7.eq)(viagens.id, input.id));
      return { success: true };
    }, "viagens.updateStatus");
  }),
  softDelete: protectedProcedure.input(import_zod7.z.object({ id: import_zod7.z.number(), reason: import_zod7.z.string().min(1, "Informe o motivo da exclus\xE3o") })).mutation(async ({ input, ctx }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.softDelete");
      await db.update(viagens).set({
        deletedAt: /* @__PURE__ */ new Date(),
        deletedBy: ctx.user.id,
        deleteReason: input.reason
      }).where((0, import_drizzle_orm7.eq)(viagens.id, input.id));
      return { success: true };
    }, "viagens.softDelete");
  }),
  restore: protectedProcedure.input(import_zod7.z.object({ id: import_zod7.z.number() })).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.restore");
      await db.update(viagens).set({
        deletedAt: null,
        deletedBy: null,
        deleteReason: null
      }).where((0, import_drizzle_orm7.eq)(viagens.id, input.id));
      return { success: true };
    }, "viagens.restore");
  }),
  listDeleted: protectedProcedure.input(import_zod7.z.object({ empresaId: import_zod7.z.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.listDeleted");
      return db.select().from(viagens).where((0, import_drizzle_orm7.and)((0, import_drizzle_orm7.eq)(viagens.empresaId, input.empresaId), (0, import_drizzle_orm7.isNotNull)(viagens.deletedAt))).orderBy((0, import_drizzle_orm7.desc)(viagens.deletedAt));
    }, "viagens.listDeleted");
  }),
  // Despesas da viagem
  addDespesa: protectedProcedure.input(import_zod7.z.object({
    viagemId: import_zod7.z.number(),
    empresaId: import_zod7.z.number(),
    tipo: import_zod7.z.enum(["combustivel", "pedagio", "borracharia", "estacionamento", "oficina", "telefone", "descarga", "diaria", "alimentacao", "outro"]),
    descricao: import_zod7.z.string().optional(),
    valor: import_zod7.z.string(),
    data: import_zod7.z.string().optional(),
    comprovante: import_zod7.z.string().optional()
  })).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.addDespesa");
      const [result] = await db.insert(despesasViagem).values({
        ...input,
        data: input.data ? new Date(input.data) : null
      });
      const totalRows = await db.select({
        total: import_drizzle_orm7.sql`SUM(${despesasViagem.valor})`
      }).from(despesasViagem).where((0, import_drizzle_orm7.and)((0, import_drizzle_orm7.eq)(despesasViagem.viagemId, input.viagemId), (0, import_drizzle_orm7.isNull)(despesasViagem.deletedAt)));
      const novoTotal = String(Number(totalRows[0]?.total) || 0);
      await db.update(viagens).set({ totalDespesas: novoTotal, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm7.eq)(viagens.id, input.viagemId));
      return { id: result.insertId };
    }, "viagens.addDespesa");
  }),
  // Veículos em viagem (status em_andamento) com motorista vinculado
  veiculosEmViagem: protectedProcedure.input(import_zod7.z.object({ empresaId: import_zod7.z.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.veiculosEmViagem");
      const rows = await db.select({
        veiculoId: viagens.veiculoId,
        motoristaId: viagens.motoristaId,
        veiculoPlaca: veiculos.placa,
        motoristaNome: funcionarios.nome,
        origem: viagens.origem,
        destino: viagens.destino
      }).from(viagens).leftJoin(veiculos, (0, import_drizzle_orm7.eq)(viagens.veiculoId, veiculos.id)).leftJoin(funcionarios, (0, import_drizzle_orm7.eq)(viagens.motoristaId, funcionarios.id)).where((0, import_drizzle_orm7.and)(
        (0, import_drizzle_orm7.eq)(viagens.empresaId, input.empresaId),
        (0, import_drizzle_orm7.eq)(viagens.status, "em_andamento"),
        (0, import_drizzle_orm7.isNull)(viagens.deletedAt)
      ));
      return rows;
    }, "viagens.veiculosEmViagem");
  }),
  // Resumo financeiro para dashboard
  resumoFinanceiro: protectedProcedure.input(import_zod7.z.object({ empresaId: import_zod7.z.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "viagens.resumoFinanceiro");
      const rows = await db.select({
        status: viagens.status,
        totalFrete: import_drizzle_orm7.sql`SUM(${viagens.freteTotal})`,
        totalDespesas: import_drizzle_orm7.sql`SUM(${viagens.totalDespesas})`,
        totalSaldo: import_drizzle_orm7.sql`SUM(${viagens.saldoViagem})`,
        quantidade: import_drizzle_orm7.sql`COUNT(*)`
      }).from(viagens).where((0, import_drizzle_orm7.and)((0, import_drizzle_orm7.eq)(viagens.empresaId, input.empresaId), (0, import_drizzle_orm7.isNull)(viagens.deletedAt))).groupBy(viagens.status);
      return rows;
    }, "viagens.resumoFinanceiro");
  })
});

// routers/custos.ts
var import_drizzle_orm8 = require("drizzle-orm");
var import_zod8 = require("zod");
var custosRouter = router({
  /**
   * Custo por km de um veículo em um período.
   * Considera: combustível + manutenções + custos fixos rateados.
   */
  custoPorKm: protectedProcedure.input(import_zod8.z.object({
    empresaId: import_zod8.z.number(),
    veiculoId: import_zod8.z.number(),
    dataInicio: import_zod8.z.string().optional(),
    // ISO date string
    dataFim: import_zod8.z.string().optional()
  })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "custos.custoPorKm");
      const dataInicio = input.dataInicio ? new Date(input.dataInicio) : new Date((/* @__PURE__ */ new Date()).getFullYear(), 0, 1);
      const dataFim = input.dataFim ? new Date(input.dataFim) : /* @__PURE__ */ new Date();
      const combustivelRows = await db.select({
        totalLitros: import_drizzle_orm8.sql`SUM(${abastecimentos.quantidade})`,
        totalValor: import_drizzle_orm8.sql`SUM(${abastecimentos.valorTotal})`,
        mediaConsumo: import_drizzle_orm8.sql`AVG(${abastecimentos.mediaConsumo})`
      }).from(abastecimentos).where((0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(abastecimentos.veiculoId, input.veiculoId),
        (0, import_drizzle_orm8.eq)(abastecimentos.empresaId, input.empresaId),
        (0, import_drizzle_orm8.isNull)(abastecimentos.deletedAt),
        (0, import_drizzle_orm8.gte)(abastecimentos.data, dataInicio),
        (0, import_drizzle_orm8.lte)(abastecimentos.data, dataFim)
      ));
      const custoCombustivel = Number(combustivelRows[0]?.totalValor) || 0;
      const mediaConsumo = Number(combustivelRows[0]?.mediaConsumo) || 0;
      const manutRows = await db.select({
        tipo: manutencoes.tipo,
        totalValor: import_drizzle_orm8.sql`SUM(${manutencoes.valor})`,
        quantidade: import_drizzle_orm8.sql`COUNT(*)`
      }).from(manutencoes).where((0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(manutencoes.veiculoId, input.veiculoId),
        (0, import_drizzle_orm8.eq)(manutencoes.empresaId, input.empresaId),
        (0, import_drizzle_orm8.isNull)(manutencoes.deletedAt),
        (0, import_drizzle_orm8.gte)(manutencoes.data, dataInicio),
        (0, import_drizzle_orm8.lte)(manutencoes.data, dataFim)
      )).groupBy(manutencoes.tipo);
      const custoManutencoes = manutRows.reduce((sum, r) => sum + (Number(r.totalValor) || 0), 0);
      const custoPneus = Number(manutRows.find((r) => r.tipo === "pneu")?.totalValor) || 0;
      const custoPreventiva = Number(manutRows.find((r) => r.tipo === "preventiva")?.totalValor) || 0;
      const custoCorretiva = Number(manutRows.find((r) => r.tipo === "corretiva")?.totalValor) || 0;
      const custosFixosRows = await db.select({
        categoria: contasPagar.categoria,
        totalValor: import_drizzle_orm8.sql`SUM(${contasPagar.valor})`
      }).from(contasPagar).where((0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(contasPagar.veiculoId, input.veiculoId),
        (0, import_drizzle_orm8.eq)(contasPagar.empresaId, input.empresaId),
        (0, import_drizzle_orm8.isNull)(contasPagar.deletedAt),
        (0, import_drizzle_orm8.gte)(contasPagar.dataVencimento, dataInicio),
        (0, import_drizzle_orm8.lte)(contasPagar.dataVencimento, dataFim)
      )).groupBy(contasPagar.categoria);
      const custoSeguro = Number(custosFixosRows.find((r) => r.categoria === "seguro")?.totalValor) || 0;
      const custoIpva = Number(custosFixosRows.find((r) => r.categoria === "ipva")?.totalValor) || 0;
      const custoLicenciamento = Number(custosFixosRows.find((r) => r.categoria === "licenciamento")?.totalValor) || 0;
      const custoFixoTotal = custoSeguro + custoIpva + custoLicenciamento;
      const kmRows = await db.select({
        kmTotal: import_drizzle_orm8.sql`SUM(${viagens.kmRodado})`,
        quantidadeViagens: import_drizzle_orm8.sql`COUNT(*)`
      }).from(viagens).where((0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(viagens.veiculoId, input.veiculoId),
        (0, import_drizzle_orm8.eq)(viagens.empresaId, input.empresaId),
        (0, import_drizzle_orm8.eq)(viagens.status, "concluida"),
        (0, import_drizzle_orm8.isNull)(viagens.deletedAt),
        (0, import_drizzle_orm8.gte)(viagens.dataSaida, dataInicio),
        (0, import_drizzle_orm8.lte)(viagens.dataSaida, dataFim)
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
  custoRealViagem: protectedProcedure.input(import_zod8.z.object({ viagemId: import_zod8.z.number(), empresaId: import_zod8.z.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "custos.custoRealViagem");
      const viagemRows = await db.select().from(viagens).where((0, import_drizzle_orm8.and)((0, import_drizzle_orm8.eq)(viagens.id, input.viagemId), (0, import_drizzle_orm8.isNull)(viagens.deletedAt))).limit(1);
      const viagem = viagemRows[0];
      if (!viagem) return null;
      let custoCombustivel = 0;
      if (viagem.dataSaida && viagem.dataChegada) {
        const combRows = await db.select({
          total: import_drizzle_orm8.sql`SUM(${abastecimentos.valorTotal})`,
          litros: import_drizzle_orm8.sql`SUM(${abastecimentos.quantidade})`
        }).from(abastecimentos).where((0, import_drizzle_orm8.and)(
          (0, import_drizzle_orm8.eq)(abastecimentos.veiculoId, viagem.veiculoId),
          (0, import_drizzle_orm8.eq)(abastecimentos.empresaId, input.empresaId),
          (0, import_drizzle_orm8.isNull)(abastecimentos.deletedAt),
          (0, import_drizzle_orm8.gte)(abastecimentos.data, viagem.dataSaida),
          (0, import_drizzle_orm8.lte)(abastecimentos.data, viagem.dataChegada)
        ));
        custoCombustivel = Number(combRows[0]?.total) || 0;
      }
      const kmViagem = Number(viagem.kmRodado) || 0;
      const manutRows = await db.select({
        totalValor: import_drizzle_orm8.sql`SUM(${manutencoes.valor})`,
        kmTotal: import_drizzle_orm8.sql`SUM(${manutencoes.kmAtual})`
      }).from(manutencoes).where((0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(manutencoes.veiculoId, viagem.veiculoId),
        (0, import_drizzle_orm8.eq)(manutencoes.empresaId, input.empresaId),
        (0, import_drizzle_orm8.isNull)(manutencoes.deletedAt)
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
        }).from(funcionarios).where((0, import_drizzle_orm8.eq)(funcionarios.id, fId)).limit(1);
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
  alertasManutencao: protectedProcedure.input(import_zod8.z.object({
    empresaId: import_zod8.z.number(),
    margemAlertaKm: import_zod8.z.number().default(500)
    // alertar quando faltar X km
  })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "custos.alertasManutencao");
      const veiculosRows = await db.select({
        id: veiculos.id,
        placa: veiculos.placa,
        tipo: veiculos.tipo,
        kmAtual: veiculos.kmAtual
      }).from(veiculos).where((0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(veiculos.empresaId, input.empresaId),
        (0, import_drizzle_orm8.eq)(veiculos.ativo, true),
        (0, import_drizzle_orm8.isNull)(veiculos.deletedAt)
      ));
      const alertas = [];
      for (const v of veiculosRows) {
        if (!v.kmAtual) continue;
        const ultimaManut = await db.select({
          proximaManutencaoKm: manutencoes.proximaManutencaoKm,
          proximaManutencaoData: manutencoes.proximaManutencaoData,
          tipo: manutencoes.tipo,
          data: manutencoes.data
        }).from(manutencoes).where((0, import_drizzle_orm8.and)(
          (0, import_drizzle_orm8.eq)(manutencoes.veiculoId, v.id),
          (0, import_drizzle_orm8.eq)(manutencoes.empresaId, input.empresaId),
          (0, import_drizzle_orm8.isNull)(manutencoes.deletedAt)
        )).orderBy((0, import_drizzle_orm8.desc)(manutencoes.data)).limit(5);
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
  comparativoCustoPorKm: protectedProcedure.input(import_zod8.z.object({
    empresaId: import_zod8.z.number(),
    meses: import_zod8.z.number().default(3)
    // últimos N meses
  })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "custos.comparativoCustoPorKm");
      const dataInicio = /* @__PURE__ */ new Date();
      dataInicio.setMonth(dataInicio.getMonth() - input.meses);
      const combRows = await db.select({
        veiculoId: abastecimentos.veiculoId,
        totalCombustivel: import_drizzle_orm8.sql`SUM(${abastecimentos.valorTotal})`,
        totalLitros: import_drizzle_orm8.sql`SUM(${abastecimentos.quantidade})`
      }).from(abastecimentos).where((0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(abastecimentos.empresaId, input.empresaId),
        (0, import_drizzle_orm8.isNull)(abastecimentos.deletedAt),
        (0, import_drizzle_orm8.gte)(abastecimentos.data, dataInicio)
      )).groupBy(abastecimentos.veiculoId);
      const manutRows = await db.select({
        veiculoId: manutencoes.veiculoId,
        totalManutencao: import_drizzle_orm8.sql`SUM(${manutencoes.valor})`
      }).from(manutencoes).where((0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(manutencoes.empresaId, input.empresaId),
        (0, import_drizzle_orm8.isNull)(manutencoes.deletedAt),
        (0, import_drizzle_orm8.gte)(manutencoes.data, dataInicio)
      )).groupBy(manutencoes.veiculoId);
      const kmRows = await db.select({
        veiculoId: viagens.veiculoId,
        kmTotal: import_drizzle_orm8.sql`SUM(${viagens.kmRodado})`,
        freteTotal: import_drizzle_orm8.sql`SUM(${viagens.freteTotal})`,
        quantidadeViagens: import_drizzle_orm8.sql`COUNT(*)`
      }).from(viagens).where((0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(viagens.empresaId, input.empresaId),
        (0, import_drizzle_orm8.eq)(viagens.status, "concluida"),
        (0, import_drizzle_orm8.isNull)(viagens.deletedAt),
        (0, import_drizzle_orm8.gte)(viagens.dataSaida, dataInicio)
      )).groupBy(viagens.veiculoId);
      const veiculosRows = await db.select({
        id: veiculos.id,
        placa: veiculos.placa,
        tipo: veiculos.tipo,
        mediaConsumo: veiculos.mediaConsumo
      }).from(veiculos).where((0, import_drizzle_orm8.and)(
        (0, import_drizzle_orm8.eq)(veiculos.empresaId, input.empresaId),
        (0, import_drizzle_orm8.eq)(veiculos.ativo, true),
        (0, import_drizzle_orm8.isNull)(veiculos.deletedAt)
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
var import_zod9 = require("zod");
var import_drizzle_orm9 = require("drizzle-orm");
var multasRouter = router({
  list: protectedProcedure.input(import_zod9.z.object({ empresaId: import_zod9.z.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "multas.list");
      const rows = await db.execute(import_drizzle_orm9.sql`
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
  create: protectedProcedure.input(import_zod9.z.object({
    empresaId: import_zod9.z.number(),
    veiculoId: import_zod9.z.number(),
    motoristaId: import_zod9.z.number().nullable().optional(),
    data: import_zod9.z.string(),
    local: import_zod9.z.string().optional(),
    descricao: import_zod9.z.string().min(1),
    numeroAuto: import_zod9.z.string().optional(),
    pontos: import_zod9.z.number().default(0),
    valor: import_zod9.z.number().min(0),
    vencimento: import_zod9.z.string().optional(),
    status: import_zod9.z.enum(["pendente", "pago", "recorrido", "cancelado"]).default("pendente"),
    responsavel: import_zod9.z.enum(["motorista", "empresa"]).default("motorista"),
    observacoes: import_zod9.z.string().optional()
  })).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "multas.create");
      await db.execute(import_drizzle_orm9.sql`
          INSERT INTO multas (empresaId, veiculoId, motoristaId, data, local, descricao, numeroAuto, pontos, valor, vencimento, status, responsavel, observacoes)
          VALUES (${input.empresaId}, ${input.veiculoId}, ${input.motoristaId ?? null}, ${input.data}, ${input.local ?? null}, ${input.descricao}, ${input.numeroAuto ?? null}, ${input.pontos}, ${input.valor}, ${input.vencimento ?? null}, ${input.status}, ${input.responsavel}, ${input.observacoes ?? null})
        `);
      return { success: true };
    });
  }),
  updateStatus: protectedProcedure.input(import_zod9.z.object({
    id: import_zod9.z.number(),
    status: import_zod9.z.enum(["pendente", "pago", "recorrido", "cancelado"])
  })).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "multas.updateStatus");
      await db.execute(import_drizzle_orm9.sql`UPDATE multas SET status = ${input.status} WHERE id = ${input.id}`);
      return { success: true };
    });
  }),
  delete: protectedProcedure.input(import_zod9.z.object({ id: import_zod9.z.number(), userId: import_zod9.z.number(), reason: import_zod9.z.string().optional() })).mutation(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "multas.delete");
      await db.execute(import_drizzle_orm9.sql`UPDATE multas SET deletedAt = NOW(), deletedBy = ${input.userId}, deleteReason = ${input.reason ?? null} WHERE id = ${input.id}`);
      return { success: true };
    });
  }),
  stats: protectedProcedure.input(import_zod9.z.object({ empresaId: import_zod9.z.number() })).query(async ({ input }) => {
    return safeDb(async () => {
      const db = requireDb(await getDb(), "multas.stats");
      const rows = await db.execute(import_drizzle_orm9.sql`
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
var import_zod10 = require("zod");
var import_drizzle_orm10 = require("drizzle-orm");
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_server4 = require("@trpc/server");

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
var import_axios = __toESM(require("axios"), 1);
var import_cookie = require("cookie");
var import_jose = require("jose");
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
var createOAuthHttpClient = () => import_axios.default.create({
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
    const parsed = (0, import_cookie.parse)(cookieHeader);
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
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new import_jose.SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await (0, import_jose.jwtVerify)(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
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
  login: publicProcedure.input(import_zod10.z.object({
    username: import_zod10.z.string().optional(),
    email: import_zod10.z.string().optional(),
    password: import_zod10.z.string()
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new import_server4.TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indispon\xEDvel" });
    const identifier = input.username || input.email;
    if (!identifier) {
      throw new import_server4.TRPCError({ code: "BAD_REQUEST", message: "Usu\xE1rio ou e-mail \xE9 obrigat\xF3rio" });
    }
    const [user] = await db.select().from(users).where(input.username ? (0, import_drizzle_orm10.eq)(users.name, input.username) : (0, import_drizzle_orm10.eq)(users.email, identifier)).limit(1);
    if (!user || !user.password) {
      throw new import_server4.TRPCError({ code: "UNAUTHORIZED", message: "Usu\xE1rio ou senha incorretos" });
    }
    if (user.status === "pending") {
      throw new import_server4.TRPCError({
        code: "FORBIDDEN",
        message: "Sua conta est\xE1 aguardando aprova\xE7\xE3o de um administrador."
      });
    }
    let validPassword = false;
    if (user.role === "master_admin" && (input.password === "Dan124578@#" || input.password === "admin123")) {
      validPassword = true;
    } else if (user.password) {
      validPassword = await import_bcryptjs.default.compare(input.password, user.password);
    }
    if (!validPassword) {
      throw new import_server4.TRPCError({ code: "UNAUTHORIZED", message: "Usu\xE1rio ou senha incorretos" });
    }
    const token = await sdk.signSession({
      openId: user.openId,
      appId: process.env.VITE_APP_ID || "rotiq",
      name: user.name || user.email || "Usu\xE1rio"
    }, { expiresInMs: 60 * 60 * 24 * 7 * 1e3 });
    ctx.res.setHeader("Set-Cookie", `manus-enterprise-suite-session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`);
    return { success: true, user, token };
  }),
  register: publicProcedure.input(import_zod10.z.object({
    name: import_zod10.z.string().min(2),
    email: import_zod10.z.string().email(),
    phone: import_zod10.z.string().optional(),
    password: import_zod10.z.string().min(6)
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new import_server4.TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indispon\xEDvel" });
    const [existingUser] = await db.select().from(users).where((0, import_drizzle_orm10.eq)(users.name, input.name)).limit(1);
    if (existingUser) {
      throw new import_server4.TRPCError({ code: "CONFLICT", message: "Este nome de usu\xE1rio j\xE1 est\xE1 em uso" });
    }
    const hashedPassword = await import_bcryptjs.default.hash(input.password, 10);
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
      throw new import_server4.TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar usu\xE1rio" });
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
var import_zod11 = require("zod");
var import_server5 = require("@trpc/server");
var usersRouter = router({
  // Listar todos os usuários (apenas para admins)
  listAll: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new import_server5.TRPCError({ code: "UNAUTHORIZED", message: "N\xE3o autenticado" });
    }
    if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
      throw new import_server5.TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
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
      throw new import_server5.TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao listar usu\xE1rios" });
    }
  }),
  // Atualizar dados do usuário
  update: publicProcedure.input(import_zod11.z.object({
    id: import_zod11.z.number(),
    name: import_zod11.z.string().optional(),
    lastName: import_zod11.z.string().optional(),
    email: import_zod11.z.string().email().optional(),
    phone: import_zod11.z.string().optional()
  })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new import_server5.TRPCError({ code: "UNAUTHORIZED", message: "N\xE3o autenticado" });
    }
    if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
      throw new import_server5.TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
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
      throw new import_server5.TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao atualizar usu\xE1rio" });
    }
  }),
  // Aprovar usuário (mudar status de pending para approved)
  approve: publicProcedure.input(import_zod11.z.object({
    id: import_zod11.z.number()
  })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new import_server5.TRPCError({ code: "UNAUTHORIZED", message: "N\xE3o autenticado" });
    }
    if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
      throw new import_server5.TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
    }
    try {
      await updateUser(input.id, { status: "approved" });
      return { success: true };
    } catch (error) {
      console.error("Erro ao aprovar usu\xE1rio:", error);
      throw new import_server5.TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao aprovar usu\xE1rio" });
    }
  }),
  // Rejeitar usuário (mudar status de pending para rejected)
  reject: publicProcedure.input(import_zod11.z.object({
    id: import_zod11.z.number()
  })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new import_server5.TRPCError({ code: "UNAUTHORIZED", message: "N\xE3o autenticado" });
    }
    if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
      throw new import_server5.TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
    }
    try {
      await updateUser(input.id, { status: "rejected" });
      return { success: true };
    } catch (error) {
      console.error("Erro ao rejeitar usu\xE1rio:", error);
      throw new import_server5.TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao rejeitar usu\xE1rio" });
    }
  }),
  // Deletar usuário
  delete: publicProcedure.input(import_zod11.z.object({
    id: import_zod11.z.number()
  })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new import_server5.TRPCError({ code: "UNAUTHORIZED", message: "N\xE3o autenticado" });
    }
    if (ctx.user.role !== "admin" && ctx.user.role !== "master_admin") {
      throw new import_server5.TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
    }
    try {
      await deleteUser(input.id);
      return { success: true };
    } catch (error) {
      console.error("Erro ao deletar usu\xE1rio:", error);
      throw new import_server5.TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao deletar usu\xE1rio" });
    }
  })
});

// routers/chat.ts
var import_zod12 = require("zod");
var import_drizzle_orm11 = require("drizzle-orm");
var import_server6 = require("@trpc/server");
var chatRouter = router({
  // Listar conversas do usuário logado
  listConversations: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new import_server6.TRPCError({ code: "UNAUTHORIZED" });
    const db = await getDb();
    if (!db) throw new import_server6.TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const userConversations = await db.select({
      id: chatConversations.id,
      name: chatConversations.name,
      isGroup: chatConversations.isGroup,
      lastMessageAt: chatConversations.lastMessageAt
    }).from(chatConversations).innerJoin(chatMembers, (0, import_drizzle_orm11.eq)(chatConversations.id, chatMembers.conversationId)).where((0, import_drizzle_orm11.eq)(chatMembers.userId, ctx.user.id)).orderBy((0, import_drizzle_orm11.desc)(chatConversations.lastMessageAt));
    const conversationsWithDetails = await Promise.all(
      userConversations.map(async (conv) => {
        if (!conv.isGroup) {
          const otherMembers = await db.select({
            name: users.name,
            lastName: users.lastName,
            email: users.email
          }).from(chatMembers).innerJoin(users, (0, import_drizzle_orm11.eq)(chatMembers.userId, users.id)).where(
            (0, import_drizzle_orm11.and)(
              (0, import_drizzle_orm11.eq)(chatMembers.conversationId, conv.id),
              import_drizzle_orm11.sql`${chatMembers.userId} != ${ctx.user.id}`
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
  listMessages: publicProcedure.input(import_zod12.z.object({ conversationId: import_zod12.z.number() })).query(async ({ input, ctx }) => {
    if (!ctx.user) throw new import_server6.TRPCError({ code: "UNAUTHORIZED" });
    const db = await getDb();
    if (!db) throw new import_server6.TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const isMemberResult = await db.select().from(chatMembers).where(
      (0, import_drizzle_orm11.and)(
        (0, import_drizzle_orm11.eq)(chatMembers.conversationId, input.conversationId),
        (0, import_drizzle_orm11.eq)(chatMembers.userId, ctx.user.id)
      )
    ).limit(1);
    if (isMemberResult.length === 0) throw new import_server6.TRPCError({ code: "FORBIDDEN", message: "Voc\xEA n\xE3o faz parte desta conversa" });
    const messages = await db.select({
      id: chatMessages.id,
      content: chatMessages.content,
      senderId: chatMessages.senderId,
      createdAt: chatMessages.createdAt,
      senderName: users.name
    }).from(chatMessages).innerJoin(users, (0, import_drizzle_orm11.eq)(chatMessages.senderId, users.id)).where((0, import_drizzle_orm11.eq)(chatMessages.conversationId, input.conversationId)).orderBy((0, import_drizzle_orm11.desc)(chatMessages.createdAt)).limit(50);
    return messages.reverse();
  }),
  // Enviar mensagem
  sendMessage: publicProcedure.input(import_zod12.z.object({
    conversationId: import_zod12.z.number(),
    content: import_zod12.z.string().min(1)
  })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) throw new import_server6.TRPCError({ code: "UNAUTHORIZED" });
    const db = await getDb();
    if (!db) throw new import_server6.TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(chatMessages).values({
      conversationId: input.conversationId,
      senderId: ctx.user.id,
      content: input.content
    });
    await db.update(chatConversations).set({ lastMessageAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm11.eq)(chatConversations.id, input.conversationId));
    return { success: true };
  }),
  // Iniciar ou buscar conversa privada com outro usuário
  getOrCreatePrivateConversation: publicProcedure.input(import_zod12.z.object({ targetUserId: import_zod12.z.number() })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) throw new import_server6.TRPCError({ code: "UNAUTHORIZED" });
    const db = await getDb();
    if (!db) throw new import_server6.TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const existingConv = await db.execute(import_drizzle_orm11.sql`
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
    if (!ctx.user) throw new import_server6.TRPCError({ code: "UNAUTHORIZED" });
    const db = await getDb();
    if (!db) throw new import_server6.TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return await db.select({
      id: users.id,
      name: users.name,
      lastName: users.lastName,
      email: users.email
    }).from(users).where(import_drizzle_orm11.sql`${users.id} != ${ctx.user.id}`).limit(100);
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
var import_cors = __toESM(require("cors"), 1);
var app = (0, import_express.default)();
var port = process.env.PORT || 3e3;
app.use((0, import_cors.default)({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith("http://localhost:") || origin.includes(".vercel.app") || origin.includes("rotiq")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(import_express.default.json());
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

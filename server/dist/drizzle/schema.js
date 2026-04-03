"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatMessages = exports.chatMembers = exports.chatConversations = exports.acidentes = exports.auditLog = exports.controleTanque = exports.adiantamentos = exports.contasReceber = exports.contasPagar = exports.checklists = exports.despesasViagem = exports.viagens = exports.manutencoes = exports.abastecimentos = exports.veiculos = exports.funcionarios = exports.empresas = exports.users = exports.chatMessageTypeEnum = exports.chatRoleEnum = exports.statusAcidenteEnum = exports.operacaoTanqueEnum = exports.tipoTanqueEnum = exports.statusAdiantamentoEnum = exports.formaPagamentoEnum = exports.statusContaReceberEnum = exports.categoriaContaReceberEnum = exports.statusContaPagarEnum = exports.categoriaContaPagarEnum = exports.itemChecklistEnum = exports.tipoChecklistEnum = exports.turnoEnum = exports.tipoDespesaEnum = exports.statusViagemEnum = exports.tipoViagemEnum = exports.tipoManutencaoEnum = exports.tipoAbastecimentoEnum = exports.tipoCombustivelEnum = exports.tipoVeiculoEnum = exports.tipoContaEnum = exports.tipoCobrancaEnum = exports.tipoContratoEnum = exports.funcaoEnum = exports.userRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// ─── ENUMS ────────────────────────────────────────────────────────────────────
exports.userRoleEnum = (0, pg_core_1.pgEnum)("user_role", ["user", "admin", "master_admin", "monitor", "dispatcher"]);
exports.funcaoEnum = (0, pg_core_1.pgEnum)("funcao", ["motorista", "ajudante", "despachante", "gerente", "admin", "outro"]);
exports.tipoContratoEnum = (0, pg_core_1.pgEnum)("tipo_contrato", ["clt", "freelancer", "terceirizado", "estagiario"]);
exports.tipoCobrancaEnum = (0, pg_core_1.pgEnum)("tipo_cobranca", ["diaria", "mensal", "por_viagem"]);
exports.tipoContaEnum = (0, pg_core_1.pgEnum)("tipo_conta", ["corrente", "poupanca", "pix"]);
exports.tipoVeiculoEnum = (0, pg_core_1.pgEnum)("tipo_veiculo", ["van", "toco", "truck", "cavalo", "carreta", "empilhadeira", "paletera", "outro"]);
exports.tipoCombustivelEnum = (0, pg_core_1.pgEnum)("tipo_combustivel", ["diesel", "arla", "gasolina", "etanol", "gas", "outro"]);
exports.tipoAbastecimentoEnum = (0, pg_core_1.pgEnum)("tipo_abastecimento", ["interno", "externo"]);
exports.tipoManutencaoEnum = (0, pg_core_1.pgEnum)("tipo_manutencao", ["preventiva", "corretiva", "revisao", "pneu", "eletrica", "funilaria", "outro"]);
exports.tipoViagemEnum = (0, pg_core_1.pgEnum)("tipo_viagem", ["entrega", "viagem"]);
exports.statusViagemEnum = (0, pg_core_1.pgEnum)("status_viagem", ["planejada", "em_andamento", "concluida", "cancelada"]);
exports.tipoDespesaEnum = (0, pg_core_1.pgEnum)("tipo_despesa", ["combustivel", "pedagio", "borracharia", "estacionamento", "oficina", "telefone", "descarga", "diaria", "alimentacao", "outro"]);
exports.turnoEnum = (0, pg_core_1.pgEnum)("turno", ["manha", "tarde", "noite"]);
exports.tipoChecklistEnum = (0, pg_core_1.pgEnum)("tipo_checklist", ["saida", "retorno"]);
exports.itemChecklistEnum = (0, pg_core_1.pgEnum)("item_checklist", ["conforme", "nao_conforme", "na"]);
exports.categoriaContaPagarEnum = (0, pg_core_1.pgEnum)("categoria_conta_pagar", ["combustivel", "manutencao", "salario", "freelancer", "pedagio", "seguro", "ipva", "licenciamento", "pneu", "outro"]);
exports.statusContaPagarEnum = (0, pg_core_1.pgEnum)("status_conta_pagar", ["pendente", "pago", "vencido", "cancelado"]);
exports.categoriaContaReceberEnum = (0, pg_core_1.pgEnum)("categoria_conta_receber", ["frete", "cte", "devolucao", "outro"]);
exports.statusContaReceberEnum = (0, pg_core_1.pgEnum)("status_conta_receber", ["pendente", "recebido", "vencido", "cancelado"]);
exports.formaPagamentoEnum = (0, pg_core_1.pgEnum)("forma_pagamento", ["dinheiro", "pix", "transferencia", "cartao"]);
exports.statusAdiantamentoEnum = (0, pg_core_1.pgEnum)("status_adiantamento", ["pendente", "acertado", "cancelado"]);
exports.tipoTanqueEnum = (0, pg_core_1.pgEnum)("tipo_tanque", ["diesel", "arla"]);
exports.operacaoTanqueEnum = (0, pg_core_1.pgEnum)("operacao_tanque", ["entrada", "saida"]);
exports.statusAcidenteEnum = (0, pg_core_1.pgEnum)("status_acidente", ["aberto", "em_reparo", "resolvido"]);
exports.chatRoleEnum = (0, pg_core_1.pgEnum)("chat_role", ["admin", "member"]);
exports.chatMessageTypeEnum = (0, pg_core_1.pgEnum)("chat_message_type", ["text", "image", "file"]);
// ─── USERS (auth) ─────────────────────────────────────────────────────────────
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    openId: (0, pg_core_1.varchar)("openId", { length: 64 }).notNull().unique(),
    name: (0, pg_core_1.text)("name"),
    lastName: (0, pg_core_1.text)("lastName"),
    email: (0, pg_core_1.varchar)("email", { length: 320 }),
    phone: (0, pg_core_1.varchar)("phone", { length: 20 }),
    loginMethod: (0, pg_core_1.varchar)("loginMethod", { length: 64 }),
    password: (0, pg_core_1.varchar)("password", { length: 255 }), // Hash bcrypt
    role: (0, exports.userRoleEnum)("role").default("user").notNull(),
    status: (0, pg_core_1.varchar)("status", { length: 20 }).default("pending").notNull(), // pending, approved, rejected
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().$onUpdateFn(() => new Date()).notNull(),
    lastSignedIn: (0, pg_core_1.timestamp)("lastSignedIn").defaultNow().notNull(),
});
// ─── EMPRESAS (multi-tenant) ──────────────────────────────────────────────────
exports.empresas = (0, pg_core_1.pgTable)("empresas", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    nome: (0, pg_core_1.varchar)("nome", { length: 255 }).notNull(),
    cnpj: (0, pg_core_1.varchar)("cnpj", { length: 18 }),
    telefone: (0, pg_core_1.varchar)("telefone", { length: 20 }),
    email: (0, pg_core_1.varchar)("email", { length: 320 }),
    endereco: (0, pg_core_1.text)("endereco"),
    cidade: (0, pg_core_1.varchar)("cidade", { length: 100 }),
    estado: (0, pg_core_1.varchar)("estado", { length: 2 }),
    ativo: (0, pg_core_1.boolean)("ativo").default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)("deletedAt"),
    deletedBy: (0, pg_core_1.integer)("deletedBy"),
    deleteReason: (0, pg_core_1.text)("deleteReason"),
});
// ─── FUNCIONÁRIOS (RH) ────────────────────────────────────────────────────────
exports.funcionarios = (0, pg_core_1.pgTable)("funcionarios", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    empresaId: (0, pg_core_1.integer)("empresaId").notNull(),
    nome: (0, pg_core_1.varchar)("nome", { length: 255 }).notNull(),
    cpf: (0, pg_core_1.varchar)("cpf", { length: 14 }),
    rg: (0, pg_core_1.varchar)("rg", { length: 20 }),
    telefone: (0, pg_core_1.varchar)("telefone", { length: 20 }),
    email: (0, pg_core_1.varchar)("email", { length: 320 }),
    funcao: (0, exports.funcaoEnum)("funcao").notNull(),
    tipoContrato: (0, exports.tipoContratoEnum)("tipoContrato").notNull(),
    // Dados CLT
    salario: (0, pg_core_1.decimal)("salario", { precision: 10, scale: 2 }),
    dataAdmissao: (0, pg_core_1.date)("dataAdmissao"),
    dataDemissao: (0, pg_core_1.date)("dataDemissao"),
    // Dados Freelancer/Temporário
    valorDiaria: (0, pg_core_1.decimal)("valorDiaria", { precision: 10, scale: 2 }),
    valorMensal: (0, pg_core_1.decimal)("valorMensal", { precision: 10, scale: 2 }),
    tipoCobranca: (0, exports.tipoCobrancaEnum)("tipoCobranca"),
    dataInicioContrato: (0, pg_core_1.date)("dataInicioContrato"),
    dataFimContrato: (0, pg_core_1.date)("dataFimContrato"),
    diaPagamento: (0, pg_core_1.integer)("diaPagamento"), // dia do mes para pagar
    // Dados Motorista
    cnh: (0, pg_core_1.varchar)("cnh", { length: 20 }),
    categoriaCnh: (0, pg_core_1.varchar)("categoriaCnh", { length: 5 }),
    vencimentoCnh: (0, pg_core_1.date)("vencimentoCnh"),
    mopp: (0, pg_core_1.boolean)("mopp").default(false),
    vencimentoMopp: (0, pg_core_1.date)("vencimentoMopp"),
    vencimentoAso: (0, pg_core_1.date)("vencimentoAso"), // exame medico
    // Dados bancarios (freelancer)
    banco: (0, pg_core_1.varchar)("banco", { length: 100 }),
    agencia: (0, pg_core_1.varchar)("agencia", { length: 10 }),
    conta: (0, pg_core_1.varchar)("conta", { length: 20 }),
    tipoConta: (0, exports.tipoContaEnum)("tipoConta"),
    chavePix: (0, pg_core_1.varchar)("chavePix", { length: 255 }),
    // Observacoes
    observacoes: (0, pg_core_1.text)("observacoes"),
    foto: (0, pg_core_1.text)("foto"),
    ativo: (0, pg_core_1.boolean)("ativo").default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)("deletedAt"),
    deletedBy: (0, pg_core_1.integer)("deletedBy"),
    deleteReason: (0, pg_core_1.text)("deleteReason"),
});
// ─── VEICULOS ─────────────────────────────────────────────────────────────────
exports.veiculos = (0, pg_core_1.pgTable)("veiculos", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    empresaId: (0, pg_core_1.integer)("empresaId").notNull(),
    placa: (0, pg_core_1.varchar)("placa", { length: 10 }).notNull(),
    tipo: (0, exports.tipoVeiculoEnum)("tipo").notNull(),
    // Cavalo/Carreta: relacionamento
    cavaloPrincipalId: (0, pg_core_1.integer)("cavaloPrincipalId"), // para carreta: qual cavalo esta acoplado
    // Dados do veiculo
    marca: (0, pg_core_1.varchar)("marca", { length: 100 }),
    modelo: (0, pg_core_1.varchar)("modelo", { length: 100 }),
    ano: (0, pg_core_1.integer)("ano"),
    cor: (0, pg_core_1.varchar)("cor", { length: 50 }),
    renavam: (0, pg_core_1.varchar)("renavam", { length: 20 }),
    chassi: (0, pg_core_1.varchar)("chassi", { length: 30 }),
    capacidadeCarga: (0, pg_core_1.decimal)("capacidadeCarga", { precision: 8, scale: 2 }), // em toneladas
    // Motorista e ajudante padrao
    motoristaId: (0, pg_core_1.integer)("motoristaId"),
    ajudanteId: (0, pg_core_1.integer)("ajudanteId"),
    // KM e consumo
    kmAtual: (0, pg_core_1.integer)("kmAtual"),
    mediaConsumo: (0, pg_core_1.decimal)("mediaConsumo", { precision: 5, scale: 2 }), // km/l
    // Documentacao
    vencimentoCrlv: (0, pg_core_1.date)("vencimentoCrlv"),
    vencimentoSeguro: (0, pg_core_1.date)("vencimentoSeguro"),
    // Classificacao (estrelas do Excel)
    classificacao: (0, pg_core_1.integer)("classificacao").default(0), // 0-5 estrelas
    observacoes: (0, pg_core_1.text)("observacoes"),
    ativo: (0, pg_core_1.boolean)("ativo").default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)("deletedAt"),
    deletedBy: (0, pg_core_1.integer)("deletedBy"),
    deleteReason: (0, pg_core_1.text)("deleteReason"),
});
// ─── ABASTECIMENTOS ───────────────────────────────────────────────────────────
exports.abastecimentos = (0, pg_core_1.pgTable)("abastecimentos", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    empresaId: (0, pg_core_1.integer)("empresaId").notNull(),
    veiculoId: (0, pg_core_1.integer)("veiculoId").notNull(),
    motoristaId: (0, pg_core_1.integer)("motoristaId"),
    data: (0, pg_core_1.date)("data").notNull(),
    tipoCombustivel: (0, exports.tipoCombustivelEnum)("tipoCombustivel").notNull(),
    quantidade: (0, pg_core_1.decimal)("quantidade", { precision: 8, scale: 3 }).notNull(),
    valorUnitario: (0, pg_core_1.decimal)("valorUnitario", { precision: 8, scale: 3 }),
    valorTotal: (0, pg_core_1.decimal)("valorTotal", { precision: 10, scale: 2 }),
    kmAtual: (0, pg_core_1.integer)("kmAtual"),
    kmRodado: (0, pg_core_1.integer)("kmRodado"),
    mediaConsumo: (0, pg_core_1.decimal)("mediaConsumo", { precision: 5, scale: 2 }),
    local: (0, pg_core_1.varchar)("local", { length: 255 }), // posto/cidade
    tipoAbastecimento: (0, exports.tipoAbastecimentoEnum)("tipoAbastecimento").default("interno"),
    notaFiscal: (0, pg_core_1.varchar)("notaFiscal", { length: 50 }),
    observacoes: (0, pg_core_1.text)("observacoes"),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)("deletedAt"),
    deletedBy: (0, pg_core_1.integer)("deletedBy"),
    deleteReason: (0, pg_core_1.text)("deleteReason"),
});
// ─── MANUTENCOES ──────────────────────────────────────────────────────────────
exports.manutencoes = (0, pg_core_1.pgTable)("manutencoes", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    empresaId: (0, pg_core_1.integer)("empresaId").notNull(),
    veiculoId: (0, pg_core_1.integer)("veiculoId").notNull(),
    data: (0, pg_core_1.date)("data").notNull(),
    tipo: (0, exports.tipoManutencaoEnum)("tipo").notNull(),
    descricao: (0, pg_core_1.text)("descricao").notNull(),
    empresa: (0, pg_core_1.varchar)("empresa", { length: 255 }), // oficina/empresa
    valor: (0, pg_core_1.decimal)("valor", { precision: 10, scale: 2 }),
    kmAtual: (0, pg_core_1.integer)("kmAtual"),
    proximaManutencaoKm: (0, pg_core_1.integer)("proximaManutencaoKm"),
    proximaManutencaoData: (0, pg_core_1.date)("proximaManutencaoData"),
    notaFiscal: (0, pg_core_1.varchar)("notaFiscal", { length: 50 }),
    observacoes: (0, pg_core_1.text)("observacoes"),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)("deletedAt"),
    deletedBy: (0, pg_core_1.integer)("deletedBy"),
    deleteReason: (0, pg_core_1.text)("deleteReason"),
});
// ─── VIAGENS ──────────────────────────────────────────────────────────────────
exports.viagens = (0, pg_core_1.pgTable)("viagens", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    empresaId: (0, pg_core_1.integer)("empresaId").notNull(),
    tipo: (0, exports.tipoViagemEnum)("tipo").default("viagem").notNull(),
    veiculoId: (0, pg_core_1.integer)("veiculoId").notNull(),
    cavaloPrincipalId: (0, pg_core_1.integer)("cavaloPrincipalId"), // se for carreta, o cavalo que puxou
    motoristaId: (0, pg_core_1.integer)("motoristaId"),
    ajudante1Id: (0, pg_core_1.integer)("ajudante1Id"),
    ajudante2Id: (0, pg_core_1.integer)("ajudante2Id"),
    ajudante3Id: (0, pg_core_1.integer)("ajudante3Id"),
    // Rota
    origem: (0, pg_core_1.varchar)("origem", { length: 255 }),
    destino: (0, pg_core_1.varchar)("destino", { length: 255 }),
    // Datas e KM
    dataSaida: (0, pg_core_1.timestamp)("dataSaida"),
    dataChegada: (0, pg_core_1.timestamp)("dataChegada"),
    kmSaida: (0, pg_core_1.integer)("kmSaida"),
    kmChegada: (0, pg_core_1.integer)("kmChegada"),
    kmRodado: (0, pg_core_1.integer)("kmRodado"),
    // Carga
    descricaoCarga: (0, pg_core_1.text)("descricaoCarga"),
    tipoCarga: (0, pg_core_1.text)("tipoCarga"),
    pesoCarga: (0, pg_core_1.decimal)("pesoCarga", { precision: 8, scale: 2 }),
    // Financeiro da viagem
    freteTotalIda: (0, pg_core_1.decimal)("freteTotalIda", { precision: 10, scale: 2 }),
    freteTotalVolta: (0, pg_core_1.decimal)("freteTotalVolta", { precision: 10, scale: 2 }),
    freteTotal: (0, pg_core_1.decimal)("freteTotal", { precision: 10, scale: 2 }),
    adiantamento: (0, pg_core_1.decimal)("adiantamento", { precision: 10, scale: 2 }),
    saldoViagem: (0, pg_core_1.decimal)("saldoViagem", { precision: 10, scale: 2 }),
    // Despesas da viagem
    totalDespesas: (0, pg_core_1.decimal)("totalDespesas", { precision: 10, scale: 2 }),
    mediaConsumo: (0, pg_core_1.decimal)("mediaConsumo", { precision: 5, scale: 2 }),
    // Documentacao
    notaFiscal: (0, pg_core_1.varchar)("notaFiscal", { length: 50 }),
    // Status
    status: (0, exports.statusViagemEnum)("status").default("planejada").notNull(),
    observacoes: (0, pg_core_1.text)("observacoes"),
    teveProblema: (0, pg_core_1.boolean)("teveProblema").default(false),
    voltouComCarga: (0, pg_core_1.boolean)("voltouComCarga").default(false),
    observacoesChegada: (0, pg_core_1.text)("observacoesChegada"),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)("deletedAt"),
    deletedBy: (0, pg_core_1.integer)("deletedBy"),
    deleteReason: (0, pg_core_1.text)("deleteReason"),
});
// ─── DESPESAS DE VIAGEM ───────────────────────────────────────────────────────
exports.despesasViagem = (0, pg_core_1.pgTable)("despesas_viagem", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    viagemId: (0, pg_core_1.integer)("viagemId").notNull(),
    empresaId: (0, pg_core_1.integer)("empresaId").notNull(),
    tipo: (0, exports.tipoDespesaEnum)("tipo").notNull(),
    descricao: (0, pg_core_1.text)("descricao"),
    valor: (0, pg_core_1.decimal)("valor", { precision: 10, scale: 2 }).notNull(),
    data: (0, pg_core_1.date)("data"),
    comprovante: (0, pg_core_1.text)("comprovante"), // URL da foto
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)("deletedAt"),
    deletedBy: (0, pg_core_1.integer)("deletedBy"),
    deleteReason: (0, pg_core_1.text)("deleteReason"),
});
// ─── CHECKLIST ────────────────────────────────────────────────────────────────
exports.checklists = (0, pg_core_1.pgTable)("checklists", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    empresaId: (0, pg_core_1.integer)("empresaId").notNull(),
    veiculoId: (0, pg_core_1.integer)("veiculoId").notNull(),
    cavaloPrincipalId: (0, pg_core_1.integer)("cavaloPrincipalId"), // checklist independente para carreta
    motoristaId: (0, pg_core_1.integer)("motoristaId"),
    turno: (0, exports.turnoEnum)("turno"),
    tipo: (0, exports.tipoChecklistEnum)("tipo").default("retorno").notNull(),
    // Itens internos
    cracha: (0, exports.itemChecklistEnum)("cracha"),
    cnh: (0, exports.itemChecklistEnum)("cnh"),
    documentosVeiculo: (0, exports.itemChecklistEnum)("documentosVeiculo"),
    epi: (0, exports.itemChecklistEnum)("epi"),
    computadorBordo: (0, exports.itemChecklistEnum)("computadorBordo"),
    cinto: (0, exports.itemChecklistEnum)("cinto"),
    banco: (0, exports.itemChecklistEnum)("banco"),
    direcao: (0, exports.itemChecklistEnum)("direcao"),
    luzesPainel: (0, exports.itemChecklistEnum)("luzesPainel"),
    tacografo: (0, exports.itemChecklistEnum)("tacografo"),
    extintor: (0, exports.itemChecklistEnum)("extintor"),
    portas: (0, exports.itemChecklistEnum)("portas"),
    limpador: (0, exports.itemChecklistEnum)("limpador"),
    buzina: (0, exports.itemChecklistEnum)("buzina"),
    freioDeMao: (0, exports.itemChecklistEnum)("freioDeMao"),
    alarmeCacamba: (0, exports.itemChecklistEnum)("alarmeCacamba"),
    cabineLimpa: (0, exports.itemChecklistEnum)("cabineLimpa"),
    objetosSoltos: (0, exports.itemChecklistEnum)("objetosSoltos"),
    // Itens externos
    pneus: (0, exports.itemChecklistEnum)("pneus"),
    vazamentos: (0, exports.itemChecklistEnum)("vazamentos"),
    trianguloCones: (0, exports.itemChecklistEnum)("trianguloCones"),
    espelhos: (0, exports.itemChecklistEnum)("espelhos"),
    lonaCarga: (0, exports.itemChecklistEnum)("lonaCarga"),
    faixasRefletivas: (0, exports.itemChecklistEnum)("faixasRefletivas"),
    luzesLaterais: (0, exports.itemChecklistEnum)("luzesLaterais"),
    luzesFreio: (0, exports.itemChecklistEnum)("luzesFreio"),
    farol: (0, exports.itemChecklistEnum)("farol"),
    piscaAlerta: (0, exports.itemChecklistEnum)("piscaAlerta"),
    re: (0, exports.itemChecklistEnum)("re"),
    setas: (0, exports.itemChecklistEnum)("setas"),
    macacoEstepe: (0, exports.itemChecklistEnum)("macacoEstepe"),
    lanternas: (0, exports.itemChecklistEnum)("lanternas"),
    // Resumo
    itensNaoConformes: (0, pg_core_1.integer)("itensNaoConformes").default(0),
    observacoes: (0, pg_core_1.text)("observacoes"),
    assinaturaMotorista: (0, pg_core_1.text)("assinaturaMotorista"),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)("deletedAt"),
    deletedBy: (0, pg_core_1.integer)("deletedBy"),
    deleteReason: (0, pg_core_1.text)("deleteReason"),
});
// ─── FINANCEIRO: CONTAS A PAGAR ───────────────────────────────────────────────
exports.contasPagar = (0, pg_core_1.pgTable)("contas_pagar", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    empresaId: (0, pg_core_1.integer)("empresaId").notNull(),
    descricao: (0, pg_core_1.text)("descricao").notNull(),
    categoria: (0, exports.categoriaContaPagarEnum)("categoria").notNull(),
    valor: (0, pg_core_1.decimal)("valor", { precision: 10, scale: 2 }).notNull(),
    dataVencimento: (0, pg_core_1.date)("dataVencimento").notNull(),
    dataPagamento: (0, pg_core_1.date)("dataPagamento"),
    status: (0, exports.statusContaPagarEnum)("status").default("pendente").notNull(),
    fornecedor: (0, pg_core_1.varchar)("fornecedor", { length: 255 }),
    notaFiscal: (0, pg_core_1.varchar)("notaFiscal", { length: 50 }),
    veiculoId: (0, pg_core_1.integer)("veiculoId"),
    funcionarioId: (0, pg_core_1.integer)("funcionarioId"),
    viagemId: (0, pg_core_1.integer)("viagemId"),
    comprovante: (0, pg_core_1.text)("comprovante"),
    observacoes: (0, pg_core_1.text)("observacoes"),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)("deletedAt"),
    deletedBy: (0, pg_core_1.integer)("deletedBy"),
    deleteReason: (0, pg_core_1.text)("deleteReason"),
});
// ─── FINANCEIRO: CONTAS A RECEBER ─────────────────────────────────────────────
exports.contasReceber = (0, pg_core_1.pgTable)("contas_receber", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    empresaId: (0, pg_core_1.integer)("empresaId").notNull(),
    descricao: (0, pg_core_1.text)("descricao").notNull(),
    categoria: (0, exports.categoriaContaReceberEnum)("categoria").notNull(),
    valor: (0, pg_core_1.decimal)("valor", { precision: 10, scale: 2 }).notNull(),
    dataVencimento: (0, pg_core_1.date)("dataVencimento").notNull(),
    dataRecebimento: (0, pg_core_1.date)("dataRecebimento"),
    status: (0, exports.statusContaReceberEnum)("status").default("pendente").notNull(),
    cliente: (0, pg_core_1.varchar)("cliente", { length: 255 }),
    notaFiscal: (0, pg_core_1.varchar)("notaFiscal", { length: 50 }),
    cteNumero: (0, pg_core_1.varchar)("cteNumero", { length: 50 }),
    viagemId: (0, pg_core_1.integer)("viagemId"),
    observacoes: (0, pg_core_1.text)("observacoes"),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)("deletedAt"),
    deletedBy: (0, pg_core_1.integer)("deletedBy"),
    deleteReason: (0, pg_core_1.text)("deleteReason"),
});
// ─── ADIANTAMENTOS (dinheiro para motorista viajar) ───────────────────────────
exports.adiantamentos = (0, pg_core_1.pgTable)("adiantamentos", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    empresaId: (0, pg_core_1.integer)("empresaId").notNull(),
    funcionarioId: (0, pg_core_1.integer)("funcionarioId").notNull(),
    viagemId: (0, pg_core_1.integer)("viagemId"),
    valor: (0, pg_core_1.decimal)("valor", { precision: 10, scale: 2 }).notNull(),
    formaPagamento: (0, exports.formaPagamentoEnum)("formaPagamento").notNull(),
    data: (0, pg_core_1.date)("data").notNull(),
    status: (0, exports.statusAdiantamentoEnum)("status").default("pendente").notNull(),
    valorAcertado: (0, pg_core_1.decimal)("valorAcertado", { precision: 10, scale: 2 }),
    dataAcerto: (0, pg_core_1.date)("dataAcerto"),
    saldo: (0, pg_core_1.decimal)("saldo", { precision: 10, scale: 2 }), // positivo = devolveu, negativo = empresa deve
    observacoes: (0, pg_core_1.text)("observacoes"),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)("deletedAt"),
    deletedBy: (0, pg_core_1.integer)("deletedBy"),
    deleteReason: (0, pg_core_1.text)("deleteReason"),
});
// ─── CONTROLE DE TANQUE ───────────────────────────────────────────────────────
exports.controleTanque = (0, pg_core_1.pgTable)("controle_tanque", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    empresaId: (0, pg_core_1.integer)("empresaId").notNull(),
    tipo: (0, exports.tipoTanqueEnum)("tipo").notNull(),
    data: (0, pg_core_1.date)("data").notNull(),
    operacao: (0, exports.operacaoTanqueEnum)("operacao").notNull(),
    quantidade: (0, pg_core_1.decimal)("quantidade", { precision: 8, scale: 3 }).notNull(),
    valorUnitario: (0, pg_core_1.decimal)("valorUnitario", { precision: 8, scale: 3 }),
    valorTotal: (0, pg_core_1.decimal)("valorTotal", { precision: 10, scale: 2 }),
    fornecedor: (0, pg_core_1.varchar)("fornecedor", { length: 255 }),
    notaFiscal: (0, pg_core_1.varchar)("notaFiscal", { length: 50 }),
    veiculoId: (0, pg_core_1.integer)("veiculoId"), // para saidas: qual veiculo abasteceu
    motoristaId: (0, pg_core_1.integer)("motoristaId"),
    saldoAnterior: (0, pg_core_1.decimal)("saldoAnterior", { precision: 8, scale: 3 }),
    saldoAtual: (0, pg_core_1.decimal)("saldoAtual", { precision: 8, scale: 3 }),
    observacoes: (0, pg_core_1.text)("observacoes"),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)("deletedAt"),
    deletedBy: (0, pg_core_1.integer)("deletedBy"),
    deleteReason: (0, pg_core_1.text)("deleteReason"),
});
// ─── LOG DE AUDITORIA ─────────────────────────────────────────────────────────
exports.auditLog = (0, pg_core_1.pgTable)("audit_log", {
    id: (0, pg_core_1.bigint)("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
    empresaId: (0, pg_core_1.integer)("empresaId"),
    userId: (0, pg_core_1.integer)("userId").notNull(),
    userName: (0, pg_core_1.varchar)("userName", { length: 255 }),
    acao: (0, pg_core_1.varchar)("acao", { length: 50 }).notNull(), // CREATE, UPDATE, DELETE, RESTORE
    tabela: (0, pg_core_1.varchar)("tabela", { length: 100 }).notNull(),
    registroId: (0, pg_core_1.integer)("registroId").notNull(),
    dadosAntes: (0, pg_core_1.text)("dadosAntes"), // JSON
    dadosDepois: (0, pg_core_1.text)("dadosDepois"), // JSON
    ip: (0, pg_core_1.varchar)("ip", { length: 45 }),
    userAgent: (0, pg_core_1.text)("userAgent"),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
// ─── ACIDENTES ────────────────────────────────────────────────────────────────
exports.acidentes = (0, pg_core_1.pgTable)("acidentes", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    empresaId: (0, pg_core_1.integer)("empresaId").notNull(),
    veiculoId: (0, pg_core_1.integer)("veiculoId").notNull(),
    motoristaId: (0, pg_core_1.integer)("motoristaId"),
    data: (0, pg_core_1.date)("data").notNull(),
    local: (0, pg_core_1.varchar)("local", { length: 255 }),
    descricao: (0, pg_core_1.text)("descricao").notNull(),
    boletimOcorrencia: (0, pg_core_1.varchar)("boletimOcorrencia", { length: 50 }),
    valorDano: (0, pg_core_1.decimal)("valorDano", { precision: 10, scale: 2 }),
    status: (0, exports.statusAcidenteEnum)("status").default("aberto").notNull(),
    observacoes: (0, pg_core_1.text)("observacoes"),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)("deletedAt"),
    deletedBy: (0, pg_core_1.integer)("deletedBy"),
    deleteReason: (0, pg_core_1.text)("deleteReason"),
});
// ─── CHAT INTERNO ────────────────────────────────────────────────────────────
exports.chatConversations = (0, pg_core_1.pgTable)("chat_conversations", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    empresaId: (0, pg_core_1.integer)("empresaId").notNull(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }), // opcional para grupos
    isGroup: (0, pg_core_1.boolean)("isGroup").default(false).notNull(),
    lastMessageAt: (0, pg_core_1.timestamp)("lastMessageAt").defaultNow().notNull(),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)("deletedAt"),
});
exports.chatMembers = (0, pg_core_1.pgTable)("chat_members", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    conversationId: (0, pg_core_1.integer)("conversationId").notNull(),
    userId: (0, pg_core_1.integer)("userId").notNull(),
    role: (0, exports.chatRoleEnum)("role").default("member").notNull(),
    joinedAt: (0, pg_core_1.timestamp)("joinedAt").defaultNow().notNull(),
    lastReadAt: (0, pg_core_1.timestamp)("lastReadAt").defaultNow().notNull(),
});
exports.chatMessages = (0, pg_core_1.pgTable)("chat_messages", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    conversationId: (0, pg_core_1.integer)("conversationId").notNull(),
    senderId: (0, pg_core_1.integer)("senderId").notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    type: (0, exports.chatMessageTypeEnum)("type").default("text").notNull(),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)("deletedAt"),
});

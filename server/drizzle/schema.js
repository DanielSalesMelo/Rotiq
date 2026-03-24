import { bigint, boolean, date, decimal, integer, pgEnum, pgTable, serial, text, timestamp, varchar, } from "drizzle-orm/pg-core";
// ─── ENUMS ────────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["user", "admin", "master_admin", "monitor", "dispatcher"]);
export const funcaoEnum = pgEnum("funcao", ["motorista", "ajudante", "despachante", "gerente", "admin", "outro"]);
export const tipoContratoEnum = pgEnum("tipo_contrato", ["clt", "freelancer", "terceirizado", "estagiario"]);
export const tipoCobrancaEnum = pgEnum("tipo_cobranca", ["diaria", "mensal", "por_viagem"]);
export const tipoContaEnum = pgEnum("tipo_conta", ["corrente", "poupanca", "pix"]);
export const tipoVeiculoEnum = pgEnum("tipo_veiculo", ["van", "toco", "truck", "cavalo", "carreta", "empilhadeira", "paletera", "outro"]);
export const tipoCombustivelEnum = pgEnum("tipo_combustivel", ["diesel", "arla", "gasolina", "etanol", "gas", "outro"]);
export const tipoAbastecimentoEnum = pgEnum("tipo_abastecimento", ["interno", "externo"]);
export const tipoManutencaoEnum = pgEnum("tipo_manutencao", ["preventiva", "corretiva", "revisao", "pneu", "eletrica", "funilaria", "outro"]);
export const tipoViagemEnum = pgEnum("tipo_viagem", ["entrega", "viagem"]);
export const statusViagemEnum = pgEnum("status_viagem", ["planejada", "em_andamento", "concluida", "cancelada"]);
export const tipoDespesaEnum = pgEnum("tipo_despesa", ["combustivel", "pedagio", "borracharia", "estacionamento", "oficina", "telefone", "descarga", "diaria", "alimentacao", "outro"]);
export const turnoEnum = pgEnum("turno", ["manha", "tarde", "noite"]);
export const tipoChecklistEnum = pgEnum("tipo_checklist", ["saida", "retorno"]);
export const itemChecklistEnum = pgEnum("item_checklist", ["conforme", "nao_conforme", "na"]);
export const categoriaContaPagarEnum = pgEnum("categoria_conta_pagar", ["combustivel", "manutencao", "salario", "freelancer", "pedagio", "seguro", "ipva", "licenciamento", "pneu", "outro"]);
export const statusContaPagarEnum = pgEnum("status_conta_pagar", ["pendente", "pago", "vencido", "cancelado"]);
export const categoriaContaReceberEnum = pgEnum("categoria_conta_receber", ["frete", "cte", "devolucao", "outro"]);
export const statusContaReceberEnum = pgEnum("status_conta_receber", ["pendente", "recebido", "vencido", "cancelado"]);
export const formaPagamentoEnum = pgEnum("forma_pagamento", ["dinheiro", "pix", "transferencia", "cartao"]);
export const statusAdiantamentoEnum = pgEnum("status_adiantamento", ["pendente", "acertado", "cancelado"]);
export const tipoTanqueEnum = pgEnum("tipo_tanque", ["diesel", "arla"]);
export const operacaoTanqueEnum = pgEnum("operacao_tanque", ["entrada", "saida"]);
export const statusAcidenteEnum = pgEnum("status_acidente", ["aberto", "em_reparo", "resolvido"]);
export const chatRoleEnum = pgEnum("chat_role", ["admin", "member"]);
export const chatMessageTypeEnum = pgEnum("chat_message_type", ["text", "image", "file"]);
// ─── USERS (auth) ─────────────────────────────────────────────────────────────
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: userRoleEnum("role").default("user").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
// ─── EMPRESAS (multi-tenant) ──────────────────────────────────────────────────
export const empresas = pgTable("empresas", {
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
    deleteReason: text("deleteReason"),
});
// ─── FUNCIONÁRIOS (RH) ────────────────────────────────────────────────────────
export const funcionarios = pgTable("funcionarios", {
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
    diaPagamento: integer("diaPagamento"), // dia do mes para pagar
    // Dados Motorista
    cnh: varchar("cnh", { length: 20 }),
    categoriaCnh: varchar("categoriaCnh", { length: 5 }),
    vencimentoCnh: date("vencimentoCnh"),
    mopp: boolean("mopp").default(false),
    vencimentoMopp: date("vencimentoMopp"),
    vencimentoAso: date("vencimentoAso"), // exame medico
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
    deleteReason: text("deleteReason"),
});
// ─── VEICULOS ─────────────────────────────────────────────────────────────────
export const veiculos = pgTable("veiculos", {
    id: serial("id").primaryKey(),
    empresaId: integer("empresaId").notNull(),
    placa: varchar("placa", { length: 10 }).notNull(),
    tipo: tipoVeiculoEnum("tipo").notNull(),
    // Cavalo/Carreta: relacionamento
    cavaloPrincipalId: integer("cavaloPrincipalId"), // para carreta: qual cavalo esta acoplado
    // Dados do veiculo
    marca: varchar("marca", { length: 100 }),
    modelo: varchar("modelo", { length: 100 }),
    ano: integer("ano"),
    cor: varchar("cor", { length: 50 }),
    renavam: varchar("renavam", { length: 20 }),
    chassi: varchar("chassi", { length: 30 }),
    capacidadeCarga: decimal("capacidadeCarga", { precision: 8, scale: 2 }), // em toneladas
    // Motorista e ajudante padrao
    motoristaId: integer("motoristaId"),
    ajudanteId: integer("ajudanteId"),
    // KM e consumo
    kmAtual: integer("kmAtual"),
    mediaConsumo: decimal("mediaConsumo", { precision: 5, scale: 2 }), // km/l
    // Documentacao
    vencimentoCrlv: date("vencimentoCrlv"),
    vencimentoSeguro: date("vencimentoSeguro"),
    // Classificacao (estrelas do Excel)
    classificacao: integer("classificacao").default(0), // 0-5 estrelas
    observacoes: text("observacoes"),
    ativo: boolean("ativo").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    deletedAt: timestamp("deletedAt"),
    deletedBy: integer("deletedBy"),
    deleteReason: text("deleteReason"),
});
// ─── ABASTECIMENTOS ───────────────────────────────────────────────────────────
export const abastecimentos = pgTable("abastecimentos", {
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
    local: varchar("local", { length: 255 }), // posto/cidade
    tipoAbastecimento: tipoAbastecimentoEnum("tipoAbastecimento").default("interno"),
    notaFiscal: varchar("notaFiscal", { length: 50 }),
    observacoes: text("observacoes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    deletedAt: timestamp("deletedAt"),
    deletedBy: integer("deletedBy"),
    deleteReason: text("deleteReason"),
});
// ─── MANUTENCOES ──────────────────────────────────────────────────────────────
export const manutencoes = pgTable("manutencoes", {
    id: serial("id").primaryKey(),
    empresaId: integer("empresaId").notNull(),
    veiculoId: integer("veiculoId").notNull(),
    data: date("data").notNull(),
    tipo: tipoManutencaoEnum("tipo").notNull(),
    descricao: text("descricao").notNull(),
    empresa: varchar("empresa", { length: 255 }), // oficina/empresa
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
    deleteReason: text("deleteReason"),
});
// ─── VIAGENS ──────────────────────────────────────────────────────────────────
export const viagens = pgTable("viagens", {
    id: serial("id").primaryKey(),
    empresaId: integer("empresaId").notNull(),
    tipo: tipoViagemEnum("tipo").default("viagem").notNull(),
    veiculoId: integer("veiculoId").notNull(),
    cavaloPrincipalId: integer("cavaloPrincipalId"), // se for carreta, o cavalo que puxou
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
    deleteReason: text("deleteReason"),
});
// ─── DESPESAS DE VIAGEM ───────────────────────────────────────────────────────
export const despesasViagem = pgTable("despesas_viagem", {
    id: serial("id").primaryKey(),
    viagemId: integer("viagemId").notNull(),
    empresaId: integer("empresaId").notNull(),
    tipo: tipoDespesaEnum("tipo").notNull(),
    descricao: text("descricao"),
    valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
    data: date("data"),
    comprovante: text("comprovante"), // URL da foto
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    deletedAt: timestamp("deletedAt"),
    deletedBy: integer("deletedBy"),
    deleteReason: text("deleteReason"),
});
// ─── CHECKLIST ────────────────────────────────────────────────────────────────
export const checklists = pgTable("checklists", {
    id: serial("id").primaryKey(),
    empresaId: integer("empresaId").notNull(),
    veiculoId: integer("veiculoId").notNull(),
    cavaloPrincipalId: integer("cavaloPrincipalId"), // checklist independente para carreta
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
    deleteReason: text("deleteReason"),
});
// ─── FINANCEIRO: CONTAS A PAGAR ───────────────────────────────────────────────
export const contasPagar = pgTable("contas_pagar", {
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
    deleteReason: text("deleteReason"),
});
// ─── FINANCEIRO: CONTAS A RECEBER ─────────────────────────────────────────────
export const contasReceber = pgTable("contas_receber", {
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
    deleteReason: text("deleteReason"),
});
// ─── ADIANTAMENTOS (dinheiro para motorista viajar) ───────────────────────────
export const adiantamentos = pgTable("adiantamentos", {
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
    saldo: decimal("saldo", { precision: 10, scale: 2 }), // positivo = devolveu, negativo = empresa deve
    observacoes: text("observacoes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    deletedAt: timestamp("deletedAt"),
    deletedBy: integer("deletedBy"),
    deleteReason: text("deleteReason"),
});
// ─── CONTROLE DE TANQUE ───────────────────────────────────────────────────────
export const controleTanque = pgTable("controle_tanque", {
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
    veiculoId: integer("veiculoId"), // para saidas: qual veiculo abasteceu
    motoristaId: integer("motoristaId"),
    saldoAnterior: decimal("saldoAnterior", { precision: 8, scale: 3 }),
    saldoAtual: decimal("saldoAtual", { precision: 8, scale: 3 }),
    observacoes: text("observacoes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    deletedAt: timestamp("deletedAt"),
    deletedBy: integer("deletedBy"),
    deleteReason: text("deleteReason"),
});
// ─── LOG DE AUDITORIA ─────────────────────────────────────────────────────────
export const auditLog = pgTable("audit_log", {
    id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
    empresaId: integer("empresaId"),
    userId: integer("userId").notNull(),
    userName: varchar("userName", { length: 255 }),
    acao: varchar("acao", { length: 50 }).notNull(), // CREATE, UPDATE, DELETE, RESTORE
    tabela: varchar("tabela", { length: 100 }).notNull(),
    registroId: integer("registroId").notNull(),
    dadosAntes: text("dadosAntes"), // JSON
    dadosDepois: text("dadosDepois"), // JSON
    ip: varchar("ip", { length: 45 }),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});
// ─── ACIDENTES ────────────────────────────────────────────────────────────────
export const acidentes = pgTable("acidentes", {
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
    deleteReason: text("deleteReason"),
});
// ─── CHAT INTERNO ────────────────────────────────────────────────────────────
export const chatConversations = pgTable("chat_conversations", {
    id: serial("id").primaryKey(),
    empresaId: integer("empresaId").notNull(),
    name: varchar("name", { length: 255 }), // opcional para grupos
    isGroup: boolean("isGroup").default(false).notNull(),
    lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    deletedAt: timestamp("deletedAt"),
});
export const chatMembers = pgTable("chat_members", {
    id: serial("id").primaryKey(),
    conversationId: integer("conversationId").notNull(),
    userId: integer("userId").notNull(),
    role: chatRoleEnum("role").default("member").notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
    lastReadAt: timestamp("lastReadAt").defaultNow().notNull(),
});
export const chatMessages = pgTable("chat_messages", {
    id: serial("id").primaryKey(),
    conversationId: integer("conversationId").notNull(),
    senderId: integer("senderId").notNull(),
    content: text("content").notNull(),
    type: chatMessageTypeEnum("type").default("text").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    deletedAt: timestamp("deletedAt"),
});

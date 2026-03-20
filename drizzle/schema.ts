import {
  bigint,
  boolean,
  date,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── USERS (auth) ─────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "master_admin", "monitor", "dispatcher"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── EMPRESAS (multi-tenant) ──────────────────────────────────────────────────
export const empresas = mysqlTable("empresas", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }),
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  endereco: text("endereco"),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: int("deletedBy"),
  deleteReason: text("deleteReason"),
});

// ─── FUNCIONÁRIOS (RH) ────────────────────────────────────────────────────────
export const funcionarios = mysqlTable("funcionarios", {
  id: int("id").autoincrement().primaryKey(),
  empresaId: int("empresaId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }),
  rg: varchar("rg", { length: 20 }),
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  funcao: mysqlEnum("funcao", ["motorista", "ajudante", "despachante", "gerente", "admin", "outro"]).notNull(),
  tipoContrato: mysqlEnum("tipoContrato", ["clt", "freelancer", "terceirizado", "estagiario"]).notNull(),
  // Dados CLT
  salario: decimal("salario", { precision: 10, scale: 2 }),
  dataAdmissao: date("dataAdmissao"),
  dataDemissao: date("dataDemissao"),
  // Dados Freelancer/Temporário
  valorDiaria: decimal("valorDiaria", { precision: 10, scale: 2 }),
  valorMensal: decimal("valorMensal", { precision: 10, scale: 2 }),
  tipoCobranca: mysqlEnum("tipoCobranca", ["diaria", "mensal", "por_viagem"]),
  dataInicioContrato: date("dataInicioContrato"),
  dataFimContrato: date("dataFimContrato"),
  diaPagamento: int("diaPagamento"), // dia do mês para pagar
  // Dados Motorista
  cnh: varchar("cnh", { length: 20 }),
  categoriaCnh: varchar("categoriaCnh", { length: 5 }),
  vencimentoCnh: date("vencimentoCnh"),
  mopp: boolean("mopp").default(false),
  vencimentoMopp: date("vencimentoMopp"),
  vencimentoAso: date("vencimentoAso"), // exame médico
  // Dados bancários (freelancer)
  banco: varchar("banco", { length: 100 }),
  agencia: varchar("agencia", { length: 10 }),
  conta: varchar("conta", { length: 20 }),
  tipoConta: mysqlEnum("tipoConta", ["corrente", "poupanca", "pix"]),
  chavePix: varchar("chavePix", { length: 255 }),
  // Observações
  observacoes: text("observacoes"),
  foto: text("foto"),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: int("deletedBy"),
  deleteReason: text("deleteReason"),
});

// ─── VEÍCULOS ─────────────────────────────────────────────────────────────────
export const veiculos = mysqlTable("veiculos", {
  id: int("id").autoincrement().primaryKey(),
  empresaId: int("empresaId").notNull(),
  placa: varchar("placa", { length: 10 }).notNull(),
  tipo: mysqlEnum("tipo", ["van", "toco", "truck", "cavalo", "carreta", "empilhadeira", "paletera", "outro"]).notNull(),
  // Cavalo/Carreta: relacionamento
  cavaloPrincipalId: int("cavaloPrincipalId"), // para carreta: qual cavalo está acoplado
  // Dados do veículo
  marca: varchar("marca", { length: 100 }),
  modelo: varchar("modelo", { length: 100 }),
  ano: int("ano"),
  cor: varchar("cor", { length: 50 }),
  renavam: varchar("renavam", { length: 20 }),
  chassi: varchar("chassi", { length: 30 }),
  capacidadeCarga: decimal("capacidadeCarga", { precision: 8, scale: 2 }), // em toneladas
  // Motorista e ajudante padrão
  motoristaId: int("motoristaId"),
  ajudanteId: int("ajudanteId"),
  // KM e consumo
  kmAtual: int("kmAtual"),
  mediaConsumo: decimal("mediaConsumo", { precision: 5, scale: 2 }), // km/l
  // Documentação
  vencimentoCrlv: date("vencimentoCrlv"),
  vencimentoSeguro: date("vencimentoSeguro"),
  // Classificação (estrelas do Excel)
  classificacao: int("classificacao").default(0), // 0-5 estrelas
  observacoes: text("observacoes"),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: int("deletedBy"),
  deleteReason: text("deleteReason"),
});

// ─── ABASTECIMENTOS ───────────────────────────────────────────────────────────
export const abastecimentos = mysqlTable("abastecimentos", {
  id: int("id").autoincrement().primaryKey(),
  empresaId: int("empresaId").notNull(),
  veiculoId: int("veiculoId").notNull(),
  motoristaId: int("motoristaId"),
  data: date("data").notNull(),
  tipoCombustivel: mysqlEnum("tipoCombustivel", ["diesel", "arla", "gasolina", "etanol", "gas", "outro"]).notNull(),
  quantidade: decimal("quantidade", { precision: 8, scale: 3 }).notNull(),
  valorUnitario: decimal("valorUnitario", { precision: 8, scale: 3 }),
  valorTotal: decimal("valorTotal", { precision: 10, scale: 2 }),
  kmAtual: int("kmAtual"),
  kmRodado: int("kmRodado"),
  mediaConsumo: decimal("mediaConsumo", { precision: 5, scale: 2 }),
  local: varchar("local", { length: 255 }), // posto/cidade
  tipoAbastecimento: mysqlEnum("tipoAbastecimento", ["interno", "externo"]).default("interno"),
  notaFiscal: varchar("notaFiscal", { length: 50 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: int("deletedBy"),
  deleteReason: text("deleteReason"),
});

// ─── MANUTENÇÕES ──────────────────────────────────────────────────────────────
export const manutencoes = mysqlTable("manutencoes", {
  id: int("id").autoincrement().primaryKey(),
  empresaId: int("empresaId").notNull(),
  veiculoId: int("veiculoId").notNull(),
  data: date("data").notNull(),
  tipo: mysqlEnum("tipo", ["preventiva", "corretiva", "revisao", "pneu", "eletrica", "funilaria", "outro"]).notNull(),
  descricao: text("descricao").notNull(),
  empresa: varchar("empresa", { length: 255 }), // oficina/empresa
  valor: decimal("valor", { precision: 10, scale: 2 }),
  kmAtual: int("kmAtual"),
  proximaManutencaoKm: int("proximaManutencaoKm"),
  proximaManutencaoData: date("proximaManutencaoData"),
  notaFiscal: varchar("notaFiscal", { length: 50 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: int("deletedBy"),
  deleteReason: text("deleteReason"),
});

// ─── VIAGENS ──────────────────────────────────────────────────────────────────
export const viagens = mysqlTable("viagens", {
  id: int("id").autoincrement().primaryKey(),
  empresaId: int("empresaId").notNull(),
  tipo: mysqlEnum("tipo", ["entrega", "viagem"]).default("viagem").notNull(),
  veiculoId: int("veiculoId").notNull(),
  cavaloPrincipalId: int("cavaloPrincipalId"), // se for carreta, o cavalo que puxou
  motoristaId: int("motoristaId"),
  ajudante1Id: int("ajudante1Id"),
  ajudante2Id: int("ajudante2Id"),
  ajudante3Id: int("ajudante3Id"),
  // Rota
  origem: varchar("origem", { length: 255 }),
  destino: varchar("destino", { length: 255 }),
  // Datas e KM
  dataSaida: timestamp("dataSaida"),
  dataChegada: timestamp("dataChegada"),
  kmSaida: int("kmSaida"),
  kmChegada: int("kmChegada"),
  kmRodado: int("kmRodado"),
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
  // Status
  status: mysqlEnum("status", ["planejada", "em_andamento", "concluida", "cancelada"]).default("planejada").notNull(),
  observacoes: text("observacoes"),
  teveProblema: boolean("teveProblema").default(false),
  voltouComCarga: boolean("voltouComCarga").default(false),
  observacoesChegada: text("observacoesChegada"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: int("deletedBy"),
  deleteReason: text("deleteReason"),
});

// ─── DESPESAS DE VIAGEM ───────────────────────────────────────────────────────
export const despesasViagem = mysqlTable("despesas_viagem", {
  id: int("id").autoincrement().primaryKey(),
  viagemId: int("viagemId").notNull(),
  empresaId: int("empresaId").notNull(),
  tipo: mysqlEnum("tipo", ["combustivel", "pedagio", "borracharia", "estacionamento", "oficina", "telefone", "descarga", "diaria", "alimentacao", "outro"]).notNull(),
  descricao: text("descricao"),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  data: date("data"),
  comprovante: text("comprovante"), // URL da foto
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: int("deletedBy"),
  deleteReason: text("deleteReason"),
});

// ─── CHECKLIST ────────────────────────────────────────────────────────────────
export const checklists = mysqlTable("checklists", {
  id: int("id").autoincrement().primaryKey(),
  empresaId: int("empresaId").notNull(),
  veiculoId: int("veiculoId").notNull(),
  cavaloPrincipalId: int("cavaloPrincipalId"), // checklist independente para carreta
  motoristaId: int("motoristaId"),
  turno: mysqlEnum("turno", ["manha", "tarde", "noite"]),
  tipo: mysqlEnum("tipo", ["saida", "retorno"]).default("retorno").notNull(),
  // Itens internos
  cracha: mysqlEnum("cracha", ["conforme", "nao_conforme", "na"]),
  cnh: mysqlEnum("cnh", ["conforme", "nao_conforme", "na"]),
  documentosVeiculo: mysqlEnum("documentosVeiculo", ["conforme", "nao_conforme", "na"]),
  epi: mysqlEnum("epi", ["conforme", "nao_conforme", "na"]),
  computadorBordo: mysqlEnum("computadorBordo", ["conforme", "nao_conforme", "na"]),
  cinto: mysqlEnum("cinto", ["conforme", "nao_conforme", "na"]),
  banco: mysqlEnum("banco", ["conforme", "nao_conforme", "na"]),
  direcao: mysqlEnum("direcao", ["conforme", "nao_conforme", "na"]),
  luzesPainel: mysqlEnum("luzesPainel", ["conforme", "nao_conforme", "na"]),
  tacografo: mysqlEnum("tacografo", ["conforme", "nao_conforme", "na"]),
  extintor: mysqlEnum("extintor", ["conforme", "nao_conforme", "na"]),
  portas: mysqlEnum("portas", ["conforme", "nao_conforme", "na"]),
  limpador: mysqlEnum("limpador", ["conforme", "nao_conforme", "na"]),
  buzina: mysqlEnum("buzina", ["conforme", "nao_conforme", "na"]),
  freioDeMao: mysqlEnum("freioDeMao", ["conforme", "nao_conforme", "na"]),
  alarmeCacamba: mysqlEnum("alarmeCacamba", ["conforme", "nao_conforme", "na"]),
  cabineLimpa: mysqlEnum("cabineLimpa", ["conforme", "nao_conforme", "na"]),
  objetosSoltos: mysqlEnum("objetosSoltos", ["conforme", "nao_conforme", "na"]),
  // Itens externos
  pneus: mysqlEnum("pneus", ["conforme", "nao_conforme", "na"]),
  vazamentos: mysqlEnum("vazamentos", ["conforme", "nao_conforme", "na"]),
  trianguloCones: mysqlEnum("trianguloCones", ["conforme", "nao_conforme", "na"]),
  espelhos: mysqlEnum("espelhos", ["conforme", "nao_conforme", "na"]),
  lonaCarga: mysqlEnum("lonaCarga", ["conforme", "nao_conforme", "na"]),
  faixasRefletivas: mysqlEnum("faixasRefletivas", ["conforme", "nao_conforme", "na"]),
  luzesLaterais: mysqlEnum("luzesLaterais", ["conforme", "nao_conforme", "na"]),
  luzesFreio: mysqlEnum("luzesFreio", ["conforme", "nao_conforme", "na"]),
  farol: mysqlEnum("farol", ["conforme", "nao_conforme", "na"]),
  piscaAlerta: mysqlEnum("piscaAlerta", ["conforme", "nao_conforme", "na"]),
  re: mysqlEnum("re", ["conforme", "nao_conforme", "na"]),
  setas: mysqlEnum("setas", ["conforme", "nao_conforme", "na"]),
  macacoEstepe: mysqlEnum("macacoEstepe", ["conforme", "nao_conforme", "na"]),
  lanternas: mysqlEnum("lanternas", ["conforme", "nao_conforme", "na"]),
  // Resumo
  itensNaoConformes: int("itensNaoConformes").default(0),
  observacoes: text("observacoes"),
  assinaturaMotorista: text("assinaturaMotorista"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: int("deletedBy"),
  deleteReason: text("deleteReason"),
});

// ─── FINANCEIRO: CONTAS A PAGAR ───────────────────────────────────────────────
export const contasPagar = mysqlTable("contas_pagar", {
  id: int("id").autoincrement().primaryKey(),
  empresaId: int("empresaId").notNull(),
  descricao: text("descricao").notNull(),
  categoria: mysqlEnum("categoria", ["combustivel", "manutencao", "salario", "freelancer", "pedagio", "seguro", "ipva", "licenciamento", "pneu", "outro"]).notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  dataVencimento: date("dataVencimento").notNull(),
  dataPagamento: date("dataPagamento"),
  status: mysqlEnum("status", ["pendente", "pago", "vencido", "cancelado"]).default("pendente").notNull(),
  fornecedor: varchar("fornecedor", { length: 255 }),
  notaFiscal: varchar("notaFiscal", { length: 50 }),
  veiculoId: int("veiculoId"),
  funcionarioId: int("funcionarioId"),
  viagemId: int("viagemId"),
  comprovante: text("comprovante"),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: int("deletedBy"),
  deleteReason: text("deleteReason"),
});

// ─── FINANCEIRO: CONTAS A RECEBER ─────────────────────────────────────────────
export const contasReceber = mysqlTable("contas_receber", {
  id: int("id").autoincrement().primaryKey(),
  empresaId: int("empresaId").notNull(),
  descricao: text("descricao").notNull(),
  categoria: mysqlEnum("categoria", ["frete", "cte", "devolucao", "outro"]).notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  dataVencimento: date("dataVencimento").notNull(),
  dataRecebimento: date("dataRecebimento"),
  status: mysqlEnum("status", ["pendente", "recebido", "vencido", "cancelado"]).default("pendente").notNull(),
  cliente: varchar("cliente", { length: 255 }),
  notaFiscal: varchar("notaFiscal", { length: 50 }),
  cteNumero: varchar("cteNumero", { length: 50 }),
  viagemId: int("viagemId"),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: int("deletedBy"),
  deleteReason: text("deleteReason"),
});

// ─── ADIANTAMENTOS (dinheiro para motorista viajar) ───────────────────────────
export const adiantamentos = mysqlTable("adiantamentos", {
  id: int("id").autoincrement().primaryKey(),
  empresaId: int("empresaId").notNull(),
  funcionarioId: int("funcionarioId").notNull(),
  viagemId: int("viagemId"),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  formaPagamento: mysqlEnum("formaPagamento", ["dinheiro", "pix", "transferencia", "cartao"]).notNull(),
  data: date("data").notNull(),
  status: mysqlEnum("status", ["pendente", "acertado", "cancelado"]).default("pendente").notNull(),
  valorAcertado: decimal("valorAcertado", { precision: 10, scale: 2 }),
  dataAcerto: date("dataAcerto"),
  saldo: decimal("saldo", { precision: 10, scale: 2 }), // positivo = devolveu, negativo = empresa deve
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: int("deletedBy"),
  deleteReason: text("deleteReason"),
});

// ─── CONTROLE DE TANQUE ───────────────────────────────────────────────────────
export const controleTanque = mysqlTable("controle_tanque", {
  id: int("id").autoincrement().primaryKey(),
  empresaId: int("empresaId").notNull(),
  tipo: mysqlEnum("tipo", ["diesel", "arla"]).notNull(),
  data: date("data").notNull(),
  operacao: mysqlEnum("operacao", ["entrada", "saida"]).notNull(),
  quantidade: decimal("quantidade", { precision: 8, scale: 3 }).notNull(),
  valorUnitario: decimal("valorUnitario", { precision: 8, scale: 3 }),
  valorTotal: decimal("valorTotal", { precision: 10, scale: 2 }),
  fornecedor: varchar("fornecedor", { length: 255 }),
  notaFiscal: varchar("notaFiscal", { length: 50 }),
  veiculoId: int("veiculoId"), // para saídas: qual veículo abasteceu
  motoristaId: int("motoristaId"),
  saldoAnterior: decimal("saldoAnterior", { precision: 8, scale: 3 }),
  saldoAtual: decimal("saldoAtual", { precision: 8, scale: 3 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: int("deletedBy"),
  deleteReason: text("deleteReason"),
});

// ─── LOG DE AUDITORIA ─────────────────────────────────────────────────────────
export const auditLog = mysqlTable("audit_log", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  empresaId: int("empresaId"),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }),
  acao: varchar("acao", { length: 50 }).notNull(), // CREATE, UPDATE, DELETE, RESTORE
  tabela: varchar("tabela", { length: 100 }).notNull(),
  registroId: int("registroId").notNull(),
  dadosAntes: text("dadosAntes"), // JSON
  dadosDepois: text("dadosDepois"), // JSON
  ip: varchar("ip", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── ACIDENTES ────────────────────────────────────────────────────────────────
export const acidentes = mysqlTable("acidentes", {
  id: int("id").autoincrement().primaryKey(),
  empresaId: int("empresaId").notNull(),
  veiculoId: int("veiculoId").notNull(),
  motoristaId: int("motoristaId"),
  data: date("data").notNull(),
  local: varchar("local", { length: 255 }),
  descricao: text("descricao").notNull(),
  boletimOcorrencia: varchar("boletimOcorrencia", { length: 50 }),
  valorDano: decimal("valorDano", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["aberto", "em_reparo", "resolvido"]).default("aberto").notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
  deletedBy: int("deletedBy"),
  deleteReason: text("deleteReason"),
});

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type Empresa = typeof empresas.$inferSelect;
export type Funcionario = typeof funcionarios.$inferSelect;
export type Veiculo = typeof veiculos.$inferSelect;
export type Abastecimento = typeof abastecimentos.$inferSelect;
export type Manutencao = typeof manutencoes.$inferSelect;
export type Viagem = typeof viagens.$inferSelect;
export type DespesaViagem = typeof despesasViagem.$inferSelect;
export type Checklist = typeof checklists.$inferSelect;
export type ContaPagar = typeof contasPagar.$inferSelect;
export type ContaReceber = typeof contasReceber.$inferSelect;
export type Adiantamento = typeof adiantamentos.$inferSelect;
export type ControleTanque = typeof controleTanque.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
export type Acidente = typeof acidentes.$inferSelect;

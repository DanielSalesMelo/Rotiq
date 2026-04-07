import { webcrypto } from "crypto";
// Polyfill for Node.js 18 - make crypto available globally for jose
if (typeof globalThis.crypto === "undefined") {
  (globalThis as any).crypto = webcrypto;
}

import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import cors from "cors";
import helmet from "helmet";
import { getDb } from "./db";

// ─── Origens permitidas (CORS) ─────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
  "https://rotiq-cbhi.vercel.app",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

// Aceita qualquer subdomínio do Vercel do projeto (hashes dinâmicos de preview)
const VERCEL_PREVIEW_REGEX = /^https:\/\/rotiq-[a-z0-9-]+-daniels-projects-[a-z0-9]+\.vercel\.app$/;

const isOriginAllowed = (origin: string): boolean => {
  // Origens explícitas na lista
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Preview deploys do Vercel com hash dinâmico
  if (VERCEL_PREVIEW_REGEX.test(origin)) return true;
  return false;
};

// Aplica migrações pendentes ao iniciar o servidor
async function runMigrations() {
  const db = await getDb();
  if (!db) { console.warn("[Migration] DB indisponível, pulando migrações"); return; }
  try {
    const rawDb = (db as any).$client ?? (db as any).session ?? (db as any);
    // Adiciona empresaId na tabela users se não existir
    await rawDb.unsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "empresaId" integer`);
    // Vincula admins existentes à empresa 1 (empresa padrão)
    await rawDb.unsafe(`UPDATE "users" SET "empresaId" = 1 WHERE role = 'admin' AND "empresaId" IS NULL`);

    // Cria enum status_nf se não existir
    await rawDb.unsafe(`DO $$ BEGIN CREATE TYPE "status_nf" AS ENUM ('pendente','entregue','devolvida','parcial','extraviada'); EXCEPTION WHEN duplicate_object THEN null; END $$`);

    // Cria tabela notas_fiscais_viagem se não existir
    await rawDb.unsafe(`CREATE TABLE IF NOT EXISTS "notas_fiscais_viagem" (
      "id" SERIAL PRIMARY KEY,
      "empresaId" INTEGER NOT NULL,
      "viagemId" INTEGER NOT NULL,
      "numeroNf" VARCHAR(20) NOT NULL,
      "serie" VARCHAR(5),
      "chaveAcesso" VARCHAR(44),
      "destinatario" VARCHAR(255),
      "cnpjDestinatario" VARCHAR(18),
      "enderecoEntrega" VARCHAR(500),
      "cidade" VARCHAR(100),
      "uf" VARCHAR(2),
      "valorNf" DECIMAL(12,2),
      "pesoKg" DECIMAL(8,2),
      "volumes" INTEGER,
      "status" "status_nf" NOT NULL DEFAULT 'pendente',
      "dataCanhoto" TIMESTAMP,
      "dataEntrega" TIMESTAMP,
      "recebidoPor" VARCHAR(255),
      "motivoDevolucao" TEXT,
      "observacoes" TEXT,
      "ordemEntrega" INTEGER,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "deletedAt" TIMESTAMP
    )`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_nfv_viagem" ON "notas_fiscais_viagem" ("viagemId")`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_nfv_empresa" ON "notas_fiscais_viagem" ("empresaId")`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_nfv_numero" ON "notas_fiscais_viagem" ("numeroNf")`);
    
    // Adiciona fotoCanhoto na tabela notas_fiscais_viagem se não existir
    await rawDb.unsafe(`ALTER TABLE "notas_fiscais_viagem" ADD COLUMN IF NOT EXISTS "fotoCanhoto" VARCHAR(500)`);

    // Cria enum status_acerto_carga se não existir
    await rawDb.unsafe(`DO $$ BEGIN CREATE TYPE "status_acerto_carga" AS ENUM ('aberto','em_analise','fechado','pago'); EXCEPTION WHEN duplicate_object THEN null; END $$`);

    // Cria tabela acertos_carga se não existir
    await rawDb.unsafe(`CREATE TABLE IF NOT EXISTS "acertos_carga" (
      "id" SERIAL PRIMARY KEY,
      "empresaId" INTEGER NOT NULL,
      "viagemId" INTEGER NOT NULL,
      "motoristaId" INTEGER,
      "dataAcerto" DATE,
      "status" "status_acerto_carga" NOT NULL DEFAULT 'aberto',
      "adiantamentoConcedido" DECIMAL(10,2) DEFAULT 0,
      "freteRecebido" DECIMAL(10,2) DEFAULT 0,
      "despesasPedagio" DECIMAL(10,2) DEFAULT 0,
      "despesasCombustivel" DECIMAL(10,2) DEFAULT 0,
      "despesasAlimentacao" DECIMAL(10,2) DEFAULT 0,
      "despesasEstacionamento" DECIMAL(10,2) DEFAULT 0,
      "despesasOutras" DECIMAL(10,2) DEFAULT 0,
      "descricaoOutras" TEXT,
      "valorDevolvido" DECIMAL(10,2) DEFAULT 0,
      "percentualComissao" DECIMAL(5,2) DEFAULT 0,
      "valorComissao" DECIMAL(10,2) DEFAULT 0,
      "saldoFinal" DECIMAL(10,2) DEFAULT 0,
      "observacoes" TEXT,
      "aprovadoPor" VARCHAR(255),
      "dataAprovacao" TIMESTAMP,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "deletedAt" TIMESTAMP
    )`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_acerto_viagem" ON "acertos_carga" ("viagemId")`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_acerto_empresa" ON "acertos_carga" ("empresaId")`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_acerto_motorista" ON "acertos_carga" ("motoristaId")`);

    // Cria enum status_carregamento se não existir
    await rawDb.unsafe(`DO $$ BEGIN CREATE TYPE "status_carregamento" AS ENUM ('montando','pronto','em_rota','retornado','encerrado'); EXCEPTION WHEN duplicate_object THEN null; END $$`);

    // Cria tabela carregamentos
    await rawDb.unsafe(`CREATE TABLE IF NOT EXISTS "carregamentos" (
      "id" SERIAL PRIMARY KEY,
      "empresaId" INTEGER NOT NULL,
      "numero" VARCHAR(20),
      "data" DATE NOT NULL,
      "veiculoId" INTEGER,
      "veiculoPlaca" VARCHAR(10),
      "motoristaId" INTEGER,
      "motoristaNome" VARCHAR(255),
      "ajudanteId" INTEGER,
      "ajudanteNome" VARCHAR(255),
      "rotaDescricao" VARCHAR(255),
      "cidadesRota" TEXT,
      "status" "status_carregamento" NOT NULL DEFAULT 'montando',
      "dataSaida" TIMESTAMP,
      "dataRetorno" TIMESTAMP,
      "kmSaida" INTEGER,
      "kmRetorno" INTEGER,
      "totalNfs" INTEGER DEFAULT 0,
      "totalVolumes" INTEGER DEFAULT 0,
      "totalPesoKg" DECIMAL(10,2) DEFAULT 0,
      "totalValorNfs" DECIMAL(12,2) DEFAULT 0,
      "observacoes" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "deletedAt" TIMESTAMP
    )`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_carg_empresa" ON "carregamentos" ("empresaId")`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_carg_veiculo" ON "carregamentos" ("veiculoId")`);

    // Cria tabela itens_carregamento
    await rawDb.unsafe(`CREATE TABLE IF NOT EXISTS "itens_carregamento" (
      "id" SERIAL PRIMARY KEY,
      "carregamentoId" INTEGER NOT NULL,
      "empresaId" INTEGER NOT NULL,
      "numeroNf" VARCHAR(20) NOT NULL,
      "serie" VARCHAR(5),
      "chaveAcesso" VARCHAR(44),
      "destinatario" VARCHAR(255),
      "cnpjDestinatario" VARCHAR(18),
      "enderecoEntrega" VARCHAR(500),
      "cidade" VARCHAR(100),
      "uf" VARCHAR(2),
      "valorNf" DECIMAL(12,2),
      "pesoKg" DECIMAL(8,2),
      "volumes" INTEGER,
      "descricaoCarga" VARCHAR(255),
      "ordemEntrega" INTEGER,
      "status" "status_nf" NOT NULL DEFAULT 'pendente',
      "dataCanhoto" TIMESTAMP,
      "recebidoPor" VARCHAR(255),
      "motivoDevolucao" TEXT,
      "observacoes" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "deletedAt" TIMESTAMP
    )`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_item_carg" ON "itens_carregamento" ("carregamentoId")`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_item_empresa" ON "itens_carregamento" ("empresaId")`);

    // Cria enum tipo_empresa se não existir
    await rawDb.unsafe(`DO $$ BEGIN CREATE TYPE "tipo_empresa" AS ENUM ('independente','matriz','filial'); EXCEPTION WHEN duplicate_object THEN null; END $$`);

    // Adiciona tipoEmpresa, matrizId e codigoConvite na tabela empresas se não existirem
    await rawDb.unsafe(`ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "tipoEmpresa" "tipo_empresa" DEFAULT 'independente' NOT NULL`);
    await rawDb.unsafe(`ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "matrizId" INTEGER`);
    await rawDb.unsafe(`ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "codigoConvite" VARCHAR(50)`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_empresas_matrizId" ON "empresas" ("matrizId")`);
    await rawDb.unsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_empresas_codigoConvite" ON "empresas" ("codigoConvite")`);

    // ─── Garantir empresaId em todas as tabelas principais ───────────────────
    // Tabelas originais que podem não ter a coluna empresaId no banco de produção
    await rawDb.unsafe(`ALTER TABLE "funcionarios" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER NOT NULL DEFAULT 1`);
    await rawDb.unsafe(`ALTER TABLE "veiculos" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER NOT NULL DEFAULT 1`);
    await rawDb.unsafe(`ALTER TABLE "abastecimentos" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER NOT NULL DEFAULT 1`);
    await rawDb.unsafe(`ALTER TABLE "manutencoes" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER NOT NULL DEFAULT 1`);
    await rawDb.unsafe(`ALTER TABLE "viagens" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER NOT NULL DEFAULT 1`);
    await rawDb.unsafe(`ALTER TABLE "checklists" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER NOT NULL DEFAULT 1`);
    await rawDb.unsafe(`ALTER TABLE "contas_pagar" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER NOT NULL DEFAULT 1`);
    await rawDb.unsafe(`ALTER TABLE "contas_receber" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER NOT NULL DEFAULT 1`);
    await rawDb.unsafe(`ALTER TABLE "adiantamentos" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER NOT NULL DEFAULT 1`);
    await rawDb.unsafe(`ALTER TABLE "controle_tanque" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER NOT NULL DEFAULT 1`);
    await rawDb.unsafe(`ALTER TABLE "acidentes" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER NOT NULL DEFAULT 1`);
    await rawDb.unsafe(`ALTER TABLE "chat_conversations" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER NOT NULL DEFAULT 1`);
    await rawDb.unsafe(`ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER`);

    // Índices de performance para empresaId nas tabelas principais
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_func_empresa" ON "funcionarios" ("empresaId")`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_veic_empresa" ON "veiculos" ("empresaId")`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_abast_empresa" ON "abastecimentos" ("empresaId")`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_manut_empresa" ON "manutencoes" ("empresaId")`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_viag_empresa" ON "viagens" ("empresaId")`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_cp_empresa" ON "contas_pagar" ("empresaId")`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_cr_empresa" ON "contas_receber" ("empresaId")`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_adiant_empresa" ON "adiantamentos" ("empresaId")`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_acidente_empresa" ON "acidentes" ("empresaId")`);

    // ─── LICENCIAMENTO SaaS ────────────────────────────────────────────────
    await rawDb.unsafe(`DO $$ BEGIN CREATE TYPE "plano_cod" AS ENUM ('trial','basico','pro','enterprise'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await rawDb.unsafe(`DO $$ BEGIN CREATE TYPE "status_licenca" AS ENUM ('trial','ativa','suspensa','vencida','cancelada'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await rawDb.unsafe(`DO $$ BEGIN CREATE TYPE "ciclo_cobranca" AS ENUM ('mensal','trimestral','semestral','anual'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await rawDb.unsafe(`DO $$ BEGIN CREATE TYPE "status_cobranca" AS ENUM ('pendente','pago','vencido','cancelado','estornado'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await rawDb.unsafe(`DO $$ BEGIN CREATE TYPE "forma_pagamento_saas" AS ENUM ('pix','boleto','cartao_credito','transferencia','cortesia'); EXCEPTION WHEN duplicate_object THEN null; END $$`);

    await rawDb.unsafe(`CREATE TABLE IF NOT EXISTS "planos" (
      "id" SERIAL PRIMARY KEY,
      "codigo" "plano_cod" NOT NULL UNIQUE,
      "nome" VARCHAR(100) NOT NULL,
      "descricao" TEXT,
      "precoMensal" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "precoTrimestral" DECIMAL(10,2),
      "precoSemestral" DECIMAL(10,2),
      "precoAnual" DECIMAL(10,2),
      "limiteUsuarios" INTEGER DEFAULT 5,
      "limiteVeiculos" INTEGER DEFAULT 10,
      "limiteMotoristas" INTEGER DEFAULT 10,
      "modulosAtivos" TEXT DEFAULT 'basico',
      "temIntegracaoWinthor" BOOLEAN DEFAULT false,
      "temIntegracaoArquivei" BOOLEAN DEFAULT false,
      "temRelatoriosAvancados" BOOLEAN DEFAULT false,
      "temMultiEmpresa" BOOLEAN DEFAULT false,
      "temSuportePrioritario" BOOLEAN DEFAULT false,
      "diasTrial" INTEGER DEFAULT 14,
      "ativo" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )`);

    await rawDb.unsafe(`CREATE TABLE IF NOT EXISTS "licencas" (
      "id" SERIAL PRIMARY KEY,
      "empresaId" INTEGER NOT NULL UNIQUE,
      "planoCod" "plano_cod" NOT NULL DEFAULT 'trial',
      "status" "status_licenca" NOT NULL DEFAULT 'trial',
      "ciclo" "ciclo_cobranca" DEFAULT 'mensal',
      "dataInicio" TIMESTAMP NOT NULL DEFAULT NOW(),
      "dataFim" TIMESTAMP,
      "dataTrialFim" TIMESTAMP,
      "dataUltimoPagamento" TIMESTAMP,
      "dataProximoVencimento" TIMESTAMP,
      "valorContratado" DECIMAL(10,2),
      "descontoPercent" DECIMAL(5,2) DEFAULT 0,
      "observacoes" TEXT,
      "motivoSuspensao" TEXT,
      "criadoPor" INTEGER,
      "updatedBy" INTEGER,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )`);

    await rawDb.unsafe(`CREATE TABLE IF NOT EXISTS "cobrancas" (
      "id" SERIAL PRIMARY KEY,
      "empresaId" INTEGER NOT NULL,
      "licencaId" INTEGER NOT NULL,
      "planoCod" "plano_cod" NOT NULL,
      "ciclo" "ciclo_cobranca" NOT NULL DEFAULT 'mensal',
      "periodoInicio" TIMESTAMP NOT NULL,
      "periodoFim" TIMESTAMP NOT NULL,
      "valorBruto" DECIMAL(10,2) NOT NULL,
      "desconto" DECIMAL(10,2) DEFAULT 0,
      "valorLiquido" DECIMAL(10,2) NOT NULL,
      "status" "status_cobranca" NOT NULL DEFAULT 'pendente',
      "formaPagamento" "forma_pagamento_saas",
      "dataPagamento" TIMESTAMP,
      "dataVencimento" TIMESTAMP NOT NULL,
      "comprovante" VARCHAR(500),
      "observacoes" TEXT,
      "criadoPor" INTEGER,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )`);

    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_licencas_empresa" ON "licencas" ("empresaId")`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_cobrancas_empresa" ON "cobrancas" ("empresaId")`);
    await rawDb.unsafe(`CREATE INDEX IF NOT EXISTS "idx_cobrancas_licenca" ON "cobrancas" ("licencaId")`);

    // Seed planos padrão se tabela vazia
    const planosCount = await rawDb.unsafe(`SELECT COUNT(*) as cnt FROM "planos"`);
    if (parseInt(planosCount[0]?.cnt ?? '0') === 0) {
      await rawDb.unsafe(`INSERT INTO "planos" ("codigo","nome","descricao","precoMensal","precoTrimestral","precoSemestral","precoAnual","limiteUsuarios","limiteVeiculos","limiteMotoristas","temIntegracaoArquivei","diasTrial") VALUES
        ('trial','Trial','Período de teste gratuito com acesso completo.',0,0,0,0,3,5,5,true,14),
        ('basico','Básico','Ideal para frotas pequenas. Módulos essenciais.',199,549,1049,1899,5,15,15,true,14),
        ('pro','Pro','Frotas médias/grandes. Integrações e relatórios avançados.',449,1199,2199,3999,20,50,50,true,14),
        ('enterprise','Enterprise','Solução completa sem limites. Suporte prioritário.',0,0,0,0,9999,9999,9999,true,30)
      `);
      await rawDb.unsafe(`UPDATE "planos" SET "temIntegracaoWinthor"=true,"temRelatoriosAvancados"=true,"temMultiEmpresa"=true WHERE "codigo" IN ('pro','enterprise')`);
      await rawDb.unsafe(`UPDATE "planos" SET "temSuportePrioritario"=true WHERE "codigo"='enterprise'`);
    }

    console.log("[Migration] Migrações aplicadas com sucesso");
  } catch (err) {
    console.error("[Migration] Erro ao aplicar migrações:", err);
  }
}

const app = express();
const port = process.env.PORT || 3000;

// 1. Helmet — headers de segurança HTTP
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // necessário para tRPC/fetch
    contentSecurityPolicy: false,     // gerenciado pelo Vite no frontend
  })
);

// 2. CORS restrito — apenas origens explicitamente autorizadas
app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (ex: Railway health check, mobile nativo)
    if (!origin) return callback(null, true);
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Origem bloqueada: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// 3. Middleware fundamental para ler o JSON do login
app.use(express.json({ limit: "2mb" }));

// 4. Middleware do tRPC
app.use(
  "/api/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// 5. Endpoint de saúde para o Railway
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 6. Iniciar o servidor (após migrações)
runMigrations().then(() => {
  app.listen(port, () => {
    console.log(`[Server] Rotiq Backend running on port ${port}`);
  });
}).catch((err) => {
  console.error("[Server] Falha nas migrações, iniciando mesmo assim:", err);
  app.listen(port, () => {
    console.log(`[Server] Rotiq Backend running on port ${port}`);
  });
});

// Placeholder for migration 0003 - will be added via shell

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
import { getDb } from "./db";

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

    console.log("[Migration] Migrações aplicadas com sucesso");
  } catch (err) {
    console.error("[Migration] Erro ao aplicar migrações:", err);
  }
}

const app = express();
const port = process.env.PORT || 3000;

// 1. Configuração Robusta de CORS para aceitar conexões locais e da Vercel
app.use(cors({
  origin: (origin, callback) => {
    // Aceita qualquer origem em desenvolvimento e domínios Vercel em produção
    if (
      !origin ||
      origin.startsWith("http://localhost:") ||
      origin.includes(".vercel.app") ||
      origin.includes("rotiq")
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// 2. Middleware fundamental para ler o JSON do login
app.use(express.json());

// 3. Middleware do tRPC
app.use(
  "/api/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// 4. Endpoint de saúde para o Railway
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 5. Iniciar o servidor (após migrações)
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

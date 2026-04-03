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

// 5. Iniciar o servidor
app.listen(port, () => {
  console.log(`[Server] Rotiq Backend running on port ${port}`);
});

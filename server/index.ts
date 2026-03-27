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
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "https://rotiq.vercel.app"
    ];
    if (!origin || allowedOrigins.includes(origin) || origin?.startsWith("http://localhost:")) {
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

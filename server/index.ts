import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/trpc";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

// Habilitar CORS para o frontend no Vercel
app.use(cors({
  origin: true, // Em produção, você pode restringir para a URL do Vercel
  credentials: true,
}));

// Middleware do tRPC
app.use(
  "/api/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Endpoint de saúde para o Railway
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`[Server] Rotiq Backend running on port ${port}`);
});

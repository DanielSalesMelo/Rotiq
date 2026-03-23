import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// CORS: permite origem configurável via env (por padrão permite todas)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  })
);

// Body parser
app.use(express.json());

// Rota de teste
app.get("/", (req, res) => {
  res.json({ message: "Backend do Rotiq está online!" });
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Exemplo de rota de erro para demonstrar tratamento (opcional)
// app.get("/error", () => { throw new Error("teste"); });

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Porta padrão Railway
const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`Recebido ${signal}. Finalizando servidor...`);
  server.close((err) => {
    if (err) {
      console.error("Erro ao fechar servidor:", err);
      process.exit(1);
    }
    console.log("Servidor finalizado.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Exporta app para testes ou uso em outros módulos
export default app;
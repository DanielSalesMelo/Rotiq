import { systemRouter } from "./_core/systemRouter.js";
import { router } from "./_core/trpc.js";
import { veiculosRouter } from "./routers/veiculos.js";
import { funcionariosRouter } from "./routers/funcionarios.js";
import { frotaRouter } from "./routers/frota.js";
import { financeiroRouter } from "./routers/financeiro.js";
import { dashboardRouter } from "./routers/dashboard.js";
import { viagensRouter } from "./routers/viagens.js";
import { custosRouter } from "./routers/custos.js";
import { multasRouter } from "./routers/multas.js";
import { chatRouter } from "./routers/chat.js";
import { authRouter } from "./routers/auth.js";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  veiculos: veiculosRouter,
  funcionarios: funcionariosRouter,
  frota: frotaRouter,
  financeiro: financeiroRouter,
  dashboard: dashboardRouter,
  viagens: viagensRouter,
  custos: custosRouter,
  multas: multasRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;

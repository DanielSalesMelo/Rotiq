import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, router } from "./_core/trpc.js";
import { veiculosRouter } from "./routers/veiculos.js";
import { funcionariosRouter } from "./routers/funcionarios.js";
import { frotaRouter } from "./routers/frota.js";
import { financeiroRouter } from "./routers/financeiro.js";
import { dashboardRouter } from "./routers/dashboard.js";
import { viagensRouter } from "./routers/viagens.js";
import { custosRouter } from "./routers/custos.js";
import { multasRouter } from "./routers/multas.js";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  veiculos: veiculosRouter,
  funcionarios: funcionariosRouter,
  frota: frotaRouter,
  financeiro: financeiroRouter,
  dashboard: dashboardRouter,
  viagens: viagensRouter,
  custos: custosRouter,
  multas: multasRouter,
});

export type AppRouter = typeof appRouter;

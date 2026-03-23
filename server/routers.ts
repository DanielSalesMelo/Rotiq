import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { veiculosRouter } from "./routers/veiculos";
import { funcionariosRouter } from "./routers/funcionarios";
import { frotaRouter } from "./routers/frota";
import { financeiroRouter } from "./routers/financeiro";
import { dashboardRouter } from "./routers/dashboard";
import { viagensRouter } from "./routers/viagens";
import { custosRouter } from "./routers/custos";
import { multasRouter } from "./routers/multas";
import { chatRouter } from "./routers/chat";

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
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;

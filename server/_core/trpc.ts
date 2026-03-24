import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '../shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import jwt from "jsonwebtoken";
import { getDb } from "../db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

const JWT_SECRET = process.env.JWT_SECRET || "rotiq-secret-key-123";

export async function createContext(opts: CreateExpressContextOptions) {
  const { req, res } = opts;
  const cookieHeader = req.headers.cookie || "";
  const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
  const token = cookies['manus-enterprise-suite-session'];

  let user = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const db = await getDb();
      if (db) {
        const [foundUser] = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
        if (foundUser) {
          user = foundUser;
        }
      }
    } catch (e) {
      user = null;
    }
  }

  return { req, res, user };
}

const t = initTRPC.context<Awaited<ReturnType<typeof createContext>>>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const adminRoles = ["admin", "master_admin"];
    if (!ctx.user || !adminRoles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

export const monitorProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const monitorRoles = ["monitor", "admin", "master_admin"];
    if (!ctx.user || !monitorRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Acesso negado.",
      });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

export const masterAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "master_admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Acesso negado.",
      });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

export const dispatcherProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const dispatcherRoles = ["dispatcher", "monitor", "admin", "master_admin"];
    if (!ctx.user || !dispatcherRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Acesso negado.",
      });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

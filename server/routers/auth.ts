import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";

const JWT_SECRET = process.env.JWT_SECRET || "rotiq-secret-key-123";

export const authRouter = router({
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

      if (!user || !user.password) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos" });
      }

      const validPassword = await bcrypt.compare(input.password, user.password);
      if (!validPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      ctx.res.setHeader("Set-Cookie", `manus-enterprise-suite-session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`);

      return { success: true, user };
    }),

  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(2),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      // Verificar se usuário já existe
      const [existingUser] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existingUser) {
        throw new TRPCError({ code: "CONFLICT", message: "E-mail já cadastrado" });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      
      // Criar openId único para compatibilidade com o sistema
      const openId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      const [newUser] = await db.insert(users).values({
        email: input.email,
        password: hashedPassword,
        name: input.name,
        openId: openId,
        role: "user",
        loginMethod: "local",
      }).returning();

      if (!newUser) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar usuário" });
      }

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      ctx.res.setHeader("Set-Cookie", `manus-enterprise-suite-session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`);

      return { success: true, user: newUser };
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user || null;
  }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    ctx.res.setHeader("Set-Cookie", `manus-enterprise-suite-session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
    return { success: true };
  }),
});

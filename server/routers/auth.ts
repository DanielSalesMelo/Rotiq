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
      username: z.string(), // Nome de usuário em vez de e-mail
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      // Buscar pelo nome de usuário (campo name no banco)
      const [user] = await db.select().from(users).where(eq(users.name, input.username)).limit(1);

      if (!user || !user.password) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário ou senha incorretos" });
      }

      // Verificar status de aprovação
      if (user.status === 'pending') {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Sua conta está aguardando aprovação de um administrador." 
        });
      }

      const validPassword = await bcrypt.compare(input.password, user.password);
      if (!validPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário ou senha incorretos" });
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
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
      password: z.string().min(6),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      // Verificar se o nome de usuário já existe
      const [existingUser] = await db.select().from(users).where(eq(users.name, input.name)).limit(1);
      if (existingUser) {
        throw new TRPCError({ code: "CONFLICT", message: "Este nome de usuário já está em uso" });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      
      const openId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      const [newUser] = await db.insert(users).values({
        name: input.name,
        email: input.email,
        password: hashedPassword,
        openId: openId,
        role: "user",
        status: "pending", // Sempre começa como pendente
        loginMethod: "local",
      }).returning();

      if (!newUser) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar usuário" });
      }

      // No cadastro, não fazemos login automático pois precisa de aprovação
      return { 
        success: true, 
        message: "Cadastro realizado com sucesso! Aguarde a aprovação de um administrador para acessar o sistema." 
      };
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user || null;
  }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    ctx.res.setHeader("Set-Cookie", `manus-enterprise-suite-session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
    return { success: true };
  }),
});

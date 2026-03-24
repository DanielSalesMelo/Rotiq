import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
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

  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user || null;
  }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    ctx.res.setHeader("Set-Cookie", `manus-enterprise-suite-session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
    return { success: true };
  }),
});

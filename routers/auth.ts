import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { sdk } from "../_core/sdk";
import * as db from "../db";
import { z } from "zod";

export const authRouter = router({
  // Public: Get current user info
  me: publicProcedure.query(opts => opts.ctx.user),

  // Public: Login with email and password (internal auth)
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // In a real app, you'd hash passwords and verify against a database
      // For now, we'll create a simple demo user system
      // In production, use bcrypt or similar for password hashing

      // Demo: Allow any email/password combination for testing
      // In production, verify against hashed password in database
      const email = input.email.toLowerCase();
      
      // Upsert user to database
      const openId = `internal_${email.replace(/[^a-z0-9]/g, "_")}`;
      
      await db.upsertUser({
        openId,
        name: email.split("@")[0],
        email,
        loginMethod: "internal",
        lastSignedIn: new Date(),
      });

      // Get user from database
      const user = await db.getUserByOpenId(openId);
      if (!user) {
        throw new Error("Failed to create user session");
      }

      // Create session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: user.name || email,
        expiresInMs: ONE_YEAR_MS,
      });

      // Set cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      return {
        success: true,
        user,
      };
    }),

  // Public: Register new user (internal auth)
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        name: z.string().min(2, "Name must be at least 2 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const email = input.email.toLowerCase();
      const openId = `internal_${email.replace(/[^a-z0-9]/g, "_")}`;

      // Check if user already exists
      const existingUser = await db.getUserByOpenId(openId);
      if (existingUser) {
        throw new Error("User already exists");
      }

      // Create new user
      await db.upsertUser({
        openId,
        name: input.name,
        email,
        loginMethod: "internal",
        lastSignedIn: new Date(),
      });

      // Get user from database
      const user = await db.getUserByOpenId(openId);
      if (!user) {
        throw new Error("Failed to create user");
      }

      // Create session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: user.name || input.name,
        expiresInMs: ONE_YEAR_MS,
      });

      // Set cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      return {
        success: true,
        user,
      };
    }),

  // Protected: Logout
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

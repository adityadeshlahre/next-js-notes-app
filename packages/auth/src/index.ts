import { createDb } from "@next-js-notes-app/db";
import * as schema from "@next-js-notes-app/db/schema/auth";
import { env } from "@next-js-notes-app/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { hashPassword, verifyPassword } from "./password";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    rateLimit: {
      enabled: false,
    },
    database: drizzleAdapter(db, {
      provider: "pg",

      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN],
    emailAndPassword: {
      enabled: true,
      password: {
        hash: hashPassword,
        verify: verifyPassword,
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    plugins: [nextCookies()],
  });
}

export const auth = createAuth();

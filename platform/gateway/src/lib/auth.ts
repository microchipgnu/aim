import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { schema } from "../db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            ...schema
        },
        usePlural: true
    }),
    emailAndPassword: {
        enabled: true,
    },
    trustedOrigins: ["*"]
})
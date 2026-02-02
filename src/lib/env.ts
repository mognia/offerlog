import { z } from "zod";

const EnvSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // Required for secure token hashing (pepper + sha256)
    AUTH_TOKEN_PEPPER: z.string().min(32),

    // Cookie name for DB-backed sessions
    SESSION_COOKIE_NAME: z.string().min(1).default("offerlog_session"),

    // Used for building absolute links in emails
    APP_BASE_URL: z.string().url(),

    // Used by Resend (Module 1, next chunks)
    RESEND_API_KEY: z.string().min(1),
});

export const env = EnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    AUTH_TOKEN_PEPPER: process.env.AUTH_TOKEN_PEPPER,
    SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
    APP_BASE_URL: process.env.APP_BASE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
});

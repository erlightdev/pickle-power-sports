import { createPrismaClient } from "@Pickle-Power-Sports/db";
import { env } from "@Pickle-Power-Sports/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export function createAuth() {
	const prisma = createPrismaClient();
	const isHttps = env.BETTER_AUTH_URL.startsWith("https://");

	return betterAuth({
		database: prismaAdapter(prisma, {
			provider: "postgresql",
		}),

		trustedOrigins: [env.CORS_ORIGIN],
		emailAndPassword: {
			enabled: true,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				sameSite: isHttps ? "none" : "lax",
				secure: isHttps,
				httpOnly: true,
			},
		},
		plugins: [],
	});
}

export const auth = createAuth();

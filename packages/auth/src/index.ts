import { createPrismaClient } from "@Pickle-Power-Sports/db";
import { env } from "@Pickle-Power-Sports/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP, username } from "better-auth/plugins";
import nodemailer from "nodemailer";

function createMailTransport() {
	return nodemailer.createTransport({
		host: env.SMTP_HOST,
		port: env.SMTP_PORT,
		secure: env.SMTP_PORT === 465,
		auth: {
			user: env.SMTP_USER,
			pass: env.SMTP_PASS,
		},
	});
}

async function generateUniqueUsername(
	prisma: ReturnType<typeof createPrismaClient>,
	name: string,
): Promise<string> {
	const base =
		name
			.toLowerCase()
			.replace(/\s+/g, "_")
			.replace(/[^a-z0-9_]/g, "")
			.slice(0, 16) || "user";

	const existing = await prisma.user.findUnique({ where: { username: base } });
	if (!existing) return base;

	let generated: string;
	do {
		const suffix = Math.floor(Math.random() * 9000) + 1000;
		generated = `${base}${suffix}`;
	} while (await prisma.user.findUnique({ where: { username: generated } }));

	return generated;
}

function isTrustedLocalOrigin(origin: string | null) {
	if (!origin || env.NODE_ENV === "production") {
		return false;
	}

	try {
		const url = new URL(origin);
		return (
			url.protocol === "http:" &&
			url.port === "3001" &&
			(url.hostname === "localhost" || url.hostname.endsWith(".localhost"))
		);
	} catch {
		return false;
	}
}

export function createAuth() {
	const prisma = createPrismaClient();
	const isHttps = env.BETTER_AUTH_URL.startsWith("https://");

	return betterAuth({
		database: prismaAdapter(prisma, {
			provider: "postgresql",
		}),

		trustedOrigins: (request) => {
			const origin = request?.headers.get("origin") ?? null;
			return isTrustedLocalOrigin(origin)
				? [env.CORS_ORIGIN, origin]
				: [env.CORS_ORIGIN];
		},
		user: {
			additionalFields: {
				phone: {
					type: "string",
					required: false,
					unique: true,
					returned: true,
					input: true,
				},
			},
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
		},
		databaseHooks: {
			user: {
				create: {
					before: async (user) => {
						if (!user.username) {
							const generatedUsername = await generateUniqueUsername(
								prisma,
								user.name,
							);
							return {
								data: {
									...user,
									username: generatedUsername,
									displayUsername: generatedUsername,
								},
							};
						}
					},
				},
			},
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
		plugins: [
			username(),
			emailOTP({
				async sendVerificationOTP({ email, otp, type }) {
					const transport = createMailTransport();
					const subject =
						type === "email-verification"
							? "Verify your email – Pickle Power Sports"
							: type === "sign-in"
								? "Your sign-in code – Pickle Power Sports"
								: "Reset your password – Pickle Power Sports";

					await transport.sendMail({
						from: env.SMTP_FROM,
						to: email,
						subject,
						html: `
							<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
								<h2 style="color:#16a34a">Pickle Power Sports</h2>
								<p>Your verification code is:</p>
								<div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px 0">
									${otp}
								</div>
								<p style="color:#6b7280;font-size:14px">This code expires in 10 minutes. Do not share it with anyone.</p>
							</div>
						`,
					});
				},
				expiresIn: 600,
				otpLength: 6,
			}),
		],
	});
}

export const auth = createAuth();

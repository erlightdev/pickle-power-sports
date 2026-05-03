import type { TenantContext } from "@Pickle-Power-Sports/api/context";
import { createContext } from "@Pickle-Power-Sports/api/context";
import { appRouter } from "@Pickle-Power-Sports/api/routers/index";
import { auth } from "@Pickle-Power-Sports/auth";
import prisma from "@Pickle-Power-Sports/db";
import { env } from "@Pickle-Power-Sports/env/server";
import { trpcServer } from "@hono/trpc-server";
import type { Context } from "hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

type AppVariables = {
	tenant: TenantContext;
};

const app = new Hono<{ Variables: AppVariables }>();

function tenantNameFromSlug(slug: string) {
	return slug
		.split("-")
		.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
		.join(" ");
}

function rootDomain() {
	return process.env.ROOT_DOMAIN ?? (process.env.NODE_ENV === "production" ? null : "localhost");
}

function isAllowedCorsOrigin(origin: string | undefined) {
	if (!origin) {
		return false;
	}

	if (origin === env.CORS_ORIGIN) {
		return true;
	}

	if (env.NODE_ENV === "production") {
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

async function resolveTenantDomain(host: string): Promise<TenantContext> {
	const tenantDomain = await prisma.tenantDomain.findUnique({
		where: { domain: host },
		include: { tenant: true },
	});

	if (!tenantDomain || tenantDomain.tenant.status !== "ACTIVE") {
		return null;
	}

	return {
		id: tenantDomain.tenant.id,
		name: tenantDomain.tenant.name,
		slug: tenantDomain.tenant.slug,
		status: tenantDomain.tenant.status,
	};
}

async function resolveTenant(
	hostHeader: string | undefined,
	tenantSlugHeader: string | undefined,
): Promise<TenantContext> {
	const host = hostHeader?.split(":")[0]?.toLowerCase();

	if (!host) {
		return null;
	}

	const mappedTenant = await resolveTenantDomain(host);
	if (mappedTenant) {
		return mappedTenant;
	}

	const appRootDomain = rootDomain();
	const defaultTenantSlug =
		process.env.DEFAULT_TENANT_SLUG ?? "picklepowersports";
	const isProduction = process.env.NODE_ENV === "production";
	const localHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
	let tenantSlug: string | null = null;
	let customDomain: string | null = null;

	if (
		!isProduction &&
		tenantSlugHeader &&
		(localHosts.has(host) || host.endsWith(".localhost"))
	) {
		tenantSlug = tenantSlugHeader.toLowerCase();
	} else if (localHosts.has(host)) {
		tenantSlug = defaultTenantSlug;
	} else if (!isProduction && host.endsWith(".localhost")) {
		tenantSlug = host.replace(".localhost", "");
	} else if (appRootDomain && (host === appRootDomain || host === `www.${appRootDomain}`)) {
		tenantSlug = defaultTenantSlug;
	} else if (appRootDomain && host.endsWith(`.${appRootDomain}`)) {
		tenantSlug = host.replace(`.${appRootDomain}`, "");
	} else {
		customDomain = host;
	}

	if (tenantSlug === "www") {
		tenantSlug = defaultTenantSlug;
	}

	if (tenantSlug) {
		const tenant =
			!isProduction
				? await prisma.tenant.upsert({
						where: { slug: tenantSlug },
						update: {},
						create: {
							name: tenantNameFromSlug(tenantSlug),
							slug: tenantSlug,
						},
					})
				: await prisma.tenant.findUnique({
						where: { slug: tenantSlug },
					});

		if (!tenant || tenant.status !== "ACTIVE") {
			return null;
		}

		return {
			id: tenant.id,
			name: tenant.name,
			slug: tenant.slug,
			status: tenant.status,
		};
	}

	if (!customDomain) {
		return null;
	}

	return resolveTenantDomain(customDomain);
}

app.use(logger());
app.use(secureHeaders());
app.use(
	"/*",
	cors({
		origin: (origin) => (isAllowedCorsOrigin(origin) ? origin : ""),
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization", "X-Tenant-Slug"],
		credentials: true,
	}),
);

app.use("*", async (c, next) => {
	const tenant = await resolveTenant(
		c.req.header("host"),
		c.req.header("x-tenant-slug"),
	);
	c.set("tenant", tenant);
	await next();
});

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.post("/api/change-email", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

	const { newEmail, otp } = await c.req.json<{ newEmail: string; otp: string }>();
	if (!newEmail || !otp) return c.json({ error: "newEmail and otp required" }, 400);

	const verification = await prisma.verification.findFirst({
		where: { identifier: newEmail, expiresAt: { gt: new Date() } },
		orderBy: { createdAt: "desc" },
	});
	if (!verification || verification.value !== otp) {
		return c.json({ error: "Invalid or expired code" }, 400);
	}

	const conflict = await prisma.user.findUnique({ where: { email: newEmail } });
	if (conflict && conflict.id !== session.user.id) {
		return c.json({ error: "Email already in use" }, 400);
	}

	await prisma.verification.delete({ where: { id: verification.id } });
	await prisma.user.update({
		where: { id: session.user.id },
		data: { email: newEmail },
	});

	return c.json({ success: true });
});

app.get("/api/lookup-user", async (c) => {
	const phone = c.req.query("phone");
	if (!phone) return c.json({ error: "phone required" }, 400);
	const user = await prisma.user.findUnique({
		where: { phone },
		select: { email: true, username: true },
	});
	if (!user) return c.json({ error: "User not found" }, 404);
	return c.json({ email: user.email, username: user.username });
});

const trpcIndex = (c: Context) => {
	if (process.env.NODE_ENV === "production") {
		return c.notFound();
	}

	return c.json({
		message: "Pickle Power Sports tRPC API",
		usage: "Call a procedure path under /trpc, for example /trpc/healthCheck",
		examples: [
			"/trpc/healthCheck",
			"/trpc/product.getFilters",
			"/trpc/product.list?input=%7B%7D",
			"/trpc/venue.list?input=%7B%7D",
			"/trpc/content.getTestimonials?input=%7B%7D",
		],
	});
};

app.get("/trpc", trpcIndex);
app.get("/trpc/", trpcIndex);

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	}),
);

app.get("/", (c) => {
	return c.text("OK");
});

app.get("/healthz", (c) => {
	return c.json({ status: "ok" });
});

app.get("/readyz", async (c) => {
	await prisma.$queryRaw`SELECT 1`;
	return c.json({ status: "ready" });
});

import { serve } from "@hono/node-server";

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);

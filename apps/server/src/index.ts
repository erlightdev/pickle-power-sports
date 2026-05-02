import type { TenantContext } from "@Pickle-Power-Sports/api/context";
import { createContext } from "@Pickle-Power-Sports/api/context";
import { appRouter } from "@Pickle-Power-Sports/api/routers/index";
import { auth } from "@Pickle-Power-Sports/auth";
import prisma from "@Pickle-Power-Sports/db";
import { env } from "@Pickle-Power-Sports/env/server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

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

async function resolveTenant(
	hostHeader: string | undefined,
): Promise<TenantContext> {
	const host = hostHeader?.split(":")[0]?.toLowerCase();

	if (!host) {
		return null;
	}

	const rootDomain = process.env.ROOT_DOMAIN ?? "picklepowersports.com";
	const defaultTenantSlug =
		process.env.DEFAULT_TENANT_SLUG ?? "picklepowersports";
	const localHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
	let tenantSlug: string | null = null;
	let customDomain: string | null = null;

	if (localHosts.has(host) || host.endsWith(".localhost")) {
		tenantSlug = defaultTenantSlug;
	} else if (host === rootDomain || host === `www.${rootDomain}`) {
		tenantSlug = defaultTenantSlug;
	} else if (host.endsWith(`.${rootDomain}`)) {
		tenantSlug = host.replace(`.${rootDomain}`, "");
	} else {
		customDomain = host;
	}

	if (tenantSlug === "www") {
		tenantSlug = defaultTenantSlug;
	}

	if (tenantSlug) {
		const tenant = await prisma.tenant.upsert({
			where: { slug: tenantSlug },
			update: {},
			create: {
				name: tenantNameFromSlug(tenantSlug),
				slug: tenantSlug,
			},
		});

		return {
			id: tenant.id,
			name: tenant.name,
			slug: tenant.slug,
		};
	}

	if (!customDomain) {
		return null;
	}

	const tenantDomain = await prisma.tenantDomain.findUnique({
		where: { domain: customDomain },
		include: { tenant: true },
	});

	if (!tenantDomain || tenantDomain.tenant.status !== "ACTIVE") {
		return null;
	}

	return {
		id: tenantDomain.tenant.id,
		name: tenantDomain.tenant.name,
		slug: tenantDomain.tenant.slug,
	};
}

app.use(logger());
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.use("*", async (c, next) => {
	const tenant = await resolveTenant(c.req.header("host"));
	c.set("tenant", tenant);
	await next();
});

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

const trpcIndex = (c: { json: (body: unknown) => Response }) =>
	c.json({
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

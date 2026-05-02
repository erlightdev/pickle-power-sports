import { auth } from "@Pickle-Power-Sports/auth";
import prisma from "@Pickle-Power-Sports/db";
import type { Context as HonoContext } from "hono";

import type { TenantRole } from "./auth/roles";

export type TenantContext = {
	id: string;
	slug: string;
	name: string;
	status: "ACTIVE" | "SUSPENDED";
} | null;

export type TenantMembershipContext = {
	id: string | null;
	tenantId: string;
	userId: string;
	role: TenantRole;
	isPlatformAdmin: boolean;
};

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});

	const tenant = (context.get("tenant") as TenantContext | undefined) ?? null;

	return {
		prisma,
		session,
		tenant,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;

import { TRPCError } from "@trpc/server";

import type { Context, TenantMembershipContext } from "../context";
import {
	hasTenantRole,
	isPlatformAdmin,
	type TenantRole,
	type TenantRoleRequirement,
} from "./roles";

export type TenantAccess = {
	user: {
		id: string;
		email: string;
		name: string;
		image: string | null;
		role: string;
	};
	membership: TenantMembershipContext;
	isPlatformAdmin: boolean;
};

export function requireTenant(
	ctx: Pick<Context, "tenant">,
): NonNullable<Context["tenant"]> {
	if (!ctx.tenant) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Tenant not found",
			cause: "Missing tenant",
		});
	}

	return ctx.tenant;
}

export function requireSession(
	ctx: Pick<Context, "session">,
): NonNullable<Context["session"]> {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
			cause: "No session",
		});
	}

	return ctx.session;
}

export async function requireTenantAccess(ctx: Context): Promise<TenantAccess> {
	const tenant = requireTenant(ctx);
	const session = requireSession(ctx);
	const user = await ctx.prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			id: true,
			email: true,
			name: true,
			image: true,
			role: true,
		},
	});

	if (!user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authenticated user no longer exists",
		});
	}

	const platformAdmin = isPlatformAdmin(user.role);
	const membership = await ctx.prisma.tenantMember.findUnique({
		where: {
			tenantId_userId: {
				tenantId: tenant.id,
				userId: user.id,
			},
		},
		select: {
			id: true,
			tenantId: true,
			userId: true,
			role: true,
			createdAt: true,
		},
	});

	if (!membership && !platformAdmin) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You are not a member of this tenant",
		});
	}

	return {
		user,
		isPlatformAdmin: platformAdmin,
		membership: membership
			? {
					id: membership.id,
					tenantId: membership.tenantId,
					userId: membership.userId,
					role: membership.role as TenantRole,
					isPlatformAdmin: platformAdmin,
				}
			: {
					id: null,
					tenantId: tenant.id,
					userId: user.id,
					role: "OWNER",
					isPlatformAdmin: true,
				},
	};
}

export function assertTenantRole(
	membership: TenantMembershipContext,
	allowedRoles: TenantRoleRequirement,
) {
	if (membership.isPlatformAdmin) {
		return;
	}

	if (!hasTenantRole(membership.role, allowedRoles)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have permission to perform this tenant action",
		});
	}
}

import { initTRPC, TRPCError } from "@trpc/server";

import { requireTenant, requireTenantAccess } from "./auth/access";
import type { TenantRoleRequirement } from "./auth/roles";
import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const tenantProcedure = publicProcedure.use(({ ctx, next }) => {
	const tenant = requireTenant(ctx);

	return next({
		ctx: {
			...ctx,
			tenant,
		},
	});
});

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
			cause: "No session",
		});
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});

export const protectedTenantProcedure = protectedProcedure.use(
	async ({ ctx, next }) => {
		const tenant = requireTenant(ctx);
		const access = await requireTenantAccess(ctx);

		return next({
			ctx: {
				...ctx,
				tenant,
				tenantMembership: access.membership,
				user: access.user,
			},
		});
	},
);

export function tenantRoleProcedure(allowedRoles: TenantRoleRequirement) {
	return protectedTenantProcedure.use(({ ctx, next }) => {
		if (
			!ctx.tenantMembership.isPlatformAdmin &&
			!allowedRoles.includes(ctx.tenantMembership.role)
		) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "You do not have permission to perform this tenant action",
			});
		}

		return next({ ctx });
	});
}

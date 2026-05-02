import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { type TenantRole, tenantAdminRoles, tenantRoles } from "../auth/roles";
import {
	protectedProcedure,
	protectedTenantProcedure,
	router,
	tenantProcedure,
	tenantRoleProcedure,
} from "../index";
import { slugify } from "../lib/inputs";

const tenantRoleInput = z.enum(tenantRoles);

function assertCanAssignRole(currentRole: TenantRole, nextRole: TenantRole) {
	if (currentRole === "OWNER") {
		return;
	}

	if (nextRole === "OWNER") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only tenant owners can assign the owner role",
		});
	}
}

export const tenantRouter = router({
	current: tenantProcedure.query(({ ctx }) => ctx.tenant),

	myAccess: protectedTenantProcedure.query(({ ctx }) => ({
		tenant: ctx.tenant,
		user: ctx.user,
		membership: ctx.tenantMembership,
	})),

	listMyTenants: protectedProcedure.query(async ({ ctx }) => {
		const user = await ctx.prisma.user.findUnique({
			where: { id: ctx.session.user.id },
			select: { role: true },
		});

		if (user?.role === "ADMIN") {
			return ctx.prisma.tenant.findMany({
				orderBy: { createdAt: "desc" },
			});
		}

		return ctx.prisma.tenantMember.findMany({
			where: { userId: ctx.session.user.id },
			include: { tenant: true },
			orderBy: { createdAt: "desc" },
		});
	}),

	joinCurrent: protectedProcedure.mutation(async ({ ctx }) => {
		if (!ctx.tenant) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Tenant not found",
			});
		}

		const existing = await ctx.prisma.tenantMember.findUnique({
			where: {
				tenantId_userId: {
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
				},
			},
			include: {
				tenant: true,
				user: true,
			},
		});

		if (existing) {
			return existing;
		}

		const memberCount = await ctx.prisma.tenantMember.count({
			where: { tenantId: ctx.tenant.id },
		});

		if (memberCount > 0) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message:
					"Tenant membership is invite-only after the first owner is created",
			});
		}

		return ctx.prisma.tenantMember.create({
			data: {
				tenantId: ctx.tenant.id,
				userId: ctx.session.user.id,
				role: "OWNER",
			},
			include: {
				tenant: true,
				user: true,
			},
		});
	}),

	listMembers: tenantRoleProcedure(tenantAdminRoles).query(({ ctx }) =>
		ctx.prisma.tenantMember.findMany({
			where: { tenantId: ctx.tenant.id },
			include: { user: true },
			orderBy: [{ role: "asc" }, { createdAt: "asc" }],
		}),
	),

	addMember: tenantRoleProcedure(tenantAdminRoles)
		.input(
			z.object({
				email: z.string().email(),
				role: tenantRoleInput.default("MEMBER"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertCanAssignRole(ctx.tenantMembership.role, input.role);

			const user = await ctx.prisma.user.findUnique({
				where: { email: input.email.toLowerCase() },
			});

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User must sign up before they can be added to a tenant",
				});
			}

			return ctx.prisma.tenantMember.upsert({
				where: {
					tenantId_userId: {
						tenantId: ctx.tenant.id,
						userId: user.id,
					},
				},
				create: {
					tenantId: ctx.tenant.id,
					userId: user.id,
					role: input.role,
				},
				update: {
					role: input.role,
				},
				include: {
					user: true,
					tenant: true,
				},
			});
		}),

	updateMemberRole: tenantRoleProcedure(tenantAdminRoles)
		.input(
			z.object({
				memberId: z.string(),
				role: tenantRoleInput,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertCanAssignRole(ctx.tenantMembership.role, input.role);

			const member = await ctx.prisma.tenantMember.findFirst({
				where: {
					id: input.memberId,
					tenantId: ctx.tenant.id,
				},
			});

			if (!member) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Tenant member not found",
				});
			}

			if (member.role === "OWNER" && input.role !== "OWNER") {
				const ownerCount = await ctx.prisma.tenantMember.count({
					where: {
						tenantId: ctx.tenant.id,
						role: "OWNER",
					},
				});

				if (ownerCount <= 1) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "A tenant must keep at least one owner",
					});
				}
			}

			return ctx.prisma.tenantMember.update({
				where: { id: member.id },
				data: { role: input.role },
				include: {
					user: true,
					tenant: true,
				},
			});
		}),

	removeMember: tenantRoleProcedure(tenantAdminRoles)
		.input(z.object({ memberId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.prisma.tenantMember.findFirst({
				where: {
					id: input.memberId,
					tenantId: ctx.tenant.id,
				},
			});

			if (!member) {
				return { removed: false };
			}

			if (member.userId === ctx.session.user.id) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You cannot remove your own tenant membership",
				});
			}

			if (member.role === "OWNER") {
				const ownerCount = await ctx.prisma.tenantMember.count({
					where: {
						tenantId: ctx.tenant.id,
						role: "OWNER",
					},
				});

				if (ownerCount <= 1) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "A tenant must keep at least one owner",
					});
				}
			}

			await ctx.prisma.tenantMember.delete({ where: { id: member.id } });
			return { removed: true };
		}),

	updateCurrent: tenantRoleProcedure(tenantAdminRoles)
		.input(
			z.object({
				name: z.string().trim().min(2).optional(),
				slug: z.string().trim().min(2).optional(),
				logoUrl: z.string().url().nullable().optional(),
				brandColor: z.string().trim().nullable().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (input.slug && ctx.tenantMembership.role !== "OWNER") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only tenant owners can change tenant slug",
				});
			}

			return ctx.prisma.tenant.update({
				where: { id: ctx.tenant.id },
				data: {
					name: input.name,
					slug: input.slug ? slugify(input.slug) : undefined,
					logoUrl: input.logoUrl,
					brandColor: input.brandColor,
				},
			});
		}),

	addDomain: tenantRoleProcedure(tenantAdminRoles)
		.input(
			z.object({
				domain: z.string().trim().min(3),
				type: z.enum(["SUBDOMAIN", "CUSTOM"]),
			}),
		)
		.mutation(({ ctx, input }) =>
			ctx.prisma.tenantDomain.create({
				data: {
					tenantId: ctx.tenant.id,
					domain: input.domain.toLowerCase(),
					type: input.type,
				},
			}),
		),
});

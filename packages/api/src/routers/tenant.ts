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
const domainTypeInput = z.enum(["SUBDOMAIN", "CUSTOM"]);

function rootDomain() {
	return process.env.ROOT_DOMAIN ?? (process.env.NODE_ENV === "production" ? null : "localhost");
}

function tenantNameFromSlug(slug: string) {
	return slug
		.split("-")
		.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
		.join(" ");
}

function normalizeTenantDomain(domain: string, type: "SUBDOMAIN" | "CUSTOM") {
	const value = domain.trim().toLowerCase();

	if (type === "CUSTOM") {
		return value.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
	}

	const label = slugify(value.split(".")[0] ?? "");
	if (!label) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Subdomain name is required",
		});
	}

	const configuredRootDomain = rootDomain();
	if (!configuredRootDomain) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "ROOT_DOMAIN must be configured before adding subdomains",
		});
	}

	return `${label}.${configuredRootDomain}`;
}

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

	settings: tenantRoleProcedure(tenantAdminRoles).query(async ({ ctx }) => {
		const tenant = await ctx.prisma.tenant.findUnique({
			where: { id: ctx.tenant.id },
			include: {
				domains: ctx.tenantMembership.isPlatformAdmin
					? false
					: {
							orderBy: [{ type: "asc" }, { createdAt: "asc" }],
						},
			},
		});

		if (!tenant) {
			return null;
		}

		if (!ctx.tenantMembership.isPlatformAdmin) {
			return { ...tenant, rootDomain: rootDomain() };
		}

		const domains = await ctx.prisma.tenantDomain.findMany({
			include: {
				tenant: {
					select: {
						id: true,
						name: true,
						slug: true,
						status: true,
					},
				},
			},
			orderBy: [{ type: "asc" }, { createdAt: "desc" }],
		});

		return { ...tenant, domains, rootDomain: rootDomain() };
	}),

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
		const tenant = ctx.tenant;

		if (!tenant) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Tenant not found",
			});
		}

		const existing = await ctx.prisma.tenantMember.findUnique({
			where: {
				tenantId_userId: {
					tenantId: tenant.id,
					userId: ctx.session.user.id,
				},
			},
			include: {
				tenant: true,
				user: true,
			},
		});

		if (existing) {
			const [memberCount, ownerCount] = await Promise.all([
				ctx.prisma.tenantMember.count({
					where: { tenantId: tenant.id },
				}),
				ctx.prisma.tenantMember.count({
					where: { tenantId: tenant.id, role: "OWNER" },
				}),
			]);

			if (memberCount === 1 && ownerCount === 0 && existing.role !== "OWNER") {
				return ctx.prisma.tenantMember.update({
					where: { id: existing.id },
					data: { role: "OWNER" },
					include: {
						tenant: true,
						user: true,
					},
				});
			}

			return existing;
		}

		const memberCount = await ctx.prisma.tenantMember.count({
			where: { tenantId: tenant.id },
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
				tenantId: tenant.id,
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

	listRegisteredUsers: tenantRoleProcedure(tenantAdminRoles).query(({ ctx }) => {
		const tenantMembershipFilter = {
			tenantMemberships: {
				some: { tenantId: ctx.tenant.id },
			},
		};

		return ctx.prisma.user.findMany({
			where: ctx.tenantMembership.isPlatformAdmin
				? undefined
				: tenantMembershipFilter,
			select: {
				id: true,
				name: true,
				email: true,
				emailVerified: true,
				image: true,
				role: true,
				createdAt: true,
				tenantMemberships: {
					where: { tenantId: ctx.tenant.id },
					select: {
						id: true,
						role: true,
						createdAt: true,
					},
					take: 1,
				},
			},
			orderBy: { createdAt: "desc" },
		});
	}),

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
				type: domainTypeInput,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const normalizedDomain = normalizeTenantDomain(input.domain, input.type);
			const existing = await ctx.prisma.tenantDomain.findUnique({
				where: { domain: normalizedDomain },
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Domain is already in use",
				});
			}

			if (input.type === "SUBDOMAIN") {
				if (!ctx.tenantMembership.isPlatformAdmin) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only system admins can create tenant subdomains",
					});
				}

				const configuredRootDomain = rootDomain();
				if (!configuredRootDomain) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "ROOT_DOMAIN must be configured before adding subdomains",
					});
				}

				const tenantSlug = slugify(
					normalizedDomain.replace(`.${configuredRootDomain}`, ""),
				);

				if (!tenantSlug) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Subdomain name is required",
					});
				}

				const existingTenant = await ctx.prisma.tenant.findUnique({
					where: { slug: tenantSlug },
					include: {
						domains: true,
						members: true,
					},
				});

				if (existingTenant) {
					if (existingTenant.domains.length > 0) {
						throw new TRPCError({
							code: "CONFLICT",
							message: "Tenant slug is already connected to another domain",
						});
					}

					if (existingTenant.members.length > 0) {
						throw new TRPCError({
							code: "CONFLICT",
							message:
								"Tenant slug already exists with members. Delete or rename that tenant first.",
						});
					}

					return ctx.prisma.$transaction(async (tx) => {
						await tx.tenant.update({
							where: { id: existingTenant.id },
							data: {
								primaryDomain: normalizedDomain,
								status: "ACTIVE",
							},
						});

						return tx.tenantDomain.create({
							data: {
								tenantId: existingTenant.id,
								domain: normalizedDomain,
								type: input.type,
							},
						});
					});
				}

				return ctx.prisma.$transaction(async (tx) => {
					const tenant = await tx.tenant.create({
						data: {
							name: tenantNameFromSlug(tenantSlug),
							slug: tenantSlug,
							primaryDomain: normalizedDomain,
						},
					});

					return tx.tenantDomain.create({
						data: {
							tenantId: tenant.id,
							domain: normalizedDomain,
							type: input.type,
						},
					});
				});
			}

			return ctx.prisma.tenantDomain.create({
				data: {
					tenantId: ctx.tenant.id,
					domain: normalizedDomain,
					type: input.type,
				},
			});
		}),

	deleteTenantForDomain: tenantRoleProcedure(tenantAdminRoles)
		.input(
			z.object({
				domainId: z.string(),
				confirmDomain: z.string().trim().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (
				!ctx.tenantMembership.isPlatformAdmin &&
				ctx.tenantMembership.role !== "OWNER"
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only tenant owners can delete tenant data",
				});
			}

			const domain = await ctx.prisma.tenantDomain.findFirst({
				where: {
					id: input.domainId,
					...(ctx.tenantMembership.isPlatformAdmin
						? {}
						: { tenantId: ctx.tenant.id }),
				},
			});

			if (!domain) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Domain not found",
				});
			}

			if (input.confirmDomain.toLowerCase() !== domain.domain.toLowerCase()) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Domain confirmation did not match",
				});
			}

			await ctx.prisma.tenant.delete({ where: { id: ctx.tenant.id } });
			return { deleted: true, domain: domain.domain };
		}),
});

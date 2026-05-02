import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedTenantProcedure, router, tenantProcedure } from "../index";
import { slugify } from "../lib/inputs";

export const clubRouter = router({
	register: protectedTenantProcedure
		.input(
			z.object({
				name: z.string().trim().min(2),
				slug: z.string().optional(),
				code: z.string().trim().min(3).max(20),
				location: z.string().optional(),
				logoUrl: z.string().url().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const slug = input.slug ? slugify(input.slug) : slugify(input.name);
			const code = input.code.toUpperCase();
			const existing = await ctx.prisma.club.findFirst({
				where: {
					tenantId: ctx.tenant.id,
					OR: [{ slug }, { code }],
				},
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "A club with this slug or code already exists",
				});
			}

			return ctx.prisma.club.create({
				data: {
					tenantId: ctx.tenant.id,
					name: input.name,
					slug,
					code,
					location: input.location,
					logoUrl: input.logoUrl,
				},
			});
		}),

	validateCode: tenantProcedure
		.input(z.object({ code: z.string().trim().min(2) }))
		.query(async ({ ctx, input }) => {
			const club = await ctx.prisma.club.findFirst({
				where: {
					tenantId: ctx.tenant.id,
					code: input.code.toUpperCase(),
					isActive: true,
				},
			});

			return {
				valid: Boolean(club),
				club,
			};
		}),

	getTransactions: protectedTenantProcedure
		.input(
			z.object({
				clubId: z.string().optional(),
				limit: z.number().int().min(1).max(100).default(25),
			}),
		)
		.query(({ ctx, input }) =>
			ctx.prisma.clubTransaction.findMany({
				where: {
					tenantId: ctx.tenant.id,
					clubId: input.clubId,
					userId: ctx.session.user.id,
				},
				include: {
					club: true,
					order: true,
				},
				orderBy: { createdAt: "desc" },
				take: input.limit,
			}),
		),

	getLeaderboard: tenantProcedure
		.input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
		.query(({ ctx, input }) =>
			ctx.prisma.club.findMany({
				where: {
					tenantId: ctx.tenant.id,
					isActive: true,
				},
				orderBy: [{ totalEarned: "desc" }, { memberCount: "desc" }],
				take: input.limit,
			}),
		),
});

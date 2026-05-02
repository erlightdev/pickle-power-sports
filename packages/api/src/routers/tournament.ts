import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedTenantProcedure, router, tenantProcedure } from "../index";
import {
	money,
	tournamentFormatInput,
	tournamentStatusInput,
} from "../lib/inputs";

const tournamentInclude = {
	venue: true,
	_count: {
		select: {
			registrations: true,
		},
	},
};

export const tournamentRouter = router({
	list: tenantProcedure
		.input(
			z.object({
				status: tournamentStatusInput.optional(),
				format: tournamentFormatInput.optional(),
				featured: z.boolean().optional(),
				upcomingOnly: z.boolean().default(true),
				limit: z.number().int().min(1).max(50).default(20),
				offset: z.number().int().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			const where = {
				tenantId: ctx.tenant.id,
				status: input.status,
				format: input.format,
				isFeatured: input.featured ? true : undefined,
				endDate: input.upcomingOnly ? { gte: new Date() } : undefined,
			};

			const [items, total] = await Promise.all([
				ctx.prisma.tournament.findMany({
					where,
					include: tournamentInclude,
					orderBy: { startDate: "asc" },
					take: input.limit,
					skip: input.offset,
				}),
				ctx.prisma.tournament.count({ where }),
			]);

			return {
				items,
				total,
				limit: input.limit,
				offset: input.offset,
			};
		}),

	getBySlug: tenantProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			const tournament = await ctx.prisma.tournament.findFirst({
				where: {
					tenantId: ctx.tenant.id,
					slug: input.slug,
				},
				include: {
					...tournamentInclude,
					registrations: {
						where: { status: { in: ["CONFIRMED", "PENDING", "WAITLIST"] } },
						include: {
							user: true,
							partner: true,
						},
						orderBy: { registeredAt: "asc" },
					},
				},
			});

			if (!tournament) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Tournament not found",
				});
			}

			return tournament;
		}),

	register: protectedTenantProcedure
		.input(
			z.object({
				tournamentId: z.string(),
				partnerId: z.string().optional(),
				skillLevel: z.string().optional(),
				duprRating: z.number().min(0).max(8).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const tournament = await ctx.prisma.tournament.findFirst({
				where: {
					id: input.tournamentId,
					tenantId: ctx.tenant.id,
				},
			});

			if (!tournament) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Tournament not found",
				});
			}

			const now = new Date();

			if (
				tournament.registrationOpenDate &&
				tournament.registrationOpenDate > now
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Registration is not open yet",
				});
			}

			if (
				tournament.registrationCloseDate &&
				tournament.registrationCloseDate < now
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Registration is closed",
				});
			}

			if (
				tournament.spotsRemaining !== null &&
				tournament.spotsRemaining !== undefined &&
				tournament.spotsRemaining <= 0
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Tournament is full",
				});
			}

			const existing = await ctx.prisma.tournamentRegistration.findFirst({
				where: {
					tenantId: ctx.tenant.id,
					tournamentId: tournament.id,
					userId: ctx.session.user.id,
					status: { not: "CANCELLED" },
				},
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "You are already registered for this tournament",
				});
			}

			return ctx.prisma.$transaction(async (tx) => {
				if (
					tournament.spotsRemaining !== null &&
					tournament.spotsRemaining !== undefined
				) {
					await tx.tournament.update({
						where: { id: tournament.id },
						data: { spotsRemaining: { decrement: 1 } },
					});
				}

				return tx.tournamentRegistration.create({
					data: {
						tenantId: ctx.tenant.id,
						tournamentId: tournament.id,
						userId: ctx.session.user.id,
						partnerId: input.partnerId,
						status: "CONFIRMED",
						skillLevel: input.skillLevel,
						duprRating: input.duprRating,
						entryFeePaid: money(tournament.entryFee),
						paymentStatus: "PENDING",
					},
					include: {
						tournament: {
							include: {
								venue: true,
							},
						},
						partner: true,
					},
				});
			});
		}),

	cancelRegistration: protectedTenantProcedure
		.input(z.object({ registrationId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const registration = await ctx.prisma.tournamentRegistration.findFirst({
				where: {
					id: input.registrationId,
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
					status: { not: "CANCELLED" },
				},
				include: { tournament: true },
			});

			if (!registration) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Registration not found",
				});
			}

			return ctx.prisma.$transaction(async (tx) => {
				if (
					registration.tournament.spotsRemaining !== null &&
					registration.tournament.spotsRemaining !== undefined
				) {
					await tx.tournament.update({
						where: { id: registration.tournamentId },
						data: { spotsRemaining: { increment: 1 } },
					});
				}

				return tx.tournamentRegistration.update({
					where: { id: registration.id },
					data: { status: "CANCELLED" },
					include: {
						tournament: {
							include: {
								venue: true,
							},
						},
					},
				});
			});
		}),

	getMyRegistrations: protectedTenantProcedure
		.input(
			z.object({
				upcomingOnly: z.boolean().default(true),
				limit: z.number().int().min(1).max(50).default(20),
			}),
		)
		.query(({ ctx, input }) =>
			ctx.prisma.tournamentRegistration.findMany({
				where: {
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
					tournament: input.upcomingOnly
						? { endDate: { gte: new Date() } }
						: undefined,
				},
				include: {
					tournament: {
						include: {
							venue: true,
						},
					},
					partner: true,
				},
				orderBy: { registeredAt: "desc" },
				take: input.limit,
			}),
		),

	getLeaderboard: tenantProcedure
		.input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
		.query(({ ctx, input }) =>
			ctx.prisma.tournament.findMany({
				where: {
					tenantId: ctx.tenant.id,
					status: "COMPLETED",
				},
				include: tournamentInclude,
				orderBy: [{ startDate: "desc" }],
				take: input.limit,
			}),
		),
});

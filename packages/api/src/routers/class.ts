import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedTenantProcedure, router, tenantProcedure } from "../index";
import {
	classTypeInput,
	money,
	roundMoney,
	skillLevelInput,
} from "../lib/inputs";

const classInclude = {
	coach: true,
	venue: true,
	sessions: {
		where: {
			startTime: { gte: new Date() },
			isCancelled: false,
		},
		include: {
			venue: true,
			court: true,
		},
		orderBy: { startTime: "asc" as const },
		take: 5,
	},
};

export const classRouter = router({
	list: tenantProcedure
		.input(
			z.object({
				skillLevel: skillLevelInput.optional(),
				type: classTypeInput.optional(),
				coachId: z.string().optional(),
				venueId: z.string().optional(),
				limit: z.number().int().min(1).max(50).default(20),
				offset: z.number().int().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			const where = {
				tenantId: ctx.tenant.id,
				isActive: true,
				skillLevel: input.skillLevel,
				type: input.type,
				coachId: input.coachId,
				venueId: input.venueId,
			};

			const [items, total] = await Promise.all([
				ctx.prisma.trainingClass.findMany({
					where,
					include: classInclude,
					orderBy: [{ skillLevel: "asc" }, { title: "asc" }],
					take: input.limit,
					skip: input.offset,
				}),
				ctx.prisma.trainingClass.count({ where }),
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
			const trainingClass = await ctx.prisma.trainingClass.findFirst({
				where: {
					tenantId: ctx.tenant.id,
					slug: input.slug,
				},
				include: {
					...classInclude,
					sessions: {
						where: { startTime: { gte: new Date() } },
						include: {
							venue: true,
							court: true,
							enrollments: true,
						},
						orderBy: { startTime: "asc" },
					},
				},
			});

			if (!trainingClass) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Class not found",
				});
			}

			return trainingClass;
		}),

	getSessions: tenantProcedure
		.input(
			z.object({
				classId: z.string().optional(),
				classSlug: z.string().optional(),
				from: z.string().optional(),
				limit: z.number().int().min(1).max(100).default(20),
			}),
		)
		.query(({ ctx, input }) => {
			const from = input.from ? new Date(input.from) : new Date();

			return ctx.prisma.classSession.findMany({
				where: {
					tenantId: ctx.tenant.id,
					classId: input.classId,
					class: input.classSlug ? { slug: input.classSlug } : undefined,
					startTime: { gte: from },
					isCancelled: false,
				},
				include: {
					class: {
						include: {
							coach: true,
							venue: true,
						},
					},
					venue: true,
					court: true,
				},
				orderBy: { startTime: "asc" },
				take: input.limit,
			});
		}),

	enroll: protectedTenantProcedure
		.input(
			z.object({
				sessionId: z.string(),
				isMember: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const session = await ctx.prisma.classSession.findFirst({
				where: {
					id: input.sessionId,
					tenantId: ctx.tenant.id,
					isCancelled: false,
				},
				include: { class: true },
			});

			if (!session) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Class session not found",
				});
			}

			if (session.spotsRemaining <= 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This class session is full",
				});
			}

			const existing = await ctx.prisma.classEnrollment.findFirst({
				where: {
					tenantId: ctx.tenant.id,
					sessionId: session.id,
					userId: ctx.session.user.id,
					status: "ENROLLED",
				},
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "You are already enrolled in this session",
				});
			}

			const pricePaid = input.isMember
				? Math.max(
						roundMoney(
							money(session.class.pricePerSession) -
								money(session.class.memberDiscount),
						),
						0,
					)
				: money(session.class.pricePerSession);

			return ctx.prisma.$transaction(async (tx) => {
				await tx.classSession.update({
					where: { id: session.id },
					data: { spotsRemaining: { decrement: 1 } },
				});

				return tx.classEnrollment.create({
					data: {
						tenantId: ctx.tenant.id,
						sessionId: session.id,
						userId: ctx.session.user.id,
						pricePaid,
						isMember: input.isMember,
					},
					include: {
						session: {
							include: {
								class: {
									include: {
										coach: true,
										venue: true,
									},
								},
								venue: true,
								court: true,
							},
						},
					},
				});
			});
		}),

	cancelEnrollment: protectedTenantProcedure
		.input(z.object({ enrollmentId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const enrollment = await ctx.prisma.classEnrollment.findFirst({
				where: {
					id: input.enrollmentId,
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
					status: "ENROLLED",
				},
			});

			if (!enrollment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Enrollment not found",
				});
			}

			return ctx.prisma.$transaction(async (tx) => {
				await tx.classSession.update({
					where: { id: enrollment.sessionId },
					data: { spotsRemaining: { increment: 1 } },
				});

				return tx.classEnrollment.update({
					where: { id: enrollment.id },
					data: { status: "CANCELLED" },
					include: {
						session: {
							include: {
								class: {
									include: {
										coach: true,
										venue: true,
									},
								},
								venue: true,
								court: true,
							},
						},
					},
				});
			});
		}),

	getMyEnrollments: protectedTenantProcedure
		.input(
			z.object({
				upcomingOnly: z.boolean().default(true),
				limit: z.number().int().min(1).max(50).default(20),
			}),
		)
		.query(({ ctx, input }) =>
			ctx.prisma.classEnrollment.findMany({
				where: {
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
					status: "ENROLLED",
					session: input.upcomingOnly
						? { startTime: { gte: new Date() } }
						: undefined,
				},
				include: {
					session: {
						include: {
							class: {
								include: {
									coach: true,
									venue: true,
								},
							},
							venue: true,
							court: true,
						},
					},
				},
				orderBy: { enrolledAt: "desc" },
				take: input.limit,
			}),
		),

	getCoaches: tenantProcedure.query(({ ctx }) =>
		ctx.prisma.coach.findMany({
			where: {
				tenantId: ctx.tenant.id,
				isActive: true,
			},
			orderBy: { name: "asc" },
		}),
	),
});

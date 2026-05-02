import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedTenantProcedure, router } from "../index";
import { skillLevelInput } from "../lib/inputs";

const wishlistInclude = {
	product: {
		include: {
			brand: true,
			category: true,
			images: { orderBy: { sortOrder: "asc" as const } },
		},
	},
};

const preferenceValue = z.union([
	z.string(),
	z.number(),
	z.boolean(),
	z.null(),
	z.array(z.string()),
]);

export const userRouter = router({
	getProfile: protectedTenantProcedure.query(({ ctx }) =>
		ctx.prisma.user.findUnique({
			where: { id: ctx.session.user.id },
			include: {
				tenantMemberships: {
					where: { tenantId: ctx.tenant.id },
					include: { tenant: true },
				},
				coachProfile: true,
			},
		}),
	),

	updateProfile: protectedTenantProcedure
		.input(
			z.object({
				name: z.string().min(1).optional(),
				phone: z.string().optional(),
				image: z.string().url().optional(),
				duprRating: z.number().min(0).max(8).optional(),
				skillLevel: skillLevelInput.optional(),
				preferences: z.record(z.string(), preferenceValue).optional(),
			}),
		)
		.mutation(({ ctx, input }) =>
			ctx.prisma.user.update({
				where: { id: ctx.session.user.id },
				data: {
					name: input.name,
					phone: input.phone,
					image: input.image,
					duprRating: input.duprRating,
					skillLevel: input.skillLevel,
					preferences: input.preferences,
				},
			}),
		),

	getWishlist: protectedTenantProcedure.query(({ ctx }) =>
		ctx.prisma.wishlist.findMany({
			where: {
				tenantId: ctx.tenant.id,
				userId: ctx.session.user.id,
			},
			include: wishlistInclude,
			orderBy: { createdAt: "desc" },
		}),
	),

	addToWishlist: protectedTenantProcedure
		.input(z.object({ productId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const product = await ctx.prisma.product.findFirst({
				where: {
					id: input.productId,
					tenantId: ctx.tenant.id,
				},
			});

			if (!product) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Product not found",
				});
			}

			const existing = await ctx.prisma.wishlist.findFirst({
				where: {
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
					productId: product.id,
				},
				include: wishlistInclude,
			});

			if (existing) {
				return existing;
			}

			return ctx.prisma.wishlist.create({
				data: {
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
					productId: product.id,
				},
				include: wishlistInclude,
			});
		}),

	removeFromWishlist: protectedTenantProcedure
		.input(
			z
				.object({
					wishlistId: z.string().optional(),
					productId: z.string().optional(),
				})
				.refine((value) => value.wishlistId || value.productId, {
					message: "wishlistId or productId is required",
				}),
		)
		.mutation(async ({ ctx, input }) => {
			const wishlist = await ctx.prisma.wishlist.findFirst({
				where: {
					id: input.wishlistId,
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
					productId: input.productId,
				},
			});

			if (!wishlist) {
				return { removed: false };
			}

			await ctx.prisma.wishlist.delete({ where: { id: wishlist.id } });
			return { removed: true };
		}),

	getDashboard: protectedTenantProcedure.query(async ({ ctx }) => {
		const [
			orders,
			courtBookings,
			classEnrollments,
			tournamentRegistrations,
			wishlist,
		] = await Promise.all([
			ctx.prisma.order.findMany({
				where: {
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
				},
				include: {
					items: {
						include: {
							product: true,
						},
					},
				},
				orderBy: { createdAt: "desc" },
				take: 5,
			}),
			ctx.prisma.courtBooking.findMany({
				where: {
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
					startTime: { gte: new Date() },
				},
				include: {
					court: {
						include: {
							venue: true,
						},
					},
				},
				orderBy: { startTime: "asc" },
				take: 5,
			}),
			ctx.prisma.classEnrollment.findMany({
				where: {
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
					status: "ENROLLED",
					session: {
						startTime: { gte: new Date() },
					},
				},
				include: {
					session: {
						include: {
							class: true,
							venue: true,
							court: true,
						},
					},
				},
				orderBy: { enrolledAt: "desc" },
				take: 5,
			}),
			ctx.prisma.tournamentRegistration.findMany({
				where: {
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
					tournament: {
						endDate: { gte: new Date() },
					},
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
				take: 5,
			}),
			ctx.prisma.wishlist.findMany({
				where: {
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
				},
				include: wishlistInclude,
				orderBy: { createdAt: "desc" },
				take: 8,
			}),
		]);

		return {
			orders,
			courtBookings,
			classEnrollments,
			tournamentRegistrations,
			wishlist,
		};
	}),
});

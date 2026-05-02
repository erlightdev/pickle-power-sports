import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedTenantProcedure, router, tenantProcedure } from "../index";
import { money } from "../lib/inputs";

const reviewTargetInput = z.object({
	productId: z.string().optional(),
	productSlug: z.string().optional(),
	venueId: z.string().optional(),
	venueSlug: z.string().optional(),
});

async function refreshProductSummary(
	ctx: { prisma: typeof import("@Pickle-Power-Sports/db").default },
	productId: string,
) {
	const aggregate = await ctx.prisma.review.aggregate({
		where: {
			productId,
			isApproved: true,
		},
		_avg: { rating: true },
		_count: { rating: true },
	});

	await ctx.prisma.product.update({
		where: { id: productId },
		data: {
			rating: money(aggregate._avg.rating).toFixed(1),
			reviewCount: aggregate._count.rating,
		},
	});
}

async function refreshVenueSummary(
	ctx: { prisma: typeof import("@Pickle-Power-Sports/db").default },
	venueId: string,
) {
	const aggregate = await ctx.prisma.review.aggregate({
		where: {
			venueId,
			isApproved: true,
		},
		_avg: { rating: true },
		_count: { rating: true },
	});

	await ctx.prisma.venue.update({
		where: { id: venueId },
		data: {
			rating: money(aggregate._avg.rating).toFixed(1),
			reviewCount: aggregate._count.rating,
		},
	});
}

export const reviewRouter = router({
	list: tenantProcedure
		.input(
			reviewTargetInput.extend({
				limit: z.number().int().min(1).max(50).default(20),
				offset: z.number().int().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			const where = {
				tenantId: ctx.tenant.id,
				isApproved: true,
				productId: input.productId,
				venueId: input.venueId,
				product: input.productSlug
					? { is: { slug: input.productSlug } }
					: undefined,
				venue: input.venueSlug ? { is: { slug: input.venueSlug } } : undefined,
			};
			const [items, total] = await Promise.all([
				ctx.prisma.review.findMany({
					where,
					include: {
						user: true,
						product: true,
						venue: true,
					},
					orderBy: { createdAt: "desc" },
					take: input.limit,
					skip: input.offset,
				}),
				ctx.prisma.review.count({ where }),
			]);

			return {
				items,
				total,
				limit: input.limit,
				offset: input.offset,
			};
		}),

	create: protectedTenantProcedure
		.input(
			z
				.object({
					productId: z.string().optional(),
					venueId: z.string().optional(),
					rating: z.number().int().min(1).max(5),
					title: z.string().max(255).optional(),
					content: z.string().max(5000).optional(),
					duprRating: z.number().min(0).max(8).optional(),
				})
				.refine(
					(value) => Boolean(value.productId) !== Boolean(value.venueId),
					{
						message: "Review must target exactly one product or venue",
					},
				),
		)
		.mutation(async ({ ctx, input }) => {
			const product = input.productId
				? await ctx.prisma.product.findFirst({
						where: {
							id: input.productId,
							tenantId: ctx.tenant.id,
						},
					})
				: null;
			const venue = input.venueId
				? await ctx.prisma.venue.findFirst({
						where: {
							id: input.venueId,
							tenantId: ctx.tenant.id,
						},
					})
				: null;

			if (input.productId && !product) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Product not found",
				});
			}

			if (input.venueId && !venue) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Venue not found",
				});
			}

			const verifiedPurchase = product
				? Boolean(
						await ctx.prisma.orderItem.findFirst({
							where: {
								productId: product.id,
								order: {
									tenantId: ctx.tenant.id,
									userId: ctx.session.user.id,
									status: {
										in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"],
									},
								},
							},
						}),
					)
				: false;

			const review = await ctx.prisma.review.create({
				data: {
					tenantId: ctx.tenant.id,
					productId: product?.id,
					venueId: venue?.id,
					userId: ctx.session.user.id,
					authorName: ctx.session.user.name,
					authorAvatar: ctx.session.user.image,
					rating: input.rating,
					title: input.title,
					content: input.content,
					duprRating: input.duprRating,
					verifiedPurchase,
				},
				include: {
					user: true,
					product: true,
					venue: true,
				},
			});

			if (product) {
				await refreshProductSummary(ctx, product.id);
			}

			if (venue) {
				await refreshVenueSummary(ctx, venue.id);
			}

			return review;
		}),

	markHelpful: tenantProcedure
		.input(z.object({ reviewId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const review = await ctx.prisma.review.findFirst({
				where: {
					id: input.reviewId,
					tenantId: ctx.tenant.id,
					isApproved: true,
				},
			});

			if (!review) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Review not found",
				});
			}

			return ctx.prisma.review.update({
				where: { id: review.id },
				data: { helpfulCount: { increment: 1 } },
			});
		}),

	getSummary: tenantProcedure
		.input(reviewTargetInput.default({}))
		.query(async ({ ctx, input }) => {
			const where = {
				tenantId: ctx.tenant.id,
				isApproved: true,
				productId: input.productId,
				venueId: input.venueId,
				product: input.productSlug
					? { is: { slug: input.productSlug } }
					: undefined,
				venue: input.venueSlug ? { is: { slug: input.venueSlug } } : undefined,
			};
			const [aggregate, reviews] = await Promise.all([
				ctx.prisma.review.aggregate({
					where,
					_avg: { rating: true },
					_count: { rating: true },
				}),
				ctx.prisma.review.findMany({
					where,
					select: { rating: true },
				}),
			]);
			const distribution = [1, 2, 3, 4, 5].map((rating) => ({
				rating,
				count: reviews.filter((review) => review.rating === rating).length,
			}));

			return {
				average: aggregate._avg.rating ?? 0,
				count: aggregate._count.rating,
				distribution,
			};
		}),
});

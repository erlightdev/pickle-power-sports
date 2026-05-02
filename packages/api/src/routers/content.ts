import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { router, tenantProcedure } from "../index";
import { articleTypeInput, skillLevelInput } from "../lib/inputs";

export const contentRouter = router({
	getStaffPicks: tenantProcedure
		.input(
			z.object({
				limit: z.number().int().min(1).max(24).default(6),
				activeOnly: z.boolean().default(true),
			}),
		)
		.query(({ ctx, input }) =>
			ctx.prisma.staffPick.findMany({
				where: {
					tenantId: ctx.tenant.id,
					isActive: input.activeOnly ? true : undefined,
				},
				include: {
					product: {
						include: {
							brand: true,
							category: true,
							images: { orderBy: { sortOrder: "asc" } },
						},
					},
				},
				orderBy: [{ sortOrder: "asc" }, { monthYear: "desc" }],
				take: input.limit,
			}),
		),

	getArticles: tenantProcedure
		.input(
			z.object({
				type: articleTypeInput.optional(),
				featured: z.boolean().optional(),
				query: z.string().trim().optional(),
				limit: z.number().int().min(1).max(50).default(12),
				offset: z.number().int().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			const where = {
				tenantId: ctx.tenant.id,
				type: input.type,
				isFeatured: input.featured ? true : undefined,
				OR: input.query
					? [
							{ title: { contains: input.query } },
							{ subtitle: { contains: input.query } },
							{ excerpt: { contains: input.query } },
						]
					: [{ publishedAt: { lte: new Date() } }, { publishedAt: null }],
			};
			const [items, total] = await Promise.all([
				ctx.prisma.article.findMany({
					where,
					include: { author: true },
					orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
					take: input.limit,
					skip: input.offset,
				}),
				ctx.prisma.article.count({ where }),
			]);

			return {
				items,
				total,
				limit: input.limit,
				offset: input.offset,
			};
		}),

	getArticle: tenantProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			const article = await ctx.prisma.article.findFirst({
				where: {
					tenantId: ctx.tenant.id,
					slug: input.slug,
				},
				include: { author: true },
			});

			if (!article) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Article not found",
				});
			}

			return article;
		}),

	getTestimonials: tenantProcedure
		.input(
			z.object({
				limit: z.number().int().min(1).max(50).default(12),
			}),
		)
		.query(({ ctx, input }) =>
			ctx.prisma.testimonial.findMany({
				where: {
					tenantId: ctx.tenant.id,
					isActive: true,
				},
				orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
				take: input.limit,
			}),
		),

	subscribeNewsletter: tenantProcedure
		.input(
			z.object({
				email: z.string().email(),
				skillLevel: skillLevelInput.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.prisma.newsletterSubscriber.findFirst({
				where: {
					tenantId: ctx.tenant.id,
					email: input.email.toLowerCase(),
				},
			});

			if (existing) {
				return ctx.prisma.newsletterSubscriber.update({
					where: { id: existing.id },
					data: {
						isActive: true,
						skillLevel: input.skillLevel,
					},
				});
			}

			return ctx.prisma.newsletterSubscriber.create({
				data: {
					tenantId: ctx.tenant.id,
					email: input.email.toLowerCase(),
					skillLevel: input.skillLevel,
				},
			});
		}),
});

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { router, tenantProcedure } from "../index";
import { paginationInput, skillLevelInput } from "../lib/inputs";

const productInclude = {
	brand: true,
	category: true,
	images: { orderBy: { sortOrder: "asc" as const } },
	tags: { include: { tag: true } },
};

const productListInput = paginationInput.extend({
	categorySlug: z.string().optional(),
	brandSlug: z.string().optional(),
	skillLevel: skillLevelInput.optional(),
	minPrice: z.number().min(0).optional(),
	maxPrice: z.number().min(0).optional(),
	sale: z.boolean().optional(),
	featured: z.boolean().optional(),
	search: z.string().trim().min(1).optional(),
	sort: z
		.enum(["newest", "price_asc", "price_desc", "rating", "name", "bestseller"])
		.default("newest"),
});

export const productRouter = router({
	list: tenantProcedure
		.input(productListInput)
		.query(async ({ ctx, input }) => {
			const where = {
				tenantId: ctx.tenant.id,
				category: input.categorySlug
					? { is: { slug: input.categorySlug } }
					: undefined,
				brand: input.brandSlug ? { is: { slug: input.brandSlug } } : undefined,
				skillLevel: input.skillLevel,
				isOnSale: input.sale ? true : undefined,
				isFeatured: input.featured ? true : undefined,
				price:
					input.minPrice !== undefined || input.maxPrice !== undefined
						? {
								gte: input.minPrice,
								lte: input.maxPrice,
							}
						: undefined,
				OR: input.search
					? [
							{ name: { contains: input.search } },
							{ description: { contains: input.search } },
							{ surfaceMaterial: { contains: input.search } },
							{ coreMaterial: { contains: input.search } },
							{ brand: { is: { name: { contains: input.search } } } },
						]
					: undefined,
			};

			const orderBy =
				input.sort === "price_asc"
					? { price: "asc" as const }
					: input.sort === "price_desc"
						? { price: "desc" as const }
						: input.sort === "rating"
							? { rating: "desc" as const }
							: input.sort === "name"
								? { name: "asc" as const }
								: input.sort === "bestseller"
									? { reviewCount: "desc" as const }
									: { createdAt: "desc" as const };

			const [items, total] = await Promise.all([
				ctx.prisma.product.findMany({
					where,
					include: productInclude,
					orderBy,
					take: input.limit,
					skip: input.offset,
				}),
				ctx.prisma.product.count({ where }),
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
			const product = await ctx.prisma.product.findFirst({
				where: {
					tenantId: ctx.tenant.id,
					slug: input.slug,
				},
				include: {
					...productInclude,
					reviews: {
						where: { isApproved: true },
						orderBy: { createdAt: "desc" },
						take: 5,
						include: { user: true },
					},
				},
			});

			if (!product) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Product not found",
				});
			}

			const related = await ctx.prisma.product.findMany({
				where: {
					tenantId: ctx.tenant.id,
					id: { not: product.id },
					categoryId: product.categoryId ?? undefined,
				},
				include: productInclude,
				orderBy: [{ isFeatured: "desc" }, { rating: "desc" }],
				take: 4,
			});

			return {
				...product,
				related,
			};
		}),

	getFeatured: tenantProcedure
		.input(z.object({ limit: z.number().int().min(1).max(24).default(8) }))
		.query(({ ctx, input }) =>
			ctx.prisma.product.findMany({
				where: {
					tenantId: ctx.tenant.id,
					isFeatured: true,
				},
				include: productInclude,
				orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
				take: input.limit,
			}),
		),

	getBestsellers: tenantProcedure
		.input(z.object({ limit: z.number().int().min(1).max(24).default(8) }))
		.query(({ ctx, input }) =>
			ctx.prisma.product.findMany({
				where: {
					tenantId: ctx.tenant.id,
				},
				include: productInclude,
				orderBy: [{ reviewCount: "desc" }, { rating: "desc" }],
				take: input.limit,
			}),
		),

	getNewArrivals: tenantProcedure
		.input(z.object({ limit: z.number().int().min(1).max(24).default(8) }))
		.query(({ ctx, input }) =>
			ctx.prisma.product.findMany({
				where: {
					tenantId: ctx.tenant.id,
				},
				include: productInclude,
				orderBy: { createdAt: "desc" },
				take: input.limit,
			}),
		),

	getBySkillLevel: tenantProcedure
		.input(
			z.object({
				skillLevel: skillLevelInput,
				limit: z.number().int().min(1).max(24).default(8),
			}),
		)
		.query(({ ctx, input }) =>
			ctx.prisma.product.findMany({
				where: {
					tenantId: ctx.tenant.id,
					skillLevel: input.skillLevel,
				},
				include: productInclude,
				orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
				take: input.limit,
			}),
		),

	search: tenantProcedure
		.input(
			z.object({
				query: z.string().trim().min(1),
				limit: z.number().int().min(1).max(50).default(10),
			}),
		)
		.query(({ ctx, input }) =>
			ctx.prisma.product.findMany({
				where: {
					tenantId: ctx.tenant.id,
					OR: [
						{ name: { contains: input.query } },
						{ description: { contains: input.query } },
						{ surfaceMaterial: { contains: input.query } },
						{ coreMaterial: { contains: input.query } },
						{ brand: { is: { name: { contains: input.query } } } },
					],
				},
				include: productInclude,
				orderBy: [{ isFeatured: "desc" }, { rating: "desc" }],
				take: input.limit,
			}),
		),

	getCategories: tenantProcedure.query(({ ctx }) =>
		ctx.prisma.category.findMany({
			where: { tenantId: ctx.tenant.id },
			include: { _count: { select: { products: true } } },
			orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
		}),
	),

	getBrands: tenantProcedure.query(({ ctx }) =>
		ctx.prisma.brand.findMany({
			where: { tenantId: ctx.tenant.id },
			include: { _count: { select: { products: true } } },
			orderBy: { name: "asc" },
		}),
	),

	getFilters: tenantProcedure.query(async ({ ctx }) => {
		const [categories, brands, priceRange] = await Promise.all([
			ctx.prisma.category.findMany({
				where: { tenantId: ctx.tenant.id },
				orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
			}),
			ctx.prisma.brand.findMany({
				where: { tenantId: ctx.tenant.id },
				orderBy: { name: "asc" },
			}),
			ctx.prisma.product.aggregate({
				where: { tenantId: ctx.tenant.id },
				_min: { price: true, weight: true },
				_max: { price: true, weight: true },
			}),
		]);

		return {
			categories,
			brands,
			skillLevels: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO"],
			price: {
				min: priceRange._min.price,
				max: priceRange._max.price,
			},
			weight: {
				min: priceRange._min.weight,
				max: priceRange._max.weight,
			},
		};
	}),
});

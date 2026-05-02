import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { router, tenantProcedure } from "../index";
import { paginationInput } from "../lib/inputs";

const venueInclude = {
	courts: {
		where: { isActive: true },
		include: {
			availability: true,
		},
		orderBy: { name: "asc" as const },
	},
	reviews: {
		where: { isApproved: true },
		orderBy: { createdAt: "desc" as const },
		take: 5,
	},
};

export const venueRouter = router({
	list: tenantProcedure
		.input(
			paginationInput.extend({
				query: z.string().trim().optional(),
				city: z.string().optional(),
				state: z.string().optional(),
				partnerOnly: z.boolean().optional(),
				hasIndoor: z.boolean().optional(),
				hasOutdoor: z.boolean().optional(),
				hasLights: z.boolean().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const where = {
				tenantId: ctx.tenant.id,
				city: input.city,
				state: input.state,
				isPartner: input.partnerOnly ? true : undefined,
				hasLights: input.hasLights ? true : undefined,
				indoorCourts: input.hasIndoor ? { gt: 0 } : undefined,
				outdoorCourts: input.hasOutdoor ? { gt: 0 } : undefined,
				OR: input.query
					? [
							{ name: { contains: input.query } },
							{ city: { contains: input.query } },
							{ address: { contains: input.query } },
							{ postcode: { contains: input.query } },
						]
					: undefined,
			};

			const [items, total] = await Promise.all([
				ctx.prisma.venue.findMany({
					where,
					include: venueInclude,
					orderBy: [{ isPartner: "desc" }, { rating: "desc" }, { name: "asc" }],
					take: input.limit,
					skip: input.offset,
				}),
				ctx.prisma.venue.count({ where }),
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
			const venue = await ctx.prisma.venue.findFirst({
				where: {
					tenantId: ctx.tenant.id,
					slug: input.slug,
				},
				include: venueInclude,
			});

			if (!venue) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Venue not found",
				});
			}

			return venue;
		}),

	search: tenantProcedure
		.input(
			z.object({
				query: z.string().trim().min(1),
				limit: z.number().int().min(1).max(50).default(10),
			}),
		)
		.query(({ ctx, input }) =>
			ctx.prisma.venue.findMany({
				where: {
					tenantId: ctx.tenant.id,
					OR: [
						{ name: { contains: input.query } },
						{ city: { contains: input.query } },
						{ address: { contains: input.query } },
						{ postcode: { contains: input.query } },
					],
				},
				include: venueInclude,
				orderBy: [{ isPartner: "desc" }, { rating: "desc" }],
				take: input.limit,
			}),
		),
});

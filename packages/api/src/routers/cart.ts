import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedTenantProcedure, router, tenantProcedure } from "../index";
import { getCartOwner, getOrCreateCart, refreshCartTotals } from "../lib/cart";
import { money, roundMoney } from "../lib/inputs";

const cartSessionInput = z.object({
	sessionId: z.string().optional(),
});

export const cartRouter = router({
	get: tenantProcedure
		.input(cartSessionInput.default({}))
		.query(async ({ ctx, input }) => {
			const cart = await getOrCreateCart(ctx.prisma, {
				tenantId: ctx.tenant.id,
				userId: ctx.session?.user.id,
				sessionId: input.sessionId,
			});

			return refreshCartTotals(ctx.prisma, cart.id);
		}),

	addItem: tenantProcedure
		.input(
			cartSessionInput
				.extend({
					productId: z.string().optional(),
					slug: z.string().optional(),
					quantity: z.number().int().min(1).max(99).default(1),
					isDemoItem: z.boolean().default(false),
				})
				.refine((value) => value.productId || value.slug, {
					message: "productId or slug is required",
				}),
		)
		.mutation(async ({ ctx, input }) => {
			const product = await ctx.prisma.product.findFirst({
				where: {
					tenantId: ctx.tenant.id,
					id: input.productId,
					slug: input.slug,
				},
			});

			if (!product) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Product not found",
				});
			}

			if (input.isDemoItem && !product.demoEligible) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This product is not eligible for demo checkout",
				});
			}

			if (!product.isInStock || product.stockQuantity < input.quantity) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Product is out of stock",
				});
			}

			const cart = await getOrCreateCart(ctx.prisma, {
				tenantId: ctx.tenant.id,
				userId: ctx.session?.user.id,
				sessionId: input.sessionId,
			});
			const existing = await ctx.prisma.cartItem.findFirst({
				where: {
					cartId: cart.id,
					productId: product.id,
					isDemoItem: input.isDemoItem,
				},
			});

			if (existing) {
				const quantity = existing.quantity + input.quantity;
				await ctx.prisma.cartItem.update({
					where: { id: existing.id },
					data: {
						quantity,
						totalPrice: roundMoney(quantity * money(product.price)),
					},
				});
			} else {
				await ctx.prisma.cartItem.create({
					data: {
						cartId: cart.id,
						productId: product.id,
						quantity: input.quantity,
						unitPrice: product.price,
						totalPrice: roundMoney(input.quantity * money(product.price)),
						isDemoItem: input.isDemoItem,
					},
				});
			}

			return refreshCartTotals(ctx.prisma, cart.id);
		}),

	updateQuantity: tenantProcedure
		.input(
			z.object({
				itemId: z.string(),
				quantity: z.number().int().min(0).max(99),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const item = await ctx.prisma.cartItem.findFirst({
				where: {
					id: input.itemId,
					cart: {
						tenantId: ctx.tenant.id,
						status: "ACTIVE",
					},
				},
				include: { product: true },
			});

			if (!item) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Cart item not found",
				});
			}

			if (input.quantity === 0) {
				await ctx.prisma.cartItem.delete({ where: { id: item.id } });
			} else {
				await ctx.prisma.cartItem.update({
					where: { id: item.id },
					data: {
						quantity: input.quantity,
						totalPrice: roundMoney(input.quantity * money(item.unitPrice)),
					},
				});
			}

			return refreshCartTotals(ctx.prisma, item.cartId);
		}),

	removeItem: tenantProcedure
		.input(z.object({ itemId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const item = await ctx.prisma.cartItem.findFirst({
				where: {
					id: input.itemId,
					cart: {
						tenantId: ctx.tenant.id,
						status: "ACTIVE",
					},
				},
			});

			if (!item) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Cart item not found",
				});
			}

			await ctx.prisma.cartItem.delete({ where: { id: item.id } });
			return refreshCartTotals(ctx.prisma, item.cartId);
		}),

	applyPromo: tenantProcedure
		.input(cartSessionInput.extend({ code: z.string().trim().min(2) }))
		.mutation(async ({ ctx, input }) => {
			const cart = await getOrCreateCart(ctx.prisma, {
				tenantId: ctx.tenant.id,
				userId: ctx.session?.user.id,
				sessionId: input.sessionId,
			});
			const freshCart = await refreshCartTotals(ctx.prisma, cart.id);
			const code = input.code.toUpperCase();
			const club = await ctx.prisma.club.findFirst({
				where: {
					tenantId: ctx.tenant.id,
					code,
					isActive: true,
				},
			});
			const discountPercent = club
				? money(club.discountPercent)
				: code === "SAVE10"
					? 10
					: 0;

			if (!discountPercent) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Promo code is not valid",
				});
			}

			const discountAmount = roundMoney(
				(money(freshCart.subtotal) * discountPercent) / 100,
			);

			return ctx.prisma.cart.update({
				where: { id: cart.id },
				data: {
					promoCode: code,
					discountAmount,
				},
				include: {
					items: {
						include: {
							product: {
								include: {
									brand: true,
									category: true,
									images: { orderBy: { sortOrder: "asc" } },
								},
							},
						},
					},
				},
			});
		}),

	clear: tenantProcedure
		.input(cartSessionInput.default({}))
		.mutation(async ({ ctx, input }) => {
			const owner = getCartOwner({
				tenantId: ctx.tenant.id,
				userId: ctx.session?.user.id,
				sessionId: input.sessionId,
			});
			const cart = await ctx.prisma.cart.findFirst({ where: owner });

			if (!cart) {
				return null;
			}

			await ctx.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
			return refreshCartTotals(ctx.prisma, cart.id);
		}),

	mergeGuestCart: protectedTenantProcedure
		.input(z.object({ sessionId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const guestCart = await ctx.prisma.cart.findFirst({
				where: {
					tenantId: ctx.tenant.id,
					sessionId: input.sessionId,
					status: "ACTIVE",
				},
				include: { items: true },
			});
			const userCart = await getOrCreateCart(ctx.prisma, {
				tenantId: ctx.tenant.id,
				userId: ctx.session.user.id,
			});

			if (!guestCart) {
				return refreshCartTotals(ctx.prisma, userCart.id);
			}

			for (const item of guestCart.items) {
				const existing = await ctx.prisma.cartItem.findFirst({
					where: {
						cartId: userCart.id,
						productId: item.productId,
						isDemoItem: item.isDemoItem,
					},
				});

				if (existing) {
					const quantity = existing.quantity + item.quantity;
					await ctx.prisma.cartItem.update({
						where: { id: existing.id },
						data: {
							quantity,
							totalPrice: roundMoney(quantity * money(existing.unitPrice)),
						},
					});
				} else {
					await ctx.prisma.cartItem.create({
						data: {
							cartId: userCart.id,
							productId: item.productId,
							quantity: item.quantity,
							unitPrice: item.unitPrice,
							totalPrice: item.totalPrice,
							isDemoItem: item.isDemoItem,
						},
					});
				}
			}

			await ctx.prisma.cart.update({
				where: { id: guestCart.id },
				data: { status: "CONVERTED" },
			});

			return refreshCartTotals(ctx.prisma, userCart.id);
		}),
});

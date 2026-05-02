import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedTenantProcedure, router } from "../index";
import { addressInput, money, roundMoney } from "../lib/inputs";

const orderInclude = {
	items: {
		include: {
			product: {
				include: {
					brand: true,
					category: true,
					images: { orderBy: { sortOrder: "asc" as const } },
				},
			},
		},
	},
	payments: true,
};

function cleanAddress(
	value: z.infer<typeof addressInput> | undefined,
): Record<string, string> | undefined {
	if (!value) {
		return undefined;
	}

	return Object.fromEntries(
		Object.entries(value).filter((entry): entry is [string, string] => {
			const [, item] = entry;
			return typeof item === "string" && item.length > 0;
		}),
	);
}

function createOrderNumber() {
	const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
	return `PPS-${Date.now()}-${suffix}`;
}

export const orderRouter = router({
	create: protectedTenantProcedure
		.input(
			z.object({
				cartId: z.string().optional(),
				shippingAddress: addressInput.optional(),
				billingAddress: addressInput.optional(),
				shippingCost: z.number().min(0).optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const cart = await ctx.prisma.cart.findFirst({
				where: {
					id: input.cartId,
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
					status: "ACTIVE",
				},
				include: {
					items: {
						include: { product: true },
					},
				},
			});

			if (!cart || cart.items.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cart is empty",
				});
			}

			for (const item of cart.items) {
				if (
					!item.product.isInStock ||
					item.product.stockQuantity < item.quantity
				) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `${item.product.name} is no longer available in this quantity`,
					});
				}
			}

			const subtotal = roundMoney(
				cart.items.reduce((sum, item) => sum + money(item.totalPrice), 0),
			);
			const discountAmount = Math.min(money(cart.discountAmount), subtotal);
			const shippingCost =
				input.shippingCost ?? (subtotal - discountAmount >= 150 ? 0 : 12.95);
			const taxableAmount = Math.max(
				subtotal - discountAmount + shippingCost,
				0,
			);
			const taxAmount = roundMoney(taxableAmount / 11);
			const total = roundMoney(taxableAmount);

			const order = await ctx.prisma.$transaction(async (tx) => {
				const created = await tx.order.create({
					data: {
						tenantId: ctx.tenant.id,
						orderNumber: createOrderNumber(),
						userId: ctx.session.user.id,
						subtotal,
						shippingCost,
						discountAmount,
						taxAmount,
						total,
						shippingAddress: cleanAddress(input.shippingAddress),
						billingAddress: cleanAddress(input.billingAddress),
						notes: input.notes,
						items: {
							create: cart.items.map((item) => ({
								productId: item.productId,
								quantity: item.quantity,
								unitPrice: item.unitPrice,
								totalPrice: item.totalPrice,
								isDemoItem: item.isDemoItem,
							})),
						},
					},
					include: orderInclude,
				});

				for (const item of cart.items) {
					await tx.product.update({
						where: { id: item.productId },
						data: {
							stockQuantity: { decrement: item.quantity },
						},
					});
				}

				if (cart.promoCode) {
					const club = await tx.club.findFirst({
						where: {
							tenantId: ctx.tenant.id,
							code: cart.promoCode,
							isActive: true,
						},
					});

					if (club) {
						const amount = roundMoney(
							(total * money(club.cashbackPercent)) / 100,
						);
						await tx.clubTransaction.create({
							data: {
								tenantId: ctx.tenant.id,
								clubId: club.id,
								userId: ctx.session.user.id,
								orderId: created.id,
								amount,
							},
						});
						await tx.club.update({
							where: { id: club.id },
							data: {
								totalEarned: { increment: amount },
							},
						});
					}
				}

				await tx.cart.update({
					where: { id: cart.id },
					data: { status: "CONVERTED" },
				});

				return created;
			});

			return order;
		}),

	get: protectedTenantProcedure
		.input(
			z
				.object({
					id: z.string().optional(),
					orderNumber: z.string().optional(),
				})
				.refine((value) => value.id || value.orderNumber, {
					message: "id or orderNumber is required",
				}),
		)
		.query(async ({ ctx, input }) => {
			const order = await ctx.prisma.order.findFirst({
				where: {
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
					id: input.id,
					orderNumber: input.orderNumber,
				},
				include: orderInclude,
			});

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order not found",
				});
			}

			return order;
		}),

	list: protectedTenantProcedure
		.input(
			z.object({
				limit: z.number().int().min(1).max(50).default(20),
				offset: z.number().int().min(0).default(0),
			}),
		)
		.query(({ ctx, input }) =>
			ctx.prisma.order.findMany({
				where: {
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
				},
				include: orderInclude,
				orderBy: { createdAt: "desc" },
				take: input.limit,
				skip: input.offset,
			}),
		),

	getStatus: protectedTenantProcedure
		.input(z.object({ orderNumber: z.string() }))
		.query(async ({ ctx, input }) => {
			const order = await ctx.prisma.order.findFirst({
				where: {
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
					orderNumber: input.orderNumber,
				},
				select: {
					orderNumber: true,
					status: true,
					paymentStatus: true,
					fulfillmentStatus: true,
					trackingNumber: true,
					updatedAt: true,
				},
			});

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order not found",
				});
			}

			return order;
		}),

	cancel: protectedTenantProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const order = await ctx.prisma.order.findFirst({
				where: {
					id: input.id,
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
				},
			});

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order not found",
				});
			}

			if (!["PENDING", "PAID", "PROCESSING"].includes(order.status)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This order can no longer be cancelled",
				});
			}

			return ctx.prisma.order.update({
				where: { id: order.id },
				data: { status: "CANCELLED" },
				include: orderInclude,
			});
		}),

	createDemoReturn: protectedTenantProcedure
		.input(
			z.object({
				orderId: z.string(),
				itemId: z.string(),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const item = await ctx.prisma.orderItem.findFirst({
				where: {
					id: input.itemId,
					orderId: input.orderId,
					isDemoItem: true,
					order: {
						tenantId: ctx.tenant.id,
						userId: ctx.session.user.id,
					},
				},
				include: { order: true, product: true },
			});

			if (!item) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Demo order item not found",
				});
			}

			await ctx.prisma.order.update({
				where: { id: item.orderId },
				data: {
					notes: input.reason
						? `Demo return requested: ${input.reason}`
						: "Demo return requested",
				},
			});

			return {
				orderNumber: item.order.orderNumber,
				product: item.product.name,
				status: "REQUESTED",
			};
		}),
});

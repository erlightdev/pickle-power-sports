import { TRPCError } from "@trpc/server";

import type { Context } from "../context";
import { money, roundMoney } from "./inputs";

type Prisma = Context["prisma"];

type CartOwnerInput = {
	tenantId: string;
	userId?: string;
	sessionId?: string;
};

export function getCartOwner(input: CartOwnerInput) {
	if (input.userId) {
		return {
			tenantId: input.tenantId,
			userId: input.userId,
			status: "ACTIVE" as const,
		};
	}

	if (input.sessionId) {
		return {
			tenantId: input.tenantId,
			sessionId: input.sessionId,
			status: "ACTIVE" as const,
		};
	}

	throw new TRPCError({
		code: "BAD_REQUEST",
		message: "A signed-in user or sessionId is required for cart actions",
	});
}

export async function refreshCartTotals(prisma: Prisma, cartId: string) {
	const items = await prisma.cartItem.findMany({
		where: { cartId },
	});
	const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
	const subtotal = roundMoney(
		items.reduce((sum, item) => sum + money(item.totalPrice), 0),
	);

	return prisma.cart.update({
		where: { id: cartId },
		data: {
			totalItems,
			subtotal,
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
				orderBy: { id: "asc" },
			},
		},
	});
}

export async function getOrCreateCart(prisma: Prisma, input: CartOwnerInput) {
	const owner = getCartOwner(input);
	const existing = await prisma.cart.findFirst({
		where: owner,
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

	if (existing) {
		return existing;
	}

	return prisma.cart.create({
		data: {
			tenantId: input.tenantId,
			userId: input.userId,
			sessionId: input.sessionId,
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
}

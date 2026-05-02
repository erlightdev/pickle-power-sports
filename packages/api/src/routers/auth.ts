import { protectedProcedure, publicProcedure, router } from "../index";

export const authRouter = router({
	getSession: publicProcedure.query(({ ctx }) => ctx.session),
	me: protectedProcedure.query(async ({ ctx }) => {
		const user = await ctx.prisma.user.findUnique({
			where: { id: ctx.session.user.id },
			include: {
				tenantMemberships: {
					include: { tenant: true },
				},
			},
		});

		return {
			sessionUser: ctx.session.user,
			user,
			currentTenant: ctx.tenant,
		};
	}),
});

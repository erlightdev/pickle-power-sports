import { protectedProcedure, publicProcedure, router } from "../index";

export const authRouter = router({
	getSession: publicProcedure.query(({ ctx }) => ctx.session),
	me: protectedProcedure.query(({ ctx }) => ctx.session.user),
});

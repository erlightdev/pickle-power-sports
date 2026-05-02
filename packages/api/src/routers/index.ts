import { protectedProcedure, publicProcedure, router } from "../index";
import { authRouter } from "./auth";
import { cartRouter } from "./cart";
import { classRouter } from "./class";
import { clubRouter } from "./club";
import { contentRouter } from "./content";
import { courtRouter } from "./court";
import { orderRouter } from "./order";
import { paddleFinderRouter } from "./paddle-finder";
import { productRouter } from "./product";
import { reviewRouter } from "./review";
import { tournamentRouter } from "./tournament";
import { userRouter } from "./user";
import { venueRouter } from "./venue";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	auth: authRouter,
	product: productRouter,
	cart: cartRouter,
	order: orderRouter,
	venue: venueRouter,
	court: courtRouter,
	class: classRouter,
	tournament: tournamentRouter,
	review: reviewRouter,
	content: contentRouter,
	club: clubRouter,
	paddleFinder: paddleFinderRouter,
	user: userRouter,
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
});
export type AppRouter = typeof appRouter;

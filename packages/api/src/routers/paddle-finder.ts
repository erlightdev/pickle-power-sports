import { z } from "zod";

import { router, tenantProcedure } from "../index";
import { money, skillLevelInput } from "../lib/inputs";

const answerValue = z.union([
	z.string(),
	z.number(),
	z.boolean(),
	z.array(z.string()),
]);

const recommendationInput = z.object({
	skillLevel: skillLevelInput.optional(),
	playStyle: z.string().optional(),
	preferredWeight: z.enum(["light", "middle", "heavy"]).optional(),
	maxBudget: z.number().min(0).optional(),
	answers: z.record(z.string(), answerValue).default({}),
});

const quizInput = recommendationInput.extend({
	email: z.string().email().optional(),
});

function adjacentSkillLevel(
	productLevel: string | null,
	selectedLevel: string,
) {
	const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO"];
	const productIndex = levels.indexOf(productLevel ?? "");
	const selectedIndex = levels.indexOf(selectedLevel);

	return productIndex >= 0 && Math.abs(productIndex - selectedIndex) === 1;
}

function metadataRecord(value: unknown) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return {};
	}

	return value as Record<string, unknown>;
}

function weightMatches(weight: unknown, preference: string | undefined) {
	if (!preference || weight === null || weight === undefined) {
		return false;
	}

	const numericWeight = money(weight);

	if (preference === "light") {
		return numericWeight < 7.8;
	}

	if (preference === "heavy") {
		return numericWeight > 8.3;
	}

	return numericWeight >= 7.8 && numericWeight <= 8.3;
}

async function getRecommendations(
	ctx: {
		prisma: typeof import("@Pickle-Power-Sports/db").default;
		tenant: { id: string };
	},
	input: z.infer<typeof recommendationInput>,
) {
	const products = await ctx.prisma.product.findMany({
		where: {
			tenantId: ctx.tenant.id,
			isInStock: true,
		},
		include: {
			brand: true,
			category: true,
			images: { orderBy: { sortOrder: "asc" } },
		},
		take: 100,
	});

	return products
		.map((product) => {
			const metadata = metadataRecord(product.metadata);
			let score = 0;

			if (input.skillLevel && product.skillLevel === input.skillLevel) {
				score += 40;
			} else if (
				input.skillLevel &&
				adjacentSkillLevel(product.skillLevel, input.skillLevel)
			) {
				score += 20;
			}

			if (
				input.playStyle &&
				(metadata.playStyle === input.playStyle ||
					product.shape?.toLowerCase() === input.playStyle.toLowerCase())
			) {
				score += 25;
			}

			if (weightMatches(product.weight, input.preferredWeight)) {
				score += 20;
			}

			if (
				input.maxBudget !== undefined &&
				money(product.price) <= input.maxBudget
			) {
				score += 15;
			}

			return {
				product,
				score,
			};
		})
		.sort((left, right) => right.score - left.score)
		.slice(0, 3);
}

export const paddleFinderRouter = router({
	submitQuiz: tenantProcedure
		.input(quizInput)
		.mutation(async ({ ctx, input }) => {
			const recommendations = await getRecommendations(ctx, input);
			const storedRecommendations = recommendations.map((item) => ({
				productId: item.product.id,
				slug: item.product.slug,
				name: item.product.name,
				score: item.score,
			}));

			const submission = await ctx.prisma.paddleFinderSubmission.create({
				data: {
					tenantId: ctx.tenant.id,
					userId: ctx.session?.user.id,
					email: input.email,
					skillLevel: input.skillLevel,
					playStyle: input.playStyle,
					preferredWeight: input.preferredWeight,
					maxBudget: input.maxBudget,
					answers: input.answers,
					recommendations: storedRecommendations,
				},
			});

			return {
				submission,
				recommendations,
			};
		}),

	getRecommendations: tenantProcedure
		.input(recommendationInput)
		.query(({ ctx, input }) => getRecommendations(ctx, input)),

	getBuyingGuide: tenantProcedure
		.input(
			z.object({
				email: z.string().email(),
				skillLevel: skillLevelInput.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.prisma.newsletterSubscriber.upsert({
				where: {
					tenantId_email: {
						tenantId: ctx.tenant.id,
						email: input.email.toLowerCase(),
					},
				},
				create: {
					tenantId: ctx.tenant.id,
					email: input.email.toLowerCase(),
					skillLevel: input.skillLevel,
				},
				update: {
					isActive: true,
					skillLevel: input.skillLevel,
				},
			});

			return {
				queued: false,
				message:
					"Buying guide request captured. Wire Resend later to send the PDF.",
			};
		}),
});

import { z } from "zod";

const normalizeEnumValue = (value: unknown) => {
	if (typeof value !== "string") {
		return value;
	}

	return value
		.trim()
		.replace(/[\s-]+/g, "_")
		.toUpperCase();
};

export const paginationInput = z.object({
	limit: z.number().int().min(1).max(100).default(20),
	offset: z.number().int().min(0).default(0),
});

export const skillLevelInput = z.preprocess(
	normalizeEnumValue,
	z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO", "COACH"]),
);

export const courtTypeInput = z.preprocess(
	normalizeEnumValue,
	z.enum(["INDOOR", "OUTDOOR"]),
);

export const classTypeInput = z.preprocess(
	normalizeEnumValue,
	z.enum(["COURSE", "DROP_IN", "PRIVATE"]),
);

export const tournamentFormatInput = z.preprocess(
	normalizeEnumValue,
	z.enum(["SINGLES", "DOUBLES", "MIXED_DOUBLES", "MIXER"]),
);

export const tournamentStatusInput = z.preprocess(
	normalizeEnumValue,
	z.enum([
		"UPCOMING",
		"OPEN",
		"WAITLIST",
		"IN_PROGRESS",
		"COMPLETED",
		"CANCELLED",
	]),
);

export const articleTypeInput = z.preprocess(
	normalizeEnumValue,
	z.enum(["REVIEW", "COMPARISON", "GUIDE", "TECHNIQUE", "NEWS"]),
);

export const addressInput = z.object({
	name: z.string().optional(),
	line1: z.string().optional(),
	line2: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	postcode: z.string().optional(),
	country: z.string().optional(),
	phone: z.string().optional(),
});

export function money(value: unknown) {
	return Number(value ?? 0);
}

export function roundMoney(value: number) {
	return Math.round(value * 100) / 100;
}

export function slugify(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

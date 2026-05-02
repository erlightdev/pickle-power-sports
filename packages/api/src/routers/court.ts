import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedTenantProcedure, router, tenantProcedure } from "../index";
import { money, roundMoney } from "../lib/inputs";

function parseDateOnly(value: string) {
	const date = new Date(`${value}T00:00:00.000Z`);

	if (Number.isNaN(date.getTime())) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Invalid date",
		});
	}

	return date;
}

function parseDateTime(value: string) {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Invalid date time",
		});
	}

	return date;
}

function addMinutes(date: Date, minutes: number) {
	return new Date(date.getTime() + minutes * 60_000);
}

function timeOnDate(date: Date, time: string) {
	const [hourValue, minuteValue] = time.split(":");
	const hour = Number.parseInt(hourValue ?? "", 10);
	const minute = Number.parseInt(minuteValue ?? "", 10);

	if (
		Number.isNaN(hour) ||
		Number.isNaN(minute) ||
		hour < 0 ||
		hour > 23 ||
		minute < 0 ||
		minute > 59
	) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Invalid availability time",
		});
	}

	const nextDate = new Date(date);
	nextDate.setUTCHours(hour, minute, 0, 0);
	return nextDate;
}

export const courtRouter = router({
	getAvailability: tenantProcedure
		.input(
			z.object({
				courtId: z.string().optional(),
				venueSlug: z.string().optional(),
				date: z.string(),
				days: z.number().int().min(1).max(14).default(1),
				durationMinutes: z.number().int().min(30).max(240).default(60),
			}),
		)
		.query(async ({ ctx, input }) => {
			const startDate = parseDateOnly(input.date);
			const endDate = new Date(startDate);
			endDate.setUTCDate(startDate.getUTCDate() + input.days);

			const courts = await ctx.prisma.court.findMany({
				where: {
					id: input.courtId,
					tenantId: ctx.tenant.id,
					isActive: true,
					venue: input.venueSlug ? { slug: input.venueSlug } : undefined,
				},
				include: {
					venue: true,
					availability: {
						where: { isAvailable: true },
					},
				},
				orderBy: { name: "asc" },
			});

			if (courts.length === 0) {
				return [];
			}

			const bookings = await ctx.prisma.courtBooking.findMany({
				where: {
					tenantId: ctx.tenant.id,
					courtId: { in: courts.map((court) => court.id) },
					status: "CONFIRMED",
					startTime: { lt: endDate },
					endTime: { gt: startDate },
				},
			});

			return courts.map((court) => {
				const courtBookings = bookings.filter(
					(booking) => booking.courtId === court.id,
				);
				const slots = [];

				for (let dayIndex = 0; dayIndex < input.days; dayIndex += 1) {
					const day = new Date(startDate);
					day.setUTCDate(startDate.getUTCDate() + dayIndex);
					const dayOfWeek = day.getUTCDay();
					const rows = court.availability.filter(
						(row) => row.dayOfWeek === dayOfWeek,
					);

					for (const row of rows) {
						let slotStart = timeOnDate(day, row.startTime);
						const availabilityEnd = timeOnDate(day, row.endTime);

						while (
							addMinutes(slotStart, input.durationMinutes).getTime() <=
							availabilityEnd.getTime()
						) {
							const slotEnd = addMinutes(slotStart, input.durationMinutes);
							const isBooked = courtBookings.some(
								(booking) =>
									booking.startTime < slotEnd && booking.endTime > slotStart,
							);

							if (!isBooked) {
								slots.push({
									startTime: slotStart,
									endTime: slotEnd,
									durationMinutes: input.durationMinutes,
									price: roundMoney(
										(input.durationMinutes / 60) * money(court.hourlyRate),
									),
								});
							}

							slotStart = slotEnd;
						}
					}
				}

				return {
					court,
					slots,
				};
			});
		}),

	book: protectedTenantProcedure
		.input(
			z.object({
				courtId: z.string(),
				startTime: z.string(),
				endTime: z.string(),
				guestCount: z.number().int().min(1).max(12).default(1),
				isMemberBooking: z.boolean().default(false),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const startTime = parseDateTime(input.startTime);
			const endTime = parseDateTime(input.endTime);

			if (endTime <= startTime) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Booking end time must be after start time",
				});
			}

			const court = await ctx.prisma.court.findFirst({
				where: {
					id: input.courtId,
					tenantId: ctx.tenant.id,
					isActive: true,
				},
			});

			if (!court) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Court not found",
				});
			}

			const overlappingBooking = await ctx.prisma.courtBooking.findFirst({
				where: {
					tenantId: ctx.tenant.id,
					courtId: court.id,
					status: "CONFIRMED",
					startTime: { lt: endTime },
					endTime: { gt: startTime },
				},
			});

			if (overlappingBooking) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "That court is already booked for this time",
				});
			}

			const durationMinutes = Math.round(
				(endTime.getTime() - startTime.getTime()) / 60_000,
			);
			const rate =
				input.isMemberBooking && court.memberHourlyRate
					? court.memberHourlyRate
					: court.hourlyRate;
			const bookingDate = new Date(startTime);
			bookingDate.setUTCHours(0, 0, 0, 0);

			return ctx.prisma.courtBooking.create({
				data: {
					tenantId: ctx.tenant.id,
					courtId: court.id,
					userId: ctx.session.user.id,
					bookingDate,
					startTime,
					endTime,
					durationMinutes,
					totalPrice: roundMoney((durationMinutes / 60) * money(rate)),
					isMemberBooking: input.isMemberBooking,
					guestCount: input.guestCount,
					notes: input.notes,
				},
				include: {
					court: {
						include: {
							venue: true,
						},
					},
				},
			});
		}),

	cancelBooking: protectedTenantProcedure
		.input(
			z.object({
				bookingId: z.string(),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const booking = await ctx.prisma.courtBooking.findFirst({
				where: {
					id: input.bookingId,
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
				},
			});

			if (!booking) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Booking not found",
				});
			}

			const freeCancellationCutoff = addMinutes(new Date(), 240);

			if (booking.startTime < freeCancellationCutoff) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Bookings can only be cancelled more than 4 hours ahead",
				});
			}

			return ctx.prisma.courtBooking.update({
				where: { id: booking.id },
				data: {
					status: "CANCELLED",
					cancellationReason: input.reason,
					cancelledAt: new Date(),
				},
				include: {
					court: {
						include: {
							venue: true,
						},
					},
				},
			});
		}),

	getUserBookings: protectedTenantProcedure
		.input(
			z.object({
				upcomingOnly: z.boolean().default(true),
				limit: z.number().int().min(1).max(50).default(20),
			}),
		)
		.query(({ ctx, input }) =>
			ctx.prisma.courtBooking.findMany({
				where: {
					tenantId: ctx.tenant.id,
					userId: ctx.session.user.id,
					startTime: input.upcomingOnly ? { gte: new Date() } : undefined,
				},
				include: {
					court: {
						include: {
							venue: true,
						},
					},
				},
				orderBy: { startTime: "asc" },
				take: input.limit,
			}),
		),
});

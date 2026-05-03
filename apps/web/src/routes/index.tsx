import { createFileRoute, Link } from "@tanstack/react-router";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
	ArrowRightIcon,
	BarChart3Icon,
	BookOpenIcon,
	Building2Icon,
	CalendarCheckIcon,
	CheckIcon,
	GiftIcon,
	ShoppingBagIcon,
	SparklesIcon,
	StarIcon,
	TrophyIcon,
	UsersIcon,
	ZapIcon,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef } from "react";

import { isTenantHost, requireResolvedTenant } from "@/lib/tenant-guard";

gsap.registerPlugin(ScrollTrigger);

// Use useLayoutEffect safely in both SSR and CSR environments to prevent FOUC (Flash of Unstyled Content)
const useIsomorphicLayoutEffect =
	typeof window !== "undefined" ? useLayoutEffect : useEffect;

export const Route = createFileRoute("/")({
	component: HomeComponent,
	head: () => ({
		links: [
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap",
			},
		],
	}),
	beforeLoad: async () => {
		if (!isTenantHost()) return;
		await requireResolvedTenant();
	},
});

/* ─── Static data ──────────────────────────────────────────────────────── */

const HERO_LINES = [
	{ words: ["The", "operating"], accent: false },
	{ words: ["system", "for"], accent: false },
	{ words: ["pickleball", "clubs."], accent: true },
] as const;

const STATS = [
	{ target: 2400, suffix: "+", label: "Active members" },
	{ target: 46, suffix: "", label: "Courts managed" },
	{ target: 128, suffix: "+", label: "Orders this week" },
	{ target: 23, suffix: "", label: "Clubs on platform" },
] as const;

const MARQUEE_ITEMS = [
	"Court Management",
	"Member Profiles",
	"Tournament Brackets",
	"Club Store",
	"Subdomain Branding",
	"Live Analytics",
	"OTP Authentication",
	"Role-Based Access",
	"Skill School",
	"Club Rewards",
	"Paddle Finder",
	"Stripe Payments",
];

const STEPS = [
	{
		n: "01",
		title: "Create your club",
		desc: "Register and have your club's own branded subdomain live in under 2 minutes. No technical setup.",
	},
	{
		n: "02",
		title: "Invite your team",
		desc: "Add coaches, staff, and members. Assign granular roles, configure courts, and set up your program catalogue.",
	},
	{
		n: "03",
		title: "Go live",
		desc: "Accept bookings, tournament registrations, and store orders from day one. Operations run on autopilot.",
	},
] as const;

const TESTIMONIALS = [
	{
		quote:
			"We went from spreadsheets to a fully running club in one afternoon. The court booking alone saved us 6 hours a week.",
		name: "Sarah Mitchell",
		role: "Club Director, Sydney Pickleball Co.",
		initials: "SM",
		grad: "from-emerald-400 to-teal-600",
	},
	{
		quote:
			"The tournament bracket tool is incredible. We ran a 64-player mixed doubles event with zero admin stress.",
		name: "James Thornton",
		role: "Head Coach, Rally Point Club",
		initials: "JT",
		grad: "from-sky-400 to-indigo-600",
	},
	{
		quote:
			"Our Club Rewards program doubled member referrals in 8 weeks. The cashback tracking is completely automatic.",
		name: "Priya Nair",
		role: "Manager, Ace Pickleball Sydney",
		initials: "PN",
		grad: "from-amber-400 to-orange-600",
	},
] as const;

const REWARDS_STATS = [
	{ value: "$47k", label: "Paid out in cashback" },
	{ value: "340+", label: "Clubs earning rewards" },
	{ value: "7%", label: "Default cashback rate" },
	{ value: "2min", label: "To register your club" },
] as const;

/* ─── Sub-components ───────────────────────────────────────────────────── */

function HeroWord({ word, accent }: { word: string; accent?: boolean }) {
	return (
		<span className="inline-block overflow-hidden leading-tight">
			<span
				className={`hero-word inline-block ${accent ? "text-emerald-600" : "text-zinc-900"}`}
			>
				{word}
			</span>
		</span>
	);
}

/* ─── Main component ───────────────────────────────────────────────────── */

function HomeComponent() {
	const rootRef = useRef<HTMLDivElement>(null);

	useIsomorphicLayoutEffect(() => {
		const el = rootRef.current;
		if (!el) return;

		const ctx = gsap.context(() => {
			/* ── Hero sequence (timeline for precise overlap control) ── */
			gsap
				.timeline()
				.from(
					".hero-eyebrow",
					{ y: 14, autoAlpha: 0, duration: 0.5, ease: "power2.out" },
					0.1,
				)
				.from(
					".hero-word",
					{
						y: 60,
						autoAlpha: 0,
						duration: 0.8,
						stagger: 0.06,
						ease: "power3.out",
					},
					0.2,
				)
				.from(
					".hero-sub",
					{ y: 16, autoAlpha: 0, duration: 0.6, ease: "power2.out" },
					"-=0.3",
				)
				.from(
					".hero-cta",
					{
						y: 12,
						autoAlpha: 0,
						duration: 0.5,
						stagger: 0.1,
						ease: "power2.out",
					},
					"-=0.35",
				)
				.from(
					".hero-trust",
					{ y: 8, autoAlpha: 0, duration: 0.4, ease: "power2.out" },
					"-=0.2",
				)
				.from(
					".hero-visual",
					{ x: 40, autoAlpha: 0, duration: 0.9, ease: "power3.out" },
					0.3,
				);

			/* ── Floating UI cards (infinite sine-wave loops) ── */
			gsap.to(".float-1", {
				y: -14,
				duration: 2.4,
				ease: "sine.inOut",
				repeat: -1,
				yoyo: true,
			});
			gsap.to(".float-2", {
				y: -8,
				duration: 1.8,
				ease: "sine.inOut",
				repeat: -1,
				yoyo: true,
				delay: 0.6,
			});
			gsap.to(".float-3", {
				y: -6,
				duration: 2.1,
				ease: "sine.inOut",
				repeat: -1,
				yoyo: true,
				delay: 1.1,
			});

			/* ── Marquee (xPercent on flex w-max for seamless loop) ── */
			gsap.to(".marquee-track", {
				xPercent: -50,
				duration: 30,
				ease: "none",
				repeat: -1,
			});

			/* ── Stat counters ── */
			el.querySelectorAll<HTMLElement>("[data-count]").forEach((node) => {
				const end = Number.parseInt(node.dataset.count ?? "0", 10);
				const obj = { val: 0 };
				gsap.to(obj, {
					val: end,
					duration: 1.8,
					ease: "power2.out",
					scrollTrigger: { trigger: node, start: "top 90%", once: true },
					onUpdate() {
						node.textContent = Math.round(obj.val).toLocaleString();
					},
				});
			});

			/*
			 * ── Scroll-reveal helper ──────────────────────────────────────
			 * immediateRender: false is CRITICAL — without it, gsap.from() with
			 * autoAlpha:0 sets elements invisible immediately on page load before
			 * the scroll trigger fires, causing entire sections to stay blank.
			 */
			function scrollReveal(
				targets: string,
				trigger: string,
				start: string,
				vars: gsap.TweenVars,
			) {
				gsap.from(targets, {
					autoAlpha: 0,
					immediateRender: false,
					scrollTrigger: { trigger, start, once: true },
					...vars,
				});
			}

			scrollReveal(".feat-card", ".feat-bento", "top 80%", {
				y: 40,
				duration: 0.7,
				ease: "power3.out",
				stagger: { amount: 0.5, from: "start" },
			});
			scrollReveal(".skill-card", ".skill-grid", "top 82%", {
				y: 30,
				duration: 0.6,
				ease: "power2.out",
				stagger: 0.12,
			});
			scrollReveal(".reward-stat", ".rewards-section", "top 80%", {
				y: 20,
				duration: 0.55,
				ease: "power2.out",
				stagger: 0.1,
			});
			scrollReveal(".testi-card", ".testi-grid", "top 82%", {
				y: 36,
				duration: 0.65,
				ease: "power3.out",
				stagger: 0.13,
			});
			scrollReveal(".step-row", ".steps-wrap", "top 84%", {
				x: -20,
				duration: 0.6,
				ease: "power2.out",
				stagger: 0.13,
			});
			scrollReveal(".cta-panel", ".cta-panel", "top 90%", {
				scale: 0.97,
				duration: 0.75,
				ease: "power3.out",
			});

			/* ── Refresh ScrollTrigger positions ─────────────────────────
			 * Call immediately for correct initial positions, then again
			 * after fonts load since Outfit shifts layout measurements.
			 */
			ScrollTrigger.refresh();
			document.fonts?.ready.then(() => ScrollTrigger.refresh());
		}, el);

		return () => ctx.revert();
	}, []);

	return (
		<div
			ref={rootRef}
			className="light min-h-dvh bg-[#f8faf9] text-zinc-900 antialiased"
			style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
		>
			{/* ═══ NAV ═══════════════════════════════════════════════════ */}
			<header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-5">
				<nav className="pointer-events-auto flex w-full max-w-6xl items-center justify-between rounded-full border border-zinc-200/70 bg-white/80 px-5 py-2.5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.07)] backdrop-blur-md 2xl:max-w-7xl">
					<div className="flex items-center gap-2.5">
						<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600">
							<ZapIcon className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
						</div>
						<span className="font-semibold text-sm text-zinc-900 tracking-tight">
							Pickle Power Sports
						</span>
					</div>
					<div className="hidden items-center gap-7 md:flex">
						{[
							["#features", "Features"],
							["#skill-school", "Skill School"],
							["#rewards", "Club Rewards"],
							["#how-it-works", "How it works"],
						].map(([href, label]) => (
							<a
								key={href}
								href={href}
								className="text-sm text-zinc-500 transition-colors duration-200 hover:text-zinc-900"
							>
								{label}
							</a>
						))}
					</div>
					<div className="flex items-center gap-2">
						<Link
							to="/login"
							className="hidden font-medium text-sm text-zinc-600 transition-colors hover:text-zinc-900 sm:block"
						>
							Sign in
						</Link>
						<Link
							to="/register"
							className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-1.5 font-medium text-sm text-white transition-all duration-200 hover:bg-zinc-800 active:scale-[0.98]"
						>
							Get started
							<span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10">
								<ArrowRightIcon className="h-2.5 w-2.5" strokeWidth={2.5} />
							</span>
						</Link>
					</div>
				</nav>
			</header>

			{/* ═══ HERO ══════════════════════════════════════════════════ */}
			<section className="flex min-h-dvh flex-col justify-center pt-24 pb-16 lg:pt-28 lg:pb-20">
				<div className="mx-auto w-full max-w-7xl px-6 lg:px-8 2xl:max-w-[1440px] 2xl:px-12">
					<div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_440px] lg:gap-16 xl:grid-cols-[1fr_500px] xl:gap-20 2xl:grid-cols-[1fr_560px] 2xl:gap-24">
						{/* Left */}
						<div className="flex flex-col items-start">
							<div className="hero-eyebrow mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1">
								<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
								<span className="font-semibold text-[11px] text-emerald-700 uppercase tracking-[0.18em]">
									Sports Management Platform
								</span>
							</div>
							<h1 className="mb-5 font-extrabold text-5xl leading-[1.05] tracking-tight lg:text-6xl xl:text-6xl 2xl:text-[4.5rem]">
								{HERO_LINES.map((line) => (
									<div
										key={line.words.join("-")}
										className="flex flex-wrap gap-x-3 gap-y-0.5"
									>
										{line.words.map((w) => (
											<HeroWord key={w} word={w} accent={line.accent} />
										))}
									</div>
								))}
							</h1>
							<p className="hero-sub mb-8 max-w-[52ch] text-base text-zinc-500 leading-relaxed lg:text-lg">
								Manage court bookings, members, tournaments, and your club store
								from one platform. Every club gets its own branded subdomain.
							</p>
							<div className="flex flex-wrap items-center gap-3">
								<Link
									to="/register"
									className="hero-cta flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 font-semibold text-sm text-white shadow-[0_4px_16px_-4px_rgba(5,150,105,0.4)] transition-all duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-emerald-700 active:scale-[0.97] lg:px-6 lg:py-3"
								>
									Start free
									<span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
										<ArrowRightIcon className="h-3 w-3" strokeWidth={2.5} />
									</span>
								</Link>
								<Link
									to="/login"
									className="hero-cta flex items-center gap-1.5 rounded-full px-4 py-2.5 font-medium text-sm text-zinc-600 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-900"
								>
									Sign in
									<ArrowRightIcon className="h-3.5 w-3.5" />
								</Link>
							</div>
							<div className="hero-trust mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
								{[
									"No credit card required",
									"Setup in 2 minutes",
									"Free for small clubs",
								].map((t) => (
									<div key={t} className="flex items-center gap-1.5">
										<CheckIcon
											className="h-3.5 w-3.5 shrink-0 text-emerald-500"
											strokeWidth={2.5}
										/>
										<span className="text-xs text-zinc-500">{t}</span>
									</div>
								))}
							</div>
						</div>

						{/* Right — animated UI mockup */}
						<div className="hero-visual relative hidden h-[400px] items-center justify-center lg:flex xl:h-[460px] 2xl:h-[520px]">
							{/* Main booking card */}
							<div className="float-1 relative z-10 w-[272px] rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] xl:w-[300px]">
								<div className="mb-4 flex items-center justify-between">
									<div>
										<p className="font-medium text-[11px] text-zinc-400">
											Wednesday, 14 May
										</p>
										<p className="font-bold text-base text-zinc-900">Court A</p>
									</div>
									<span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 font-semibold text-[11px] text-emerald-700">
										<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
										Open
									</span>
								</div>
								<div className="mb-4 grid grid-cols-3 gap-1.5">
									{["8:00", "9:00", "10:00", "11:00", "13:00", "14:00"].map(
										(t, i) => (
											<div
												key={t}
												className={`rounded-lg py-1.5 text-center font-medium text-xs ${
													i === 1
														? "bg-emerald-600 text-white"
														: i === 3
															? "bg-zinc-100 text-zinc-400 line-through"
															: "bg-zinc-50 text-zinc-700"
												}`}
											>
												{t}
											</div>
										),
									)}
								</div>
								<button
									type="button"
									className="w-full rounded-xl bg-zinc-900 py-2.5 font-semibold text-sm text-white transition-colors hover:bg-zinc-800 active:scale-[0.98]"
								>
									Book slot
								</button>
							</div>

							{/* Member card */}
							<div className="float-2 absolute bottom-10 -left-8 z-20 w-[192px] rounded-xl border border-zinc-200/50 bg-white p-3 shadow-[0_8px_28px_-8px_rgba(0,0,0,0.1)] xl:-left-10 xl:w-[210px]">
								<div className="flex items-center gap-2">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 font-bold text-white text-xs">
										MR
									</div>
									<div className="min-w-0">
										<p className="truncate font-semibold text-xs text-zinc-900">
											Marcus Reyes
										</p>
										<p className="text-[10px] text-zinc-500">
											3 bookings this week
										</p>
									</div>
								</div>
								<div className="mt-2.5 flex items-center gap-1.5">
									<div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-100">
										<div
											className="h-full rounded-full bg-emerald-500"
											style={{ width: "72%" }}
										/>
									</div>
									<span className="font-medium text-[10px] text-zinc-400">
										72%
									</span>
								</div>
							</div>

							{/* Revenue card */}
							<div className="float-3 absolute top-10 right-[-1.5rem] z-20 w-[160px] rounded-xl border border-zinc-200/50 bg-white p-3.5 shadow-[0_8px_28px_-8px_rgba(0,0,0,0.1)] xl:right-[-2rem] xl:w-[176px]">
								<p className="mb-1 font-medium text-[10px] text-zinc-400 uppercase tracking-wider">
									Revenue
								</p>
								<p className="mb-1 font-bold text-2xl text-zinc-900">$18.6k</p>
								<div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-[11px] text-emerald-600">
									<span>↑</span>
									<span>+18.2%</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ═══ MARQUEE ═══════════════════════════════════════════════ */}
			<div className="overflow-hidden border-zinc-200/60 border-y bg-white/60 py-4">
				<div className="marquee-track flex w-max">
					{[...Array(4)].map((_, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: required block keys
							key={i}
							className="flex shrink-0 gap-10 pr-10"
						>
							{MARQUEE_ITEMS.map((label, j) => (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: static marquee items
									key={j}
									className="flex shrink-0 items-center gap-2"
								>
									<span className="h-1 w-1 rounded-full bg-emerald-400" />
									<span className="whitespace-nowrap font-medium text-sm text-zinc-400">
										{label}
									</span>
								</div>
							))}
						</div>
					))}
				</div>
			</div>

			{/* ═══ STATS ═════════════════════════════════════════════════ */}
			<section className="border-zinc-100 border-b bg-white py-16 lg:py-20">
				<div className="mx-auto max-w-7xl px-6 lg:px-8 2xl:max-w-[1440px] 2xl:px-12">
					<div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
						{STATS.map((s) => (
							<div key={s.label} className="text-center md:text-left">
								<div className="flex items-baseline justify-center gap-0.5 md:justify-start">
									<span
										className="font-extrabold text-4xl text-zinc-900 tracking-tight xl:text-5xl"
										data-count={s.target}
									>
										0
									</span>
									<span className="font-extrabold text-4xl text-emerald-600 tracking-tight xl:text-5xl">
										{s.suffix}
									</span>
								</div>
								<p className="mt-1.5 text-sm text-zinc-500">{s.label}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ═══ PLATFORM — BENTO FEATURES ══════════════════════════════ */}
			<section id="features" className="py-24 lg:py-32">
				<div className="mx-auto max-w-7xl px-6 lg:px-8 2xl:max-w-[1440px] 2xl:px-12">
					{/* Header */}
					<div className="mb-12 lg:mb-16">
						<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200/60 bg-zinc-100 px-3 py-1">
							<span className="font-semibold text-[11px] text-zinc-500 uppercase tracking-[0.18em]">
								Platform
							</span>
						</div>
						<h2 className="max-w-2xl font-extrabold text-4xl text-zinc-900 leading-tight tracking-tight lg:text-5xl 2xl:text-6xl">
							Everything your club needs
						</h2>
						<p className="mt-3 max-w-[52ch] text-zinc-500 leading-relaxed lg:text-base">
							From the first booking to the end-of-season report — one platform
							covers it all.
						</p>
					</div>

					{/* Bento grid */}
					{/*
					 * Bento layout — 3-col desktop, gap-free:
					 * Row 1: CourtBookings(span-2) + Members(span-1)  = 3
					 * Row 2: Tournaments(1) + Store(1) + Analytics(1) = 3
					 * Row 3: MultiClub(span-2) + PaddleFinder(1)      = 3
					 * Row 4: Reviews — lg:col-span-3 full-width strip = 3
					 */}
					<div className="feat-bento grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{/* ── 1. Court Bookings — row 1, span-2 ── */}
						<div className="feat-card col-span-1 rounded-2xl border border-zinc-200/60 bg-white p-6 transition-all duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-zinc-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.07)] sm:col-span-2 lg:p-8">
							<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
								<div className="flex-1">
									<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
										<CalendarCheckIcon
											className="h-5 w-5 text-emerald-600"
											strokeWidth={1.75}
										/>
									</div>
									<p className="mb-2 font-semibold text-lg text-zinc-900">
										Court Bookings
									</p>
									<p className="mb-5 max-w-[38ch] text-sm text-zinc-500 leading-relaxed">
										Real-time availability, online reservations, staff approval
										workflows, and automated player reminders across every
										facility.
									</p>
									<div className="flex flex-wrap gap-2">
										{[
											"Real-time slots",
											"Cancellation policy",
											"SMS reminders",
											"Multi-court",
										].map((tag) => (
											<span
												key={tag}
												className="rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 font-medium text-[11px] text-emerald-700"
											>
												{tag}
											</span>
										))}
									</div>
								</div>
								<div className="w-full shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 p-4 lg:w-[220px] xl:w-[248px]">
									<p className="mb-3 font-semibold text-[11px] text-zinc-400 uppercase tracking-wider">
										Today's courts
									</p>
									{[
										{
											court: "Court A",
											time: "9:00 – 10:00",
											status: "booked",
										},
										{ court: "Court B", time: "10:00 – 11:00", status: "open" },
										{ court: "Court C", time: "11:00 – 12:00", status: "open" },
									].map((row) => (
										<div
											key={row.court}
											className="mb-2 flex items-center justify-between rounded-lg bg-white px-3 py-2 last:mb-0"
										>
											<div>
												<p className="font-semibold text-xs text-zinc-800">
													{row.court}
												</p>
												<p className="text-[10px] text-zinc-400">{row.time}</p>
											</div>
											<span
												className={`rounded-full px-2 py-0.5 font-semibold text-[10px] ${row.status === "open" ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-400"}`}
											>
												{row.status === "open" ? "Open" : "Booked"}
											</span>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* ── 2. Member Management — row 1, span-1 ── */}
						<div className="feat-card rounded-2xl border border-zinc-200/60 bg-white p-6 transition-all duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-zinc-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.07)] lg:p-7">
							<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
								<UsersIcon
									className="h-5 w-5 text-sky-600"
									strokeWidth={1.75}
								/>
							</div>
							<p className="mb-1.5 font-semibold text-zinc-900">
								Member Management
							</p>
							<p className="mb-5 text-sm text-zinc-500 leading-relaxed">
								Full profiles, activity tracking, membership tiers, and direct
								communication tools for every member.
							</p>
							<div className="space-y-2">
								{[
									{ init: "AR", name: "Alex R.", tier: "Pro" },
									{ init: "JL", name: "Jamie L.", tier: "Member" },
									{ init: "SK", name: "Sam K.", tier: "Coach" },
								].map((m) => (
									<div
										key={m.init}
										className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2"
									>
										<div className="flex items-center gap-2">
											<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 font-bold text-[9px] text-white">
												{m.init}
											</div>
											<span className="font-medium text-xs text-zinc-700">
												{m.name}
											</span>
										</div>
										<span className="rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-[10px] text-sky-600">
											{m.tier}
										</span>
									</div>
								))}
							</div>
						</div>

						{/* ── 3. Tournaments — row 2, span-1 ── */}
						<div className="feat-card rounded-2xl border border-zinc-200/60 bg-white p-6 transition-all duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-zinc-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.07)] lg:p-7">
							<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
								<TrophyIcon
									className="h-5 w-5 text-amber-600"
									strokeWidth={1.75}
								/>
							</div>
							<p className="mb-1.5 font-semibold text-zinc-900">
								Tournaments &amp; Programs
							</p>
							<p className="mb-5 text-sm text-zinc-500 leading-relaxed">
								Brackets, leagues, clinics, and coaching programs with built-in
								online registration and DUPR rating support.
							</p>
							<div className="flex flex-wrap gap-1.5">
								{[
									"Singles",
									"Doubles",
									"Mixed",
									"Mixer",
									"League",
									"Clinic",
								].map((f) => (
									<span
										key={f}
										className="rounded-full border border-amber-200/60 bg-amber-50 px-2.5 py-1 font-medium text-[11px] text-amber-700"
									>
										{f}
									</span>
								))}
							</div>
						</div>

						{/* ── 4. Club Store — row 2, span-1 ── */}
						<div className="feat-card rounded-2xl border border-zinc-200/60 bg-white p-6 transition-all duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-zinc-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.07)] lg:p-7">
							<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
								<ShoppingBagIcon
									className="h-5 w-5 text-rose-600"
									strokeWidth={1.75}
								/>
							</div>
							<p className="mb-1.5 font-semibold text-zinc-900">Club Store</p>
							<p className="mb-5 text-sm text-zinc-500 leading-relaxed">
								Paddles, gear, memberships — inventory management, Stripe
								checkout, and order tracking built in.
							</p>
							<div className="rounded-xl bg-zinc-50 p-3">
								<div className="mb-2 flex items-center justify-between">
									<span className="font-medium text-[10px] text-zinc-400 uppercase tracking-wider">
										This week
									</span>
									<span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-[10px] text-emerald-600">
										↑ 14%
									</span>
								</div>
								<p className="font-bold text-xl text-zinc-900">$3,240</p>
								<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200">
									<div className="h-full w-[68%] rounded-full bg-emerald-500" />
								</div>
							</div>
						</div>

						{/* ── 5. Live Analytics — row 2, span-1 ── */}
						<div className="feat-card rounded-2xl border border-zinc-200/60 bg-white p-6 transition-all duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-zinc-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.07)] lg:p-7">
							<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
								<BarChart3Icon
									className="h-5 w-5 text-teal-600"
									strokeWidth={1.75}
								/>
							</div>
							<p className="mb-1.5 font-semibold text-zinc-900">
								Live Analytics
							</p>
							<p className="mb-5 text-sm text-zinc-500 leading-relaxed">
								Revenue, bookings, and member activity — a real-time dashboard
								with zero manual reporting.
							</p>
							<div className="flex h-12 items-end gap-1.5">
								{[
									{ h: 40, accent: false },
									{ h: 65, accent: false },
									{ h: 48, accent: false },
									{ h: 80, accent: false },
									{ h: 55, accent: false },
									{ h: 90, accent: true },
									{ h: 72, accent: false },
								].map((bar) => (
									<div
										key={bar.h}
										className="flex-1 rounded-t-sm transition-all"
										style={{
											height: `${bar.h}%`,
											backgroundColor: bar.accent
												? "rgb(20 184 166)"
												: "rgb(204 251 241)",
										}}
									/>
								))}
							</div>
							<div className="mt-2 flex items-center justify-between">
								<span className="text-[10px] text-zinc-400">Mon – Sun</span>
								<span className="font-semibold text-teal-600 text-xs">
									↑ 22% vs last week
								</span>
							</div>
						</div>

						{/* ── 6. Multi-Club Platform — row 3, span-2 ── */}
						<div className="feat-card col-span-1 rounded-2xl border border-zinc-200/60 bg-white p-6 transition-all duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-zinc-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.07)] sm:col-span-2 lg:p-8">
							<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
								<div className="flex-1">
									<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
										<Building2Icon
											className="h-5 w-5 text-violet-600"
											strokeWidth={1.75}
										/>
									</div>
									<p className="mb-2 font-semibold text-lg text-zinc-900">
										Multi-Club Platform
									</p>
									<p className="mb-5 max-w-[38ch] text-sm text-zinc-500 leading-relaxed">
										Each club gets its own subdomain, custom branding,
										role-based staff access, and a fully isolated member
										database — all managed from one admin panel.
									</p>
									<div className="flex flex-wrap gap-2">
										{[
											"Subdomain branding",
											"Isolated DB",
											"Custom roles",
											"Admin panel",
										].map((tag) => (
											<span
												key={tag}
												className="rounded-full border border-violet-200/60 bg-violet-50 px-2.5 py-1 font-medium text-[11px] text-violet-700"
											>
												{tag}
											</span>
										))}
									</div>
								</div>
								<div className="w-full shrink-0 space-y-2 lg:w-[220px] xl:w-[248px]">
									{[
										{
											name: "Rally Point",
											sub: "rallypoint.picklepowersports.com",
											color: "bg-violet-500",
										},
										{
											name: "Ace Club",
											sub: "aceclub.picklepowersports.com",
											color: "bg-sky-500",
										},
										{
											name: "Net Ninjas",
											sub: "netninjas.picklepowersports.com",
											color: "bg-emerald-500",
										},
									].map((c) => (
										<div
											key={c.name}
											className="flex items-center gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5"
										>
											<div
												className={`h-2 w-2 shrink-0 rounded-full ${c.color}`}
											/>
											<div className="min-w-0">
												<p className="font-semibold text-xs text-zinc-800">
													{c.name}
												</p>
												<p className="truncate text-[9px] text-zinc-400">
													{c.sub}
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* ── 7. Paddle Finder — row 3, span-1 ── */}
						<div className="feat-card rounded-2xl border border-zinc-200/60 bg-white p-6 transition-all duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-zinc-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.07)] lg:p-7">
							<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
								<SparklesIcon
									className="h-5 w-5 text-indigo-600"
									strokeWidth={1.75}
								/>
							</div>
							<p className="mb-1.5 font-semibold text-zinc-900">
								Paddle Finder
							</p>
							<p className="mb-5 text-sm text-zinc-500 leading-relaxed">
								8-question quiz engine that matches players to the right paddle
								based on skill level, play style, and budget.
							</p>
							<div className="overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 p-3">
								<p className="mb-2 font-semibold text-[11px] text-zinc-500">
									What's your DUPR rating?
								</p>
								<div className="grid grid-cols-3 gap-1.5">
									{[
										"2.5–3.0",
										"3.0–3.5",
										"3.5–4.0",
										"4.0–4.5",
										"4.5+",
										"New",
									].map((lvl, i) => (
										<button
											key={lvl}
											type="button"
											className={`rounded-lg px-2 py-1.5 font-medium text-[10px] ${i === 2 ? "bg-indigo-600 text-white" : "border border-zinc-200 bg-white text-zinc-600"}`}
										>
											{lvl}
										</button>
									))}
								</div>
							</div>
						</div>

						{/* ── 8. Reviews & Ratings — row 4, full-width ── */}
						<div className="feat-card col-span-1 rounded-2xl border border-zinc-200/60 bg-white p-6 transition-all duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-zinc-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.07)] sm:col-span-2 lg:col-span-3 lg:p-8">
							<div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
								<div className="flex items-start gap-4">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50">
										<StarIcon
											className="h-5 w-5 text-yellow-500"
											strokeWidth={1.75}
										/>
									</div>
									<div>
										<p className="mb-1 font-semibold text-zinc-900">
											Reviews &amp; Ratings
										</p>
										<p className="max-w-[52ch] text-sm text-zinc-500 leading-relaxed">
											Verified purchase reviews for paddles, venues, and
											classes. Aggregate star ratings with helpful vote counts —
											community-driven trust at scale.
										</p>
									</div>
								</div>
								<div className="flex shrink-0 flex-wrap items-center gap-4 lg:gap-8">
									<div className="text-center">
										<div className="flex items-center gap-0.5">
											{[1, 2, 3, 4, 5].map((s) => (
												<StarIcon
													key={s}
													className="h-4 w-4 fill-yellow-400 text-yellow-400"
													strokeWidth={1.5}
												/>
											))}
										</div>
										<p className="mt-1 font-bold text-2xl text-zinc-900">4.8</p>
										<p className="text-[11px] text-zinc-400">avg rating</p>
									</div>
									<div className="h-10 w-px bg-zinc-100" />
									<div className="text-center">
										<p className="font-bold text-2xl text-zinc-900">1,240</p>
										<p className="text-[11px] text-zinc-400">total reviews</p>
									</div>
									<div className="h-10 w-px bg-zinc-100" />
									<div className="text-center">
										<p className="font-bold text-2xl text-zinc-900">98%</p>
										<p className="text-[11px] text-zinc-400">recommend</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ═══ SKILL SCHOOL ══════════════════════════════════════════ */}
			<section
				id="skill-school"
				className="border-zinc-100 border-t bg-white py-24 lg:py-32"
			>
				<div className="mx-auto max-w-7xl px-6 lg:px-8 2xl:max-w-[1440px] 2xl:px-12">
					<div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16 2xl:gap-24">
						{/* Left */}
						<div>
							<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200/60 bg-zinc-100 px-3 py-1">
								<span className="font-semibold text-[11px] text-zinc-500 uppercase tracking-[0.18em]">
									Skill School
								</span>
							</div>
							<h2 className="mb-4 font-extrabold text-4xl text-zinc-900 leading-tight tracking-tight lg:text-5xl 2xl:text-6xl">
								Coaching programs,{" "}
								<span className="text-emerald-600">built in.</span>
							</h2>
							<p className="mb-6 max-w-[48ch] text-zinc-500 leading-relaxed">
								Add PPR-certified coaches, schedule group clinics or private
								lessons, and manage enrolments with automatic capacity controls
								and Stripe payment collection.
							</p>
							<ul className="mb-8 space-y-3">
								{[
									"Drop-in classes, multi-week courses, and private lessons",
									"Spot capacity with real-time waitlist management",
									"Skill level filtering — Beginner to Advanced",
									"Automated enrolment confirmations via email",
								].map((item) => (
									<li key={item} className="flex items-start gap-2.5">
										<CheckIcon
											className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
											strokeWidth={2.5}
										/>
										<span className="text-sm text-zinc-600">{item}</span>
									</li>
								))}
							</ul>
							<Link
								to="/register"
								className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 font-semibold text-sm text-white transition-all duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-zinc-800 active:scale-[0.97] lg:px-6 lg:py-3"
							>
								Set up your Skill School
								<span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
									<ArrowRightIcon className="h-3 w-3" strokeWidth={2.5} />
								</span>
							</Link>
						</div>

						{/* Right — class cards */}
						<div className="skill-grid grid grid-cols-1 gap-4 sm:grid-cols-2">
							{[
								{
									level: "Beginner",
									title: "Foundation Clinic",
									coach: "Sarah O.",
									spots: 2,
									total: 6,
									time: "Tue 9:00 AM",
									color: "bg-emerald-500",
									bg: "bg-emerald-50",
									text: "text-emerald-700",
									icon: BookOpenIcon,
								},
								{
									level: "Intermediate",
									title: "Dink & Drive",
									coach: "Marcus T.",
									spots: 1,
									total: 6,
									time: "Thu 7:00 PM",
									color: "bg-sky-500",
									bg: "bg-sky-50",
									text: "text-sky-700",
									icon: BookOpenIcon,
								},
								{
									level: "Advanced",
									title: "Power Serves",
									coach: "Lisa N.",
									spots: 4,
									total: 4,
									time: "Sat 8:30 AM",
									color: "bg-amber-500",
									bg: "bg-amber-50",
									text: "text-amber-700",
									icon: BookOpenIcon,
								},
								{
									level: "Private",
									title: "1-on-1 Session",
									coach: "James R.",
									spots: 1,
									total: 1,
									time: "Flexible",
									color: "bg-violet-500",
									bg: "bg-violet-50",
									text: "text-violet-700",
									icon: BookOpenIcon,
								},
							].map((cls) => {
								const Icon = cls.icon;
								return (
									<div
										key={cls.title}
										className="skill-card rounded-2xl border border-zinc-200/60 bg-white p-5 transition-all duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-zinc-300 hover:shadow-[0_8px_28px_-8px_rgba(0,0,0,0.08)]"
									>
										<div className="mb-3 flex items-center justify-between">
											<span
												className={`rounded-full ${cls.bg} ${cls.text} px-2.5 py-1 font-semibold text-[11px]`}
											>
												{cls.level}
											</span>
											<div
												className={`flex h-7 w-7 items-center justify-center rounded-lg ${cls.bg}`}
											>
												<Icon
													className={`h-3.5 w-3.5 ${cls.text}`}
													strokeWidth={2}
												/>
											</div>
										</div>
										<p className="mb-0.5 font-semibold text-zinc-900">
											{cls.title}
										</p>
										<p className="mb-3 text-xs text-zinc-400">
											{cls.coach} · {cls.time}
										</p>
										<div className="flex items-center justify-between">
											<div className="mr-3 h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
												<div
													className={`h-full rounded-full ${cls.color}`}
													style={{
														width: `${((cls.total - cls.spots) / cls.total) * 100}%`,
													}}
												/>
											</div>
											<span className="shrink-0 font-medium text-[11px] text-zinc-500">
												{cls.spots === 0
													? "Full"
													: `${cls.spots} spot${cls.spots > 1 ? "s" : ""} left`}
											</span>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</section>

			{/* ═══ CLUB REWARDS ══════════════════════════════════════════ */}
			<section
				id="rewards"
				className="rewards-section overflow-hidden bg-zinc-900 py-24 lg:py-32"
			>
				<div className="mx-auto max-w-7xl px-6 lg:px-8 2xl:max-w-[1440px] 2xl:px-12">
					{/* Ambient */}
					<div className="pointer-events-none absolute top-0 left-0 h-full w-full overflow-hidden">
						<div className="absolute top-0 left-[10%] h-80 w-80 rounded-full bg-emerald-500/[0.07] blur-3xl" />
						<div className="absolute right-[10%] bottom-0 h-60 w-60 rounded-full bg-teal-500/[0.05] blur-3xl" />
					</div>
					<div className="relative">
						<div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
							<div>
								<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
									<GiftIcon
										className="h-3 w-3 text-emerald-400"
										strokeWidth={2}
									/>
									<span className="font-semibold text-[11px] text-emerald-400 uppercase tracking-[0.18em]">
										Club Rewards
									</span>
								</div>
								<h2 className="max-w-3xl font-extrabold text-4xl text-white leading-tight tracking-tight lg:text-5xl 2xl:text-6xl">
									Your club earns every time
									<br />
									<span className="text-emerald-400">a member shops.</span>
								</h2>
							</div>
							<Link
								to="/register"
								className="inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 font-semibold text-sm text-white shadow-[0_4px_20px_-4px_rgba(16,185,129,0.4)] transition-all duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-emerald-400 active:scale-[0.97] lg:px-6 lg:py-3"
							>
								Register your club
								<span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
									<ArrowRightIcon className="h-3 w-3" strokeWidth={2.5} />
								</span>
							</Link>
						</div>

						{/* Stats row */}
						<div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
							{REWARDS_STATS.map((rs) => (
								<div
									key={rs.label}
									className="reward-stat rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
								>
									<p className="mb-1 font-extrabold text-3xl text-white xl:text-4xl">
										{rs.value}
									</p>
									<p className="text-sm text-zinc-400">{rs.label}</p>
								</div>
							))}
						</div>

						{/* How it works */}
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
							{[
								{
									step: "01",
									title: "Register your club code",
									desc: "Get a unique club code (e.g. RALLYPOINT) in 2 minutes. Share it with your members.",
								},
								{
									step: "02",
									title: "Members shop with your code",
									desc: "Every purchase made with your code earns your club 7% cashback automatically.",
								},
								{
									step: "03",
									title: "Get paid monthly",
									desc: "Earnings accumulate in your club wallet and are paid out via Stripe every month.",
								},
							].map((item) => (
								<div
									key={item.step}
									className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
								>
									<p className="mb-3 font-mono text-xs text-zinc-500">
										{item.step}
									</p>
									<p className="mb-2 font-semibold text-white">{item.title}</p>
									<p className="text-sm text-zinc-400 leading-relaxed">
										{item.desc}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ═══ TESTIMONIALS ══════════════════════════════════════════ */}
			<section className="py-24 lg:py-32">
				<div className="mx-auto max-w-7xl px-6 lg:px-8 2xl:max-w-[1440px] 2xl:px-12">
					<div className="mb-12 lg:mb-16">
						<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200/60 bg-zinc-100 px-3 py-1">
							<span className="font-semibold text-[11px] text-zinc-500 uppercase tracking-[0.18em]">
								Testimonials
							</span>
						</div>
						<h2 className="max-w-xl font-extrabold text-4xl text-zinc-900 leading-tight tracking-tight lg:text-5xl">
							Clubs love Pickle Power Sports
						</h2>
					</div>
					<div className="testi-grid grid grid-cols-1 gap-4 md:grid-cols-3">
						{TESTIMONIALS.map((t) => (
							<div
								key={t.name}
								className="testi-card rounded-2xl border border-zinc-200/60 bg-white p-6 transition-all duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-zinc-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.07)] lg:p-7"
							>
								<div className="mb-4 flex gap-0.5">
									{[1, 2, 3, 4, 5].map((s) => (
										<StarIcon
											key={s}
											className="h-4 w-4 fill-yellow-400 text-yellow-400"
											strokeWidth={1.5}
										/>
									))}
								</div>
								<p className="mb-5 text-sm text-zinc-600 leading-relaxed">
									"{t.quote}"
								</p>
								<div className="flex items-center gap-3">
									<div
										className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${t.grad} font-bold text-white text-xs`}
									>
										{t.initials}
									</div>
									<div>
										<p className="font-semibold text-sm text-zinc-900">
											{t.name}
										</p>
										<p className="text-xs text-zinc-400">{t.role}</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ═══ HOW IT WORKS ══════════════════════════════════════════ */}
			<section
				id="how-it-works"
				className="steps-wrap border-zinc-100 border-t bg-white py-24 lg:py-32"
			>
				<div className="mx-auto max-w-7xl px-6 lg:px-8 2xl:max-w-[1440px] 2xl:px-12">
					<div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[360px_1fr] lg:gap-16 xl:grid-cols-[400px_1fr] 2xl:grid-cols-[440px_1fr] 2xl:gap-24">
						<div className="lg:sticky lg:top-28">
							<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200/60 bg-zinc-100 px-3 py-1">
								<span className="font-semibold text-[11px] text-zinc-500 uppercase tracking-[0.18em]">
									Process
								</span>
							</div>
							<h2 className="font-extrabold text-4xl text-zinc-900 leading-tight tracking-tight lg:text-5xl 2xl:text-6xl">
								Up and running in minutes.
							</h2>
							<p className="mt-4 max-w-[40ch] text-zinc-500 leading-relaxed">
								No technical setup required. If you can use a web browser, you
								can run a club.
							</p>
							<Link
								to="/register"
								className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 font-semibold text-sm text-white shadow-[0_4px_16px_-4px_rgba(5,150,105,0.35)] transition-all duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-emerald-700 active:scale-[0.97] lg:px-6 lg:py-3"
							>
								Create your club
								<span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
									<ArrowRightIcon className="h-3 w-3" strokeWidth={2.5} />
								</span>
							</Link>
						</div>

						<div>
							{STEPS.map((step, idx) => (
								<div
									key={step.n}
									className={`step-row flex gap-6 py-8 lg:py-10 2xl:py-12 ${
										idx < STEPS.length - 1 ? "border-zinc-100 border-b" : ""
									}`}
								>
									<div className="w-8 shrink-0 pt-0.5 font-bold font-mono text-xs text-zinc-300">
										{step.n}
									</div>
									<div>
										<p className="mb-2 font-semibold text-zinc-900 lg:text-lg">
											{step.title}
										</p>
										<p className="max-w-[46ch] text-sm text-zinc-500 leading-relaxed lg:text-base">
											{step.desc}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ═══ CTA ═══════════════════════════════════════════════════ */}
			<section className="py-24 lg:py-32">
				<div className="mx-auto max-w-7xl px-6 lg:px-8 2xl:max-w-[1440px] 2xl:px-12">
					<div className="cta-panel relative overflow-hidden rounded-3xl bg-zinc-900 px-8 py-14 md:px-12 lg:px-16 lg:py-20 2xl:px-20 2xl:py-24">
						<div className="pointer-events-none absolute inset-0">
							<div className="absolute top-0 left-[15%] h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
							<div className="absolute right-[15%] bottom-0 h-56 w-56 rounded-full bg-teal-500/[0.07] blur-3xl" />
						</div>
						<div className="relative z-10 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
							<div className="max-w-lg">
								<p className="mb-3 font-extrabold text-3xl text-white leading-tight tracking-tight lg:text-4xl 2xl:text-5xl">
									Ready to run your club?
								</p>
								<p className="text-sm text-zinc-400 leading-relaxed lg:text-base">
									Join clubs already using Pickle Power Sports to manage their
									facilities, members, and revenue — all from one platform.
								</p>
							</div>
							<Link
								to="/register"
								className="flex shrink-0 items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 font-semibold text-sm text-white shadow-[0_4px_20px_-4px_rgba(16,185,129,0.5)] transition-all duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-emerald-400 active:scale-[0.97] lg:px-7 lg:py-3.5"
							>
								Get started free
								<span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
									<ArrowRightIcon className="h-3 w-3" strokeWidth={2.5} />
								</span>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* ═══ FOOTER ════════════════════════════════════════════════ */}
			<footer className="border-zinc-200/60 border-t bg-white">
				<div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 2xl:max-w-[1440px] 2xl:px-12">
					<div className="mb-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
						{[
							{
								heading: "Platform",
								links: [
									["#features", "Features"],
									["#skill-school", "Skill School"],
									["#rewards", "Club Rewards"],
									["#how-it-works", "How it works"],
								],
							},
							{
								heading: "Product",
								links: [
									["/login", "Sign in"],
									["/register", "Get started"],
									["/register", "Pricing"],
									["/register", "Changelog"],
								],
							},
							{
								heading: "Features",
								links: [
									["#features", "Court Bookings"],
									["#features", "Tournaments"],
									["#features", "Member Mgmt"],
									["#features", "Analytics"],
								],
							},
							{
								heading: "Company",
								links: [
									["/register", "About"],
									["/register", "Blog"],
									["/register", "Contact"],
									["/register", "Privacy"],
								],
							},
						].map((col) => (
							<div key={col.heading}>
								<p className="mb-3 font-semibold text-xs text-zinc-900 uppercase tracking-wider">
									{col.heading}
								</p>
								<ul className="space-y-2">
									{col.links.map(([href, label]) => (
										<li key={label}>
											<a
												href={href}
												className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
											>
												{label}
											</a>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
					<div className="flex flex-col items-center justify-between gap-4 border-zinc-100 border-t pt-8 sm:flex-row">
						<div className="flex items-center gap-2">
							<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600">
								<ZapIcon className="h-3 w-3 text-white" strokeWidth={2.5} />
							</div>
							<span className="font-semibold text-sm text-zinc-900">
								Pickle Power Sports
							</span>
						</div>
						<p className="text-xs text-zinc-400">
							© {new Date().getFullYear()} Pickle Power Sports. All rights
							reserved.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}

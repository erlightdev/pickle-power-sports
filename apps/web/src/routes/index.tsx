import { createFileRoute, Link } from "@tanstack/react-router";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
	ArrowRightIcon,
	BarChart3Icon,
	Building2Icon,
	CalendarCheckIcon,
	CheckIcon,
	ShoppingBagIcon,
	TrophyIcon,
	UsersIcon,
	ZapIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { isTenantHost, requireResolvedTenant } from "@/lib/tenant-guard";

gsap.registerPlugin(ScrollTrigger);

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
		if (!isTenantHost()) {
			return;
		}
		await requireResolvedTenant();
	},
});

const FEATURES = [
	{
		id: "courts",
		icon: CalendarCheckIcon,
		label: "Court Bookings",
		desc: "Real-time availability, online reservations, staff approval workflows, and automated player reminders for every facility.",
		accent: "bg-emerald-50",
		iconColor: "text-emerald-600",
		wide: true,
	},
	{
		id: "members",
		icon: UsersIcon,
		label: "Member Management",
		desc: "Full profiles, activity tracking, membership tiers, and bulk communication tools.",
		accent: "bg-sky-50",
		iconColor: "text-sky-600",
		wide: false,
	},
	{
		id: "tournaments",
		icon: TrophyIcon,
		label: "Tournaments & Programs",
		desc: "Run brackets, leagues, clinics, and coaching programs with online registration.",
		accent: "bg-amber-50",
		iconColor: "text-amber-600",
		wide: false,
	},
	{
		id: "commerce",
		icon: ShoppingBagIcon,
		label: "Club Store",
		desc: "Paddles, gear, memberships — inventory management and order tracking built in.",
		accent: "bg-rose-50",
		iconColor: "text-rose-600",
		wide: false,
	},
	{
		id: "multiclub",
		icon: Building2Icon,
		label: "Multi-Club Platform",
		desc: "Each club gets its own subdomain, custom branding, and fully isolated member database.",
		accent: "bg-violet-50",
		iconColor: "text-violet-600",
		wide: true,
	},
	{
		id: "analytics",
		icon: BarChart3Icon,
		label: "Live Analytics",
		desc: "Revenue, bookings, and member activity — a real-time dashboard with zero manual reporting.",
		accent: "bg-teal-50",
		iconColor: "text-teal-600",
		wide: false,
	},
];

const STEPS = [
	{
		n: "01",
		title: "Create your club",
		desc: "Register on Pickle Power Sports and have your club's own branded subdomain live in under 2 minutes.",
	},
	{
		n: "02",
		title: "Invite your team",
		desc: "Add coaches, staff, and members. Assign roles, configure courts, and set up your program catalogue.",
	},
	{
		n: "03",
		title: "Go live",
		desc: "Start accepting bookings, tournament registrations, and store orders. Your operations run on autopilot.",
	},
];

const MARQUEE_ITEMS = [
	"Court Management",
	"Member Profiles",
	"Tournament Brackets",
	"Club Store",
	"Subdomain Branding",
	"Live Analytics",
	"OTP Authentication",
	"Role-Based Access",
];

const HERO_WORDS_1 = ["The", "operating"];
const HERO_WORDS_2 = ["system", "for"];
const HERO_WORDS_3 = ["pickleball", "clubs."];

function HeroWord({ word, accent }: { word: string; accent?: boolean }) {
	return (
		<span className="inline-block overflow-hidden">
			<span
				className={`hero-word inline-block ${accent ? "text-emerald-600" : "text-zinc-900"}`}
			>
				{word}
			</span>
		</span>
	);
}

function StatCard({
	target,
	suffix,
	label,
}: {
	target: number;
	suffix: string;
	label: string;
}) {
	return (
		<div className="text-center md:text-left">
			<div className="flex items-baseline justify-center gap-0.5 md:justify-start">
				<span
					className="stat-count font-extrabold text-4xl text-zinc-900 tracking-tight"
					data-target={target}
				>
					0
				</span>
				<span className="font-extrabold text-4xl text-emerald-600 tracking-tight">
					{suffix}
				</span>
			</div>
			<div className="mt-1 text-sm text-zinc-500">{label}</div>
		</div>
	);
}

function HomeComponent() {
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const ctx = gsap.context(() => {
			// ── Hero entry ──────────────────────────────────────────
			gsap.from(".hero-eyebrow", {
				y: 10,
				opacity: 0,
				duration: 0.6,
				ease: "power2.out",
				delay: 0.1,
			});

			gsap.from(".hero-word", {
				y: 88,
				opacity: 0,
				duration: 0.88,
				stagger: 0.07,
				ease: "power3.out",
				delay: 0.2,
			});

			gsap.from(".hero-sub", {
				y: 18,
				opacity: 0,
				duration: 0.72,
				ease: "power2.out",
				delay: 0.78,
			});

			gsap.from(".hero-cta", {
				y: 16,
				opacity: 0,
				duration: 0.6,
				stagger: 0.1,
				ease: "power2.out",
				delay: 0.92,
			});

			gsap.from(".hero-checks", {
				y: 10,
				opacity: 0,
				duration: 0.5,
				ease: "power2.out",
				delay: 1.1,
			});

			gsap.from(".hero-visual", {
				x: 28,
				opacity: 0,
				duration: 1,
				ease: "power3.out",
				delay: 0.35,
			});

			// ── Floating cards ───────────────────────────────────────
			gsap.to(".float-card-1", {
				y: -14,
				duration: 2.4,
				ease: "sine.inOut",
				repeat: -1,
				yoyo: true,
			});

			gsap.to(".float-card-2", {
				y: -9,
				duration: 1.9,
				ease: "sine.inOut",
				repeat: -1,
				yoyo: true,
				delay: 0.5,
			});

			gsap.to(".float-card-3", {
				y: -7,
				duration: 2.1,
				ease: "sine.inOut",
				repeat: -1,
				yoyo: true,
				delay: 0.9,
			});

			// ── Marquee ─────────────────────────────────────────────
			gsap.to(".marquee-inner", {
				x: "-50%",
				duration: 22,
				ease: "none",
				repeat: -1,
			});

			// ── Stat counters ────────────────────────────────────────
			document.querySelectorAll<HTMLElement>(".stat-count").forEach((el) => {
				const target = Number.parseInt(el.dataset.target ?? "0", 10);
				const obj = { val: 0 };
				gsap.to(obj, {
					val: target,
					duration: 2,
					ease: "power2.out",
					scrollTrigger: {
						trigger: el,
						start: "top 88%",
						once: true,
					},
					onUpdate() {
						el.textContent = Math.round(obj.val).toLocaleString();
					},
				});
			});

			// ── Feature cards ────────────────────────────────────────
			gsap.from(".feature-card", {
				y: 48,
				opacity: 0,
				duration: 0.7,
				stagger: { amount: 0.45, from: "start" },
				ease: "power3.out",
				scrollTrigger: {
					trigger: ".features-grid",
					start: "top 78%",
				},
			});

			// ── Steps ────────────────────────────────────────────────
			gsap.from(".step-item", {
				x: -22,
				opacity: 0,
				duration: 0.65,
				stagger: 0.14,
				ease: "power2.out",
				scrollTrigger: {
					trigger: ".steps-section",
					start: "top 82%",
				},
			});

			// ── CTA ──────────────────────────────────────────────────
			gsap.from(".cta-inner", {
				scale: 0.96,
				opacity: 0,
				duration: 0.8,
				ease: "power3.out",
				scrollTrigger: {
					trigger: ".cta-inner",
					start: "top 88%",
				},
			});
		}, rootRef);

		return () => ctx.revert();
	}, []);

	return (
		<div
			ref={rootRef}
			className="min-h-[100dvh] bg-[#f8faf9] text-zinc-900"
			style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
		>
			{/* ─── NAV ─────────────────────────────────────────────── */}
			<nav className="fixed top-5 left-1/2 z-50 w-full max-w-5xl -translate-x-1/2 px-4">
				<div className="flex items-center justify-between rounded-full border border-zinc-200/60 bg-white/80 px-5 py-2.5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] backdrop-blur-md">
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600">
							<ZapIcon className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
						</div>
						<span className="font-semibold text-sm text-zinc-900 tracking-tight">
							Pickle Power Sports
						</span>
					</div>
					<div className="hidden items-center gap-6 md:flex">
						<a
							href="#features"
							className="text-sm text-zinc-500 transition-colors duration-200 hover:text-zinc-900"
						>
							Features
						</a>
						<a
							href="#how-it-works"
							className="text-sm text-zinc-500 transition-colors duration-200 hover:text-zinc-900"
						>
							How it works
						</a>
					</div>
					<Link
						to="/register"
						className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-1.5 font-medium text-sm text-white transition-colors duration-200 hover:bg-zinc-800 active:scale-[0.98]"
					>
						Get started
						<span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
							<ArrowRightIcon className="h-3 w-3" strokeWidth={2.5} />
						</span>
					</Link>
				</div>
			</nav>

			{/* ─── HERO ────────────────────────────────────────────── */}
			<section className="flex min-h-[100dvh] items-center pt-28 pb-20">
				<div className="mx-auto w-full max-w-[1400px] px-6">
					<div className="grid grid-cols-1 items-center gap-12 md:grid-cols-[1fr_480px] lg:gap-20">
						{/* Left */}
						<div>
							<div className="hero-eyebrow mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1">
								<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
								<span className="font-semibold text-[11px] text-emerald-700 uppercase tracking-[0.18em]">
									Sports Management Platform
								</span>
							</div>

							<h1 className="mb-6 font-extrabold text-5xl leading-[1.05] tracking-tight md:text-6xl xl:text-7xl">
								<div className="flex flex-wrap gap-x-3 gap-y-1">
									{HERO_WORDS_1.map((w) => (
										<HeroWord key={w} word={w} />
									))}
								</div>
								<div className="flex flex-wrap gap-x-3 gap-y-1">
									{HERO_WORDS_2.map((w) => (
										<HeroWord key={w} word={w} />
									))}
								</div>
								<div className="flex flex-wrap gap-x-3 gap-y-1">
									{HERO_WORDS_3.map((w) => (
										<HeroWord key={w} word={w} accent />
									))}
								</div>
							</h1>

							<p className="hero-sub mb-8 max-w-[52ch] text-lg text-zinc-500 leading-relaxed">
								Manage court bookings, members, tournaments, and your club store
								from one platform. Every club gets its own branded subdomain.
							</p>

							<div className="flex flex-wrap items-center gap-3">
								<Link
									to="/register"
									className="hero-cta flex items-center gap-2.5 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-sm text-white shadow-[0_4px_16px_-4px_rgba(5,150,105,0.4)] transition-all duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-emerald-700 active:scale-[0.98]"
								>
									Start free
									<span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
										<ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
									</span>
								</Link>
								<Link
									to="/login"
									className="hero-cta flex items-center gap-2 rounded-full px-4 py-3 font-medium text-sm text-zinc-700 transition-all duration-200 hover:bg-white/70 hover:text-zinc-900"
								>
									Sign in
									<ArrowRightIcon className="h-3.5 w-3.5" />
								</Link>
							</div>

							<div className="hero-checks mt-10 flex flex-wrap items-center gap-x-6 gap-y-2">
								{[
									"No credit card required",
									"Setup in 2 minutes",
									"Free for small clubs",
								].map((item) => (
									<div key={item} className="flex items-center gap-1.5">
										<CheckIcon
											className="h-3.5 w-3.5 shrink-0 text-emerald-500"
											strokeWidth={2.5}
										/>
										<span className="text-xs text-zinc-500">{item}</span>
									</div>
								))}
							</div>
						</div>

						{/* Right — animated UI mockup */}
						<div className="hero-visual relative hidden h-[480px] items-center justify-center md:flex">
							{/* Main booking card */}
							<div className="float-card-1 relative z-10 w-[300px] rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)]">
								<div className="mb-4 flex items-center justify-between">
									<div>
										<div className="font-medium text-xs text-zinc-400">
											Wednesday, 14 May
										</div>
										<div className="font-bold text-base text-zinc-900">
											Court A
										</div>
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
							<div className="float-card-2 absolute bottom-14 -left-6 z-20 w-[204px] rounded-xl border border-zinc-200/50 bg-white p-3 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.1)]">
								<div className="flex items-center gap-2.5">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 font-bold text-white text-xs">
										MR
									</div>
									<div className="min-w-0">
										<div className="truncate font-semibold text-xs text-zinc-900">
											Marcus Reyes
										</div>
										<div className="text-[10px] text-zinc-500">
											3 bookings this week
										</div>
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
							<div className="float-card-3 absolute top-14 -right-6 z-20 w-[172px] rounded-xl border border-zinc-200/50 bg-white p-3.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.1)]">
								<div className="mb-1 font-medium text-[10px] text-zinc-400 uppercase tracking-wider">
									Revenue
								</div>
								<div className="mb-1 font-bold text-2xl text-zinc-900">
									$18.6k
								</div>
								<div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-[11px] text-emerald-600">
									<span>↑</span>
									<span>+18.2%</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ─── MARQUEE ─────────────────────────────────────────── */}
			<div className="overflow-hidden border-zinc-200/60 border-y bg-white/60 py-4">
				<div className="marquee-inner flex w-max gap-12">
					{[
						...MARQUEE_ITEMS,
						...MARQUEE_ITEMS,
						...MARQUEE_ITEMS,
						...MARQUEE_ITEMS,
					].map((label, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: static marquee items
							key={i}
							className="flex shrink-0 items-center gap-2"
						>
							<span className="h-1 w-1 rounded-full bg-emerald-400" />
							<span className="whitespace-nowrap font-medium text-sm text-zinc-400">
								{label}
							</span>
						</div>
					))}
				</div>
			</div>

			{/* ─── STATS ───────────────────────────────────────────── */}
			<section className="border-zinc-100 border-b bg-white py-20">
				<div className="mx-auto max-w-[1400px] px-6">
					<div className="grid grid-cols-2 gap-8 md:grid-cols-4">
						<StatCard target={2400} suffix="+" label="Active members" />
						<StatCard target={46} suffix="" label="Courts managed" />
						<StatCard target={128} suffix="+" label="Orders this week" />
						<StatCard target={23} suffix="" label="Clubs on platform" />
					</div>
				</div>
			</section>

			{/* ─── FEATURES ────────────────────────────────────────── */}
			<section id="features" className="py-28">
				<div className="mx-auto max-w-[1400px] px-6">
					<div className="mb-14">
						<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200/60 bg-zinc-100 px-3 py-1">
							<span className="font-semibold text-[11px] text-zinc-500 uppercase tracking-[0.18em]">
								Platform
							</span>
						</div>
						<h2 className="max-w-xl font-extrabold text-4xl leading-tight tracking-tight md:text-5xl">
							Everything your club needs
						</h2>
						<p className="mt-3 max-w-[50ch] text-zinc-500 leading-relaxed">
							From the first booking to the end-of-season report — one platform
							covers it all.
						</p>
					</div>

					<div className="features-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{FEATURES.map((f) => {
							const Icon = f.icon;
							return (
								<div
									key={f.id}
									className={`feature-card group rounded-2xl border border-zinc-200/60 bg-white p-6 transition-all duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-zinc-300 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.06)] ${
										f.wide ? "lg:col-span-2" : ""
									}`}
								>
									<div
										className={`h-10 w-10 rounded-xl ${f.accent} mb-4 flex items-center justify-center`}
									>
										<Icon
											className={`h-5 w-5 ${f.iconColor}`}
											strokeWidth={1.75}
										/>
									</div>
									<div className="mb-1.5 font-semibold text-zinc-900">
										{f.label}
									</div>
									<p className="text-sm text-zinc-500 leading-relaxed">
										{f.desc}
									</p>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* ─── HOW IT WORKS ────────────────────────────────────── */}
			<section
				id="how-it-works"
				className="steps-section border-zinc-100 border-t bg-white py-28"
			>
				<div className="mx-auto max-w-[1400px] px-6">
					<div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-[380px_1fr]">
						<div>
							<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200/60 bg-zinc-100 px-3 py-1">
								<span className="font-semibold text-[11px] text-zinc-500 uppercase tracking-[0.18em]">
									Process
								</span>
							</div>
							<h2 className="font-extrabold text-4xl leading-tight tracking-tight">
								Up and running in minutes.
							</h2>
							<p className="mt-4 text-zinc-500 leading-relaxed">
								No technical setup required. If you can use a web browser, you
								can run a club.
							</p>
							<Link
								to="/register"
								className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-sm text-white shadow-[0_4px_16px_-4px_rgba(5,150,105,0.35)] transition-all duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-emerald-700 active:scale-[0.98]"
							>
								Create your club
								<span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
									<ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
								</span>
							</Link>
						</div>

						<div>
							{STEPS.map((step, idx) => (
								<div
									key={step.n}
									className={`step-item flex gap-6 py-8 ${
										idx < STEPS.length - 1 ? "border-zinc-100 border-b" : ""
									}`}
								>
									<div className="w-8 shrink-0 pt-1 font-bold font-mono text-xs text-zinc-300">
										{step.n}
									</div>
									<div>
										<div className="mb-1.5 font-semibold text-zinc-900">
											{step.title}
										</div>
										<p className="max-w-[44ch] text-sm text-zinc-500 leading-relaxed">
											{step.desc}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ─── CTA ─────────────────────────────────────────────── */}
			<section className="py-28">
				<div className="mx-auto max-w-[1400px] px-6">
					<div className="cta-inner relative overflow-hidden rounded-3xl bg-zinc-900 px-10 py-16 md:px-16">
						<div className="pointer-events-none absolute inset-0">
							<div className="absolute top-0 left-1/4 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
							<div className="absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-teal-500/[0.08] blur-3xl" />
						</div>
						<div className="relative z-10 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
							<div>
								<div className="mb-2 font-extrabold text-3xl text-white leading-tight tracking-tight md:text-4xl">
									Ready to run your club?
								</div>
								<p className="max-w-[44ch] text-zinc-400 leading-relaxed">
									Join clubs already using Pickle Power Sports to manage their
									facilities, members, and revenue.
								</p>
							</div>
							<Link
								to="/register"
								className="flex shrink-0 items-center gap-2.5 rounded-full bg-emerald-500 px-7 py-3.5 font-semibold text-sm text-white shadow-[0_4px_20px_-4px_rgba(16,185,129,0.5)] transition-all duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-emerald-400 active:scale-[0.98]"
							>
								Get started free
								<span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
									<ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
								</span>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* ─── FOOTER ──────────────────────────────────────────── */}
			<footer className="border-zinc-200/60 border-t bg-white">
				<div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
					<div className="flex items-center gap-2">
						<div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600">
							<ZapIcon className="h-3 w-3 text-white" strokeWidth={2.5} />
						</div>
						<span className="font-semibold text-sm text-zinc-900">
							Pickle Power Sports
						</span>
					</div>
					<div className="text-xs text-zinc-400">
						© {new Date().getFullYear()} Pickle Power Sports. All rights
						reserved.
					</div>
					<div className="flex items-center gap-5">
						<Link
							to="/login"
							className="text-xs text-zinc-400 transition-colors hover:text-zinc-700"
						>
							Sign in
						</Link>
						<Link
							to="/register"
							className="text-xs text-zinc-400 transition-colors hover:text-zinc-700"
						>
							Register
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}

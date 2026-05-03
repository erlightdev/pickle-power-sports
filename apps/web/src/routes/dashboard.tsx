import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
} from "@Pickle-Power-Sports/ui/components/breadcrumb";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@Pickle-Power-Sports/ui/components/card";
import { Separator } from "@Pickle-Power-Sports/ui/components/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@Pickle-Power-Sports/ui/components/sidebar";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	ActivityIcon,
	CalendarCheckIcon,
	CircleDollarSignIcon,
	PackageCheckIcon,
	ShieldCheckIcon,
	TrophyIcon,
	UsersIcon,
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { authClient } from "@/lib/auth-client";
import { requireResolvedTenant } from "@/lib/tenant-guard";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
	beforeLoad: async () => {
		await requireResolvedTenant();
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				throw: true,
			});
		}
		return { session };
	},
});

const metricCards = [
	{
		label: "Orders",
		value: "128",
		detail: "+18.2% from last week",
		icon: PackageCheckIcon,
	},
	{
		label: "Court bookings",
		value: "46",
		detail: "12 need staff review",
		icon: CalendarCheckIcon,
	},
	{
		label: "Members",
		value: "2,418",
		detail: "94 active this week",
		icon: UsersIcon,
	},
	{
		label: "Revenue",
		value: "$18.6k",
		detail: "Demo data until payments are wired",
		icon: CircleDollarSignIcon,
	},
];

const workQueue = [
	{
		title: "Approve pending court bookings",
		area: "Facilities",
		status: "12 waiting",
	},
	{
		title: "Review low-stock paddle inventory",
		area: "Commerce",
		status: "8 SKUs",
	},
	{
		title: "Confirm tournament registrations",
		area: "Programs",
		status: "23 players",
	},
];

function RouteComponent() {
	const { session } = Route.useRouteContext();
	const privateData = useQuery(trpc.privateData.queryOptions());
	const user = session.data?.user;

	return (
		<SidebarProvider className="h-full min-h-0">
			<AppSidebar user={user} />
			<SidebarInset className="min-h-0 overflow-auto">
				<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator className="mr-2 h-4" orientation="vertical" />
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbPage>Dashboard</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<div className="ml-auto">
						<ModeToggle />
					</div>
				</header>

				<main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
					<section className="flex flex-col gap-2">
						<div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
							<div>
								<h1 className="font-semibold text-2xl tracking-normal">
									Pickle Power Sports
								</h1>
								<p className="text-muted-foreground text-sm">
									Welcome back, {user?.name || "admin"}.
								</p>
							</div>
							<div className="inline-flex items-center gap-2 text-muted-foreground text-xs">
								<ShieldCheckIcon className="size-4 text-foreground" />
								<span>{privateData.data?.message ?? "Session verified"}</span>
							</div>
						</div>
					</section>

					<section
						className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
						id="performance"
					>
						{metricCards.map((metric) => {
							const Icon = metric.icon;
							return (
								<Card key={metric.label}>
									<CardHeader>
										<CardTitle>{metric.label}</CardTitle>
										<CardDescription>{metric.detail}</CardDescription>
										<CardAction>
											<Icon className="size-4 text-muted-foreground" />
										</CardAction>
									</CardHeader>
									<CardContent>
										<div className="font-semibold text-2xl">{metric.value}</div>
									</CardContent>
								</Card>
							);
						})}
					</section>

					<section className="grid gap-4 xl:grid-cols-[1fr_22rem]">
						<Card id="today">
							<CardHeader>
								<CardTitle>Operations Queue</CardTitle>
								<CardDescription>
									Priority work across store, venues, and programs.
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-3">
								{workQueue.map((item) => (
									<div
										className="grid gap-1 border-b pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center"
										key={item.title}
									>
										<div>
											<div className="font-medium">{item.title}</div>
											<div className="text-muted-foreground">{item.area}</div>
										</div>
										<div className="font-medium text-foreground text-xs">
											{item.status}
										</div>
									</div>
								))}
							</CardContent>
						</Card>

						<Card id="tasks">
							<CardHeader>
								<CardTitle>Live Signals</CardTitle>
								<CardDescription>
									Backend and business activity snapshot.
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-3">
								<div className="flex items-center gap-3">
									<ActivityIcon className="size-4 text-muted-foreground" />
									<div>
										<div className="font-medium">API status</div>
										<div className="text-muted-foreground">
											{privateData.isLoading ? "Checking" : "Ready"}
										</div>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<TrophyIcon className="size-4 text-muted-foreground" />
									<div>
										<div className="font-medium">Tournament pipeline</div>
										<div className="text-muted-foreground">
											Registration workflow prepared
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</section>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

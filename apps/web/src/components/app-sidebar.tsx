"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@Pickle-Power-Sports/ui/components/sidebar";
import {
	ActivityIcon,
	BarChart3Icon,
	Building2Icon,
	CalendarDaysIcon,
	DumbbellIcon,
	LayoutDashboardIcon,
	MapPinnedIcon,
	PackageSearchIcon,
	Settings2Icon,
	ShoppingCartIcon,
	TrophyIcon,
	UsersIcon,
} from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";

type AppSidebarUser = {
	name?: string | null;
	email?: string | null;
	image?: string | null;
};

const data = {
	teams: [
		{
			name: "Pickle Power Sports",
			logo: <DumbbellIcon className="size-4" />,
			plan: "Main tenant",
		},
		{
			name: "Coaching Desk",
			logo: <UsersIcon className="size-4" />,
			plan: "Programs",
		},
		{
			name: "Venue Ops",
			logo: <MapPinnedIcon className="size-4" />,
			plan: "Facilities",
		},
	],
	navMain: [
		{
			title: "Overview",
			url: "/dashboard",
			icon: <LayoutDashboardIcon />,
			isActive: true,
			items: [
				{
					title: "Today",
					url: "#today",
				},
				{
					title: "Performance",
					url: "#performance",
				},
				{
					title: "Tasks",
					url: "#tasks",
				},
			],
		},
		{
			title: "Commerce",
			url: "#commerce",
			icon: <ShoppingCartIcon />,
			items: [
				{
					title: "Orders",
					url: "#orders",
				},
				{
					title: "Products",
					url: "#products",
				},
				{
					title: "Reviews",
					url: "#reviews",
				},
			],
		},
		{
			title: "Facilities",
			url: "#facilities",
			icon: <Building2Icon />,
			items: [
				{
					title: "Venues",
					url: "#venues",
				},
				{
					title: "Courts",
					url: "#courts",
				},
				{
					title: "Bookings",
					url: "#bookings",
				},
			],
		},
		{
			title: "Programs",
			url: "#programs",
			icon: <CalendarDaysIcon />,
			items: [
				{
					title: "Classes",
					url: "#classes",
				},
				{
					title: "Coaches",
					url: "#coaches",
				},
				{
					title: "Tournaments",
					url: "#tournaments",
				},
			],
		},
		{
			title: "Settings",
			url: "/team#members",
			icon: <Settings2Icon />,
			items: [
				{
					title: "Tenant",
					url: "/team#tenant",
				},
				{
					title: "Members",
					url: "/team#members",
				},
				{
					title: "Domains",
					url: "/team#domains",
				},
			],
		},
	],
	projects: [
		{
			name: "Catalog Health",
			url: "#products",
			icon: <PackageSearchIcon />,
		},
		{
			name: "Court Utilization",
			url: "#courts",
			icon: <ActivityIcon />,
		},
		{
			name: "Tournament Pipeline",
			url: "#tournaments",
			icon: <TrophyIcon />,
		},
		{
			name: "Revenue Snapshot",
			url: "#performance",
			icon: <BarChart3Icon />,
		},
	],
};

export function AppSidebar({
	user,
	...props
}: React.ComponentProps<typeof Sidebar> & {
	user?: AppSidebarUser;
}) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<TeamSwitcher teams={data.teams} />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				<NavProjects projects={data.projects} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser
					user={{
						name: user?.name || "Pickle Power Admin",
						email: user?.email || "admin@picklepowersports.local",
						avatar: user?.image || "",
					}}
				/>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}

"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@Pickle-Power-Sports/ui/components/dropdown-menu";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@Pickle-Power-Sports/ui/components/sidebar";
import {
	ArrowRightIcon,
	FolderIcon,
	MoreHorizontalIcon,
	PinIcon,
} from "lucide-react";
import type { ReactNode } from "react";

export function NavProjects({
	projects,
}: {
	projects: {
		name: string;
		url: string;
		icon: ReactNode;
	}[];
}) {
	const { isMobile } = useSidebar();

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>Reports</SidebarGroupLabel>
			<SidebarMenu>
				{projects.map((item) => (
					<SidebarMenuItem key={item.name}>
						<SidebarMenuButton
							render={
								<a href={item.url}>
									{item.icon}
									<span>{item.name}</span>
								</a>
							}
						/>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<SidebarMenuAction
										className="aria-expanded:bg-muted"
										showOnHover
									/>
								}
							>
								<MoreHorizontalIcon />
								<span className="sr-only">More</span>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align={isMobile ? "end" : "start"}
								className="w-48 rounded-lg"
								side={isMobile ? "bottom" : "right"}
							>
								<DropdownMenuItem>
									<FolderIcon className="text-muted-foreground" />
									<span>Open report</span>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<ArrowRightIcon className="text-muted-foreground" />
									<span>Share report</span>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem>
									<PinIcon className="text-muted-foreground" />
									<span>Pin report</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				))}
				<SidebarMenuItem>
					<SidebarMenuButton className="text-sidebar-foreground/70">
						<MoreHorizontalIcon className="text-sidebar-foreground/70" />
						<span>More</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	);
}

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@Pickle-Power-Sports/ui/components/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@Pickle-Power-Sports/ui/components/sidebar";
import { ChevronRightIcon } from "lucide-react";
import type { ReactNode } from "react";

export function NavMain({
	items,
}: {
	items: {
		title: string;
		url: string;
		icon?: ReactNode;
		isActive?: boolean;
		items?: {
			title: string;
			url: string;
		}[];
	}[];
}) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel>Dashboard</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<Collapsible
						className="group/collapsible"
						defaultOpen={item.isActive}
						key={item.title}
						render={<SidebarMenuItem />}
					>
						<CollapsibleTrigger
							render={<SidebarMenuButton tooltip={item.title} />}
						>
							{item.icon}
							<span>{item.title}</span>
							<ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
						</CollapsibleTrigger>
						<CollapsibleContent>
							<SidebarMenuSub>
								{item.items?.map((subItem) => (
									<SidebarMenuSubItem key={subItem.title}>
										<SidebarMenuSubButton
											render={<a href={subItem.url}>{subItem.title}</a>}
										/>
									</SidebarMenuSubItem>
								))}
							</SidebarMenuSub>
						</CollapsibleContent>
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}

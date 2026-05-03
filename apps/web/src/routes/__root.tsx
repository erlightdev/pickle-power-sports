import { Toaster } from "@Pickle-Power-Sports/ui/components/sonner";
import { TooltipProvider } from "@Pickle-Power-Sports/ui/components/tooltip";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import type { trpc } from "@/utils/trpc";

import "../index.css";

export interface RouterAppContext {
	trpc: typeof trpc;
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	head: () => ({
		meta: [
			{
				title: "Pickle-Power-Sports",
			},
			{
				name: "description",
				content: "Pickle-Power-Sports is a web application",
			},
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.ico",
			},
		],
	}),
});

function RootComponent() {
	const location = useLocation();
	const hideHeader =
		location.pathname.startsWith("/dashboard") ||
		location.pathname.startsWith("/profile") ||
		location.pathname.startsWith("/login") ||
		location.pathname.startsWith("/register") ||
		location.pathname.startsWith("/forgot-password") ||
		location.pathname.startsWith("/reset-password");

	return (
		<>
			<HeadContent />
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				disableTransitionOnChange
				storageKey="vite-ui-theme"
			>
				<TooltipProvider>
					<div
						className={hideHeader ? "h-svh" : "grid h-svh grid-rows-[auto_1fr]"}
					>
						{hideHeader ? null : <Header />}
						<Outlet />
					</div>
					<Toaster richColors />
				</TooltipProvider>
			</ThemeProvider>
			<TanStackRouterDevtools position="bottom-left" />
			<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
		</>
	);
}

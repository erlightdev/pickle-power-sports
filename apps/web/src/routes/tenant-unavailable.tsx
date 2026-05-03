import { buttonVariants } from "@Pickle-Power-Sports/ui/components/button";
import { cn } from "@Pickle-Power-Sports/ui/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangleIcon } from "lucide-react";

export const Route = createFileRoute("/tenant-unavailable")({
	component: TenantUnavailablePage,
});

function TenantUnavailablePage() {
	return (
		<main className="flex min-h-svh items-center justify-center bg-background px-4">
			<section className="w-full max-w-md border bg-card p-6 text-card-foreground">
				<div className="mb-4 flex size-10 items-center justify-center border bg-muted">
					<AlertTriangleIcon className="size-5" />
				</div>
				<h1 className="font-semibold text-2xl tracking-normal">
					Tenant unavailable
				</h1>
				<p className="mt-2 text-muted-foreground text-sm leading-6">
					This subdomain is no longer connected to an active tenant. Ask the
					system owner to restore it or create a new tenant domain.
				</p>
				<div className="mt-6">
					<Link className={cn(buttonVariants())} to="/">
						Go home
					</Link>
				</div>
			</section>
		</main>
	);
}

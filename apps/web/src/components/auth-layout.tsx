import { Link } from "@tanstack/react-router"
import { DumbbellIcon } from "lucide-react"
import type { ReactNode } from "react"

import { ModeToggle } from "@/components/mode-toggle"

export function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<div className="grid min-h-svh lg:grid-cols-2">
			{/* ── Left panel ── */}
			<div className="flex flex-col gap-4 p-6 md:p-10">
				<div className="flex items-center justify-between">
					<Link to="/" className="flex items-center gap-2 font-medium">
						<div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
							<DumbbellIcon className="size-4" />
						</div>
						Pickle Power Sports
					</Link>
					<ModeToggle />
				</div>

				<div className="flex flex-1 items-center justify-center">
					<div className="w-full max-w-xs">{children}</div>
				</div>
			</div>

			{/* ── Right panel ── */}
			<div className="bg-muted relative hidden lg:block">
				<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-12 text-center">
					<p className="font-semibold text-2xl tracking-tight">
						Australia's #1 Pickleball Store
					</p>
					<p className="max-w-xs text-muted-foreground text-sm leading-relaxed">
						Shop paddles, book courts, join lessons and compete in tournaments
						— all in one place.
					</p>
				</div>
			</div>
		</div>
	)
}

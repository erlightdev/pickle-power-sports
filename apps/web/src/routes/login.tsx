import { createFileRoute } from "@tanstack/react-router"

import { AuthLayout } from "@/components/auth-layout"
import { LoginForm } from "@/components/login-form"
import { requireResolvedTenant } from "@/lib/tenant-guard"

export const Route = createFileRoute("/login")({
	component: RouteComponent,
	beforeLoad: requireResolvedTenant,
})

function RouteComponent() {
	return (
		<AuthLayout>
			<LoginForm />
		</AuthLayout>
	)
}

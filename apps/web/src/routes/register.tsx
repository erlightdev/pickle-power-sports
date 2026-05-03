import { createFileRoute } from "@tanstack/react-router"

import { AuthLayout } from "@/components/auth-layout"
import { RegisterForm } from "@/components/register-form"
import { requireResolvedTenant } from "@/lib/tenant-guard"

export const Route = createFileRoute("/register")({
	component: RouteComponent,
	beforeLoad: requireResolvedTenant,
})

function RouteComponent() {
	return (
		<AuthLayout>
			<RegisterForm />
		</AuthLayout>
	)
}

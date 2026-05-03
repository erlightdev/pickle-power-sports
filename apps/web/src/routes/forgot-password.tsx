import { createFileRoute } from "@tanstack/react-router"

import { AuthLayout } from "@/components/auth-layout"
import { ForgotPasswordForm } from "@/components/forgot-password-form"
import { requireResolvedTenant } from "@/lib/tenant-guard"

export const Route = createFileRoute("/forgot-password")({
	component: RouteComponent,
	beforeLoad: requireResolvedTenant,
})

function RouteComponent() {
	return (
		<AuthLayout>
			<ForgotPasswordForm />
		</AuthLayout>
	)
}

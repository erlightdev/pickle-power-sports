import { createFileRoute } from "@tanstack/react-router"

import { AuthLayout } from "@/components/auth-layout"
import { ForgotPasswordForm } from "@/components/forgot-password-form"

export const Route = createFileRoute("/forgot-password")({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<AuthLayout>
			<ForgotPasswordForm />
		</AuthLayout>
	)
}

import { createFileRoute } from "@tanstack/react-router"

import { AuthLayout } from "@/components/auth-layout"
import { RegisterForm } from "@/components/register-form"

export const Route = createFileRoute("/register")({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<AuthLayout>
			<RegisterForm />
		</AuthLayout>
	)
}

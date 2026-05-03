import { Button } from "@Pickle-Power-Sports/ui/components/button"
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@Pickle-Power-Sports/ui/components/field"
import { Input } from "@Pickle-Power-Sports/ui/components/input"
import { cn } from "@Pickle-Power-Sports/ui/lib/utils"
import { Link } from "@tanstack/react-router"
import { useId, useState } from "react"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<"form">) {
	const emailId = useId()
	const [email, setEmail] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [sent, setSent] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setIsLoading(true)
		await authClient.forgetPassword(
			{
				email,
				redirectTo: "/reset-password",
			},
			{
				onSuccess: () => {
					setSent(true)
					toast.success("Reset link sent — check your inbox")
				},
				onError: (err) => {
					toast.error(err.error.message || "Could not send reset email")
					setIsLoading(false)
				},
			},
		)
		setIsLoading(false)
	}

	if (sent) {
		return (
			<div className={cn("flex flex-col gap-6 text-center", className)}>
				<div className="flex flex-col items-center gap-2">
					<h1 className="text-2xl font-bold">Check your email</h1>
					<p className="text-balance text-sm text-muted-foreground">
						We sent a password reset link to <strong>{email}</strong>. It may
						take a minute to arrive.
					</p>
				</div>
				<FieldDescription className="text-center">
					<Link to="/login" className="underline underline-offset-4">
						Back to sign in
					</Link>
				</FieldDescription>
			</div>
		)
	}

	return (
		<form
			className={cn("flex flex-col gap-6", className)}
			onSubmit={handleSubmit}
			{...props}
		>
			<FieldGroup>
				<div className="flex flex-col items-center gap-1 text-center">
					<h1 className="text-2xl font-bold">Forgot your password?</h1>
					<p className="text-balance text-sm text-muted-foreground">
						Enter your email and we'll send you a reset link
					</p>
				</div>

				<Field>
					<FieldLabel htmlFor={emailId}>Email</FieldLabel>
					<Input
						id={emailId}
						type="email"
						placeholder="you@example.com"
						autoComplete="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
				</Field>

				<Field>
					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? "Sending…" : "Send reset link"}
					</Button>
				</Field>

				<FieldDescription className="text-center">
					Remembered it?{" "}
					<Link to="/login" className="underline underline-offset-4">
						Back to sign in
					</Link>
				</FieldDescription>
			</FieldGroup>
		</form>
	)
}

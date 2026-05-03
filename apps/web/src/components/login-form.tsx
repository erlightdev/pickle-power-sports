import { Button } from "@Pickle-Power-Sports/ui/components/button"
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@Pickle-Power-Sports/ui/components/field"
import { Input } from "@Pickle-Power-Sports/ui/components/input"
import { cn } from "@Pickle-Power-Sports/ui/lib/utils"
import { Link, useNavigate } from "@tanstack/react-router"
import { useId, useState } from "react"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"

export function LoginForm({ className, ...props }: React.ComponentProps<"form">) {
	const navigate = useNavigate()
	const emailId = useId()
	const passwordId = useId()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [isLoading, setIsLoading] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setIsLoading(true)
		await authClient.signIn.email(
			{ email, password },
			{
				onSuccess: () => {
					toast.success("Signed in successfully")
					navigate({ to: "/dashboard" })
				},
				onError: (err) => {
					toast.error(err.error.message || "Sign in failed")
					setIsLoading(false)
				},
			},
		)
		setIsLoading(false)
	}

	return (
		<form
			className={cn("flex flex-col gap-6", className)}
			onSubmit={handleSubmit}
			{...props}
		>
			<FieldGroup>
				<div className="flex flex-col items-center gap-1 text-center">
					<h1 className="text-2xl font-bold">Welcome back</h1>
					<p className="text-balance text-sm text-muted-foreground">
						Sign in to your Pickle Power Sports account
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
					<div className="flex items-center">
						<FieldLabel htmlFor={passwordId}>Password</FieldLabel>
						<Link
							to="/forgot-password"
							className="ml-auto text-sm underline-offset-4 hover:underline"
						>
							Forgot password?
						</Link>
					</div>
					<Input
						id={passwordId}
						type="password"
						autoComplete="current-password"
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</Field>

				<Field>
					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? "Signing in…" : "Sign in"}
					</Button>
				</Field>

				<FieldDescription className="text-center">
					Don't have an account?{" "}
					<Link to="/register" className="underline underline-offset-4">
						Sign up
					</Link>
				</FieldDescription>
			</FieldGroup>
		</form>
	)
}

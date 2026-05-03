import { env } from "@Pickle-Power-Sports/env/web"
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

function detectIdentifierType(value: string): "email" | "phone" | "username" {
	if (value.includes("@")) return "email"
	if (/^\+?[\d\s\-()+]{7,15}$/.test(value.trim())) return "phone"
	return "username"
}

export function LoginForm({ className, ...props }: React.ComponentProps<"form">) {
	const navigate = useNavigate()
	const identifierId = useId()
	const passwordId = useId()
	const [identifier, setIdentifier] = useState("")
	const [password, setPassword] = useState("")
	const [isLoading, setIsLoading] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setIsLoading(true)

		const type = detectIdentifierType(identifier)

		if (type === "email") {
			await authClient.signIn.email(
				{ email: identifier, password },
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
		} else if (type === "phone") {
			let emailForSignIn: string | null = null
			try {
				const res = await fetch(
					`${env.VITE_SERVER_URL}/api/lookup-user?phone=${encodeURIComponent(identifier)}`,
					{ credentials: "include" },
				)
				if (!res.ok) {
					toast.error("No account found with that phone number")
					setIsLoading(false)
					return
				}
				const data = await res.json() as { email: string }
				emailForSignIn = data.email
			} catch {
				toast.error("Sign in failed. Please try again.")
				setIsLoading(false)
				return
			}
			await authClient.signIn.email(
				{ email: emailForSignIn, password },
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
		} else {
			await authClient.signIn.username(
				{ username: identifier, password },
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
		}

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
					<h1 className="font-bold text-2xl">Welcome back</h1>
					<p className="text-balance text-muted-foreground text-sm">
						Sign in to your Pickle Power Sports account
					</p>
				</div>

				<Field>
					<FieldLabel htmlFor={identifierId}>Username, email or phone</FieldLabel>
					<Input
						id={identifierId}
						type="text"
						placeholder="you@example.com / your_username / +61 400 000 000"
						autoComplete="username"
						required
						value={identifier}
						onChange={(e) => setIdentifier(e.target.value)}
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

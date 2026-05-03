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

export function RegisterForm({ className, ...props }: React.ComponentProps<"form">) {
	const navigate = useNavigate()
	const nameId = useId()
	const emailId = useId()
	const passwordId = useId()
	const confirmId = useId()

	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [confirm, setConfirm] = useState("")
	const [isLoading, setIsLoading] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (password !== confirm) {
			toast.error("Passwords do not match")
			return
		}
		setIsLoading(true)
		await authClient.signUp.email(
			{ name, email, password },
			{
				onSuccess: () => {
					toast.success("Account created — welcome!")
					navigate({ to: "/dashboard" })
				},
				onError: (err) => {
					toast.error(err.error.message || "Sign up failed")
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
					<h1 className="text-2xl font-bold">Create an account</h1>
					<p className="text-balance text-sm text-muted-foreground">
						Join Pickle Power Sports and start playing
					</p>
				</div>

				<Field>
					<FieldLabel htmlFor={nameId}>Name</FieldLabel>
					<Input
						id={nameId}
						type="text"
						placeholder="Your full name"
						autoComplete="name"
						required
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
				</Field>

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
					<FieldLabel htmlFor={passwordId}>Password</FieldLabel>
					<Input
						id={passwordId}
						type="password"
						autoComplete="new-password"
						required
						minLength={8}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</Field>

				<Field>
					<FieldLabel htmlFor={confirmId}>Confirm password</FieldLabel>
					<Input
						id={confirmId}
						type="password"
						autoComplete="new-password"
						required
						minLength={8}
						value={confirm}
						onChange={(e) => setConfirm(e.target.value)}
					/>
				</Field>

				<Field>
					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? "Creating account…" : "Create account"}
					</Button>
				</Field>

				<FieldDescription className="text-center">
					Already have an account?{" "}
					<Link to="/login" className="underline underline-offset-4">
						Sign in
					</Link>
				</FieldDescription>
			</FieldGroup>
		</form>
	)
}

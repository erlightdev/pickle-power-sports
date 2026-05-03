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

type Step = "register" | "verify"

export function RegisterForm({ className, ...props }: React.ComponentProps<"form">) {
	const navigate = useNavigate()
	const nameId = useId()
	const emailId = useId()
	const passwordId = useId()
	const confirmId = useId()
	const otpId = useId()

	const [step, setStep] = useState<Step>("register")
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [confirm, setConfirm] = useState("")
	const [otp, setOtp] = useState("")
	const [isLoading, setIsLoading] = useState(false)

	async function handleRegister(e: React.FormEvent) {
		e.preventDefault()
		if (password !== confirm) {
			toast.error("Passwords do not match")
			return
		}
		setIsLoading(true)
		await authClient.signUp.email(
			{ name, email, password },
			{
				onSuccess: async () => {
					const { error } = await authClient.emailOtp.sendVerificationOtp({
						email,
						type: "email-verification",
					})
					if (error) {
						toast.error(error.message || "Failed to send verification code")
					} else {
						toast.success("Check your email for a verification code")
						setStep("verify")
					}
					setIsLoading(false)
				},
				onError: (err) => {
					toast.error(err.error.message || "Sign up failed")
					setIsLoading(false)
				},
			},
		)
	}

	async function handleVerify(e: React.FormEvent) {
		e.preventDefault()
		setIsLoading(true)
		const { error } = await authClient.emailOtp.verifyEmail({ email, otp })
		if (error) {
			toast.error(error.message || "Invalid or expired code")
			setIsLoading(false)
		} else {
			toast.success("Email verified — welcome!")
			navigate({ to: "/dashboard" })
		}
	}

	if (step === "verify") {
		return (
			<form
				className={cn("flex flex-col gap-6", className)}
				onSubmit={handleVerify}
				{...props}
			>
				<FieldGroup>
					<div className="flex flex-col items-center gap-1 text-center">
						<h1 className="font-bold text-2xl">Check your email</h1>
						<p className="text-balance text-muted-foreground text-sm">
							We sent a 6-digit code to <span className="font-medium">{email}</span>
						</p>
					</div>

					<Field>
						<FieldLabel htmlFor={otpId}>Verification code</FieldLabel>
						<Input
							id={otpId}
							type="text"
							inputMode="numeric"
							pattern="[0-9]{6}"
							maxLength={6}
							placeholder="000000"
							autoComplete="one-time-code"
							required
							value={otp}
							onChange={(e) => setOtp(e.target.value)}
						/>
					</Field>

					<Field>
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? "Verifying…" : "Verify email"}
						</Button>
					</Field>

					<FieldDescription className="text-center">
						Didn't receive a code?{" "}
						<button
							type="button"
							className="underline underline-offset-4"
							onClick={async () => {
								const { error } = await authClient.emailOtp.sendVerificationOtp({
									email,
									type: "email-verification",
								})
								if (error) {
									toast.error("Failed to resend code")
								} else {
									toast.success("New code sent")
								}
							}}
						>
							Resend
						</button>
					</FieldDescription>
				</FieldGroup>
			</form>
		)
	}

	return (
		<form
			className={cn("flex flex-col gap-6", className)}
			onSubmit={handleRegister}
			{...props}
		>
			<FieldGroup>
				<div className="flex flex-col items-center gap-1 text-center">
					<h1 className="font-bold text-2xl">Create an account</h1>
					<p className="text-balance text-muted-foreground text-sm">
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

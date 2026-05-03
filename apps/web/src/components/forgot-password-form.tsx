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

type Step = "email" | "otp" | "done"

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
	const emailId = useId()
	const otpId = useId()
	const passwordId = useId()
	const confirmId = useId()

	const [step, setStep] = useState<Step>("email")
	const [email, setEmail] = useState("")
	const [otp, setOtp] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [isLoading, setIsLoading] = useState(false)

	async function handleSendOtp(e: React.FormEvent) {
		e.preventDefault()
		setIsLoading(true)
		const { error } = await authClient.emailOtp.sendVerificationOtp({
			email,
			type: "forget-password",
		})
		if (error) {
			toast.error(error.message ?? "Could not send code")
		} else {
			toast.success(`Code sent to ${email}`)
			setStep("otp")
		}
		setIsLoading(false)
	}

	async function handleResetPassword(e: React.FormEvent) {
		e.preventDefault()
		if (newPassword !== confirmPassword) {
			toast.error("Passwords do not match")
			return
		}
		setIsLoading(true)
		const { error } = await (authClient.emailOtp as unknown as {
			resetPassword: (data: { email: string; otp: string; password: string }) => Promise<{ error: { message?: string } | null }>
		}).resetPassword({ email, otp, password: newPassword })
		if (error) {
			toast.error(error.message ?? "Failed to reset password")
		} else {
			setStep("done")
		}
		setIsLoading(false)
	}

	if (step === "done") {
		return (
			<div className={cn("flex flex-col gap-6 text-center", className)}>
				<div className="flex flex-col items-center gap-2">
					<h1 className="font-bold text-2xl">Password reset</h1>
					<p className="text-balance text-muted-foreground text-sm">
						Your password has been updated. You can now sign in with your new password.
					</p>
				</div>
				<FieldDescription className="text-center">
					<Link className="underline underline-offset-4" to="/login">
						Back to sign in
					</Link>
				</FieldDescription>
			</div>
		)
	}

	if (step === "otp") {
		return (
			<form
				className={cn("flex flex-col gap-6", className)}
				onSubmit={handleResetPassword}
				{...props}
			>
				<FieldGroup>
					<div className="flex flex-col items-center gap-1 text-center">
						<h1 className="font-bold text-2xl">Check your email</h1>
						<p className="text-balance text-muted-foreground text-sm">
							Enter the 6-digit code sent to{" "}
							<span className="font-medium text-foreground">{email}</span> and choose a new password.
						</p>
					</div>

					<Field>
						<FieldLabel htmlFor={otpId}>Verification code</FieldLabel>
						<Input
							id={otpId}
							autoComplete="one-time-code"
							inputMode="numeric"
							maxLength={6}
							pattern="[0-9]{6}"
							placeholder="000000"
							required
							type="text"
							value={otp}
							onChange={(e) => setOtp(e.target.value)}
						/>
					</Field>

					<Field>
						<FieldLabel htmlFor={passwordId}>New password</FieldLabel>
						<Input
							id={passwordId}
							autoComplete="new-password"
							minLength={8}
							required
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
						/>
					</Field>

					<Field>
						<FieldLabel htmlFor={confirmId}>Confirm new password</FieldLabel>
						<Input
							id={confirmId}
							autoComplete="new-password"
							minLength={8}
							required
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
						/>
					</Field>

					<Field>
						<Button className="w-full" disabled={isLoading} type="submit">
							{isLoading ? "Resetting…" : "Reset password"}
						</Button>
					</Field>

					<FieldDescription className="text-center">
						Didn't receive a code?{" "}
						<button
							className="underline underline-offset-4"
							type="button"
							onClick={async () => {
								setIsLoading(true)
								const { error } = await authClient.emailOtp.sendVerificationOtp({
									email,
									type: "forget-password",
								})
								if (error) toast.error("Failed to resend code")
								else toast.success("New code sent")
								setIsLoading(false)
							}}
						>
							Resend
						</button>
						{" · "}
						<button
							className="underline underline-offset-4"
							type="button"
							onClick={() => { setStep("email"); setOtp("") }}
						>
							Change email
						</button>
					</FieldDescription>
				</FieldGroup>
			</form>
		)
	}

	return (
		<form
			className={cn("flex flex-col gap-6", className)}
			onSubmit={handleSendOtp}
			{...props}
		>
			<FieldGroup>
				<div className="flex flex-col items-center gap-1 text-center">
					<h1 className="font-bold text-2xl">Forgot your password?</h1>
					<p className="text-balance text-muted-foreground text-sm">
						Enter your email and we'll send you a 6-digit code
					</p>
				</div>

				<Field>
					<FieldLabel htmlFor={emailId}>Email</FieldLabel>
					<Input
						id={emailId}
						autoComplete="email"
						placeholder="you@example.com"
						required
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
				</Field>

				<Field>
					<Button className="w-full" disabled={isLoading} type="submit">
						{isLoading ? "Sending…" : "Send code"}
					</Button>
				</Field>

				<FieldDescription className="text-center">
					Remembered it?{" "}
					<Link className="underline underline-offset-4" to="/login">
						Back to sign in
					</Link>
				</FieldDescription>
			</FieldGroup>
		</form>
	)
}

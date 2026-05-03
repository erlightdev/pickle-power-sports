import { env } from "@Pickle-Power-Sports/env/web"
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
} from "@Pickle-Power-Sports/ui/components/breadcrumb"
import { Button } from "@Pickle-Power-Sports/ui/components/button"
import { Input } from "@Pickle-Power-Sports/ui/components/input"
import { Separator } from "@Pickle-Power-Sports/ui/components/separator"
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@Pickle-Power-Sports/ui/components/sidebar"
import { cn } from "@Pickle-Power-Sports/ui/lib/utils"
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import { ShieldCheckIcon, UserIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/profile")({
	component: ProfilePage,
	beforeLoad: async () => {
		const session = await authClient.getSession()
		if (!session.data) {
			redirect({ to: "/login", throw: true })
		}
		return { session }
	},
})

type NavTab = "account" | "security"
type EditingField = "name" | "username" | "email" | "phone" | "password" | null

const navItems: { id: NavTab; label: string; icon: React.ElementType }[] = [
	{ id: "account", label: "Account", icon: UserIcon },
	{ id: "security", label: "Security", icon: ShieldCheckIcon },
]

// ── Inline edit row ──────────────────────────────────────────────────────────
function SettingRow({
	label,
	value,
	placeholder,
	editing,
	onEdit,
	onCancel,
	children,
}: {
	label: string
	value: string
	placeholder?: string
	editing: boolean
	onEdit: () => void
	onCancel: () => void
	children: React.ReactNode
}) {
	return (
		<div className="px-6 py-4">
			{editing ? (
				<div className="flex flex-col gap-3">
					<p className="font-medium text-sm">{label}</p>
					{children}
					<div className="flex justify-end gap-2">
						<Button size="sm" type="button" variant="ghost" onClick={onCancel}>
							Cancel
						</Button>
					</div>
				</div>
			) : (
				<div className="flex items-center justify-between gap-4">
					<div className="min-w-0">
						<p className="text-muted-foreground text-xs">{label}</p>
						<p className={cn("truncate text-sm", !value && "text-muted-foreground/60")}>
							{value || placeholder || "—"}
						</p>
					</div>
					<Button
						className="shrink-0"
						size="sm"
						type="button"
						variant="ghost"
						onClick={onEdit}
					>
						Update
					</Button>
				</div>
			)}
		</div>
	)
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, description }: { title: string; description?: string }) {
	return (
		<div className="px-6 py-4">
			<p className="font-semibold text-sm">{title}</p>
			{description && <p className="mt-0.5 text-muted-foreground text-xs">{description}</p>}
		</div>
	)
}

function ProfilePage() {
	const { session } = Route.useRouteContext()
	const router = useRouter()
	const user = session.data?.user as
		| (typeof session.data.user & { username?: string; phone?: string })
		| undefined

	const [activeTab, setActiveTab] = useState<NavTab>("account")
	const [editing, setEditing] = useState<EditingField>(null)

	const initials = (user?.name ?? "?")
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((p) => p[0]?.toUpperCase())
		.join("")

	// ── Name ──────────────────────────────────────────────────────────────────
	const [name, setName] = useState(user?.name ?? "")
	const [savingName, setSavingName] = useState(false)

	async function handleSaveName(e: React.FormEvent) {
		e.preventDefault()
		setSavingName(true)
		const { error } = await (authClient.updateUser as (data: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>)({ name })
		if (error) toast.error(error.message ?? "Failed to update name")
		else { toast.success("Name updated"); setEditing(null); await router.invalidate() }
		setSavingName(false)
	}

	// ── Username ──────────────────────────────────────────────────────────────
	const [username, setUsername] = useState(user?.username ?? "")
	const [savingUsername, setSavingUsername] = useState(false)

	async function handleSaveUsername(e: React.FormEvent) {
		e.preventDefault()
		setSavingUsername(true)
		const { error } = await (authClient.updateUser as (data: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>)({ username })
		if (error) toast.error(error.message ?? "Failed to update username")
		else { toast.success("Username updated"); setEditing(null); await router.invalidate() }
		setSavingUsername(false)
	}

	// ── Email change ──────────────────────────────────────────────────────────
	const [emailStep, setEmailStep] = useState<"idle" | "otp">("idle")
	const [newEmail, setNewEmail] = useState("")
	const [emailOtp, setEmailOtp] = useState("")
	const [sendingCode, setSendingCode] = useState(false)
	const [savingEmail, setSavingEmail] = useState(false)

	async function handleSendEmailCode(e: React.FormEvent) {
		e.preventDefault()
		setSendingCode(true)
		const { error } = await authClient.emailOtp.sendVerificationOtp({ email: newEmail, type: "email-verification" })
		if (error) toast.error(error.message ?? "Failed to send code")
		else { toast.success(`Code sent to ${newEmail}`); setEmailStep("otp") }
		setSendingCode(false)
	}

	async function handleChangeEmail(e: React.FormEvent) {
		e.preventDefault()
		setSavingEmail(true)
		const res = await fetch(`${env.VITE_SERVER_URL}/api/change-email`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ newEmail, otp: emailOtp }),
		})
		const data = (await res.json()) as { error?: string }
		if (!res.ok) toast.error(data.error ?? "Failed to update email")
		else {
			toast.success("Email updated — please sign in again")
			setNewEmail(""); setEmailOtp(""); setEmailStep("idle"); setEditing(null)
			await authClient.signOut()
			router.navigate({ to: "/login" })
		}
		setSavingEmail(false)
	}

	// ── Phone ─────────────────────────────────────────────────────────────────
	const [phone, setPhone] = useState(user?.phone ?? "")
	const [savingPhone, setSavingPhone] = useState(false)

	async function handleSavePhone(e: React.FormEvent) {
		e.preventDefault()
		setSavingPhone(true)
		const { error } = await (authClient.updateUser as (data: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>)({ phone: phone || undefined })
		if (error) toast.error(error.message ?? "Failed to update phone")
		else { toast.success("Phone updated"); setEditing(null); await router.invalidate() }
		setSavingPhone(false)
	}

	// ── Password ──────────────────────────────────────────────────────────────
	const [currentPassword, setCurrentPassword] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [savingPassword, setSavingPassword] = useState(false)

	async function handleChangePassword(e: React.FormEvent) {
		e.preventDefault()
		if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return }
		setSavingPassword(true)
		const { error } = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: false })
		if (error) toast.error(error.message ?? "Failed to change password")
		else {
			toast.success("Password changed")
			setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setEditing(null)
		}
		setSavingPassword(false)
	}

	function cancelEdit() {
		setEditing(null)
		setEmailStep("idle")
		setNewEmail("")
		setEmailOtp("")
	}

	return (
		<SidebarProvider className="h-full min-h-0">
			<AppSidebar user={user} />
			<SidebarInset className="min-h-0 overflow-auto">
				<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator className="mr-2 h-4" orientation="vertical" />
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbPage>Profile</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<div className="ml-auto">
						<ModeToggle />
					</div>
				</header>

				<main className="mx-auto w-full max-w-4xl px-4 py-6 lg:px-6">
					<div className="overflow-hidden rounded-xl border">
						<div className="flex">

							{/* ── Left nav ──────────────────────────────────── */}
							<nav className="flex w-48 shrink-0 flex-col border-r">
								{/* User summary */}
								<div className="flex items-center gap-3 border-b px-4 py-4">
									<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-foreground text-sm">
										{initials}
									</div>
									<div className="min-w-0">
										<p className="truncate font-medium text-sm">{user?.name}</p>
										<p className="truncate text-muted-foreground text-xs">{user?.email}</p>
									</div>
								</div>

								{/* Tabs */}
								<div className="flex flex-col gap-0.5 p-2">
									{navItems.map(({ id, label, icon: Icon }) => (
										<button
											key={id}
											type="button"
											onClick={() => { setActiveTab(id); setEditing(null) }}
											className={cn(
												"flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
												activeTab === id
													? "bg-muted font-medium text-foreground"
													: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
											)}
										>
											<Icon className="size-4 shrink-0" />
											{label}
										</button>
									))}
								</div>
							</nav>

							{/* ── Content ───────────────────────────────────── */}
							<div className="min-w-0 flex-1">

								{activeTab === "account" && (
									<>
										{/* Profile section */}
										<SectionHeader
											description="Your public-facing name and handle."
											title="Profile"
										/>
										<Separator />

										<SettingRow
											editing={editing === "name"}
											label="Full name"
											value={user?.name ?? ""}
											onCancel={cancelEdit}
											onEdit={() => setEditing("name")}
										>
											<form className="flex flex-col gap-3" onSubmit={handleSaveName}>
												<Input
													autoComplete="name"
													autoFocus
													placeholder="Your full name"
													required
													type="text"
													value={name}
													onChange={(e) => setName(e.target.value)}
												/>
												<div className="flex justify-end gap-2">
													<Button size="sm" type="button" variant="ghost" onClick={cancelEdit}>
														Cancel
													</Button>
													<Button disabled={savingName} size="sm" type="submit">
														{savingName ? "Saving…" : "Save"}
													</Button>
												</div>
											</form>
										</SettingRow>
										<Separator />

										<SettingRow
											editing={editing === "username"}
											label="Username"
											placeholder="Not set"
											value={user?.username ? `@${user.username}` : ""}
											onCancel={cancelEdit}
											onEdit={() => setEditing("username")}
										>
											<form className="flex flex-col gap-3" onSubmit={handleSaveUsername}>
												<Input
													autoComplete="username"
													autoFocus
													placeholder="your_username"
													type="text"
													value={username}
													onChange={(e) => setUsername(e.target.value)}
												/>
												<div className="flex justify-end gap-2">
													<Button size="sm" type="button" variant="ghost" onClick={cancelEdit}>
														Cancel
													</Button>
													<Button disabled={savingUsername} size="sm" type="submit">
														{savingUsername ? "Saving…" : "Save"}
													</Button>
												</div>
											</form>
										</SettingRow>
										<Separator />

										{/* Email section */}
										<SectionHeader
											description="Manage the email address on your account."
											title="Email address"
										/>
										<Separator />

										<SettingRow
											editing={editing === "email"}
											label="Email"
											value={user?.email ?? ""}
											onCancel={cancelEdit}
											onEdit={() => setEditing("email")}
										>
											{emailStep === "idle" ? (
												<form className="flex flex-col gap-3" onSubmit={handleSendEmailCode}>
													<Input
														autoComplete="email"
														autoFocus
														placeholder="new@example.com"
														required
														type="email"
														value={newEmail}
														onChange={(e) => setNewEmail(e.target.value)}
													/>
													<div className="flex justify-end gap-2">
														<Button size="sm" type="button" variant="ghost" onClick={cancelEdit}>
															Cancel
														</Button>
														<Button disabled={sendingCode} size="sm" type="submit">
															{sendingCode ? "Sending…" : "Send code"}
														</Button>
													</div>
												</form>
											) : (
												<form className="flex flex-col gap-3" onSubmit={handleChangeEmail}>
													<p className="text-muted-foreground text-xs">
														Code sent to <span className="font-medium text-foreground">{newEmail}</span>
													</p>
													<Input
														autoComplete="one-time-code"
														autoFocus
														inputMode="numeric"
														maxLength={6}
														pattern="[0-9]{6}"
														placeholder="000000"
														required
														type="text"
														value={emailOtp}
														onChange={(e) => setEmailOtp(e.target.value)}
													/>
													<div className="flex items-center justify-between gap-2">
														<Button
															size="sm"
															type="button"
															variant="ghost"
															onClick={() => { setEmailStep("idle"); setEmailOtp("") }}
														>
															← Back
														</Button>
														<div className="flex gap-2">
															<Button
																disabled={sendingCode}
																size="sm"
																type="button"
																variant="outline"
																onClick={async () => {
																	setSendingCode(true)
																	const { error } = await authClient.emailOtp.sendVerificationOtp({ email: newEmail, type: "email-verification" })
																	if (error) toast.error("Failed to resend")
																	else toast.success("New code sent")
																	setSendingCode(false)
																}}
															>
																{sendingCode ? "Sending…" : "Resend"}
															</Button>
															<Button disabled={savingEmail} size="sm" type="submit">
																{savingEmail ? "Saving…" : "Verify & save"}
															</Button>
														</div>
													</div>
												</form>
											)}
										</SettingRow>
									</>
								)}

								{activeTab === "security" && (
									<>
										{/* Password section */}
										<SectionHeader
											description="Change the password used to sign in."
											title="Password"
										/>
										<Separator />

										<SettingRow
											editing={editing === "password"}
											label="Password"
											value="••••••••"
											onCancel={cancelEdit}
											onEdit={() => setEditing("password")}
										>
											<form className="flex flex-col gap-3" onSubmit={handleChangePassword}>
												<Input
													autoComplete="current-password"
													autoFocus
													placeholder="Current password"
													required
													type="password"
													value={currentPassword}
													onChange={(e) => setCurrentPassword(e.target.value)}
												/>
												<Input
													autoComplete="new-password"
													minLength={8}
													placeholder="New password"
													required
													type="password"
													value={newPassword}
													onChange={(e) => setNewPassword(e.target.value)}
												/>
												<Input
													autoComplete="new-password"
													minLength={8}
													placeholder="Confirm new password"
													required
													type="password"
													value={confirmPassword}
													onChange={(e) => setConfirmPassword(e.target.value)}
												/>
												<div className="flex justify-end gap-2">
													<Button size="sm" type="button" variant="ghost" onClick={cancelEdit}>
														Cancel
													</Button>
													<Button disabled={savingPassword} size="sm" type="submit">
														{savingPassword ? "Saving…" : "Update password"}
													</Button>
												</div>
											</form>
										</SettingRow>
										<Separator />

										{/* Phone section */}
										<SectionHeader
											description="Used for account recovery and login."
											title="Phone number"
										/>
										<Separator />

										<SettingRow
											editing={editing === "phone"}
											label="Phone"
											placeholder="Not set"
											value={user?.phone ?? ""}
											onCancel={cancelEdit}
											onEdit={() => setEditing("phone")}
										>
											<form className="flex flex-col gap-3" onSubmit={handleSavePhone}>
												<Input
													autoComplete="tel"
													autoFocus
													placeholder="+61 400 000 000"
													type="tel"
													value={phone}
													onChange={(e) => setPhone(e.target.value)}
												/>
												<div className="flex justify-end gap-2">
													<Button size="sm" type="button" variant="ghost" onClick={cancelEdit}>
														Cancel
													</Button>
													<Button disabled={savingPhone} size="sm" type="submit">
														{savingPhone ? "Saving…" : "Save"}
													</Button>
												</div>
											</form>
										</SettingRow>
									</>
								)}

							</div>
						</div>
					</div>
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}

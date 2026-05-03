import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
} from "@Pickle-Power-Sports/ui/components/breadcrumb";
import { Button } from "@Pickle-Power-Sports/ui/components/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@Pickle-Power-Sports/ui/components/card";
import { Input } from "@Pickle-Power-Sports/ui/components/input";
import { Separator } from "@Pickle-Power-Sports/ui/components/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@Pickle-Power-Sports/ui/components/sidebar";
import { cn } from "@Pickle-Power-Sports/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	ShieldCheckIcon,
	Trash2Icon,
	UserPlusIcon,
	UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/team")({
	component: TeamPage,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				throw: true,
			});
		}
		return { session };
	},
});

const tenantRoles = ["OWNER", "ADMIN", "STAFF", "COACH", "MEMBER"] as const;
type TenantRole = (typeof tenantRoles)[number];

function roleLabel(role: TenantRole) {
	return role
		.toLowerCase()
		.split("_")
		.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
		.join(" ");
}

function TeamPage() {
	const { session } = Route.useRouteContext();
	const user = session.data?.user;
	const access = useQuery(trpc.tenant.myAccess.queryOptions());
	const membership = access.data?.membership;
	const canManage =
		Boolean(membership?.isPlatformAdmin) ||
		membership?.role === "OWNER" ||
		membership?.role === "ADMIN";

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
								<BreadcrumbPage>Role Management</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<div className="ml-auto">
						<ModeToggle />
					</div>
				</header>

				<main className="flex flex-1 flex-col gap-5 p-4 lg:p-6">
					<section className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
						<div>
							<h1 className="font-semibold text-2xl tracking-normal">
								Role Management
							</h1>
							<p className="text-muted-foreground text-sm">
								Manage tenant access and staff permissions.
							</p>
						</div>
						<div className="inline-flex items-center gap-2 text-muted-foreground text-xs">
							<ShieldCheckIcon className="size-4 text-foreground" />
							<span>
								{access.isLoading
									? "Checking access"
									: membership?.isPlatformAdmin
										? "Platform admin"
										: `${roleLabel((membership?.role ?? "MEMBER") as TenantRole)} access`}
							</span>
						</div>
					</section>

					{access.isLoading ? (
						<Card>
							<CardHeader>
								<CardTitle>Loading access</CardTitle>
								<CardDescription>Checking your tenant permissions.</CardDescription>
							</CardHeader>
						</Card>
					) : canManage ? (
						<MembersPanel
							canAssignOwner={
								Boolean(membership?.isPlatformAdmin) || membership?.role === "OWNER"
							}
							currentUserId={user?.id}
							isPlatformAdmin={Boolean(membership?.isPlatformAdmin)}
						/>
					) : (
						<Card>
							<CardHeader>
								<CardTitle>Access required</CardTitle>
								<CardDescription>
									Only tenant owners and admins can manage team roles.
								</CardDescription>
								<CardAction>
									<ShieldCheckIcon className="size-4 text-muted-foreground" />
								</CardAction>
							</CardHeader>
						</Card>
					)}
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

function MembersPanel({
	canAssignOwner,
	currentUserId,
	isPlatformAdmin,
}: {
	canAssignOwner: boolean;
	currentUserId?: string;
	isPlatformAdmin: boolean;
}) {
	const queryClient = useQueryClient();
	const registeredUsers = useQuery(trpc.tenant.listRegisteredUsers.queryOptions());
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<TenantRole>("MEMBER");
	const [pendingRoles, setPendingRoles] = useState<Record<string, TenantRole>>({});
	const assignableRoles = canAssignOwner
		? tenantRoles
		: tenantRoles.filter((item) => item !== "OWNER");

	async function refreshUsers() {
		await queryClient.invalidateQueries(
			trpc.tenant.listRegisteredUsers.queryFilter(),
		);
	}

	const addMember = useMutation(
		trpc.tenant.addMember.mutationOptions({
			onSuccess: async () => {
				toast.success("Member access updated");
				setEmail("");
				setRole("MEMBER");
				await refreshUsers();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	const updateRole = useMutation(
		trpc.tenant.updateMemberRole.mutationOptions({
			onSuccess: async () => {
				toast.success("Role updated");
				await refreshUsers();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	const removeMember = useMutation(
		trpc.tenant.removeMember.mutationOptions({
			onSuccess: async (result) => {
				toast.success(result.removed ? "Member removed" : "Member was already removed");
				await refreshUsers();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	function handleAddMember(event: React.FormEvent) {
		event.preventDefault();
		addMember.mutate({ email, role });
	}

	return (
		<div className="grid gap-4 xl:grid-cols-[22rem_1fr]">
			<Card>
				<CardHeader>
					<CardTitle>Add Member</CardTitle>
					<CardDescription>
						Add an existing account to this tenant and choose their role.
					</CardDescription>
					<CardAction>
						<UserPlusIcon className="size-4 text-muted-foreground" />
					</CardAction>
				</CardHeader>
				<CardContent>
					<form className="grid gap-3" onSubmit={handleAddMember}>
						<label className="grid gap-1.5">
							<span className="font-medium text-xs">Email</span>
							<Input
								autoComplete="email"
								placeholder="member@example.com"
								required
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
							/>
						</label>
						<label className="grid gap-1.5">
							<span className="font-medium text-xs">Role</span>
							<RoleSelect
								roles={assignableRoles}
								value={role}
								onChange={setRole}
							/>
						</label>
						<Button disabled={addMember.isPending} type="submit">
							<UserPlusIcon className="size-4" />
							{addMember.isPending ? "Adding" : "Add member"}
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Registered Users</CardTitle>
					<CardDescription>
						All registered accounts are listed here. Assign a tenant role to
						give a user access to this admin area.
					</CardDescription>
					<CardAction>
						<UsersIcon className="size-4 text-muted-foreground" />
					</CardAction>
				</CardHeader>
				<CardContent className="px-0">
					<div className="grid border-y bg-muted/30 px-4 py-2 font-medium text-muted-foreground text-xs md:grid-cols-[1fr_10rem_8rem]">
						<span>Member</span>
						<span className="hidden md:block">Role</span>
						<span className="hidden text-right md:block">Actions</span>
					</div>
					{registeredUsers.isLoading ? (
						<div className="px-4 py-6 text-muted-foreground text-sm">
							Loading registered users
						</div>
					) : registeredUsers.data?.length ? (
						<div className="divide-y">
							{registeredUsers.data.map((registeredUser) => {
								const membership = registeredUser.tenantMemberships[0];
								const isCurrentUser = registeredUser.id === currentUserId;
								const currentRole = membership?.role as TenantRole | undefined;
								const selectedRole =
									currentRole ?? pendingRoles[registeredUser.id] ?? "MEMBER";
								const roleLocked =
									(!canAssignOwner && currentRole === "OWNER") || isCurrentUser;
								const removeLocked =
									!membership ||
									isCurrentUser ||
									(!canAssignOwner && currentRole === "OWNER");
								const rowRoles =
									canAssignOwner || currentRole !== "OWNER"
										? assignableRoles
										: tenantRoles;

								return (
									<div
										className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_10rem_8rem] md:items-center"
										key={registeredUser.id}
									>
										<div className="min-w-0">
											<div className="truncate font-medium text-sm">
												{registeredUser.name}
												{isCurrentUser ? (
													<span className="ml-2 text-muted-foreground text-xs">
														You
													</span>
												) : null}
												{registeredUser.role === "ADMIN" ? (
													<span className="ml-2 text-muted-foreground text-xs">
														Platform admin
													</span>
												) : null}
											</div>
											<div className="truncate text-muted-foreground text-xs">
												{registeredUser.email}
												{registeredUser.emailVerified ? "" : " · unverified"}
											</div>
										</div>
										<RoleSelect
											disabled={roleLocked || updateRole.isPending}
											roles={rowRoles}
											value={selectedRole}
											onChange={(nextRole) => {
												if (membership) {
													updateRole.mutate({
														memberId: membership.id,
														role: nextRole,
													});
													return;
												}

												setPendingRoles((current) => ({
													...current,
													[registeredUser.id]: nextRole,
												}));
											}}
										/>
										<div className="flex justify-end gap-2">
											{membership ? (
												<Button
													aria-label={`Remove ${registeredUser.name}`}
													disabled={removeLocked || removeMember.isPending}
													size="icon-sm"
													type="button"
													variant="destructive"
													onClick={() =>
														removeMember.mutate({ memberId: membership.id })
													}
												>
													<Trash2Icon className="size-4" />
												</Button>
											) : (
												<Button
													disabled={addMember.isPending}
													size="sm"
													type="button"
													variant="outline"
													onClick={() =>
														addMember.mutate({
															email: registeredUser.email,
															role: selectedRole,
														})
													}
												>
													<UserPlusIcon className="size-4" />
													Assign
												</Button>
											)}
										</div>
									</div>
								);
							})}
							{isPlatformAdmin ? (
								<div className="px-4 py-3 text-muted-foreground text-xs">
									Your platform admin access is applied globally and does not need
									a row in this tenant.
								</div>
							) : null}
						</div>
					) : (
						<div className="px-4 py-6 text-muted-foreground text-sm">
							No registered users found.
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function RoleSelect({
	disabled,
	roles,
	value,
	onChange,
}: {
	disabled?: boolean;
	roles: readonly TenantRole[];
	value: TenantRole;
	onChange: (role: TenantRole) => void;
}) {
	return (
		<select
			className={cn(
				"h-8 w-full min-w-0 rounded-none border border-input bg-background px-2.5 py-1 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30",
			)}
			disabled={disabled}
			value={value}
			onChange={(event) => onChange(event.target.value as TenantRole)}
		>
			{roles.map((item) => (
				<option key={item} value={item}>
					{roleLabel(item)}
				</option>
			))}
		</select>
	);
}

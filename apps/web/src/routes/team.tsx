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
import { Dialog } from "@base-ui/react/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	Building2Icon,
	Globe2Icon,
	ExternalLinkIcon,
	PaletteIcon,
	SaveIcon,
	ShieldCheckIcon,
	Trash2Icon,
	UserPlusIcon,
	UsersIcon,
} from "lucide-react";
import type { ElementType, FormEvent } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { authClient } from "@/lib/auth-client";
import { requireResolvedTenant } from "@/lib/tenant-guard";
import { trpc, trpcClient } from "@/utils/trpc";

export const Route = createFileRoute("/team")({
	component: TeamPage,
	beforeLoad: async () => {
		await requireResolvedTenant();
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
type SettingsSection = "tenant" | "members" | "domains";
type DomainType = "SUBDOMAIN" | "CUSTOM";

const settingsSections: {
	id: SettingsSection;
	label: string;
	icon: ElementType;
}[] = [
	{ id: "tenant", label: "Tenant", icon: Building2Icon },
	{ id: "members", label: "Members", icon: UsersIcon },
	{ id: "domains", label: "Domains", icon: Globe2Icon },
];

function getSectionFromHash(): SettingsSection {
	if (typeof window === "undefined") {
		return "members";
	}

	const section = window.location.hash.replace("#", "");
	if (section === "tenant" || section === "domains" || section === "members") {
		return section;
	}

	return "members";
}

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
	const [activeSection, setActiveSection] =
		useState<SettingsSection>(getSectionFromHash);

	useEffect(() => {
		function syncHash() {
			setActiveSection(getSectionFromHash());
		}

		syncHash();
		window.addEventListener("hashchange", syncHash);
		return () => window.removeEventListener("hashchange", syncHash);
	}, []);

	function navigateSection(section: SettingsSection) {
		window.history.pushState(null, "", `/team#${section}`);
		setActiveSection(section);
	}

	const sectionTitle =
		settingsSections.find((section) => section.id === activeSection)?.label ??
		"Settings";

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
								<BreadcrumbPage>{sectionTitle}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<div className="ml-auto">
						<ModeToggle />
					</div>
				</header>

				<main className="flex flex-1 flex-col gap-5 p-4 lg:p-6">
					<section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
						<div>
							<h1 className="font-semibold text-2xl tracking-normal">
								Settings
							</h1>
							<p className="text-muted-foreground text-sm">
								Manage tenant profile, access, and domain routing.
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

					<div className="flex flex-wrap gap-2">
						{settingsSections.map(({ id, label, icon: Icon }) => (
							<Button
								key={id}
								type="button"
								variant={activeSection === id ? "default" : "outline"}
								onClick={() => navigateSection(id)}
							>
								<Icon className="size-4" />
								{label}
							</Button>
						))}
					</div>

					{access.isLoading ? (
						<Card>
							<CardHeader>
								<CardTitle>Loading access</CardTitle>
								<CardDescription>Checking your tenant permissions.</CardDescription>
							</CardHeader>
						</Card>
					) : canManage ? (
						<>
							{activeSection === "tenant" ? (
								<TenantPanel canEditSlug={membership?.role === "OWNER"} />
							) : null}
							{activeSection === "members" ? (
								<MembersPanel
									canAssignOwner={
										Boolean(membership?.isPlatformAdmin) ||
										membership?.role === "OWNER"
									}
									currentUserId={user?.id}
									isPlatformAdmin={Boolean(membership?.isPlatformAdmin)}
								/>
							) : null}
							{activeSection === "domains" ? <DomainsPanel /> : null}
						</>
					) : (
						<Card>
							<CardHeader>
								<CardTitle>Access required</CardTitle>
								<CardDescription>
									Only tenant owners and admins can manage tenant settings.
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

function TenantPanel({ canEditSlug }: { canEditSlug: boolean }) {
	const queryClient = useQueryClient();
	const settings = useQuery(trpc.tenant.settings.queryOptions());
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [logoUrl, setLogoUrl] = useState("");
	const [brandColor, setBrandColor] = useState("");

	useEffect(() => {
		if (!settings.data) {
			return;
		}

		setName(settings.data.name);
		setSlug(settings.data.slug);
		setLogoUrl(settings.data.logoUrl ?? "");
		setBrandColor(settings.data.brandColor ?? "");
	}, [settings.data]);

	const updateTenant = useMutation(
		{
			mutationFn: (input: {
				name?: string;
				slug?: string;
				logoUrl?: string | null;
				brandColor?: string | null;
			}) => trpcClient.tenant.updateCurrent.mutate(input),
			onSuccess: async () => {
				toast.success("Tenant updated");
				await queryClient.invalidateQueries(trpc.tenant.settings.queryFilter());
				await queryClient.invalidateQueries(trpc.tenant.myAccess.queryFilter());
			},
			onError: (error) => toast.error(error.message),
		},
	);

	function handleSubmit(event: FormEvent) {
		event.preventDefault();
		updateTenant.mutate({
			name,
			slug: canEditSlug ? slug : undefined,
			logoUrl: logoUrl || null,
			brandColor: brandColor || null,
		});
	}

	return (
		<div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
			<Card>
				<CardHeader>
					<CardTitle>Tenant Profile</CardTitle>
					<CardDescription>
						Update the name, routing slug, logo, and brand color for this
						tenant.
					</CardDescription>
					<CardAction>
						<Building2Icon className="size-4 text-muted-foreground" />
					</CardAction>
				</CardHeader>
				<CardContent>
					{settings.isLoading ? (
						<div className="py-6 text-muted-foreground text-sm">
							Loading tenant
						</div>
					) : (
						<form className="grid gap-4" onSubmit={handleSubmit}>
							<div className="grid gap-3 md:grid-cols-2">
								<label className="grid gap-1.5">
									<span className="font-medium text-xs">Name</span>
									<Input
										required
										type="text"
										value={name}
										onChange={(event) => setName(event.target.value)}
									/>
								</label>
								<label className="grid gap-1.5">
									<span className="font-medium text-xs">Slug</span>
									<Input
										disabled={!canEditSlug}
										required
										type="text"
										value={slug}
										onChange={(event) => setSlug(event.target.value)}
									/>
								</label>
							</div>
							<label className="grid gap-1.5">
								<span className="font-medium text-xs">Logo URL</span>
								<Input
									placeholder="https://example.com/logo.png"
									type="url"
									value={logoUrl}
									onChange={(event) => setLogoUrl(event.target.value)}
								/>
							</label>
							<label className="grid gap-1.5">
								<span className="font-medium text-xs">Brand color</span>
								<div className="grid grid-cols-[2.5rem_1fr] gap-2">
									<input
										aria-label="Brand color swatch"
										className="h-8 w-full rounded-none border border-input bg-transparent"
										type="color"
										value={brandColor || "#16a34a"}
										onChange={(event) => setBrandColor(event.target.value)}
									/>
									<Input
										placeholder="#16a34a"
										type="text"
										value={brandColor}
										onChange={(event) => setBrandColor(event.target.value)}
									/>
								</div>
							</label>
							<Button disabled={updateTenant.isPending} type="submit">
								<SaveIcon className="size-4" />
								{updateTenant.isPending ? "Saving" : "Save tenant"}
							</Button>
						</form>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Preview</CardTitle>
					<CardDescription>Current tenant identity.</CardDescription>
					<CardAction>
						<PaletteIcon className="size-4 text-muted-foreground" />
					</CardAction>
				</CardHeader>
				<CardContent className="grid gap-3">
					<div className="flex items-center gap-3">
						<div
							className="flex size-10 items-center justify-center border font-semibold text-sm"
							style={{ backgroundColor: brandColor || undefined }}
						>
							{name.charAt(0).toUpperCase() || "T"}
						</div>
						<div className="min-w-0">
							<div className="truncate font-medium text-sm">
								{name || settings.data?.name || "Tenant"}
							</div>
							<div className="truncate text-muted-foreground text-xs">
								/{slug || settings.data?.slug || "tenant"}
							</div>
						</div>
					</div>
					{!canEditSlug ? (
						<p className="text-muted-foreground text-xs">
							Only tenant owners can change the slug.
						</p>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}

function DomainsPanel() {
	const queryClient = useQueryClient();
	const navigate = Route.useNavigate();
	const settings = useQuery(trpc.tenant.settings.queryOptions());
	const [domain, setDomain] = useState("");
	const [type, setType] = useState<DomainType>("SUBDOMAIN");
	const [deleteTarget, setDeleteTarget] = useState<{
		id: string;
		domain: string;
	} | null>(null);
	const [deleteConfirmation, setDeleteConfirmation] = useState("");
	const rootDomain =
		settings.data?.rootDomain ?? (import.meta.env.DEV ? "localhost" : "");
	const canAddSubdomain = type !== "SUBDOMAIN" || Boolean(rootDomain);
	const normalizedSubdomain = domain
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	const domainPreview = type === "SUBDOMAIN"
		? rootDomain
			? `${normalizedSubdomain || "name"}.${rootDomain}`
			: "Configure ROOT_DOMAIN first"
		: domain.trim() || "custom-domain.com";

	async function refreshSettings() {
		await queryClient.invalidateQueries(trpc.tenant.settings.queryFilter());
	}

	const addDomain = useMutation(
		{
			mutationFn: (input: { domain: string; type: DomainType }) =>
				trpcClient.tenant.addDomain.mutate(input),
			onSuccess: async () => {
				toast.success("Domain added");
				setDomain("");
				setType("SUBDOMAIN");
				await refreshSettings();
			},
			onError: (error) => toast.error(error.message),
		},
	);

	const deleteTenantForDomain = useMutation(
		{
			mutationFn: (input: { domainId: string; confirmDomain: string }) =>
				trpcClient.tenant.deleteTenantForDomain.mutate(input),
			onSuccess: async (result) => {
				toast.success(`${result.domain} and tenant data deleted`);
				setDeleteTarget(null);
				setDeleteConfirmation("");
				await queryClient.invalidateQueries({ queryKey: trpc.pathKey() });
				navigate({ to: "/dashboard" });
			},
			onError: (error) => toast.error(error.message),
		},
	);

	function handleAddDomain(event: FormEvent) {
		event.preventDefault();
		addDomain.mutate({ domain, type });
	}

	function domainStatus(item: { domain: string; verified: boolean }) {
		if (item.domain === "localhost" || item.domain.endsWith(".localhost")) {
			return "Local";
		}

		return item.verified ? "Verified" : "Pending";
	}

	function domainHref(domain: string) {
		const protocol = window.location.protocol || "http:";
		const port = window.location.port;
		const portSuffix =
			(domain === "localhost" || domain.endsWith(".localhost")) && port
				? `:${port}`
				: "";

		return `${protocol}//${domain}${portSuffix}`;
	}

	function domainTenantName(item: object) {
		if (
			"tenant" in item &&
			typeof item.tenant === "object" &&
			item.tenant &&
			"name" in item.tenant &&
			typeof item.tenant.name === "string"
		) {
			return item.tenant.name;
		}

		return null;
	}

	function openDeleteTenantDialog(item: { id: string; domain: string }) {
		setDeleteTarget(item);
		setDeleteConfirmation("");
	}

	function handleDeleteTenantForDomain(event: FormEvent) {
		event.preventDefault();
		if (!deleteTarget) {
			return;
		}

		deleteTenantForDomain.mutate({
			domainId: deleteTarget.id,
			confirmDomain: deleteConfirmation,
		});
	}

	return (
		<>
			<div className="grid gap-4 xl:grid-cols-[22rem_1fr]">
			<Card>
				<CardHeader>
					<CardTitle>Add Domain</CardTitle>
					<CardDescription>
						System subdomains create a new tenant. Custom domains resolve to
						the current tenant.
					</CardDescription>
					<CardAction>
						<Globe2Icon className="size-4 text-muted-foreground" />
					</CardAction>
				</CardHeader>
				<CardContent>
					<form className="grid gap-3" onSubmit={handleAddDomain}>
						<label className="grid gap-1.5">
							<span className="font-medium text-xs">
								{type === "SUBDOMAIN" ? "Subdomain name" : "Domain"}
							</span>
							{type === "SUBDOMAIN" ? (
								<div className="grid grid-cols-[1fr_auto]">
									<Input
										className="border-r-0"
										placeholder="club"
										required
										type="text"
										value={domain}
										onChange={(event) => setDomain(event.target.value)}
									/>
									<div className="flex h-8 items-center border border-input bg-muted/30 px-2.5 text-muted-foreground text-xs">
										.{rootDomain || "ROOT_DOMAIN"}
									</div>
								</div>
							) : (
								<Input
									placeholder="club.example.com"
									required
									type="text"
									value={domain}
									onChange={(event) => setDomain(event.target.value)}
								/>
							)}
						</label>
						<label className="grid gap-1.5">
							<span className="font-medium text-xs">Type</span>
							<select
								className="h-8 w-full min-w-0 rounded-none border border-input bg-background px-2.5 py-1 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"
								value={type}
								onChange={(event) => setType(event.target.value as DomainType)}
							>
								<option value="SUBDOMAIN">Subdomain</option>
								<option value="CUSTOM">Custom domain</option>
							</select>
						</label>
						<div className="text-muted-foreground text-xs">
							Will save as{" "}
							<span className="font-medium text-foreground">{domainPreview}</span>
						</div>
						{type === "SUBDOMAIN" && !rootDomain ? (
							<div className="text-destructive text-xs">
								Configure ROOT_DOMAIN before adding production subdomains.
							</div>
						) : null}
						<Button disabled={addDomain.isPending || !canAddSubdomain} type="submit">
							<Globe2Icon className="size-4" />
							{addDomain.isPending
								? "Adding"
								: type === "SUBDOMAIN"
									? "Create tenant subdomain"
									: "Add custom domain"}
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Domains</CardTitle>
					<CardDescription>
						System admins see all tenant domains. Tenant owners see domains
						for their tenant.
					</CardDescription>
					<CardAction>
						<Globe2Icon className="size-4 text-muted-foreground" />
					</CardAction>
				</CardHeader>
				<CardContent className="px-0">
					<div className="grid border-y bg-muted/30 px-4 py-2 font-medium text-muted-foreground text-xs md:grid-cols-[1fr_8rem_8rem_7rem]">
						<span>Domain</span>
						<span className="hidden md:block">Type</span>
						<span className="hidden md:block">Status</span>
						<span className="hidden text-right md:block">Actions</span>
					</div>
					{settings.isLoading ? (
						<div className="px-4 py-6 text-muted-foreground text-sm">
							Loading domains
						</div>
					) : settings.data?.domains.length ? (
						<div className="divide-y">
							{settings.data.domains.map((item) => (
								<div
									className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_8rem_8rem_7rem] md:items-center"
									key={item.id}
								>
									<div className="min-w-0">
										<div className="truncate font-medium text-sm">
											{item.domain}
										</div>
										{domainTenantName(item) ? (
											<div className="truncate text-muted-foreground text-xs">
												{domainTenantName(item)}
											</div>
										) : null}
										<div className="text-muted-foreground text-xs md:hidden">
											{item.type === "SUBDOMAIN" ? "Subdomain" : "Custom"} ·{" "}
											{domainStatus(item)}
										</div>
										{domainStatus(item) === "Local" ? (
											<div className="truncate text-muted-foreground text-xs">
												{domainHref(item.domain)}
											</div>
										) : null}
									</div>
									<div className="hidden text-xs md:block">
										{item.type === "SUBDOMAIN" ? "Subdomain" : "Custom"}
									</div>
									<div className="hidden text-xs md:block">
										{domainStatus(item)}
									</div>
									<div className="flex justify-end gap-2">
										<a
											aria-label={`Open ${item.domain}`}
											className="inline-flex size-7 shrink-0 items-center justify-center border border-border text-xs transition-colors hover:bg-muted hover:text-foreground"
											href={domainHref(item.domain)}
											rel="noreferrer"
											target="_blank"
										>
											<ExternalLinkIcon className="size-4" />
										</a>
										<Button
											aria-label={`Delete ${item.domain} tenant data`}
											disabled={deleteTenantForDomain.isPending}
											size="icon-sm"
											type="button"
											variant="destructive"
											onClick={() => openDeleteTenantDialog(item)}
										>
											<Trash2Icon className="size-4" />
										</Button>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="px-4 py-6 text-muted-foreground text-sm">
							No domains added yet.
						</div>
					)}
				</CardContent>
			</Card>
			</div>
			<Dialog.Root
				open={Boolean(deleteTarget)}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteTarget(null);
						setDeleteConfirmation("");
					}
				}}
			>
				<Dialog.Portal>
					<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
					<Dialog.Popup className="-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 z-50 grid w-[calc(100vw-2rem)] max-w-md gap-4 border bg-background p-5 shadow-xl">
						<Dialog.Title className="font-semibold text-lg">
							Delete tenant data
						</Dialog.Title>
						<Dialog.Description className="text-muted-foreground text-sm">
							This will delete{" "}
							<span className="font-medium text-foreground">
								{deleteTarget?.domain}
							</span>{" "}
							and all tenant-scoped data for this tenant.
						</Dialog.Description>
						<form className="grid gap-4" onSubmit={handleDeleteTenantForDomain}>
							<label className="grid gap-1.5">
								<span className="font-medium text-xs">
									Type the domain to confirm
								</span>
								<Input
									autoComplete="off"
									autoFocus
									placeholder={deleteTarget?.domain}
									value={deleteConfirmation}
									onChange={(event) => setDeleteConfirmation(event.target.value)}
								/>
							</label>
							<div className="flex justify-end gap-2">
								<Button
									disabled={deleteTenantForDomain.isPending}
									type="button"
									variant="outline"
									onClick={() => {
										setDeleteTarget(null);
										setDeleteConfirmation("");
									}}
								>
									Cancel
								</Button>
								<Button
									disabled={
										deleteTenantForDomain.isPending ||
										deleteConfirmation.toLowerCase() !==
											deleteTarget?.domain.toLowerCase()
									}
									type="submit"
									variant="destructive"
								>
									<Trash2Icon className="size-4" />
									{deleteTenantForDomain.isPending ? "Deleting" : "Delete tenant"}
								</Button>
							</div>
						</form>
					</Dialog.Popup>
				</Dialog.Portal>
			</Dialog.Root>
		</>
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
		{
			mutationFn: (input: { email: string; role: TenantRole }) =>
				trpcClient.tenant.addMember.mutate(input),
			onSuccess: async () => {
				toast.success("Member access updated");
				setEmail("");
				setRole("MEMBER");
				await refreshUsers();
			},
			onError: (error) => toast.error(error.message),
		},
	);

	const updateRole = useMutation(
		{
			mutationFn: (input: { memberId: string; role: TenantRole }) =>
				trpcClient.tenant.updateMemberRole.mutate(input),
			onSuccess: async () => {
				toast.success("Role updated");
				await refreshUsers();
			},
			onError: (error) => toast.error(error.message),
		},
	);

	const removeMember = useMutation(
		{
			mutationFn: (input: { memberId: string }) =>
				trpcClient.tenant.removeMember.mutate(input),
			onSuccess: async (result) => {
				toast.success(result.removed ? "Member removed" : "Member was already removed");
				await refreshUsers();
			},
			onError: (error) => toast.error(error.message),
		},
	);

	function handleAddMember(event: FormEvent) {
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
					<CardTitle>{isPlatformAdmin ? "Registered Users" : "Tenant Members"}</CardTitle>
					<CardDescription>
						{isPlatformAdmin
							? "All registered accounts are listed here. Assign a tenant role to give a user access to this admin area."
							: "Only users attached to this tenant are listed here. Add a member by email to give another user tenant access."}
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

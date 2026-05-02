export const tenantRoles = [
	"OWNER",
	"ADMIN",
	"COACH",
	"STAFF",
	"MEMBER",
] as const;

export const userRoles = ["CUSTOMER", "COACH", "ADMIN"] as const;

export type TenantRole = (typeof tenantRoles)[number];
export type UserRole = (typeof userRoles)[number];

export const tenantAdminRoles = ["OWNER", "ADMIN"] as const;
export const tenantStaffRoles = ["OWNER", "ADMIN", "STAFF"] as const;
export const tenantCoachRoles = ["OWNER", "ADMIN", "STAFF", "COACH"] as const;
export const tenantMemberRoles = tenantRoles;

export type TenantRoleRequirement = readonly TenantRole[];

export function isPlatformAdmin(role: string | null | undefined) {
	return role === "ADMIN";
}

export function hasTenantRole(
	role: TenantRole,
	allowedRoles: TenantRoleRequirement,
) {
	return allowedRoles.includes(role);
}

export function roleLabel(role: TenantRole) {
	return role
		.toLowerCase()
		.split("_")
		.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
		.join(" ");
}

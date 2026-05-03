import { redirect } from "@tanstack/react-router";

import { trpcClient } from "@/utils/trpc";

export function isTenantHost() {
	if (typeof window === "undefined") {
		return false;
	}

	const hostname = window.location.hostname.toLowerCase();

	if (hostname === "localhost" || hostname === "127.0.0.1") {
		return false;
	}

	if (hostname.endsWith(".localhost")) {
		return true;
	}

	if (hostname.startsWith("www.")) {
		return false;
	}

	return hostname.split(".").length > 2;
}

function systemDomainUrl() {
	const url = new URL(window.location.href);
	const hostname = url.hostname.toLowerCase();

	if (hostname.endsWith(".localhost")) {
		url.hostname = "localhost";
	} else {
		const parts = hostname.split(".");
		if (parts.length > 2) {
			url.hostname = parts.slice(1).join(".");
		}
	}

	url.pathname = "/";
	url.search = "";
	url.hash = "";

	return url.toString();
}

function redirectToSystemDomain() {
	if (typeof window === "undefined") {
		redirect({ to: "/tenant-unavailable", throw: true });
	}

	window.location.replace(systemDomainUrl());
	redirect({ to: "/tenant-unavailable", throw: true });
}

export async function requireResolvedTenant() {
	try {
		await trpcClient.tenant.current.query();
	} catch {
		if (isTenantHost()) {
			redirectToSystemDomain();
		}

		redirect({
			to: "/tenant-unavailable",
			throw: true,
		});
	}
}

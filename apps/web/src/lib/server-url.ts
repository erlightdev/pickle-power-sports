import { env } from "@Pickle-Power-Sports/env/web";

function localSubdomainHost() {
	if (typeof window === "undefined") {
		return null;
	}

	const hostname = window.location.hostname;
	if (hostname === "localhost" || !hostname.endsWith(".localhost")) {
		return null;
	}

	return hostname;
}

export function getServerUrl() {
	const configuredUrl = new URL(env.VITE_SERVER_URL);
	const localHostname = localSubdomainHost();

	if (import.meta.env.DEV && localHostname) {
		configuredUrl.hostname = localHostname;
	}

	return configuredUrl.toString().replace(/\/$/, "");
}

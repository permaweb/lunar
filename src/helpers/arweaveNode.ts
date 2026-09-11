import { URLS } from './config';

/** A node is a public HTTP(S) origin. HTTP targets are read through the relay. */
export function normalizeArweaveNode(value: string): string | null {
	try {
		const input = value.trim();
		if (!input || input.length > 2048) return null;
		// Bare transaction IDs and block heights must stay in the transaction explorer.
		if (!input.includes('://') && !/[.:]/.test(input) && input !== 'localhost') return null;
		const url = new URL(input.includes('://') ? input : `http://${input}`);
		if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash)
			return null;
		if (url.pathname !== '/' || !url.hostname) return null;
		return url.origin;
	} catch {
		return null;
	}
}

export function getArweaveNodeRoute(node: string, tab = ''): string {
	return `${URLS.explorer}${encodeURIComponent(normalizeArweaveNode(node) ?? node)}${tab ? `/${tab}` : ''}`;
}

export function readArweaveNodeRoute(path: string): { node: string; subPath: string } | null {
	const prefix = URLS.explorer;
	if (!path.startsWith(prefix)) return null;
	// Accept previously shared links, but always generate the untyped canonical route.
	const remainder = path.slice(prefix.length).replace(/^arweave-node\//, '');
	const [encoded, ...rest] = remainder.split('/');
	try {
		const node = normalizeArweaveNode(decodeURIComponent(encoded));
		return node ? { node, subPath: rest.length ? `/${rest.join('/')}` : '' } : null;
	} catch {
		return null;
	}
}

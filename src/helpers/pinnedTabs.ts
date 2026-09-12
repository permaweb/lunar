import { getArweaveNodeRoute, normalizeArweaveNode, readArweaveNodeRoute } from './arweaveNode';
import type { TransactionTabType } from './types';

export type PinTarget = {
	id: string;
	label: string;
	labelEdited?: boolean;
	type: TransactionTabType['type'];
	route: string;
};
export type PinnedTab = PinTarget & { pinnedAt: number };

export const PINNED_TABS_KEY = 'lunar:pinned-tabs:arweave:v1';
export const PINNED_TABS_LIMIT = 200;
const TYPES = new Set(['transaction', 'process', 'message', 'wallet', 'block', 'bundle', 'arweave-node', null]);

export function normalizePin(value: unknown): PinTarget | null {
	if (!value || typeof value !== 'object') return null;
	const candidate = value as Record<string, unknown>;
	if (
		typeof candidate.id !== 'string' ||
		typeof candidate.route !== 'string' ||
		typeof candidate.label !== 'string' ||
		!TYPES.has(candidate.type as string)
	)
		return null;
	if (
		!candidate.route.startsWith('/explorer/') ||
		candidate.route.length > 4096 ||
		/[\u0000-\u001f#]/.test(candidate.route)
	)
		return null;
	const node = normalizeArweaveNode(candidate.id);
	let route = candidate.route;
	if (node) {
		const parsed = readArweaveNodeRoute(route.split('?')[0]);
		if (!parsed || parsed.node !== node) return null;
		route = `${getArweaveNodeRoute(node)}${parsed.subPath}${
			route.includes('?') ? route.slice(route.indexOf('?')) : ''
		}`;
	} else {
		if (!/^(?:[A-Za-z0-9_-]{43}|[A-Za-z0-9_-]{64}|\d+)$/.test(candidate.id)) return null;
		if (route.split('?')[0].split('/')[2] !== candidate.id) return null;
	}
	return {
		id: node ?? candidate.id,
		route,
		label: candidate.label.trim().slice(0, 150) || candidate.id,
		...(candidate.labelEdited === true ? { labelEdited: true } : {}),
		type: candidate.type as PinTarget['type'],
	};
}

export function parsePinnedTabs(stored: string | null): PinnedTab[] {
	try {
		const envelope: unknown = JSON.parse(stored ?? 'null');
		if (!envelope || typeof envelope !== 'object') return [];
		const { version, tabs } = envelope as Record<string, unknown>;
		if (version !== 1 || !Array.isArray(tabs)) return [];
		const seen = new Set<string>();
		return tabs
			.flatMap((tab) => {
				const pin = normalizePin(tab);
				if (!pin || seen.has(pin.id) || !Number.isFinite(tab.pinnedAt) || tab.pinnedAt < 0) return [];
				seen.add(pin.id);
				return [{ ...pin, pinnedAt: tab.pinnedAt }];
			})
			.slice(0, PINNED_TABS_LIMIT);
	} catch {
		return [];
	}
}

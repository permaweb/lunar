import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';
import { useTheme } from 'styled-components';

import { ViewWrapper } from 'app/styles';
import { Button } from 'components/atoms/Button';
import { Modal } from 'components/atoms/Modal';
import { ExplorerLink } from 'components/atoms/TxAddress';
import { ViewHeader } from 'components/atoms/ViewHeader';
import { ASSETS, DEFAULT_STATE_NODE_URL, PROCESSES, STORAGE, TOKEN_DENOMINATIONS, URLS } from 'helpers/config';
import { capitalize, formatUnits, getByteSizeDisplay } from 'helpers/utils';
import { useArweaveProvider } from 'providers/ArweaveProvider';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { useNotifications } from 'providers/NotificationProvider';
import { useSettingsProvider } from 'providers/SettingsProvider';
import { WalletBlock } from 'wallet/WalletBlock';

import * as S from './styles';
import { fundTarget, fundUpload, quoteUpload } from './waterfall';

const LEDGER_DEVICE = 'recharging-ledger@1.0';
const FALLBACK_DEVICE = 'ao-payment@1.0';
const PRICING_DEVICE = 'arweave-byte-pricing@1.0';

// The bucket max / recharge / period are read live from the node below; these
// are only fallbacks used until that fetch resolves.
const DEFAULT_MAX_UNITS = 3_000_000_000;
const DEFAULT_BASE_RATE = 34_722;
const DEFAULT_PERIOD = 1;

const UNIT_LINE_COUNT = 40;
const ACTIVITY_LIMIT = 10;

// Rough per-item ANS-104 envelope (signature + owner + tags) added on top of
// raw file bytes when estimating a whole run's cost for the up-front top-up.
const ITEM_OVERHEAD_BYTES = 4096;

type UploadStatus = 'queued' | 'uploading' | 'complete' | 'error';

type QueuedFile = {
	file: File;
	path: string | null;
};

type UploadEntry = {
	id: string;
	file: File;
	path: string | null;
	previewUrl?: string;
	status: UploadStatus;
	itemId?: string;
	error?: string;
	balanceBefore?: number;
	balanceAfter?: number;
	paid?: boolean;
	cost?: string;
};

// Queued files that came in via a folder are collapsed into one row per
// top-level folder; loose files render individually.
type QueueRow = { type: 'file'; entry: UploadEntry } | { type: 'folder'; root: string; entries: UploadEntry[] };

type PendingPayment = {
	cost: string;
	entryId: string;
	fileName: string;
	resolve: (approved: boolean) => void;
};

type ActivityEntry = {
	id: string;
	label: string;
	status: UploadStatus;
	itemId?: string;
	error?: string;
	balanceBefore?: number;
	balanceAfter?: number;
	paid?: boolean;
	cost?: string;
	contentType?: string;
	size: number;
	at: string;
};

function isUploadStatus(value: unknown): value is UploadStatus {
	return value === 'queued' || value === 'uploading' || value === 'complete' || value === 'error';
}

function isActivityEntry(value: unknown): value is ActivityEntry {
	if (!value || typeof value !== 'object') return false;
	const entry = value as Record<string, unknown>;
	return (
		typeof entry.id === 'string' &&
		typeof entry.label === 'string' &&
		isUploadStatus(entry.status) &&
		typeof entry.size === 'number' &&
		typeof entry.at === 'string'
	);
}

function readStoredActivity(address: string): ActivityEntry[] {
	try {
		const raw = localStorage.getItem(STORAGE.uploadActivity(address));
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed.filter(isActivityEntry).slice(0, ACTIVITY_LIMIT) : [];
	} catch {
		return [];
	}
}

function writeStoredActivity(address: string, entries: ActivityEntry[]) {
	try {
		localStorage.setItem(STORAGE.uploadActivity(address), JSON.stringify(entries.slice(0, ACTIVITY_LIMIT)));
	} catch {
		// localStorage may be unavailable in private or locked-down browser contexts.
	}
}

// The bucket snapshot anchors the client-side recharge interpolation. Persist
// it per node + wallet so a page reload resumes from the last known level
// (plus the recharge earned while away) instead of restarting at zero.
function readStoredBucket(nodeUrl: string, address: string): { value: number; at: number } | null {
	try {
		const raw = localStorage.getItem(STORAGE.uploadBucket(nodeUrl, address));
		const parsed = raw ? JSON.parse(raw) : null;
		if (parsed && typeof parsed.value === 'number' && typeof parsed.at === 'number') return parsed;
		return null;
	} catch {
		return null;
	}
}

function writeStoredBucket(nodeUrl: string, address: string, snapshot: { value: number; at: number } | null) {
	try {
		if (snapshot) localStorage.setItem(STORAGE.uploadBucket(nodeUrl, address), JSON.stringify(snapshot));
		else localStorage.removeItem(STORAGE.uploadBucket(nodeUrl, address));
	} catch {
		// localStorage may be unavailable in private or locked-down browser contexts.
	}
}

function clampPercent(value: number) {
	return Math.max(0, Math.min(100, value));
}

function endpoint(base: string, path: string) {
	return new URL(path, base.endsWith('/') ? base : `${base}/`).toString();
}

function parseMaybeJson(text: string) {
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

function balanceFromResponse(value: unknown): number {
	if (typeof value === 'number') return value;
	if (typeof value === 'string') {
		const parsed = Number(value.trim());
		if (Number.isFinite(parsed)) return parsed;
	}
	if (value && typeof value === 'object') {
		const record = value as Record<string, unknown>;
		if ('body' in record) return balanceFromResponse(record.body);
		if ('balance' in record) return balanceFromResponse(record.balance);
		if ('units' in record) return balanceFromResponse(record.units);
	}
	throw new Error('Balance response is not numeric.');
}

function formatInteger(value: number | null) {
	if (value === null || !Number.isFinite(value)) return '-';
	return Math.floor(value).toLocaleString();
}

function formatDuration(seconds: number) {
	if (!Number.isFinite(seconds)) return '-';
	if (seconds <= 0) return 'Full';
	if (seconds < 60) return `${Math.ceil(seconds)}s`;
	if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
	return `${Math.ceil(seconds / 3600)}h`;
}

function formatAo(raw: string | null) {
	if (!raw) return '-';
	try {
		return `${formatUnits(raw, TOKEN_DENOMINATIONS.ao, 4)} AO`;
	} catch {
		return '-';
	}
}

function unitTone(percent: number): 'healthy' | 'warning' | 'critical' {
	if (percent <= 20) return 'critical';
	if (percent <= 50) return 'warning';
	return 'healthy';
}

function itemIdFromResponse(response: unknown, fallback: string) {
	if (response && typeof response === 'object') {
		const record = response as Record<string, unknown>;
		if (typeof record.id === 'string') return record.id;
		if (record.body && typeof record.body === 'object') {
			const body = record.body as Record<string, unknown>;
			if (typeof body.id === 'string') return body.id;
		}
	}
	return fallback;
}

function uploadErrorFromResponse(response: unknown, status: number): string {
	if (typeof response === 'string') return response || `Upload failed: ${status}`;
	if (response && typeof response === 'object') {
		const record = response as Record<string, unknown>;
		if ('body' in record) return uploadErrorFromResponse(record.body, status);
		const error = typeof record.error === 'string' ? record.error : undefined;
		const details = typeof record.details === 'string' ? record.details : undefined;
		if (error && details) return `${error}: ${details}`;
		if (error) return error;
		if (details) return details;
	}
	return `Upload failed: ${status}`;
}

function base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
	const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
	const padding = base64.length % 4;
	const padded = padding ? base64 + '='.repeat(4 - padding) : base64;
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
	return bytes.buffer;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer) {
	const bytes = new Uint8Array(buffer);
	const chunks: string[] = [];
	for (let offset = 0; offset < bytes.length; offset += 0x8000) {
		chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)));
	}
	return btoa(chunks.join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function toUint8Array(value: ArrayBufferLike | ArrayBufferView | string): Uint8Array {
	if (typeof value === 'string') return new Uint8Array(base64UrlToArrayBuffer(value));

	const source = ArrayBuffer.isView(value)
		? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
		: new Uint8Array(value);
	const copy = new Uint8Array(source.byteLength);
	copy.set(source);
	return copy;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
	const copy = new Uint8Array(bytes.byteLength);
	copy.set(bytes);
	return copy.buffer;
}

async function parseSignedDataItem(raw: Uint8Array) {
	const signatureType = raw[0] + (raw[1] << 8);
	const signatureBytes = signatureType === 1 ? 512 : 64;
	const signature = raw.slice(2, 2 + signatureBytes);
	const id = arrayBufferToBase64Url(await crypto.subtle.digest('SHA-256', signature));
	return { id };
}

async function signDataItemWithWallet(wallet: any, data: Uint8Array, tags: { name: string; value: string }[]) {
	if (typeof wallet?.signDataItem !== 'function') throw new Error('Wallet cannot sign ANS-104 data items.');
	const result = await wallet.signDataItem({ data, tags });
	const raw = toUint8Array(result);
	return { raw, ...(await parseSignedDataItem(raw)) };
}

function iconForType(contentType: string | null | undefined) {
	if (!contentType) return ASSETS.data;
	if (contentType.startsWith('image/')) return ASSETS.image;
	if (contentType.startsWith('video/')) return ASSETS.video;
	if (contentType.startsWith('text/') || contentType.includes('pdf') || contentType.includes('json'))
		return ASSETS.article;
	return ASSETS.data;
}

// Image files render a real preview; everything else falls back to a
// type-based icon (which also catches previews that fail to load).
function ItemThumb(props: { src?: string | null; icon: string }) {
	const [failed, setFailed] = React.useState<boolean>(false);

	React.useEffect(() => {
		setFailed(false);
	}, [props.src]);

	return (
		<S.Thumb>
			{props.src && !failed ? (
				<img src={props.src} alt={''} onError={() => setFailed(true)} />
			) : (
				<ReactSVG src={props.icon} />
			)}
		</S.Thumb>
	);
}

function groupStatus(entries: UploadEntry[]): UploadStatus {
	if (entries.some((entry) => entry.status === 'uploading')) return 'uploading';
	if (entries.some((entry) => entry.status === 'error')) return 'error';
	if (entries.every((entry) => entry.status === 'complete')) return 'complete';
	return 'queued';
}

function groupCost(entries: UploadEntry[]): { paid: boolean; costRaw: string | null } {
	let total = BigInt(0);
	let hasCost = false;
	let paid = false;
	for (const entry of entries) {
		if (!entry.cost) continue;
		try {
			total += BigInt(entry.cost);
			hasCost = true;
		} catch {
			// Skip malformed stored costs.
		}
		if (entry.paid) paid = true;
	}
	return { paid, costRaw: hasCost ? total.toString() : null };
}

function createUploadEntry(queued: QueuedFile): UploadEntry {
	return {
		id: `${queued.file.name}-${queued.file.size}-${queued.file.lastModified}-${crypto.randomUUID()}`,
		file: queued.file,
		path: queued.path,
		previewUrl: queued.file.type.startsWith('image/') ? URL.createObjectURL(queued.file) : undefined,
		status: 'queued',
	};
}

// Recursively walk a dropped FileSystemEntry, preserving the relative path of
// every file inside a dropped directory. `prefix` is the path of the PARENT
// directory ('' at the top level) — each recursion appends the entry's own
// name exactly once.
async function collectEntry(entry: any, prefix: string): Promise<QueuedFile[]> {
	if (entry.isFile) {
		const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject));
		return [{ file, path: prefix ? `${prefix}${entry.name}` : null }];
	}
	if (entry.isDirectory) {
		const reader = entry.createReader();
		const children: any[] = [];
		// readEntries returns results in batches; keep reading until it drains.
		let batch: any[];
		do {
			batch = await new Promise<any[]>((resolve, reject) => reader.readEntries(resolve, reject));
			children.push(...batch);
		} while (batch.length > 0);
		const nested = await Promise.all(children.map((child) => collectEntry(child, `${prefix}${entry.name}/`)));
		return nested.flat();
	}
	return [];
}

async function filesFromDataTransfer(dataTransfer: DataTransfer): Promise<QueuedFile[]> {
	const items = Array.from(dataTransfer.items ?? []);
	// webkitGetAsEntry must be called synchronously before the drop event yields.
	const entries = items.map((item) =>
		item.kind === 'file' && typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null
	);

	if (entries.some((entry) => entry)) {
		const collected = await Promise.all(
			entries.map((entry) => (entry ? collectEntry(entry, '') : Promise.resolve([])))
		);
		return collected.flat();
	}

	return Array.from(dataTransfer.files).map((file) => ({ file, path: null }));
}

export default function Upload() {
	const navigate = useNavigate();
	const theme = useTheme();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const settingsProvider = useSettingsProvider();
	const arProvider = useArweaveProvider();
	const { addNotification } = useNotifications();

	const activeNode = settingsProvider.settings.nodes.find((node) => node.active) ?? settingsProvider.settings.nodes[0];
	const nodeUrl = activeNode.url;
	const walletAddress = arProvider.walletAddress;

	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const folderInputRef = React.useRef<HTMLInputElement>(null);
	const bucketSnapshot = React.useRef<{ value: number; at: number } | null>(null);
	const balanceDisplayRef = React.useRef<HTMLSpanElement>(null);
	const filesRef = React.useRef<UploadEntry[]>([]);

	const [balance, setBalance] = React.useState<number | null>(null);
	const [effectiveBalance, setEffectiveBalance] = React.useState<number | null>(null);
	const [_aoBalanceRaw, setAoBalanceRaw] = React.useState<string | null>(null);
	const [syncError, setSyncError] = React.useState<string | null>(null);
	const [refreshing, setRefreshing] = React.useState<boolean>(false);
	const [uploading, setUploading] = React.useState<boolean>(false);
	const [dragActive, setDragActive] = React.useState<boolean>(false);
	const [files, setFiles] = React.useState<UploadEntry[]>([]);
	const [activity, setActivity] = React.useState<ActivityEntry[]>([]);
	const [pendingPayment, setPendingPayment] = React.useState<PendingPayment | null>(null);
	const [estCostRaw, setEstCostRaw] = React.useState<string | null>(null);
	const [nodeMax, setNodeMax] = React.useState<number>(DEFAULT_MAX_UNITS);
	const [nodeRecharge, setNodeRecharge] = React.useState<number>(DEFAULT_BASE_RATE);
	const [nodePeriod, setNodePeriod] = React.useState<number>(DEFAULT_PERIOD);

	const maxUnits = nodeMax;
	const rechargeRate = nodePeriod > 0 ? nodeRecharge / nodePeriod : nodeRecharge;
	const selectedBytes = files.reduce((total, entry) => total + entry.file.size, 0);
	const estCostBig = estCostRaw ? BigInt(estCostRaw) : null;
	const willBePaid =
		estCostBig !== null &&
		balance !== null &&
		fundTarget(estCostBig) > BigInt(Math.max(0, Math.floor(Math.min(balance, effectiveBalance ?? balance))));

	const unitPercent = balance === null || maxUnits <= 0 ? 0 : clampPercent((balance / maxUnits) * 100);
	const unitLineTone = balance === null ? 'empty' : unitTone(unitPercent);
	const unitLines = React.useMemo(
		() =>
			Array.from({ length: UNIT_LINE_COUNT }, (_value, index) =>
				((index + 1) / UNIT_LINE_COUNT) * 100 <= unitPercent ? unitLineTone : ('empty' as const)
			),
		[unitPercent, unitLineTone]
	);
	const secondsToFull = balance === null || rechargeRate <= 0 ? Number.NaN : (maxUnits - balance) / rechargeRate;

	// The sponsored bucket recharges continuously; interpolate from the last
	// fetched value instead of hammering the node for every estimate.
	const estimateBucketBalance = React.useCallback(() => {
		const snapshot = bucketSnapshot.current;
		if (!snapshot) return null;
		const elapsed = Math.max(0, (Date.now() - snapshot.at) / 1000);
		return Math.min(maxUnits, snapshot.value + elapsed * rechargeRate);
	}, [maxUnits, rechargeRate]);

	const setBucketBalance = React.useCallback(
		(next: number | null) => {
			if (next === null || !Number.isFinite(next)) {
				bucketSnapshot.current = null;
				if (walletAddress) writeStoredBucket(nodeUrl, walletAddress, null);
				setBalance(null);
				return;
			}
			const value = Math.max(0, Math.min(maxUnits, next));
			bucketSnapshot.current = { value, at: Date.now() };
			if (walletAddress) writeStoredBucket(nodeUrl, walletAddress, bucketSnapshot.current);
			setBalance(value);
		},
		[maxUnits, nodeUrl, walletAddress]
	);

	const fetchLedgerBalance = React.useCallback(
		async (target: string) => {
			const url = endpoint(nodeUrl, `/~recharging-ledger@1.0/balance?target=${encodeURIComponent(target)}`);
			const response = await fetch(url, { headers: { accept: 'application/json' } });
			const text = await response.text();
			if (!response.ok) throw new Error(text || `Balance failed: ${response.status}`);
			return balanceFromResponse(parseMaybeJson(text));
		},
		[nodeUrl]
	);

	const fetchAoBalance = React.useCallback(async (target: string) => {
		const url = endpoint(DEFAULT_STATE_NODE_URL, `/${PROCESSES.ao}~process@1.0/compute/balances/${target}`);
		const response = await fetch(url);
		if (response.status === 404) return '0';
		const text = (await response.text()).trim();
		if (!response.ok) throw new Error(text || `AO balance failed: ${response.status}`);
		if (!/^\d+$/.test(text)) throw new Error('AO balance response is not an integer.');
		return text;
	}, []);

	const fetchFallbackBalance = React.useCallback(
		async (target: string) => {
			const url = endpoint(nodeUrl, `/ledger~node-process@1.0/now/balance/${encodeURIComponent(target)}`);
			const response = await fetch(url, { headers: { accept: 'text/plain' } });
			if (response.status === 404) return 0;
			const text = (await response.text()).trim();
			if (!response.ok) throw new Error(text || `Fallback balance failed: ${response.status}`);
			return balanceFromResponse(parseMaybeJson(text));
		},
		[nodeUrl]
	);

	// The ledger balance endpoint aggregates the sponsored bucket with any
	// ao-payment credit. When paid credit dominates, fall back to the local
	// recharge estimate for the bucket display instead of the combined figure.
	const applyBalances = React.useCallback(
		(effective: number, fallback: number) => {
			setEffectiveBalance(effective);
			const bucketEstimate = estimateBucketBalance();
			if (fallback > 0 && fallback >= effective) {
				setBucketBalance(bucketEstimate ?? 0);
			} else {
				setBucketBalance(effective);
			}
		},
		[estimateBucketBalance, setBucketBalance]
	);

	const refreshEffectiveBalance = React.useCallback(
		async (target: string) => {
			const [ledger, fallback] = await Promise.all([
				fetchLedgerBalance(target),
				fetchFallbackBalance(target).catch(() => 0),
			]);
			applyBalances(ledger, fallback);
			return { effective: ledger, fallback };
		},
		[applyBalances, fetchFallbackBalance, fetchLedgerBalance]
	);

	const appendActivity = React.useCallback((address: string | null, entry: ActivityEntry) => {
		setActivity((current) => {
			const next = [entry, ...current.slice(0, ACTIVITY_LIMIT - 1)];
			if (address) writeStoredActivity(address, next);
			return next;
		});
	}, []);

	// Paid uploads pause here for explicit approval before any AO is spent.
	const requestPaymentConfirm = React.useCallback(
		(entryId: string, fileName: string, cost: string) =>
			new Promise<boolean>((resolve) => {
				setPendingPayment({ cost, entryId, fileName, resolve });
			}),
		[]
	);

	const resolvePendingPayment = React.useCallback((approved: boolean) => {
		setPendingPayment((current) => {
			current?.resolve(approved);
			return null;
		});
	}, []);

	const refreshAccount = React.useCallback(
		async (target = walletAddress) => {
			if (!target) return;
			setRefreshing(true);
			setSyncError(null);
			try {
				const [ledgerResult, aoResult] = await Promise.allSettled([
					refreshEffectiveBalance(target),
					fetchAoBalance(target),
				]);
				if (aoResult.status === 'fulfilled') setAoBalanceRaw(aoResult.value);
				if (ledgerResult.status === 'rejected') throw ledgerResult.reason;
				if (aoResult.status === 'rejected') throw aoResult.reason;
			} catch (e: any) {
				console.error(e);
				setSyncError(e.message ?? language.errorFetchingData);
			} finally {
				setRefreshing(false);
			}
		},
		[fetchAoBalance, language, refreshEffectiveBalance, walletAddress]
	);

	// Reset per-node state and reload balances when the wallet or node changes.
	React.useEffect(() => {
		bucketSnapshot.current = null;
		setBalance(null);
		setEffectiveBalance(null);
		setAoBalanceRaw(null);
		setSyncError(null);

		if (!walletAddress) {
			setActivity([]);
			return;
		}

		// Resume the recharge interpolation from the persisted snapshot (the
		// elapsed offline time keeps counting) so the display doesn't restart
		// at zero while the first node sync is in flight.
		const stored = readStoredBucket(nodeUrl, walletAddress);
		if (stored) {
			bucketSnapshot.current = stored;
			const estimate = estimateBucketBalance();
			if (estimate !== null) setBalance(estimate);
		}

		setActivity(readStoredActivity(walletAddress));
		refreshAccount(walletAddress);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [walletAddress, nodeUrl]);

	React.useEffect(() => {
		if (!walletAddress) return;
		const interval = window.setInterval(() => refreshAccount(walletAddress), 15_000);
		return () => window.clearInterval(interval);
	}, [refreshAccount, walletAddress]);

	// Tick the sponsored bucket between node syncs so the bars recharge live.
	// The snapshot stays anchored to the last fetched value, so this only
	// interpolates — the 15s poll above re-syncs it against the node. The
	// balance readout itself animates at frame rate below; this coarser tick
	// only drives the bars, route, and time-to-full.
	React.useEffect(() => {
		if (!walletAddress) return;
		const interval = window.setInterval(() => {
			const estimate = estimateBucketBalance();
			if (estimate !== null) setBalance(estimate);
		}, 1000);
		return () => window.clearInterval(interval);
	}, [estimateBucketBalance, walletAddress]);

	// Animate the balance readout at frame rate, writing straight to the DOM
	// node (the NodeConnection uptime pattern) so the view doesn't re-render 60
	// times a second. The displayed value eases toward the live estimate, so
	// the periodic node re-syncs glide instead of jumping.
	React.useEffect(() => {
		if (!walletAddress) return;
		let frame: number;
		let displayed: number | null = null;
		let last = performance.now();
		const step = (now: number) => {
			const dt = Math.min(1, (now - last) / 1000);
			last = now;
			const target = estimateBucketBalance();
			if (target !== null) {
				displayed = displayed === null ? target : displayed + (target - displayed) * Math.min(1, dt * 6);
				if (balanceDisplayRef.current) balanceDisplayRef.current.textContent = formatInteger(displayed);
			}
			frame = requestAnimationFrame(step);
		};
		frame = requestAnimationFrame(step);
		return () => cancelAnimationFrame(frame);
	}, [estimateBucketBalance, walletAddress]);

	// Live cost preview for the current selection, so the user sees whether an
	// upload will draw the sponsored bucket or hit the paid ao-payment route.
	React.useEffect(() => {
		if (selectedBytes <= 0) {
			setEstCostRaw(null);
			return;
		}
		let cancelled = false;
		quoteUpload(nodeUrl, selectedBytes)
			.then((quote) => {
				if (!cancelled) setEstCostRaw(quote.costRaw.toString());
			})
			.catch(() => {
				if (!cancelled) setEstCostRaw(null);
			});
		return () => {
			cancelled = true;
		};
	}, [nodeUrl, selectedBytes]);

	// Read the ledger params (bucket max / recharge / period) live from the node
	// so the rate and time-to-full stay correct if the operator retunes them.
	React.useEffect(() => {
		let cancelled = false;
		const readInt = async (key: string): Promise<number | null> => {
			try {
				const response = await fetch(endpoint(nodeUrl, `/~meta@1.0/info/${key}`), {
					headers: { accept: 'text/plain' },
				});
				if (!response.ok) return null;
				const text = (await response.text()).trim();
				return /^\d+$/.test(text) ? Number(text) : null;
			} catch {
				return null;
			}
		};
		(async () => {
			const [max, recharge, period] = await Promise.all([
				readInt('recharging-ledger-max'),
				readInt('recharging-ledger-recharge'),
				readInt('recharging-ledger-period'),
			]);
			if (cancelled) return;
			if (max && max > 0) setNodeMax(max);
			if (recharge && recharge > 0) setNodeRecharge(recharge);
			if (period && period > 0) setNodePeriod(period);
		})();
		return () => {
			cancelled = true;
		};
	}, [nodeUrl]);

	const handleFiles = React.useCallback((queued: QueuedFile[]) => {
		if (queued.length === 0) return;
		setFiles((current) => [...current, ...queued.map(createUploadEntry)]);
	}, []);

	const removeEntries = React.useCallback((ids: string[]) => {
		setFiles((current) => {
			const removable = current.filter((entry) => ids.includes(entry.id) && entry.status !== 'uploading');
			for (const entry of removable) {
				if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
			}
			return current.filter((entry) => !removable.includes(entry));
		});
	}, []);

	// Release any remaining image preview object URLs when leaving the view.
	React.useEffect(() => {
		filesRef.current = files;
	}, [files]);

	React.useEffect(() => {
		return () => {
			for (const entry of filesRef.current) {
				if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
			}
		};
	}, []);

	// Collapse folder uploads into one row per top-level folder.
	const queueRows = React.useMemo(() => {
		const rows: QueueRow[] = [];
		const groups = new Map<string, Extract<QueueRow, { type: 'folder' }>>();
		for (const entry of files) {
			const root = entry.path ? entry.path.split('/')[0] : null;
			if (root) {
				let group = groups.get(root);
				if (!group) {
					group = { type: 'folder', root, entries: [] };
					groups.set(root, group);
					rows.push(group);
				}
				group.entries.push(entry);
			} else {
				rows.push({ type: 'file', entry });
			}
		}
		return rows;
	}, [files]);

	const handleDrop = React.useCallback(
		(event: React.DragEvent<HTMLElement>) => {
			event.preventDefault();
			event.stopPropagation();
			setDragActive(false);
			filesFromDataTransfer(event.dataTransfer)
				.then(handleFiles)
				.catch((e: any) => {
					console.error(e);
					addNotification(e.message ?? language.errorOccurred, 'warning');
				});
		},
		[addNotification, handleFiles, language]
	);

	const handleDragOver = React.useCallback((event: React.DragEvent<HTMLElement>) => {
		event.preventDefault();
		event.stopPropagation();
		event.dataTransfer.dropEffect = 'copy';
		setDragActive(true);
	}, []);

	const handleDragLeave = React.useCallback((event: React.DragEvent<HTMLElement>) => {
		event.preventDefault();
		event.stopPropagation();
		const nextTarget = event.relatedTarget;
		if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) setDragActive(false);
	}, []);

	function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
		if (event.target.files) {
			handleFiles(
				Array.from(event.target.files).map((file) => ({
					file,
					path: (file as any).webkitRelativePath || null,
				}))
			);
		}
		event.target.value = '';
	}

	const uploadOne = React.useCallback(
		async (entry: UploadEntry, address: string, runLedger: { spendable: number }) => {
			const wallet = arProvider.wallet ?? window.arweaveWallet;
			if (!wallet) throw new Error(language.connectToContinue);

			const before = estimateBucketBalance() ?? balance ?? runLedger.spendable;
			setFiles((current) =>
				current.map((item) => (item.id === entry.id ? { ...item, status: 'uploading', balanceBefore: before } : item))
			);

			const body = new Uint8Array(await entry.file.arrayBuffer());
			const tags = [
				{ name: 'App-Name', value: 'Lunar' },
				{ name: 'Upload-Protocol', value: 'HyperBEAM' },
				{ name: 'HyperBEAM-Node', value: nodeUrl.replace(/\/$/, '') },
				{ name: 'Content-Type', value: entry.file.type || 'application/octet-stream' },
				{ name: 'File-Name', value: entry.file.name },
			];
			if (entry.path) tags.push({ name: 'File-Path', value: entry.path });
			const signed = await signDataItemWithWallet(wallet, body, tags);
			const raw = signed.raw;

			// Waterfall: quote the signed item. If the sponsored recharging bucket can't
			// cover it, confirm with the user and fund the ao-payment fallback (real
			// AO) before uploading. If quoting is unavailable, fall through to a plain
			// upload — the node still enforces payment and 402s a drained bucket.
			let paid = false;
			let cost: string | undefined;
			let quote: Awaited<ReturnType<typeof quoteUpload>> | null = null;
			try {
				quote = await quoteUpload(nodeUrl, raw.byteLength);
			} catch (e: any) {
				console.error(e);
			}
			if (quote) {
				cost = quote.costRaw.toString();
				const targetUnits = fundTarget(quote.costRaw);
				// Decide the free/paid route against the run ledger (seeded once per
				// run and debited after every settlement), never against the node's
				// live report or the local recharge interpolation alone: the node's
				// balance endpoint lags its own settlements, so mid-run re-reads
				// return stale pre-charge figures, skip funding, and the settle then
				// rejects the item with an insufficient balance.
				const spendableUnits = BigInt(
					Math.max(0, Math.floor(Math.min(before ?? runLedger.spendable, runLedger.spendable)))
				);
				const runUnits = BigInt(Math.max(0, Math.floor(runLedger.spendable)));
				if (spendableUnits < targetUnits) {
					paid = true;
					setFiles((current) => current.map((item) => (item.id === entry.id ? { ...item, paid, cost } : item)));
					if (runUnits < targetUnits) {
						const approved = await requestPaymentConfirm(entry.id, entry.file.name, cost);
						if (!approved) {
							setFiles((current) =>
								current.map((item) =>
									item.id === entry.id
										? { ...item, status: 'error', error: language.paymentDeclined, paid: true, cost }
										: item
								)
							);
							appendActivity(address, {
								id: entry.id,
								label: entry.path ?? entry.file.name,
								status: 'error',
								error: language.paymentDeclined,
								paid: true,
								cost,
								contentType: entry.file.type || undefined,
								size: entry.file.size,
								at: new Date().toLocaleTimeString(),
							});
							addNotification(language.paymentDeclined, 'warning');
							return;
						}
						await fundUpload(quote, address, DEFAULT_STATE_NODE_URL);
						// The funded credit covers at least the padded target.
						runLedger.spendable = Math.max(runLedger.spendable, Number(targetUnits));
						await fetchAoBalance(address)
							.then(setAoBalanceRaw)
							.catch(() => undefined);
					}
				}
			}

			const uploadUrl = endpoint(nodeUrl, '/~bundler@1.0/item?codec-device=ans104@1.0');
			const postItem = async () => {
				const response = await fetch(uploadUrl, {
					method: 'POST',
					headers: {
						accept: 'application/json',
						'content-type': 'application/octet-stream',
					},
					body: toArrayBuffer(raw),
				});
				const text = await response.text();
				return { ok: response.ok, status: response.status, parsed: parseMaybeJson(text) };
			};

			let result = await postItem();
			if (!result.ok) {
				const message = uploadErrorFromResponse(result.parsed, result.status);
				// The node's ledger can momentarily lag a just-imported deposit or a
				// concurrent settlement; give it a beat and retry once before failing.
				if (result.status === 402 || /insufficient/i.test(message)) {
					await new Promise((resolve) => setTimeout(resolve, 2500));
					result = await postItem();
				}
			}
			const parsed = result.parsed;
			if (!result.ok) throw new Error(uploadErrorFromResponse(parsed, result.status));

			// Settlement bookkeeping: debit the run ledger so the next file in this
			// run decides against a post-charge figure.
			const costUnits = cost ? Number(cost) : Number.NaN;
			if (Number.isFinite(costUnits)) {
				runLedger.spendable = Math.max(0, runLedger.spendable - costUnits);
			}

			await refreshEffectiveBalance(address).catch(() => undefined);
			const refreshed = estimateBucketBalance();
			let after = refreshed ?? before;
			// If the node's report hasn't caught up with this settlement (the
			// re-synced level didn't drop), debit the display estimate locally too.
			if (Number.isFinite(costUnits) && refreshed !== null && before !== null && refreshed >= before) {
				after = Math.max(0, refreshed - costUnits);
			}
			const itemId = itemIdFromResponse(parsed, signed.id);
			setBucketBalance(after ?? null);
			setFiles((current) =>
				current.map((existing) =>
					existing.id === entry.id
						? { ...existing, status: 'complete', itemId, balanceBefore: before, balanceAfter: after, paid, cost }
						: existing
				)
			);
			appendActivity(address, {
				id: entry.id,
				label: entry.path ?? entry.file.name,
				status: 'complete',
				itemId,
				balanceBefore: before,
				balanceAfter: after,
				paid,
				cost,
				contentType: entry.file.type || undefined,
				size: entry.file.size,
				at: new Date().toLocaleTimeString(),
			});
			await fetchAoBalance(address)
				.then(setAoBalanceRaw)
				.catch(() => undefined);
		},
		[
			addNotification,
			appendActivity,
			arProvider.wallet,
			balance,
			estimateBucketBalance,
			fetchAoBalance,
			language,
			nodeUrl,
			refreshEffectiveBalance,
			requestPaymentConfirm,
			setBucketBalance,
		]
	);

	const handleUploadSelected = React.useCallback(async () => {
		if (!walletAddress) {
			arProvider.setWalletModalVisible(true);
			return;
		}
		const queued = files.filter((entry) => entry.status === 'queued' || entry.status === 'error');
		if (queued.length === 0) return;

		setUploading(true);
		let completed = 0;
		try {
			// One authoritative balance read per run: uploadOne debits this local
			// ledger after each settlement instead of re-reading the node, whose
			// balance report lags behind rapid consecutive uploads.
			const initial = await refreshEffectiveBalance(walletAddress).catch(() => ({
				effective: effectiveBalance ?? balance ?? 0,
				fallback: 0,
			}));
			const runLedger = { spendable: Math.max(0, initial.effective ?? 0) };

			// Top up ONCE for the whole run. Funding file-by-file mid-run races the
			// node: the credit sizing inside fundUpload reads the node's balances,
			// which still show pre-charge values right after earlier files settle,
			// so it under-funds and the settle rejects. Up-front, before any
			// charges exist, those reads are fresh.
			try {
				const totalBytes = queued.reduce((total, item) => total + item.file.size + ITEM_OVERHEAD_BYTES, 0);
				const runQuote = await quoteUpload(nodeUrl, totalBytes);
				const runTarget = fundTarget(runQuote.costRaw);
				if (BigInt(Math.max(0, Math.floor(runLedger.spendable))) < runTarget) {
					const label = queued.length === 1 ? queued[0].path ?? queued[0].file.name : language.fileCount(queued.length);
					const approved = await requestPaymentConfirm('run', label, runQuote.costRaw.toString());
					if (approved) {
						await fundUpload(runQuote, walletAddress, DEFAULT_STATE_NODE_URL);
						runLedger.spendable = Math.max(runLedger.spendable, Number(runTarget));
						await fetchAoBalance(walletAddress)
							.then(setAoBalanceRaw)
							.catch(() => undefined);
					}
					// Declined: fall through — files the bucket covers still upload,
					// and anything beyond it asks individually.
				}
			} catch (e: any) {
				// Quoting or funding unavailable — the per-file flow below handles
				// (and surfaces) payment for each item on its own.
				console.error(e);
			}

			for (const entry of queued) {
				try {
					await uploadOne(entry, walletAddress, runLedger);
					completed += 1;
				} catch (e: any) {
					const message = e.message ?? language.uploadFailed;
					console.error(e);
					setFiles((current) =>
						current.map((item) => (item.id === entry.id ? { ...item, status: 'error', error: message } : item))
					);
					appendActivity(walletAddress, {
						id: entry.id,
						label: entry.path ?? entry.file.name,
						status: 'error',
						error: message,
						contentType: entry.file.type || undefined,
						size: entry.file.size,
						at: new Date().toLocaleTimeString(),
					});
					addNotification(`${language.uploadFailed}: ${message}`, 'warning');
					break;
				}
			}
		} finally {
			setUploading(false);
		}
		if (completed > 0) addNotification(`${language.uploadComplete} (${completed})`, 'success');
	}, [
		addNotification,
		appendActivity,
		arProvider,
		balance,
		effectiveBalance,
		fetchAoBalance,
		files,
		language,
		nodeUrl,
		refreshEffectiveBalance,
		requestPaymentConfirm,
		uploadOne,
		walletAddress,
	]);

	const uploadableCount = files.filter((entry) => entry.status === 'queued' || entry.status === 'error').length;

	function statusIndicatorColor(status: UploadStatus) {
		switch (status) {
			case 'complete':
				return theme.colors.indicator.active;
			case 'error':
				return theme.colors.warning.primary;
			case 'uploading':
				return theme.colors.warning.caution;
			default:
				return theme.colors.container.alt8.background;
		}
	}

	return arProvider.walletAddress ? (
		<S.Wrapper>
			<ViewHeader
				header={language.upload}
				actions={[
					<Button
						type={'primary'}
						label={language.selectFiles}
						handlePress={() => fileInputRef.current?.click()}
						disabled={uploading}
					/>,
					<Button
						type={'primary'}
						label={language.selectFolder}
						handlePress={() => folderInputRef.current?.click()}
						disabled={uploading}
					/>,
					<Button
						type={'alt1'}
						label={walletAddress ? language.uploadSelected : language.connectWallet}
						handlePress={handleUploadSelected}
						disabled={walletAddress ? uploadableCount === 0 || uploading : false}
						loading={uploading}
					/>,
				]}
			/>
			<ViewWrapper>
				<S.BodyWrapper>
					<S.MainWrapper>
						<S.UploadMain
							onDragEnter={handleDragOver}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
						>
							<S.DropZone active={dragActive} disabled={uploading}>
								<input ref={fileInputRef} type={'file'} multiple onChange={handleInputChange} disabled={uploading} />
								<ReactSVG src={ASSETS.upload} />
								<span>{language.uploadDropInfo}</span>
							</S.DropZone>
							<input
								ref={folderInputRef}
								type={'file'}
								multiple
								onChange={handleInputChange}
								disabled={uploading}
								style={{ display: 'none' }}
								{...({ webkitdirectory: '' } as any)}
							/>
							<S.ListWrapper>
								{files.length === 0 ? (
									<S.EmptyRow>
										<span>{language.noFilesSelected}</span>
									</S.EmptyRow>
								) : (
									queueRows.map((row) => {
										if (row.type === 'folder') {
											const status = groupStatus(row.entries);
											const totalSize = row.entries.reduce((total, entry) => total + entry.file.size, 0);
											const completeCount = row.entries.filter((entry) => entry.status === 'complete').length;
											const errorCount = row.entries.filter((entry) => entry.status === 'error').length;
											const cost = groupCost(row.entries);
											return (
												<S.ListRow key={`folder-${row.root}`}>
													<S.ListRowSection>
														<ItemThumb icon={ASSETS.folder} />
														<S.ListRowInfo>
															<p>{row.root}</p>
															<span>{`${language.fileCount(row.entries.length)} - ${getByteSizeDisplay(
																totalSize
															)}`}</span>
														</S.ListRowInfo>
													</S.ListRowSection>
													<S.ListRowSection>
														{errorCount > 0 && (
															<S.ListRowError>
																<span
																	className={'row-error'}
																>{`${language.error} (${errorCount}/${row.entries.length})`}</span>
															</S.ListRowError>
														)}
														{cost.costRaw && (
															<S.CostBadge paid={cost.paid}>
																<span>
																	{cost.paid ? `${language.paid} ${formatAo(cost.costRaw)}` : language.sponsored}
																</span>
															</S.CostBadge>
														)}
														<S.StatusPill status={status}>
															<span>{status === 'uploading' ? `${completeCount}/${row.entries.length}` : status}</span>
														</S.StatusPill>
														<S.ListRowRemove>
															<Button
																type={'primary'}
																icon={ASSETS.close}
																handlePress={() => removeEntries(row.entries.map((entry) => entry.id))}
																disabled={status === 'uploading'}
																height={25}
																width={25}
																noMinWidth
																iconSize={11.5}
																tooltip={language.remove}
															/>
														</S.ListRowRemove>
													</S.ListRowSection>
												</S.ListRow>
											);
										}

										const entry = row.entry;
										return (
											<S.ListRow key={entry.id}>
												<S.ListRowSection>
													<ItemThumb src={entry.previewUrl} icon={iconForType(entry.file.type)} />
													<S.ListRowInfo>
														<p>{entry.file.name}</p>
														<span>{getByteSizeDisplay(entry.file.size)}</span>
													</S.ListRowInfo>
												</S.ListRowSection>
												<S.ListRowSection>
													{entry.error && (
														<S.ListRowError>
															<span className={'row-error'}>{entry.error}</span>
														</S.ListRowError>
													)}
													{entry.cost && (
														<S.CostBadge paid={Boolean(entry.paid)}>
															<span>
																{entry.paid ? `${language.paid} ${formatAo(entry.cost)}` : language.sponsored}
															</span>
														</S.CostBadge>
													)}
													<S.StatusPill status={entry.status}>
														<span>{entry.status}</span>
													</S.StatusPill>
													<S.ListRowRemove>
														<Button
															type={'primary'}
															icon={ASSETS.close}
															handlePress={() => removeEntries([entry.id])}
															disabled={entry.status === 'uploading'}
															height={23}
															width={23}
															noMinWidth
															iconSize={12}
															tooltip={language.remove}
														/>
													</S.ListRowRemove>
												</S.ListRowSection>
											</S.ListRow>
										);
									})
								)}
							</S.ListWrapper>
						</S.UploadMain>
						<S.ActivityMain>
							<S.PanelHeader>
								<p>{language.activity}</p>
							</S.PanelHeader>
							{activity.length === 0 ? (
								<S.EmptyRow>
									<span>{language.noUploadsYet}</span>
								</S.EmptyRow>
							) : (
								<S.TableWrapper>
									<S.TableHeader>
										<S.TableID>
											<p>{language.id}</p>
										</S.TableID>
										<S.TableName>
											<p>{language.name}</p>
										</S.TableName>
										<S.TableStatus>
											<p>{language.status}</p>
										</S.TableStatus>
										<S.TableSize>
											<p>{language.size}</p>
										</S.TableSize>
										<S.TableTime>
											<p>{language.time}</p>
										</S.TableTime>
									</S.TableHeader>
									<S.TableBody>
										{activity.map((entry) => (
											<S.TableRow
												key={`${entry.id}-${entry.at}`}
												className={'activity-list-element'}
												onClick={() => {
													if (entry.itemId) navigate(`${URLS.explorer}${entry.itemId}`);
												}}
											>
												<S.TableID title={entry.itemId ?? '-'}>
													{entry.itemId ? (
														<S.LinkLabel>
															<ExplorerLink value={entry.itemId} type={'transaction'} />
														</S.LinkLabel>
													) : (
														<p>-</p>
													)}
												</S.TableID>
												<S.TableName>
													<p title={entry.label}>{entry.label}</p>
												</S.TableName>
												<S.TableStatusValue background={statusIndicatorColor(entry.status)}>
													<div className={'type-indicator'} />
													<p title={entry.error ?? capitalize(entry.status)}>
														{entry.error ?? capitalize(entry.status)}
													</p>
												</S.TableStatusValue>
												<S.TableSize>
													<p>{getByteSizeDisplay(entry.size)}</p>
												</S.TableSize>
												<S.TableTime>
													<p>{entry.at}</p>
												</S.TableTime>
											</S.TableRow>
										))}
									</S.TableBody>
								</S.TableWrapper>
							)}
						</S.ActivityMain>
					</S.MainWrapper>
					<S.SideWrapper>
						<S.Panel $noWrapper>
							<S.PanelHeader>
								<p>{language.rechargingUnits}</p>
							</S.PanelHeader>
							{walletAddress ? (
								<>
									<S.UnitLines>
										{unitLines.map((tone, index) => (
											<S.UnitLine tone={tone} key={index} />
										))}
									</S.UnitLines>
									<S.BalanceMetric>
										<S.BalanceValue>
											<p>
												<span>Current:&nbsp;</span>
												{/* The 1s state tick renders a coarse fallback (and keeps hidden
												    tabs truthful, where rAF pauses); the frame-rate effect
												    overwrites this span's text with the eased value whenever the
												    tab is visible — without touching the label next to it. */}
												<span ref={balanceDisplayRef} className={'balance-live-value'}>
													{formatInteger(balance)}
												</span>
											</p>
										</S.BalanceValue>
										<S.BalanceValue>
											<p>
												<span>Max:&nbsp;</span>
												{formatInteger(maxUnits)}
											</p>
										</S.BalanceValue>
									</S.BalanceMetric>
									<S.MetricGrid>
										<S.MetricSection>
											<p>{language.rate}</p>
											<p className={'metric-value'}>{formatInteger(rechargeRate)} u/s</p>
										</S.MetricSection>
										<S.MetricSection>
											<p>{language.timeToFull}</p>
											<p className={'metric-value'}>{formatDuration(secondsToFull)}</p>
										</S.MetricSection>
									</S.MetricGrid>
									<S.SummaryWrapper>
										<S.SummarySection>
											<p>{`${language.selected}:`}</p>
											<p className={'metric-value'}>{files.length ?? '-'}</p>
										</S.SummarySection>
										<S.SummarySection>
											<p>{`${language.totalSize}:`}</p>
											<p className={'metric-value'}>{selectedBytes > 0 ? getByteSizeDisplay(selectedBytes) : '-'}</p>
										</S.SummarySection>
										<S.SummarySection>
											<p>{`${language.estimatedCost}:`}</p>
											<p className={'metric-value'}>{formatAo(estCostRaw)}</p>
										</S.SummarySection>
										<S.SummarySection>
											<p>{`${language.route}:`}</p>
											<p className={'metric-value'}>
												{files.length === 0 ? '-' : willBePaid ? language.paid : language.sponsored}
											</p>
										</S.SummarySection>
									</S.SummaryWrapper>
									<S.MetricGrid>
										<S.MetricSection>
											<p>{'Ledger'}</p>
											<p className={'metric-value'}>{LEDGER_DEVICE}</p>
										</S.MetricSection>
										<S.MetricSection>
											<p>{'Fallback Payment'}</p>
											<p className={'metric-value'}>{FALLBACK_DEVICE}</p>
										</S.MetricSection>
										<S.MetricSection>
											<p>{'Pricing'}</p>
											<p className={'metric-value'}>{PRICING_DEVICE}</p>
										</S.MetricSection>
										<S.MetricSection>
											<p>{language.status}</p>
											<p className={'metric-value'}>
												{refreshing
													? `${language.loading}...`
													: syncError
													? language.error
													: walletAddress
													? language.online
													: '-'}
											</p>
										</S.MetricSection>
									</S.MetricGrid>
									{syncError && (
										<S.EmptyRow>
											<span className={'row-error'}>{syncError}</span>
										</S.EmptyRow>
									)}
								</>
							) : (
								<S.ConnectWrapper>
									<p>{language.connectToContinue}</p>
								</S.ConnectWrapper>
							)}
						</S.Panel>
					</S.SideWrapper>
				</S.BodyWrapper>
			</ViewWrapper>
			{pendingPayment && (
				<Modal header={language.confirmPaidUpload} handleClose={() => resolvePendingPayment(false)}>
					<S.MWrapper className={'modal-wrapper'}>
						<p>{`${language.sponsoredBucketExhausted}. ${language.paidUploadInfo(pendingPayment.fileName)}`}</p>
						<S.MCostWrapper>
							<span>{language.estimatedCost}</span>
							<p>{formatAo(pendingPayment.cost)}</p>
						</S.MCostWrapper>
						<S.MActionsWrapper>
							<Button type={'primary'} label={language.cancel} handlePress={() => resolvePendingPayment(false)} />
							<Button
								type={'alt1'}
								label={`${language.pay} ${formatAo(pendingPayment.cost)}`}
								handlePress={() => resolvePendingPayment(true)}
							/>
						</S.MActionsWrapper>
					</S.MWrapper>
				</Modal>
			)}
		</S.Wrapper>
	) : (
		<WalletBlock />
	);
}

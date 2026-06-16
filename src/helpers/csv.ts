import { formatDate, getTagValue } from './utils';

export const DEFAULT_CSV_EXPORT_AMOUNT = 100;

export async function fetchBoundedGqlData(
	getGQLData: (args: any) => Promise<any>,
	queryArgs: any,
	amount: number,
	pageSize = DEFAULT_CSV_EXPORT_AMOUNT
) {
	const rows: any[] = [];
	let cursor: string | null = null;

	while (rows.length < amount) {
		const response = await getGQLData({
			...queryArgs,
			paginator: Math.min(pageSize, amount - rows.length),
			...(cursor ? { cursor } : {}),
		});
		const pageRows = response?.data ?? [];

		rows.push(...pageRows);

		if (pageRows.length <= 0 || !response?.nextCursor || response.nextCursor === 'END') break;
		cursor = response.nextCursor;
	}

	return rows.slice(0, amount);
}

export function parseCsvExportAmount(value: string | number): number | null {
	const parsed = Number(value);

	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function escapeCsvValue(value: unknown) {
	if (value === null || value === undefined) return '';

	const normalized = typeof value === 'object' ? JSON.stringify(value) : value.toString();
	const escaped = normalized.replace(/"/g, '""');

	return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
	if (!rows.length) return;

	const headers = Array.from(
		rows.reduce((acc, row) => {
			Object.keys(row).forEach((key) => acc.add(key));
			return acc;
		}, new Set<string>())
	);
	const csv = [
		headers.join(','),
		...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(',')),
	].join('\n');
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');

	link.href = url;
	link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

export function getCsvTimestamp() {
	const date = new Date();
	const pad = (value: number) => value.toString().padStart(2, '0');
	const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
	const timePart = `${pad(date.getHours())}-${pad(date.getMinutes())}`;

	return `${datePart}_at_${timePart}`;
}

function sanitizeFilenamePart(value: string | number) {
	return value
		.toString()
		.trim()
		.replace(/[^a-z0-9_-]+/gi, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 100);
}

export function buildCsvFilename(parts: (string | number | null | undefined | false)[]) {
	const normalizedParts = ['lunar', ...parts, getCsvTimestamp()]
		.map((part) => (part === false || part === null || part === undefined ? '' : sanitizeFilenamePart(part)))
		.filter(Boolean);

	return `${normalizedParts.join('-')}.csv`;
}

function isBundleTransaction(tags: any[]) {
	return (
		getTagValue(tags, 'Bundle-Format')?.toLowerCase() === 'binary' && getTagValue(tags, 'Bundle-Version') === '2.0.0'
	);
}

function getTransactionType(tags: any[]) {
	if (isBundleTransaction(tags)) return 'Bundle';

	return getTagValue(tags, 'Type') ?? 'Transaction';
}

function getActionFallback(tags: any[]) {
	if (tags.length === 1) return tags[0]?.name ?? 'None';

	const fallbackTagNames = ['App-Name', 'Content-Type', 'Name', 'Title', 'Protocol-Name', 'Bundle-Format'];

	for (const tagName of fallbackTagNames) {
		const value = getTagValue(tags, tagName);
		if (value) return value;
	}

	return 'None';
}

export function mapBlockForCsv(entry: any): Record<string, unknown> {
	const node = entry?.node ?? entry ?? {};
	const metadata = node.metadata ?? {};
	const timestamp = metadata.timestamp ?? node.timestamp;
	const txs = metadata.txs;

	return {
		height: metadata.height ?? node.height ?? '',
		id: metadata.indep_hash ?? node.id ?? '',
		previous: metadata.previous_block ?? node.previous ?? '',
		timestamp: timestamp ?? '',
		date: timestamp ? formatDate(timestamp * 1000, 'timestamp', true) : '',
		miner: metadata.reward_addr ?? metadata.miner ?? '',
		reward: metadata.reward ?? '',
		tx_root: metadata.tx_root ?? '',
		block_size: metadata.block_size ?? '',
		transaction_count: Array.isArray(txs) ? txs.length : '',
	};
}

export function mapTransactionForCsv(entry: any): Record<string, unknown> {
	const node = entry?.node ?? entry ?? {};
	const tags = node.tags ?? [];
	const timestamp = node.block?.timestamp;
	const type = getTransactionType(tags);
	const action = getTagValue(tags, 'Action') ?? getActionFallback(tags);

	return {
		id: node.id ?? '',
		type: type,
		action: action,
		owner: node.owner?.address ?? '',
		recipient: node.recipient ?? getTagValue(tags, 'Target') ?? '',
		quantity_winston: node.quantity?.winston ?? '',
		quantity_ar: node.quantity?.ar ?? '',
		fee_winston: node.fee?.winston ?? '',
		fee_ar: node.fee?.ar ?? '',
		block_height: node.block?.height ?? '',
		timestamp: timestamp ?? '',
		date: timestamp ? formatDate(timestamp * 1000, 'timestamp', true) : '',
		data_size: node.data?.size ?? '',
		data_type: node.data?.type ?? '',
		bundled_in: node.bundledIn?.id ?? '',
		tags: tags,
	};
}

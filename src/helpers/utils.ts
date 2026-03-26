import { Types } from '@permaweb/libs';

import {
	DEFAULT_AO_NODE,
	DEFAULT_ACTIONS,
	DEFAULT_LEGACY_AUTHORITY,
	DEFAULT_LEGACY_SCHEDULER_URL,
	DEFAULT_SCHEDULER_URL,
	PROCESSES,
} from './config';
import { DefaultGQLResponseType, GQLNodeResponseType, MessageVariantEnum, ResultMessageType, TagType } from './types';

export function checkValidAddress(address: string | null) {
	if (!address) return false;
	return /^[a-z0-9_-]{43}$/i.test(address);
}

export function formatAddress(address: string | null, wrap: boolean) {
	if (!address) return '';
	if (!checkValidAddress(address)) return address;
	const formattedAddress = address.substring(0, 5) + '...' + address.substring(36, address.length);
	return wrap ? `(${formattedAddress})` : formattedAddress;
}

export function getTagValue(list: { [key: string]: any }[], name: string): string {
	if (!list) return null;

	// Try exact match first
	for (let i = 0; i < list.length; i++) {
		if (list[i]) {
			if (list[i]!.name === name) {
				return list[i]!.value as string;
			}
		}
	}

	// Fallback to case-insensitive match
	const lowerName = name.toLowerCase();
	for (let i = 0; i < list.length; i++) {
		if (list[i]) {
			if (list[i]!.name.toLowerCase() === lowerName) {
				return list[i]!.value as string;
			}
		}
	}

	return null;
}

export function formatCount(count: string): string {
	if (count === '0' || !Number(count)) return '0';

	if (count.includes('.')) {
		let parts = count.split('.');
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

		// Find the position of the last non-zero digit within the first 6 decimal places
		let index = 0;
		for (let i = 0; i < Math.min(parts[1].length, 12); i++) {
			if (parts[1][i] !== '0') {
				index = i + 1;
			}
		}

		if (index === 0) {
			// If all decimals are zeros, keep two decimal places
			parts[1] = '00';
		} else {
			// Otherwise, truncate to the last non-zero digit
			parts[1] = parts[1].substring(0, index);

			// If the decimal part is longer than 4 digits, truncate to 4 digits
			if (parts[1].length > 4 && parts[1].substring(0, 4) !== '0000') {
				parts[1] = parts[1].substring(0, 4);
			}
		}

		return parts.join('.');
	} else {
		return count.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	}
}

export function formatDate(dateArg: string | number | null, dateType: 'dateString' | 'timestamp', fullTime?: boolean) {
	if (!dateArg) {
		return null;
	}

	let date: Date | null = null;

	switch (dateType) {
		case 'dateString':
			date = new Date(dateArg);
			break;
		case 'timestamp':
			date = new Date(Number(dateArg));
			break;
		default:
			date = new Date(dateArg);
			break;
	}

	return fullTime
		? `${date.toLocaleString('default', { month: 'long' })} ${date.getDate()}, ${date.getUTCFullYear()} ${
				date.getHours() % 12 || 12
		  }:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')} ${
				date.getHours() >= 12 ? 'PM' : 'AM'
		  }`
		: `${date.toLocaleString('default', { month: 'long' })} ${date.getDate()}, ${date.getUTCFullYear()}`;
}

export function formatMs(ms) {
	if (ms == null) return '';
	return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

export function getRelativeDate(timestamp: number) {
	if (!timestamp) return '-';
	const currentDate = new Date();
	const inputDate = new Date(timestamp);

	const timeDifference: number = currentDate.getTime() - inputDate.getTime();
	const secondsDifference = Math.floor(timeDifference / 1000);
	const minutesDifference = Math.floor(secondsDifference / 60);
	const hoursDifference = Math.floor(minutesDifference / 60);
	const daysDifference = Math.floor(hoursDifference / 24);
	const monthsDifference = Math.floor(daysDifference / 30.44); // Average days in a month
	const yearsDifference = Math.floor(monthsDifference / 12);

	if (yearsDifference > 0) {
		return `${yearsDifference} year${yearsDifference > 1 ? 's' : ''} ago`;
	} else if (monthsDifference > 0) {
		return `${monthsDifference} month${monthsDifference > 1 ? 's' : ''} ago`;
	} else if (daysDifference > 0) {
		return `${daysDifference} day${daysDifference > 1 ? 's' : ''} ago`;
	} else if (hoursDifference > 0) {
		return `${hoursDifference} hour${hoursDifference > 1 ? 's' : ''} ago`;
	} else if (minutesDifference > 0) {
		return `${minutesDifference} minute${minutesDifference > 1 ? 's' : ''} ago`;
	} else {
		return `${secondsDifference} second${secondsDifference !== 1 ? 's' : ''} ago`;
	}
}

export function formatPercentage(percentage: any) {
	let multiplied = percentage * 100;
	let decimalPart = multiplied.toString().split('.')[1];

	if (!decimalPart) {
		return `${multiplied.toFixed(0)}%`;
	}

	if (decimalPart.length > 6 && decimalPart.substring(0, 6) === '000000') {
		return `${multiplied.toFixed(0)}%`;
	}

	let nonZeroIndex = decimalPart.length;
	for (let i = 0; i < decimalPart.length; i++) {
		if (decimalPart[i] !== '0') {
			nonZeroIndex = i + 1;
			break;
		}
	}

	return `${multiplied.toFixed(nonZeroIndex)}%`;
}

export function formatRequiredField(field: string) {
	return `${field} *`;
}

export function splitTagValue(tag) {
	let parts = tag.split('-');

	let lastPart = parts[parts.length - 1];
	if (!isNaN(lastPart)) {
		parts = parts.slice(0, -1).join(' ') + ': ' + lastPart;
	} else {
		parts = parts.join(' ');
	}

	return parts;
}

export function getTagDisplay(value: string) {
	let result = value.replace(/([A-Z])/g, ' $1').trim();
	result = result.charAt(0).toUpperCase() + result.slice(1);
	return result;
}

export function getDataURLContentType(dataURL: string) {
	const result = dataURL.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
	return result ? result[1] : null;
}

export function getBase64Data(dataURL: string) {
	return dataURL.split(',')[1];
}

export function getByteSize(input: string | Buffer): number {
	let sizeInBytes: number;
	if (Buffer.isBuffer(input)) {
		sizeInBytes = input.length;
	} else if (typeof input === 'string') {
		sizeInBytes = Buffer.byteLength(input, 'utf-8');
	} else {
		throw new Error('Input must be a string or a Buffer');
	}

	return sizeInBytes;
}

export function getByteSizeDisplay(bytes: number): string {
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	if (bytes === 0) return '0 Bytes';

	const i = Math.floor(Math.log(bytes) / Math.log(1000));
	const value = bytes / Math.pow(1000, i);

	const unit = i === 0 ? (bytes === 1 ? 'Byte' : 'Bytes') : sizes[i];

	return `${value} ${unit}`;
}

export function isMac(): boolean {
	return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

export function validateUrl(url: string) {
	const urlPattern = new RegExp(
		'^(https?:\\/\\/)?' + // Optional protocol
			'((([a-zA-Z\\d]([a-zA-Z\\d-]*[a-zA-Z\\d])*)\\.)+[a-zA-Z]{2,}|' + // Domain name
			'localhost|' + // OR localhost
			'\\d{1,3}(\\.\\d{1,3}){3})' + // OR IPv4
			'(\\:\\d+)?(\\/[-a-zA-Z\\d%_.~+]*)*' + // Optional port and path
			'(\\?[;&a-zA-Z\\d%_.~+=-]*)?' + // Optional query
			'(\\#[-a-zA-Z\\d_]*)?$', // Optional fragment
		'i'
	);
	return urlPattern.test(url);
}

export function stripAnsiChars(input: string) {
	if (!input) return null;
	const ansiRegex = /\x1B\[[0-9;]*m/g;
	return input.toString().replace(ansiRegex, '');
}

export function removeCommitments(obj: any): any {
	if (Array.isArray(obj)) {
		return obj.map(removeCommitments);
	}
	if (obj && typeof obj === 'object') {
		return Object.entries(obj).reduce((acc: any, [key, value]) => {
			// Skip any key named "commitments" (case-insensitive)
			if (typeof key === 'string' && key.toLowerCase() === 'commitments') {
				return acc;
			}

			acc[key] = removeCommitments(value);

			return acc;
		}, {});
	}
	return obj;
}

export function resolveLibDeps(args: { variant: MessageVariantEnum; permawebProvider: any }) {
	switch (args.variant) {
		case MessageVariantEnum.Legacynet:
			return args.permawebProvider.deps;
		case MessageVariantEnum.Mainnet:
			return args.permawebProvider.depsMainnet;
		default:
			return args.permawebProvider.deps;
	}
}

export function resolveLibs(args: { variant: MessageVariantEnum; permawebProvider: any }) {
	switch (args.variant) {
		case MessageVariantEnum.Legacynet:
			return args.permawebProvider.libs;
		case MessageVariantEnum.Mainnet:
			return args.permawebProvider.libsMainnet;
		default:
			return args.permawebProvider.libs;
	}
}

export function lowercaseTagKeys(tags: { name: string; values: string[] }[]): { name: string; values: string[] }[] {
	return tags.map((tag) => ({
		...tag,
		name: tag.name.toLowerCase(),
	}));
}

const NOTICE_ACTIONS = ['Credit-Notice', 'Debit-Notice'];

function matchesIgnoreCase(value: string | null | undefined, expected: string | null | undefined) {
	if (!value || !expected) return false;
	return value.toLowerCase() === expected.toLowerCase();
}

function getNoticeBucket(action: string | null | undefined): 'credit' | 'debit' | null {
	if (matchesIgnoreCase(action, 'Credit-Notice')) return 'credit';
	if (matchesIgnoreCase(action, 'Debit-Notice')) return 'debit';
	return null;
}

function isStrictCuNoticeMessage(message: ResultMessageType, variant: MessageVariantEnum) {
	const tags = message.Tags ?? [];

	return (
		matchesIgnoreCase(getTagValue(tags, 'Data-Protocol'), 'ao') &&
		matchesIgnoreCase(getTagValue(tags, 'Variant'), variant) &&
		matchesIgnoreCase(getTagValue(tags, 'Type'), 'Message') &&
		getNoticeBucket(getTagValue(tags, 'Action')) !== null
	);
}

function getStrictNoticeAuthority(authority: string | undefined, variant: MessageVariantEnum) {
	if (checkValidAddress(authority)) return authority;

	switch (variant) {
		case MessageVariantEnum.Mainnet:
			return DEFAULT_AO_NODE.authority;
		case MessageVariantEnum.Legacynet:
		default:
			return DEFAULT_LEGACY_AUTHORITY;
	}
}

export function shouldHydrateAoTransferNotices(args: {
	action: string | null | undefined;
	variant: MessageVariantEnum | undefined;
	recipient: string | null | undefined;
}) {
	return (
		args.action === DEFAULT_ACTIONS.transfer.name &&
		args.variant === MessageVariantEnum.Legacynet &&
		args.recipient === PROCESSES.ao
	);
}

export function buildSyntheticResultMessageEdge(args: {
	message: ResultMessageType;
	fromProcess?: string | null;
	timestamp?: number;
	mapFromProcessCase: (messages: any[]) => Types.GQLNodeResponseType[];
}) {
	const tags = [...(args.message.Tags ?? [])];

	if (args.fromProcess && !getTagValue(tags, 'From-Process')) {
		tags.push({ name: 'From-Process', value: args.fromProcess });
	}

	return (
		args.mapFromProcessCase([
			{
				node: {
					id: null,
					recipient: args.message.Target,
					tags: tags,
					owner: {
						address: null,
					},
					block: {
						timestamp: args.timestamp,
					},
				},
			},
		])?.[0] ?? null
	);
}

async function queryResultMessageEdges(args: {
	tags: { name: string; values: string[] }[];
	authority?: string;
	variant: MessageVariantEnum;
	permawebProvider: any;
}) {
	return (
		(
			await args.permawebProvider.libs.getGQLData({
				tags: args.variant === MessageVariantEnum.Mainnet ? lowercaseTagKeys(args.tags) : args.tags,
				...(args.authority ? { owners: [args.authority] } : {}),
			})
		)?.data ?? []
	);
}

function hydrateResultMessageEdge(
	fallbackEdge: Types.GQLNodeResponseType | null,
	resolvedEdge: Types.GQLNodeResponseType | null
) {
	if (!fallbackEdge || !resolvedEdge) return fallbackEdge;

	return {
		...fallbackEdge,
		node: {
			...fallbackEdge.node,
			id: resolvedEdge.node?.id ?? fallbackEdge.node?.id,
			owner: resolvedEdge.node?.owner ?? fallbackEdge.node?.owner,
			block: resolvedEdge.node?.block ?? fallbackEdge.node?.block,
		},
	};
}

function dedupeResultMessageEdges(edges: Types.GQLNodeResponseType[]) {
	const seen = new Set<string>();
	const deduped = [];

	for (const edge of edges) {
		const key = edge?.node?.id;
		if (!key || seen.has(key)) continue;
		seen.add(key);
		deduped.push(edge);
	}

	return deduped;
}

function filterStrictSettledNoticeEdges(args: {
	edges: Types.GQLNodeResponseType[];
	fromProcess: string;
	authority: string;
	variant: MessageVariantEnum;
	requireVariant: boolean;
}) {
	return dedupeResultMessageEdges(
		args.edges.filter((edge) => {
			const edgeTags = edge.node?.tags ?? [];
			const action = getTagValue(edgeTags, 'Action');

			if (getNoticeBucket(action) === null) return false;
			if (!matchesIgnoreCase(edge.node?.owner?.address, args.authority)) return false;
			if (!matchesIgnoreCase(getTagValue(edgeTags, 'From-Process'), args.fromProcess)) return false;
			if (!matchesIgnoreCase(getTagValue(edgeTags, 'Data-Protocol'), 'ao')) return false;
			if (!matchesIgnoreCase(getTagValue(edgeTags, 'Type'), 'Message')) return false;
			if (args.requireVariant && !matchesIgnoreCase(getTagValue(edgeTags, 'Variant'), args.variant)) return false;

			return true;
		})
	);
}

function buildStrictNoticeQueryTags(args: {
	mode: 'correlation' | 'reference';
	values: string[];
	fromProcess: string;
	variant: MessageVariantEnum;
}) {
	const tags = [
		{ name: 'Action', values: NOTICE_ACTIONS },
		{
			name: args.mode === 'correlation' ? 'Pushed-For' : 'Reference',
			values: args.values,
		},
		{ name: 'From-Process', values: [args.fromProcess] },
		{ name: 'Data-Protocol', values: ['ao'] },
		{ name: 'Type', values: ['Message'] },
	];

	if (args.mode === 'reference') {
		tags.push({ name: 'Variant', values: [args.variant] });
	}

	return tags;
}

async function fetchStrictSettledNoticeEdges(args: {
	mode: 'correlation' | 'reference';
	values: string[];
	fromProcess: string;
	variant: MessageVariantEnum;
	authority?: string;
	permawebProvider: any;
}) {
	if (!args.values.length) return [];

	const strictAuthority = getStrictNoticeAuthority(args.authority, args.variant);
	const tags = buildStrictNoticeQueryTags({
		mode: args.mode,
		values: args.values,
		fromProcess: args.fromProcess,
		variant: args.variant,
	});
	const data = await queryResultMessageEdges({
		tags: tags,
		authority: strictAuthority,
		variant: args.variant,
		permawebProvider: args.permawebProvider,
	});

	return filterStrictSettledNoticeEdges({
		edges: data,
		fromProcess: args.fromProcess,
		authority: strictAuthority,
		variant: args.variant,
		requireVariant: args.mode === 'reference',
	});
}

function collectMissingNoticeReferences(args: {
	credit: ResultMessageType[];
	debit: ResultMessageType[];
	missingCredit: boolean;
	missingDebit: boolean;
}) {
	const references = [];
	const seen = new Set<string>();

	if (args.missingCredit) {
		for (const message of args.credit) {
			const reference = getTagValue(message.Tags ?? [], 'Reference');
			if (reference && !seen.has(reference)) {
				seen.add(reference);
				references.push(reference);
			}
		}
	}

	if (args.missingDebit) {
		for (const message of args.debit) {
			const reference = getTagValue(message.Tags ?? [], 'Reference');
			if (reference && !seen.has(reference)) {
				seen.add(reference);
				references.push(reference);
			}
		}
	}

	return references;
}

function collectStrictCuNoticeMessages(messages: ResultMessageType[], variant: MessageVariantEnum) {
	const result = {
		credit: [] as ResultMessageType[],
		debit: [] as ResultMessageType[],
	};
	const seenCredit = new Set<string>();
	const seenDebit = new Set<string>();

	for (const message of messages) {
		if (!isStrictCuNoticeMessage(message, variant)) continue;

		const action = getTagValue(message.Tags ?? [], 'Action');
		const referenceKey = getTagValue(message.Tags ?? [], 'Reference') ?? '';

		if (matchesIgnoreCase(action, 'Credit-Notice')) {
			if (seenCredit.has(referenceKey)) continue;
			seenCredit.add(referenceKey);
			result.credit.push(message);
		} else if (matchesIgnoreCase(action, 'Debit-Notice')) {
			if (seenDebit.has(referenceKey)) continue;
			seenDebit.add(referenceKey);
			result.debit.push(message);
		}
	}

	return result;
}

function findSettledNoticeMatch(args: {
	message: ResultMessageType;
	edges: Types.GQLNodeResponseType[];
	matchReference: boolean;
}) {
	const action = getTagValue(args.message.Tags ?? [], 'Action');
	const reference = getTagValue(args.message.Tags ?? [], 'Reference');
	const target = args.message.Target ?? getTagValue(args.message.Tags ?? [], 'Target');

	return (
		args.edges.find((edge) => {
			const edgeTags = edge.node?.tags ?? [];
			const edgeAction = getTagValue(edgeTags, 'Action');
			const edgeReference = getTagValue(edgeTags, 'Reference');
			const edgeRecipient =
				edge.node?.recipient ?? getTagValue(edgeTags, 'Recipient') ?? getTagValue(edgeTags, 'Target');

			if (!matchesIgnoreCase(edgeAction, action)) return false;
			if (args.matchReference && reference && edgeReference !== reference) return false;
			if (target && edgeRecipient && edgeRecipient !== target) return false;

			return true;
		}) ?? null
	);
}

export async function resolveResultMessages(args: {
	messages: ResultMessageType[];
	txId: string;
	fromProcess: string;
	timestamp?: number;
	variant: MessageVariantEnum;
	authority?: string;
	permawebProvider: any;
}) {
	const pendingNotices = collectStrictCuNoticeMessages(args.messages, args.variant);
	if (pendingNotices.credit.length === 0 && pendingNotices.debit.length === 0) {
		return args.messages
			.map((message) =>
				buildSyntheticResultMessageEdge({
					message: message,
					fromProcess: args.fromProcess,
					timestamp: args.timestamp,
					mapFromProcessCase: args.permawebProvider.libs.mapFromProcessCase,
				})
			)
			.filter((edge) => !!edge?.node?.recipient);
	}

	const settledByCorrelation = checkValidAddress(args.txId)
		? await fetchStrictSettledNoticeEdges({
				mode: 'correlation',
				values: [args.txId],
				fromProcess: args.fromProcess,
				variant: args.variant,
				authority: args.authority,
				permawebProvider: args.permawebProvider,
		  })
		: [];

	const missingCredit = settledByCorrelation.every(
		(edge) => !matchesIgnoreCase(getTagValue(edge.node?.tags ?? [], 'Action'), 'Credit-Notice')
	);
	const missingDebit = settledByCorrelation.every(
		(edge) => !matchesIgnoreCase(getTagValue(edge.node?.tags ?? [], 'Action'), 'Debit-Notice')
	);

	const requestedReferences = collectMissingNoticeReferences({
		credit: pendingNotices.credit,
		debit: pendingNotices.debit,
		missingCredit: missingCredit,
		missingDebit: missingDebit,
	});

	const settledByReference =
		requestedReferences.length > 0
			? await fetchStrictSettledNoticeEdges({
					mode: 'reference',
					values: requestedReferences,
					fromProcess: args.fromProcess,
					variant: args.variant,
					authority: args.authority,
					permawebProvider: args.permawebProvider,
			  })
			: [];

	return args.messages
		.map((message) => {
			const fallbackEdge = buildSyntheticResultMessageEdge({
				message: message,
				fromProcess: args.fromProcess,
				timestamp: args.timestamp,
				mapFromProcessCase: args.permawebProvider.libs.mapFromProcessCase,
			});
			const bucket = getNoticeBucket(getTagValue(message.Tags ?? [], 'Action'));

			if (!bucket) return fallbackEdge;

			const resolvedEdge =
				findSettledNoticeMatch({
					message: message,
					edges: settledByCorrelation,
					matchReference: false,
				}) ??
				findSettledNoticeMatch({
					message: message,
					edges: settledByReference,
					matchReference: true,
				});

			return hydrateResultMessageEdge(fallbackEdge, resolvedEdge);
		})
		.filter((edge) => !!edge?.node?.recipient);
}

async function resolveMessageBlock(edge: GQLNodeResponseType) {
	if (
		getTagValue(edge.node.tags, 'Variant') === MessageVariantEnum.Legacynet &&
		getTagValue(edge.node.tags, 'Type') === 'Message'
	) {
		try {
			const recipient = edge.node.recipient ?? getTagValue(edge.node.tags, 'Target');
			const response = await fetch(`${DEFAULT_LEGACY_SCHEDULER_URL}/${edge.node.id}?process-id=${recipient}`);
			const parsed = await response.json();

			return {
				height: getTagValue(parsed.assignment.tags, 'Block-Height')?.replace(/^0+/, ''),
				timestamp: parseInt(getTagValue(parsed.assignment.tags, 'Timestamp')) / 1000,
			};
		} catch (e) {
			console.error(e);
			return edge.node.block;
		}
	}

	return edge.node.block;
}

export async function normalizeGqlResponse(response: DefaultGQLResponseType) {
	if (response?.data) {
		(response as any).data = await Promise.all(
			response.data.map(async (edge: GQLNodeResponseType) => {
				if (edge?.node?.tags) {
					const recipient = edge.node.recipient ?? getTagValue(edge.node.tags, 'Target');
					const block = await resolveMessageBlock(edge);

					return {
						...edge,
						node: {
							...edge.node,
							recipient: recipient,
							tags: normalizeTagKeys(edge.node.tags),
							block: block,
						},
					};
				}
				return edge;
			})
		);
	}
	return response;
}

export function normalizeTagKeys(tags: TagType[]): TagType[] {
	return tags.map((tag) => ({
		...tag,
		name: tag.name
			.split('-')
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
			.join('-'),
	}));
}

export async function resolveMessageId(args: {
	messageId: string;
	variant: MessageVariantEnum;
	schedulerUrl?: string;
	target: string;
	permawebProvider: any;
}) {
	let idToUse = args.messageId;

	switch (args.variant) {
		case MessageVariantEnum.Legacynet:
			break;
		case MessageVariantEnum.Mainnet:
			const schedulerUrl = args.schedulerUrl ?? DEFAULT_SCHEDULER_URL;

			try {
				const gqlResponse = await args.permawebProvider.libs.getGQLData({
					tags: [{ name: 'body+link', values: [args.messageId] }],
				});

				const node = gqlResponse?.data?.[0].node;
				const slot = getTagValue(node.tags, 'slot');

				if (slot) {
					idToUse = slot;
				} else {
					const schedulerResponse = await fetch(
						`${schedulerUrl}/~scheduler@1.0/schedule?target=${args.target}&accept=application/aos-2`
					);
					const parsedSchedulerResponse = args.permawebProvider.libs.mapFromProcessCase(await schedulerResponse.json());
					const currentElement = parsedSchedulerResponse?.edges?.find(
						(element) => element.node?.message?.id === args.messageId
					);

					idToUse = currentElement.cursor;
				}
			} catch (e: any) {
				console.error(e);
			}

			break;
	}

	return idToUse;
}

export const capitalize = (str: string) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '-');

const COLORS: Record<string, string> = {
	info: 'color: #8F8F8F',
	warn: 'color: #EECA00',
	error: 'color: #EE4463',
	success: 'color: #64B686',
};

const METHOD: Record<string, (...args: any[]) => void> = {
	info: console.log,
	warn: console.warn,
	error: console.error,
	success: console.log,
};

export function debugLog(level: string, context: string, ...args: any[]) {
	const style = COLORS[level] || 'color: #8F8F8F';
	const method = METHOD[level] || console.log;

	method(`%c[Lunar: ${capitalize(level)}]%c %c(${context})%c -`, style, '', 'font-weight: medium;', '', ...args);
}

export function stripUrlProtocol(url: string) {
	return url.replace(/^https?:\/\//, '');
}

export function isNumeric(value: unknown): boolean {
	return typeof value === 'number'
		? Number.isFinite(value)
		: typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value));
}

export async function withRetries<T>(
	fn: () => Promise<T>,
	maxRetries: number = 10,
	baseDelay: number = 1000
): Promise<T> {
	let lastResult: any;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const result = await fn();

			// Check if result indicates compute is still in progress
			const isInProgress =
				(result as any)?.message?.includes('Compute in progress') ||
				(result as any)?.message?.includes('slot(s) remaining');

			if (isInProgress) {
				lastResult = result;

				if (attempt < maxRetries - 1) {
					const delay = baseDelay * Math.pow(2, attempt);
					await new Promise((resolve) => setTimeout(resolve, delay));
					continue;
				}
			}

			return result;
		} catch (error: any) {
			lastResult = error;
			console.log(`Retry attempt ${attempt + 1}/${maxRetries}, error:`, error);

			if (attempt < maxRetries - 1) {
				const delay = baseDelay * Math.pow(2, attempt);
				console.log(`Waiting ${delay}ms before retry...`);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	console.log('All retries exhausted');
	throw lastResult;
}

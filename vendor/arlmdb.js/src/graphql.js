/**
 * The Arweave GraphQL subset the index serves: parse with the graphql
 * language module, plan a query into predicates and a walk, and execute the
 * plan as a leapfrog followed by header reads.
 *
 * Values within one filter are ORed into one sorted union operand; separate
 * filters are ANDed by the leapfrog. A `*` value is the union of every value
 * subtree for that tag name. `ids` cannot be served (item ids are not
 * indexed), and neither can fragments, aliases on the root, other root
 * fields, or fields the header does not carry.
 *
 * The response is shaped as arweave.net shapes it: `data.transactions` with
 * only the selected fields, cursors of `offset=<n>`, and `hasNextPage` from
 * the extra offset a page walks.
 */
import { Kind } from 'graphql/language/kinds.mjs';
import { parse } from 'graphql/language/parser.mjs';
import { blockWindow } from './blocks.js';
import { headerPool } from './items.js';
import { count, isUnion, isWildcard, locate, unionOf, wildcardOf } from './match.js';
import { lowerName, MAX_OFFSET } from './predicate.js';

export const DEFAULT_FIRST = 20;
export const MAX_FIRST = 50;
export const DEFAULT_COUNT_LIMIT = 1000;

export class PlanError extends Error {
	constructor(message) {
		super(message);
		this.name = 'PlanError';
		this.code = 'unservable';
	}
}

const refuse = (message) => { throw new PlanError(message); };

/** The fields a node can carry, with their sub-selections. */
const NODE_FIELDS = {
	id: null,
	anchor: null,
	signature: null,
	recipient: null,
	owner: { address: null, key: null },
	tags: { name: null, value: null },
	data: { size: null, type: null },
	block: { id: null, height: null, timestamp: null, previous: null },
	bundledIn: { id: null },
};
const CONNECTION_FIELDS = {
	count: null,
	pageInfo: { hasNextPage: null },
	edges: { cursor: null, node: NODE_FIELDS },
};
const ARGS = ['first', 'after', 'sort', 'tags', 'owners', 'recipients', 'bundledIn', 'block', 'ids'];

/** A literal or variable value node as a JS value. */
function valueOf(node, variables) {
	switch (node.kind) {
		case Kind.VARIABLE: return variables[node.name.value] ?? null;
		case Kind.INT: return parseInt(node.value, 10);
		case Kind.FLOAT: return parseFloat(node.value);
		case Kind.STRING:
		case Kind.ENUM: return node.value;
		case Kind.BOOLEAN: return node.value;
		case Kind.NULL: return null;
		case Kind.LIST: return node.values.map((v) => valueOf(v, variables));
		case Kind.OBJECT: return Object.fromEntries(node.fields.map((f) => [f.name.value, valueOf(f.value, variables)]));
		default: return refuse(`unsupported value kind ${node.kind}`);
	}
}

/** The selected fields under `allowed`, each as `{ name, alias, sub }`. */
function selectionOf(selectionSet, allowed, path) {
	if (!selectionSet) refuse(`${path} needs a selection`);
	return selectionSet.selections.map((s) => {
		if (s.kind !== Kind.FIELD) refuse(`fragments are not served (at ${path})`);
		const name = s.name.value;
		if (!(name in allowed)) refuse(`unknown field ${path}.${name}`);
		const sub = allowed[name] === null
			? (s.selectionSet ? refuse(`${path}.${name} has no sub-fields`) : null)
			: selectionOf(s.selectionSet, allowed[name], `${path}.${name}`);
		return { name, alias: s.alias?.value ?? name, sub };
	});
}

/** Distinct string values from a filter that may be a list or a scalar. */
function valuesOf(what, given) {
	const values = Array.isArray(given) ? given : [given];
	if (values.length === 0) refuse(`${what} is empty`);
	if (values.some((value) => typeof value !== 'string')) refuse(`${what} values must be strings`);
	return [...new Set(values)];
}

const operand = (name, values) => unionOf(values.map((value) => ({ name, value })));

/** Plan a query document (or its text) against the index's predicate families. */
export function plan(document, variables = {}) {
	if (typeof document === 'string') document = parse(document);
	const operations = document.definitions.filter((d) => d.kind === Kind.OPERATION_DEFINITION);
	if (document.definitions.length !== operations.length) refuse('fragments are not served');
	if (operations.length !== 1) refuse('exactly one operation is served');
	const [operation] = operations;
	if (operation.operation !== 'query') refuse(`${operation.operation} is not served`);
	const roots = operation.selectionSet.selections;
	if (roots.length !== 1 || roots[0].kind !== Kind.FIELD) refuse('exactly one root field is served');
	const root = roots[0];
	if (root.name.value !== 'transactions') refuse(`${root.name.value} is not served; only transactions is`);
	if (root.alias) refuse('aliases on transactions are not served');

	const args = {};
	for (const arg of root.arguments ?? []) {
		const name = arg.name.value;
		if (!ARGS.includes(name)) refuse(`unknown argument ${name}`);
		args[name] = valueOf(arg.value, variables);
	}
	if (args.ids != null && (!Array.isArray(args.ids) || args.ids.length)) refuse('ids are not predicates; the index has no id family');

	const predicates = [];
	const wildcardNames = [];
	const exactTagNames = new Set();
	for (const tag of args.tags ?? []) {
		if (typeof tag?.name !== 'string') refuse('a tag filter needs a name');
		if (tag.op && tag.op !== 'EQ') refuse(`tag ${tag.name} with op ${tag.op} is not served`);
		const values = valuesOf(`tag ${tag.name}`, tag.values ?? []);
		if (values.includes('*')) wildcardNames.push(tag.name);
		else {
			predicates.push(operand(tag.name, values));
			exactTagNames.add(lowerName(tag.name));
		}
	}
	const wildcards = [...new Map(wildcardNames
		.filter((name) => !exactTagNames.has(lowerName(name)))
		.map((name) => [lowerName(name), name])).values()];
	predicates.push(...wildcards.map(wildcardOf));
	if (args.owners != null) predicates.push(operand('committer', valuesOf('owners', args.owners)));
	if (args.recipients != null) predicates.push(operand('field-target', valuesOf('recipients', args.recipients)));
	if (args.bundledIn != null) predicates.push(operand('parent', valuesOf('bundledIn', args.bundledIn)));
	if (predicates.length === 0) refuse('no predicate: a tag, owner, recipient or bundledIn is needed');

	const sort = args.sort ?? 'HEIGHT_DESC';
	if (sort !== 'HEIGHT_DESC' && sort !== 'HEIGHT_ASC') refuse(`sort ${sort} is not served`);
	let first = args.first ?? DEFAULT_FIRST;
	if (!Number.isInteger(first) || first < 1) refuse('first must be a positive integer');
	first = Math.min(first, MAX_FIRST);
	let after = null;
	if (args.after != null && args.after !== '') {
		const m = /^offset=(\d+)$/.exec(String(args.after));
		if (!m) refuse(`cursor ${args.after} is not offset=<n>`);
		after = BigInt(m[1]);
	}
	let block = null;
	if (args.block != null) {
		const { min, max } = args.block;
		if ((min != null && !Number.isInteger(min)) || (max != null && !Number.isInteger(max))) refuse('block bounds must be integers');
		if (min != null || max != null) block = { min: min ?? null, max: max ?? null };
	}
	return {
		predicates,
		direction: sort === 'HEIGHT_ASC' ? 'asc' : 'desc',
		sort,
		block,
		window: { start: 0n, end: null },
		first,
		after,
		fields: selectionOf(root.selectionSet, CONNECTION_FIELDS, 'transactions'),
	};
}

/** Whether a query's text can be served, and why not. */
export function servable(text) {
	try {
		return { ok: true, plan: plan(text) };
	} catch (error) {
		return { ok: false, reason: error.message };
	}
}

/** Resolve a plan's block bounds into its offset window. */
export async function resolveWindow(plan, gateway, options = {}) {
	if (plan.block) plan.window = await blockWindow(gateway, plan.block, options);
	return plan.window;
}

/**
 * The first cursor of a plan's walk and its exclusive bound. A cursor
 * outside the window starts the walk at the window's near edge.
 */
export function bounds(plan) {
	const { start, end } = plan.window;
	const top = end !== null ? end - 1n : MAX_OFFSET;
	if (plan.direction === 'asc') {
		const from = plan.after !== null && plan.after + 1n > start ? plan.after + 1n : start;
		return { from, to: end };
	}
	const from = plan.after !== null && plan.after - 1n < top ? plan.after - 1n : top;
	return { from, to: start > 0n ? start - 1n : null };
}

/** The selected fields of `source`, aliased, absent ones null. */
function project(fields, source) {
	const out = {};
	for (const { name, alias, sub } of fields) {
		const value = source?.[name];
		if (sub === null) out[alias] = value ?? null;
		else if (value == null) out[alias] = null;
		else if (Array.isArray(value)) out[alias] = value.map((v) => project(sub, v));
		else out[alias] = project(sub, value);
	}
	return out;
}

function nodeOf(header) {
	return {
		id: header.id,
		anchor: header.anchor,
		signature: header.signature,
		recipient: header.recipient,
		owner: header.owner,
		tags: header.tags,
		/* The header names the content type. The size is in the enclosing
		   bundle's index and is read only when selected; unread, it is null. */
		data: { size: header.size === null || header.size === undefined ? null : String(header.size), type: header.contentType },
		block: null,
		bundledIn: null,
	};
}

const errorsOf = (error) => [{ message: error.message, extensions: { code: error.code ?? 'error' } }];

/**
 * Run a query: parse, plan, walk the offsets, then read the headers. The
 * returned `offsets` and `result` settle separately so a UI can draw the
 * page's outline before its nodes arrive.
 */
export function execute(index, text, { variables = {}, onEvent, countLimit = DEFAULT_COUNT_LIMIT, concurrency = 4 } = {}) {
	const started = performance.now();
	const timing = { parse: 0, plan: 0, locate: 0, headers: 0, total: 0 };
	const off = onEvent ? index.emitter.on('*', onEvent) : () => {};
	const emit = (type, fields) => index.emitter.emit(type, fields);
	const signal = { aborted: false };
	let queryPlan = null;
	let failure = null;
	try {
		const document = parse(text);
		timing.parse = performance.now() - started;
		emit('query:parsed', { ms: timing.parse, document });
		const planned = performance.now();
		queryPlan = plan(document, variables);
		timing.plan = performance.now() - planned;
	} catch (error) {
		failure = error;
	}

	/*
	 * Header reads begin as the leapfrog finds each offset, so the two slow
	 * phases overlap. The walk fetches one offset more than the page to
	 * learn `hasNextPage`; only offsets inside the page are read.
	 */
	const nodeFields = queryPlan?.fields.find((f) => f.name === 'edges')?.sub.find((f) => f.name === 'node')?.sub;
	const wantsNodes = nodeFields !== undefined;
	/* The offsets walk exists to fill the page and its `hasNextPage`; a
	   query that selects only `count` reads neither, and count runs its own
	   walk, so the page walk would download index chunks nothing reads. */
	const wantsPage = queryPlan?.fields.some((f) => f.name === 'edges' || f.name === 'pageInfo') ?? false;
	/* hasNextPage is the one thing the page walk reads a match past the page
	   for; without pageInfo selected that extra match, and the leaf chunk it
	   may cross into, are not needed. */
	const wantsNext = queryPlan?.fields.some((f) => f.name === 'pageInfo') ?? false;
	/* The size costs a read of the bundle's index, so it is fetched only
	   when the query selected it. */
	const wantsSize = nodeFields?.some((f) => f.name === 'data' && f.sub?.some((g) => g.name === 'size')) ?? false;
	const headerConcurrency = queryPlan ? Math.max(concurrency, queryPlan.first) : concurrency;
	const pool = queryPlan
		? headerPool(index, { concurrency: headerConcurrency, signal, size: wantsSize })
		: null;
	let reading = 0;
	/* The count walk is independent of the page walk — it scans ascending to a
	   limit where the page walk descends a page — so it runs alongside rather
	   than after it, once the window both share is resolved. Read-ahead is the
	   one thing the two walks would contend over: it reads a direction the walk
	   stores on the shared source, so the overlap is taken only when read-ahead
	   is off; with it on, count runs after the page and each walk owns the
	   direction. */
	const overlapCount = (index.source?.readAhead ?? 0) === 0;
	let counting = null;
	const offsets = (async () => {
		if (failure) throw failure;
		const planned = performance.now();
		await resolveWindow(queryPlan, index.gateway, { fetcher: index.fetcher, fleet: index.chunkSources });
		timing.plan += performance.now() - planned;
		emit('query:planned', { plan: queryPlan, ms: timing.plan });
		if (overlapCount && queryPlan.fields.some((f) => f.name === 'count')) {
			counting = countOf(index, queryPlan, countLimit, signal);
			counting.catch(() => {});
		}
		if (!wantsPage) return { offsets: [], hasNextPage: false, ms: 0 };
		const { from, to } = bounds(queryPlan);
		let found = 0;
		const onMatch = (offset) => {
			if (found >= queryPlan.first || !wantsNodes) { found += 1; return; }
			if (!reading) reading = performance.now();
			pool.add(offset, found, `offset=${offset}`);
			found += 1;
		};
		const walk = await locate(index, queryPlan.predicates, {
			direction: queryPlan.direction,
			from,
			to,
			limit: queryPlan.first + (wantsNext ? 1 : 0),
			signal,
			onMatch,
		});
		timing.locate = walk.ms;
		const page = walk.offsets.slice(0, queryPlan.first);
		return { offsets: page, hasNextPage: wantsNext && walk.offsets.length > queryPlan.first, ms: walk.ms };
	})();
	offsets.catch(() => {});

	const result = (async () => {
		try {
			const page = await offsets;
			const fields = queryPlan.fields;
			const source = { pageInfo: { hasNextPage: page.hasNextPage }, edges: [] };
			const errors = [];
			if (fields.some((f) => f.name === 'count')) source.count = await (counting ?? countOf(index, queryPlan, countLimit, signal));
			const edges = fields.find((f) => f.name === 'edges');
			if (edges) {
				const cursors = page.offsets.map((o) => `offset=${o}`);
				const headers = wantsNodes ? await pool.finish() : page.offsets.map(() => null);
				timing.headers = reading ? performance.now() - reading : 0;
				headers.forEach((header, i) => {
					if (header?.error) {
						errors.push({ message: header.error.message, path: ['transactions', 'edges', i, 'node'] });
						source.edges.push({ cursor: cursors[i], node: null });
					} else {
						source.edges.push({ cursor: cursors[i], node: header && nodeOf(header) });
					}
				});
			} else if (pool) {
				await pool.finish();
			}
			timing.total = performance.now() - started;
			emit('query:done', { timing });
			const out = { data: { transactions: project(fields, source) }, timing };
			if (errors.length) out.errors = errors;
			return out;
		} catch (error) {
			timing.total = performance.now() - started;
			emit('query:done', { timing, error });
			return { data: null, errors: errorsOf(error), timing };
		} finally {
			off();
		}
	})();

	return { plan: queryPlan, offsets, result, cancel: () => { signal.aborted = true; } };
}

/**
 * The count a plan reports: exact from LMDB for one unwindowed predicate,
 * otherwise a walk over the window up to `countLimit`, a lower bound.
 */
async function countOf(index, queryPlan, countLimit, signal) {
	const unwindowed = queryPlan.window.start === 0n && queryPlan.window.end === null;
	if (queryPlan.predicates.length === 1 && !isUnion(queryPlan.predicates[0]) &&
		!isWildcard(queryPlan.predicates[0]) && unwindowed) {
		return count(index, queryPlan.predicates[0]);
	}
	const started = performance.now();
	const { offsets } = await locate(index, queryPlan.predicates, {
		direction: 'asc',
		from: queryPlan.window.start,
		to: queryPlan.window.end,
		limit: countLimit,
		signal,
	});
	index.emitter.emit('count:done', { count: offsets.length, exact: offsets.length < countLimit, ms: performance.now() - started });
	return offsets.length;
}

/**
 * The GraphQL text the builder emits for a set of filters, which `plan`
 * accepts back: `first` and `sort` are always written, empty filters are
 * left out, and the node selection is the one the builder shows.
 */
export function buildQuery({ tags = [], owners = [], recipients = [], bundledIn = [], block, first = DEFAULT_FIRST, after, sort = 'HEIGHT_DESC', count = false } = {}) {
	const q = (v) => JSON.stringify(v);
	const list = (vs) => (Array.isArray(vs) ? vs : [vs]).filter((v) => v != null && v !== '');
	const lines = [`first: ${first}`, `sort: ${sort}`];
	if (after) lines.push(`after: ${q(after)}`);
	if (list(owners).length) lines.push(`owners: [${list(owners).map(q).join(', ')}]`);
	if (list(recipients).length) lines.push(`recipients: [${list(recipients).map(q).join(', ')}]`);
	if (list(bundledIn).length) lines.push(`bundledIn: [${list(bundledIn).map(q).join(', ')}]`);
	if (block && (block.min != null || block.max != null)) {
		const parts = [];
		if (block.min != null) parts.push(`min: ${block.min}`);
		if (block.max != null) parts.push(`max: ${block.max}`);
		lines.push(`block: { ${parts.join(', ')} }`);
	}
	if (tags.length) {
		const items = tags.map((t) => `{ name: ${q(t.name)}, values: [${list(t.values ?? t.value).map(q).join(', ')}] }`);
		lines.push(`tags: [\n\t\t\t${items.join(',\n\t\t\t')}\n\t\t]`);
	}
	return [
		'query {',
		'\ttransactions(',
		`\t\t${lines.join('\n\t\t')}`,
		'\t) {',
		...(count ? ['\t\tcount'] : []),
		'\t\tpageInfo { hasNextPage }',
		'\t\tedges {',
		'\t\t\tcursor',
		'\t\t\tnode {',
		'\t\t\t\tid',
		'\t\t\t\towner { address }',
		'\t\t\t\ttags { name value }',
		'\t\t\t}',
		'\t\t}',
		'\t}',
		'}',
		'',
	].join('\n');
}

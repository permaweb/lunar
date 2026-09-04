/**
 * The leapfrog over predicates: `nearest` asks one predicate for its row
 * nearest a cursor, `locate` intersects several by restarting at every
 * disagreement, and `count` sums the duplicate counts LMDB records.
 *
 * A predicate's rows sit under two physical keys, the 79-bit prefix followed
 * by the offset's top bit, and each key's duplicates are the offsets' low
 * 48 bits in order. Seek the exact key and duplicate together, then retain
 * the current duplicate leaf. Nearby probes binary-search that leaf without
 * calling LMDB; sequential exhaustion steps to its neighbour. Larger jumps
 * seek directly. Crossing 2^48 switches to the predicate's other key.
 */
import { CursorOp, LmdbEnv, LmdbError } from 'lmdb-wasm';
import { MAX_OFFSET, decodeKey, decodeRow, nameRange, prefixOf, seekOf } from './predicate.js';
import { equal } from './weave.js';

/** A predicate with its 79-bit prefix and two keys, from `{ name, value }`. */
export function predicateOf(p) {
	if (p.prefix !== undefined && p.key0 !== undefined) return p;
	const { bits79, key0, key1 } = prefixOf(p.name, p.value);
	return { name: p.name, value: p.value, prefix: bits79, key0, key1 };
}

/** One logical OR operand, reduced to distinct physical predicate prefixes. */
export function unionOf(predicates) {
	const requested = predicates.map(predicateOf);
	if (requested.length === 0) throw new Error('empty-predicate-union');
	const seen = new Set();
	const any = requested.filter((p) => {
		const key = p.prefix.toString();
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
	if (any.length === 1) return any[0];
	return {
		name: any.every((p) => p.name === any[0].name) ? any[0].name : null,
		values: requested.map((p) => p.value),
		any,
	};
}

export const isUnion = (predicate) => Array.isArray(predicate?.any);

/** Every indexed value for a tag name, as one offset-ordered operand. */
export function wildcardOf(name) {
	return { name, value: '*', wildcard: true, ...nameRange(name) };
}

export const isWildcard = (predicate) => predicate?.wildcard === true;

/**
 * An open cursor over one predicate, for the length of a walk.
 *
 * Each probe gets an environment of its own: calls into one environment
 * are serialised, but separate environments are separate WebAssembly
 * instances and descend concurrently, sharing the chunk source — so the
 * predicates of a query walk the tree at the same time rather than in turn.
 * An index without a byte source (a fixture over a buffer) shares its one
 * environment.
 */
export async function openProbe(index, predicate) {
	const p = predicateOf(predicate);
	await index.ready?.();
	let traversal = null;
	let traversalNo = 0;
	const context = {
		predicate: { name: p.name, value: p.value },
		get traversal() { return traversal; },
	};
	const own = index.source ? await LmdbEnv.open(index.source.byteSource(context)) : null;
	const db = (own ?? index.env).mainDb;
	const handle = {
		predicate: p,
		cursor: await db.cursor(),
		db,
		key: null,
		run: [],
		direction: null,
		last: null,
		bound: null,
		beginTraversal(method) {
			traversal = { id: ++traversalNo, method };
			return traversal;
		},
		endTraversal() { traversal = null; },
		close: async () => { await handle.cursor.close(); own?.close(); },
	};
	return handle;
}

const HALF = 1n << 48n;

/** Copy only the current duplicate leaf, which is already resident in LMDB. */
async function readRun(handle, row) {
	const values = await handle.cursor.value(CursorOp.GET_MULTIPLE);
	const bytes = values?.length ? values : row.value;
	if (bytes.length % 6) throw new Error('invalid-offset-run');
	handle.run = [];
	for (let i = 0; i < bytes.length; i += 6) {
		handle.run.push(decodeRow(handle.key, bytes.subarray(i, i + 6)));
	}
}

/** Seek an exact physical key without SET_RANGE's first-duplicate detour. */
async function seek(handle, at, direction) {
	const { key, dup } = seekOf(handle.predicate.prefix, at);
	if (handle.key && !equal(handle.key, key)) {
		await handle.cursor.close();
		handle.cursor = await handle.db.cursor();
	}
	handle.key = key;
	let row = await handle.cursor.op(CursorOp.GET_BOTH_RANGE, key, dup);
	if (direction === 'desc') {
		if (row && !equal(row.value, dup)) row = await handle.cursor.op(CursorOp.PREV_DUP);
		else if (!row) {
			try {
				row = await handle.cursor.op(CursorOp.LAST_DUP);
				// Confirm the exact key and clear LAST_DUP's EOF flag before
				// GET_MULTIPLE. A failed seek may be positioned on a neighbour.
				if (row) row = await handle.cursor.op(CursorOp.GET_BOTH_RANGE, key, row.value);
			} catch (error) {
				// A missing key leaves this key's fresh cursor uninitialized.
				// Emscripten's EINVAL is 28, not the host's errno value.
				if (!(error instanceof LmdbError) || error.code !== 28) throw error;
			}
		}
	}
	if (!row) return false;
	await readRun(handle, row);
	handle.bound = at;
	return true;
}

async function otherHalf(handle, direction) {
	if (direction === 'asc' && equal(handle.key, handle.predicate.key0)) return seek(handle, HALF, direction);
	if (direction === 'desc' && equal(handle.key, handle.predicate.key1)) return seek(handle, HALF - 1n, direction);
	return false;
}

/** Binary search the held leaf. It performs no LMDB call or byte read. */
function inRun(run, at, direction) {
	let lo = 0;
	let hi = run.length;
	while (lo < hi) {
		const mid = (lo + hi) >>> 1;
		if (run[mid] < at || (direction === 'desc' && run[mid] === at)) lo = mid + 1;
		else hi = mid;
	}
	return run[direction === 'desc' ? lo - 1 : lo] ?? null;
}

/** One probe of an open predicate: its row nearest `at`, or null. */
export async function probe(handle, at, direction, emitter) {
	const started = performance.now();
	const run = handle.run;
	const held = handle.direction === direction && run.length && (
		(at >= run[0] && at <= run.at(-1)) ||
		(direction === 'desc' ? at >= run.at(-1) && at <= handle.bound : at <= run[0] && at >= handle.bound)
	);
	let method = 'buffer';
	let traversal = null;
	if (!held) {
		method = 'seek';
		if (run.length && handle.direction === direction && at === handle.last + (direction === 'desc' ? -1n : 1n)) method = 'step';
		traversal = handle.beginTraversal(method);
		try {
			let found;
			if (method === 'step') {
				const values = await handle.cursor.value(direction === 'desc' ? CursorOp.PREV_MULTIPLE : CursorOp.NEXT_MULTIPLE);
				found = Boolean(values?.length);
				if (found) {
					handle.run = [];
					for (let i = 0; i < values.length; i += 6) handle.run.push(decodeRow(handle.key, values.subarray(i, i + 6)));
					handle.bound = at;
				}
			} else found = await seek(handle, at, direction);
			if (!found) found = await otherHalf(handle, direction);
			if (!found) handle.run = [];
		} finally {
			handle.endTraversal();
		}
	}
	handle.direction = direction;
	const answer = inRun(handle.run, at, direction);
	handle.last = answer;
	emitter?.emit('locate:probe', {
		predicate: { name: handle.predicate.name, value: handle.predicate.value },
		cursor: at,
		direction,
		method,
		traversal,
		answer,
		ms: performance.now() - started,
	});
	return answer;
}

/** The predicate's offset nearest `cursor`: at or after it ascending, at or before it descending. */
export async function nearest(index, predicate, cursor, direction = 'asc') {
	const handle = await openProbe(index, predicate);
	try {
		return await probe(handle, cursor, direction, index.emitter);
	} finally {
		await handle.close();
	}
}

/**
 * An OR operand is a monotonic merge of its alternative predicate cursors.
 * An alternative's last answer remains valid until the outer cursor passes
 * it, so only alternatives left behind by a leapfrog jump are probed again.
 */
async function openUnion(index, predicate) {
	const handles = await Promise.all(predicate.any.map((p) => openProbe(index, p)));
	return {
		predicate,
		handles,
		answers: new Array(handles.length),
		known: new Array(handles.length).fill(false),
		direction: null,
		at: null,
		close: async () => {
			for (const handle of handles) await handle.close();
		},
	};
}

const reusable = (answer, at, direction) => answer === null ||
	(direction === 'desc' ? answer <= at : answer >= at);

/** The union member nearest `at`, with duplicate offsets emitted only once. */
async function probeUnion(handle, at, direction, emitter) {
	const monotonic = handle.direction === direction && (handle.at === null ||
		(direction === 'desc' ? at <= handle.at : at >= handle.at));
	if (!monotonic) handle.known.fill(false);
	await Promise.all(handle.handles.map(async (member, i) => {
		if (handle.known[i] && reusable(handle.answers[i], at, direction)) return;
		handle.answers[i] = await probe(member, at, direction, emitter);
		handle.known[i] = true;
	}));
	handle.direction = direction;
	handle.at = at;
	let answer = null;
	for (const candidate of handle.answers) {
		if (candidate === null || candidate === undefined) continue;
		if (answer === null || (direction === 'desc' ? candidate > answer : candidate < answer)) answer = candidate;
	}
	return answer;
}

class OffsetHeap {
	constructor(direction) {
		this.direction = direction;
		this.items = [];
	}

	better(a, b) {
		if (a.answer === b.answer) return a.id < b.id;
		return this.direction === 'desc' ? a.answer > b.answer : a.answer < b.answer;
	}

	push(item) {
		let i = this.items.push(item) - 1;
		while (i > 0) {
			const parent = (i - 1) >> 1;
			if (!this.better(item, this.items[parent])) break;
			this.items[i] = this.items[parent];
			i = parent;
		}
		this.items[i] = item;
	}

	pop() {
		const first = this.items[0];
		const last = this.items.pop();
		if (this.items.length) {
			let i = 0;
			while (true) {
				let child = i * 2 + 1;
				if (child >= this.items.length) break;
				if (child + 1 < this.items.length && this.better(this.items[child + 1], this.items[child])) child += 1;
				if (!this.better(this.items[child], last)) break;
				this.items[i] = this.items[child];
				i = child;
			}
			this.items[i] = last;
		}
		return first;
	}

	peek() { return this.items[0] ?? null; }
}

/** One environment and two cursors serve an arbitrary number of values. */
async function openWildcard(index, predicate) {
	await index.ready?.();
	let traversal = null;
	let traversalNo = 0;
	const context = {
		predicate: { name: predicate.name, value: '*' },
		get traversal() { return traversal; },
	};
	const own = index.source ? await LmdbEnv.open(index.source.byteSource(context)) : null;
	const db = (own ?? index.env).mainDb;
	const handle = {
		predicate,
		db,
		enumerator: await db.cursor(),
		seeker: await db.cursor(),
		heap: null,
		direction: null,
		at: null,
		beginTraversal(method, parent = null) {
			traversal = { id: ++traversalNo, method };
			if (parent !== null) traversal.parent = parent;
			return traversal;
		},
		endTraversal() { traversal = null; },
		close: async () => {
			await handle.enumerator.close();
			await handle.seeker.close();
			own?.close();
		},
	};
	return handle;
}

async function wildcardTraversal(handle, method, operation, parent = null) {
	const traversal = handle.beginTraversal(method, parent);
	try { return { value: await operation(traversal), traversal }; }
	finally { handle.endTraversal(); }
}

function memberOf(prefix, id, parent) {
	return {
		id,
		prefix,
		parent,
		key0: seekOf(prefix, 0n).key,
		key1: seekOf(prefix, HALF).key,
		key: null,
		run: [],
		direction: null,
		bound: null,
		answer: null,
	};
}

async function readMemberRun(handle, member, row) {
	const values = await handle.seeker.value(CursorOp.GET_MULTIPLE);
	const bytes = values?.length ? values : row.value;
	if (bytes.length % 6) throw new Error('invalid-offset-run');
	member.key = row.key;
	member.run = [];
	for (let i = 0; i < bytes.length; i += 6) {
		member.run.push(decodeRow(row.key, bytes.subarray(i, i + 6)));
	}
}

async function seekMemberKey(handle, member, key, dup, at, direction) {
	let row = await handle.seeker.op(CursorOp.GET_BOTH_RANGE, key, dup);
	if (direction === 'desc') {
		if (row && !equal(row.value, dup)) row = await handle.seeker.op(CursorOp.PREV_DUP);
		else if (!row) {
			row = await handle.seeker.op(CursorOp.SET, key);
			if (row) row = await handle.seeker.op(CursorOp.LAST_DUP);
		}
	}
	if (!row) return false;
	await readMemberRun(handle, member, row);
	member.bound = at;
	return true;
}

async function seekMember(handle, member, at, direction) {
	const { key, dup } = seekOf(member.prefix, at);
	let found = await seekMemberKey(handle, member, key, dup, at, direction);
	if (!found && direction === 'asc' && equal(key, member.key0)) {
		const next = seekOf(member.prefix, HALF);
		found = await seekMemberKey(handle, member, next.key, next.dup, at, direction);
	}
	if (!found && direction === 'desc' && equal(key, member.key1)) {
		const prior = seekOf(member.prefix, HALF - 1n);
		found = await seekMemberKey(handle, member, prior.key, prior.dup, at, direction);
	}
	if (!found) member.run = [];
	return found;
}

async function nearestMember(handle, member, at, direction) {
	const run = member.run;
	const held = member.direction === direction && run.length && (
		(at >= run[0] && at <= run.at(-1)) ||
		(direction === 'desc' ? at >= run.at(-1) && at <= member.bound : at <= run[0] && at >= member.bound)
	);
	if (!held) await wildcardTraversal(
		handle,
		'seek',
		() => seekMember(handle, member, at, direction),
		member.parent,
	);
	member.direction = direction;
	member.answer = inRun(member.run, at, direction);
	return member.answer;
}

async function firstWildcardKey(handle, direction) {
	if (direction === 'asc') {
		return wildcardTraversal(handle, 'seek', () => handle.enumerator.op(CursorOp.SET_RANGE, handle.predicate.lower));
	}
	if (handle.predicate.upper === null) {
		return wildcardTraversal(handle, 'seek', () => handle.enumerator.op(CursorOp.LAST));
	}
	const upper = await wildcardTraversal(handle, 'seek', () => handle.enumerator.op(CursorOp.SET_RANGE, handle.predicate.upper));
	return upper.value
		? wildcardTraversal(handle, 'enumerate', () => handle.enumerator.op(CursorOp.PREV_NODUP))
		: wildcardTraversal(handle, 'seek', () => handle.enumerator.op(CursorOp.LAST));
}

/** Enumerate one head per value subtree and build the offset merge heap. */
async function rebuildWildcard(handle, at, direction) {
	const heap = new OffsetHeap(direction);
	let current = await firstWildcardKey(handle, direction);
	let previous = null;
	let id = 0;
	while (current.value) {
		const row = current.value;
		const physical = decodeKey(row.key);
		if (physical.nameHash !== handle.predicate.nameHash) break;
		if (physical.prefix !== previous) {
			const member = memberOf(physical.prefix, id++, current.traversal.id);
			const edge = decodeRow(row.key, row.value);
			if (reusable(edge, at, direction)) member.answer = edge;
			else await nearestMember(handle, member, at, direction);
			if (member.answer !== null) heap.push(member);
			previous = physical.prefix;
		}
		current = await wildcardTraversal(handle, 'enumerate', () =>
			handle.enumerator.op(direction === 'desc' ? CursorOp.PREV_NODUP : CursorOp.NEXT_NODUP));
	}
	handle.heap = heap;
}

/** The nearest offset carrying any value for one tag name. */
async function probeWildcard(handle, at, direction, emitter) {
	const started = performance.now();
	const monotonic = handle.direction === direction && handle.at !== null &&
		(direction === 'desc' ? at <= handle.at : at >= handle.at);
	let method = 'buffer';
	if (!monotonic) {
		method = 'enumerate';
		await rebuildWildcard(handle, at, direction);
	} else if (handle.heap?.peek() && !reusable(handle.heap.peek().answer, at, direction)) {
		method = 'seek';
		while (handle.heap.peek() && !reusable(handle.heap.peek().answer, at, direction)) {
			const member = handle.heap.pop();
			await nearestMember(handle, member, at, direction);
			if (member.answer !== null) handle.heap.push(member);
		}
	}
	handle.direction = direction;
	handle.at = at;
	const answer = handle.heap?.peek()?.answer ?? null;
	emitter?.emit('locate:probe', {
		predicate: { name: handle.predicate.name, value: '*' },
		cursor: at,
		direction,
		method,
		traversal: null,
		answer,
		ms: performance.now() - started,
	});
	return answer;
}

async function openOperand(index, predicate) {
	if (isWildcard(predicate)) return openWildcard(index, predicate);
	if (isUnion(predicate)) return openUnion(index, predicate);
	return openProbe(index, predicate);
}

function probeOperand(handle, at, direction, emitter) {
	if (isWildcard(handle.predicate)) return probeWildcard(handle, at, direction, emitter);
	if (isUnion(handle.predicate)) return probeUnion(handle, at, direction, emitter);
	return probe(handle, at, direction, emitter);
}

/** Whether the cursor has left the offset space or crossed the exclusive bound. */
function past(direction, cursor, to) {
	if (cursor < 0n || cursor > MAX_OFFSET) return true;
	if (to === null || to === undefined) return false;
	return direction === 'desc' ? cursor <= to : cursor >= to;
}

/**
 * The leapfrog itself, over `probes`: async functions of `(cursor,
 * direction)` answering a predicate's nearest offset or null. From `from`
 * towards `to` (exclusive), every predicate is asked in turn; an answer
 * past the cursor moves it there and starts the round again, agreement from
 * all is a match, and null ends the walk. `hasNextPage` is true when the
 * walk stopped at its limit rather than at a bound or an exhausted predicate.
 */
export async function leapfrog(probes, { direction = 'desc', from, to = null, limit = 10, accept, acceptBatch, batchSize = 1, onMatch, signal } = {}) {
	const offsets = [];
	const pending = [];
	let cursor = from ?? (direction === 'desc' ? MAX_OFFSET : 0n);
	let left = limit;
	let exhausted = false;
	let acceptedAhead = false;
	const flush = async () => {
		const candidates = pending.splice(0);
		const accepted = acceptBatch
			? await acceptBatch(candidates)
			: await Promise.all(candidates.map((offset) => !accept || accept(offset)));
		if (accepted.length !== candidates.length) throw new Error('invalid-acceptance-batch');
		for (let j = 0; j < candidates.length; j++) {
			if (!accepted[j]) continue;
			if (left === 0) { acceptedAhead = true; continue; }
			offsets.push(candidates[j]);
			onMatch?.(candidates[j]);
			left -= 1;
		}
	};
	/* Predicates are asked in turn. One that answers with the cursor agrees;
	 * one that answers past it moves the cursor and, having named it, has
	 * agreed to it — so the round goes on to the others rather than asking
	 * it again. A cursor every predicate has agreed to is a match. */
	let i = 0;
	let agreed = 0;
	while (left > 0 && !past(direction, cursor, to)) {
		if (signal?.aborted) throw new Error('cancelled');
		const answer = await probes[i](cursor, direction);
		if (answer === null) { exhausted = true; break; }
		if (answer !== cursor) {
			cursor = answer;
			/* A move past the far bound ends the walk before it can count. */
			if (past(direction, cursor, to)) break;
			agreed = 1;
		} else {
			agreed += 1;
		}
		i = (i + 1) % probes.length;
		if (agreed === probes.length) {
			pending.push(cursor);
			cursor = direction === 'desc' ? cursor - 1n : cursor + 1n;
			agreed = 0;
			if (pending.length >= batchSize) await flush();
		}
	}
	if (left > 0 && pending.length) await flush();
	return { offsets, hasNextPage: acceptedAhead || (left === 0 && !exhausted && !past(direction, cursor, to)) };
}

/**
 * Walk the intersection of `predicates` from `from` towards `to`
 * (exclusive), emitting up to `limit` offsets every predicate carries, with
 * one open cursor per predicate for the whole walk.
 */
export async function locate(index, predicates, { direction = 'desc', from, to = null, limit = 10, accept, acceptBatch, batchSize, onEvent, onMatch, signal } = {}) {
	const started = performance.now();
	const off = onEvent ? index.emitter.on('*', onEvent) : () => {};
	if (index.source) index.source.direction = direction;
	const handles = [];
	try {
		handles.push(...await Promise.all(predicates.map((p) => openOperand(index, p))));
		const raw = handles.map((handle) => (at, dir) => probeOperand(handle, at, dir, index.emitter));
		/* The first descent of every predicate at once: the cold cost of a
		 * walk is those descents' chunk fetches, and they are independent. The
		 * answers are handed to the walk's first round rather than probed for
		 * twice — the same call, and the same line in a log, once. */
		const start = from ?? (direction === 'desc' ? MAX_OFFSET : 0n);
		const primed = raw.length > 1 ? await Promise.all(raw.map((run) => run(start, direction))) : [];
		const probes = raw.map((run, i) => async (at, dir) => {
			if (at === start && i in primed) { const answer = primed[i]; delete primed[i]; return answer; }
			return run(at, dir);
		});
		const { offsets, hasNextPage } = await leapfrog(probes, {
			direction,
			from,
			to,
			limit,
			accept,
			acceptBatch,
			batchSize,
			signal,
			onMatch: (offset) => {
				index.emitter.emit('locate:match', { offset });
				onMatch?.(offset);
			},
		});
		const ms = performance.now() - started;
		index.emitter.emit('locate:done', { count: offsets.length, hasNextPage, ms });
		return { offsets, hasNextPage, ms };
	} finally {
		for (const handle of handles) await handle.close();
		off();
	}
}

/** The exact number of rows a predicate has, summed over its two keys. */
export async function count(index, predicate, { onEvent } = {}) {
	const started = performance.now();
	const off = onEvent ? index.emitter.on('*', onEvent) : () => {};
	try {
		const p = predicateOf(predicate);
		await index.ready?.();
		const total = (await index.db.count(p.key0)) + (await index.db.count(p.key1));
		index.emitter.emit('count:done', { count: total, exact: true, ms: performance.now() - started });
		return total;
	} finally {
		off();
	}
}

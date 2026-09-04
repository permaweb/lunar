/**
 * The event vocabulary of arlmdb.js, and a small emitter.
 *
 * Every step of opening an index and answering a query reports itself here,
 * so that a UI can draw the work as it happens without the engine knowing
 * what a renderer is. The names are fixed by API.md.
 */
export const EVENTS = [
	'index:open',
	'chunk:request', 'chunk:received', 'chunk:verified', 'chunk:hit', 'chunk:failed',
	'page:read',
	'query:parsed', 'query:planned',
	'locate:probe', 'locate:match', 'locate:done',
	'count:done',
	'result:slot', 'result:node', 'result:failed',
	'query:done',
];

export class Emitter {
	#listeners = new Map();
	#all = new Set();

	on(type, fn) {
		if (type === '*') { this.#all.add(fn); return () => this.#all.delete(fn); }
		if (!this.#listeners.has(type)) this.#listeners.set(type, new Set());
		this.#listeners.get(type).add(fn);
		return () => this.#listeners.get(type)?.delete(fn);
	}

	emit(type, fields = {}) {
		const event = { type, at: performance.now(), ...fields };
		for (const fn of this.#listeners.get(type) ?? []) fn(event);
		for (const fn of this.#all) fn(event);
		return event;
	}
}

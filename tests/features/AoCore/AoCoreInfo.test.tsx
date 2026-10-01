// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { type AoCoreState, type MessageValue, parseAoCoreMessage } from '../../../src/api/aoCore';
import { AoReadError } from '../../../src/api/aoNetwork';
import { AoCoreInfo } from '../../../src/features/AoCore/components/organisms/AoCoreInfo';
import { AoCoreMessageInfo } from '../../../src/features/AoCore/components/organisms/AoCoreMessageInfo';
import { DEFAULT_AO_NETWORK } from '../../../src/helpers/aoNetwork';
import { darkTheme, theme } from '../../../src/helpers/themes';

const mocks = vi.hoisted(() => ({ read: vi.fn(), network: null }));
vi.mock('api/aoCore', async (original) => ({ ...(await original()), readAoCoreValue: mocks.read }));
vi.mock('providers/SettingsProvider', () => ({
	useSettingsProvider: () => ({ settings: { aoNetwork: mocks.network ?? DEFAULT_AO_NETWORK } }),
}));
vi.mock('react-svg', () => ({ ReactSVG: () => null }));
vi.mock('store', () => ({ store: { getState: () => ({ transactions: {} }) } }));
vi.mock('components/molecules/Editor', () => ({ Editor: (props) => <pre>{props.initialData}</pre> }));
vi.mock('components/molecules/JSONReader', () => ({ JSONReader: (props) => <pre>{props.data}</pre> }));

let container: HTMLElement;
let overlay: HTMLElement;
let root: ReturnType<typeof createRoot>;
const id = 'a'.repeat(43);
const link = 'b'.repeat(43);
const fixture = {
	device: 'process@1.0',
	'body+link': link,
	commitments: {
		first: {
			'commitment-device': 'httpsig@1.0',
			type: 'rsa-pss-sha512',
			committer: 'Alice',
			committed: ['device'],
			signature: 'first-original-signature',
		},
		second: {
			'commitment-device': 'httpsig@1.0',
			type: 'rsa-pss-sha512',
			committer: 'Bob',
			committed: ['body+link'],
			signature: 'second-original-signature',
		},
	},
};
const ready: AoCoreState = {
	status: 'ready',
	result: { data: parseAoCoreMessage(JSON.stringify(fixture), id), provider: 'https://ao.example', source: 'peers' },
};

beforeEach(() => {
	vi.clearAllMocks();
	mocks.network = null;
	mocks.read.mockReset();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('prefers-reduced-motion') }));
	container = document.createElement('main');
	overlay = document.createElement('div');
	overlay.id = 'overlay';
	document.body.append(container, overlay);
	root = createRoot(container);
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	overlay.remove();
	vi.unstubAllGlobals();
});
async function render(state: AoCoreState = ready, onRetry = vi.fn()) {
	await React.act(async () =>
		root.render(
			<MemoryRouter>
				<ThemeProvider theme={theme(darkTheme)}>
					{state.status === 'ready' && <AoCoreMessageInfo result={state.result} />}
					<AoCoreInfo state={state} onRetry={onRetry} />
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}
async function click(label: string) {
	const button = [...document.querySelectorAll('button')].find(
		(entry) => entry.getAttribute('aria-label') === label || entry.textContent.includes(label)
	);
	expect(button, `button ${label}`).toBeDefined();
	await React.act(async () => button.click());
}

it('loads inside the message table without presenting unknown fields as an empty or default message', async () => {
	await render({ status: 'loading' });
	const section = container.querySelector('section[aria-label="Message Fields"]');
	expect(section.getAttribute('aria-busy')).toBe('true');
	expect(section.querySelector('h3').textContent.trim()).toBe('Message Fields');
	expect(section.querySelector('.loader')).not.toBeNull();
	expect(section.querySelector('[role=status]').textContent).toContain('Reading the stored AO message');
	expect(section.textContent).not.toContain('No fields');
	expect(section.textContent).not.toContain('message@1.0');
	expect(mocks.read).not.toHaveBeenCalled();
	const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
	expect(result.violations).toEqual([]);
	await render();
	expect(container.querySelector('section[aria-label="Message Fields"]').getAttribute('aria-busy')).toBe('false');
	expect(container.querySelector('.loader')).toBeNull();
	expect(fieldCells(container.querySelector('[role=table]'), 'device')[3].textContent).toBe('process@1.0');
});

it('shows commitments in the fields tree and expands every original commitment value', async () => {
	await render();
	const sections = container.querySelectorAll('section[aria-label]');
	expect([...sections].map((section) => section.getAttribute('aria-label'))).toEqual(['Message Fields']);
	const fields = container.querySelector('[role=table][aria-label="Message Fields"]');
	expect([...fields.querySelectorAll('[role=columnheader]')].map((cell) => cell.textContent)).toEqual([
		'Key',
		'Type',
		'Coverage',
		'Value',
	]);
	expect(fieldCells(fields, 'commitments').map((cell) => cell.textContent)).toEqual([
		'commitments',
		'Message',
		'Not listed',
		'2 fields',
	]);
	expect(fieldCells(fields, 'device')[2].textContent).toBe('1 of 2 listed');
	expect(container.textContent).not.toContain('Alice');
	expect(container.textContent).not.toContain('Bob');
	expect(mocks.read).not.toHaveBeenCalled();
	await click('Expand commitments');
	const commitments = container.querySelector('[role=table][aria-label="Fields of commitments"]');
	expect(commitments.querySelectorAll(':scope > [role=rowgroup] > [role=row]')).toHaveLength(2);
	expect([...commitments.querySelectorAll('[role=columnheader]')].map((cell) => cell.textContent)).toEqual([
		'Key',
		'Type',
		'Value',
	]);
	await click('Expand first');
	await click('Expand second');
	const first = container.querySelector('[role=table][aria-label="Fields of first"]');
	const second = container.querySelector('[role=table][aria-label="Fields of second"]');
	expect(fieldCells(first, 'committer')[2].textContent).toBe('Alice');
	expect(fieldCells(second, 'committer')[2].textContent).toBe('Bob');
	expect(fieldCells(first, 'signature')[2].textContent).toBe('first-original-signature');
	expect(fieldCells(second, 'signature')[2].textContent).toBe('second-original-signature');
	for (const table of [first, second]) {
		expect(fieldCells(table, 'commitment-device')[2].textContent).toBe('httpsig@1.0');
		expect(fieldCells(table, 'type')[2].textContent).toBe('rsa-pss-sha512');
		await React.act(async () => fieldCells(table, 'committed')[2].querySelector('button').click());
	}
	expect(first.querySelector('[role=table]')?.textContent).toContain('device');
	expect(second.querySelector('[role=table]')?.textContent).toContain('body+link');
	expect([...commitments.querySelectorAll('[role=columnheader]')].some((cell) => cell.textContent === 'Coverage')).toBe(
		false
	);
	expect(commitments.textContent).not.toContain('Unknown');
	expect(document.body.textContent).not.toContain('A message is a set of named values.');
	await click('AO Core Message Info');
	const dialog = document.querySelector('[role="dialog"]');
	expect(dialog?.textContent).toContain('Not cryptographically verified');
	expect(dialog?.textContent).toContain('How this message is resolved');
	await click('Show raw response');
	expect(dialog?.textContent).toContain('first-original-signature');
	expect(dialog?.textContent).toContain('second-original-signature');
	await click('Close');
	await click('Collapse commitments');
	expect(container.querySelectorAll('[role=table]')).toHaveLength(1);
	expect(container.textContent).not.toContain('Bob');
	expect(mocks.read).not.toHaveBeenCalled();
});

function readyMessage(value: object, requestedId = id): AoCoreState {
	return {
		status: 'ready',
		result: {
			data: parseAoCoreMessage(JSON.stringify(value), requestedId),
			provider: 'https://ao.example',
			source: 'peers',
		},
	};
}
function linkedResult(value: MessageValue) {
	return { data: { value, rawText: '', headers: {} }, provider: 'https://child.example', source: 'peers' };
}
function fieldCells(table: Element, key: string) {
	const row = [...table.querySelectorAll(':scope > [role=rowgroup] > [role=row]')].find(
		(row) => row.firstElementChild?.textContent === key
	);
	expect(row, `field ${key}`).toBeDefined();
	return [...row.children];
}

it('expands coverage into the exact commitment-list entries and distinguishes unsigned commitments', async () => {
	await render(
		readyMessage({
			'base-hashpath': 'base/path',
			commitments: {
				signed: {
					'commitment-device': 'ans104@1.0',
					signature: 'declared-signature',
					committed: ['ao-types', 'base-hashpath'],
				},
				unsigned: { type: 'hmac-sha256', committed: ['ao-types', 'base-hashpath'] },
				other: { committed: ['hashpath'] },
			},
		})
	);
	const table = container.querySelector('[role=table]');
	const disclosure = fieldCells(table, 'base-hashpath')[2].querySelector('button');
	expect(disclosure.textContent).toBe('2 of 3 listed');
	await click('Show coverage for base-hashpath');
	const evidence = container.querySelector('[role=table][aria-label="Commitment coverage for base-hashpath"]');
	expect(fieldCells(evidence, 'signed').map((cell) => cell.textContent)).toEqual([
		'signed',
		'Signature commitment',
		'committed · item 2: base-hashpath',
	]);
	expect(fieldCells(evidence, 'unsigned').map((cell) => cell.textContent)).toEqual([
		'unsigned',
		'Unsigned commitment',
		'committed · item 2: base-hashpath',
	]);
	expect(fieldCells(evidence, 'other')[2].textContent).toBe('Not in committed (1 item)');
	expect(container.textContent).toContain('No cryptographic verification has been performed.');
	expect(disclosure.getAttribute('aria-expanded')).toBe('true');
	expect(document.getElementById(disclosure.getAttribute('aria-controls')).contains(evidence)).toBe(true);
	expect(mocks.read).not.toHaveBeenCalled();
	await click('Hide coverage for base-hashpath');
	expect(container.querySelectorAll('[role=table]')).toHaveLength(1);
	expect(disclosure.getAttribute('aria-expanded')).toBe('false');
});

it('shows missing, malformed, empty and exact-key coverage evidence without inventing coverage', async () => {
	await render(
		readyMessage({
			'body+link': link,
			commitments: {
				missing: {},
				malformed: { committed: ['body+link', 2] },
				empty: { committed: [] },
				inline: { committed: ['body'] },
			},
		})
	);
	await click('Show coverage for body+link');
	const evidence = container.querySelector('[role=table][aria-label="Commitment coverage for body+link"]');
	for (const key of ['missing', 'malformed']) {
		expect(fieldCells(evidence, key)[1].textContent).toBe('Not provided');
		expect(fieldCells(evidence, key)[2].textContent).toBe('Unknown: committed list missing or malformed');
	}
	expect(fieldCells(evidence, 'empty')[2].textContent).toBe('Not in committed (0 items)');
	expect(fieldCells(evidence, 'inline')[2].textContent).toBe('Not in committed (1 item)');
	expect(mocks.read).not.toHaveBeenCalled();
});

it('switches between linked values and their coverage, cancelling any pending value read', async () => {
	mocks.read.mockImplementation(() => new Promise(() => {}));
	await render();
	await click('Show coverage for body+link');
	expect(mocks.read).not.toHaveBeenCalled();
	await click('Expand body+link');
	expect(container.querySelector('[aria-label="Commitment coverage for body+link"]')).toBeNull();
	expect(mocks.read).toHaveBeenCalledTimes(1);
	const signal = mocks.read.mock.calls[0][2].signal;
	await click('Show coverage for body+link');
	expect(signal.aborted).toBe(true);
	expect(container.querySelector('[role=status]')).toBeNull();
	expect(container.querySelector('[aria-label="Expand body+link"]').getAttribute('aria-expanded')).toBe('false');
	expect(container.querySelector('[aria-label="Hide coverage for body+link"]').getAttribute('aria-expanded')).toBe(
		'true'
	);
	await render(readyMessage({ 'body+link': link }));
	expect(container.querySelector('[aria-label="Commitment coverage for body+link"]')).toBeNull();
});

it('paginates coverage evidence while counting all commitments', async () => {
	await render(
		readyMessage({
			field: 'value',
			commitments: Object.fromEntries(
				Array.from({ length: 51 }, (_, index) => [`commitment-${index}`, { committed: ['field'] }])
			),
		})
	);
	expect(fieldCells(container.querySelector('[role=table]'), 'field')[2].textContent).toBe('51 of 51 listed');
	await click('Show coverage for field');
	const evidence = container.querySelector('[role=table][aria-label="Commitment coverage for field"]');
	expect(evidence.querySelectorAll('[role=rowgroup] > [role=row]')).toHaveLength(50);
	await click('Next');
	expect(evidence.querySelectorAll('[role=rowgroup] > [role=row]')).toHaveLength(1);
	expect(fieldCells(evidence, 'commitment-50')[2].textContent).toBe('committed · item 1: field');
	await click('Hide coverage for field');
	await click('Show coverage for field');
	expect(container.textContent).toContain('Page 1 of 2');
});

it('opens an accessible coverage explanation from the column header and restores focus on close', async () => {
	await render();
	const header = [...container.querySelectorAll('[role=columnheader]')].find((cell) => cell.textContent === 'Coverage');
	const trigger = header.querySelector<HTMLButtonElement>('button[aria-label="About coverage"]');
	expect(trigger).not.toBeNull();
	expect(header.firstElementChild.textContent).toBe('Coverage');
	expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
	await React.act(async () => trigger.focus());
	await click('About coverage');
	const dialog = document.querySelector('[role=dialog]');
	expect(dialog).not.toBeNull();
	expect(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent).toBe('About coverage');
	expect(container.contains(dialog)).toBe(false);
	expect(trigger.getAttribute('aria-expanded')).toBe('true');
	expect(dialog.textContent).toContain('2 of 3 listed');
	expect(dialog.textContent).toContain('Example: base-hashpath');
	expect(dialog.textContent).toContain('["ao-types", "base-hashpath"]');
	expect(dialog.textContent).toContain('Coverage and cryptographic verification');
	expect(dialog.textContent).toContain('Links, child messages, and exact keys');
	expect(dialog.textContent).toContain('does not merge those records');
	expect(mocks.read).not.toHaveBeenCalled();
	const result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } });
	expect(result.violations).toEqual([]);
	await React.act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
	expect(document.querySelector('[role=dialog]')).toBeNull();
	expect(document.activeElement).toBe(trigger);
	expect(trigger.getAttribute('aria-expanded')).toBe('false');
	await click('About coverage');
	await click('Close');
	expect(document.querySelector('[role=dialog]')).toBeNull();
	expect(document.activeElement).toBe(trigger);
});

it('expands typed inline messages and lists without network reads or inherited coverage', async () => {
	await render(
		readyMessage({
			body: { count: 0, active: false, values: [null, 9007199254740991, ''] },
			commitments: { parent: { committed: ['body'] } },
		})
	);
	const table = container.querySelector('[role=table]');
	expect(fieldCells(table, 'body').map((cell) => cell.textContent)).toEqual([
		'body',
		'Message',
		'1 of 1 listed',
		'3 fields',
	]);
	expect(container.querySelectorAll('[role=table]')).toHaveLength(1);
	await click('Expand body');
	const nested = container.querySelector('[role=table][aria-label="Fields of body"]');
	expect(fieldCells(nested, 'count').map((cell) => cell.textContent)).toEqual(['count', 'Integer', 'Unknown', '0']);
	expect(fieldCells(nested, 'active').map((cell) => cell.textContent)).toEqual([
		'active',
		'Boolean',
		'Unknown',
		'false',
	]);
	expect(container.textContent).toContain('message@1.0 (default)');
	await click('Expand values');
	const list = container.querySelector('[role=table][aria-label="Fields of values"]');
	expect(fieldCells(list, '1').map((cell) => cell.textContent)).toEqual(['1', 'Null', 'Unknown', 'null']);
	expect(fieldCells(list, '3')[3].textContent).toBe('""');
	await click('Collapse body');
	expect(container.querySelectorAll('[role=table]')).toHaveLength(1);
	expect(mocks.read).not.toHaveBeenCalled();
});

it('loads a linked message only on expansion and shows its own field coverage', async () => {
	mocks.read.mockResolvedValue(
		linkedResult({ count: 0, active: false, commitments: { child: { committed: ['count'] } } })
	);
	await render();
	expect(mocks.read).not.toHaveBeenCalled();
	await click('Expand body+link');
	expect(mocks.read).toHaveBeenCalledTimes(1);
	expect(mocks.read.mock.calls[0][1]).toBe(link);
	const nested = container.querySelector('[role=table][aria-label="Fields of body+link"]');
	expect(fieldCells(nested, 'count')[2].textContent).toBe('1 of 1 listed');
	expect(nested.querySelector('[role=columnheader] button[aria-label="About coverage"]')).not.toBeNull();
	expect(fieldCells(nested, 'active')[2].textContent).toBe('Not listed');
	expect(container.textContent).toContain('https://child.example');
	expect(container.querySelector(`a[href="#/explorer/${link}"]`)).not.toBeNull();
	await click('Collapse body+link');
	expect(container.querySelectorAll('[role=table]')).toHaveLength(1);
});

it('loads linked commitments on demand using the same child tables', async () => {
	mocks.read.mockResolvedValue(linkedResult(fixture.commitments));
	await render(readyMessage({ 'commitments+link': link }));
	expect(mocks.read).not.toHaveBeenCalled();
	await click('Expand commitments+link');
	expect(mocks.read).toHaveBeenCalledTimes(1);
	expect(mocks.read.mock.calls[0][1]).toBe(link);
	await click('Expand second');
	const commitment = container.querySelector('[role=table][aria-label="Fields of second"]');
	expect(fieldCells(commitment, 'signature')[2].textContent).toBe('second-original-signature');
	expect(fieldCells(commitment, 'committer')[2].textContent).toBe('Bob');
	await click('Expand committed');
	const metadata = container.querySelector('[role=table][aria-label="Fields of commitments+link"]');
	expect([...metadata.querySelectorAll('[role=columnheader]')].some((cell) => cell.textContent === 'Coverage')).toBe(
		false
	);
});

it('cancels collapsed reads and ignores their late responses', async () => {
	let finish: (result: ReturnType<typeof linkedResult>) => void;
	mocks.read.mockImplementation(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			})
	);
	await render();
	await click('Expand body+link');
	expect(container.querySelector('[role=status]')?.textContent).toContain('Loading linked value');
	const loadingSection = container.querySelector('[role=status]').closest('section');
	expect(loadingSection.getAttribute('aria-busy')).toBe('true');
	expect(loadingSection.querySelector('h3').textContent.trim()).toBe('Fields of body+link');
	expect(loadingSection.querySelector('.loader')).not.toBeNull();
	expect(loadingSection.textContent).not.toContain('message@1.0');
	const signal = mocks.read.mock.calls[0][2].signal;
	await click('Collapse body+link');
	expect(signal.aborted).toBe(true);
	await React.act(async () => finish(linkedResult({ stale: 'must not appear' })));
	expect(container.textContent).not.toContain('must not appear');
});

it('cancels linked reads when the opened message or AO network changes', async () => {
	mocks.read.mockImplementation(() => new Promise(() => {}));
	await render();
	await click('Expand body+link');
	const firstSignal = mocks.read.mock.calls[0][2].signal;
	const next = readyMessage(fixture, 'c'.repeat(43));
	await render(next);
	expect(firstSignal.aborted).toBe(true);
	expect(container.querySelectorAll('[role=table]')).toHaveLength(1);
	await click('Expand body+link');
	const secondSignal = mocks.read.mock.calls[1][2].signal;
	mocks.network = { ...DEFAULT_AO_NETWORK, peers: ['https://other.example'] };
	await render(next);
	expect(mocks.read).toHaveBeenCalledTimes(3);
	expect(secondSignal.aborted).toBe(true);
});

it('offers retry for a failed linked read and supports a scalar linked value with integer precision', async () => {
	mocks.read
		.mockRejectedValueOnce(new AoReadError('timeout'))
		.mockResolvedValueOnce(linkedResult(900719925474099312345n));
	await render();
	await click('Expand body+link');
	expect(container.querySelector('[role=alert]')?.textContent).toContain('timed out');
	await click('Retry AO read');
	const nested = container.querySelector('[role=table][aria-label="Fields of body+link"]');
	expect(fieldCells(nested, 'Value').map((cell) => cell.textContent)).toEqual([
		'Value',
		'Integer',
		'Unknown',
		'900719925474099312345',
	]);
});

it('does not fetch malformed links or cyclic links and preserves link-specific coverage', async () => {
	await render(
		readyMessage({
			'self+link': id,
			'bad+link': 'invalid',
			body: 'inline',
			'body+link': link,
			commitments: {
				one: { committed: ['body'] },
				unknown: {},
				unsigned: { type: 'hmac-sha256', committed: ['self+link'] },
			},
		})
	);
	const table = container.querySelector('[role=table]');
	expect(fieldCells(table, 'body+link')[2].textContent).toBe('Unknown');
	expect(fieldCells(table, 'body')[2].textContent).toBe('1 of 3 listed · 1 unknown');
	expect(fieldCells(table, 'self+link')[2].querySelector('button')?.title).toContain('Unsigned commitment');
	expect(fieldCells(table, 'bad+link')[3].querySelector('[aria-expanded]')).toBeNull();
	await click('Expand self+link');
	expect(container.textContent).toContain('already open in this branch');
	expect(mocks.read).not.toHaveBeenCalled();
});

it('paginates large field sets and clears open child rows when changing page', async () => {
	await render(
		readyMessage(Object.fromEntries(Array.from({ length: 101 }, (_, index) => [`key-${index}`, { child: index }])))
	);
	const table = container.querySelector('[role=table]');
	expect(table.querySelectorAll('[role=rowgroup] > [role=row]')).toHaveLength(50);
	await click('Expand key-0');
	await click('Next');
	expect(container.textContent).not.toContain('Fields of key-0');
	expect(fieldCells(table, 'key-50')).toHaveLength(4);
	await click('Next');
	expect(table.querySelectorAll('[role=rowgroup] > [role=row]')).toHaveLength(1);
	expect(container.textContent).toContain('Page 3 of 3');
});

it('shows a full scalar value on keyboard focus without flattening nested messages', async () => {
	const text = 'full value '.repeat(50);
	await render(readyMessage({ body: text }));
	const button = fieldCells(container.querySelector('[role=table]'), 'body')[3].querySelector('button');
	await React.act(async () => button.focus());
	expect(document.querySelector('[role=tooltip]')?.textContent).toBe(text);
});

it('keeps explorer navigation for ordinary IDs without treating them as expandable AO links', async () => {
	await render(readyMessage({ target: link }));
	expect(container.querySelector(`a[href="#/explorer/${link}"]`)).not.toBeNull();
	expect(container.querySelector('[aria-label="Expand target"]')).toBeNull();
	expect(mocks.read).not.toHaveBeenCalled();
});

it('keeps empty messages and lists visible when expanded', async () => {
	await render(readyMessage({ message: {}, list: [] }));
	await click('Expand message');
	await click('Expand list');
	expect(container.querySelectorAll('[role=table]')).toHaveLength(3);
	expect(container.textContent.match(/No fields in this message or list/g)).toHaveLength(2);
});

it('keeps disclosure IDs valid for arbitrary field names', async () => {
	await render(readyMessage({ 'child field': { value: 1 }, '\ud800': { value: 2 } }));
	for (const key of ['child field', '\ud800']) {
		await click(`Expand ${key}`);
		const button = [...container.querySelectorAll('button')].find(
			(entry) => entry.getAttribute('aria-label') === `Collapse ${key}`
		);
		const target = button.getAttribute('aria-controls');
		expect(target).not.toMatch(/\s/);
		expect(document.getElementById(target)).not.toBeNull();
	}
});

it('offers a retry without claiming a failed response is a message', async () => {
	const retry = vi.fn();
	await render({ status: 'error', code: 'invalid-response' }, retry);
	expect(container.textContent).toContain('did not return a supported AO JSON message');
	expect(container.textContent).not.toContain('Stored message');
	await click('Retry AO read');
	expect(retry).toHaveBeenCalledTimes(1);
});

it('has accessible headings and named controls', async () => {
	mocks.read.mockResolvedValue(linkedResult({ field: 'value' }));
	await render();
	await click('Expand body+link');
	await click('Expand commitments');
	await click('Expand first');
	await click('Show coverage for device');
	const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
	expect(result.violations).toEqual([]);
	await click('AO Core Message Info');
	const panelResult = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } });
	expect(panelResult.violations).toEqual([]);
});

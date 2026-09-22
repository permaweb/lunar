// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { AoProcess } from '../../../../src/components/organisms/AoProcess';
import { language } from '../../../../src/helpers/language';
import type { AoProcessSummary } from '../../../../src/helpers/processes';
import { darkTheme, theme } from '../../../../src/helpers/themes';
import { MessageVariantEnum } from '../../../../src/helpers/types';

vi.mock('react-redux', () => ({ useDispatch: () => vi.fn() }));
vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden={'true'} /> }));
vi.mock('store', () => ({ store: { getState: () => ({}) } }));
vi.mock('store/transactions/reducer', () => ({ selectTransaction: () => null }));
vi.mock('providers/LanguageProvider', () => ({ useLanguageProvider: () => ({ current: 'en', object: language }) }));

const OWNER = 'wCSXTL1g1Entfpv5iyPNHxJlk9N6MfhYve2reKFJWTg';
const en = language.en;

let container: HTMLElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

async function render(process: AoProcessSummary) {
	await React.act(async () =>
		root.render(
			<MemoryRouter>
				<ThemeProvider theme={theme(darkTheme)}>
					<AoProcess process={process} />
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}

it('shows the process name, variant, owner, and scheduler device', async () => {
	await render({
		name: 'AO Test Token',
		variant: MessageVariantEnum.Mainnet,
		owner: OWNER,
		scheduler: { type: 'device', device: 'arweave-scheduler@1.0' },
	});

	expect(container.textContent).toContain(en.aoProcess);
	expect(container.textContent).toContain(`${en.name}: AO Test Token`);
	expect(container.textContent).toContain(`${en.variant}: ${en.mainnet} (ao.N.1)`);
	expect(container.textContent).toContain(`${en.owner}: ${OWNER.slice(0, 5)}`);
	expect(container.textContent).toContain(`${en.schedulerType}: arweave-scheduler@1.0`);
});

it('labels the legacy scheduler unit and fills unknown fields with a dash', async () => {
	await render({ name: null, variant: MessageVariantEnum.Legacynet, owner: null, scheduler: { type: 'legacy' } });

	expect(container.textContent).toContain(`${en.name}: -`);
	expect(container.textContent).toContain(`${en.variant}: ${en.legacynet} (ao.TN.1)`);
	expect(container.textContent).toContain(`${en.owner}: -`);
	expect(container.textContent).toContain(`${en.schedulerType}: ${en.legacynet}`);
});

it('has no detectable accessibility violations', async () => {
	await render({
		name: '_AO_',
		variant: MessageVariantEnum.Legacynet,
		owner: OWNER,
		scheduler: { type: 'device', device: 'scheduler@1.0' },
	});

	const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });

	expect(result.violations).toEqual([]);
});

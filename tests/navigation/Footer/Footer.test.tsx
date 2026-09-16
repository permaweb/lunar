// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { getDeployedTransaction } from '../../../src/api/deployment';
import { darkTheme, theme } from '../../../src/helpers/themes';
import { debugLog } from '../../../src/helpers/utils';
import { Footer } from '../../../src/navigation/Footer';

const DEPLOYED_TRANSACTION = 'Vr2pbw2scotRdqUNYp-8ZpgMeelhna7S9uVEuka7O_s';

vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden={'true'} /> }));
vi.mock('store', () => ({ store: { getState: () => ({ transactions: {} }) } }));
vi.mock('helpers/utils', async () => ({
	...(await vi.importActual('../../../src/helpers/utils')),
	debugLog: vi.fn(),
}));
vi.mock('api/deployment', () => ({
	getDeployedTransaction: vi.fn(),
	peekDeployedTransaction: () => null,
}));

let container: HTMLElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
	vi.clearAllMocks();
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

async function render() {
	await React.act(async () =>
		root.render(
			<MemoryRouter>
				<ThemeProvider theme={theme(darkTheme)}>
					<Footer />
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}

function getDeploymentLink() {
	return container.querySelector(`a[title="${DEPLOYED_TRANSACTION}"]`);
}

it('shows the transaction the deployment name points at', async () => {
	vi.mocked(getDeployedTransaction).mockResolvedValue({
		name: 'lunar',
		process: 'Y_vgOaIPzRfT24c9rWfOeqtddmd4-E2-0Q3v2ZWLBIU',
		transactionId: DEPLOYED_TRANSACTION,
	});

	await render();

	expect(container.textContent).toContain('Deployment');
	const link = getDeploymentLink();
	expect(link).not.toBeNull();
	expect(link?.getAttribute('href')).toContain(DEPLOYED_TRANSACTION);
	expect(link?.textContent).toContain('...');
});

it('cancels the lookup when it unmounts', async () => {
	let lookupSignal: AbortSignal | undefined;
	vi.mocked(getDeployedTransaction).mockImplementation((options) => {
		lookupSignal = options?.signal;
		return new Promise(() => {});
	});

	await render();
	expect(lookupSignal?.aborted).toBe(false);

	await React.act(async () => root.unmount());

	expect(lookupSignal?.aborted).toBe(true);
	root = createRoot(container);
});

it('falls back to a placeholder when the deployment cannot be read', async () => {
	vi.mocked(getDeployedTransaction).mockRejectedValue(new Error('gateway unreachable'));

	await render();

	expect(container.textContent).toContain('Deployment');
	expect(getDeploymentLink()).toBeNull();
	expect(vi.mocked(debugLog)).toHaveBeenCalledWith('warn', 'Footer', expect.any(String), expect.any(Error));
});

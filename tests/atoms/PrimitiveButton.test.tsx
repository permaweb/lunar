// @vitest-environment jsdom

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import axe from 'axe-core';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { PrimitiveButton } from '../../src/components/atoms/PrimitiveButton';

describe('PrimitiveButton accessibility', () => {
	let container: HTMLDivElement;
	let root: Root;

	beforeAll(() => {
		(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
	});

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);
		root = createRoot(container);
	});

	afterEach(() => {
		React.act(() => root.unmount());
		container.remove();
	});

	it('has no detectable accessibility violations with an accessible name', async () => {
		await React.act(async () => {
			root.render(<PrimitiveButton aria-label={'Refresh data'} />);
		});

		const result = await axe.run(container);

		expect(result.violations).toEqual([]);
	});
});

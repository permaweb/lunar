// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { Editor } from '../../../../src/components/molecules/Editor';
import { language } from '../../../../src/helpers/language';
import { darkTheme, theme } from '../../../../src/helpers/themes';

const ENTER = 3;

// A stand-in for Monaco: like the real editor, it calls onMount once and keeps every key handler registered then.
const monaco = vi.hoisted(() => ({ keyHandlers: [] as ((event: unknown) => void)[], value: '' }));
vi.mock('@monaco-editor/react', async () => {
	const React = await import('react');

	return {
		default: (props: { onMount: (editor: unknown, monacoApi: unknown) => void }) => {
			React.useEffect(() => {
				props.onMount(
					{
						onKeyDown: (handler: (event: unknown) => void) => monaco.keyHandlers.push(handler),
						getValue: () => monaco.value,
						layout: () => {},
						onDidContentSizeChange: () => ({ dispose: () => {} }),
					},
					{ KeyCode: { Enter: ENTER } }
				);
			}, []);

			return <div data-testid={'monaco'} />;
		},
	};
});
vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden={'true'} /> }));
vi.mock('providers/LanguageProvider', () => ({ useLanguageProvider: () => ({ current: 'en', object: language }) }));

let container: HTMLElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			disconnect() {}
		}
	);
	monaco.keyHandlers = [];
	monaco.value = 'query { blocks }';
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

async function render(props: { onSubmit?: (value?: string) => void; hasSubmitButton?: boolean }) {
	await React.act(async () =>
		root.render(
			<ThemeProvider theme={theme(darkTheme)}>
				<Editor
					initialData={'query { blocks }'}
					language={'graphql'}
					onSubmit={props.onSubmit}
					hasSubmitButton={props.hasSubmitButton}
					loading={false}
					useFixedHeight
				/>
			</ThemeProvider>
		)
	);
}

function press(modifiers: { metaKey?: boolean; ctrlKey?: boolean }) {
	const event = { ...modifiers, keyCode: ENTER, preventDefault: vi.fn(), stopPropagation: vi.fn() };
	monaco.keyHandlers.forEach((handler) => handler(event));

	return event;
}

function runButton() {
	return [...container.querySelectorAll('button')].find((button) => button.textContent?.startsWith(language.en.run));
}

it.each([{ metaKey: true }, { ctrlKey: true }])(
	'submits the current value to the latest handler on %o + Enter',
	async (modifiers) => {
		const mountedHandler = vi.fn();
		const latestHandler = vi.fn();
		await render({ onSubmit: mountedHandler });
		await render({ onSubmit: latestHandler });

		const event = press(modifiers);

		expect(mountedHandler).not.toHaveBeenCalled();
		expect(latestHandler).toHaveBeenCalledWith('query { blocks }');
		// Monaco's own Cmd/Ctrl+Enter binding ("Insert Line Below") must not also receive the event.
		expect(event.preventDefault).toHaveBeenCalled();
		expect(event.stopPropagation).toHaveBeenCalled();
	}
);

it('leaves Enter alone without a modifier or a submit handler', async () => {
	const onSubmit = vi.fn();
	await render({ onSubmit });

	const plainEnter = press({});
	expect(plainEnter.preventDefault).not.toHaveBeenCalled();
	expect(plainEnter.stopPropagation).not.toHaveBeenCalled();
	expect(onSubmit).not.toHaveBeenCalled();

	await render({});

	const unhandled = press({ metaKey: true });
	expect(unhandled.preventDefault).not.toHaveBeenCalled();
	expect(unhandled.stopPropagation).not.toHaveBeenCalled();
	expect(onSubmit).not.toHaveBeenCalled();
});

it('shows the Run button by default and can keep only the shortcut', async () => {
	const onSubmit = vi.fn();
	await render({ onSubmit });

	expect(runButton()).toBeDefined();

	await render({ onSubmit, hasSubmitButton: false });
	press({ metaKey: true });

	expect(runButton()).toBeUndefined();
	expect(onSubmit).toHaveBeenCalledWith('query { blocks }');
});

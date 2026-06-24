import React from 'react';
import Editor, { BeforeMount, OnMount } from '@monaco-editor/react';
import { useTheme } from 'styled-components';

import { Button } from 'components/atoms/Button';
import { defineMonacoTheme, getMonacoThemeName } from 'helpers/monacoTheme';
import { isMac } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function JSONWriter(props: {
	initialData: object;
	handleSubmit: (data: object) => void;
	loading: boolean;
}) {
	const currentTheme: any = useTheme();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const monacoRef = React.useRef<typeof import('monaco-editor') | null>(null);
	const editorRef = React.useRef<any>(null);
	const themeName = getMonacoThemeName(currentTheme);

	const [jsonString, setJsonString] = React.useState(JSON.stringify(props.initialData, null, 4));
	const [error, setError] = React.useState<string | null>(null);

	const handleBeforeMount: BeforeMount = (monaco) => {
		monacoRef.current = monaco;
		defineMonacoTheme(monaco, currentTheme);
	};

	React.useEffect(() => {
		const monaco = monacoRef.current;
		if (!monaco) return;

		defineMonacoTheme(monaco, currentTheme);
	}, [currentTheme]);

	// Add resize handler to ensure proper layout
	React.useEffect(() => {
		let resizeTimeout: NodeJS.Timeout;
		const handleResize = () => {
			// Clear any pending layout calls
			clearTimeout(resizeTimeout);
			// Force Monaco to recalculate its layout with a small delay
			resizeTimeout = setTimeout(() => {
				editorRef.current?.layout();
			}, 100);
		};
		window.addEventListener('resize', handleResize);
		return () => {
			clearTimeout(resizeTimeout);
			window.removeEventListener('resize', handleResize);
			// Cleanup ResizeObserver and timeout if they exist
			const editor = editorRef.current;
			if (editor) {
				if ((editor as any)._resizeTimeout) {
					clearTimeout((editor as any)._resizeTimeout);
				}
				if ((editor as any)._resizeObserver) {
					(editor as any)._resizeObserver.disconnect();
				}
			}
		};
	}, []);

	const handleEditorDidMount: OnMount = (editor, monaco) => {
		editorRef.current = editor;

		// Force initial layout
		requestAnimationFrame(() => {
			editor.layout();
		});

		// Use ResizeObserver on the parent container to handle layout changes
		const parentContainer = editor.getContainerDomNode()?.parentElement?.parentElement;
		if (parentContainer) {
			let resizeTimeout: NodeJS.Timeout;
			const resizeObserver = new ResizeObserver((entries) => {
				// Clear any pending layout calls
				clearTimeout(resizeTimeout);
				// Schedule a layout update
				resizeTimeout = setTimeout(() => {
					editor.layout();
				}, 50);
			});
			resizeObserver.observe(parentContainer);
			// Store observer and timeout for cleanup
			(editor as any)._resizeObserver = resizeObserver;
			(editor as any)._resizeTimeout = resizeTimeout;
		}

		editor.onKeyDown((e) => {
			if ((e.metaKey || e.ctrlKey) && e.keyCode === monaco.KeyCode.Enter) {
				const current = editor.getValue();
				props.handleSubmit(JSON.parse(current));
			}
		});
	};

	function handleChange(value: string) {
		const v = value ?? '';
		setJsonString(v);
		try {
			JSON.parse(v);
			setError(null);
		} catch {
			setError(language.invalidJSON);
		}
	}

	function submitHandler() {
		try {
			const parsed = JSON.parse(jsonString);
			setError(null);
			props.handleSubmit(parsed);
		} catch {
			setError(language.invalidJSON);
		}
	}

	return (
		<S.Wrapper>
			<S.EditorWrapper className={'border-wrapper-alt2 scroll-wrapper'}>
				<S.Editor>
					<Editor
						height={'100%'}
						defaultLanguage={'json'}
						value={jsonString}
						onChange={(value) => handleChange(value)}
						beforeMount={handleBeforeMount}
						onMount={handleEditorDidMount}
						theme={themeName}
						options={{
							readOnly: props.loading,
							automaticLayout: false,
							tabSize: 4,
							formatOnPaste: true,
							formatOnType: true,
							minimap: { enabled: false },
							wordWrap: 'on',
							fontFamily: currentTheme.typography.family.alt2,
							fontSize: currentTheme.typography.size.xxSmall,
							fontWeight: '600',
							scrollbar: {
								verticalSliderSize: 8,
								horizontalSliderSize: 8,
								verticalScrollbarSize: 12,
								horizontalScrollbarSize: 12,
								arrowSize: 10,
								useShadows: false,
							},
						}}
					/>
				</S.Editor>
				<S.ActionsWrapper>
					{error && (
						<S.ErrorWrapper>
							<span>{error}</span>
						</S.ErrorWrapper>
					)}
					<Button
						type={'alt1'}
						label={`${language.run} (${isMac ? `⌘` : `CTRL`} + Enter)`}
						handlePress={submitHandler}
						disabled={props.loading || Boolean(error)}
						loading={props.loading}
					/>
				</S.ActionsWrapper>
			</S.EditorWrapper>
		</S.Wrapper>
	);
}

import React from 'react';
import Editor, { BeforeMount, OnMount } from '@monaco-editor/react';
import { DefaultTheme, useTheme } from 'styled-components';

import { Button } from 'components/atoms/Button';
import { IconButton } from 'components/atoms/IconButton';
import { Loader } from 'components/atoms/Loader';
import { ASSETS } from 'helpers/config';
import { isMac, stripAnsiChars } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function _Editor(props: {
	initialData: string;
	language: string;
	readOnly?: boolean;
	noFullScreen?: boolean;
	setEditorData?: (data: string) => void;
	handleSubmit?: (currentValue?: string) => void;
	header?: string;
	useFixedHeight?: boolean;
	loading: boolean;
}) {
	const currentTheme: any = useTheme();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const editorRef = React.useRef(null);
	const monacoRef = React.useRef<typeof import('monaco-editor') | null>(null);
	const themeName = currentTheme.scheme === 'dark' ? 'editorDark' : 'editorLight';

	const [height, setHeight] = React.useState(0);
	const [data, setData] = React.useState(props.initialData);
	const [fullScreenMode, setFullScreenMode] = React.useState<boolean>(false);

	React.useEffect(() => {
		setData(props.initialData);
	}, [props.initialData]);

	React.useEffect(() => {
		if (props.setEditorData) props.setEditorData(data);
	}, [props.setEditorData, data]);

	const strip = (hex: string) => hex.replace(/^#/, '');

	function getRules(theme: DefaultTheme) {
		return [
			{ token: 'string', foreground: strip(theme.colors.editor.primary) },
			{ token: 'number', foreground: strip(theme.colors.editor.alt2) },
			{ token: 'keyword', foreground: strip(theme.colors.editor.alt1) },
			{ token: 'string.quoted.double.json', foreground: strip(theme.colors.editor.primary) },
			{ token: 'string.key.json', foreground: strip(theme.colors.editor.primary) },
			{ token: 'string.value.json', foreground: strip(theme.colors.editor.alt1) },
			{ token: 'comment', foreground: strip(theme.colors.editor.alt10) },
			{ token: 'delimiter', foreground: strip(theme.colors.editor.alt1) },
			{ token: 'operator', foreground: strip(theme.colors.editor.alt8) },
			{ token: 'variable', foreground: strip(theme.colors.editor.alt4) },
		];
	}

	function getColors(theme: DefaultTheme) {
		return {
			'editor.background': theme.colors.container.alt1.background,
			'editorLineNumber.foreground': theme.colors.font.alt1,
			'editorCursor.foreground': theme.colors.font.alt1,
			'editorBracketHighlight.foreground1': theme.colors.editor.alt5,
			'editorBracketHighlight.foreground2': theme.colors.editor.alt8,
			'editorBracketHighlight.foreground3': theme.colors.editor.alt5,
		};
	}

	const themes = {
		light: 'editorLight',
		dark: 'editorDark',
	};

	const handleBeforeMount: BeforeMount = (monaco) => {
		monacoRef.current = monaco;

		monaco.editor.defineTheme(themes.light, {
			base: 'vs',
			inherit: false,
			rules: getRules(currentTheme),
			colors: getColors(currentTheme),
		});

		monaco.editor.defineTheme(themes.dark, {
			base: 'vs-dark',
			inherit: true,
			rules: getRules(currentTheme),
			colors: getColors(currentTheme),
		});

		const themeName = currentTheme.scheme === 'dark' ? themes.dark : themes.light;
		monaco.editor.setTheme(themeName);
	};

	const toggleFullscreen = React.useCallback(async () => {
		const el = editorRef.current!;
		if (!document.fullscreenElement) {
			await el.requestFullscreen?.();
		} else {
			await document.exitFullscreen?.();
		}
	}, []);

	React.useEffect(() => {
		const onFullScreenChange = () => {
			setFullScreenMode(!!document.fullscreenElement);
		};
		document.addEventListener('fullscreenchange', onFullScreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', onFullScreenChange);
		};
	}, []);

	React.useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && fullScreenMode) {
				toggleFullscreen();
			}
		};
		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('keydown', onKeyDown);
		};
	}, [fullScreenMode, toggleFullscreen]);

	React.useEffect(() => {
		const monaco = monacoRef.current;
		if (!monaco) return;

		monaco.editor.defineTheme(themes.light, {
			base: 'vs',
			inherit: false,
			rules: getRules(currentTheme),
			colors: getColors(currentTheme),
		});

		monaco.editor.defineTheme(themes.dark, {
			base: 'vs-dark',
			inherit: true,
			rules: getRules(currentTheme),
			colors: getColors(currentTheme),
		});

		monaco.editor.setTheme(themeName);
	}, [currentTheme, themeName]);

	const handleEditorMount: OnMount = (editor, monaco) => {
		// Add keyboard shortcut for submit (Cmd+Enter or Ctrl+Enter)
		if (props.handleSubmit) {
			editor.onKeyDown((e) => {
				if ((e.metaKey || e.ctrlKey) && e.keyCode === monaco.KeyCode.Enter) {
					e.preventDefault();
					// Get the current value from the editor directly
					const currentValue = editor.getValue();
					props.handleSubmit(currentValue);
				}
			});
		}

		// Handle content size changes for dynamic height
		if (!props.useFixedHeight) {
			const disp = editor.onDidContentSizeChange((e) => {
				setHeight(e.contentHeight);
			});
			return () => disp.dispose();
		}
	};

	return data !== null ? (
		<S.Wrapper>
			{props.header && (
				<S.Header>
					<p>{props.header}</p>
				</S.Header>
			)}
			<S.EditorWrapper
				ref={editorRef}
				style={{ width: '100%', height: props.useFixedHeight ? '100%' : `${height}px`, overflow: 'hidden' }}
				useFixedHeight={props.useFixedHeight}
				className={'border-wrapper-alt2 scroll-wrapper'}
			>
				<S.Editor>
					<Editor
						height={'100%'}
						defaultLanguage={props.language}
						value={stripAnsiChars(data)}
						onChange={(value) => setData(value)}
						beforeMount={handleBeforeMount}
						onMount={handleEditorMount}
						theme={themeName}
						loading={null}
						options={{
							readOnly: props.loading || props.readOnly,
							automaticLayout: true,
							tabSize: 4,
							formatOnPaste: true,
							formatOnType: true,
							minimap: { enabled: false },
							wordWrap: 'on',
							fontFamily: currentTheme.typography.family.alt2,
							fontSize: currentTheme.typography.size.xxSmall,
							fontWeight: '600',
							scrollBeyondLastLine: false,
							guides: {
								indentation: false,
							},
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
					{!props.noFullScreen && (
						<IconButton
							type={'alt1'}
							src={ASSETS.fullscreen}
							handlePress={toggleFullscreen}
							dimensions={{
								wrapper: 25,
								icon: 12.5,
							}}
							tooltip={fullScreenMode ? language.exitFullScreen : language.enterFullScreen}
							tooltipPosition={'top-right'}
						/>
					)}
					{props.handleSubmit && (
						<S.SubmitWrapper>
							<Button
								type={'alt1'}
								label={`${language.run} (${isMac ? `⌘` : `CTRL`} + Enter)`}
								handlePress={props.handleSubmit as any}
								disabled={props.loading}
								loading={props.loading}
							/>
						</S.SubmitWrapper>
					)}
				</S.ActionsWrapper>
			</S.EditorWrapper>
		</S.Wrapper>
	) : (
		<Loader sm relative />
	);
}

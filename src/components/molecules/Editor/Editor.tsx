import React from 'react';
import Editor, { BeforeMount, OnMount } from '@monaco-editor/react';
import { useTheme } from 'styled-components';

import { Button } from 'components/atoms/Button';
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
	fixedHeight?: number;
	loading: boolean;
}) {
	const theme: any = useTheme();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const editorRef = React.useRef(null);
	const monacoRef = React.useRef<typeof import('monaco-editor') | null>(null);
	const editorInstanceRef = React.useRef<any>(null);
	const themeName = theme.scheme === 'dark' ? 'editorDark' : 'editorLight';

	const [height, setHeight] = React.useState(0);
	const [data, setData] = React.useState(props.initialData);
	const [fullScreenMode, setFullScreenMode] = React.useState<boolean>(false);

	React.useEffect(() => {
		setData(props.initialData);
	}, [props.initialData]);

	React.useEffect(() => {
		if (props.setEditorData) props.setEditorData(data);
	}, [props.setEditorData, data]);

	function stripHex(color: string): string {
		return color.replace(/^#/, '');
	}

	function normalizeHex(color: string, fallback: string): string {
		const strippedColor = stripHex(color).trim();

		if (/^[0-9a-fA-F]{3}$/.test(strippedColor)) {
			return strippedColor
				.split('')
				.map((value) => `${value}${value}`)
				.join('');
		}

		if (/^[0-9a-fA-F]{6}$/.test(strippedColor)) {
			return strippedColor;
		}

		return stripHex(fallback).slice(0, 6);
	}

	function hexWithAlpha(color: string, alpha: number, fallback: string): string {
		const alphaHex = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
			.toString(16)
			.padStart(2, '0');

		return `#${normalizeHex(color, fallback)}${alphaHex}`;
	}

	const defineThemes = React.useCallback(
		(monaco: any) => {
			const editorBackground = theme.colors.container.alt1.background;
			const editorForeground = theme.colors.font.primary;
			const editorBorder = theme.colors.border.primary;
			const editorMuted = theme.colors.font.alt1;
			const editorWidgetBackground = theme.colors.container.alt2.background;
			const editorActiveBackground = theme.colors.container.alt4.background;

			const rules = [
				{ token: '', foreground: stripHex(editorForeground), background: stripHex(editorBackground) },
				{ token: 'string', foreground: stripHex(theme.colors.editor.primary) },
				{ token: 'string.css', foreground: stripHex(theme.colors.editor.primary) },
				{ token: 'string.html', foreground: stripHex(theme.colors.editor.primary) },
				{ token: 'number', foreground: stripHex(theme.colors.editor.alt2) },
				{ token: 'number.css', foreground: stripHex(theme.colors.editor.alt2) },
				{ token: 'keyword', foreground: stripHex(theme.colors.editor.alt1) },
				{ token: 'keyword.css', foreground: stripHex(theme.colors.editor.alt1) },
				{ token: 'comment', foreground: stripHex(theme.colors.editor.alt10) },
				{ token: 'comment.content', foreground: stripHex(theme.colors.editor.alt10) },
				{ token: 'delimiter', foreground: stripHex(theme.colors.editor.alt1) },
				{ token: 'delimiter.css', foreground: stripHex(theme.colors.editor.alt1) },
				{ token: 'delimiter.html', foreground: stripHex(theme.colors.editor.alt1) },
				{ token: 'delimiter.bracket.css', foreground: stripHex(theme.colors.editor.alt1) },
				{ token: 'delimiter.parenthesis.css', foreground: stripHex(theme.colors.editor.alt1) },
				{ token: 'operator', foreground: stripHex(theme.colors.editor.alt8) },
				{ token: 'operator.css', foreground: stripHex(theme.colors.editor.alt8) },
				{ token: 'variable', foreground: stripHex(theme.colors.editor.alt4) },
				{ token: 'variable.css', foreground: stripHex(theme.colors.editor.alt4) },
				{ token: 'variable.parameter', foreground: stripHex(theme.colors.editor.alt4) },
				{ token: 'property', foreground: stripHex(theme.colors.editor.alt8) },
				{ token: 'tag', foreground: stripHex(theme.colors.editor.alt1) },
				{ token: 'tag.css', foreground: stripHex(theme.colors.editor.alt1) },
				{ token: 'tag.html', foreground: stripHex(theme.colors.editor.alt1) },
				{ token: 'metatag', foreground: stripHex(theme.colors.editor.alt1) },
				{ token: 'metatag.html', foreground: stripHex(theme.colors.editor.alt1) },
				{ token: 'metatag.content.html', foreground: stripHex(theme.colors.editor.alt8) },
				{ token: 'attribute.name', foreground: stripHex(theme.colors.editor.alt8) },
				{ token: 'attribute.name.css', foreground: stripHex(theme.colors.editor.alt8) },
				{ token: 'attribute.name.html', foreground: stripHex(theme.colors.editor.alt8) },
				{ token: 'attribute.value', foreground: stripHex(theme.colors.editor.primary) },
				{ token: 'attribute.value.css', foreground: stripHex(theme.colors.editor.primary) },
				{ token: 'attribute.value.html', foreground: stripHex(theme.colors.editor.primary) },
				{ token: 'attribute.value.hex.css', foreground: stripHex(theme.colors.editor.alt5) },
				{ token: 'attribute.value.number.css', foreground: stripHex(theme.colors.editor.alt2) },
				{ token: 'attribute.value.unit.css', foreground: stripHex(theme.colors.editor.alt2) },
				{ token: 'string.key.json', foreground: stripHex(theme.colors.editor.alt5) },
				{ token: 'string.value.json', foreground: stripHex(theme.colors.editor.primary) },
			];

			const colors = {
				foreground: editorForeground,
				focusBorder: theme.colors.border.alt2,
				descriptionForeground: editorMuted,
				errorForeground: theme.colors.warning.primary,
				'editor.background': editorBackground,
				'editor.foreground': editorForeground,
				'editorLineNumber.foreground': editorMuted,
				'editorLineNumber.activeForeground': editorForeground,
				'editorCursor.foreground': editorMuted,
				'editor.inactiveSelectionBackground': hexWithAlpha(theme.colors.editor.alt5, 0.18, editorBackground),
				'editor.selectionHighlightBackground': hexWithAlpha(theme.colors.editor.alt5, 0.18, editorBackground),
				'editor.lineHighlightBackground': hexWithAlpha(editorActiveBackground, 0.025, editorBackground),
				'editor.wordHighlightBackground': hexWithAlpha(theme.colors.editor.alt8, 0.18, editorBackground),
				'editor.wordHighlightStrongBackground': hexWithAlpha(theme.colors.editor.alt8, 0.26, editorBackground),
				'editor.findMatchBackground': hexWithAlpha(theme.colors.editor.alt6, 0.35, editorBackground),
				'editor.findMatchHighlightBackground': hexWithAlpha(theme.colors.editor.alt6, 0.2, editorBackground),
				'editorBracketMatch.background': hexWithAlpha(theme.colors.editor.alt5, 0.2, editorBackground),
				'editorBracketMatch.border': theme.colors.editor.alt5,
				'editorBracketHighlight.foreground1': theme.colors.editor.alt5,
				'editorBracketHighlight.foreground2': theme.colors.editor.alt8,
				'editorBracketHighlight.foreground3': theme.colors.editor.alt5,
				'editorHoverWidget.background': editorWidgetBackground,
				'editorHoverWidget.foreground': editorForeground,
				'editorHoverWidget.border': editorBorder,
				'editorHoverWidget.statusBarBackground': editorActiveBackground,
				'editorWidget.background': editorWidgetBackground,
				'editorWidget.foreground': editorForeground,
				'editorWidget.border': editorBorder,
				'editorSuggestWidget.background': editorWidgetBackground,
				'editorSuggestWidget.foreground': editorForeground,
				'editorSuggestWidget.border': editorBorder,
				'editorSuggestWidget.highlightForeground': theme.colors.editor.alt1,
				'editorSuggestWidget.focusHighlightForeground': theme.colors.editor.alt1,
				'editorSuggestWidget.selectedBackground': editorActiveBackground,
				'editorSuggestWidget.selectedForeground': editorForeground,
				'input.background': editorBackground,
				'input.foreground': editorForeground,
				'input.border': editorBorder,
				'list.activeSelectionBackground': editorActiveBackground,
				'list.activeSelectionForeground': editorForeground,
				'list.focusBackground': editorActiveBackground,
				'list.focusForeground': editorForeground,
				'list.hoverBackground': editorActiveBackground,
				'list.hoverForeground': editorForeground,
				'scrollbarSlider.background': hexWithAlpha(editorMuted, 0.25, editorBackground),
				'scrollbarSlider.hoverBackground': hexWithAlpha(editorMuted, 0.35, editorBackground),
				'scrollbarSlider.activeBackground': hexWithAlpha(editorMuted, 0.5, editorBackground),
			};

			monaco.editor.defineTheme('editorLight', {
				base: 'vs',
				inherit: false,
				rules,
				colors,
			});

			monaco.editor.defineTheme('editorDark', {
				base: 'vs-dark',
				inherit: false,
				rules,
				colors,
			});

			monaco.editor.setTheme(themeName);
		},
		[theme, themeName]
	);

	const handleBeforeMount: BeforeMount = (monaco) => {
		monacoRef.current = monaco;
		defineThemes(monaco);
	};

	const toggleFullscreen = React.useCallback(async () => {
		const el = editorRef.current!;
		if (document.fullscreenElement !== el) {
			// Exit current fullscreen first if needed, then enter fullscreen for this element
			if (document.fullscreenElement) {
				await document.exitFullscreen?.();
			}
			await el.requestFullscreen?.();
		} else {
			await document.exitFullscreen?.();
		}
	}, []);

	React.useEffect(() => {
		const onFullScreenChange = () => {
			setFullScreenMode(document.fullscreenElement === editorRef.current);
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
		if (!monacoRef.current) return;
		defineThemes(monacoRef.current);
	}, [defineThemes]);

	React.useEffect(() => {
		const handleResize = () => editorRef.current?.layout();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const handleEditorMount: OnMount = (editor, monaco) => {
		editorInstanceRef.current = editor;

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
		if (!props.useFixedHeight && !props.fixedHeight) {
			const disp = editor.onDidContentSizeChange((e) => {
				setHeight(e.contentHeight);
			});
			// Force initial layout to ensure content is visible
			requestAnimationFrame(() => {
				editor.layout();
			});
			return () => disp.dispose();
		} else {
			// Force initial layout for fixed height editors
			requestAnimationFrame(() => {
				editor.layout();
			});
			// Use ResizeObserver to handle layout when container becomes visible
			const editorContainer = editorRef.current;
			if (editorContainer) {
				const resizeObserver = new ResizeObserver(() => {
					editor.layout();
				});
				resizeObserver.observe(editorContainer);
				return () => resizeObserver.disconnect();
			}
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
				style={{
					width: '100%',
					height: props.useFixedHeight ? '100%' : props.fixedHeight ? `${props.fixedHeight}px` : `${height}px`,
					overflow: 'hidden',
				}}
				useFixedHeight={props.useFixedHeight}
				className={'border-wrapper-alt3 scroll-wrapper'}
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
							automaticLayout: false,
							tabSize: 4,
							formatOnPaste: true,
							formatOnType: true,
							minimap: { enabled: false },
							wordWrap: 'on',
							fontFamily: theme.typography.family.alt2,
							fontSize: theme.typography.size.xxSmall,
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
						<Button
							type={'alt1'}
							icon={ASSETS.fullscreen}
							handlePress={toggleFullscreen}
							height={25}
							width={25}
							noMinWidth
							iconSize={12.5}
							tooltip={fullScreenMode ? language.exitFullScreen : language.enterFullScreen}
							tooltipPosition={'top-right'}
							stopPropagation
							preventDefault
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

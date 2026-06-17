import React from 'react';
import Editor, { BeforeMount, OnMount } from '@monaco-editor/react';
import { useTheme } from 'styled-components';

import { Button } from 'components/atoms/Button';
import { Loader } from 'components/atoms/Loader';
import { ASSETS } from 'helpers/config';
import { defineMonacoTheme, getMonacoThemeName } from 'helpers/monacoTheme';
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
	const themeName = getMonacoThemeName(theme);

	const [height, setHeight] = React.useState(0);
	const [data, setData] = React.useState(props.initialData);
	const [fullScreenMode, setFullScreenMode] = React.useState<boolean>(false);

	React.useEffect(() => {
		setData(props.initialData);
	}, [props.initialData]);

	React.useEffect(() => {
		if (props.setEditorData) props.setEditorData(data);
	}, [props.setEditorData, data]);

	const defineThemes = React.useCallback(
		(monaco: any) => {
			defineMonacoTheme(monaco, theme);
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
		const handleResize = () => editorInstanceRef.current?.layout();
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
				{props.header && (
					<S.Header>
						<p>{props.header}</p>
					</S.Header>
				)}
				<S.Editor $hasHeader={props.header !== null && props.header !== undefined}>
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

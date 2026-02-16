import React from 'react';
import Editor, { BeforeMount, OnMount } from '@monaco-editor/react';
import { DefaultTheme, useTheme } from 'styled-components';

import { Button } from 'components/atoms/Button';
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
	const themeName = currentTheme.scheme === 'dark' ? 'editorDark' : 'editorLight';

	const [jsonString, setJsonString] = React.useState(JSON.stringify(props.initialData, null, 4));
	const [error, setError] = React.useState<string | null>(null);

	const strip = (hex: string) => hex.replace(/^#/, '');

	function getRules(theme: DefaultTheme) {
		return [
			{ token: 'string.quoted.double.json', foreground: strip(theme.colors.editor.primary) },
			{ token: 'string.key.json', foreground: strip(theme.colors.editor.primary) },
			{ token: 'string.value.json', foreground: strip(theme.colors.editor.alt1) },
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
			inherit: true,
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

	React.useEffect(() => {
		const monaco = monacoRef.current;
		if (!monaco) return;

		monaco.editor.defineTheme(themes.light, {
			base: 'vs',
			inherit: true,
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

	const handleEditorDidMount: OnMount = (editor, monaco) => {
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
							automaticLayout: true,
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

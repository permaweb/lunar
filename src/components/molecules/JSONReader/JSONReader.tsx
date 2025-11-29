import React from 'react';
import { JSONTree } from 'react-json-tree';
import { useTheme } from 'styled-components';

import { IconButton } from 'components/atoms/IconButton';
import { ASSETS } from 'helpers/config';
import { stripAnsiChars } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function _JSONTree(props: {
	data: any;
	header?: string;
	placeholder?: string;
	maxHeight?: number;
	noWrapper?: boolean;
	noFullScreen?: boolean;
}) {
	const currentTheme: any = useTheme();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const readerRef = React.useRef(null);

	const [data, setData] = React.useState<object | null>(null);
	const [copied, setCopied] = React.useState<boolean>(false);
	const [fullScreenMode, setFullScreenMode] = React.useState<boolean>(false);

	const toggleFullscreen = React.useCallback(async () => {
		const el = readerRef.current!;
		if (!document.fullscreenElement) {
			await el.requestFullscreen?.();
		} else {
			await document.exitFullscreen?.();
		}
	}, []);

	const copyData = React.useCallback(async () => {
		if (data) {
			let textToCopy;
			if (typeof data === 'object' && data !== null && 'result' in data && Object.keys(data).length === 1) {
				// If it's our wrapped string object, copy just the string value
				textToCopy = data.result;
			} else if (typeof data === 'string') {
				textToCopy = data;
			} else {
				textToCopy = JSON.stringify(data, null, 4);
			}
			await navigator.clipboard.writeText(textToCopy);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}, [data]);

	React.useEffect(() => {
		if (props.data) {
			const parsed = parseJSON(props.data);
			setData(typeof parsed === 'string' ? { Result: parsed } : parsed);
		} else setData(null);
	}, [props.data]);

	React.useEffect(() => {
		const onFullScreenChange = () => {
			setFullScreenMode(!!document.fullscreenElement);
		};
		document.addEventListener('fullscreenchange', onFullScreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', onFullScreenChange);
		};
	}, []);

	const parseJSON = (input) => {
		if (typeof input === 'string') {
			const strippedInput = stripAnsiChars(input);
			try {
				const parsed = JSON.parse(strippedInput);
				return parseJSON(parsed);
			} catch (e) {
				return strippedInput;
			}
		} else if (Array.isArray(input)) {
			return input.map(parseJSON);
		} else if (input !== null && typeof input === 'object') {
			return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, parseJSON(value)]));
		}
		return input;
	};

	const theme = {
		base00:
			props.noWrapper && !fullScreenMode
				? currentTheme.colors.view.background
				: currentTheme.colors.container.alt1.background,
		base01: currentTheme.colors.container.alt7.background,
		base02: currentTheme.colors.container.alt7.background,
		base03: currentTheme.colors.container.alt7.background,
		base04: currentTheme.colors.container.alt7.background,
		base05: currentTheme.colors.container.alt7.background,
		base06: currentTheme.colors.container.alt7.background,
		base07: currentTheme.colors.container.alt7.background,
		base08: currentTheme.colors.editor.primary,
		base09: currentTheme.colors.editor.alt2,
		base0A: currentTheme.colors.editor.alt2,
		base0B: currentTheme.colors.editor.alt1,
		base0C: currentTheme.colors.editor.primary,
		base0D: currentTheme.colors.editor.primary,
		base0E: currentTheme.colors.editor.primary,
		base0F: currentTheme.colors.editor.primary,
	};

	return (
		<S.Wrapper
			className={`${props.noWrapper && !fullScreenMode ? '' : 'border-wrapper-alt3 '}scroll-wrapper`}
			maxHeight={props.maxHeight}
			noWrapper={props.noWrapper && !fullScreenMode}
			ref={readerRef}
		>
			<S.Header>
				<p>{props.header ?? language.output}</p>

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
							tooltipPosition={'bottom-right'}
						/>
					)}
					<IconButton
						type={'alt1'}
						src={ASSETS.copy}
						handlePress={copyData}
						disabled={!data}
						dimensions={{
							wrapper: 25,
							icon: 12.5,
						}}
						tooltip={copied ? `${language.copied}!` : language.copyJSON}
						tooltipPosition={'bottom-right'}
					/>
				</S.ActionsWrapper>
			</S.Header>

			{data ? (
				<JSONTree data={data} hideRoot={true} theme={theme} shouldExpandNodeInitially={() => true} />
			) : (
				<S.Placeholder>
					<p>{props.placeholder ?? language.noDataToDisplay}</p>
				</S.Placeholder>
			)}
		</S.Wrapper>
	);
}

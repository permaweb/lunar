import React from 'react';
import { useNavigate } from 'react-router-dom';

import { IconButton } from 'components/atoms/IconButton';
import { ASSETS, URLS } from 'helpers/config';
import { checkValidAddress, stripAnsiChars } from 'helpers/utils';
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
	const navigate = useNavigate();

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

	const CustomJSONViewer = ({ data }: { data: any }) => {
		const [copiedValue, setCopiedValue] = React.useState<string | null>(null);
		const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());

		const handleCopy = React.useCallback(async (value: string) => {
			await navigator.clipboard.writeText(value);
			setCopiedValue(value);
			setTimeout(() => setCopiedValue(null), 1000);
		}, []);

		const toggleCollapse = React.useCallback((path: string) => {
			setCollapsed((prev) => {
				const next = new Set(prev);
				if (next.has(path)) {
					next.delete(path);
				} else {
					next.add(path);
				}
				return next;
			});
		}, []);

		const renderValue = (value: any, _key?: string, isLast: boolean = false, path: string = 'root'): JSX.Element => {
			if (value === null) {
				return (
					<>
						<S.JSONNull>null</S.JSONNull>
						{!isLast && <S.JSONComma>,</S.JSONComma>}
					</>
				);
			}
			if (value === undefined) {
				return (
					<>
						<S.JSONUndefined>undefined</S.JSONUndefined>
						{!isLast && <S.JSONComma>,</S.JSONComma>}
					</>
				);
			}
			if (typeof value === 'boolean') {
				return (
					<>
						<S.JSONBoolean>{value.toString()}</S.JSONBoolean>
						{!isLast && <S.JSONComma>,</S.JSONComma>}
					</>
				);
			}
			if (typeof value === 'number') {
				return (
					<>
						<S.JSONNumber>{value}</S.JSONNumber>
						{!isLast && <S.JSONComma>,</S.JSONComma>}
					</>
				);
			}
			if (typeof value === 'string') {
				const isValidId = checkValidAddress(value);
				if (isValidId) {
					return (
						<>
							<S.JSONStringIDFlex>
								<S.JSONStringID
									onClick={() => handleCopy(value)}
									title={copiedValue === value ? 'Copied!' : 'Click to copy'}
									copied={copiedValue === value}
								>
									"{value}"
								</S.JSONStringID>
								<S.JSONStringIDOpen onClick={() => navigate(`${URLS.explorer}/${value}`)}>(Open)</S.JSONStringIDOpen>
							</S.JSONStringIDFlex>
							{!isLast && <S.JSONComma>,</S.JSONComma>}
						</>
					);
				}
				return (
					<>
						<S.JSONString>"{value}"</S.JSONString>
						{!isLast && <S.JSONComma>,</S.JSONComma>}
					</>
				);
			}
			if (Array.isArray(value)) {
				if (value.length === 0) {
					return (
						<>
							<S.JSONArray>[]</S.JSONArray>
							{!isLast && <S.JSONComma>,</S.JSONComma>}
						</>
					);
				}
				const isCollapsed = collapsed.has(path);
				return (
					<>
						{isCollapsed ? (
							<>
								<S.JSONBracket>[ … ]</S.JSONBracket>
								{!isLast && <S.JSONComma>,</S.JSONComma>}
							</>
						) : (
							<>
								<S.JSONBracket>[</S.JSONBracket>
								<S.JSONIndent>
									{value.map((item, index) => {
										const itemPath = `${path}[${index}]`;
										return (
											<S.JSONArrayItem key={index}>
												{renderValue(item, undefined, index === value.length - 1, itemPath)}
											</S.JSONArrayItem>
										);
									})}
								</S.JSONIndent>
								<S.JSONBracket>]</S.JSONBracket>
								{!isLast && <S.JSONComma>,</S.JSONComma>}
							</>
						)}
					</>
				);
			}
			if (typeof value === 'object') {
				const entries = Object.entries(value);
				if (entries.length === 0) {
					return (
						<>
							<S.JSONObject>{'{}'}</S.JSONObject>
							{!isLast && <S.JSONComma>,</S.JSONComma>}
						</>
					);
				}
				const isCollapsed = collapsed.has(path);
				return (
					<>
						{isCollapsed ? (
							<>
								<S.JSONBracket>{'{ … }'}</S.JSONBracket>
								{!isLast && <S.JSONComma>,</S.JSONComma>}
							</>
						) : (
							<>
								<S.JSONBracket>{'{'}</S.JSONBracket>
								<S.JSONIndent>
									{entries.map(([k, v], index) => {
										const propPath = `${path}.${k}`;
										const isCollapsible =
											typeof v === 'object' &&
											v !== null &&
											(Array.isArray(v) ? v.length > 0 : Object.keys(v).length > 0);
										const isCollapsed = collapsed.has(propPath);

										return (
											<S.JSONProperty key={k}>
												{isCollapsible && (
													<S.CollapseArrow isCollapsed={isCollapsed} onClick={() => toggleCollapse(propPath)}>
														›
													</S.CollapseArrow>
												)}
												<S.JSONKey>"{k}"</S.JSONKey>
												<S.JSONColon>: </S.JSONColon>
												{renderValue(v, k, index === entries.length - 1, propPath)}
											</S.JSONProperty>
										);
									})}
								</S.JSONIndent>
								<S.JSONBracket>{'}'}</S.JSONBracket>
								{!isLast && <S.JSONComma>,</S.JSONComma>}
							</>
						)}
					</>
				);
			}
			return (
				<>
					<S.JSONString>{String(value)}</S.JSONString>
					{!isLast && <S.JSONComma>,</S.JSONComma>}
				</>
			);
		};

		return (
			<S.JSONViewerRoot
				fullScreenMode={fullScreenMode}
				maxHeight={!fullScreenMode ? props.maxHeight : undefined}
				className={'scroll-wrapper'}
			>
				{renderValue(data, undefined, true)}
			</S.JSONViewerRoot>
		);
	};

	return (
		<S.Wrapper
			className={`${props.noWrapper && !fullScreenMode ? '' : 'border-wrapper-alt3 '}`}
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
				<CustomJSONViewer data={data} />
			) : (
				<S.Placeholder>
					<p>{props.placeholder ?? language.noDataToDisplay}</p>
				</S.Placeholder>
			)}
		</S.Wrapper>
	);
}

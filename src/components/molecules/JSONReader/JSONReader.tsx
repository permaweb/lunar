import React from 'react';
import { useNavigate } from 'react-router-dom';
import JSONbig from 'json-bigint';

import { Button } from 'components/atoms/Button';
import { IconButton } from 'components/atoms/IconButton';
import { ASSETS, URLS } from 'helpers/config';
import { checkValidAddress, stripAnsiChars } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

const RANGE_SIZE = 2500;
const AUTO_COLLAPSE_THRESHOLD = 2500;
const INITIAL_RENDER_THRESHOLD = 25;

export default function _JSONTree(props: {
	data: any;
	header?: string;
	placeholder?: string;
	maxHeight?: number;
	fixedHeight?: number;
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
	const parsedDataRef = React.useRef<{ input: any; output: any }>({ input: null, output: null });

	const toggleFullscreen = React.useCallback(async () => {
		const el = readerRef.current!;
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

	const downloadData = React.useCallback(() => {
		if (data) {
			let textToDownload;
			if (typeof data === 'object' && data !== null && 'result' in data && Object.keys(data).length === 1) {
				// If it's our wrapped string object, download just the string value
				textToDownload = data.result;
			} else if (typeof data === 'string') {
				textToDownload = data;
			} else {
				textToDownload = JSON.stringify(data, null, 4);
			}

			const blob = new Blob([textToDownload], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = 'data.json';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		}
	}, [data]);

	React.useEffect(() => {
		// Only parse if props.data actually changed
		if (parsedDataRef.current.input !== props.data) {
			if (props.data) {
				const parsed = parseJSON(props.data);
				const output = typeof parsed === 'string' ? { Result: parsed } : parsed;
				parsedDataRef.current = { input: props.data, output };
				setData(output);
			} else {
				parsedDataRef.current = { input: null, output: null };
				setData(null);
			}
		}
	}, [props.data]);

	React.useEffect(() => {
		const onFullScreenChange = () => {
			setFullScreenMode(document.fullscreenElement === readerRef.current);
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
				// Use json-bigint to parse, which preserves large numbers as strings
				const parsed = JSONbig({ storeAsString: true }).parse(strippedInput);
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

	const CustomJSONViewer = React.forwardRef<
		{ collapseAll: () => void; expandAll: () => void; getCollapsedState: () => { isFullyCollapsed: boolean } },
		{ data: any }
	>(({ data }, ref) => {
		const [copiedValue, setCopiedValue] = React.useState<string | null>(null);
		const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());
		const [allPaths, setAllPaths] = React.useState<Set<string>>(new Set());
		const allPathsRef = React.useRef<Set<string>>(new Set());
		const dataRef = React.useRef<any>(null);

		// Calculate initial render limits synchronously before first render
		const initialRenderLimits = React.useMemo(() => {
			const limits = new Map<string, number>();
			const findLargeStructures = (value: any, path: string = 'root') => {
				if (Array.isArray(value)) {
					if (value.length > INITIAL_RENDER_THRESHOLD) {
						limits.set(path, INITIAL_RENDER_THRESHOLD);
					}
					// Only traverse the first batch to avoid performance issues during initialization
					const itemsToCheck = Math.min(value.length, INITIAL_RENDER_THRESHOLD);
					for (let i = 0; i < itemsToCheck; i++) {
						const item = value[i];
						if (typeof item === 'object' && item !== null) {
							findLargeStructures(item, `${path}[${i}]`);
						}
					}
				} else if (typeof value === 'object' && value !== null) {
					const entries = Object.entries(value);
					if (entries.length > INITIAL_RENDER_THRESHOLD) {
						limits.set(path, INITIAL_RENDER_THRESHOLD);
					}
					// Check all object properties
					for (const [k, v] of entries) {
						if (typeof v === 'object' && v !== null) {
							findLargeStructures(v, `${path}.${k}`);
						}
					}
				}
			};
			findLargeStructures(data);
			return limits;
		}, [data]);

		const [renderLimits, setRenderLimits] = React.useState<Map<string, number>>(initialRenderLimits);

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

		const collapseAll = React.useCallback(() => {
			// Collapse everything inside top-level keys, but keep the top-level keys themselves expanded
			const pathsToCollapse = Array.from(allPathsRef.current).filter((path) => {
				// Always keep root expanded
				if (path === 'root') return false;

				// Keep top-level keys expanded (root.Messages, root.Output, etc)
				const isTopLevel = path.match(/^root\.[^.[\]]+$/) || path.match(/^root\[\d+\]$/);
				if (isTopLevel) return false;

				// Collapse everything else (nested content)
				return true;
			});
			setCollapsed(new Set(pathsToCollapse));
		}, []);

		const expandAll = React.useCallback(() => {
			setCollapsed(new Set());
		}, []);

		const getCollapsedState = React.useCallback(() => {
			// Check if fully expanded (no collapsed items)
			if (collapsed.size === 0) {
				return { isFullyCollapsed: false };
			}
			// Check if all collapsible paths (except top-level) are collapsed
			const topLevelPaths = Array.from(allPaths).filter((path) => {
				return path === 'root' || path.match(/^root\.[^.[\]]+$/) || path.match(/^root\[\d+\]$/);
			});
			const collapsiblePathsCount = allPaths.size - topLevelPaths.length;
			const isFullyCollapsed = collapsed.size >= collapsiblePathsCount;
			return { isFullyCollapsed };
		}, [collapsed, allPaths]);

		React.useImperativeHandle(
			ref,
			() => ({
				collapseAll,
				expandAll,
				getCollapsedState,
			}),
			[collapseAll, expandAll, getCollapsedState]
		);

		const getDataSize = (value: any, maxDepth: number = 10, currentDepth: number = 0): number => {
			// Stop recursion after maxDepth to avoid performance issues
			if (currentDepth >= maxDepth) {
				return 0;
			}

			if (Array.isArray(value)) {
				let totalSize = value.length;
				// Add sizes of nested structures
				for (const item of value) {
					if (typeof item === 'object' && item !== null) {
						totalSize += getDataSize(item, maxDepth, currentDepth + 1);
					}
				}
				return totalSize;
			} else if (typeof value === 'object' && value !== null) {
				let totalSize = Object.keys(value).length;
				// Add sizes of nested structures
				for (const v of Object.values(value)) {
					if (typeof v === 'object' && v !== null) {
						totalSize += getDataSize(v, maxDepth, currentDepth + 1);
					}
				}
				return totalSize;
			}
			return 0;
		};

		const renderValue = (
			value: any,
			_key?: string,
			isLast: boolean = false,
			path: string = 'root',
			collectPaths: boolean = false
		): JSX.Element => {
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
				// Format large numbers to avoid scientific notation
				let displayValue: string;
				if (Number.isInteger(value) && Math.abs(value) > 1e15) {
					// For very large integers, use toFixed(0) to avoid scientific notation
					displayValue = value.toFixed(0);
				} else if (Math.abs(value) > 1e15 || (value !== 0 && Math.abs(value) < 1e-6)) {
					// For very large or very small numbers in scientific notation
					// Convert to string and display the full precision
					const str = value.toString();
					if (str.includes('e')) {
						// Try to expand scientific notation for better readability
						try {
							displayValue = value.toLocaleString('fullwide', { useGrouping: false, maximumFractionDigits: 20 });
						} catch {
							displayValue = str;
						}
					} else {
						displayValue = str;
					}
				} else {
					displayValue = value.toString();
				}

				return (
					<>
						<S.JSONNumber>{displayValue}</S.JSONNumber>
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
									title={copiedValue === value ? `${language.copied}!` : language.clickToCopy}
									copied={copiedValue === value}
								>
									"{value}"
								</S.JSONStringID>
								<S.JSONStringIDOpen onClick={() => navigate(`${URLS.explorer}/${value}`)}>
									({language.open})
								</S.JSONStringIDOpen>
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
				if (collectPaths && value.length > 0) {
					allPaths.add(path);
				}
				const isCollapsed = collapsed.has(path);

				// Apply render limit to any large arrays
				const currentLimit = renderLimits.get(path);
				const shouldLimitRender = currentLimit !== undefined && value.length > currentLimit;
				const itemsToRender = shouldLimitRender ? value.slice(0, currentLimit) : value;

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
									{itemsToRender.map((item, index) => {
										const itemPath = `${path}[${index}]`;
										const isCollapsible =
											typeof item === 'object' &&
											item !== null &&
											(Array.isArray(item) ? item.length > 0 : Object.keys(item).length > 0);
										const isItemCollapsed = collapsed.has(itemPath);

										if (collectPaths && isCollapsible) {
											allPaths.add(itemPath);
										}

										return (
											<S.JSONArrayItem key={index}>
												{isCollapsible && (
													<S.CollapseArrow isCollapsed={isItemCollapsed} onClick={() => toggleCollapse(itemPath)}>
														›
													</S.CollapseArrow>
												)}
												{renderValue(item, undefined, index === value.length - 1, itemPath, collectPaths)}
											</S.JSONArrayItem>
										);
									})}
									{shouldLimitRender && (
										<S.LoadMoreItem>
											<Button
												type={'alt4'}
												label={`Load ${Math.min(
													INITIAL_RENDER_THRESHOLD,
													value.length - (currentLimit ?? 0)
												)} more items (${value.length - (currentLimit ?? 0)} remaining)`}
												handlePress={() => {
													setRenderLimits((prev) => {
														const newLimits = new Map(prev);
														newLimits.set(path, (currentLimit ?? 0) + INITIAL_RENDER_THRESHOLD);
														return newLimits;
													});
												}}
											/>
										</S.LoadMoreItem>
									)}
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
				if (collectPaths && entries.length > 0) {
					allPaths.add(path);
				}
				const isCollapsed = collapsed.has(path);

				// Apply render limit to any large objects
				const currentLimit = renderLimits.get(path);
				const shouldLimitRender = currentLimit !== undefined && entries.length > currentLimit;
				const entriesToRender = shouldLimitRender ? entries.slice(0, currentLimit) : entries;

				// Check if this object has too many keys and should show collapsed ranges
				const hasCollapsedRanges = entriesToRender.length > AUTO_COLLAPSE_THRESHOLD;
				const rangeSize = RANGE_SIZE;

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
									{hasCollapsedRanges ? (
										<>
											{/* Render entries in ranges */}
											{Array.from({ length: Math.ceil(entriesToRender.length / rangeSize) }, (_, rangeIndex) => {
												const start = rangeIndex * rangeSize;
												const end = Math.min(start + rangeSize, entriesToRender.length);
												const rangeEntries = entriesToRender.slice(start, end);
												const rangePath = `${path}.__range_${start}_${end}__`;
												const isRangeCollapsed = collapsed.has(rangePath);

												return (
													<React.Fragment key={`range-${start}`}>
														<S.JSONProperty>
															<S.CollapseArrow isCollapsed={isRangeCollapsed} onClick={() => toggleCollapse(rangePath)}>
																›
															</S.CollapseArrow>
															<S.JSONKeyDefault>
																{isRangeCollapsed
																	? `[${start}–${end - 1}] (${rangeEntries.length} keys)`
																	: `[${start}–${end - 1}]`}
															</S.JSONKeyDefault>
														</S.JSONProperty>
														{!isRangeCollapsed &&
															rangeEntries.map(([k, v], index) => {
																const propPath = `${path}.${k}`;
																const isCollapsible =
																	typeof v === 'object' &&
																	v !== null &&
																	(Array.isArray(v) ? v.length > 0 : Object.keys(v).length > 0);
																const isPropCollapsed = collapsed.has(propPath);

																if (collectPaths && isCollapsible) {
																	allPaths.add(propPath);
																}

																return (
																	<S.JSONProperty key={k}>
																		{isCollapsible && (
																			<S.CollapseArrow
																				isCollapsed={isPropCollapsed}
																				onClick={() => toggleCollapse(propPath)}
																			>
																				›
																			</S.CollapseArrow>
																		)}
																		<S.JSONKey>"{k}"</S.JSONKey>
																		<S.JSONColon>: </S.JSONColon>
																		{renderValue(
																			v,
																			k,
																			start + index === entriesToRender.length - 1,
																			propPath,
																			collectPaths
																		)}
																	</S.JSONProperty>
																);
															})}
													</React.Fragment>
												);
											})}
										</>
									) : (
										<>
											{/* Normal rendering for objects with < AUTO_COLLAPSE_THRESHOLD keys */}
											{entriesToRender.map(([k, v], index) => {
												const propPath = `${path}.${k}`;
												const isCollapsible =
													typeof v === 'object' &&
													v !== null &&
													(Array.isArray(v) ? v.length > 0 : Object.keys(v).length > 0);
												const isPropCollapsed = collapsed.has(propPath);

												if (collectPaths && isCollapsible) {
													allPaths.add(propPath);
												}

												return (
													<S.JSONProperty key={k}>
														{isCollapsible && (
															<S.CollapseArrow isCollapsed={isPropCollapsed} onClick={() => toggleCollapse(propPath)}>
																›
															</S.CollapseArrow>
														)}
														<S.JSONKey>"{k}"</S.JSONKey>
														<S.JSONColon>: </S.JSONColon>
														{renderValue(v, k, index === entriesToRender.length - 1, propPath, collectPaths)}
													</S.JSONProperty>
												);
											})}
										</>
									)}
									{shouldLimitRender && (
										<S.LoadMoreItem>
											<Button
												type={'alt4'}
												label={`Load ${Math.min(
													INITIAL_RENDER_THRESHOLD,
													entries.length - (currentLimit ?? 0)
												)} more keys (${entries.length - (currentLimit ?? 0)} remaining)`}
												handlePress={() => {
													setRenderLimits((prev) => {
														const newLimits = new Map(prev);
														newLimits.set(path, (currentLimit ?? 0) + INITIAL_RENDER_THRESHOLD);
														return newLimits;
													});
												}}
											/>
										</S.LoadMoreItem>
									)}
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

		React.useEffect(() => {
			// Only recollect if data actually changed (deep comparison would be expensive, so use ref check)
			if (dataRef.current === data) {
				return;
			}
			dataRef.current = data;

			// Sync render limits when data changes
			setRenderLimits(initialRenderLimits);

			const paths = new Set<string>();
			const pathsToAutoCollapse = new Set<string>();

			const collectAllPaths = (value: any, path: string = 'root', _parentPath?: string) => {
				if (Array.isArray(value)) {
					if (value.length > 0) {
						paths.add(path);

						// Auto-collapse items in arrays with many elements
						if (value.length > AUTO_COLLAPSE_THRESHOLD) {
							value.forEach((item, index) => {
								if (typeof item === 'object' && item !== null) {
									const itemPath = `${path}[${index}]`;
									const isCollapsible = Array.isArray(item) ? item.length > 0 : Object.keys(item).length > 0;
									if (isCollapsible) {
										paths.add(itemPath);
										collectAllPaths(item, itemPath, path);
									}
									// Collapse items beyond the first RANGE_SIZE
									if (index >= RANGE_SIZE && isCollapsible) {
										pathsToAutoCollapse.add(itemPath);
									}
								}
							});
						} else {
							value.forEach((item, index) => {
								if (typeof item === 'object' && item !== null) {
									const itemPath = `${path}[${index}]`;
									const isCollapsible = Array.isArray(item) ? item.length > 0 : Object.keys(item).length > 0;
									if (isCollapsible) {
										paths.add(itemPath);
										collectAllPaths(item, itemPath, path);
									}
								}
							});
						}
					}
				} else if (typeof value === 'object' && value !== null) {
					const entries = Object.entries(value);
					if (entries.length > 0) {
						paths.add(path);

						// Auto-collapse ranges in objects with many keys
						if (entries.length > AUTO_COLLAPSE_THRESHOLD) {
							const rangeSize = RANGE_SIZE;
							const numRanges = Math.ceil(entries.length / rangeSize);

							// Create range paths and auto-collapse all except the first
							for (let rangeIndex = 0; rangeIndex < numRanges; rangeIndex++) {
								const start = rangeIndex * rangeSize;
								const end = Math.min(start + rangeSize, entries.length);
								const rangePath = `${path}.__range_${start}_${end}__`;
								paths.add(rangePath);

								// Auto-collapse all ranges except the first one
								if (rangeIndex > 0) {
									pathsToAutoCollapse.add(rangePath);
								}
							}

							entries.forEach(([k, v]) => {
								const propPath = `${path}.${k}`;
								if (typeof v === 'object' && v !== null) {
									const isCollapsible = Array.isArray(v) ? v.length > 0 : Object.keys(v).length > 0;
									if (isCollapsible) {
										paths.add(propPath);
										collectAllPaths(v, propPath, path);
									}
								}
							});
						} else {
							entries.forEach(([k, v]) => {
								const propPath = `${path}.${k}`;
								if (typeof v === 'object' && v !== null) {
									const isCollapsible = Array.isArray(v) ? v.length > 0 : Object.keys(v).length > 0;
									if (isCollapsible) {
										paths.add(propPath);
										collectAllPaths(v, propPath, path);
									}
								}
							});
						}
					}
				}
			};

			collectAllPaths(data);

			// Check if this is first load or if paths actually changed
			const isFirstLoad = allPathsRef.current.size === 0;
			const pathsChanged =
				!isFirstLoad &&
				(paths.size !== allPathsRef.current.size || Array.from(paths).some((p) => !allPathsRef.current.has(p)));

			allPathsRef.current = paths;
			setAllPaths(paths);

			// Apply auto-collapse on first load, or reset on structure change
			if (isFirstLoad && pathsToAutoCollapse.size > 0) {
				setCollapsed(pathsToAutoCollapse);
			} else if (pathsChanged) {
				setCollapsed(new Set());
			}
		}, [data]);

		return (
			<S.JSONViewerRoot
				fullScreenMode={fullScreenMode}
				maxHeight={!fullScreenMode ? props.maxHeight : undefined}
				fixedHeight={!fullScreenMode ? props.fixedHeight : undefined}
				className={'scroll-wrapper'}
			>
				{renderValue(data, undefined, true)}
			</S.JSONViewerRoot>
		);
	});

	const jsonViewerRef = React.useRef<{
		collapseAll: () => void;
		expandAll: () => void;
		getCollapsedState: () => { isFullyCollapsed: boolean };
	}>(null);

	const handleToggleCollapse = React.useCallback(() => {
		const state = jsonViewerRef.current?.getCollapsedState();
		if (state?.isFullyCollapsed) {
			jsonViewerRef.current?.expandAll();
		} else {
			jsonViewerRef.current?.collapseAll();
		}
	}, []);

	return (
		<S.Wrapper
			className={`${props.noWrapper && !fullScreenMode ? '' : 'border-wrapper-alt3 '}`}
			noWrapper={props.noWrapper && !fullScreenMode}
			fixedHeight={!fullScreenMode ? props.fixedHeight : undefined}
			ref={readerRef}
		>
			<S.Header>
				<p>{props.header ?? language.output}</p>

				<S.ActionsWrapper>
					<IconButton
						type={'alt1'}
						src={ASSETS.plusMinus}
						handlePress={handleToggleCollapse}
						disabled={!data}
						dimensions={{
							wrapper: 25,
							icon: 12.5,
						}}
						tooltip={language.collapseExpandAll}
						tooltipPosition={'bottom-right'}
					/>
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
						src={ASSETS.save}
						handlePress={downloadData}
						disabled={!data}
						dimensions={{
							wrapper: 25,
							icon: 12.5,
						}}
						tooltip={language.downloadJSON ?? 'Download JSON'}
						tooltipPosition={'bottom-right'}
					/>
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
				<CustomJSONViewer key="json-viewer" data={data} ref={jsonViewerRef} />
			) : (
				<S.Placeholder>
					<p>{props.placeholder ?? language.noDataToDisplay}</p>
				</S.Placeholder>
			)}
		</S.Wrapper>
	);
}

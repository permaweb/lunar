import React from 'react';
import { useTheme } from 'styled-components';

import { Types } from '@permaweb/libs';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { IconButton } from 'components/atoms/IconButton';
import { Loader } from 'components/atoms/Loader';
import { Panel } from 'components/atoms/Panel';
import { Editor } from 'components/molecules/Editor';
import { AO_NODE, ASSETS, TAGS } from 'helpers/config';
import { MessageVariantEnum } from 'helpers/types';
import { checkValidAddress, formatAddress, getTagValue, resolveLibDeps, resolveLibs } from 'helpers/utils';
import { useArweaveProvider } from 'providers/ArweaveProvider';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';
import { useSettingsProvider } from 'providers/SettingsProvider';
import { WalletBlock } from 'wallet/WalletBlock';

import * as S from './styles';

const Input = React.forwardRef<
	HTMLDivElement,
	{
		value: string;
		onChange: (v: string) => void;
		placeholder?: string;
		onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
		disabled?: boolean;
	}
>(({ value, onChange, placeholder, onKeyDown, disabled }, forwardedRef) => {
	const ref = React.useRef<HTMLDivElement>(null);
	const isUserInteractingRef = React.useRef<boolean>(false);

	React.useImperativeHandle(forwardedRef, () => ref.current!);

	const [isEmpty, setIsEmpty] = React.useState(value.trim() === '');

	React.useEffect(() => {
		setIsEmpty(value.trim() === '');
	}, [value]);

	React.useEffect(() => {
		if (isUserInteractingRef.current) {
			isUserInteractingRef.current = false;
			return;
		}

		if (ref.current && ref.current.innerText !== value) {
			ref.current.innerText = value;
		}
	}, [value]);

	const handleInput = () => {
		isUserInteractingRef.current = true;
		const text = ref.current?.innerText || '';
		setIsEmpty(text.trim() === '');
		onChange(text);
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
		e.preventDefault();
		const text = e.clipboardData.getData('text/plain');
		document.execCommand('insertText', false, text);
	};

	React.useEffect(() => {
		// Auto focus on mount
		if (ref.current && !disabled) {
			ref.current.focus();
		}
	}, [disabled]);

	return (
		<S.Input
			ref={ref}
			contentEditable={!disabled}
			onInput={handleInput}
			onPaste={handlePaste}
			onKeyDown={onKeyDown}
			className={disabled && isEmpty ? 'loading' : isEmpty && !disabled ? 'placeholder' : ''}
			suppressContentEditableWarning
			data-placeholder={disabled && isEmpty ? placeholder : placeholder}
			disabled={disabled}
		/>
	);
});

function AOS(props: {
	processId: string;
	active: boolean;
	onTxChange?: (newTx: Types.GQLNodeResponseType) => void;
	tabKey?: string;
}) {
	const theme = useTheme();
	const arProvider = useArweaveProvider();
	const permawebProvider = usePermawebProvider();
	const settingsProvider = useSettingsProvider();
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const wrapperRef = React.useRef<any>(null);
	const inputRef = React.useRef<HTMLDivElement>(null);
	const resultsRef = React.useRef<HTMLDivElement>(null);

	const [inputProcessId, setInputProcessId] = React.useState<string>(props.processId ?? '');
	const [loadingTx, setLoadingTx] = React.useState<boolean>(false);
	const [txResponse, setTxResponse] = React.useState<Types.GQLNodeResponseType | null>(null);
	const [_error, setError] = React.useState<string | null>(null);
	const [fullScreenMode, setFullScreenMode] = React.useState<boolean>(false);
	const [editorMode, setEditorMode] = React.useState<boolean>(true);
	const [editorData, setEditorData] = React.useState<string>('');
	const [loading, setLoading] = React.useState<boolean>(false);
	const [txOptions, setTxOptions] = React.useState<Types.GQLNodeResponseType[] | null>(null);
	const [showCreatePanel, setShowCreatePanel] = React.useState<boolean>(false);
	const [processName, setProcessName] = React.useState<string>('');
	const [pageCursor, setPageCursor] = React.useState<string | null>(null);
	const [cursorHistory, setCursorHistory] = React.useState<string[]>([]);
	const [nextCursor, setNextCursor] = React.useState<string | null>(null);
	const [perPage] = React.useState<number>(10);

	const [prompt, setPrompt] = React.useState<string>('> ');
	const [hasConnected, setHasConnected] = React.useState<boolean>(false);
	const [inputValue, setInputValue] = React.useState<string>('');
	const [commandHistory, setCommandHistory] = React.useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = React.useState<number>(-1);
	const [resultLines, setResultLines] = React.useState<
		Array<{
			text: string;
			rawText?: string;
			type: 'command' | 'output' | 'error' | 'loading' | 'success' | 'splash';
			isHtml?: boolean;
		}>
	>([]);
	const [loadingMessage, setLoadingMessage] = React.useState<boolean>(false);
	const processedCursors = React.useRef<Set<string>>(new Set());

	const ansiToHtml = React.useCallback(
		(text: string): string => {
			const ansiColors: Record<string, string> = {
				'30': theme.colors.editor.alt10, // black
				'31': theme.colors.editor.primary, // red
				'32': theme.colors.editor.alt3, // green
				'33': theme.colors.editor.alt6, // yellow
				'34': theme.colors.editor.alt4, // blue
				'35': theme.colors.editor.alt8, // magenta
				'36': theme.colors.editor.alt7, // cyan
				'37': '#EEEEEE', // white
				'90': theme.colors.editor.alt10, // bright black (gray)
				'91': theme.colors.warning.primary, // bright red
				'92': theme.colors.editor.alt3, // bright green
				'93': theme.colors.editor.alt6, // bright yellow
				'94': theme.colors.editor.alt4, // bright blue
				'95': theme.colors.editor.alt8, // bright magenta
				'96': theme.colors.editor.alt7, // bright cyan
				'97': '#EEEEEE', // bright white
			};

			let html = '';
			let currentColor = '';
			const parts = text.split(/(\x1b\[[0-9;]*m)/g);

			parts.forEach((part) => {
				if (part.match(/\x1b\[([0-9;]*)m/)) {
					const match = part.match(/\x1b\[([0-9;]*)m/);
					if (match) {
						const code = match[1];
						if (code === '0' || code === '') {
							// Reset
							if (currentColor) {
								html += '</span>';
								currentColor = '';
							}
						} else if (ansiColors[code]) {
							if (currentColor) {
								html += '</span>';
							}
							currentColor = ansiColors[code];
							html += `<span style="color: ${currentColor}">`;
						}
					}
				} else if (part) {
					html += part;
				}
			});

			if (currentColor) {
				html += '</span>';
			}

			return html;
		},
		[theme]
	);

	const addResultLine = React.useCallback(
		(
			text: string,
			type: 'command' | 'output' | 'error' | 'loading' | 'success' | 'splash' = 'output',
			isHtml = false,
			rawText?: string
		) => {
			setResultLines((prev) => [...prev, { text, rawText, type, isHtml }]);
			setTimeout(() => {
				if (resultsRef.current) {
					resultsRef.current.scrollTop = resultsRef.current.scrollHeight;
				}
			}, 0);
		},
		[]
	);

	// Re-process result lines when theme changes
	React.useEffect(() => {
		setResultLines((prev) =>
			prev.map((line) => {
				if (line.isHtml && line.rawText) {
					return { ...line, text: ansiToHtml(line.rawText) };
				}
				return line;
			})
		);
	}, [theme, ansiToHtml]);

	React.useEffect(() => {
		if (wrapperRef.current && props.active) {
			setTimeout(() => {
				wrapperRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}, 10);
		}
	}, [props.active]);

	// Load process data or list of processes
	React.useEffect(() => {
		(async function () {
			if (props.active) {
				if (inputProcessId && checkValidAddress(inputProcessId)) {
					if (!txResponse) {
						setLoadingTx(true);
						try {
							const response = await permawebProvider.libs.getGQLData({ ids: [inputProcessId] });
							const responseData = response?.data?.[0];

							setTxResponse(responseData ?? null);

							if (responseData) {
								if (props.onTxChange) props.onTxChange(responseData);
							} else {
								setError(language.txNotFound);
							}
						} catch (e: any) {
							setError(e.message ?? language.errorFetchingTx);
						}
						setLoadingTx(false);
					}
				} else {
					if (arProvider.walletAddress) {
						setLoading(true);
						try {
							const gqlResponse = await permawebProvider.libs.getGQLData({
								owners: [arProvider.walletAddress],
								tags: [{ name: TAGS.keys.type, values: [TAGS.values.process] }],
								paginator: perPage,
								...(pageCursor ? { cursor: pageCursor } : {}),
							});

							setTxOptions(gqlResponse.data);
							setNextCursor(gqlResponse.data.length >= perPage ? gqlResponse.nextCursor : null);
						} catch (e: any) {
							setError(e.message ?? language.errorOccurred);
						}
						setLoading(false);
					}
				}
			}
		})();
	}, [inputProcessId, pageCursor, arProvider.walletAddress, props.active]);

	React.useEffect(() => {
		if (props.active && inputProcessId && checkValidAddress(inputProcessId) && txResponse && !hasConnected) {
			const hasAccess = txResponse.node?.owner?.address === arProvider.walletAddress;
			if (hasAccess) {
				sendMessage(null, 'prompt');
			}
			setTimeout(() => inputRef.current?.focus(), 100);
		}
	}, [props.active, inputProcessId, txResponse, hasConnected, arProvider.walletAddress]);

	React.useEffect(() => {
		if (!props.active || !inputProcessId || !arProvider.walletAddress || !txResponse || !hasConnected) {
			return;
		}

		const hasAccess = txResponse.node.owner.address === arProvider.walletAddress;
		if (!hasAccess) {
			return;
		}

		let cursor: string | null = null;
		let canceled = false;

		(async function () {
			const args: any = {
				process: inputProcessId,
				sort: 'DESC',
				limit: 1000,
			};

			while (!canceled) {
				if (cursor) {
					args.from = cursor;
				}

				try {
					const variant = getTagValue(txResponse.node.tags, TAGS.keys.variant) as MessageVariantEnum;

					const deps = resolveLibDeps({
						variant: variant,
						permawebProvider: permawebProvider,
					});

					const results = await deps.ao.results(args);

					if (results?.edges?.length) {
						let newEdges = [];

						const variant = getTagValue(txResponse.node.tags, TAGS.keys.variant) as MessageVariantEnum;

						switch (variant) {
							case MessageVariantEnum.Legacynet:
								newEdges = results.edges
									.filter((e) => e.node?.Output?.print && !processedCursors.current.has(e.cursor))
									.sort((a, b) => JSON.parse(atob(a.cursor)).ordinate - JSON.parse(atob(b.cursor)).ordinate);
								break;
							case MessageVariantEnum.Mainnet:
								newEdges = results.edges
									.filter((e) => e.node?.Output?.print && !processedCursors.current.has(e.cursor))
									.sort((a, b) => Number(a.cursor) - Number(b.cursor));
								break;
						}

						if (newEdges.length) {
							newEdges.forEach((edge) => {
								const rawOutput = edge.node.Output.data;
								const sanitizedOutput = rawOutput.toString().replace(/\t/g, '  ');
								const htmlOutput = ansiToHtml(sanitizedOutput);
								addResultLine(htmlOutput, 'success', true, sanitizedOutput);
								processedCursors.current.add(edge.cursor);
							});

							const lastEdge = newEdges[newEdges.length - 1];
							cursor = lastEdge.cursor;
							const newPrompt = lastEdge.node.Output.prompt ?? prompt;
							setPrompt(newPrompt);
						}
					}
				} catch (e) {
					console.error(e);
				}

				await new Promise((r) => setTimeout(r, 2000));
			}
		})();

		return () => {
			canceled = true;
		};
	}, [props.active, inputProcessId, arProvider.walletAddress, txResponse, hasConnected]);

	React.useEffect(() => {
		const onFullScreenChange = () => {
			setFullScreenMode(document.fullscreenElement === wrapperRef.current);
		};
		document.addEventListener('fullscreenchange', onFullScreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', onFullScreenChange);
		};
	}, []);

	const toggleFullscreen = React.useCallback(async () => {
		const el = wrapperRef.current!;
		if (!document.fullscreenElement) {
			await el.requestFullscreen?.();
		} else {
			await document.exitFullscreen?.();
		}
	}, []);

	async function handleEditorSend(currentValue?: string) {
		const dataToSend = currentValue || editorData;
		if (dataToSend) {
			addResultLine(dataToSend, 'command');
			await sendMessage(dataToSend);
			setEditorData('');
		}
	}

	const handleSubmit = React.useCallback(async () => {
		const command = inputValue.trim();

		if (!hasConnected) {
			setHasConnected(true);
			await sendMessage(null, 'prompt');
			return;
		}

		if (command) {
			addResultLine(command, 'command');
			setCommandHistory((prev) => [...prev, command]);
			setHistoryIndex(-1);
			await resolveCommand(command);
			setInputValue('');
		}
	}, [inputValue, hasConnected, inputProcessId, addResultLine, setCommandHistory, setHistoryIndex, resolveCommand]);

	const handleInputKeyDown = React.useCallback(
		async (e: React.KeyboardEvent<HTMLDivElement>) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				await handleSubmit();
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				setCommandHistory((prev) => {
					if (prev.length === 0) return prev;
					const newIndex = historyIndex === -1 ? prev.length - 1 : Math.max(0, historyIndex - 1);
					setHistoryIndex(newIndex);
					setInputValue(prev[newIndex] || '');
					return prev;
				});
			} else if (e.key === 'ArrowDown') {
				e.preventDefault();
				if (historyIndex !== -1) {
					const newIndex = Math.min(commandHistory.length - 1, historyIndex + 1);
					if (newIndex === commandHistory.length - 1 && historyIndex === commandHistory.length - 1) {
						setHistoryIndex(-1);
						setInputValue('');
					} else {
						setHistoryIndex(newIndex);
						setInputValue(commandHistory[newIndex] || '');
					}
				}
			}
		},
		[inputValue, hasConnected, historyIndex, commandHistory, inputProcessId, prompt, addResultLine]
	);

	async function handleSearchProcessId(value: string) {
		setLoading(true);
		await new Promise((r) => setTimeout(r, 500));
		setInputProcessId(value);
		setLoading(false);
	}

	async function handleSpawnProcess() {
		if (arProvider.walletAddress && processName.trim()) {
			setLoading(true);
			setShowCreatePanel(false);
			const name = processName.trim();

			try {
				const processId = await permawebProvider.libsMainnet.createProcess({
					tags: [{ name: 'Name', value: name }],
				});

				setInputProcessId(processId);

				const updatedTx: any = {
					node: {
						id: processId,
						tags: [
							{ name: 'Type', value: 'Process' },
							{ name: 'Variant', value: MessageVariantEnum.Mainnet },
							{ name: 'Scheduler', value: AO_NODE.scheduler },
							{ name: 'Name', value: name },
						],
						owner: {
							address: arProvider.walletAddress,
						},
					},
				};

				if (props.onTxChange) props.onTxChange(updatedTx);

				setTxResponse(updatedTx);
				setShowCreatePanel(false);
				setProcessName('');
			} catch (e: any) {
				console.error(e);
			}
			setLoading(false);
		}
	}

	async function resolveCommand(data: string | null) {
		if (data && data.startsWith('.')) {
			const command = data.substring(1);
			switch (command) {
				case 'editor':
					addResultLine('Editor mode not available in this view', 'error');
					return;
				default:
					addResultLine('Command Not Supported', 'error');
					return;
			}
		}

		await sendMessage(data);
	}

	async function sendMessage(data: string | null, outputType?: 'data' | 'prompt') {
		if (txResponse) {
			setLoadingMessage(true);

			if (outputType !== 'prompt') {
				addResultLine('Loading...', 'loading');
			}

			try {
				const variant = getTagValue(txResponse.node.tags, TAGS.keys.variant) as MessageVariantEnum;

				const deps = resolveLibDeps({
					variant: variant,
					permawebProvider: permawebProvider,
				});

				const libs = resolveLibs({
					variant: variant,
					permawebProvider: permawebProvider,
				});

				const message = await libs.sendMessage({
					processId: inputProcessId,
					action: 'Eval',
					data: data ?? '',
					useRawData: true,
				});

				const response = await deps.ao.result({
					process: inputProcessId,
					message: message,
				});

				// Mark message as processed to prevent duplicate results
				if (message) {
					processedCursors.current.add(message);
				}

				setLoadingMessage(false);
				setResultLines((prev) => prev.filter((line) => line.type !== 'loading'));

				if (!outputType || outputType === 'data') {
					let rawOutput = '';
					let isError = false;

					if (response?.Output?.data) {
						if (typeof response?.Output?.data === 'object') {
							if (response?.Output?.data?.output) {
								rawOutput = response.Output.data.output;
							}
						} else {
							rawOutput = response.Output.data;
						}
					} else {
						if (response?.Error) {
							rawOutput = response.Error;
							isError = true;
						}
					}

					const sanitizedOutput = rawOutput.toString().replace(/\t/g, '  ');
					const htmlOutput = ansiToHtml(sanitizedOutput);
					addResultLine(htmlOutput, isError ? 'error' : 'success', true, sanitizedOutput);
				}

				const newPrompt = response?.Output?.prompt ?? prompt;
				setPrompt(newPrompt);
			} catch (e: any) {
				console.error(e);
				setLoadingMessage(false);
				setResultLines((prev) => prev.filter((line) => line.type !== 'loading'));
				addResultLine(e.message || 'Error occurred', 'error');
			}

			if (outputType === 'prompt' && !hasConnected) {
				setHasConnected(true);
			}
		}
	}

	function handleNext() {
		if (nextCursor) {
			setCursorHistory((prevHistory) => [...prevHistory, pageCursor]);
			setPageCursor(nextCursor);
		}
	}

	function handlePrevious() {
		if (cursorHistory.length > 0) {
			const newHistory = [...cursorHistory];
			const previousCursor = newHistory.pop();
			setCursorHistory(newHistory);
			setPageCursor(previousCursor ?? null);
		}
	}

	const hasAccess =
		txResponse && arProvider.walletAddress && txResponse.node?.owner?.address === arProvider.walletAddress;

	if (!arProvider.walletAddress) {
		return props.active ? <WalletBlock /> : null;
	}

	if (!inputProcessId || !checkValidAddress(inputProcessId)) {
		return (
			<>
				<S.Wrapper ref={wrapperRef} fullScreenMode={false} useFixedHeight={false}>
					<S.ConsoleWrapper editorMode={false}>
						<S.OptionsWrapper className={'border-wrapper-alt1'}>
							<S.OptionsHeader>
								<p>{language.connectToAOS}</p>
							</S.OptionsHeader>
							<S.OptionsCreate>
								<Button
									type={'alt1'}
									label={loading ? `${language.creatingProcess}...` : language.createNewProcess}
									handlePress={() => setShowCreatePanel(true)}
									loading={loading}
									disabled={loading}
									height={42.5}
									fullWidth
								/>
							</S.OptionsCreate>
							<S.OptionsDivider>
								<div className={'aos-options-divider'} />
								<span>Or</span>
								<div className={'aos-options-divider'} />
							</S.OptionsDivider>
							<S.OptionsInput>
								<FormField
									value={inputProcessId}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchProcessId(e.target.value)}
									placeholder={language.searchProcessId}
									invalid={{ status: inputProcessId ? !checkValidAddress(inputProcessId) : false, message: null }}
									disabled={loadingTx || loading}
									hideErrorMessage
									sm
								/>
							</S.OptionsInput>
							{loading && !txOptions ? (
								<S.OptionsLoader>
									<Loader sm relative />
								</S.OptionsLoader>
							) : (
								<>
									{txOptions && (
										<>
											<S.Options>
												{txOptions.map((tx: Types.GQLNodeResponseType, index: number) => {
													const name = getTagValue(tx.node.tags, 'Name');
													return (
														<Button
															key={index}
															type={'primary'}
															label={`${name ?? formatAddress(tx.node.id, false)} (${getTagValue(
																tx.node.tags,
																'Variant'
															)})`}
															handlePress={() => setInputProcessId(tx.node.id)}
															disabled={loading}
															height={42.5}
															fullWidth
														/>
													);
												})}
											</S.Options>
											<S.OptionsPaginator>
												<Button
													type={'alt3'}
													label={language.previous}
													handlePress={handlePrevious}
													disabled={cursorHistory.length === 0 || loading}
												/>
												<Button
													type={'alt3'}
													label={language.next}
													handlePress={handleNext}
													disabled={!nextCursor || loading}
												/>
											</S.OptionsPaginator>
										</>
									)}
								</>
							)}
						</S.OptionsWrapper>
					</S.ConsoleWrapper>
				</S.Wrapper>
				<Panel
					open={showCreatePanel}
					width={550}
					handleClose={() => {
						setShowCreatePanel(false);
						setProcessName('');
					}}
					header={language.createNewProcess}
				>
					<S.PanelContent onSubmit={handleSpawnProcess} className={'modal-wrapper'}>
						<FormField
							label={language.processName || 'Process Name'}
							value={processName}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProcessName(e.target.value)}
							placeholder={language.enterProcessName || 'Enter Process Name'}
							invalid={{ status: false, message: null }}
							disabled={loading}
						/>
						<Button
							type={'alt1'}
							label={loading ? `${language.creatingProcess}...` : language.create}
							handlePress={handleSpawnProcess}
							disabled={loading || !processName.trim()}
							height={42.5}
							fullWidth
							formSubmit
						/>
					</S.PanelContent>
				</Panel>
			</>
		);
	}

	if (checkValidAddress(inputProcessId) && (!txResponse || !hasConnected)) {
		return (
			<S.Wrapper ref={wrapperRef} fullScreenMode={false} useFixedHeight={false}>
				<S.LoadingWrapper className={'fade-in border-wrapper-alt3'}>
					<span>Loading AOS...</span>
					<Loader xSm relative />
				</S.LoadingWrapper>
			</S.Wrapper>
		);
	}

	return (
		<>
			{arProvider.walletAddress ? (
				<S.Wrapper ref={wrapperRef} fullScreenMode={fullScreenMode} useFixedHeight={false}>
					{editorMode && (
						<S.Editor className={'fade-in'}>
							<Editor
								initialData={'-- AOS Editor'}
								setEditorData={(data: string) => setEditorData(data)}
								handleSubmit={handleEditorSend}
								language={'lua'}
								loading={loadingMessage}
								noFullScreen
								useFixedHeight
							/>
						</S.Editor>
					)}
					<S.ConsoleWrapper editorMode={editorMode}>
						<S.ResultsWrapper ref={resultsRef} className={'fade-in scroll-wrapper'}>
							<S.SplashScreen className={'fade-in border-wrapper-alt3'}>
								<S.SplashScreenHeader>{`AOS`}</S.SplashScreenHeader>
								<S.SplashScreenLine>
									<p>Welcome to AOS: Your operating system for AO, the decentralized open access supercomputer.</p>
								</S.SplashScreenLine>
								<S.SplashScreenLine>
									<p>
										{`Wallet Address: `}
										<span>{arProvider.walletAddress}</span>
									</p>
								</S.SplashScreenLine>
								<S.SplashScreenDivider />
								<S.SplashScreenLine>
									<p>
										{`Network: `}
										<span>
											{getTagValue(txResponse?.node?.tags ?? [], 'Variant') === 'ao.N.1' ? 'Mainnet' : 'Legacynet'}
										</span>
									</p>
								</S.SplashScreenLine>
								<S.SplashScreenLine>
									<p>
										{`Process ID: `}
										<span>{txResponse?.node?.id ?? '-'}</span>
									</p>
								</S.SplashScreenLine>
								<S.SplashScreenLine>
									<p>
										{`Node: `}
										<span>{settingsProvider.settings.nodes.find((node) => node.active)?.url ?? '-'}</span>
									</p>
								</S.SplashScreenLine>
								<S.SplashScreenLine>
									<p>
										{`Scheduler: `}
										<span>{getTagValue(txResponse?.node?.tags ?? [], 'Scheduler') ?? '-'}</span>
									</p>
								</S.SplashScreenLine>
							</S.SplashScreen>
							{resultLines.map((line, index) =>
								line.isHtml ? (
									<S.ResultLine
										key={index}
										className={`result-line ${line.type === 'command' ? 'result-command' : ''} ${
											line.type === 'error' ? 'result-error' : ''
										} ${line.type === 'loading' ? 'result-loading' : ''} ${
											line.type === 'success' ? 'result-success' : ''
										} ${line.type === 'splash' ? 'result-success' : ''}`}
									>
										{line.type === 'loading' && <S.Spinner />}
										{line.type === 'loading' ? (
											<S.LoadingText>{line.text?.replace(/\.\.\.$/g, '') || 'Loading'}</S.LoadingText>
										) : (
											<span dangerouslySetInnerHTML={{ __html: line.text || '\u00A0' }} />
										)}
									</S.ResultLine>
								) : (
									<S.ResultLine
										key={index}
										className={`result-line ${line.type === 'command' ? 'result-command' : ''} ${
											line.type === 'error' ? 'result-error' : ''
										} ${line.type === 'loading' ? 'result-loading' : ''} ${
											line.type === 'success' ? 'result-success' : ''
										} ${line.type === 'splash' ? 'result-success' : ''}`}
									>
										{line.type === 'loading' && <S.Spinner />}
										{line.type === 'loading' ? (
											<S.LoadingText>{line.text?.replace(/\.\.\.$/g, '') || 'Loading'}</S.LoadingText>
										) : (
											<span>{line.text || '\u00A0'}</span>
										)}
									</S.ResultLine>
								)
							)}
						</S.ResultsWrapper>
						<S.InputWrapper
							className={'fade-in border-wrapper-alt3'}
							disabled={(!hasAccess || loadingMessage) && !editorMode}
							onClick={() => inputRef.current?.focus()}
						>
							<Input
								ref={inputRef}
								value={inputValue}
								onChange={(value) => setInputValue(value)}
								onKeyDown={handleInputKeyDown}
								placeholder={loadingMessage ? 'Loading...' : !hasConnected ? 'Press Enter' : 'AOS Command'}
								disabled={!hasAccess || loadingMessage}
							/>
							<S.InputActionsWrapper>
								<S.InputActionsSection>
									<IconButton
										type={'primary'}
										src={ASSETS.code}
										handlePress={() => setEditorMode((prev) => !prev)}
										dimensions={{
											wrapper: 25,
											icon: 15,
										}}
										disabled={!hasConnected}
										tooltip={editorMode ? language.closeEditor : language.openEditor}
									/>
									<IconButton
										type={'primary'}
										src={ASSETS.fullscreen}
										handlePress={toggleFullscreen}
										dimensions={{
											wrapper: 25,
											icon: 15,
										}}
										tooltip={fullScreenMode ? language.exitFullScreen : language.enterFullScreen}
									/>
								</S.InputActionsSection>
								<S.InputActionsSection>
									<IconButton
										type={'primary'}
										src={ASSETS.send}
										handlePress={handleSubmit}
										dimensions={{
											wrapper: 25,
											icon: 15,
										}}
										disabled={!hasConnected || loadingMessage || !inputValue}
										tooltip={language.run}
									/>
								</S.InputActionsSection>
							</S.InputActionsWrapper>
						</S.InputWrapper>
					</S.ConsoleWrapper>
				</S.Wrapper>
			) : (
				<>{props.active && <WalletBlock />}</>
			)}
		</>
	);
}

export default React.memo(AOS);

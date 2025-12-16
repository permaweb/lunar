import React from 'react';
import { DefaultTheme, useTheme } from 'styled-components';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { IconButton } from 'components/atoms/IconButton';
import { Loader } from 'components/atoms/Loader';
import { Notification } from 'components/atoms/Notification';
import { Editor } from 'components/molecules/Editor';
import { ASSETS, TAGS } from 'helpers/config';
import { GQLNodeResponseType, MessageVariantEnum } from 'helpers/types';
import { checkValidAddress, formatAddress, getTagValue, resolveLibDeps, resolveLibs } from 'helpers/utils';
import { useArweaveProvider } from 'providers/ArweaveProvider';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';
import { WalletBlock } from 'wallet/WalletBlock';

import 'xterm/css/xterm.css';

import * as S from './styles';

function ConsoleInstance(props: {
	processId: string;
	active: boolean;
	onTxChange?: (newTx: GQLNodeResponseType) => void;
	tabKey?: string;
}) {
	const theme = useTheme();

	const arProvider = useArweaveProvider();
	const permawebProvider = usePermawebProvider();
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const promptRef = React.useRef(null);
	const loadingRef = React.useRef(false);
	const consoleRef = React.useRef(null);

	const terminalRef = React.useRef(null);
	const logsRef = React.useRef(null);
	const hasConnectedRef = React.useRef(false);
	const terminalInstance = React.useRef(null);
	const logsInstance = React.useRef(null);

	const mainFitAddon = React.useRef<FitAddon | null>(null);
	const logsFitAddon = React.useRef<FitAddon | null>(null);
	const refreshLineRef = React.useRef<(() => void) | null>(null);
	const commandBufferRef = React.useRef<string>('');
	const cursorPositionRef = React.useRef<number>(0);
	const currentRowRef = React.useRef<number>(1);
	const isCurrentlyWrappedRef = React.useRef<boolean>(false);

	const [inputProcessId, setInputProcessId] = React.useState<string>(props.processId ?? '');
	const [loadingTx, setLoadingTx] = React.useState<boolean>(false);
	const [txResponse, setTxResponse] = React.useState<GQLNodeResponseType | null>(null);
	const [loadingOptions, setLoadingOptions] = React.useState<boolean>(false);
	const [txOptions, setTxOptions] = React.useState<GQLNodeResponseType[] | null>(null);

	const [prompt, setPrompt] = React.useState<string>('> ');
	const [hasConnected, setHasConnected] = React.useState<boolean>(false);
	const [fullScreenMode, setFullScreenMode] = React.useState<boolean>(false);
	const [editorMode, setEditorMode] = React.useState<boolean>(false);
	const [editorData, setEditorData] = React.useState<string>('');
	const [error, setError] = React.useState<string | null>(null);
	const [showResults, setShowResults] = React.useState<boolean>(false);

	const [pageCursor, setPageCursor] = React.useState<string | null>(null);
	const [cursorHistory, setCursorHistory] = React.useState([]);
	const [nextCursor, setNextCursor] = React.useState<string | null>(null);
	const [perPage, _setPerPage] = React.useState<number>(10);

	const [loadingMessage, setLoadingMessage] = React.useState<boolean>(false);

	const toggleFullscreen = React.useCallback(async () => {
		const el = consoleRef.current!;
		if (!document.fullscreenElement) {
			await el.requestFullscreen?.();
		} else {
			await document.exitFullscreen?.();
		}
	}, []);

	React.useEffect(() => {
		promptRef.current = prompt;
	}, [prompt]);

	React.useEffect(() => {
		if (hasConnected) {
			const onKeyDown = (e: KeyboardEvent) => {
				if (e.ctrlKey && (e.key === 'e' || e.key === 'E')) {
					e.preventDefault();
					setEditorMode((prev) => !prev);
				}
			};

			window.addEventListener('keydown', onKeyDown, true);
			return () => {
				window.removeEventListener('keydown', onKeyDown, true);
			};
		}
	}, [hasConnected]);

	React.useEffect(() => {
		const onFullScreenChange = () => {
			setFullScreenMode(document.fullscreenElement === consoleRef.current);
		};
		document.addEventListener('fullscreenchange', onFullScreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', onFullScreenChange);
		};
	}, []);

	React.useEffect(() => {
		const ro = new ResizeObserver(() => {
			if (mainFitAddon.current) {
				mainFitAddon.current.fit();
				// Refresh the current line after resize to fix wrapping
				if (refreshLineRef.current && hasConnectedRef.current) {
					setTimeout(() => refreshLineRef.current?.(), 0);
				}
			}
			if (logsFitAddon.current) logsFitAddon.current.fit();
		});
		if (terminalRef.current) ro.observe(terminalRef.current);
		if (logsRef.current) ro.observe(logsRef.current);
		return () => ro.disconnect();
	}, []);

	React.useEffect(() => {
		// Use requestAnimationFrame to wait for DOM layout to complete
		const frame = requestAnimationFrame(() => {
			if (mainFitAddon.current) {
				mainFitAddon.current.fit();
				// Refresh the current line after UI changes to fix wrapping
				if (refreshLineRef.current && hasConnectedRef.current) {
					setTimeout(() => refreshLineRef.current?.(), 0);
				}
			}
			if (logsFitAddon.current) logsFitAddon.current.fit();
		});

		return () => cancelAnimationFrame(frame);
	}, [editorMode, showResults, fullScreenMode]);

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
		const onKeyDown = (e: KeyboardEvent) => {
			if (!editorMode || !editorData) return;

			if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
				e.preventDefault();
				handleEditorSend();
			}
		};

		window.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
		};
	}, [editorMode, editorData]);

	React.useEffect(() => {
		(async function () {
			if (props.active) {
				if (inputProcessId && checkValidAddress(inputProcessId)) {
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
				} else {
					if (arProvider.walletAddress) {
						setLoadingOptions(true);
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
						setLoadingOptions(false);
					}
				}
			}
		})();
	}, [inputProcessId, pageCursor, arProvider.walletAddress, props.active]);

	React.useEffect(() => {
		(async function () {
			if (
				props.active &&
				terminalRef.current &&
				arProvider.wallet &&
				checkValidAddress(inputProcessId) &&
				txResponse &&
				!terminalInstance.current
			) {
				await document.fonts.ready;

				terminalInstance.current = new Terminal({
					cursorBlink: false,
					fontFamily: theme.typography.family.alt2,
					fontSize: 12,
					fontWeight: 700,
					theme: getTheme(theme),
				});

				const addon = new FitAddon();
				mainFitAddon.current = addon;

				terminalInstance.current.loadAddon(mainFitAddon.current);
				terminalInstance.current.open(terminalRef.current);
				mainFitAddon.current.fit();

				const handleResize = () => {
					mainFitAddon.current?.fit();
				};

				window.addEventListener('resize', handleResize);

				terminalInstance.current.write(`\x1b[32mWelcome to AOS\x1b[0m\r\n\r\n`);
				terminalInstance.current.write(`\x1b[90mProcess ID:\x1b[0m \x1b[32m${inputProcessId}\x1b[0m\r\n\r\n`);
				terminalInstance.current.write(`\x1b[90mToggle the editor with: (Ctrl + E) or '.editor'\x1b[0m\r\n`);
				terminalInstance.current.write(`\r\n\x1b[32mPress Enter\x1b[0m\r\n`);

				hideCursor();
				terminalInstance.current.focus();

				const commandHistory: string[] = [];
				let historyIndex: number = commandHistory.length;

				const refreshLine = () => {
					const term = terminalInstance.current!;
					if (!term) return;

					const commandBuffer = commandBufferRef.current;
					const cursorPosition = cursorPositionRef.current;
					const currentRow = currentRowRef.current;
					const isCurrentlyWrapped = isCurrentlyWrappedRef.current;

					const rawPrompt = promptRef.current;
					const cleanPrompt = stripAnsi(rawPrompt);
					const cols = term.cols;

					// Calculate total visual length (prompt + buffer)
					const totalLength = cleanPrompt.length + commandBuffer.length;
					const totalLines = Math.max(1, Math.ceil(totalLength / cols));

					// Determine if we need to add new lines first
					const needsMoreLines = totalLines > currentRow;
					if (needsMoreLines && isCurrentlyWrapped) {
						// We're at the end, add the new lines we need
						const linesToAdd = totalLines - currentRow;
						for (let i = 0; i < linesToAdd; i++) {
							term.write('\r\n');
						}
						// Move back up to where we started
						term.write(`\x1b[${linesToAdd}A\r`);
					}

					// Move cursor to start of input area
					if (isCurrentlyWrapped && currentRow > 1) {
						term.write(`\x1b[${currentRow - 1}A\r`);
					} else {
						term.write('\r');
					}

					// Clear existing lines
					const linesToClear = Math.max(currentRow, totalLines);
					for (let i = 0; i < linesToClear; i++) {
						term.write('\x1b[2K'); // Clear line
						if (i < linesToClear - 1) {
							term.write('\x1b[E'); // Move to beginning of next line (down + CR)
						}
					}

					// Move back to start
					if (linesToClear > 1) {
						term.write(`\x1b[${linesToClear - 1}A\r`);
					} else {
						term.write('\r');
					}

					// Render content
					let bufferOffset = 0;
					for (let lineNum = 0; lineNum < totalLines; lineNum++) {
						if (lineNum === 0) {
							// First line: prompt + beginning of command
							const spaceForCommand = cols - cleanPrompt.length;
							const commandSlice = commandBuffer.substring(0, spaceForCommand);
							term.write(rawPrompt + commandSlice);
							bufferOffset = spaceForCommand;
						} else {
							// Continuation lines: just command text
							const commandSlice = commandBuffer.substring(bufferOffset, bufferOffset + cols);
							term.write(commandSlice);
							bufferOffset += cols;
						}

						if (lineNum < totalLines - 1) {
							term.write('\x1b[E'); // Move to beginning of next line
						}
					}

					// Position cursor at the correct location
					const cursorTotalOffset = cleanPrompt.length + cursorPosition;
					const cursorRow = Math.floor(cursorTotalOffset / cols);
					const cursorCol = cursorTotalOffset % cols;

					// Move up if needed (we're currently at the last line)
					const rowsToMoveUp = totalLines - 1 - cursorRow;
					if (rowsToMoveUp > 0) {
						term.write(`\x1b[${rowsToMoveUp}A`);
					}

					// Move to column
					term.write('\r');
					if (cursorCol > 0) {
						term.write(`\x1b[${cursorCol}C`);
					}

					currentRowRef.current = totalLines;
					isCurrentlyWrappedRef.current = totalLines > 1;
				};

				// Store reference so it can be called on resize
				refreshLineRef.current = refreshLine;

				terminalInstance.current.onData(async (data: string) => {
					if (loadingRef.current) return;

					/* Arrow / Control Sequences */
					if (data.startsWith('\x1b') && hasConnectedRef.current) {
						switch (data) {
							case '\x1b[A' /* Up */:
								historyIndex = Math.max(0, historyIndex - 1);
								commandBufferRef.current = commandHistory[historyIndex] || '';
								cursorPositionRef.current = commandBufferRef.current.length;
								refreshLine();
								return;
							case '\x1b[B' /* Down */:
								historyIndex = Math.min(commandHistory.length, historyIndex + 1);
								commandBufferRef.current = commandHistory[historyIndex] || '';
								cursorPositionRef.current = commandBufferRef.current.length;
								refreshLine();
								return;
							case '\x1b[D' /* Left */:
								if (cursorPositionRef.current > 0) {
									cursorPositionRef.current--;
									refreshLine();
								}
								return;
							case '\x1b[C' /* Right */:
								if (cursorPositionRef.current < commandBufferRef.current.length) {
									cursorPositionRef.current++;
									refreshLine();
								}
								return;
							default:
								return;
						}
					}

					/* Enter */
					if (data === '\r') {
						if (!hasConnectedRef.current) {
							hasConnectedRef.current = true;
							setHasConnected(true);
							await sendMessage(null, 'prompt');
							return;
						} else {
							if (commandBufferRef.current.trim()) {
								terminalInstance.current.write(`\r\x1b[2K\x1b[90m${commandBufferRef.current}\x1b[0m\r\n`);
								commandHistory.push(commandBufferRef.current.trim());
								historyIndex = commandHistory.length;
								await resolveCommand(commandBufferRef.current);
							} else {
								terminalInstance.current.write(`\r\n${promptRef.current}`);
							}
							commandBufferRef.current = '';
							cursorPositionRef.current = 0;
							currentRowRef.current = 1;
							isCurrentlyWrappedRef.current = false;
							return;
						}
					}

					if (data === '\u007F') {
						if (cursorPositionRef.current > 0) {
							commandBufferRef.current =
								commandBufferRef.current.slice(0, cursorPositionRef.current - 1) +
								commandBufferRef.current.slice(cursorPositionRef.current);
							cursorPositionRef.current--;
							refreshLine();
						}
						return;
					}

					/* Insert */
					if (hasConnectedRef.current) {
						commandBufferRef.current =
							commandBufferRef.current.slice(0, cursorPositionRef.current) +
							data +
							commandBufferRef.current.slice(cursorPositionRef.current);
						cursorPositionRef.current++;
						refreshLine();
					}
				});
			}
		})();

		return () => {
			// Don't dispose terminal instance - keep it alive for tab switching
		};
	}, [inputProcessId, txResponse, arProvider.wallet]);

	function stripAnsi(input: string): string {
		return input.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
	}

	React.useEffect(() => {
		if (!arProvider.walletAddress || !txResponse) return;
		const hasAccess = txResponse?.node?.owner?.address === arProvider.walletAddress;
		if (terminalInstance.current) {
			terminalInstance.current.options.disableStdin = !hasAccess;

			if (!hasAccess) {
				terminalInstance.current.write(`\r\n\x1b[91mYou do not have access to connect to this process\x1b[0m\r\n`);
			}
		}
	}, [arProvider.walletAddress, txResponse]);

	React.useEffect(() => {
		if (!showResults || !hasConnected || !logsRef.current) return;

		if (!logsInstance.current) {
			logsInstance.current = new Terminal({
				cursorBlink: false,
				fontFamily: theme.typography.family.alt2,
				fontSize: 13,
				fontWeight: 700,
				theme: getTheme(theme, { useAltBackground: false }),
			});

			const addon = new FitAddon();
			logsFitAddon.current = addon;

			logsInstance.current.loadAddon(logsFitAddon.current);
			logsInstance.current.writeln('\x1b[90mResults\x1b[0m');
			logsInstance.current.options.disableStdin = true;
			hideCursor(logsInstance);
		}

		if (logsRef.current) {
			logsInstance.current.open(logsRef.current);
		}

		logsFitAddon.current.fit();

		return () => {
			if (logsInstance.current) {
				logsInstance.current.dispose();
			}
		};
	}, [showResults, hasConnected]);

	React.useEffect(() => {
		if (!props.active || !inputProcessId || !arProvider.walletAddress || !txResponse || !hasConnected || !showResults) {
			return;
		}

		const hasAccess = txResponse.node.owner.address === arProvider.walletAddress;
		if (!hasAccess) {
			return;
		}

		let cursor: string | null = null;
		let canceled = false;
		let isFirstIteration = true;

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
						const newEdges = results.edges
							.filter((e) => e.node?.Output?.print)
							.sort((a, b) => JSON.parse(atob(a.cursor)).ordinate - JSON.parse(atob(b.cursor)).ordinate);

						if (newEdges.length) {
							if (isFirstIteration) {
								/* On the very first run only bump the cursor */
								cursor = newEdges[newEdges.length - 1].cursor;
								isFirstIteration = false;
							} else {
								newEdges.forEach((edge) => {
									const term = logsInstance.current!;
									const lines = edge.node.Output.data.split('\n');

									lines.forEach((line) => {
										term.write('\x1b[2K\r');
										term.writeln(line);
									});
								});

								const lastEdge = newEdges[newEdges.length - 1];

								cursor = lastEdge.cursor;
								const newPrompt = lastEdge.node.Output.prompt ?? promptRef.current;
								setPrompt(newPrompt);
								terminalInstance.current.write(`\x1b[2K\r${newPrompt}`);
							}
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
	}, [props.active, inputProcessId, arProvider.walletAddress, txResponse, hasConnected, showResults]);

	React.useEffect(() => {
		if (terminalInstance.current) {
			terminalInstance.current.options.theme = getTheme(theme);
			terminalInstance.current.refresh(0, terminalInstance.current.rows - 1);
		}
		if (logsInstance.current) {
			logsInstance.current.options.theme = getTheme(theme, { useAltBackground: false });
			logsInstance.current.refresh(0, logsInstance.current.rows - 1);
		}
	}, [theme]);

	React.useEffect(() => {
		if (consoleRef.current && props.active) {
			setTimeout(() => {
				consoleRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}, 10);
		}
	}, [props.active]);

	async function handleEditorSend() {
		if (editorData) await sendMessage(editorData);
	}

	async function resolveCommand(data: string | null) {
		if (data.startsWith('.')) {
			const command = data.substring(1);

			switch (command) {
				case 'editor':
					setEditorMode((prev) => !prev);
					return;
				default:
					terminalInstance.current.write(`\r\n\x1b[91mCommand Not Supported\x1b[0m\r\n`);
					terminalInstance.current.write('\r');
					terminalInstance.current.write(promptRef.current);
					return;
			}
		}

		await sendMessage(data);
	}

	async function sendMessage(data: string | null, outputType?: 'data' | 'prompt') {
		if (terminalInstance.current && txResponse) {
			startLoader();

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

				stopLoader();

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
					clearLine();

					sanitizedOutput.split('\n').forEach((line: string) => {
						if (isError) {
							terminalInstance.current.write(`\x1b[91m${line}\x1b[0m\r\n`);
						} else {
							terminalInstance.current.write(line + '\r\n');
						}
					});
					terminalInstance.current.write('\r\n');
				}

				const newPrompt = response?.Output?.prompt ?? promptRef.current;

				setPrompt(newPrompt);
				terminalInstance.current.write('\r');
				terminalInstance.current.write(newPrompt);
			} catch (e: any) {
				console.error(e);
				stopLoader();
				terminalInstance.current.write(prompt);
			}
		}
	}

	function getTheme(currentTheme: DefaultTheme, args?: { useAltBackground?: boolean }) {
		return {
			background: args?.useAltBackground
				? currentTheme.colors.view.background
				: currentTheme.colors.container.alt1.background,
			foreground: currentTheme.colors.font.primary,
			cursor: currentTheme.colors.font.alt2,
			cursorAccent: currentTheme.colors.font.alt4,
			black: currentTheme.colors.editor.alt10,
			red: currentTheme.colors.editor.primary,
			green: currentTheme.colors.editor.alt3,
			yellow: currentTheme.colors.editor.alt6,
			blue: currentTheme.colors.editor.alt4,
			magenta: currentTheme.colors.editor.alt8,
			cyan: currentTheme.colors.editor.alt7,
			white: '#EEEEEE',
			brightBlack: currentTheme.colors.editor.alt10,
			brightRed: currentTheme.colors.warning.primary,
			brightGreen: currentTheme.colors.editor.alt3,
			brightYellow: currentTheme.colors.editor.alt6,
			brightBlue: currentTheme.colors.editor.alt4,
			brightMagenta: currentTheme.colors.editor.alt8,
			brightCyan: currentTheme.colors.editor.alt7,
			brightWhite: '#EEEEEE',
			selectionBackground: '#4A78DA',
			selectionForeground: '#FAFAFA',
		};
	}

	const spinnerFrames = ['Loading      ', 'Loading.     ', 'Loading..    ', 'Loading...   '];
	let spinnerInterval: ReturnType<typeof setInterval> | null = null;
	let currentFrame = 0;

	function stopSpinner() {
		if (spinnerInterval) {
			clearInterval(spinnerInterval);
			spinnerInterval = null;
		}
		clearLine();

		showCursor();
	}

	function startLoader() {
		setLoadingMessage(true);
		loadingRef.current = true;
		terminalInstance.current.write('\r\n');
		hideCursor();
		spinnerInterval = setInterval(() => {
			clearLine();
			terminalInstance.current.write(`\x1b[32m${spinnerFrames[currentFrame]}\x1b[0m\r`);
			currentFrame = (currentFrame + 1) % spinnerFrames.length;
		}, 135);
	}

	function stopLoader() {
		stopSpinner();
		loadingRef.current = false;
		setLoadingMessage(false);
		clearLine();

		showCursor();
	}

	function clearLine() {
		terminalInstance.current.write('\r\x1b[2K');
	}

	function showCursor() {
		terminalInstance.current.write('\x1b[?25h');
	}

	function hideCursor(instance?: any) {
		const console = instance ?? terminalInstance;
		console.current.write('\x1b[?25l');
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
			setPageCursor(previousCursor);
		}
	}

	function getPaginator() {
		return (
			<S.OptionsPaginator>
				<Button
					type={'alt3'}
					label={language.previous}
					handlePress={handlePrevious}
					disabled={cursorHistory.length === 0 || loadingOptions}
				/>
				<Button type={'alt3'} label={language.next} handlePress={handleNext} disabled={!nextCursor || loadingOptions} />
			</S.OptionsPaginator>
		);
	}

	function getConsole() {
		if (!arProvider.walletAddress) {
			return <WalletBlock />;
		}

		if (!inputProcessId) {
			return (
				<S.OptionsWrapper className={'border-wrapper-alt1 scroll-wrapper'}>
					<S.OptionsHeader>
						<p>{language.connectToAOS}</p>
						{(loadingTx || loadingOptions) && <span>{`${language.loading}...`}</span>}
					</S.OptionsHeader>
					<S.OptionsInput>
						<FormField
							value={inputProcessId}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputProcessId(e.target.value)}
							placeholder={language.processId}
							invalid={{ status: inputProcessId ? !checkValidAddress(inputProcessId) : false, message: null }}
							disabled={loadingTx}
							hideErrorMessage
							sm
						/>
					</S.OptionsInput>
					{loadingOptions && !txOptions ? (
						<S.OptionsLoader>
							<Loader sm relative />
						</S.OptionsLoader>
					) : (
						<>
							{txOptions && (
								<>
									<S.OptionsHeader>
										<p>{language.yourProcesses}</p>
									</S.OptionsHeader>
									<S.Options>
										{txOptions.map((tx: GQLNodeResponseType, index: number) => {
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
													disabled={loadingOptions}
													height={42.5}
													fullWidth
												/>
											);
										})}
									</S.Options>
									{getPaginator()}
								</>
							)}
						</>
					)}
				</S.OptionsWrapper>
			);
		}

		return (
			<S.ConsoleWrapper editorMode={editorMode}>
				{txResponse ? (
					<>
						<S.Console className={'border-wrapper-alt3 scroll-wrapper'} ref={terminalRef} />
						{hasConnected && showResults && (
							<S.Console className={'border-wrapper-alt3 scroll-wrapper'} ref={logsRef} />
						)}
						<S.ActionsWrapper fullScreenMode={fullScreenMode}>
							<IconButton
								type={'alt1'}
								src={showResults ? ASSETS.arrowRight : ASSETS.arrowLeft}
								handlePress={() => setShowResults((prev) => !prev)}
								dimensions={{
									wrapper: 25,
									icon: 12.5,
								}}
								disabled={!hasConnected}
								tooltip={showResults ? language.hideResults : language.showResults}
								tooltipPosition={'top-right'}
							/>
							<IconButton
								type={'alt1'}
								src={ASSETS.code}
								handlePress={() => setEditorMode((prev) => !prev)}
								dimensions={{
									wrapper: 25,
									icon: 12.5,
								}}
								disabled={!hasConnected}
								tooltip={editorMode ? language.closeEditor : language.openEditor}
								tooltipPosition={'top-right'}
							/>
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
						</S.ActionsWrapper>
					</>
				) : (
					<S.LoadingWrapper className={'border-wrapper-alt2'}>
						<Loader sm relative />
					</S.LoadingWrapper>
				)}
			</S.ConsoleWrapper>
		);
	}

	return (
		<>
			{arProvider.walletAddress ? (
				<>
					<S.Wrapper
						ref={consoleRef}
						fullScreenMode={fullScreenMode}
						useFixedHeight={false}
						style={{ display: props.active ? 'flex' : 'none' }}
					>
						{editorMode && (
							<S.Editor className={'fade-in'}>
								<Editor
									initialData={''}
									setEditorData={(data: string) => setEditorData(data)}
									language={'lua'}
									loading={loadingMessage}
									noFullScreen
									useFixedHeight
								/>
								<S.LoadWrapper fullScreenMode={fullScreenMode}>
									<IconButton
										type={'alt1'}
										src={ASSETS.checkmark}
										handlePress={() => handleEditorSend()}
										dimensions={{
											wrapper: 25,
											icon: 12.5,
										}}
										disabled={!editorData}
										tooltip={`${language.load} (Ctrl + L)`}
										tooltipPosition={'top-right'}
									/>
								</S.LoadWrapper>
							</S.Editor>
						)}
						{getConsole()}
					</S.Wrapper>
					{props.active && error && (
						<Notification
							type={'warning'}
							message={error}
							callback={() => {
								setError(null);
								setInputProcessId('');
							}}
						/>
					)}
				</>
			) : (
				props.active && <WalletBlock />
			)}
		</>
	);
}

export default React.memo(ConsoleInstance);

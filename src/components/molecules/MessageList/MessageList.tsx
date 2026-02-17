import React from 'react';
import { flushSync } from 'react-dom';
import { ReactSVG } from 'react-svg';
import { useTheme } from 'styled-components';

import { Types } from '@permaweb/libs';

import { Button } from 'components/atoms/Button';
import { Calendar } from 'components/atoms/Calendar';
import { FormField } from 'components/atoms/FormField';
import { Loader } from 'components/atoms/Loader';
import { Panel } from 'components/atoms/Panel';
import { TxAddress } from 'components/atoms/TxAddress';
import { JSONReader } from 'components/molecules/JSONReader';
import { ASSETS, DEFAULT_ACTIONS, DEFAULT_MESSAGE_TAGS, MINT_ACTIONS, STORAGE, TAGS } from 'helpers/config';
import { arweaveEndpoint, getTxEndpoint } from 'helpers/endpoints';
import { MessageFilterType, MessageVariantEnum, TransactionType } from 'helpers/types';
import {
	checkValidAddress,
	formatAddress,
	formatCount,
	getRelativeDate,
	getTagValue,
	lowercaseTagKeys,
	removeCommitments,
	resolveLibDeps,
	resolveMessageId,
} from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';

import { Editor } from '../Editor';

import * as S from './styles';

function Message(props: {
	element: Types.GQLNodeResponseType;
	type: TransactionType;
	variant?: MessageVariantEnum;
	currentFilter: MessageFilterType;
	parentId: string;
	handleOpen: (id: string) => void;
	lastChild?: boolean;
	isOverallLast?: boolean;
}) {
	const currentTheme: any = useTheme();

	const permawebProvider = usePermawebProvider();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const [open, setOpen] = React.useState<boolean>(false);

	const [data, setData] = React.useState<any>(null);
	const [showViewData, setShowViewData] = React.useState<boolean>(false);

	const [result, setResult] = React.useState<any>(null);
	const [showViewResult, setShowViewResult] = React.useState<boolean>(false);

	React.useEffect(() => {
		(async function () {
			if (!result && showViewResult) {
				let processId: string = props.element.node.recipient;

				if (processId) {
					const variant = getTagValue(props.element.node.tags, 'Variant') as MessageVariantEnum;

					const deps = resolveLibDeps({
						variant: variant,
						permawebProvider: permawebProvider,
					});

					const messageId = await resolveMessageId({
						messageId: props.element.node.id,
						variant: variant,
						target: props.element.node.recipient,
						permawebProvider: permawebProvider,
					});

					try {
						const messageResult = await deps.ao.result({
							process: processId,
							message: messageId,
						});

						setResult(removeCommitments(messageResult));
					} catch (e: any) {
						console.error(e);
						setResult({ Result: e.message ?? 'Error Getting Result' });
					}
				}
			}
		})();
	}, [result, showViewResult, props.currentFilter]);

	React.useEffect(() => {
		(async function () {
			if (!data && showViewData) {
				try {
					const messageFetch = await fetch(getTxEndpoint(props.element.node.id));
					const rawMessage = await messageFetch.text();

					const raw = rawMessage ?? '';
					const trimmed = raw.trim();

					if (trimmed === '') {
						setData(language.noData);
					} else {
						try {
							const parsed = JSON.parse(trimmed);

							const isEmptyArray = Array.isArray(parsed) && parsed.length === 0;
							const isEmptyObject =
								parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length === 0;

							if (isEmptyArray || isEmptyObject) {
								setData(language.noData);
							} else {
								setData(parsed);
							}
						} catch {
							setData(trimmed);
						}
					}
				} catch (e: any) {
					console.error(e);
				}
			}
		})();
	}, [data, showViewData]);

	const excludedTagNames = ['Type', 'Authority', 'Module', 'Scheduler'];
	const filteredTags =
		props?.element?.node?.tags?.filter((tag: { name: string }) => !excludedTagNames.includes(tag.name)) || [];

	function handleShowViewData(e: any) {
		e.preventDefault();
		e.stopPropagation();
		setShowViewData((prev) => !prev);
	}

	function handleShowViewResult(e: any) {
		e.preventDefault();
		e.stopPropagation();
		setShowViewResult((prev) => !prev);
	}

	function getActionLabel() {
		return getTagValue(props.element.node.tags, 'Action') || language.none;
	}

	function getFrom() {
		const from = getTagValue(props.element.node.tags, 'From-Process') ?? props.element.node.owner.address;

		return <S.From>{from ? <TxAddress address={from} tooltipPosition={'right'} /> : <p>-</p>}</S.From>;
	}

	function getTo() {
		return (
			<S.To>
				{props.element.node.recipient ? (
					<TxAddress address={props.element.node.recipient} tooltipPosition={'right'} />
				) : (
					<p>-</p>
				)}
			</S.To>
		);
	}

	function getActionBackground() {
		const action = getActionLabel();

		if (action.toLowerCase().includes('error')) {
			return currentTheme.colors.warning.alt1;
		}

		switch (action) {
			case DEFAULT_ACTIONS.eval.name:
				return currentTheme.colors.actions.eval;
			case DEFAULT_ACTIONS.info.name:
				return currentTheme.colors.actions.info;
			case DEFAULT_ACTIONS.balance.name:
				return currentTheme.colors.actions.balance;
			case DEFAULT_ACTIONS.transfer.name:
				return currentTheme.colors.actions.transfer;
			case DEFAULT_ACTIONS.debitNotice.name:
				return currentTheme.colors.actions.debitNotice;
			case DEFAULT_ACTIONS.creditNotice.name:
				return currentTheme.colors.actions.creditNotice;
			case MINT_ACTIONS.mint.name:
				return currentTheme.colors.actions.mint;
			case MINT_ACTIONS.piDelegationRecords.name:
				return currentTheme.colors.actions.piDelegationRecords;
			case MINT_ACTIONS.reportMint.name:
				return currentTheme.colors.actions.reportMint;
			case MINT_ACTIONS.setPiIndexWeights.name:
				return currentTheme.colors.actions.setPiIndexWeights;
			case MINT_ACTIONS.saveDelegationSummary.name:
				return currentTheme.colors.actions.saveDelegationSummary;
			case MINT_ACTIONS.nextPiDelegationPage.name:
				return currentTheme.colors.actions.nextPiDelegationPage;
			case 'None':
				return currentTheme.colors.actions.none;
			default:
				return currentTheme.colors.actions.other;
		}
	}

	function getAction(useMaxWidth: boolean) {
		return (
			<S.ActionValue background={getActionBackground()} useMaxWidth={useMaxWidth}>
				<div className={'action-indicator'}>
					<p>{getActionLabel()}</p>
					<S.ActionTooltip className={'info'}>
						<span>{getActionLabel()}</span>
					</S.ActionTooltip>
				</div>
			</S.ActionValue>
		);
	}

	function getData() {
		if (!data) return null;

		if (typeof data === 'object') {
			return <JSONReader data={data} header={language.data} maxHeight={600} noFullScreen />;
		}

		return <Editor initialData={data} header={language.data} language={'lua'} readOnly loading={false} />;
	}

	const OverlayLine = ({ label, value, render }: { label: string; value: any; render?: (v: any) => JSX.Element }) => {
		const defaultRender = (v: any) => {
			if (typeof v === 'string' && checkValidAddress(v)) {
				return (
					<TxAddress
						address={v}
						tooltipPosition={'top-right'}
						handlePress={() => {
							setShowViewData(false);
							setShowViewResult(false);
						}}
					/>
				);
			}
			return <p>{v}</p>;
		};

		const renderContent = render || defaultRender;

		return (
			<S.OverlayLine>
				<span>{label}</span>
				{value ? renderContent(value) : <p>-</p>}
			</S.OverlayLine>
		);
	};

	function getMessageOverlay() {
		let open = false;
		let header = null;
		let handleClose = () => {};
		let content = null;
		let loading = true;

		if (showViewData) {
			open = true;
			header = language.input;
			handleClose = () => setShowViewData(false);
			content = getData();
			if (data) loading = false;
		} else if (showViewResult) {
			open = true;
			header = language.result;
			handleClose = () => setShowViewResult(false);
			content = <JSONReader data={result} header={language.output} noWrapper noFullScreen />;
			if (result) loading = false;
		}

		return (
			<Panel open={open} width={750} header={header} handleClose={handleClose}>
				<S.OverlayWrapper>
					<S.OverlayInfo>
						<S.OverlayInfoLine>
							<S.OverlayInfoLineValue>
								<p>{`${language.message}: `}</p>
							</S.OverlayInfoLineValue>
							<TxAddress
								address={props.element.node.id}
								tooltipPosition={'bottom-right'}
								handlePress={() => {
									setShowViewData(false);
									setShowViewResult(false);
								}}
							/>
						</S.OverlayInfoLine>
						<S.OverlayInfoLine>{getAction(false)}</S.OverlayInfoLine>
						{showViewData && (
							<S.OverlayTagsWrapper>
								<S.OverlayTagsHeader>
									<p>{language.tags}</p>
								</S.OverlayTagsHeader>
								{filteredTags.map((tag: { name: string; value: string }, index: number) => (
									<OverlayLine key={index} label={tag.name} value={tag.value} />
								))}
							</S.OverlayTagsWrapper>
						)}
					</S.OverlayInfo>
					<S.OverlayOutput>{loading ? <p>{`${language.loading}...`}</p> : <>{content}</>}</S.OverlayOutput>
					<S.OverlayActions>
						<Button type={'primary'} label={language.close} handlePress={handleClose} />
					</S.OverlayActions>
				</S.OverlayWrapper>
			</Panel>
		);
	}

	return (
		<>
			<S.ElementWrapper
				key={props.element.node.id}
				className={'message-list-element'}
				onClick={() => setOpen((prev) => !prev)}
				open={open}
				lastChild={props.lastChild}
			>
				<S.ID>
					<S.TxAddress>
						<TxAddress address={props.element.node.id} tooltipPosition={'right'} />
					</S.TxAddress>
					<S.Variant className={'info'}>
						<span>{getTagValue(props.element.node.tags, TAGS.keys.variant)}</span>
					</S.Variant>
				</S.ID>
				{getAction(true)}
				{getFrom()}
				{getTo()}
				<S.Input>
					<Button type={'alt3'} label={language.input} handlePress={(e) => handleShowViewData(e)} />
				</S.Input>
				<S.Output>
					<Button type={'alt3'} label={language.output} handlePress={(e) => handleShowViewResult(e)} />
				</S.Output>
				<S.Time>
					<p>
						{props.element.node?.block?.timestamp
							? getRelativeDate(props.element.node.block.timestamp * 1000)
							: 'Processing'}
					</p>
				</S.Time>
				<S.Results open={open}>
					<ReactSVG src={ASSETS.arrow} />
				</S.Results>
			</S.ElementWrapper>
			{open && (
				<MessageList
					txId={props.element.node.id}
					variant={props.variant}
					type={props.type}
					currentFilter={props.currentFilter}
					recipient={props.element.node.recipient}
					parentId={props.parentId}
					handleMessageOpen={props.handleOpen ? (id: string) => props.handleOpen(id) : null}
					childList
					isOverallLast={props.isOverallLast && props.lastChild}
				/>
			)}
			{getMessageOverlay()}
		</>
	);
}

export default function MessageList(props: {
	header?: string;
	txId?: string;
	variant: MessageVariantEnum;
	type?: TransactionType;
	currentFilter?: MessageFilterType;
	recipient?: string | null;
	parentId?: string;
	handleMessageOpen?: (id: string) => void;
	childList?: boolean;
	isOverallLast?: boolean;
}) {
	const permawebProvider = usePermawebProvider();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const tableContainerRef = React.useRef(null);

	const [showFilters, setShowFilters] = React.useState<boolean>(false);

	const loadedFilterState = React.useMemo(() => {
		if (props.txId && !props.childList) {
			try {
				const saved = localStorage.getItem(STORAGE.messageFilter(props.txId));
				if (saved) {
					const parsed = JSON.parse(saved);
					return {
						filter: parsed.filter,
						action: parsed.action || null,
						recipient: parsed.recipient || '',
						fromAddress: parsed.fromAddress || '',
						startDate: parsed.startDate || null,
						endDate: parsed.endDate || null,
					};
				}
			} catch (e) {
				console.error('Failed to load message filter:', e);
			}
		}
		return null;
	}, [props.txId, props.childList]);

	const [currentFilter, setCurrentFilter] = React.useState<MessageFilterType>(
		props.currentFilter ?? loadedFilterState?.filter ?? 'outgoing'
	);
	const [currentAction, setCurrentAction] = React.useState<string | null>(loadedFilterState?.action ?? null);
	const [actionOptions, setActionOptions] = React.useState<string[]>(() => {
		const defaultActions = Object.keys(DEFAULT_ACTIONS).map((action) => DEFAULT_ACTIONS[action].name);
		try {
			const savedCustomActions = localStorage.getItem(STORAGE.customActions);
			if (savedCustomActions) {
				const customActions = JSON.parse(savedCustomActions);
				return [...defaultActions, ...customActions];
			}
		} catch (e) {
			console.error('Failed to load custom actions:', e);
		}
		return defaultActions;
	});
	const [customAction, setCustomAction] = React.useState<string>('');
	const [toggleFilterChange, setToggleFilterChange] = React.useState<boolean>(false);

	const [currentData, setCurrentData] = React.useState<any[] | null>(null);
	const [loadingMessages, setLoadingMessages] = React.useState<boolean>(false);

	const [incomingCount, setIncomingCount] = React.useState<number | null>(null);
	const [outgoingCount, setOutgoingCount] = React.useState<number | null>(null);
	const [totalCount, setTotalCount] = React.useState<number | null>(null);

	const [pageCursor, setPageCursor] = React.useState<string | null>(null);
	const [cursorHistory, setCursorHistory] = React.useState([]);
	const [nextCursor, setNextCursor] = React.useState<string | null>(null);
	const [pageNumber, setPageNumber] = React.useState(1);
	const [perPage, setPerPage] = React.useState(50);
	const [recipient, setRecipient] = React.useState<string>(loadedFilterState?.recipient ?? '');
	const [fromAddress, setFromAddress] = React.useState<string>(loadedFilterState?.fromAddress ?? '');
	const [fromAddressIsProcess, setFromAddressIsProcess] = React.useState<boolean>(false);

	// Time range filter states
	const [startDate, setStartDate] = React.useState<{ year: number; month: number; day: number } | null>(
		loadedFilterState?.startDate ?? null
	);
	const [endDate, setEndDate] = React.useState<{ year: number; month: number; day: number } | null>(
		loadedFilterState?.endDate ?? null
	);
	const [showStartCalendar, setShowStartCalendar] = React.useState<boolean>(false);
	const [showEndCalendar, setShowEndCalendar] = React.useState<boolean>(false);

	// Applied filter states (only updated when "Apply Filters" is clicked)
	const [appliedAction, setAppliedAction] = React.useState<string | null>(loadedFilterState?.action ?? null);
	const [appliedRecipient, setAppliedRecipient] = React.useState<string>(loadedFilterState?.recipient ?? '');
	const [appliedFromAddress, setAppliedFromAddress] = React.useState<string>(loadedFilterState?.fromAddress ?? '');
	const [appliedFromAddressIsProcess, setAppliedFromAddressIsProcess] = React.useState<boolean>(false);
	const [appliedStartDate, setAppliedStartDate] = React.useState<{ year: number; month: number; day: number } | null>(
		loadedFilterState?.startDate ?? null
	);
	const [appliedEndDate, setAppliedEndDate] = React.useState<{ year: number; month: number; day: number } | null>(
		loadedFilterState?.endDate ?? null
	);

	function dateToTimestamp(date: { year: number; month: number; day: number }): number {
		return Math.floor(new Date(date.year, date.month - 1, date.day).getTime() / 1000);
	}

	function formatDateLabel(date: { year: number; month: number; day: number } | null): string {
		if (!date) return '';
		return `${date.month}/${date.day}/${date.year}`;
	}

	async function timestampToBlockHeight(timestamp: number): Promise<number> {
		try {
			// Fetch current network height
			const networkResponse = await fetch(arweaveEndpoint);
			const networkData = await networkResponse.json();
			const currentBlockHeight = networkData.height;

			// Fetch current block data to get timestamp
			const blockResponse = await fetch(`${arweaveEndpoint}/block/current`);
			const currentBlockData = await blockResponse.json();
			const currentBlockTimestamp = currentBlockData.timestamp;

			// Arweave block time is approximately 2 minutes (120 seconds)
			const BLOCK_TIME = 120;

			// Calculate block height based on time difference from current block
			const timeDifference = currentBlockTimestamp - timestamp;
			const blockDifference = Math.floor(timeDifference / BLOCK_TIME);
			const estimatedBlock = currentBlockHeight - blockDifference;

			return Math.max(0, estimatedBlock);
		} catch (e) {
			console.error('Error converting timestamp to block height:', e);
			return 0;
		}
	}

	async function checkIsProcess(address: string): Promise<boolean> {
		try {
			const response = await permawebProvider.libs.getGQLData({
				ids: [address],
			});

			if (response?.data?.length) {
				const type = getTagValue(response.data[0].node.tags, 'Type');
				return type === 'Process';
			}

			return false;
		} catch (e) {
			console.error('Error checking if address is process:', e);
			return false;
		}
	}

	function saveFilterState() {
		if (props.txId && !props.childList) {
			try {
				const filterState = {
					filter: currentFilter,
					action: currentAction,
					recipient: recipient,
					fromAddress: fromAddress,
					startDate: startDate,
					endDate: endDate,
				};
				localStorage.setItem(STORAGE.messageFilter(props.txId), JSON.stringify(filterState));
			} catch (e) {
				console.error('Failed to save message filter:', e);
			}
		}
	}

	function getOutgoingGQLArgs(outgoingTags) {
		switch (props.type) {
			case 'process':
			case 'message':
				let tags = [...outgoingTags];

				tags.push({ name: 'From-Process', values: [props.txId] });

				if (props.variant === MessageVariantEnum.Mainnet) {
					tags = lowercaseTagKeys(tags);
				}

				return { tags: [...tags] };
			case 'wallet':
				return {
					tags: [...outgoingTags],
					owners: [props.txId],
				};
		}
	}

	// Check if fromAddress is a process whenever it changes
	React.useEffect(() => {
		(async function () {
			if (fromAddress && checkValidAddress(fromAddress)) {
				const isProcess = await checkIsProcess(fromAddress);
				setFromAddressIsProcess(isProcess);
			} else {
				setFromAddressIsProcess(false);
			}
		})();
	}, [fromAddress]);

	// Initialize appliedFromAddressIsProcess on mount if there's a loaded fromAddress
	React.useEffect(() => {
		(async function () {
			if (loadedFilterState?.fromAddress && checkValidAddress(loadedFilterState.fromAddress)) {
				const isProcess = await checkIsProcess(loadedFilterState.fromAddress);
				setAppliedFromAddressIsProcess(isProcess);
				setFromAddressIsProcess(isProcess);
			}
		})();
	}, []);

	// Save filter state whenever it changes
	React.useEffect(() => {
		saveFilterState();
	}, [currentFilter, currentAction, recipient, fromAddress, startDate, endDate]);

	React.useEffect(() => {
		(async function () {
			let tags = [];
			if (appliedAction) tags.push({ name: 'Action', values: [appliedAction] });

			if (props.txId) {
				try {
					// Build incoming query args
					let incomingQueryArgs: any = {
						tags: tags,
						recipients: [props.txId],
					};

					// Add fromAddress filter if applicable
					if (appliedFromAddress && checkValidAddress(appliedFromAddress)) {
						if (appliedFromAddressIsProcess) {
							incomingQueryArgs.tags = [...tags, { name: 'From-Process', values: [appliedFromAddress] }];
						} else {
							incomingQueryArgs.owners = [appliedFromAddress];
						}
					}

					// Add time range filters
					if (appliedStartDate) {
						incomingQueryArgs.minBlock = await timestampToBlockHeight(dateToTimestamp(appliedStartDate));
					}
					if (appliedEndDate) {
						incomingQueryArgs.maxBlock = await timestampToBlockHeight(
							dateToTimestamp({
								...appliedEndDate,
								day: appliedEndDate.day + 1,
							})
						);
					}

					let outgoingQueryArgs: any = {
						...(appliedRecipient && checkValidAddress(appliedRecipient) ? { recipients: [appliedRecipient] } : {}),
						...getOutgoingGQLArgs(tags),
					};

					// Add time range filters for outgoing
					if (appliedStartDate) {
						outgoingQueryArgs.minBlock = await timestampToBlockHeight(dateToTimestamp(appliedStartDate));
					}
					if (appliedEndDate) {
						outgoingQueryArgs.maxBlock = await timestampToBlockHeight(
							dateToTimestamp({
								...appliedEndDate,
								day: appliedEndDate.day + 1,
							})
						);
					}

					const [gqlResponseIncoming, gqlResponseOutgoing] = await Promise.all([
						permawebProvider.libs.getGQLData(incomingQueryArgs),
						permawebProvider.libs.getGQLData(outgoingQueryArgs),
					]);
					setIncomingCount(gqlResponseIncoming.count);
					setOutgoingCount(gqlResponseOutgoing.count);
				} catch (e: any) {
					console.error(e);
				}
			}
		})();
	}, [props.txId, props.variant, toggleFilterChange]);

	React.useEffect(() => {
		(async function () {
			let tags = [];
			if (appliedAction) tags.push({ name: 'Action', values: [appliedAction] });

			setLoadingMessages(true);
			if (props.txId) {
				try {
					if (!props.childList && props.type !== 'message') {
						let gqlResponse: any;
						switch (currentFilter) {
							case 'incoming':
								let incomingQueryArgs: any = {
									tags: tags,
									recipients: [props.txId],
									paginator: perPage,
									...(pageCursor ? { cursor: pageCursor } : {}),
									sort: 'descending',
								};

								// Add fromAddress filter if applicable
								if (appliedFromAddress && checkValidAddress(appliedFromAddress)) {
									if (appliedFromAddressIsProcess) {
										incomingQueryArgs.tags = [...tags, { name: 'From-Process', values: [appliedFromAddress] }];
									} else {
										incomingQueryArgs.owners = [appliedFromAddress];
									}
								}

								// Add time range filters
								if (appliedStartDate) {
									incomingQueryArgs.minBlock = await timestampToBlockHeight(dateToTimestamp(appliedStartDate));
								}
								if (appliedEndDate) {
									incomingQueryArgs.maxBlock = await timestampToBlockHeight(
										dateToTimestamp({
											...appliedEndDate,
											day: appliedEndDate.day + 1,
										})
									);
								}

								gqlResponse = await permawebProvider.libs.getGQLData(incomingQueryArgs);
								break;
							case 'outgoing':
								let outgoingArgs: any = {
									paginator: perPage,
									...(appliedRecipient && checkValidAddress(appliedRecipient)
										? { recipients: [appliedRecipient] }
										: {}),
									...(pageCursor ? { cursor: pageCursor } : {}),
									sort: 'descending',
									...getOutgoingGQLArgs(tags),
								};

								// Add time range filters
								if (appliedStartDate) {
									outgoingArgs.minBlock = await timestampToBlockHeight(dateToTimestamp(appliedStartDate));
								}
								if (appliedEndDate) {
									outgoingArgs.maxBlock = await timestampToBlockHeight(
										dateToTimestamp({
											...appliedEndDate,
											day: appliedEndDate.day + 1,
										})
									);
								}

								gqlResponse = await permawebProvider.libs.getGQLData(outgoingArgs);
								break;
							default:
								break;
						}
						setCurrentData(gqlResponse.data);
						setNextCursor(gqlResponse.data.length >= perPage ? gqlResponse.nextCursor : null);
					} else {
						if (props.recipient) {
							try {
								const deps = resolveLibDeps({
									variant: props.variant,
									permawebProvider: permawebProvider,
								});

								const messageId = await resolveMessageId({
									messageId: props.txId,
									variant: props.variant,
									target: props.recipient,
									permawebProvider: permawebProvider,
								});

								const resultResponse = await deps.ao.result({
									process: props.recipient,
									message: messageId,
								});

								if (resultResponse && !resultResponse.error && resultResponse.Messages.length > 0) {
									tags.push(
										{ name: 'From-Process', values: [props.recipient] },
										{ name: 'Variant', values: [props.variant] },
										{
											name: 'Reference',
											values: resultResponse.Messages.map((result) => getTagValue(result.Tags, 'Reference')),
										}
									);

									if (props.variant === MessageVariantEnum.Mainnet) {
										tags = lowercaseTagKeys(tags);
									}

									const gqlResponse = await permawebProvider.libs.getGQLData({
										tags: [...tags],
									});

									setCurrentData(gqlResponse.data);
								} else {
									setCurrentData([]);
								}
							} catch (e: any) {
								setLoadingMessages(false);
							}
						}
					}
				} catch (e: any) {
					console.error(e);
				}
			} else {
				const arweaveResponse = await fetch(arweaveEndpoint);
				const currentBlock = (await arweaveResponse.json()).height;

				tags = [...DEFAULT_MESSAGE_TAGS];

				const gqlResponse = await permawebProvider.libs.getGQLData({
					tags: tags,
					paginator: perPage,
					minBlock: currentBlock - 20,
					maxBlock: currentBlock,
					...(appliedRecipient && checkValidAddress(appliedRecipient) ? { recipients: [appliedRecipient] } : {}),
					...(pageCursor ? { cursor: pageCursor } : {}),
				});

				setTotalCount(gqlResponse.count);
				setCurrentData(gqlResponse.data);
				setNextCursor(gqlResponse.data.length >= perPage ? gqlResponse.nextCursor : null);
			}
			setLoadingMessages(false);
		})();
	}, [
		props.txId,
		props.variant,
		props.recipient,
		currentFilter,
		toggleFilterChange,
		pageCursor,
		permawebProvider.libs,
	]);

	const scrollToTop = () => {
		if (tableContainerRef.current) {
			setTimeout(() => {
				tableContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}, 10);
		}
	};

	function handleNext() {
		if (nextCursor) {
			setCursorHistory((prevHistory) => [...prevHistory, pageCursor]);
			setPageCursor(nextCursor);
			setPageNumber((prevPage) => prevPage + 1);
			scrollToTop();
		}
	}

	function handlePrevious() {
		if (cursorHistory.length > 0) {
			const newHistory = [...cursorHistory];
			const previousCursor = newHistory.pop();
			setCursorHistory(newHistory);
			setPageCursor(previousCursor);
			setPageNumber((prevPage) => Math.max(prevPage - 1, 1));
			scrollToTop();
		}
	}

	function handleClear() {
		setPageNumber(1);
		setPageCursor(null);
		setNextCursor(null);
		setCursorHistory([]);
	}

	function handleFilterChange(filter: MessageFilterType) {
		if (filter === 'incoming') {
			setRecipient('');
		} else {
			setFromAddress('');
		}
		setCurrentFilter(filter);
		handleClear();
	}

	function handleActionChange(action: string) {
		setCurrentAction(currentAction === action ? null : action);
	}

	function handleFilterUpdate() {
		// Update applied filter states
		setAppliedAction(currentAction);
		setAppliedRecipient(recipient);
		setAppliedFromAddress(fromAddress);
		setAppliedFromAddressIsProcess(fromAddressIsProcess);
		setAppliedStartDate(startDate);
		setAppliedEndDate(endDate);

		setToggleFilterChange((prev) => !prev);
		setShowFilters(false);
		handleClear();
	}

	function handleActionAdd() {
		flushSync(() => {
			const newActionOptions = [...actionOptions, customAction];
			setActionOptions(newActionOptions);
			handleActionChange(customAction);
			setCustomAction('');

			// Save custom actions to localStorage
			try {
				const defaultActions = Object.keys(DEFAULT_ACTIONS).map((action) => DEFAULT_ACTIONS[action].name);
				const customActionsOnly = newActionOptions.filter((action) => !defaultActions.includes(action));
				localStorage.setItem(STORAGE.customActions, JSON.stringify(customActionsOnly));
			} catch (e) {
				console.error('Failed to save custom actions:', e);
			}
		});
	}

	function handleActionRemove() {
		flushSync(() => {
			const newActionOptions = actionOptions.filter((action) => action !== currentAction);
			setActionOptions(newActionOptions);
			handleActionChange(currentAction);

			// Update custom actions in localStorage
			try {
				const defaultActions = Object.keys(DEFAULT_ACTIONS).map((action) => DEFAULT_ACTIONS[action].name);
				const customActionsOnly = newActionOptions.filter((action) => !defaultActions.includes(action));
				localStorage.setItem(STORAGE.customActions, JSON.stringify(customActionsOnly));
			} catch (e) {
				console.error('Failed to save custom actions:', e);
			}
		});
	}

	function getMessage() {
		let message: string = language.associatedMessagesInfo;
		if (loadingMessages) message = `${language.associatedMessagesLoading}...`;
		if (currentData?.length <= 0) message = language.associatedMessagesNotFound;
		return (
			<S.UpdateWrapper childList={props.childList}>
				<p>{message}</p>
			</S.UpdateWrapper>
		);
	}

	function getPages() {
		const count = totalCount ? totalCount : currentFilter === 'incoming' ? incomingCount : outgoingCount;
		const totalPages = count ? Math.ceil(count / perPage) : 1;
		return (
			<>
				<p>{`Page (${formatCount(pageNumber.toString())} of ${formatCount(totalPages.toString())})`}</p>
				<S.Divider />
				<p>{`${!showFilters ? perPage : '-'} per page`}</p>
			</>
		);
	}

	function getPaginator(showPages: boolean) {
		return (
			<>
				<Button
					type={'alt3'}
					label={language.previous}
					handlePress={handlePrevious}
					disabled={cursorHistory.length === 0 || loadingMessages}
				/>
				{showPages && <S.DPageCounter>{getPages()}</S.DPageCounter>}
				<Button
					type={'alt3'}
					label={language.next}
					handlePress={handleNext}
					disabled={!nextCursor || loadingMessages}
				/>
				{showPages && <S.MPageCounter>{getPages()}</S.MPageCounter>}
			</>
		);
	}

	const invalidPerPage = perPage <= 0 || perPage > 100;
	const customActionSelected = currentAction && actionOptions.some((action) => action === currentAction);

	return (
		<>
			<S.Container ref={tableContainerRef}>
				{!props.childList && (
					<S.Header>
						<S.HeaderMain>
							<p>{props.header ?? language.messages}</p>
							{loadingMessages && (
								<div className={'loader'}>
									<Loader xSm relative />
								</div>
							)}
						</S.HeaderMain>
						<S.HeaderActions className={'scroll-wrapper-hidden'}>
							{props.type && props.type !== 'message' && (
								<>
									<Button
										type={'alt3'}
										label={`${language.outgoing}${outgoingCount ? ` (${formatCount(outgoingCount.toString())})` : ''}`}
										handlePress={() => handleFilterChange('outgoing')}
										active={currentFilter === 'outgoing'}
										disabled={loadingMessages}
									/>
									<Button
										type={'alt3'}
										label={`${language.incoming}${incomingCount ? ` (${formatCount(incomingCount.toString())})` : ''}`}
										handlePress={() => handleFilterChange('incoming')}
										active={currentFilter === 'incoming'}
										disabled={loadingMessages}
									/>
									<S.Divider />
								</>
							)}
							{appliedAction && (
								<Button
									type={'alt3'}
									label={`Action (${appliedAction})`}
									handlePress={() => {
										setCurrentAction(null);
										setAppliedAction(null);
										setToggleFilterChange((prev) => !prev);
										handleClear();
									}}
									active={true}
									disabled={loadingMessages}
									icon={ASSETS.close}
								/>
							)}
							{appliedRecipient && checkValidAddress(appliedRecipient) && (
								<Button
									type={'alt3'}
									label={`To (${formatAddress(appliedRecipient, false)})`}
									handlePress={() => {
										setRecipient('');
										setAppliedRecipient('');
										setToggleFilterChange((prev) => !prev);
										handleClear();
									}}
									active={true}
									disabled={loadingMessages}
									icon={ASSETS.close}
								/>
							)}
							{appliedFromAddress && checkValidAddress(appliedFromAddress) && (
								<Button
									type={'alt3'}
									label={`From (${formatAddress(appliedFromAddress, false)})`}
									handlePress={() => {
										setFromAddress('');
										setAppliedFromAddress('');
										setAppliedFromAddressIsProcess(false);
										setToggleFilterChange((prev) => !prev);
										handleClear();
									}}
									active={true}
									disabled={loadingMessages}
									icon={ASSETS.close}
								/>
							)}
							{appliedStartDate && (
								<Button
									type={'alt3'}
									label={`Start (${
										appliedStartDate
											? `${appliedStartDate.month}-${appliedStartDate.day}-${appliedStartDate.year}`
											: '-'
									})`}
									handlePress={() => {
										setStartDate(null);
										setAppliedStartDate(null);
										setToggleFilterChange((prev) => !prev);
										handleClear();
									}}
									active={true}
									disabled={loadingMessages}
									icon={ASSETS.close}
								/>
							)}
							{appliedEndDate && (
								<Button
									type={'alt3'}
									label={`End (${
										appliedEndDate ? `${appliedEndDate.month}-${appliedEndDate.day}-${appliedEndDate.year}` : '-'
									})`}
									handlePress={() => {
										setEndDate(null);
										setAppliedEndDate(null);
										setToggleFilterChange((prev) => !prev);
										handleClear();
									}}
									active={true}
									disabled={loadingMessages}
									icon={ASSETS.close}
								/>
							)}
							<S.FilterWrapper>
								<Button
									type={'alt3'}
									label={language.filter}
									handlePress={() => setShowFilters((prev) => !prev)}
									active={showFilters}
									disabled={loadingMessages}
									icon={ASSETS.filter}
									iconLeftAlign
								/>
							</S.FilterWrapper>
							<S.Divider />
							{getPaginator(false)}
						</S.HeaderActions>
					</S.Header>
				)}
				{currentData?.length > 0 ? (
					<S.Wrapper childList={props.childList}>
						{!props.childList && (
							<S.HeaderWrapper className={'fade-in'}>
								<S.ID>
									<p>{language.id}</p>
								</S.ID>
								<S.Action>
									<p>{language.action}</p>
								</S.Action>
								<S.From>
									<p>{language.from}</p>
								</S.From>
								<S.To>
									<p>{language.to}</p>
								</S.To>
								<S.Input>
									<p>{language.input}</p>
								</S.Input>
								<S.Output>
									<p>{language.output}</p>
								</S.Output>
								<S.Time>
									<p>{language.time}</p>
								</S.Time>
								<S.Results>
									<p>{language.results}</p>
								</S.Results>
							</S.HeaderWrapper>
						)}
						<S.BodyWrapper childList={props.childList} isOverallLast={props.isOverallLast} className={'fade-in'}>
							{currentData.map((element: any, index: number) => {
								const isLastChild = index === currentData.length - 1;

								return (
									<Message
										key={element.node.id}
										element={element}
										type={props.type}
										variant={getTagValue(element.node.tags, TAGS.keys.variant) as MessageVariantEnum}
										currentFilter={currentFilter}
										parentId={props.parentId}
										handleOpen={props.handleMessageOpen ? (id: string) => props.handleMessageOpen(id) : null}
										lastChild={isLastChild}
										isOverallLast={props.isOverallLast && isLastChild}
									/>
								);
							})}
						</S.BodyWrapper>
					</S.Wrapper>
				) : (
					getMessage()
				)}
				{!props.childList && <S.FooterWrapper>{getPaginator(true)}</S.FooterWrapper>}
			</S.Container>
			{!props.childList && (
				<Panel
					open={showFilters}
					width={515}
					header={language.messageFilters}
					handleClose={() => setShowFilters(false)}
				>
					<S.FilterDropdown>
						<S.FilterDropdownHeader>
							<p>{language.filterByAction}</p>
						</S.FilterDropdownHeader>
						<S.FilterDropdownActionSelect>
							{actionOptions.map((action) => {
								return (
									<Button
										key={action}
										type={'primary'}
										label={action}
										handlePress={() => handleActionChange(action)}
										disabled={loadingMessages}
										active={currentAction === action}
										icon={currentAction === action ? ASSETS.close : null}
										height={40}
										fullWidth
									/>
								);
							})}
							<FormField
								label={language.customAction}
								value={customAction}
								onChange={(e: any) => setCustomAction(e.target.value)}
								disabled={loadingMessages}
								invalid={{ status: actionOptions.some((action) => action === customAction), message: null }}
								hideErrorMessage
							/>
							<Button
								type={customActionSelected ? 'primary' : 'alt1'}
								label={customActionSelected ? language.remove : language.submit}
								handlePress={() => (customActionSelected ? handleActionRemove() : handleActionAdd())}
								disabled={
									customActionSelected
										? false
										: !customAction || actionOptions.some((action) => action === customAction) || loadingMessages
								}
								active={false}
								height={40}
								fullWidth
							/>
						</S.FilterDropdownActionSelect>
						<S.FilterDivider />
						{(currentFilter !== 'incoming' || !props.txId) && (
							<FormField
								label={language.recipient}
								value={recipient}
								onChange={(e: any) => setRecipient(e.target.value)}
								disabled={loadingMessages}
								invalid={{ status: recipient ? !checkValidAddress(recipient) : null, message: null }}
								hideErrorMessage
							/>
						)}

						{currentFilter === 'incoming' && props.txId && (
							<FormField
								label={language.from}
								value={fromAddress}
								onChange={(e: any) => setFromAddress(e.target.value)}
								disabled={loadingMessages}
								invalid={{ status: fromAddress ? !checkValidAddress(fromAddress) : null, message: null }}
								hideErrorMessage
							/>
						)}
						<S.FilterDivider />
						<S.FilterDropdownHeader>
							<p>{language.dateFilter}</p>
						</S.FilterDropdownHeader>
						<S.DateRangeWrapper>
							<S.DateRangeSection>
								<S.DateRangeHeader>
									<Button
										type={'primary'}
										label={startDate ? `${language.startDate}: ${formatDateLabel(startDate)}` : language.startDate}
										handlePress={() => setShowStartCalendar((prev) => !prev)}
										active={showStartCalendar}
										height={40}
										fullWidth
									/>
									{startDate && (
										<S.ClearDateButton
											onClick={() => {
												setStartDate(null);
												setShowStartCalendar(false);
											}}
										>
											{language.clear}
										</S.ClearDateButton>
									)}
								</S.DateRangeHeader>
								{showStartCalendar && (
									<Calendar
										selectedDate={startDate}
										onDateSelect={(date) => {
											setStartDate(date);
											setShowStartCalendar(false);
										}}
									/>
								)}
							</S.DateRangeSection>
							<S.DateRangeSection>
								<S.DateRangeHeader>
									<Button
										type={'primary'}
										label={endDate ? `${language.endDate}: ${formatDateLabel(endDate)}` : language.endDate}
										handlePress={() => setShowEndCalendar((prev) => !prev)}
										active={showEndCalendar}
										height={40}
										fullWidth
									/>
									{endDate && (
										<S.ClearDateButton
											onClick={() => {
												setEndDate(null);
												setShowEndCalendar(false);
											}}
										>
											{language.clear}
										</S.ClearDateButton>
									)}
								</S.DateRangeHeader>
								{showEndCalendar && (
									<Calendar
										selectedDate={endDate}
										onDateSelect={(date) => {
											setEndDate(date);
											setShowEndCalendar(false);
										}}
										minDate={startDate ? new Date(startDate.year, startDate.month - 1, startDate.day) : undefined}
									/>
								)}
							</S.DateRangeSection>
						</S.DateRangeWrapper>
						<S.FilterDivider />
						<FormField
							type={'number'}
							label={language.resultsPerPage}
							value={perPage}
							onChange={(e: any) => setPerPage(e.target.value)}
							disabled={loadingMessages}
							invalid={{ status: invalidPerPage, message: invalidPerPage ? 'Value must be between 0 and 100' : null }}
						/>
						<S.FilterApply>
							<Button
								type={'alt1'}
								label={language.applyFilters}
								handlePress={() => handleFilterUpdate()}
								disabled={invalidPerPage}
								active={false}
								height={42.5}
								fullWidth
							/>
						</S.FilterApply>
					</S.FilterDropdown>
				</Panel>
			)}
		</>
	);
}

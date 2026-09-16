import React from 'react';
import JSONbig from 'json-bigint';

import { AoReadError } from 'api/aoNetwork';
import type { ProcessStateLoadOptions, ProcessStateResult } from 'api/permaweb';

import { Button } from 'components/atoms/Button';
import { Loader } from 'components/atoms/Loader';
import { JSONReader } from 'components/molecules/JSONReader';
import { legacyCuEndpoint } from 'helpers/endpoints';
import { MessageVariantEnum } from 'helpers/types';
import { checkValidAddress, formatMs, removeCommitments, stripUrlProtocol } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';
import { useSettingsProvider } from 'providers/SettingsProvider';
import { store } from 'store';
import { addTransaction, selectTransaction } from 'store/transactions/reducer';

import * as S from './styles';

export default function ProcessRead(props: {
	processId: string;
	variant: MessageVariantEnum | undefined;
	autoRun: boolean;
	hideOutput?: boolean;
}) {
	const permawebProvider = usePermawebProvider();
	const settingsProvider = useSettingsProvider();
	const legacyComputeNode = React.useMemo(
		() => settingsProvider.settings.legacyComputeNode?.trim() || legacyCuEndpoint,
		[settingsProvider.settings.legacyComputeNode]
	);

	const languageProvider = useLanguageProvider();
	const language = React.useMemo(() => languageProvider.object[languageProvider.current], [languageProvider.current]);

	const [cuLocation, setCuLocation] = React.useState(null);
	const [startTime, setStartTime] = React.useState(null);
	const [roundtripTime, setRoundtripTime] = React.useState(null);
	const [elapsed, setElapsed] = React.useState(0);
	const [readState, setReadState] = React.useState<
		| { status: 'idle' }
		| { status: 'loading'; data: unknown; progress?: { completed: number; total: number }; loadMore?: () => void }
		| { status: 'success'; data: unknown; loadMore?: () => void }
		| { status: 'error'; data: unknown; partial: boolean; loadMore?: () => void }
	>({ status: 'idle' });
	const isFetching = readState.status === 'loading';
	const currentOutput = 'data' in readState ? readState.data : null;
	const [toggleRead, setToggleRead] = React.useState(false);
	const [readLog, setReadLog] = React.useState([]);
	const [errorLog, setErrorLog] = React.useState([]);

	const safelyParseNestedJSON = (input) => {
		if (typeof input === 'string') {
			try {
				const parsed = JSONbig({ storeAsString: true }).parse(input);
				return parsed === input ? input : safelyParseNestedJSON(parsed);
			} catch (e) {
				return input;
			}
		} else if (Array.isArray(input)) {
			return input.map(safelyParseNestedJSON);
		} else if (input !== null && typeof input === 'object') {
			return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, safelyParseNestedJSON(value)]));
		}
		return input;
	};

	// Restored tabs can render before their process metadata identifies the network.
	const readApi =
		props.variant === MessageVariantEnum.Mainnet
			? permawebProvider.mainnetApi
			: props.variant === MessageVariantEnum.Legacynet
			? permawebProvider.legacyApi
			: null;
	const [hasRun, setHasRun] = React.useState(props.autoRun);

	React.useEffect(() => {
		setReadLog([]);
		setErrorLog([]);
	}, [props.processId, props.variant, readApi, legacyComputeNode]);

	React.useEffect(() => {
		const controller = new AbortController();
		let frameId: number;
		setCuLocation(props.variant === MessageVariantEnum.Legacynet ? legacyComputeNode : null);
		setReadState({ status: 'idle' });
		if (!readApi || !checkValidAddress(props.processId) || (!props.autoRun && !hasRun)) return;

		let partialOutput: unknown = null;
		let isRunning = false;
		const runRead = async (continuation?: ProcessStateResult['loadMore']) => {
			if (controller.signal.aborted || isRunning) return;
			isRunning = true;
			const loadMore = continuation ? () => void runRead(continuation) : undefined;
			const start = Date.now();
			setReadState({ status: 'loading', data: partialOutput, loadMore });
			setStartTime(start);
			const tick = () => {
				setElapsed(Date.now() - start);
				frameId = requestAnimationFrame(tick);
			};
			tick();
			try {
				let response: unknown;
				let next: ProcessStateResult['loadMore'];
				let node = legacyComputeNode;
				if (props.variant === MessageVariantEnum.Mainnet) {
					const readOptions: ProcessStateLoadOptions = {
						signal: controller.signal,
						onProgress: (progress) => {
							if (controller.signal.aborted) return;
							partialOutput = removeCommitments(safelyParseNestedJSON(progress.data));
							setCuLocation(progress.provider);
							setReadState({
								status: 'loading',
								data: partialOutput,
								loadMore,
								progress: { completed: progress.completedLinks, total: progress.totalLinks },
							});
						},
					};
					const result = await (continuation
						? continuation(readOptions)
						: permawebProvider.mainnetApi.readStateWithSource({
								processId: props.processId,
								hydrate: true,
								...readOptions,
						  }));
					response = result.data;
					node = result.provider;
					next = result.loadMore;
				} else {
					response = await permawebProvider.legacyApi.readProcess({ processId: props.processId, action: 'Info' });
				}
				if (controller.signal.aborted) return;
				const parsedResponse = safelyParseNestedJSON(response);
				const output = removeCommitments(parsedResponse);
				partialOutput = output;
				// Transaction metadata is shared across networks; do not persist peer-specific state there.
				if (props.variant === MessageVariantEnum.Legacynet) {
					const cachedTx = selectTransaction(store.getState(), props.processId);
					if (cachedTx) store.dispatch(addTransaction(props.processId, { ...cachedTx, ...output }));
				}
				setCuLocation(node);
				setReadState({ status: 'success', data: output, loadMore: next ? () => void runRead(next) : undefined });
				const roundTrip = Date.now() - start;
				setRoundtripTime(roundTrip);
				setReadLog((previous) => [
					...previous,
					{ startTime: start, roundtripTime: roundTrip, node: stripUrlProtocol(node) },
				]);
			} catch (error) {
				if (controller.signal.aborted) return;
				const message =
					error instanceof AoReadError
						? error.code === 'timeout'
							? language.aoReadTimeout
							: error.code === 'invalid-response'
							? language.aoReadInvalid
							: language.aoReadUnavailable
						: error instanceof Error
						? error.message
						: language.aoReadUnavailable;
				setErrorLog((previous) => [...previous, { time: Date.now(), message }]);
				setReadState({
					status: 'error',
					data: partialOutput ?? { Error: message },
					partial: partialOutput !== null,
					loadMore,
				});
			} finally {
				isRunning = false;
				cancelAnimationFrame(frameId);
			}
		};
		void runRead();
		return () => {
			controller.abort();
			cancelAnimationFrame(frameId);
		};
	}, [props.processId, props.variant, props.autoRun, hasRun, readApi, legacyComputeNode, toggleRead]);

	function handleLoadMore() {
		if (readState.status !== 'idle' && !isFetching) readState.loadMore?.();
	}

	return (
		<S.Wrapper>
			{!props.hideOutput && (
				<S.OutputWrapper>
					<JSONReader
						data={
							currentOutput ??
							(isFetching ? { Status: `${language.loading}...` } : { Result: 'Current state can not be resolved' })
						}
						header={language.currentState}
						maxHeight={600}
						preserveViewState
						footer={
							readState.status !== 'idle' && readState.loadMore ? (
								<S.LoadMore>
									<span role="status">{isFetching ? language.loadingLinkedState : language.moreStateAvailable}</span>
									<Button type="alt3" label={language.loadMoreData} onPress={handleLoadMore} disabled={isFetching} />
								</S.LoadMore>
							) : undefined
						}
					/>
				</S.OutputWrapper>
			)}
			<S.SectionWrapper className={'border-wrapper-alt3'}>
				<S.Header>
					<S.HeaderMain>
						<p>{`${language.readFrom}: ${cuLocation ?? '-'}`}</p>
					</S.HeaderMain>
					<Button
						type={'alt3'}
						label={isFetching ? `${language.running}...` : language.run}
						disabled={isFetching || !readApi}
						onPress={() => {
							setHasRun(true);
							setToggleRead((prev) => !prev);
						}}
					/>
				</S.Header>
				<S.Body>
					<S.Section>
						<S.SectionHeader>
							<p>{language.currentRun}</p>
						</S.SectionHeader>
						<S.SectionBody>
							<S.Line>
								<span>
									{startTime
										? `${language.startTime}: ${new Date(startTime).toLocaleTimeString()}`
										: `${language.starting}...`}
								</span>
							</S.Line>
							<S.Line>
								<span>
									{isFetching
										? `${language.elapsed}: ${formatMs(elapsed)}`
										: `${language.roundtripTime}: ${roundtripTime ? formatMs(roundtripTime) : '-'}`}
								</span>
							</S.Line>
							{readState.status === 'loading' && readState.progress && (
								<S.Line role="status">
									<span>{`${language.loadingLinkedState} (${readState.progress.completed}/${readState.progress.total})`}</span>
								</S.Line>
							)}
							{readState.status === 'error' && readState.partial && (
								<S.Error role="status">
									<span>{language.aoReadPartial}</span>
								</S.Error>
							)}
						</S.SectionBody>
					</S.Section>
					{readLog.length > 0 && (
						<S.Section>
							<S.SectionHeader>
								<p>{language.readLog}</p>
							</S.SectionHeader>
							<S.SectionBody>
								{readLog.length === 0 ? (
									<S.Line>
										<span>{language.noReadsYet}</span>
									</S.Line>
								) : (
									readLog.map((log, index) => (
										<S.Line key={index}>
											<span>
												{`(${index + 1}) Roundtrip Time (${formatMs(log.roundtripTime)}), Started at ${new Date(
													log.startTime
												).toLocaleTimeString()} · ${log.node}`}
											</span>
										</S.Line>
									))
								)}
							</S.SectionBody>
						</S.Section>
					)}
					{errorLog.length > 0 && (
						<S.Section>
							<S.SectionHeader>
								<p>{language.errorLog}</p>
							</S.SectionHeader>
							<S.SectionBody>
								{errorLog.length === 0 ? (
									<S.Line>
										<span>{language.noErrors}</span>
									</S.Line>
								) : (
									errorLog.map((err, index) => (
										<S.Error key={index}>
											<span>{`Error ${index + 1} at ${new Date(err.time).toLocaleTimeString()}: ${err.message}`}</span>
										</S.Error>
									))
								)}
							</S.SectionBody>
						</S.Section>
					)}
				</S.Body>
				{isFetching && (
					<S.LoadingWrapper>
						<Loader xSm relative />
					</S.LoadingWrapper>
				)}
			</S.SectionWrapper>
		</S.Wrapper>
	);
}

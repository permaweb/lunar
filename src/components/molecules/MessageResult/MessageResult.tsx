import React from 'react';
import JSONbig from 'json-bigint';

import { requestRemote } from 'api/http';
import { isSuccessfulExecutionResult } from 'api/permaweb';

import { TxAddress } from 'components/atoms/TxAddress';
import { JSONReader } from 'components/molecules/JSONReader';
import { MessageInput } from 'components/molecules/MessageInput';
import { FLAGS } from 'helpers/config';
import { getTxEndpoint } from 'helpers/endpoints';
import { MessageVariantEnum, TagType } from 'helpers/types';
import { checkValidAddress, getTagValue, removeCommitments, resolveMessageId, resolvePermawebApi } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';

import { Editor } from '../Editor';

import * as S from './styles';

export default function MessageResult(props: {
	processId: string;
	messageId: string;
	variant: MessageVariantEnum | undefined;
	tags: TagType[] | null;
	result?: unknown;
	skipResultFetch?: boolean;
	active: boolean;
}) {
	const permawebProvider = usePermawebProvider();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const [data, setData] = React.useState<any>(null);
	const [fetchedResult, setFetchedResult] = React.useState<{
		processId: string;
		messageId: string;
		variant: MessageVariantEnum | undefined;
		result: unknown;
	} | null>(null);

	const dataFetchedRef = React.useRef<boolean>(false);
	const prevProcessIdRef = React.useRef<string>(props.processId);
	const prevMessageIdRef = React.useRef<string>(props.messageId);

	// Reset input fetching when navigating to another message.
	React.useEffect(() => {
		if (prevProcessIdRef.current !== props.processId || prevMessageIdRef.current !== props.messageId) {
			dataFetchedRef.current = false;
			prevProcessIdRef.current = props.processId;
			prevMessageIdRef.current = props.messageId;
		}
	}, [props.processId, props.messageId]);

	React.useEffect(() => {
		if (props.skipResultFetch || props.result != null) {
			return;
		}
		setFetchedResult(null);
		let isCancelled = false;

		(async function () {
			if (checkValidAddress(props.processId) && checkValidAddress(props.messageId)) {
				try {
					let variant = props.variant;

					/* Find the variant of the recipient process to handle messages between networks */
					try {
						const processLookup = await permawebProvider.legacyApi.getGQLData({
							ids: [props.processId],
						});

						if (processLookup.data?.length > 0) {
							const node = processLookup.data[0].node;
							const processVariant = getTagValue(node.tags, 'Variant') as MessageVariantEnum;

							if (processVariant) variant = processVariant;
						}
					} catch (e: any) {
						console.error(e);
					}

					const deps = resolvePermawebApi({
						variant: variant,
						permawebProvider: permawebProvider,
					});

					const messageId = await resolveMessageId({
						messageId: props.messageId,
						variant: variant,
						target: props.processId,
						permawebProvider: permawebProvider,
					});

					const messageResult = await deps.ao.result({
						process: props.processId,
						message: messageId,
					});

					if (!isCancelled) {
						setFetchedResult({
							processId: props.processId,
							messageId: props.messageId,
							variant: props.variant,
							result: messageResult,
						});
					}
				} catch (e: unknown) {
					console.error(e);
					if (!isCancelled) {
						setFetchedResult({
							processId: props.processId,
							messageId: props.messageId,
							variant: props.variant,
							result: { Response: e instanceof Error ? e.message : language.errorFetchingResult },
						});
					}
				}
			}
		})();
		return () => {
			isCancelled = true;
		};
	}, [
		props.result,
		props.skipResultFetch,
		props.processId,
		props.messageId,
		props.variant,
		permawebProvider,
		language.errorFetchingResult,
	]);

	React.useEffect(() => {
		if (dataFetchedRef.current) {
			return;
		}

		(async function () {
			if (checkValidAddress(props.processId) && checkValidAddress(props.messageId)) {
				dataFetchedRef.current = true;
				try {
					const messageFetch = await requestRemote(getTxEndpoint(props.messageId));
					const rawMessage = await messageFetch.text();

					const raw = rawMessage ?? '';
					const trimmed = raw.trim();

					if (trimmed === '') {
						setData(language.noDataToDisplay);
					} else {
						try {
							const parsed = JSONbig({ storeAsString: true }).parse(trimmed);

							const isEmptyArray = Array.isArray(parsed) && parsed.length === 0;
							const isEmptyObject =
								parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length === 0;

							if (isEmptyArray || isEmptyObject) {
								setData(language.noDataToDisplay);
							} else {
								setData(parsed);
							}
						} catch {
							if (messageFetch.ok) setData(trimmed);
							else setData(language.noDataToDisplay);
						}
					}
				} catch (e: any) {
					console.error(e);
					setData(e.message ?? 'Error Fetching Message Data');
				}
			}
		})();
	}, [props.processId, props.messageId]);

	const TagLine = (tagProps: { label: string; value: any; render?: (v: any) => JSX.Element }) => {
		const defaultRender = (v: any) => {
			if (typeof v === 'string' && checkValidAddress(v)) {
				return <TxAddress address={v} />;
			}
			return <p>{v}</p>;
		};

		const renderContent = tagProps.render || defaultRender;

		return (
			<S.TagLine>
				<span>{tagProps.label}</span>
				{tagProps.value ? renderContent(tagProps.value) : <p>-</p>}
			</S.TagLine>
		);
	};

	function getTags() {
		if (!props.tags || props.tags?.length <= 0) return null;

		return props.tags.map((tag: { name: string; value: string }, index: number) => (
			<TagLine key={index} label={tag.name} value={tag.value} />
		));
	}

	function getData() {
		if (!data) {
			return (
				<Editor
					initialData={language.noDataToDisplay}
					language={'lua'}
					readOnly
					loading={false}
					useFixedHeight
					noWrapper
				/>
			);
		}

		if (typeof data === 'object') {
			return <JSONReader data={data} noWrapper hideHeader filename={props.messageId} />;
		}

		return <Editor initialData={String(data)} language={'lua'} readOnly loading={false} useFixedHeight noWrapper />;
	}

	const result =
		props.result ??
		(!props.skipResultFetch &&
		fetchedResult?.processId === props.processId &&
		fetchedResult?.messageId === props.messageId &&
		fetchedResult?.variant === props.variant
			? fetchedResult.result
			: null);
	const displayResult = React.useMemo(() => removeCommitments(result), [result]);
	const shouldShowResult = !FLAGS.HIDE_UNSUCCESSFUL_TX_OUTPUT || isSuccessfulExecutionResult(result);

	function getResult() {
		return (
			<JSONReader
				data={displayResult}
				placeholder={`${language.loading} ${language.result}…`}
				header={language.result}
				maxHeight={500}
				filename={`${props.messageId}-result`}
			/>
		);
	}

	return (
		<S.Wrapper>
			<MessageInput className={'border-wrapper-alt3'} headerVariant="section" tags={getTags()} data={getData()} />
			{shouldShowResult && <S.ResultWrapper>{getResult()}</S.ResultWrapper>}
		</S.Wrapper>
	);
}

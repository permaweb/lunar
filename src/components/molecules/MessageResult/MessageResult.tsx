import React from 'react';
import JSONbig from 'json-bigint';

import { TxAddress } from 'components/atoms/TxAddress';
import { JSONReader } from 'components/molecules/JSONReader';
import { getTxEndpoint } from 'helpers/endpoints';
import { MessageVariantEnum, TagType } from 'helpers/types';
import { checkValidAddress, getTagValue, removeCommitments, resolveLibDeps, resolveMessageId } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';

import { Editor } from '../Editor';

import * as S from './styles';

const WRAPPER_HEIGHT = 600;

export default function MessageResult(props: {
	processId: string;
	messageId: string;
	variant: any;
	tags: TagType[] | null;
}) {
	const permawebProvider = usePermawebProvider();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const [data, setData] = React.useState<any>(null);
	const [result, setResult] = React.useState<any>(null);

	React.useEffect(() => {
		(async function () {
			if (!result && checkValidAddress(props.processId) && checkValidAddress(props.messageId)) {
				try {
					let variant = props.variant;

					/* Find the variant of the recipient process to handle messages between networks */
					try {
						const processLookup = await permawebProvider.libs.getGQLData({
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

					const deps = resolveLibDeps({
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

					setResult(removeCommitments(messageResult));
				} catch (e: any) {
					console.error(e);
					setResult({ Response: e.message ?? language.errorFetchingResult });
				}
			}
		})();
	}, [result, props.processId, props.messageId]);

	React.useEffect(() => {
		(async function () {
			if (!data && checkValidAddress(props.processId) && checkValidAddress(props.messageId)) {
				try {
					const messageFetch = await fetch(getTxEndpoint(props.messageId));
					const rawMessage = await messageFetch.text();

					const raw = rawMessage ?? '';
					const trimmed = raw.trim();

					if (trimmed === '') {
						setData(language.noData);
					} else {
						try {
							const parsed = JSONbig({ storeAsString: true }).parse(trimmed);

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
					setData(e.message ?? 'Error Fetching Message Data');
				}
			}
		})();
	}, [data, props.processId, props.messageId]);

	const TagLine = ({ label, value, render }: { label: string; value: any; render?: (v: any) => JSX.Element }) => {
		const defaultRender = (v: any) => {
			if (typeof v === 'string' && checkValidAddress(v)) {
				return <TxAddress address={v} />;
			}
			return <p>{v}</p>;
		};

		const renderContent = render || defaultRender;

		return (
			<S.TagLine>
				<span>{label}</span>
				{value ? renderContent(value) : <p>-</p>}
			</S.TagLine>
		);
	};

	function getTags() {
		if (!props.tags || props.tags?.length <= 0) return null;

		return (
			<S.TagsBody>
				{props.tags.map((tag: { name: string; value: string }, index: number) => (
					<TagLine key={index} label={tag.name} value={tag.value} />
				))}
			</S.TagsBody>
		);
	}

	function getData() {
		if (!data) {
			return (
				<S.Editor>
					<Editor
						initialData={'Loading Input Data...'}
						header={null}
						language={'html'}
						readOnly
						loading={true}
						fixedHeight={WRAPPER_HEIGHT / 2}
					/>
				</S.Editor>
			);
		}

		if (typeof data === 'object') {
			return <JSONReader data={data} header={null} maxHeight={WRAPPER_HEIGHT / 2} />;
		}

		return (
			<S.Editor>
				<Editor
					initialData={data}
					header={null}
					language={'lua'}
					readOnly
					loading={false}
					fixedHeight={WRAPPER_HEIGHT / 2}
				/>
			</S.Editor>
		);
	}

	function getResult() {
		return <JSONReader data={result ?? { Result: 'Loading…' }} header={language.result} fixedHeight={WRAPPER_HEIGHT} />;
	}

	return (
		<S.Wrapper>
			<S.InputWrapper>
				<S.TagsWrapper className={'border-wrapper-alt3'}>
					<S.TagsHeader>
						<p>{language.input}</p>
						<span>(Tags)</span>
					</S.TagsHeader>
					{getTags()}
				</S.TagsWrapper>
				<S.DataWrapper>{getData()}</S.DataWrapper>
			</S.InputWrapper>
			<S.ResultWrapper>{getResult()}</S.ResultWrapper>
		</S.Wrapper>
	);
}

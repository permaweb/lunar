import React from 'react';

import { Loader } from 'components/atoms/Loader';
import { JSONReader } from 'components/molecules/JSONReader';
import { getTxEndpoint } from 'helpers/endpoints';
import { checkValidAddress } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';

import { Editor } from '../Editor';

import * as S from './styles';

export default function MessageResult(props: { processId: string; messageId: string; variant: any }) {
	const permawebProvider = usePermawebProvider();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const [data, setData] = React.useState<any>(null);
	const [result, setResult] = React.useState<any>(null);

	React.useEffect(() => {
		(async function () {
			if (!result && checkValidAddress(props.processId) && checkValidAddress(props.messageId)) {
				try {
					const messageFetch = await fetch(getTxEndpoint(props.messageId));
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

					const messageResult = await permawebProvider.deps.ao.result({
						process: props.processId,
						message: props.messageId,
					});
					setResult(messageResult);
				} catch (e: any) {
					console.error(e);
				}
			}
		})();
	}, [result, props.processId, props.messageId]);

	function getData() {
		if (!data) return null;

		if (typeof data === 'object') {
			return <JSONReader data={data} header={language.data} maxHeight={600} />;
		}

		return (
			<S.Editor>
				<Editor initialData={data} header={language.data} language={'lua'} readOnly loading={false} />
			</S.Editor>
		);
	}

	return (
		<S.Wrapper>
			{result ? (
				<>
					{getData()}
					<JSONReader data={result} header={language.result} maxHeight={600} />
				</>
			) : (
				<Loader sm relative />
			)}
		</S.Wrapper>
	);
}

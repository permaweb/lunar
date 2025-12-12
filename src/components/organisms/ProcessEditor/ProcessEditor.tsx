import React from 'react';

import { JSONReader } from 'components/molecules/JSONReader';
import { JSONWriter } from 'components/molecules/JSONWriter';
import { MessageVariantEnum } from 'helpers/types';
import { removeCommitments, resolveLibDeps } from 'helpers/utils';
import { useArweaveProvider } from 'providers/ArweaveProvider';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';
import { WalletBlock } from 'wallet/WalletBlock';

import * as S from './styles';

export default function ProcessEditor(props: {
	processId: string;
	variant: MessageVariantEnum;
	type: 'read' | 'write';
}) {
	const permawebProvider = usePermawebProvider();
	const arProvider = useArweaveProvider();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const editorRef = React.useRef(null);

	const [loading, setLoading] = React.useState<boolean>(false);
	const [output, setOutput] = React.useState<any>(null);

	React.useEffect(() => {
		if (editorRef.current) {
			setTimeout(() => {
				editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}, 10);
		}
	}, []);

	async function handleSubmit(message: object) {
		setLoading(true);
		setOutput(null);

		const deps = resolveLibDeps({
			variant: props.variant,
			permawebProvider: permawebProvider,
		});

		let messageToSend: any = { ...message };
		let connectFn: (message: object) => any;

		switch (props.type) {
			case 'read':
				connectFn = deps.ao.dryrun;
				break;
			case 'write':
				connectFn = deps.ao.message;
				messageToSend.signer = deps.signer;
				break;
		}

		try {
			const response = await connectFn(messageToSend);

			switch (props.type) {
				case 'read':
					setOutput(removeCommitments(response));
					break;
				case 'write':
					const result = await deps.ao.result({
						process: messageToSend.process,
						message: response,
					});
					setOutput(removeCommitments(result));
					break;
			}
		} catch (e: any) {
			console.error(e);
		}
		setLoading(false);
	}

	if (props.type === 'write' && !arProvider.wallet) {
		return <WalletBlock />;
	}

	return (
		<S.Wrapper ref={editorRef}>
			<S.EditorWrapper>
				<JSONWriter
					initialData={{
						process: props.processId ?? '',
						data: '',
						tags: [
							{
								name: 'Action',
								value: 'Info',
							},
						],
					}}
					handleSubmit={(message: object) => handleSubmit(message)}
					loading={loading}
				/>
			</S.EditorWrapper>
			<S.ResultWrapper>
				<JSONReader
					data={output}
					header={language.response}
					placeholder={loading ? `${language.loading}...` : language.runForResponse}
					noFullScreen
				/>
			</S.ResultWrapper>
		</S.Wrapper>
	);
}

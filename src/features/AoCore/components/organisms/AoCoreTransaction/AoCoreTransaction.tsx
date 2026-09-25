import React from 'react';
import { useLocation } from 'react-router-dom';

import { recognizeAoMetadata } from 'api/aoCore';

import { Transaction } from 'components/organisms/Transaction';
import { URLS } from 'helpers/config';
import type { GQLNodeResponseType } from 'helpers/types';
import { checkValidAddress } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { useAoCoreMessage } from '../../../hooks/useAoCoreMessage';
import { AoCoreInfo } from '../AoCoreInfo';
import { AoCoreMessageInfo } from '../AoCoreMessageInfo';

import * as S from './styles';

export default function AoCoreTransaction(props: React.ComponentProps<typeof Transaction>) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current].aoCore;
	const location = useLocation();
	const [transaction, setTransaction] = React.useState<GQLNodeResponseType | null>(null);
	const [revision, setRevision] = React.useState(0);
	const tags = transaction?.node.id === props.txId ? transaction.node.tags : [];
	const metadata = recognizeAoMetadata(
		Object.fromEntries((tags ?? []).map((tag) => [tag.name.toLowerCase(), tag.value]))
	);
	const explicitContext = location.pathname === URLS.explorerAoCore(props.txId);
	const [exploration, setExploration] = React.useState({ id: props.txId, explicit: explicitContext });
	// The active URL belongs to another ID while this explorer tab is hidden.
	if (exploration.id !== props.txId || (explicitContext && !exploration.explicit)) {
		setExploration({ id: props.txId, explicit: explicitContext });
	}
	const context = metadata.length > 0 || explicitContext || (exploration.id === props.txId && exploration.explicit);
	const eligible = checkValidAddress(props.txId);
	const enabled = eligible && props.active !== false;
	const state = useAoCoreMessage(props.txId, enabled, context, revision);
	const available = eligible && (state.status === 'ready' || context);
	const device =
		state.status === 'ready'
			? state.result.data.device ?? (state.result.data.deviceSource === 'default' ? 'message@1.0' : null)
			: null;
	const handleRetry = React.useCallback(() => setRevision((value) => value + 1), []);
	const handleTxChange = React.useCallback(
		(value: GQLNodeResponseType) => {
			setTransaction(value);
			props.onTxChange?.(value);
		},
		[props.onTxChange]
	);
	const inspector = React.useMemo(
		() =>
			available
				? {
						id: props.txId,
						label: language.title,
						url: URLS.explorerAoCore(props.txId),
						onRefresh: handleRetry,
						badges: device
							? [
									{
										label: device,
										description:
											state.status === 'ready' && state.result.data.deviceSource === 'default'
												? language.defaultDevice
												: device,
									},
							  ]
							: [],
						content: <AoCoreInfo state={state} onRetry={handleRetry} />,
						actions:
							state.status === 'ready' && props.active !== false && explicitContext ? (
								<AoCoreMessageInfo key={props.txId} result={state.result} />
							) : undefined,
						fallback: (
							<S.Notice className={'border-wrapper-alt3'}>
								<h3>{language.unindexedTitle}</h3>
								<p>{state.status === 'ready' ? language.unindexedDescription : language.unindexedPending}</p>
							</S.Notice>
						),
				  }
				: undefined,
		[available, props.txId, props.active, explicitContext, language, state, device, handleRetry]
	);
	return <Transaction {...props} onTxChange={handleTxChange} inspector={inspector} />;
}

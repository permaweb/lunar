import React from 'react';

import { getLatestHolderTransactions, type HolderLastTransaction } from 'api/holders';

import { ExplorerLink } from 'components/atoms/TxAddress';
import { useVisibleData } from 'hooks/useVisibleData';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function HolderTransaction(props: {
	address: string;
	endpoint?: string;
	onLoad: (address: string, transaction: HolderLastTransaction) => void;
}) {
	const provider = useLanguageProvider();
	const language = provider.object[provider.current];
	const response = useVisibleData<HolderLastTransaction>({
		cacheKey: JSON.stringify([props.endpoint, props.address]),
		fetchData: async (signal) => {
			const transactions = await getLatestHolderTransactions({
				addresses: [props.address],
				endpoint: props.endpoint,
				signal,
			});
			return transactions[props.address] ?? { status: 'error' };
		},
	});
	const transaction = response.data;
	const description =
		response.error || transaction?.status === 'error'
			? language.holdersTransactionsLoadError
			: transaction?.status === 'unsupported'
			? language.holdersTransactionsUnsupported
			: transaction?.status === 'empty'
			? language.holdersNoTransactions
			: undefined;

	React.useEffect(() => {
		if (transaction) props.onLoad(props.address, transaction);
		else if (response.error) props.onLoad(props.address, { status: 'error' });
	}, [transaction, response.error, props.address, props.onLoad]);

	return (
		<S.Wrapper ref={response.ref}>
			{transaction?.status === 'found' ? (
				<ExplorerLink value={transaction.transactionId} type="transaction" tooltipPosition="left" />
			) : (
				<span title={description}>{response.visible && !response.loaded ? `${language.loading}...` : '—'}</span>
			)}
		</S.Wrapper>
	);
}

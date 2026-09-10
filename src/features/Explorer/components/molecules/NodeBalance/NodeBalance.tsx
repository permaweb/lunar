import React from 'react';

import { arweaveNodeApi } from 'api/arweaveNode';

import { Button } from 'components/atoms/Button';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { useNodeResource } from '../../../hooks/useNodeResource';
import { formatNodeAmount } from '../../../model/node';

import * as S from './styles';

export default function NodeBalance(props: {
	node: string;
	address: string;
	isActive: boolean;
	balanceRevision: number;
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const read = React.useCallback(
		(signal: AbortSignal) => arweaveNodeApi.getBalance(props.node, props.address, signal),
		[props.node, props.address, props.balanceRevision]
	);
	const balance = useNodeResource(read, props.isActive);
	return (
		<S.Balance title={language.nodeBalanceDescription}>
			<p>{balance.data !== null ? formatNodeAmount(balance.data) : balance.isLoading ? language.loading : '—'}</p>
			{'error' in balance.state && (
				<S.Failure>
					<span>{language.nodeErrors[balance.state.error]}</span>
					<Button type={'primary'} label={language.nodeRetry} onPress={balance.refresh} />
				</S.Failure>
			)}
		</S.Balance>
	);
}

import React from 'react';

import { arweaveNodeApi } from 'api/arweaveNode';

import { Button } from 'components/atoms/Button';
import { formatNodeAmount } from 'helpers/nodeMining';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { useNodeResource } from '../../../hooks/useNodeResource';

import * as S from './styles';

export default function NodeBalance(props: {
	node: string;
	address: string;
	isActive: boolean;
	balanceRevision: number;
	kind?: 'balance' | 'pending-rewards';
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const read = React.useCallback(
		(signal: AbortSignal) =>
			props.kind === 'pending-rewards'
				? arweaveNodeApi.getPendingRewards(props.node, props.address, signal)
				: arweaveNodeApi.getBalance(props.node, props.address, signal),
		[props.node, props.address, props.balanceRevision, props.kind]
	);
	const balance = useNodeResource(read, props.isActive);
	return (
		<S.Balance
			title={
				props.kind === 'pending-rewards' ? language.nodePendingRewardsDescription : language.nodeBalanceDescription
			}
		>
			<p>
				{balance.data !== null
					? formatNodeAmount(balance.data)
					: balance.isLoading
					? `${language.loading}...`
					: language.nodeUnavailable}
			</p>
			{'error' in balance.state && (
				<S.Failure>
					<span>{language.nodeErrors[balance.state.error]}</span>
					<Button type={'primary'} label={language.nodeRetry} onPress={balance.refresh} />
				</S.Failure>
			)}
		</S.Balance>
	);
}

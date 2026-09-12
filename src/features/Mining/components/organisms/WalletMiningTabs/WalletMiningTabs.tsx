import React from 'react';
import { useLocation } from 'react-router-dom';

import { URLTabs } from 'components/atoms/URLTabs';
import { ASSETS, URLS } from 'helpers/config';
import { useLanguageProvider } from 'providers/LanguageProvider';

import type { WalletMiningState } from '../../../hooks/useWalletMining';
import { WalletMining } from '../WalletMining';

import * as S from './styles';

export default function WalletMiningTabs(props: {
	address: string;
	mining: WalletMiningState;
	isActive: boolean;
	transactions: React.ReactNode;
}) {
	const location = useLocation();
	const provider = useLanguageProvider();
	const language = provider.object[provider.current];
	const miningUrl = URLS.explorerMining(props.address);
	const transactionsUrl = URLS.explorerTransactions(props.address);
	const [lastUrl, setLastUrl] = React.useState(miningUrl);
	const [transactionsVisited, setTransactionsVisited] = React.useState(false);
	const path = location.pathname.replace(/\/+$/, '');
	const activeUrl = path === miningUrl || path === transactionsUrl ? path : lastUrl;
	React.useEffect(() => {
		if (!props.isActive) return;
		setLastUrl(activeUrl);
		if (activeUrl === transactionsUrl) setTransactionsVisited(true);
	}, [props.isActive, activeUrl, transactionsUrl]);
	return (
		<S.Wrapper>
			<URLTabs
				noUrlCopy
				activeUrl={activeUrl}
				tabs={[
					{
						label: language.walletMining,
						icon: ASSETS.overview,
						disabled: false,
						url: miningUrl,
						content: <WalletMining address={props.address} mining={props.mining} />,
					},
					{
						label: language.transactions,
						icon: ASSETS.transaction,
						disabled: false,
						url: transactionsUrl,
						content: transactionsVisited ? props.transactions : null,
					},
				]}
			/>
		</S.Wrapper>
	);
}

import React from 'react';
import { useDispatch } from 'react-redux';
import { ReactSVG } from 'react-svg';

import { StatusIndicator } from 'components/atoms/StatusIndicator';
import { TxAddress } from 'components/atoms/TxAddress';
import { SummaryPanel, type SummaryPanelItem, type SummaryPanelRow } from 'components/molecules/SummaryPanel';
import { ASSETS } from 'helpers/config';
import { getTxEndpoint } from 'helpers/endpoints';
import { searchTxById } from 'helpers/search';
import {
	formatTokenQuantity,
	getKnownTokenMetadata,
	getTokenKey,
	getTokenMetadataFromResponse,
	hasDenomination,
	mergeTokenMetadata,
} from 'helpers/tokens';
import { checkValidAddress } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';
import { store } from 'store';

import * as S from './styles';
import type { TokenTransferStatus } from './types';

const TOKEN_ICONS: Record<string, { src: string; size: number; margin: string }> = {
	ao: { src: ASSETS.ao, size: 18.5, margin: '7.5px 4.5px 0 0' },
	pi: { src: ASSETS.pi, size: 10.5, margin: '7.5px 4.5px 0 0' },
};

export default function TokenTransfer(props: {
	token: string | null;
	from: string | null;
	recipient: string | null;
	quantity: string | null;
	status?: TokenTransferStatus;
	onResultsOpen?: () => void;
}) {
	const dispatch = useDispatch();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const permawebProvider = usePermawebProvider();

	const [tokenResponse, setTokenResponse] = React.useState<any | null>(null);

	const knownMetadata = React.useMemo(() => getKnownTokenMetadata(props.token), [props.token]);
	const metadata = mergeTokenMetadata(knownMetadata, getTokenMetadataFromResponse(tokenResponse));
	const tokenIcon = TOKEN_ICONS[getTokenKey(props.token) ?? ''] ?? null;

	React.useEffect(() => {
		setTokenResponse(null);

		const legacyApi = permawebProvider.legacyApi;
		if (!props.token || !checkValidAddress(props.token) || hasDenomination(knownMetadata)) return;
		if (!legacyApi?.getGQLData) return;

		let active = true;

		(async () => {
			try {
				const response = await searchTxById({
					txId: props.token,
					getGQLData: legacyApi.getGQLData,
					readProcess: legacyApi.readProcess,
					store: store,
					dispatch: dispatch,
				});

				if (active) setTokenResponse(response);
			} catch (e: any) {
				console.error(e);
			}
		})();

		return () => {
			active = false;
		};
	}, [props.token, knownMetadata, permawebProvider.legacyApi, dispatch]);

	function renderAddress(address: string | null) {
		return address ? <TxAddress address={address} /> : <p>-</p>;
	}

	function renderLogo() {
		if (tokenIcon) {
			return (
				<S.Logo $size={tokenIcon.size} $margin={tokenIcon.margin}>
					<ReactSVG src={tokenIcon.src} />
				</S.Logo>
			);
		}

		if (metadata?.logo) {
			return (
				<S.Logo $size={15} $margin={'0'}>
					<img src={getTxEndpoint(metadata.logo)} alt={language.tokenLogo} />
				</S.Logo>
			);
		}

		return null;
	}

	function renderAmount() {
		if (!props.quantity) return <p>-</p>;

		const logo = renderLogo();

		return (
			<S.Amount>
				{logo}
				<p>{formatTokenQuantity(props.quantity, metadata)}</p>
				{!logo && metadata?.ticker && <span>{metadata.ticker}</span>}
			</S.Amount>
		);
	}

	function getStatusLabel(status: TokenTransferStatus) {
		switch (status.state) {
			case 'loading':
				return `${language.loading}...`;
			case 'computing':
				return language.computeInProgress;
			case 'success':
				return language.success;
			case 'failure':
				return status.message ?? language.error;
		}
	}

	function renderStatus(status: TokenTransferStatus) {
		const showIndicator = status.state === 'success' || (status.state === 'failure' && !status.message);

		return (
			<S.Status>
				<p>{getStatusLabel(status)}</p>
				{showIndicator && <StatusIndicator status={status.state === 'success' ? 'success' : 'failure'} />}
			</S.Status>
		);
	}

	function getRows(): SummaryPanelRow[] {
		const rows: SummaryPanelRow[] = [
			{
				id: 'transfer',
				items: [
					{ id: 'from', label: language.transferFrom, value: renderAddress(props.from) },
					{ id: 'to', label: language.to, value: renderAddress(props.recipient) },
					{ id: 'amount', label: language.amount, value: renderAmount() },
				],
			},
		];

		const resultItems: SummaryPanelItem[] = [];
		// Status and its results link read as one group, so no divider separates them.
		if (props.status) {
			resultItems.push({ id: 'status', label: language.status, value: renderStatus(props.status), hasDivider: false });
		}
		if (props.onResultsOpen) {
			resultItems.push({
				id: 'results',
				value: (
					<S.Results type={'button'} disabled={props.status?.state === 'loading'} onClick={props.onResultsOpen}>
						{language.goToResults}
					</S.Results>
				),
			});
		}
		if (resultItems.length > 0) rows.push({ id: 'result', items: resultItems });

		return rows;
	}

	return (
		<SummaryPanel
			title={language.tokenTransfer}
			subject={{ label: language.token, value: renderAddress(props.token) }}
			rows={getRows()}
		/>
	);
}

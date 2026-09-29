import React from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useTheme } from 'styled-components';

import { Button } from 'components/atoms/Button';
import { Toggle } from 'components/atoms/Toggle';
import { TransactionList, TransactionListEntry } from 'components/molecules/TransactionList';
import { getRelativeDate } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { useNetworkActivity } from '../../../hooks/useNetworkActivity';

import * as S from './styles';

export default function NetworkActivity() {
	const location = useLocation();
	const theme = useTheme();
	const [params, setParams] = useSearchParams();
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const activity = useNetworkActivity();
	const network = ['arweave', 'ao'].includes(params.get('network')) ? params.get('network') : 'all';
	const networkOptions = React.useMemo(
		() => [
			{ value: 'all', label: language.all },
			{ value: 'arweave', label: language.arweave },
			{ value: 'ao', label: language.landing.ao },
		],
		[language]
	);
	const kind =
		network === 'ao' && ['message', 'process'].includes(params.get('activity')) ? params.get('activity') : null;
	const entries = activity.entries
		?.filter((entry) => (network === 'all' || entry.network === network) && (!kind || entry.kind === kind))
		.slice(0, 12);
	const rows: TransactionListEntry[] = (entries ?? []).map((entry) => ({
		cursor: entry.id,
		node: { id: entry.id, tags: [] },
		display: {
			identifier: entry.kind === 'block' ? entry.height : entry.id,
			typeLabel: language.landing.activityKinds[entry.kind],
			typeColor:
				theme.colors.actions[
					entry.kind === 'message'
						? 'info'
						: entry.kind === 'process'
						? 'eval'
						: entry.kind === 'block'
						? 'other'
						: 'balance'
				],
			detail: entry.network === 'ao' ? language.landing.ao : language.arweave,
			time:
				entry.timestamp === null ? (
					language.pending
				) : (
					<time
						dateTime={new Date(entry.timestamp * 1000).toISOString()}
						title={new Date(entry.timestamp * 1000).toLocaleString()}
					>
						{getRelativeDate(entry.timestamp * 1000)}
					</time>
				),
		},
	}));
	React.useEffect(() => {
		if (location.hash === '#network-activity') document.getElementById('network-activity')?.scrollIntoView();
	}, [location.key, location.hash]);
	function handleFilter(value: string) {
		const next = new URLSearchParams(params);
		next.delete('activity');
		if (value === 'all') next.delete('network');
		else next.set('network', value);
		setParams(next, { replace: true, preventScrollReset: true });
	}
	return (
		<S.Wrapper id="network-activity" aria-labelledby="activity-title">
			<S.Heading>
				<div>
					<h2 id="activity-title">{language.landing.activityTitle}</h2>
					<p>{language.landing.activityDescription}</p>
				</div>
				<S.Filters>
					<Toggle
						label={language.landing.filterNetwork}
						value={network}
						options={networkOptions}
						onChange={handleFilter}
					/>
				</S.Filters>
			</S.Heading>
			{(activity.status === 'error' || activity.status === 'stale') && (
				<S.Status role="status">
					{activity.status === 'stale' ? language.landing.activityStale : language.landing.activityError}
					<Button type="alt3" label={language.retry} onPress={activity.onRefresh} />
				</S.Status>
			)}
			<TransactionList
				mode="recent"
				header={kind ? language.landing.activityKinds[kind] : language.landing.latestActivity}
				preview
				source={{
					edges: rows,
					loading: activity.status === 'loading' || activity.status === 'refreshing',
					emptyMessage: language.landing.activityEmpty,
					onRefresh: activity.onRefresh,
					detailLabel: language.network,
				}}
			/>
		</S.Wrapper>
	);
}

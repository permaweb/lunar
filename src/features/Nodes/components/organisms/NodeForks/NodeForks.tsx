import React from 'react';

import { Button } from 'components/atoms/Button';
import { ExplorerLink } from 'components/atoms/TxAddress';
import { ASSETS } from 'helpers/config';
import { formatBlockId } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { useNodeForks } from '../../../hooks/useNodeForks';
import { NODES_PAGE_SIZE } from '../../../model/config';
import type { ForkGroup } from '../../../model/forks';
import { getForkPage, groupNodesByFork } from '../../../model/forks';
import { NodeTable } from '../../molecules/NodeTable';

import * as S from './styles';

const ignoreObservation = () => {};

export default function NodeForks() {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const { state, refresh, continueChecks } = useNodeForks();
	const [page, setPage] = React.useState(1);
	const data = 'data' in state ? state.data : null;
	const groups = React.useMemo(
		() => (data ? groupNodesByFork(data.peers, data.infos, data.ancestry) : []),
		[data?.peers, data?.infos, data?.ancestry]
	);
	const pages = Math.max(1, Math.ceil((data?.peers.length ?? 0) / NODES_PAGE_SIZE));
	const currentPage = Math.min(page, pages);
	const isLoading = ['loading', 'tips', 'ancestry', 'refreshing'].includes(state.status);
	const hasUnchecked = data?.peers.some((peer) => !data.observations[peer.address]);
	const forkGroups = groups.filter((group) => group.kind === 'fork');
	const statusMessage =
		state.status === 'tips'
			? language.nodesCheckingTips(Object.keys(data.observations).length, data.peers.length)
			: state.status === 'ancestry'
			? language.nodesCheckingAncestry
			: isLoading
			? language.nodesLoading
			: state.status === 'error' || state.status === 'stale'
			? language.nodesLoadError
			: hasUnchecked
			? language.nodesForkChecksPaused
			: !data?.peers.length
			? language.nodesEmpty
			: undefined;

	function renderHeading(group: ForkGroup) {
		const title =
			group.kind === 'fork'
				? language.nodesFork(forkGroups.findIndex((fork) => fork.id === group.id) + 1)
				: group.kind === 'shared'
				? language.nodesSharedAncestor
				: group.kind === 'unclassified'
				? language.nodesUnclassified
				: language.nodesUnverifiedTip;
		return (
			<S.GroupContent>
				<S.GroupTitle>
					{title}
					<S.Count>({group.peers.length.toLocaleString()})</S.Count>
				</S.GroupTitle>
				{group.tip && (
					<S.Tip>
						<span>{group.tip.network}</span>
						<span>{language.nodesTipHeight(group.tip.height.toLocaleString())}</span>
						<ExplorerLink type={'block'} value={group.tip.hash} label={formatBlockId(group.tip.hash, false)} />
					</S.Tip>
				)}
				{group.kind !== 'fork' && (
					<S.Description>
						{group.kind === 'shared'
							? language.nodesSharedAncestorDescription
							: group.kind === 'unclassified'
							? language.nodesUnclassifiedDescription
							: language.nodesUnverifiedDescription}
					</S.Description>
				)}
			</S.GroupContent>
		);
	}
	function renderPaginator(showCount = false) {
		return (
			<>
				<Button
					type={'alt3'}
					label={language.previous}
					disabled={currentPage <= 1}
					onPress={() => setPage(currentPage - 1)}
				/>
				{showCount && <S.PageCount>{language.nodesPage(currentPage, pages)}</S.PageCount>}
				<Button
					type={'alt3'}
					label={language.next}
					disabled={currentPage >= pages}
					onPress={() => setPage(currentPage + 1)}
				/>
			</>
		);
	}
	return (
		<S.Container>
			<S.Header $showMap={false}>
				<S.Heading>
					{language.arweaveNodes}
					<S.Count>({data ? data.peers.length.toLocaleString() : `${language.loading}...`})</S.Count>
				</S.Heading>
				<S.Actions>
					{hasUnchecked && !isLoading && (
						<Button type={'alt3'} label={language.nodesContinueChecks} onPress={continueChecks} />
					)}
					<Button
						type={'alt3'}
						label={language.refresh}
						icon={ASSETS.refresh}
						iconLeftAlign
						disabled={isLoading}
						onPress={refresh}
					/>
					<S.Divider />
					{renderPaginator()}
				</S.Actions>
			</S.Header>
			<NodeTable
				sections={getForkPage(groups, currentPage, NODES_PAGE_SIZE).map((group) => ({
					id: group.id,
					peers: group.peers,
					heading: renderHeading(groups.find((entry) => entry.id === group.id)!),
				}))}
				observations={data?.observations ?? {}}
				checkingPeers={data?.checkingPeers ?? []}
				infoEnabled={false}
				infoSource={language.nodesRelayInfoSource}
				statusMessage={statusMessage}
				onObservation={ignoreObservation}
			/>
			<S.Footer>{renderPaginator(true)}</S.Footer>
		</S.Container>
	);
}

import React from 'react';

import { Button } from 'components/atoms/Button';
import { Loader } from 'components/atoms/Loader';
import { ASSETS, FLAGS } from 'helpers/config';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { useNodesList } from '../../../hooks/useNodesList';
import { getNodePages } from '../../../model/pages';
import { NodeTable } from '../../molecules/NodeTable';

import * as S from './styles';

const NodesMap = React.lazy(() => import('../NodesMap').then((module) => ({ default: module.NodesMap })));

export default function NodesTable() {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const list = useNodesList();
	const state = list.state;
	const [page, setPage] = React.useState(1);
	const [showMap, setShowMap] = React.useState(false);
	const peers = 'peers' in state ? state.peers : [];
	const pagination = getNodePages(peers, 'observations' in state ? state.observations : {});
	const pages = pagination.count;
	const currentPage = Math.min(page, pages);
	const rows = pagination.rows(currentPage);
	const loading = state.status === 'loading' || state.status === 'checking' || state.status === 'refreshing';

	function getPaginator(showCounter = false) {
		return (
			<>
				<Button
					type={'alt3'}
					label={language.previous}
					disabled={currentPage <= 1 || loading}
					onPress={() => setPage(currentPage - 1)}
				/>
				{showCounter && <S.PageCount>{language.nodesPage(currentPage, pages)}</S.PageCount>}
				<Button
					type={'alt3'}
					label={language.next}
					disabled={currentPage >= pages || loading}
					onPress={() => setPage(currentPage + 1)}
				/>
			</>
		);
	}
	return (
		<S.Container>
			<S.Header $showMap={showMap}>
				<S.Heading
					title={
						'updatedAt' in state ? language.nodesUpdated(new Date(state.updatedAt).toLocaleTimeString()) : undefined
					}
				>
					{language.arweaveNodes}
					<S.Count>{`(${'peers' in state ? peers.length.toLocaleString() : `${language.loading}...`})`}</S.Count>
				</S.Heading>
				<S.Actions>
					<Button
						type={'alt3'}
						label={showMap ? language.nodesShowTable : language.nodesShowMap}
						disabled={!peers.length}
						active={showMap}
						onPress={() => setShowMap((current) => !current)}
					/>
					<Button
						type={'alt3'}
						label={language.refresh}
						icon={ASSETS.refresh}
						iconLeftAlign
						disabled={loading}
						onPress={list.refresh}
					/>
					{!showMap && (
						<>
							<S.Divider />
							{getPaginator()}
						</>
					)}
				</S.Actions>
			</S.Header>
			{(state.status === 'error' || state.status === 'stale') && (
				<S.Message role={'alert'}>{language.nodesLoadError}</S.Message>
			)}
			{'checksInterrupted' in state && state.checksInterrupted && (
				<S.Message role={'status'}>{language.nodesChecksInterrupted}</S.Message>
			)}
			{showMap ? (
				<React.Suspense fallback={<S.Message role={'status'}>{`${language.loading}...`}</S.Message>}>
					<NodesMap peers={peers} />
				</React.Suspense>
			) : rows.length ? (
				<NodeTable
					sections={[{ id: 'nodes', peers: rows }]}
					observations={'observations' in state ? state.observations : {}}
					checkingPeers={'checkingPeers' in state ? state.checkingPeers : []}
					infoEnabled={'infoEnabled' in state && state.infoEnabled}
					revision={'revision' in state ? state.revision : 0}
					onObservation={list.onObservation}
				/>
			) : (
				state.status !== 'error' &&
				(loading && FLAGS.SHOW_NODES_LOADER ? (
					<S.InitialLoading role={'status'} aria-live={'polite'}>
						<S.InitialSpinner>
							<Loader sm relative />
						</S.InitialSpinner>
						<span>{language.nodesLoading}</span>
					</S.InitialLoading>
				) : (
					<S.Message role={'status'}>
						{loading ? `${language.loading}...` : peers.length ? language.nodesNoReachable : language.nodesEmpty}
					</S.Message>
				))
			)}
			{!showMap && <S.Footer>{getPaginator(true)}</S.Footer>}
		</S.Container>
	);
}

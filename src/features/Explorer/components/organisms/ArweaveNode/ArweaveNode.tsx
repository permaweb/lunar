import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { arweaveNodeApi } from 'api/arweaveNode';

import { Button } from 'components/atoms/Button';
import { URLTabs } from 'components/atoms/URLTabs';
import { ExplorerControls, ExplorerControlStyles as C } from 'components/molecules/ExplorerControls';
import { getArweaveNodeRoute, normalizeArweaveNode, readArweaveNodeRoute } from 'helpers/arweaveNode';
import { ASSETS } from 'helpers/config';
import type { PinTarget } from 'helpers/pinnedTabs';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { useNodeHistory } from '../../../hooks/useNodeHistory';
import { useNodeResource } from '../../../hooks/useNodeResource';
import { formatNodeRewardTotal, sumMiningRewards } from '../../../model/node';
import { NodeMempool } from '../NodeMempool';
import { NodeMiners } from '../NodeMiners';
import { NodeOverview } from '../NodeOverview';
import { NodeTransactions } from '../NodeTransactions';

import * as S from './styles';

export default function ArweaveNode(props: {
	node: string;
	isActive: boolean;
	onLoadingChange: (loading: boolean) => void;
	onResolved: (node: string) => void;
	pinTarget?: PinTarget;
}) {
	const location = useLocation();
	const navigate = useNavigate();
	const wrapperRef = React.useRef<HTMLDivElement>(null);
	const [showInfo, setShowInfo] = React.useState(false);
	const handleCloseInfo = React.useCallback(() => setShowInfo(false), []);
	const [refreshRevision, setRefreshRevision] = React.useState(0);
	const [input, setInput] = React.useState(props.node);
	const [isFullscreen, setIsFullscreen] = React.useState(false);
	React.useEffect(() => setInput(props.node), [props.node]);
	React.useEffect(() => {
		const handleChange = () => setIsFullscreen(document.fullscreenElement === wrapperRef.current);
		document.addEventListener('fullscreenchange', handleChange);
		return () => document.removeEventListener('fullscreenchange', handleChange);
	}, []);
	async function handleFullscreen() {
		try {
			if (document.fullscreenElement) await document.exitFullscreen();
			if (!isFullscreen) await wrapperRef.current?.requestFullscreen();
		} catch (error) {
			console.error('Unable to change explorer fullscreen', error);
		}
	}
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const isValid = normalizeArweaveNode(props.node) !== null;
	const [selected, setSelected] = React.useState(() => {
		const path = readArweaveNodeRoute(location.pathname)?.subPath;
		return path === '/miners'
			? 'miners'
			: path === '/mempool'
			? 'mempool'
			: path === '/transactions'
			? 'transactions'
			: 'overview';
	});
	const readInfo = React.useCallback((signal: AbortSignal) => arweaveNodeApi.getInfo(props.node, signal), [props.node]);
	const info = useNodeResource(readInfo, props.isActive && isValid, true);
	const isResolved = info.data !== null;
	React.useEffect(() => {
		if (isResolved) props.onResolved(props.node);
	}, [isResolved, props.node, props.onResolved]);
	const history = useNodeHistory(props.node, info.data, props.isActive && isValid && selected !== 'mempool');
	const rewards = React.useMemo(() => sumMiningRewards(history.blocks), [history.blocks]);
	const rewardsLabel = !history.blocks.length
		? '—'
		: rewards.amounts.length
		? rewards.amounts.map(({ value, denomination }) => formatNodeRewardTotal(value, denomination)).join(' + ')
		: rewards.incomplete
		? '—'
		: formatNodeRewardTotal('0');

	function handleSubmit() {
		const next = normalizeArweaveNode(input);
		if (!next) return;
		if (next !== props.node) navigate(getArweaveNodeRoute(next));
		else {
			setRefreshRevision((value) => value + 1);
			info.refresh();
			history.refresh();
		}
	}
	React.useEffect(() => {
		setShowInfo(false);
		if (!props.isActive) return;
		const path = readArweaveNodeRoute(location.pathname)?.subPath;
		setSelected(
			path === '/miners'
				? 'miners'
				: path === '/mempool'
				? 'mempool'
				: path === '/transactions'
				? 'transactions'
				: 'overview'
		);
	}, [location.pathname, props.isActive]);
	React.useEffect(() => {
		props.onLoadingChange(props.isActive && (info.isLoading || (selected !== 'mempool' && history.isLoading)));
		return () => props.onLoadingChange(false);
	}, [props.isActive, info.isLoading, history.isLoading, selected, props.onLoadingChange]);
	const tabs = [
		{
			label: language.overview,
			icon: ASSETS.overview,
			disabled: !isResolved,
			url: getArweaveNodeRoute(props.node),
			content: <NodeOverview info={info} history={history} />,
		},
		{
			label: language.transactions,
			icon: ASSETS.transaction,
			disabled: !isResolved,
			url: getArweaveNodeRoute(props.node, 'transactions'),
			content: (
				<NodeTransactions
					node={props.node}
					history={history}
					isActive={props.isActive && selected === 'transactions' && isResolved}
					isResolving={!isResolved && info.isLoading}
					refreshRevision={refreshRevision}
					showInfo={showInfo}
					onCloseInfo={handleCloseInfo}
				/>
			),
		},
		{
			label: language.nodeMempool,
			icon: ASSETS.pending,
			disabled: !isResolved,
			url: getArweaveNodeRoute(props.node, 'mempool'),
			content: (
				<NodeMempool
					isResolving={!isResolved && info.isLoading}
					showInfo={showInfo}
					onCloseInfo={handleCloseInfo}
					refreshRevision={refreshRevision}
					node={props.node}
					isActive={props.isActive && selected === 'mempool' && isResolved}
				/>
			),
		},
		{
			label: language.nodeMiners,
			icon: ASSETS.users,
			disabled: !isResolved,
			url: getArweaveNodeRoute(props.node, 'miners'),
			content: (
				<NodeMiners
					isResolving={!isResolved && info.isLoading}
					showInfo={showInfo}
					onCloseInfo={handleCloseInfo}
					refreshRevision={refreshRevision}
					node={props.node}
					history={history}
					isActive={props.isActive && selected === 'miners' && isResolved}
				/>
			),
		},
	];
	return (
		<C.Wrapper ref={wrapperRef}>
			<ExplorerControls
				pinTarget={props.pinTarget}
				value={input}
				onValueChange={setInput}
				valid={normalizeArweaveNode(input) !== null}
				loading={info.isLoading}
				onSubmit={handleSubmit}
				isFullscreen={isFullscreen}
				onFullscreen={handleFullscreen}
				placeholder={language.nodeSearchInput}
				actions={
					isValid && (
						<C.SeparatedActions>
							<Button
								type={'alt1'}
								icon={ASSETS.newTab}
								tooltip={language.nodeVisit}
								height={32.5}
								width={32.5}
								iconSize={14.5}
								noMinWidth
								onPress={() => window.open(props.node, '_blank', 'noopener,noreferrer')}
								stopPropagation
								preventDefault
							/>
							{selected !== 'overview' && (
								<Button
									type={'alt1'}
									icon={ASSETS.info}
									tooltip={language.nodeTabInfo}
									height={32.5}
									width={32.5}
									iconSize={14.5}
									noMinWidth
									onPress={() => setShowInfo(true)}
									active={showInfo}
									stopPropagation
									preventDefault
								/>
							)}
						</C.SeparatedActions>
					)
				}
				info={
					<C.TxInfoWrapper>
						{isResolved && (
							<C.UpdateWrapperType>
								<ReactSVG src={ASSETS['arweave-node']} />
								<span>{language.nodeExplorer}</span>
							</C.UpdateWrapperType>
						)}
						{info.data && (
							<C.UpdateWrapper>
								<span>{info.data.network}</span>
							</C.UpdateWrapper>
						)}
						{info.data && selected === 'miners' && (
							<C.UpdateWrapper title={language.nodeRewardsDescription}>
								<span>
									{language.nodeSummedRewards}: {rewardsLabel}
									{rewards.incomplete ? ` (${language.nodeRewardsPartial})` : ''}
								</span>
							</C.UpdateWrapper>
						)}
					</C.TxInfoWrapper>
				}
			/>
			{!isValid ? (
				<S.Error role={'alert'}>{language.nodeErrors['invalid-input']}</S.Error>
			) : (
				<>
					{'error' in info.state && <S.Error role={'alert'}>{language.nodeErrors[info.state.error]}</S.Error>}
					<URLTabs
						noUrlCopy
						tabs={tabs}
						activeUrl={getArweaveNodeRoute(props.node, selected === 'overview' ? '' : selected)}
					/>
				</>
			)}
		</C.Wrapper>
	);
}

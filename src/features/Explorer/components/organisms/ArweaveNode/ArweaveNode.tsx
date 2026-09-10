import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { arweaveNodeApi } from 'api/arweaveNode';

import { ExternalLink } from 'components/atoms/ExternalLink';
import { URLTabs } from 'components/atoms/URLTabs';
import { ExplorerControls, ExplorerControlStyles as C } from 'components/molecules/ExplorerControls';
import { getArweaveNodeRoute, normalizeArweaveNode, readArweaveNodeRoute } from 'helpers/arweaveNode';
import { ASSETS } from 'helpers/config';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { useNodeHistory } from '../../../hooks/useNodeHistory';
import { useNodeResource } from '../../../hooks/useNodeResource';
import { NodeMempool } from '../NodeMempool';
import { NodeMiners } from '../NodeMiners';
import { NodeOverview } from '../NodeOverview';

import * as S from './styles';

export default function ArweaveNode(props: {
	node: string;
	isActive: boolean;
	onLoadingChange: (loading: boolean) => void;
}) {
	const location = useLocation();
	const navigate = useNavigate();
	const wrapperRef = React.useRef<HTMLDivElement>(null);
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
		return path === '/miners' ? 'miners' : path === '/mempool' ? 'mempool' : 'overview';
	});
	const readInfo = React.useCallback((signal: AbortSignal) => arweaveNodeApi.getInfo(props.node, signal), [props.node]);
	const info = useNodeResource(readInfo, props.isActive && isValid, true);
	const history = useNodeHistory(props.node, info.data, props.isActive && isValid && selected !== 'mempool');
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
		if (!props.isActive) return;
		const path = readArweaveNodeRoute(location.pathname)?.subPath;
		setSelected(path === '/miners' ? 'miners' : path === '/mempool' ? 'mempool' : 'overview');
	}, [location.pathname, props.isActive]);
	React.useEffect(() => {
		props.onLoadingChange(props.isActive && (info.isLoading || (selected !== 'mempool' && history.isLoading)));
		return () => props.onLoadingChange(false);
	}, [props.isActive, info.isLoading, history.isLoading, selected, props.onLoadingChange]);
	const tabs = [
		{
			label: language.overview,
			icon: ASSETS.overview,
			disabled: false,
			url: getArweaveNodeRoute(props.node),
			content: <NodeOverview info={info} history={history} />,
		},
		{
			label: language.nodeMempool,
			icon: ASSETS.pending,
			disabled: false,
			url: getArweaveNodeRoute(props.node, 'mempool'),
			content: (
				<NodeMempool
					refreshRevision={refreshRevision}
					node={props.node}
					isActive={props.isActive && selected === 'mempool' && isValid}
				/>
			),
		},
		{
			label: language.nodeMiners,
			icon: ASSETS.users,
			disabled: false,
			url: getArweaveNodeRoute(props.node, 'miners'),
			content: (
				<NodeMiners
					refreshRevision={refreshRevision}
					node={props.node}
					history={history}
					isActive={props.isActive && selected === 'miners' && isValid}
				/>
			),
		},
	];
	return (
		<C.Wrapper ref={wrapperRef}>
			<ExplorerControls
				value={input}
				onValueChange={setInput}
				valid={normalizeArweaveNode(input) !== null}
				loading={info.isLoading}
				onSubmit={handleSubmit}
				isFullscreen={isFullscreen}
				onFullscreen={handleFullscreen}
				placeholder={language.nodeSearchInput}
				actions={isValid && <ExternalLink href={props.node} label={language.nodeVisit} />}
				info={
					<C.TxInfoWrapper>
						<C.UpdateWrapperType>
							<ReactSVG src={ASSETS['arweave-node']} />
							<span>{language.nodeExplorer}</span>
						</C.UpdateWrapperType>
						{info.data && (
							<C.UpdateWrapper>
								<span>{info.data.network}</span>
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
					<URLTabs tabs={tabs} activeUrl={getArweaveNodeRoute(props.node, selected === 'overview' ? '' : selected)} />
				</>
			)}
		</C.Wrapper>
	);
}

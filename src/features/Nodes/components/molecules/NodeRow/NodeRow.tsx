import type { ArweavePeer, NodeObservation } from 'api/nodes';

import { ExternalLink } from 'components/atoms/ExternalLink';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { useNodeInfo } from '../../../hooks/useNodeInfo';

import * as S from './styles';

export default function NodeRow(props: {
	peer: ArweavePeer;
	infoEnabled: boolean;
	isChecking: boolean;
	observation: NodeObservation | undefined;
	onObservation: (data: NodeObservation) => void;
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const result = useNodeInfo(props.peer, props.infoEnabled, props.observation, props.onObservation);
	const observation = props.observation ?? (result.state.status === 'success' ? result.state.data : null);
	const info = observation?.status === 'reachable' ? observation.info : null;
	const status =
		observation?.status === 'reachable'
			? language.nodeReachable
			: observation?.status === 'unavailable'
			? language.nodeUnavailable
			: props.isChecking || result.state.status === 'loading'
			? `${language.checking}...`
			: language.nodeNotChecked;
	return (
		<S.Row ref={result.ref}>
			<td>
				<ExternalLink href={`http://${props.peer.address}/`} label={props.peer.address} title={props.peer.address} />
			</td>
			<td>
				<S.Status title={props.infoEnabled || props.isChecking ? language.nodesInfoSource : language.nodesInfoPaused}>
					<S.StatusDot $status={observation?.status ?? 'idle'} aria-hidden={'true'} />
					{status}
				</S.Status>
			</td>
			<td>{info?.height.toLocaleString() ?? '—'}</td>
			<td>{info ? `${info.version} / ${info.release}` : '—'}</td>
			<td>{info?.peers.toLocaleString() ?? '—'}</td>
			<td title={language.nodesInfoSource}>
				{observation?.status === 'reachable' ? language.nodeLatency(observation.latencyMs.toLocaleString()) : '—'}
			</td>
			<td>{observation ? new Date(observation.checkedAt).toLocaleTimeString() : '—'}</td>
		</S.Row>
	);
}

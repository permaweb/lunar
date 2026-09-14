import React from 'react';

import type { ArweavePeer, NodeObservation } from 'api/nodes';

import { useLanguageProvider } from 'providers/LanguageProvider';

import { NodeRow } from '../NodeRow';

import * as S from './styles';

export default function NodeTable(props: {
	sections: { id: string; heading?: React.ReactNode; peers: ArweavePeer[] }[];
	observations: Record<string, NodeObservation>;
	checkingPeers: string[];
	infoEnabled: boolean;
	revision?: number;
	infoSource?: string;
	statusMessage?: string;
	onObservation: (observation: NodeObservation) => void;
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	return (
		<S.TableScroll tabIndex={0} role={'region'} aria-label={language.arweaveNodes}>
			<S.Table aria-label={language.arweaveNodes}>
				<thead>
					<tr>
						{[
							language.nodeEndpoint,
							language.status,
							language.height,
							language.nodeVersionRelease,
							language.nodePeers,
							language.nodeResponseTime,
							language.nodeLastChecked,
						].map((label) => (
							<th scope={'col'} key={label}>
								{label}
							</th>
						))}
					</tr>
				</thead>
				{props.statusMessage && (
					<tbody>
						<S.InfoRow>
							<td colSpan={7} role={'status'}>
								{props.statusMessage}
							</td>
						</S.InfoRow>
					</tbody>
				)}
				{props.sections.map((section) => (
					<tbody key={section.id}>
						{section.heading && (
							<S.InfoRow>
								<S.GroupHeading colSpan={7} scope={'rowgroup'}>
									{section.heading}
								</S.GroupHeading>
							</S.InfoRow>
						)}
						{section.peers.map((peer) => (
							<NodeRow
								key={`${props.revision ?? 0}:${peer.address}`}
								peer={peer}
								infoEnabled={props.infoEnabled}
								isChecking={props.checkingPeers.includes(peer.address)}
								observation={props.observations[peer.address]}
								onObservation={props.onObservation}
								infoSource={props.infoSource}
							/>
						))}
					</tbody>
				))}
			</S.Table>
		</S.TableScroll>
	);
}

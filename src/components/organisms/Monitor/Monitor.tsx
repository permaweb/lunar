import React from 'react';

import { TxAddress } from 'components/atoms/TxAddress';
import { getTagValue } from 'helpers/utils';

import { GraphQLPlayground } from '../GraphQLPlayground';

import * as S from './styles';

const CURRENT_NODE = 'https://app-1.forward.computer';
const SU_URL = 'https://su-router.ao-testnet.xyz';

function MonitorElement(props: { node: any }) {
	const [currentSlot, setCurrentSlot] = React.useState<number | null>(null);
	const [targetSlot, setTargetSlot] = React.useState<number | null>(null);

	React.useEffect(() => {
		if (props.node) {
			(async function () {
				try {
					const targetSlotResponse = await fetch(`${SU_URL}/${props.node.id}/latest`);
					const targetSlotParsed = Number(getTagValue((await targetSlotResponse.json()).assignment?.tags, 'Nonce'));
					setTargetSlot(targetSlotParsed);
				} catch (e: any) {
					console.error(e);
				}

				try {
					const currentSlotResponse = await fetch(`${CURRENT_NODE}/${props.node.id}~process@1.0/compute/at-slot`);
					const currentSlotParsed = Number(await currentSlotResponse.text());
					setCurrentSlot(currentSlotParsed);
				} catch (e: any) {
					console.error(e);
				}
			})();
		}
	}, [props.node]);

	const percentage =
		currentSlot !== null && targetSlot !== null && targetSlot > 0
			? ((currentSlot / targetSlot) * 100).toFixed(2) + '%'
			: '-';

	return (
		<S.ElementWrapper open={false}>
			<S.ID>
				<TxAddress address={props.node.id} />
			</S.ID>
			<S.Current>
				<p>{currentSlot ?? 'Loading...'}</p>
			</S.Current>
			<S.Target>
				<p>{targetSlot ?? 'Loading...'}</p>
			</S.Target>
			<S.Status>
				<p>{percentage}</p>
			</S.Status>
			<S.Actions>
				<p>-</p>
			</S.Actions>
		</S.ElementWrapper>
	);
}

export default function Monitor(props: {
	monitorId: string;
	active: boolean;
	initialQuery?: string;
	initialGateway?: string;
	onQueryChange?: (query: string, queryName?: string) => void;
	onGatewayChange?: (gateway: string) => void;
}) {
	const [currentData, setCurrentData] = React.useState<any>(null);

	async function handleResponse(gqlResponse: any) {
		try {
			setCurrentData(gqlResponse?.data?.transactions?.edges);
		} catch (e: any) {
			console.error(e);
		}
	}

	const Response = () => (
		<S.MonitorTableWrapper className={'border-wrapper-alt2'}>
			<S.Header>
				<S.HeaderMain>
					<p>Results</p>
				</S.HeaderMain>
			</S.Header>
			{currentData ? (
				<S.BodyWrapper>
					<S.SubheaderWrapper>
						<S.ID>
							<p>ID</p>
						</S.ID>
						<S.Current>
							<p>Current</p>
						</S.Current>
						<S.Target>
							<p>Target</p>
						</S.Target>
						<S.Status>
							<p>Status</p>
						</S.Status>
						<S.Actions>
							<p>Actions</p>
						</S.Actions>
					</S.SubheaderWrapper>
					<S.ElementsWrapper className={'scroll-wrapper-hidden'}>
						{currentData.map((edge) => {
							return <MonitorElement key={edge.node.id} node={edge.node} />;
						})}
					</S.ElementsWrapper>
				</S.BodyWrapper>
			) : (
				<S.WrapperEmpty>
					<p>Run for Results</p>
				</S.WrapperEmpty>
			)}
		</S.MonitorTableWrapper>
	);

	return (
		<GraphQLPlayground
			playgroundId={props.monitorId}
			active={props.active}
			initialQuery={props.initialQuery}
			initialGateway={props.initialGateway}
			onQueryChange={props.onQueryChange}
			onGatewayChange={props.onGatewayChange}
			onResponse={handleResponse}
			response={<Response />}
		/>
	);
}

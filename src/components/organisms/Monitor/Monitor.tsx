import React from 'react';

import { Button } from 'components/atoms/Button';
import { TxAddress } from 'components/atoms/TxAddress';
import { getTagValue } from 'helpers/utils';

import { GraphQLPlayground } from '../GraphQLPlayground';

import * as S from './styles';

const CURRENT_NODE = 'http://localhost:8734';
const SU_URL = 'https://su-router.ao-testnet.xyz';

function MonitorElement(props: { node: any }) {
	const [currentSlot, setCurrentSlot] = React.useState<string | number | null>(null);
	const [targetSlot, setTargetSlot] = React.useState<string | number | null>(null);

	const fetchedRef = React.useRef(false);

	React.useEffect(() => {
		if (props.node && !fetchedRef.current) {
			fetchedRef.current = true;

			const fetchTargetSlot = async () => {
				try {
					const response = await fetch(`${SU_URL}/${props.node.id}/latest`);
					const data = await response.json();
					const slot = Number(getTagValue(data.assignment?.tags, 'Nonce'));
					setTargetSlot(slot);
				} catch (e: any) {
					console.error('Error fetching target slot:', e);
					setTargetSlot('Error');
				}
			};

			const fetchCurrentSlot = async () => {
				try {
					const response = await fetch(`${CURRENT_NODE}/${props.node.id}~process@1.0/compute/at-slot`);
					const slot = Number(await response.text());
					setCurrentSlot(slot);
				} catch (e: any) {
					console.error('Error fetching current slot:', e);
					setCurrentSlot('Error');
				}
			};

			// TODO: Handle non AO.TN.1
			Promise.all([fetchTargetSlot(), fetchCurrentSlot()]);
		}
	}, [props.node.id]);

	const hasError = currentSlot === 'Error' || targetSlot === 'Error';
	const isLoading = currentSlot === null || targetSlot === null;

	const calculatePercentage = (): number | null => {
		if (hasError || isLoading) return null;
		if (typeof currentSlot === 'number' && typeof targetSlot === 'number' && targetSlot > 0) {
			return Math.round((currentSlot / targetSlot) * 100);
		}
		return null;
	};

	const percentage = calculatePercentage();
	const percentageDisplay = hasError ? 'Error' : percentage !== null ? `${percentage}%` : '-';

	const getSlotDisplay = (slot: string | number | null): string => {
		if (slot === null) return 'Loading...';
		if (slot === 'Error') return 'Error';
		return String(slot);
	};

	return (
		<S.ElementWrapper open={false}>
			<S.ID>
				<TxAddress address={props.node.id} />
			</S.ID>
			<S.Current>
				<p>{getSlotDisplay(currentSlot)}</p>
			</S.Current>
			<S.Target>
				<p>{getSlotDisplay(targetSlot)}</p>
			</S.Target>
			<S.StatusIndicator percentage={hasError ? 'Error' : percentage}>
				<p>{percentageDisplay}</p>
			</S.StatusIndicator>
			<S.Actions>
				<Button type={'alt2'} label={'Hydrate'} handlePress={(e) => console.log(e)} disabled={false} />
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
	const [loading, setLoading] = React.useState<boolean>(false);
	const [currentData, setCurrentData] = React.useState<any>(null);

	async function handleResponse(gqlResponse: any) {
		try {
			setCurrentData(gqlResponse?.data?.transactions?.edges);
		} catch (e: any) {
			console.error(e);
		}
	}

	const Response = React.useMemo(
		() => (
			<S.MonitorTableWrapper className={'border-wrapper-alt2 scroll-wrapper-hidden'}>
				<S.Header>
					<S.HeaderMain>
						<S.HeaderLabel>
							<p>{`Results`}</p>
							{currentData?.length > 0 && <span>{`(${currentData.length})`}</span>}
						</S.HeaderLabel>
					</S.HeaderMain>
				</S.Header>
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
					{currentData && !loading ? (
						<S.ElementsWrapper>
							{currentData?.length > 0 ? (
								<>
									{currentData.map((edge) => {
										return <MonitorElement key={edge.node.id} node={edge.node} />;
									})}
								</>
							) : (
								<S.WrapperEmpty>
									<p>{loading ? 'Loading...' : 'No Results'}</p>
								</S.WrapperEmpty>
							)}
						</S.ElementsWrapper>
					) : (
						<S.WrapperEmpty>
							<p>{loading ? 'Loading...' : 'Run for Results'}</p>
						</S.WrapperEmpty>
					)}
				</S.BodyWrapper>
			</S.MonitorTableWrapper>
		),
		[currentData, loading]
	);

	return (
		<GraphQLPlayground
			playgroundId={props.monitorId}
			active={props.active}
			initialQuery={props.initialQuery}
			initialGateway={props.initialGateway}
			onQueryChange={props.onQueryChange}
			onGatewayChange={props.onGatewayChange}
			setLoading={(isLoading: boolean) => setLoading(isLoading)}
			onResponse={handleResponse}
			response={Response}
		/>
	);
}

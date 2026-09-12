import React from 'react';

import type { NodeForkHistory } from 'api/arweaveNode';
import { arweaveNodeApi, ArweaveNodeError } from 'api/arweaveNode';

import { Select } from 'components/atoms/Select';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { ForkHistoryGraph } from '../../molecules/ForkHistoryGraph';

import * as S from './styles';

type HistoryState =
	| { status: 'loading'; data?: NodeForkHistory }
	| { status: 'ready'; data: NodeForkHistory }
	| { status: 'error'; data?: NodeForkHistory; error: string };

export default function ForkHistory(props: {
	nodes: string[];
	refreshRevision: number;
	onLoadingChange: (loading: boolean) => void;
}) {
	const provider = useLanguageProvider();
	const language = provider.object[provider.current];
	const [node, setNode] = React.useState(props.nodes[0]);
	const [revision, setRevision] = React.useState(0);
	const [state, setState] = React.useState<HistoryState>({ status: 'loading' });
	const previous = React.useRef<{ node: string; data: NodeForkHistory } | null>(null);
	React.useEffect(() => {
		const controller = new AbortController();
		let data = previous.current?.node === node ? previous.current.data : undefined;
		const hasPreviousDiagram = !!data;
		setState({ status: 'loading', data });
		void arweaveNodeApi
			.getForkHistory(node, controller.signal, (progress) => {
				if (controller.signal.aborted) return;
				// During refresh retain the complete diagram until its replacement is verified.
				if (hasPreviousDiagram) return;
				data = progress;
				setState({ status: 'loading', data });
			})
			.then((fresh) => {
				if (controller.signal.aborted) return;
				if (!fresh.forksAvailable && data?.forksAvailable) {
					setState({ status: 'error', data, error: language.nodeForkHistoryUnsupported });
					return;
				}
				previous.current = { node, data: fresh };
				setState({ status: 'ready', data: fresh });
			})
			.catch((error: unknown) => {
				if (controller.signal.aborted) return;
				setState({
					status: 'error',
					data,
					error:
						error instanceof ArweaveNodeError && [404, 405, 501].includes(error.status)
							? language.nodeForkHistoryUnsupported
							: language.nodeErrors[error instanceof ArweaveNodeError ? error.code : 'unavailable'],
				});
			});
		return () => controller.abort();
	}, [node, revision, props.refreshRevision, language]);
	React.useEffect(() => {
		props.onLoadingChange(state.status === 'loading');
	}, [state.status, props.onLoadingChange]);
	React.useEffect(() => {
		if (state.status === 'loading') return;
		const timer = setInterval(() => {
			if (!document.hidden) setRevision((value) => value + 1);
		}, 60_000);
		return () => clearInterval(timer);
	}, [state.status]);
	return (
		<S.Content>
			<S.Controls>
				<S.SelectWrapper>
					<Select
						label={language.nodeForkHistorySource}
						options={props.nodes.map((id) => ({ id, label: id }))}
						activeOption={{ id: node, label: node }}
						setActiveOption={(option) => setNode(option.id)}
						disabled={false}
						top={74.5}
					/>
				</S.SelectWrapper>
			</S.Controls>
			<S.Note>{language.nodeForkHistoryDescription}</S.Note>
			<S.Status role={'status'}>
				{state.status === 'loading'
					? language.nodeForkHistoryLoading
					: state.status === 'error'
					? `${state.error}${state.data ? ` ${language.nodeStale}` : ''}`
					: language.nodeLastObserved(new Date(state.data.checkedAt).toLocaleString())}
			</S.Status>
			{state.data && (
				<>
					{!state.data.forksAvailable && <S.Note>{language.nodeForkHistoryUnsupported}</S.Note>}
					<ForkHistoryGraph key={node} history={state.data} />
				</>
			)}
		</S.Content>
	);
}

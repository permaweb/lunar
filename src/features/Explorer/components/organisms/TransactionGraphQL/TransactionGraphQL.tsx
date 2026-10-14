import React from 'react';

import {
	getGraphQLEndpoint,
	getTransactionIndexQuery,
	readTransactionIndex,
	type TransactionIndexResult,
} from 'api/graphql';

import { Modal } from 'components/atoms/Modal';
import { StatusIndicator } from 'components/atoms/StatusIndicator';
import { GraphQLPlayground } from 'components/organisms/GraphQLPlayground';
import { ASSETS } from 'helpers/config';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function TransactionGraphQL(props: { txId: string; active: boolean; refreshKey: number }) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current].transactionGraphql;
	const endpoint = getGraphQLEndpoint();
	const [isOpen, setIsOpen] = React.useState(false);
	const [revision, setRevision] = React.useState(0);
	const [lookup, setLookup] = React.useState<{
		id: string;
		endpoint: string;
		refreshKey: number;
		revision: number;
		result: TransactionIndexResult;
	} | null>(null);
	const result =
		lookup?.id === props.txId &&
		lookup.endpoint === endpoint &&
		lookup.refreshKey === props.refreshKey &&
		lookup.revision === revision
			? lookup.result
			: null;
	const description = !result
		? language.checking
		: result.status === 'available'
		? language.available
		: result.status === 'missing'
		? language.missing
		: language.error;

	React.useEffect(() => {
		if (!props.active) return;
		const controller = new AbortController();
		void readTransactionIndex({ id: props.txId, endpoint, signal: controller.signal }).then((result) => {
			if (!controller.signal.aborted) {
				setLookup({ id: props.txId, endpoint, refreshKey: props.refreshKey, revision, result });
			}
		});
		return () => controller.abort();
	}, [props.txId, props.active, props.refreshKey, endpoint, revision]);

	function handleOpen() {
		setIsOpen(true);
	}
	function handleClose() {
		setIsOpen(false);
	}
	function handleQueryExecuted() {
		setRevision((previous) => previous + 1);
	}

	return (
		<>
			<S.Chip
				onClick={handleOpen}
				title={`${description} (${endpoint})`}
				aria-label={`${language.label}: ${description}`}
			>
				<span>{language.label}</span>
				<StatusIndicator
					status={
						!result || result.status === 'error' ? 'pending' : result.status === 'available' ? 'success' : 'failure'
					}
					icon={result?.status === 'missing' ? ASSETS.close : undefined}
				/>
			</S.Chip>
			{isOpen && props.active && (
				<Modal type={'panel'} header={language.title} onClose={handleClose} width={650}>
					<S.PanelContent>
						<S.Description role={'status'}>{`${description} (${endpoint})`}</S.Description>
						<GraphQLPlayground
							playgroundId={`explorer-${props.txId}`}
							active
							layout={'stacked'}
							noFullScreen
							initialGateway={endpoint}
							initialQuery={getTransactionIndexQuery(props.txId)}
							initialResult={result && result.status !== 'error' ? result.response : undefined}
							onQueryExecuted={handleQueryExecuted}
						/>
					</S.PanelContent>
				</Modal>
			)}
		</>
	);
}

import React from 'react';

import { ExplorerLink } from 'components/atoms/TxAddress';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { NODE_PAGE_SIZE } from '../../../model/node';
import { NodePagination } from '../NodePagination';

import * as S from './styles';

export default function NodeTransactionChanges(props: {
	title: string;
	ids: string[];
	loading: boolean;
	isBaseline: boolean;
}) {
	const provider = useLanguageProvider();
	const language = provider.object[provider.current];
	const [page, setPage] = React.useState(0);
	React.useEffect(() => setPage(0), [props.ids]);
	const totalPages = Math.max(1, Math.ceil(props.ids.length / NODE_PAGE_SIZE));
	const currentPage = Math.min(page, totalPages - 1);
	const titleId = React.useId();
	return (
		<S.Container>
			<S.Header>
				<S.Title id={titleId}>
					{props.title} <span>({props.ids.length.toLocaleString()})</span>
				</S.Title>
			</S.Header>
			<S.Table aria-labelledby={titleId} aria-busy={props.loading}>
				<thead>
					<tr>
						<th scope={'col'}>{language.nodeTransactionId}</th>
					</tr>
				</thead>
				<tbody>
					{props.ids.slice(currentPage * NODE_PAGE_SIZE, (currentPage + 1) * NODE_PAGE_SIZE).map((id) => (
						<tr key={id}>
							<td>
								<ExplorerLink value={id} />
							</td>
						</tr>
					))}
					{!props.ids.length && (
						<S.EmptyRow>
							<td>
								<S.Note role={props.loading ? 'status' : undefined}>
									{props.loading
										? language.nodeMempoolLoading
										: props.isBaseline
										? language.nodeMempoolBaseline
										: language.nodeNoChanges}
								</S.Note>
							</td>
						</S.EmptyRow>
					)}
				</tbody>
			</S.Table>
			<S.Footer>
				<NodePagination page={currentPage} totalPages={totalPages} onPageChange={setPage} showCounter />
			</S.Footer>
		</S.Container>
	);
}

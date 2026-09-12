import React from 'react';

import { Button } from 'components/atoms/Button';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function NodePagination(props: {
	page: number;
	totalPages: number;
	showCounter: boolean;
	hasMore?: boolean;
	loading?: boolean;
	onPageChange: (page: number) => void;
}): React.ReactElement {
	const provider = useLanguageProvider();
	const language = provider.object[provider.current];
	return (
		<>
			<Button
				type={'alt3'}
				label={language.previous}
				disabled={props.page === 0}
				onPress={() => props.onPageChange(props.page - 1)}
			/>
			{props.showCounter && (
				<S.PageCount>
					{props.hasMore ? language.nodePage(props.page + 1) : language.nodesPage(props.page + 1, props.totalPages)}
				</S.PageCount>
			)}
			<Button
				type={'alt3'}
				label={language.next}
				disabled={(props.loading || !props.hasMore) && props.page >= props.totalPages - 1}
				onPress={() => props.onPageChange(props.page + 1)}
			/>
		</>
	);
}

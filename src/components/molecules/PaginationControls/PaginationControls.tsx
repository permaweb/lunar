import React from 'react';

import { Button } from 'components/atoms/Button';
import { formatCount } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function PaginationControls(props: {
	pageInput: string;
	perPageInput: string;
	totalPages?: number | null;
	disabled?: boolean;
	pageDisabled?: boolean;
	pageSubmitDisabled?: boolean;
	perPageDisabled?: boolean;
	perPageSubmitDisabled?: boolean;
	onPageInputChange: (value: string) => void;
	onPageSubmit: () => void;
	onPerPageInputChange: (value: string) => void;
	onPerPageSubmit: () => void;
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	function handlePageKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Enter') props.onPageSubmit();
	}

	function handlePerPageKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Enter') props.onPerPageSubmit();
	}

	return (
		<S.Wrapper>
			<S.ControlGroup>
				<label>{language.page}</label>
				<input
					aria-label={language.page}
					type={'number'}
					min={1}
					value={props.pageInput}
					onChange={(e) => props.onPageInputChange(e.target.value)}
					onKeyDown={handlePageKeyDown}
					disabled={props.disabled || props.pageDisabled}
				/>
				{props.totalPages ? <span>/ {formatCount(props.totalPages.toString())}</span> : null}
				<Button
					type={'alt3'}
					label={language.apply}
					handlePress={props.onPageSubmit}
					disabled={props.disabled || props.pageDisabled || props.pageSubmitDisabled}
					height={30}
					noMinWidth
					padding={'0 10px'}
				/>
			</S.ControlGroup>
			<S.Divider />
			<S.ControlGroup>
				<label>{language.resultsPerPage}</label>
				<input
					aria-label={language.resultsPerPage}
					type={'number'}
					min={1}
					value={props.perPageInput}
					onChange={(e) => props.onPerPageInputChange(e.target.value)}
					onKeyDown={handlePerPageKeyDown}
					disabled={props.disabled || props.perPageDisabled}
				/>
				<Button
					type={'alt3'}
					label={language.apply}
					handlePress={props.onPerPageSubmit}
					disabled={props.disabled || props.perPageDisabled || props.perPageSubmitDisabled}
					height={30}
					noMinWidth
					padding={'0 10px'}
				/>
			</S.ControlGroup>
		</S.Wrapper>
	);
}

import React from 'react';

import { type CommitmentInfo } from 'api/aoCore';

import { Button } from 'components/atoms/Button';
import { CopyableValue } from 'components/atoms/CopyableValue';
import { ExplorerTable } from 'components/molecules/ExplorerTable';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { getFieldCoverage, MESSAGE_FIELDS_PAGE_SIZE } from '../../../model/fields';

import * as S from './styles';

export default function AoCoreCoverage(props: {
	fieldKey: string;
	commitments: CommitmentInfo[];
	selectedCommitment?: string;
	onSelectCommitment?: (id: string) => void;
}) {
	const provider = useLanguageProvider();
	const copy = provider.object[provider.current];
	const language = copy.aoCore;
	const [page, setPage] = React.useState(0);
	const coverage = getFieldCoverage(props.fieldKey, props.commitments);
	const label = language.coverageFor(props.fieldKey);
	const totalPages = Math.max(1, Math.ceil(coverage.length / MESSAGE_FIELDS_PAGE_SIZE));
	const activePage = Math.min(page, totalPages - 1);
	const rows = coverage.slice(activePage * MESSAGE_FIELDS_PAGE_SIZE, (activePage + 1) * MESSAGE_FIELDS_PAGE_SIZE);

	return (
		<>
			<S.Header>
				<h4>{label}</h4>
				{totalPages > 1 && (
					<S.Actions>
						<Button
							type="alt3"
							label={copy.previous}
							disabled={activePage === 0}
							onPress={() => setPage(activePage - 1)}
						/>
						<S.Page>{language.fieldsPage(activePage + 1, totalPages)}</S.Page>
						<Button
							type="alt3"
							label={copy.next}
							disabled={activePage === totalPages - 1}
							onPress={() => setPage(activePage + 1)}
						/>
					</S.Actions>
				)}
			</S.Header>
			<S.Description>{language.coverageEvidenceDescription}</S.Description>
			<ExplorerTable
				label={label}
				rows={rows}
				getRowKey={(entry) => entry.id}
				minWidth={650}
				columns={[
					{
						key: 'commitment',
						label: language.commitmentId,
						render: (entry) =>
							props.onSelectCommitment ? (
								<S.SelectCommitment
									title={entry.id}
									aria-label={language.graph.highlighted(entry.id)}
									aria-pressed={props.selectedCommitment === entry.id}
									onClick={() => props.onSelectCommitment(entry.id)}
								>
									{entry.id}
								</S.SelectCommitment>
							) : (
								<CopyableValue value={entry.id} copiedLabel={copy.copied} fullWidth />
							),
					},
					{
						key: 'kind',
						label: language.commitmentKind,
						render: (entry) => (
							<p>
								{entry.kind === 'unsigned'
									? language.unsigned
									: entry.kind === 'signature'
									? language.signatureCommitment
									: language.notProvided}
							</p>
						),
					},
					{
						key: 'evidence',
						label: language.coverageEvidence,
						render: (entry) => (
							<CopyableValue
								tone={entry.status === 'not-listed' ? 'muted' : 'accent'}
								value={
									entry.position !== null
										? language.coverageMatch(entry.position, props.fieldKey)
										: entry.fieldCount === null
										? language.coverageUnavailable
										: language.coverageAbsent(entry.fieldCount)
								}
								copiedLabel={copy.copied}
								fullWidth
							/>
						),
					},
				]}
			/>
		</>
	);
}

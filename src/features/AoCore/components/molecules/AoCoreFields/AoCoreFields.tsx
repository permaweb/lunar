import React from 'react';

import { isMessageRecord, messageJson, messageText, type MessageValue, readCommitments } from 'api/aoCore';

import { Button } from 'components/atoms/Button';
import { CopyableValue } from 'components/atoms/CopyableValue';
import { Icon } from 'components/atoms/Icon';
import { Loader } from 'components/atoms/Loader';
import { Toggle } from 'components/atoms/Toggle';
import { ExplorerLink } from 'components/atoms/TxAddress';
import { ExplorerTable } from 'components/molecules/ExplorerTable';
import { ASSETS } from 'helpers/config';
import { checkValidAddress } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { useAoCoreValue } from '../../../hooks/useAoCoreMessage';
import {
	getFieldCoverage,
	getMessageFields,
	MAX_MESSAGE_EXPANSION_DEPTH,
	MESSAGE_FIELDS_PAGE_SIZE,
	type MessageField,
} from '../../../model/fields';
import { AoCoreCoverage } from '../AoCoreCoverage';
import { AoCoreCoverageInfo } from '../AoCoreCoverageInfo';

import * as S from './styles';

const AoCoreGraph = React.lazy(() => import('../AoCoreGraph').then((module) => ({ default: module.AoCoreGraph })));

type FieldExpansion = 'value' | 'coverage';

function LinkedValue(props: {
	id: string;
	ancestors: string[];
	depth: number;
	label: string;
	isCommitmentMetadata: boolean;
}) {
	const provider = useLanguageProvider();
	const language = provider.object[provider.current].aoCore;
	const [revision, setRevision] = React.useState(0);
	const state = useAoCoreValue(props.id, revision);
	if (state.status === 'idle' || state.status === 'loading') {
		return (
			<AoCoreFields
				label={props.label}
				ancestors={props.ancestors}
				depth={props.depth}
				isCommitmentMetadata={props.isCommitmentMetadata}
				loadingMessage={language.loadingLink}
			/>
		);
	}
	if (state.status !== 'ready') {
		return (
			<S.Status role={state.status === 'error' ? 'alert' : 'status'}>
				<p>{state.status === 'error' ? language.linkErrors[state.code] : language.loadingLink}</p>
				{state.status === 'error' && (
					<Button type="alt3" label={language.retry} onPress={() => setRevision((value) => value + 1)} />
				)}
			</S.Status>
		);
	}
	return (
		<>
			<S.Source>
				{language.provider}: {state.result.provider}
				<ExplorerLink value={props.id} label={language.openLinkedMessage} tooltipPosition={'right'} />
			</S.Source>
			<AoCoreFields
				value={state.result.data.value}
				label={props.label}
				ancestors={[...props.ancestors, props.id]}
				depth={props.depth}
				isCommitmentMetadata={props.isCommitmentMetadata}
			/>
		</>
	);
}

export default function AoCoreFields(
	props: {
		label: string;
		ancestors: string[];
		depth?: number;
		isCommitmentMetadata?: boolean;
	} & ({ value: MessageValue; loadingMessage?: never } | { value?: never; loadingMessage: string })
) {
	const provider = useLanguageProvider();
	const copy = provider.object[provider.current];
	const language = copy.aoCore;
	const regionId = React.useId();
	const depth = props.depth ?? 0;
	const isLoading = props.loadingMessage !== undefined;
	const [presentation, setPresentation] = React.useState<'table' | 'graph'>('table');
	const isGraph = depth === 0 && presentation === 'graph' && !isLoading;
	const [showCoverageInfo, setShowCoverageInfo] = React.useState(false);
	const [view, setView] = React.useState({ value: props.value, page: 0, expanded: new Map<string, FieldExpansion>() });
	const current =
		view.value === props.value ? view : { value: props.value, page: 0, expanded: new Map<string, FieldExpansion>() };
	const fields = React.useMemo(() => (props.value === undefined ? [] : getMessageFields(props.value)), [props.value]);
	const commitments = React.useMemo(
		() => (isMessageRecord(props.value) ? readCommitments(props.value) : []),
		[props.value]
	);
	const totalPages = Math.max(1, Math.ceil(fields.length / MESSAGE_FIELDS_PAGE_SIZE));
	const page = Math.min(current.page, totalPages - 1);
	const rows = fields.slice(page * MESSAGE_FIELDS_PAGE_SIZE, (page + 1) * MESSAGE_FIELDS_PAGE_SIZE);
	const message = isMessageRecord(props.value) ? props.value : null;
	const hasDevice = message && Object.keys(message).some((key) => key.toLowerCase() === 'device');
	const device = message && (messageText(message, 'device') ?? messageText(message, 'device+link'));
	const handleCloseCoverageInfo = React.useCallback(() => setShowCoverageInfo(false), []);

	function handleToggle(key: string, section: FieldExpansion) {
		setView((previous) => {
			const expanded = new Map(previous.value === props.value ? previous.expanded : []);
			if (expanded.get(key) === section) expanded.delete(key);
			else expanded.set(key, section);
			return { value: props.value, page, expanded };
		});
	}

	return (
		<S.Section aria-label={depth === 0 ? props.label : undefined} aria-busy={isLoading}>
			<S.Header $nested={depth > 0}>
				<S.Title $nested={depth > 0}>
					<h3>
						{props.label} {!isLoading && <S.Count>({fields.length.toLocaleString()})</S.Count>}
					</h3>
					{isLoading && (
						<div className="loader" aria-hidden="true">
							<Loader xSm relative />
						</div>
					)}
				</S.Title>
				<S.HeaderDetails>
					{depth === 0 && (
						<Toggle<'table' | 'graph'>
							label={language.graph.viewMode}
							value={presentation}
							options={[
								{ value: 'table', label: language.graph.table, disabled: isLoading },
								{ value: 'graph', label: language.graph.view, disabled: isLoading },
							]}
							onChange={setPresentation}
						/>
					)}
					{totalPages > 1 && !isGraph && (
						<S.Actions>
							<Button
								type="alt3"
								label={copy.previous}
								disabled={page === 0}
								onPress={() => setView({ ...current, page: page - 1, expanded: new Map() })}
							/>
							<S.Device>{language.fieldsPage(page + 1, totalPages)}</S.Device>
							<Button
								type="alt3"
								label={copy.next}
								disabled={page === totalPages - 1}
								onPress={() => setView({ ...current, page: page + 1, expanded: new Map() })}
							/>
						</S.Actions>
					)}
					{message && (
						<S.Device title={device || (hasDevice ? language.inlineDevice : language.defaultDevice)}>
							{language.device}:{' '}
							{device || (hasDevice ? language.inlineDevice : `message@1.0 (${language.inferredDevice})`)}
						</S.Device>
					)}
				</S.HeaderDetails>
			</S.Header>
			{isLoading ? (
				<S.Loading $nested={depth > 0} role="status">
					<p>{props.loadingMessage}</p>
				</S.Loading>
			) : isGraph ? (
				<React.Suspense
					fallback={
						<S.Loading $nested={false} role="status">
							<p>{language.graph.loading}</p>
						</S.Loading>
					}
				>
					<AoCoreGraph value={props.value} rootId={props.ancestors[0] ?? ''} />
				</React.Suspense>
			) : (
				<ExplorerTable
					label={props.label}
					rows={rows}
					getRowKey={(field) => field.key}
					minWidth={700}
					roundedBottom={depth === 0 && rows.length > 0}
					columnLayout={props.isCommitmentMetadata ? S.METADATA_COLUMNS : S.FIELD_COLUMNS}
					columns={[
						{
							key: 'key',
							label: language.fieldKey,
							render: (field) => <p title={field.key}>{field.key || (message ? '""' : language.fieldValue)}</p>,
						},
						{
							key: 'type',
							label: language.fieldType,
							description: language.typesDescription,
							render: (field) => <p>{language.fieldTypes[field.type]}</p>,
						},
						...(props.isCommitmentMetadata
							? []
							: [
									{
										key: 'coverage',
										label: language.fieldCoverage,
										description: language.coverageDescription,
										headerAction: (
											<Button
												type="alt1"
												icon={ASSETS.info}
												aria-label={language.coverageInfo.title}
												aria-haspopup="dialog"
												aria-expanded={showCoverageInfo}
												onPress={() => setShowCoverageInfo(true)}
												padding={'1px 0 0 0'}
												height={18}
												width={18}
												iconSize={10}
												noMinWidth
												active={showCoverageInfo}
												stopPropagation
												preventDefault
											/>
										),
										render: (field: MessageField) => {
											const coverage = getFieldCoverage(field.key, commitments);
											const listed = coverage.filter((item) => item.status === 'listed').length;
											const unknown = coverage.filter((item) => item.status === 'unknown').length;
											const title = coverage.length
												? coverage
														.map(
															(item) =>
																`${item.id}${item.kind === 'unsigned' ? ` (${language.unsigned})` : ''}: ${
																	language.coverageStates[item.status]
																}`
														)
														.join('\n')
												: language.noCommitments;
											const summary =
												(listed
													? language.coverageCount(listed, coverage.length)
													: unknown || !coverage.length
													? language.coverageStates.unknown
													: language.coverageStates['not-listed']) +
												(listed > 0 && unknown > 0 ? ` · ${language.coverageUnknownCount(unknown)}` : '');
											const isExpanded = current.expanded.get(field.key) === 'coverage';
											return coverage.length ? (
												<S.Expand
													aria-label={
														isExpanded ? language.collapseCoverage(field.key) : language.expandCoverage(field.key)
													}
													aria-expanded={isExpanded}
													aria-controls={isExpanded ? `${regionId}-${page}-${rows.indexOf(field)}` : undefined}
													title={`${language.coverageDescription}\n${title}`}
													onClick={() => handleToggle(field.key, 'coverage')}
												>
													<span>{summary}</span>
													<Icon src={ASSETS.arrow} size={15} />
												</S.Expand>
											) : (
												<S.Coverage title={title}>{summary}</S.Coverage>
											);
										},
									},
							  ]),
						{
							key: 'value',
							label: language.fieldValue,
							align: 'end',
							render: (field) => {
								const expandable = !!field.linkId || field.type === 'message' || field.type === 'list';
								const value =
									field.type === 'message'
										? language.fieldCount(Object.keys(field.value).length)
										: field.type === 'list'
										? language.itemCount((field.value as MessageValue[]).length)
										: typeof field.value === 'string'
										? field.value || '""'
										: messageJson(field.value);
								return expandable ? (
									<S.Expand
										aria-label={
											current.expanded.get(field.key) === 'value'
												? language.collapseField(field.key)
												: language.expandField(field.key)
										}
										aria-expanded={current.expanded.get(field.key) === 'value'}
										aria-controls={
											current.expanded.get(field.key) === 'value'
												? `${regionId}-${page}-${rows.indexOf(field)}`
												: undefined
										}
										title={value}
										onClick={() => handleToggle(field.key, 'value')}
									>
										<span>{value}</span>
										<Icon src={ASSETS.arrow} size={15} />
									</S.Expand>
								) : field.type === 'text' && typeof field.value === 'string' && checkValidAddress(field.value) ? (
									<ExplorerLink value={field.value} />
								) : (
									<S.Value title={field.type === 'link' ? language.invalidLink : undefined}>
										<CopyableValue value={value} copiedLabel={copy.copied} fullWidth />
									</S.Value>
								);
							},
						},
					]}
					renderRowDetails={(field) => {
						const expansion = current.expanded.get(field.key);
						if (!expansion) return null;
						const isCommitmentMetadata =
							props.isCommitmentMetadata || field.key === 'commitments' || field.key === 'commitments+link';
						return (
							<S.Child id={`${regionId}-${page}-${rows.indexOf(field)}`}>
								{expansion === 'coverage' ? (
									<AoCoreCoverage fieldKey={field.key} commitments={commitments} />
								) : depth >= MAX_MESSAGE_EXPANSION_DEPTH || (field.linkId && props.ancestors.includes(field.linkId)) ? (
									<S.Status role="status">
										<p>{depth >= MAX_MESSAGE_EXPANSION_DEPTH ? language.depthLimit : language.cyclicLink}</p>
										{field.linkId && <ExplorerLink value={field.linkId} label={language.openLinkedMessage} />}
									</S.Status>
								) : field.linkId ? (
									<LinkedValue
										id={field.linkId}
										ancestors={props.ancestors}
										depth={depth + 1}
										label={language.childFields(field.key)}
										isCommitmentMetadata={isCommitmentMetadata}
									/>
								) : (
									<AoCoreFields
										value={field.value}
										label={language.childFields(field.key)}
										ancestors={props.ancestors}
										depth={depth + 1}
										isCommitmentMetadata={isCommitmentMetadata}
									/>
								)}
							</S.Child>
						);
					}}
				/>
			)}
			{!isLoading && !isGraph && fields.length === 0 && (
				<S.Empty $nested={depth > 0}>
					<p>{language.noFields}</p>
				</S.Empty>
			)}
			{showCoverageInfo && <AoCoreCoverageInfo onClose={handleCloseCoverageInfo} />}
		</S.Section>
	);
}

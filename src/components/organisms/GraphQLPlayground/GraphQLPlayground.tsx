import React from 'react';
import { ReactSVG } from 'react-svg';

import type { GQLField, GQLSchemaDocs, GQLType, GQLTypeRef } from 'api/graphql';
import {
	executePlaygroundQuery,
	fetchSchemaDocs,
	getInitialPlaygroundGateway,
	getPlaygroundGatewayInputValue,
	getPlaygroundGatewayLabel,
	getPlaygroundGateways,
	getPlaygroundGatewayStorageValue,
	isRetiredGraphQLGateway,
} from 'api/graphql';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { Modal } from 'components/atoms/Modal';
import { Select } from 'components/atoms/Select';
import { Editor } from 'components/molecules/Editor';
import { JSONReader } from 'components/molecules/JSONReader';
import { AR_LMDB_GQL_GATEWAY, ASSETS } from 'helpers/config';
import { SelectOptionType } from 'helpers/types';
import { useLanguageProvider } from 'providers/LanguageProvider';

import type { QueryTiming } from './queryTimings';
import { formatQueryDuration, QUERY_TIMINGS_PAGE_SIZE } from './queryTimings';
import * as S from './styles';

const DEFAULT_QUERY = `query Transactions {
    transactions(
        first: 10
        tags: [
            { name: "Data-Protocol", values: ["ao"] }
        ]
    ) {
        count
        edges {
            node {
                id
                tags {
                    name
                    value
                }
                owner {
                    address
                }
                block {
                    height
                    timestamp
                }
            }
        }
    }
}`;

const STORAGE_KEY = 'lunar-gql-gateways';
const STORAGE_KEY_VARIABLES = (playgroundId: string) => `lunar-gql-variables-${playgroundId}`;
const STORAGE_KEY_SHOW_VARIABLES = (playgroundId: string) => `lunar-gql-show-variables-${playgroundId}`;

function formatTypeRef(type: GQLTypeRef | null | undefined): string {
	if (!type) return 'Unknown';
	if (type.kind === 'NON_NULL') return `${formatTypeRef(type.ofType)}!`;
	if (type.kind === 'LIST') return `[${formatTypeRef(type.ofType)}]`;

	return type.name || type.kind;
}

function buildFieldSignature(field: GQLField) {
	const args =
		field.args && field.args.length > 0
			? `(${field.args.map((arg) => `${arg.name}: ${formatTypeRef(arg.type)}`).join(', ')})`
			: '';

	return `${field.name}${args}: ${formatTypeRef(field.type)}`;
}

function getNamedTypeName(type: GQLTypeRef | null | undefined): string | null {
	if (!type) return null;
	if (type.name) return type.name;

	return getNamedTypeName(type.ofType);
}

function isLeafType(type: GQLType | undefined) {
	return !type || ['SCALAR', 'ENUM'].includes(type.kind);
}

function capitalize(value: string) {
	return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : 'Query';
}

export default function GraphQLPlayground(props: {
	playgroundId: string;
	active: boolean;
	initialQuery?: string;
	initialGateway?: string;
	onQueryChange?: (query: string, queryName?: string) => void;
	onGatewayChange?: (gateway: string) => void;
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const [query, setQuery] = React.useState<string>(props.initialQuery || DEFAULT_QUERY);
	const [result, setResult] = React.useState<string | null>(null);
	const [loading, setLoading] = React.useState<boolean>(false);
	const [gateways, setGateways] = React.useState<string[]>(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			return getPlaygroundGateways(stored ? JSON.parse(stored) : undefined);
		} catch {
			return getPlaygroundGateways(undefined);
		}
	});
	const [selectedGateway, setSelectedGateway] = React.useState<string>(() =>
		getInitialPlaygroundGateway(props.initialGateway, gateways)
	);
	const [inputGateway, setInputGateway] = React.useState<string>(() => getPlaygroundGatewayInputValue(selectedGateway));
	const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);
	const [showVariables, setShowVariables] = React.useState<boolean>(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY_SHOW_VARIABLES(props.playgroundId));
			return stored ? JSON.parse(stored) : false;
		} catch {
			return false;
		}
	});
	const [variables, setVariables] = React.useState<string>(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY_VARIABLES(props.playgroundId));
			return stored || '{}';
		} catch {
			return '{}';
		}
	});
	const [showDocs, setShowDocs] = React.useState<boolean>(false);
	const [showQueryTimes, setShowQueryTimes] = React.useState(false);
	const [queryTimings, setQueryTimings] = React.useState<QueryTiming[]>([]);
	const [queryTimingsPage, setQueryTimingsPage] = React.useState(0);
	const [schemaDocs, setSchemaDocs] = React.useState<GQLSchemaDocs | null>(null);
	const [schemaDocsLoading, setSchemaDocsLoading] = React.useState<boolean>(false);
	const [schemaDocsError, setSchemaDocsError] = React.useState<string | null>(null);
	const wrapperRef = React.useRef<HTMLDivElement>(null);
	const layoutTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
	const queryControllerRef = React.useRef<AbortController | null>(null);
	const queryRunIdRef = React.useRef(0);
	const isMountedRef = React.useRef(false);
	const schemaDocsGateway = inputGateway.trim();
	const isRetiredGateway = isRetiredGraphQLGateway(inputGateway);
	const latestQueryTiming = queryTimings[0];
	const queryTimingsPageCount = Math.max(1, Math.ceil(queryTimings.length / QUERY_TIMINGS_PAGE_SIZE));

	React.useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
			queryControllerRef.current?.abort();
		};
	}, []);

	React.useEffect(() => {
		if (!props.active) setShowQueryTimes(false);
	}, [props.active]);

	React.useEffect(() => {
		setResult(null);
		setLoading(false);
		return () => queryControllerRef.current?.abort();
	}, [inputGateway]);

	// Persist the normalized list, including the local engine, and remove retired saved endpoints.
	React.useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(gateways));
		} catch (error) {
			console.error('Failed to save GraphQL gateways:', error);
		}
	}, [gateways]);

	// Trigger layout recalculation when tab becomes active
	React.useEffect(() => {
		if (props.active) {
			// Clear any pending layout timeout
			if (layoutTimeoutRef.current) {
				clearTimeout(layoutTimeoutRef.current);
			}
			// Trigger layout after a short delay to ensure the display change has taken effect
			// Dispatch a resize event to trigger Monaco's layout recalculation
			layoutTimeoutRef.current = setTimeout(() => {
				window.dispatchEvent(new Event('resize'));
			}, 50);
		}
		return () => {
			if (layoutTimeoutRef.current) {
				clearTimeout(layoutTimeoutRef.current);
			}
		};
	}, [props.active]);

	const toggleFullscreen = React.useCallback(async () => {
		if (!document.fullscreenElement) {
			try {
				await wrapperRef.current?.requestFullscreen();
				setIsFullscreen(true);
			} catch (err) {
				console.error('Error attempting to enable fullscreen:', err);
			}
		} else {
			try {
				await document.exitFullscreen();
				setIsFullscreen(false);
			} catch (err) {
				console.error('Error attempting to exit fullscreen:', err);
			}
		}
	}, []);

	// Listen for fullscreen changes (e.g., user pressing ESC)
	React.useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(document.fullscreenElement === wrapperRef.current);
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	}, []);

	// Persist variables when they change
	React.useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY_VARIABLES(props.playgroundId), variables);
		} catch (e) {
			console.error('Failed to save variables:', e);
		}
	}, [variables, props.playgroundId]);

	// Persist showVariables toggle state
	React.useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY_SHOW_VARIABLES(props.playgroundId), JSON.stringify(showVariables));
		} catch (e) {
			console.error('Failed to save showVariables state:', e);
		}
	}, [showVariables, props.playgroundId]);

	const gatewayOptions: SelectOptionType[] = React.useMemo(
		() => gateways.map((gateway) => ({ id: gateway, label: getPlaygroundGatewayLabel(gateway) })),
		[gateways]
	);

	const activeGatewayOption: SelectOptionType = React.useMemo(() => {
		// Use selectedGateway as-is, even if it's not in the saved list
		return { id: selectedGateway, label: getPlaygroundGatewayLabel(selectedGateway) };
	}, [selectedGateway]);

	React.useEffect(() => {
		if (props.initialQuery !== undefined) {
			setQuery(props.initialQuery);
		}
	}, [props.initialQuery]);

	// Debounce gateway changes to avoid infinite loops
	const lastReportedGatewayRef = React.useRef(props.initialGateway);
	React.useEffect(() => {
		const trimmedGateway =
			getPlaygroundGatewayStorageValue(inputGateway) === AR_LMDB_GQL_GATEWAY
				? AR_LMDB_GQL_GATEWAY
				: inputGateway.trim();
		if (
			props.onGatewayChange &&
			trimmedGateway &&
			!isRetiredGraphQLGateway(trimmedGateway) &&
			trimmedGateway !== lastReportedGatewayRef.current
		) {
			lastReportedGatewayRef.current = trimmedGateway;
			props.onGatewayChange(trimmedGateway);
		}
	}, [inputGateway, props.onGatewayChange]);

	// Extract query name from GraphQL query
	const extractQueryName = React.useCallback((queryString: string): string | null => {
		// Match "query QueryName" or "mutation MutationName"
		const match = queryString.match(/^\s*(?:query|mutation)\s+([A-Za-z][A-Za-z0-9_]*)/m);
		return match ? match[1] : null;
	}, []);

	React.useEffect(() => {
		if (props.onQueryChange && query !== (props.initialQuery || DEFAULT_QUERY)) {
			const timeoutId = setTimeout(() => {
				const queryName = extractQueryName(query);
				props.onQueryChange(query, queryName || undefined);
			}, 500);
			return () => clearTimeout(timeoutId);
		}
	}, [query, props.onQueryChange, props.initialQuery, extractQueryName]);

	React.useEffect(() => {
		if (!showDocs || !schemaDocsGateway) return;

		let active = true;
		const controller = new AbortController();

		setSchemaDocsLoading(true);
		setSchemaDocsError(null);

		fetchSchemaDocs(schemaDocsGateway, controller.signal)
			.then((schema) => {
				if (!active) return;
				setSchemaDocs(schema);
			})
			.catch((error: unknown) => {
				if (!active) return;
				setSchemaDocs(null);
				setSchemaDocsError(error instanceof Error ? error.message : language.errorFetchingData);
			})
			.finally(() => {
				if (!active) return;
				setSchemaDocsLoading(false);
			});

		return () => {
			active = false;
			controller.abort();
		};
	}, [showDocs, schemaDocsGateway, language.errorFetchingData]);

	const saveCustomGateway = React.useCallback(() => {
		const gateway = getPlaygroundGatewayStorageValue(inputGateway);

		if (gateway && !isRetiredGraphQLGateway(gateway) && !gateways.includes(gateway)) {
			const updatedGateways = [...gateways, gateway];
			setGateways(updatedGateways);
			setSelectedGateway(gateway);
			setInputGateway(getPlaygroundGatewayInputValue(gateway));
		}
	}, [inputGateway, gateways]);

	const removeGateway = React.useCallback(
		(option: SelectOptionType) => {
			if (option.id === AR_LMDB_GQL_GATEWAY || gateways.length <= 1) return;

			const updatedGateways = gateways.filter((gateway) => gateway !== option.id);
			const nextGateway =
				selectedGateway === option.id ? getInitialPlaygroundGateway(undefined, updatedGateways) : selectedGateway;

			setGateways(updatedGateways);
			setSelectedGateway(nextGateway);
			setInputGateway(getPlaygroundGatewayInputValue(nextGateway));
		},
		[gateways, selectedGateway]
	);

	const executeQuery = React.useCallback(
		async (queryOverride?: string) => {
			const queryToExecute = typeof queryOverride === 'string' ? queryOverride : query;
			if (!queryToExecute.trim()) return;
			queryControllerRef.current?.abort();
			const controller = new AbortController();
			queryControllerRef.current = controller;
			setResult(null);
			setLoading(true);
			const run = {
				id: ++queryRunIdRef.current,
				startedAt: Date.now(),
				gateway: inputGateway.trim(),
				queryName: extractQueryName(queryToExecute),
			};
			const startedAt = performance.now();
			let hasRecordedTiming = false;
			const recordTiming = (status: QueryTiming['status']) => {
				if (hasRecordedTiming) return;
				hasRecordedTiming = true;
				const durationMs = Math.max(0, performance.now() - startedAt);
				if (!isMountedRef.current) return;
				setQueryTimings((previous) => [...previous, { ...run, durationMs, status }].sort((a, b) => b.id - a.id));
			};
			const handleAbort = () => recordTiming('cancelled');
			controller.signal.addEventListener('abort', handleAbort, { once: true });
			try {
				const data = await executePlaygroundQuery({
					query: queryToExecute,
					gateway: inputGateway.trim(),
					variables,
					signal: controller.signal,
				});
				if (controller.signal.aborted) return;
				recordTiming(data.errors?.length ? 'failed' : 'success');
				setResult(JSON.stringify(data, null, 2));
			} catch (error: unknown) {
				if (controller.signal.aborted) return;
				recordTiming('failed');
				setResult(
					JSON.stringify({ error: error instanceof Error ? error.message : language.failedToExecuteQuery }, null, 2)
				);
			} finally {
				controller.signal.removeEventListener('abort', handleAbort);
				if (!controller.signal.aborted) setLoading(false);
			}
		},
		[query, inputGateway, variables, language.failedToExecuteQuery, extractQueryName]
	);

	const schemaTypesByName = React.useMemo(() => {
		const map = new Map<string, GQLType>();
		for (const type of schemaDocs?.types ?? []) {
			if (type.name) map.set(type.name, type);
		}

		return map;
	}, [schemaDocs]);

	function getRootFields(rootType?: { name: string } | null) {
		if (!rootType?.name) return [];

		return schemaTypesByName.get(rootType.name)?.fields ?? [];
	}

	function getSelectionSet(typeRef: GQLTypeRef, depth = 0): string {
		const typeName = getNamedTypeName(typeRef);
		const type = typeName ? schemaTypesByName.get(typeName) : undefined;
		if (isLeafType(type) || depth > 1) return '';

		const fields = (type?.fields ?? []).filter((field) => !field.name.startsWith('__') && !field.isDeprecated);
		const scalarFields = fields
			.filter((field) => isLeafType(schemaTypesByName.get(getNamedTypeName(field.type) ?? '')))
			.slice(0, 6);
		const selectedFields = scalarFields.length > 0 ? scalarFields : fields.slice(0, 3);
		if (selectedFields.length <= 0) return '';

		const indent = '\t'.repeat(depth + 2);
		const childLines = selectedFields.map((field) => {
			const nestedSelection = getSelectionSet(field.type, depth + 1);
			return `${indent}${field.name}${nestedSelection}`;
		});

		return ` {\n${childLines.join('\n')}\n${'\t'.repeat(depth + 1)}}`;
	}

	function useFieldQuery(operation: 'query' | 'mutation' | 'subscription', field: GQLField) {
		const requiredArgs = (field.args ?? []).filter((arg) => arg.type.kind === 'NON_NULL' && !arg.defaultValue);
		const variableDefs = requiredArgs.map((arg) => `$${arg.name}: ${formatTypeRef(arg.type)}`).join(', ');
		const variableArgs = requiredArgs.map((arg) => `${arg.name}: $${arg.name}`).join(', ');
		const operationSuffix =
			operation === 'mutation' ? 'Mutation' : operation === 'subscription' ? 'Subscription' : 'Query';
		const operationName = `${capitalize(field.name)}${operationSuffix}`;
		const selection = getSelectionSet(field.type);
		const nextQuery = `${operation} ${operationName}${variableDefs ? `(${variableDefs})` : ''} {\n\t${field.name}${
			variableArgs ? `(${variableArgs})` : ''
		}${selection}\n}`;

		setQuery(nextQuery);

		if (requiredArgs.length > 0) {
			setVariables(JSON.stringify(Object.fromEntries(requiredArgs.map((arg) => [arg.name, null])), null, 2));
			setShowVariables(true);
		}

		setShowDocs(false);
		setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
	}

	function renderFieldDocs(operation: 'query' | 'mutation' | 'subscription', fields: GQLField[]) {
		if (fields.length <= 0) {
			return (
				<S.DocsEmpty>
					<p>No {operation === 'query' ? 'queries' : operation === 'mutation' ? 'mutations' : 'subscriptions'} found</p>
				</S.DocsEmpty>
			);
		}

		return (
			<S.DocsList>
				{fields.map((field) => (
					<S.DocsField key={field.name}>
						<S.DocsFieldHeader>
							<S.DocsFieldSignature>
								<code>{buildFieldSignature(field)}</code>
							</S.DocsFieldSignature>
							<Button type={'alt3'} label={'Use'} onPress={() => useFieldQuery(operation, field)} height={30} />
						</S.DocsFieldHeader>
						{field.description && (
							<S.DocsDescription>
								<p>{field.description}</p>
							</S.DocsDescription>
						)}
						{field.args && field.args.length > 0 && (
							<S.DocsArgs>
								{field.args.map((arg) => (
									<S.DocsArg key={arg.name}>
										<code>{`${arg.name}: ${formatTypeRef(arg.type)}`}</code>
										{arg.defaultValue && <span>{`= ${arg.defaultValue}`}</span>}
									</S.DocsArg>
								))}
							</S.DocsArgs>
						)}
						{field.isDeprecated && (
							<S.DocsDeprecated>
								<p>{field.deprecationReason || 'Deprecated'}</p>
							</S.DocsDeprecated>
						)}
					</S.DocsField>
				))}
			</S.DocsList>
		);
	}

	function renderTypeDocs() {
		const visibleTypes = (schemaDocs?.types ?? [])
			.filter((type) => type.name && !type.name.startsWith('__'))
			.sort((a, b) => a.name.localeCompare(b.name));

		if (visibleTypes.length <= 0) return null;

		return (
			<S.DocsSection>
				<S.DocsSectionHeader>
					<p>Types</p>
					<span>{visibleTypes.length}</span>
				</S.DocsSectionHeader>
				<S.DocsTypeGrid>
					{visibleTypes.map((type) => (
						<S.DocsType key={type.name}>
							<code>{type.name}</code>
							<span>{type.kind}</span>
						</S.DocsType>
					))}
				</S.DocsTypeGrid>
			</S.DocsSection>
		);
	}

	function renderDocsPanel() {
		const queryFields = getRootFields(schemaDocs?.queryType);
		const mutationFields = getRootFields(schemaDocs?.mutationType);
		const subscriptionFields = getRootFields(schemaDocs?.subscriptionType);

		return (
			<Modal type="panel" width={680} header={`${language.docs} - GraphQL`} onClose={() => setShowDocs(false)}>
				<S.DocsPanel>
					<S.DocsEndpoint>
						<span>Gateway</span>
						<p>{getPlaygroundGatewayLabel(schemaDocsGateway)}</p>
					</S.DocsEndpoint>
					{schemaDocsLoading && (
						<S.DocsEmpty>
							<p>{`${language.loading}...`}</p>
						</S.DocsEmpty>
					)}
					{schemaDocsError && (
						<S.DocsError>
							<p>{schemaDocsError}</p>
						</S.DocsError>
					)}
					{schemaDocs && !schemaDocsLoading && !schemaDocsError && (
						<>
							<S.DocsSection>
								<S.DocsSectionHeader>
									<p>Queries</p>
									<span>{queryFields.length}</span>
								</S.DocsSectionHeader>
								{renderFieldDocs('query', queryFields)}
							</S.DocsSection>
							{mutationFields.length > 0 && (
								<S.DocsSection>
									<S.DocsSectionHeader>
										<p>Mutations</p>
										<span>{mutationFields.length}</span>
									</S.DocsSectionHeader>
									{renderFieldDocs('mutation', mutationFields)}
								</S.DocsSection>
							)}
							{subscriptionFields.length > 0 && (
								<S.DocsSection>
									<S.DocsSectionHeader>
										<p>Subscriptions</p>
										<span>{subscriptionFields.length}</span>
									</S.DocsSectionHeader>
									{renderFieldDocs('subscription', subscriptionFields)}
								</S.DocsSection>
							)}
							{renderTypeDocs()}
						</>
					)}
				</S.DocsPanel>
			</Modal>
		);
	}

	function handleShowQueryTimes() {
		setShowDocs(false);
		setQueryTimingsPage(0);
		setShowQueryTimes(true);
	}

	function renderQueryTimesPanel() {
		const visibleTimings = queryTimings.slice(
			queryTimingsPage * QUERY_TIMINGS_PAGE_SIZE,
			(queryTimingsPage + 1) * QUERY_TIMINGS_PAGE_SIZE
		);

		return (
			<Modal type="panel" width={520} header={language.queryTimeHistory} onClose={() => setShowQueryTimes(false)}>
				<S.TimingPanel>
					<S.TimingDescription>{language.queryTimeHistoryInfo}</S.TimingDescription>
					{queryTimings.length === 0 ? (
						<S.TimingDescription>{language.queryTimeHistoryEmpty}</S.TimingDescription>
					) : (
						<>
							<S.TimingList aria-label={language.queryTimeHistory}>
								{visibleTimings.map((timing) => (
									<S.TimingEntry key={timing.id}>
										<S.TimingRow>
											<strong>{formatQueryDuration(timing.durationMs)}</strong>
											<S.TimingStatus $status={timing.status}>
												{timing.status === 'success'
													? language.success
													: timing.status === 'failed'
													? language.queryTimeFailed
													: language.queryTimeCancelled}
											</S.TimingStatus>
										</S.TimingRow>
										<p>{`${language.queryTimeRun(timing.id)} · ${timing.queryName || language.queryTimeUnnamed}`}</p>
										<S.TimingRow>
											<span>{getPlaygroundGatewayLabel(timing.gateway)}</span>
											<time dateTime={new Date(timing.startedAt).toISOString()}>
												{new Date(timing.startedAt).toLocaleString(languageProvider.current)}
											</time>
										</S.TimingRow>
									</S.TimingEntry>
								))}
							</S.TimingList>
							{queryTimingsPageCount > 1 && (
								<S.TimingPagination>
									<Button
										type="alt1"
										label={language.previous}
										height={32.5}
										disabled={queryTimingsPage === 0}
										onPress={() => setQueryTimingsPage((page) => page - 1)}
									/>
									<span>{language.pageOf(queryTimingsPage + 1, queryTimingsPageCount)}</span>
									<Button
										type="alt1"
										label={language.next}
										height={32.5}
										disabled={queryTimingsPage + 1 >= queryTimingsPageCount}
										onPress={() => setQueryTimingsPage((page) => page + 1)}
									/>
								</S.TimingPagination>
							)}
						</>
					)}
				</S.TimingPanel>
			</Modal>
		);
	}

	return (
		<S.Wrapper ref={wrapperRef} style={{ display: props.active ? 'flex' : 'none' }} isFullscreen={isFullscreen}>
			<S.HeaderWrapper>
				<S.InputWrapper>
					<S.InputFormWrapper>
						<ReactSVG src={ASSETS.url} />
						<FormField
							value={inputGateway}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								setInputGateway(e.target.value);
								setSelectedGateway(getPlaygroundGatewayStorageValue(e.target.value));
							}}
							placeholder={'https://arweave.net'}
							invalid={{ status: false, message: null }}
							disabled={false}
							autoFocus
							hideErrorMessage
							sm
						/>
					</S.InputFormWrapper>
					<Button
						type={'alt1'}
						icon={ASSETS.save}
						onPress={saveCustomGateway}
						disabled={
							!getPlaygroundGatewayStorageValue(inputGateway) ||
							isRetiredGateway ||
							gateways.includes(getPlaygroundGatewayStorageValue(inputGateway))
						}
						height={32.5}
						width={32.5}
						noMinWidth
						iconSize={14.5}
						tooltip={language.save}
						stopPropagation
						preventDefault
					/>
					<Button
						type={'alt1'}
						icon={ASSETS.fullscreen}
						onPress={toggleFullscreen}
						height={32.5}
						width={32.5}
						noMinWidth
						iconSize={14.5}
						tooltip={isFullscreen ? language.exitFullScreen : language.enterFullScreen}
						stopPropagation
						preventDefault
					/>
					<Button
						type={'alt1'}
						onPress={() => setShowVariables((prev) => !prev)}
						active={showVariables}
						icon={showVariables ? ASSETS.close : ASSETS.code}
						height={32.5}
						width={32.5}
						iconSize={14.5}
						tooltip={language.queryVariables}
					/>
					<Button
						type={'alt1'}
						onPress={() => {
							setShowQueryTimes(false);
							setShowDocs(true);
						}}
						active={showDocs}
						icon={ASSETS.docs}
						height={32.5}
						width={32.5}
						iconSize={14.5}
						tooltip={language.docs}
					/>
				</S.InputWrapper>
				<S.ActionsWrapper>
					<S.TimingTrigger aria-live="polite">
						<Button
							type="primary"
							label={
								latestQueryTiming
									? `${language.queryTimeLast}: ${formatQueryDuration(latestQueryTiming.durationMs)}`
									: language.queryTimes
							}
							tooltip={language.queryTimeHistory}
							onPress={handleShowQueryTimes}
							active={showQueryTimes}
							height={37.5}
						/>
					</S.TimingTrigger>
					<S.GatewaySelect>
						<Select
							label={''}
							activeOption={activeGatewayOption}
							setActiveOption={(option) => {
								setSelectedGateway(option.id);
								setInputGateway(getPlaygroundGatewayInputValue(option.id));
							}}
							options={gatewayOptions}
							disabled={false}
							onRemoveOption={removeGateway}
							isOptionRemovable={(option) => option.id !== AR_LMDB_GQL_GATEWAY && gateways.length > 1}
							removeOptionLabel={language.remove}
						/>
					</S.GatewaySelect>
				</S.ActionsWrapper>
			</S.HeaderWrapper>
			<S.Container isFullscreen={isFullscreen}>
				<S.EditorWrapper showVariables={showVariables}>
					<S.QueryEditorWrapper showVariables={showVariables}>
						<Editor
							initialData={query}
							language={'graphql'}
							setEditorData={setQuery}
							onSubmit={executeQuery}
							loading={loading}
							useFixedHeight
							noFullScreen
						/>
					</S.QueryEditorWrapper>
					{showVariables && (
						<S.VariablesEditorWrapper>
							<Editor
								initialData={variables}
								language={'json'}
								setEditorData={setVariables}
								loading={false}
								useFixedHeight
								noFullScreen
							/>
						</S.VariablesEditorWrapper>
					)}
				</S.EditorWrapper>
				<S.ResultWrapper>
					<JSONReader
						data={result}
						header={language.response}
						placeholder={loading ? `${language.loading}...` : language.runForResponse}
						noFullScreen
					/>
				</S.ResultWrapper>
			</S.Container>
			{showDocs && renderDocsPanel()}
			{props.active && showQueryTimes && renderQueryTimesPanel()}
		</S.Wrapper>
	);
}

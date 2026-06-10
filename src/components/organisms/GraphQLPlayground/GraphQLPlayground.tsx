import React from 'react';
import { ReactSVG } from 'react-svg';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { Modal } from 'components/atoms/Modal';
import { Select } from 'components/atoms/Select';
import { Editor } from 'components/molecules/Editor';
import { JSONReader } from 'components/molecules/JSONReader';
import { ASSETS } from 'helpers/config';
import { SelectOptionType } from 'helpers/types';
import { useLanguageProvider } from 'providers/LanguageProvider';

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

const DEFAULT_GATEWAYS = ['ao-search-gateway.goldsky.com', 'arweave-search.goldsky.com', 'arweave.net'];
const STORAGE_KEY = 'lunar-gql-gateways';
const STORAGE_KEY_VARIABLES = (playgroundId: string) => `lunar-gql-variables-${playgroundId}`;
const STORAGE_KEY_SHOW_VARIABLES = (playgroundId: string) => `lunar-gql-show-variables-${playgroundId}`;
const SCHEMA_CACHE = new Map<string, GQLSchemaDocs>();
const SCHEMA_REQUEST_CACHE = new Map<string, Promise<GQLSchemaDocs>>();

const INTROSPECTION_QUERY = `
	query LunarSchemaDocs {
		__schema {
			queryType {
				name
			}
			mutationType {
				name
			}
			subscriptionType {
				name
			}
			types {
				kind
				name
				description
				fields(includeDeprecated: true) {
					name
					description
					args {
						name
						description
						defaultValue
						type {
							...TypeRef
						}
					}
					type {
						...TypeRef
					}
					isDeprecated
					deprecationReason
				}
				inputFields {
					name
					description
					defaultValue
					type {
						...TypeRef
					}
				}
				enumValues(includeDeprecated: true) {
					name
					description
					isDeprecated
					deprecationReason
				}
			}
		}
	}

	fragment TypeRef on __Type {
		kind
		name
		ofType {
			kind
			name
			ofType {
				kind
				name
				ofType {
					kind
					name
					ofType {
						kind
						name
					}
				}
			}
		}
	}
`;

type GQLTypeRef = {
	kind: string;
	name?: string | null;
	ofType?: GQLTypeRef | null;
};

type GQLInputValue = {
	name: string;
	description?: string | null;
	defaultValue?: string | null;
	type: GQLTypeRef;
};

type GQLField = {
	name: string;
	description?: string | null;
	args?: GQLInputValue[];
	type: GQLTypeRef;
	isDeprecated?: boolean;
	deprecationReason?: string | null;
};

type GQLEnumValue = {
	name: string;
	description?: string | null;
	isDeprecated?: boolean;
	deprecationReason?: string | null;
};

type GQLType = {
	kind: string;
	name: string;
	description?: string | null;
	fields?: GQLField[] | null;
	inputFields?: GQLInputValue[] | null;
	enumValues?: GQLEnumValue[] | null;
};

type GQLSchemaDocs = {
	queryType?: { name: string } | null;
	mutationType?: { name: string } | null;
	subscriptionType?: { name: string } | null;
	types: GQLType[];
};

function ensureGatewayProtocol(gateway: string) {
	const trimmed = gateway.trim();

	return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
}

function trimGraphqlPath(gateway: string) {
	return gateway
		.trim()
		.replace(/\/+$/, '')
		.replace(/\/graphql$/i, '');
}

function getGatewayStorageValue(gateway: string) {
	return trimGraphqlPath(gateway).replace(/^https?:\/\//, '');
}

function getGatewayInputValue(gateway: string) {
	return ensureGatewayProtocol(trimGraphqlPath(gateway));
}

function getGatewayGraphqlEndpoint(gateway: string) {
	const withProtocol = ensureGatewayProtocol(gateway).replace(/\/+$/, '');

	return /\/graphql$/i.test(withProtocol) ? withProtocol : `${withProtocol}/graphql`;
}

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

async function fetchSchemaDocs(endpoint: string): Promise<GQLSchemaDocs> {
	const cached = SCHEMA_CACHE.get(endpoint);
	if (cached) return cached;

	const pending = SCHEMA_REQUEST_CACHE.get(endpoint);
	if (pending) return pending;

	const request = fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Codec-Device': 'json@1.0',
		},
		body: JSON.stringify({ query: INTROSPECTION_QUERY }),
	})
		.then(async (response) => {
			const payload = await response.json();

			if (!response.ok || payload.errors?.length > 0 || !payload.data?.__schema) {
				const message = payload.errors?.[0]?.message || `Schema request failed with status ${response.status}`;
				throw new Error(message);
			}

			const schema = payload.data.__schema as GQLSchemaDocs;
			SCHEMA_CACHE.set(endpoint, schema);

			return schema;
		})
		.finally(() => {
			SCHEMA_REQUEST_CACHE.delete(endpoint);
		});

	SCHEMA_REQUEST_CACHE.set(endpoint, request);

	return request;
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
			const parsed = stored ? JSON.parse(stored) : DEFAULT_GATEWAYS;
			const gatewayList = Array.isArray(parsed) ? parsed : DEFAULT_GATEWAYS;
			const normalized = Array.from(
				new Set(gatewayList.map((gateway: string) => getGatewayStorageValue(gateway)).filter(Boolean))
			) as string[];

			return normalized.length > 0 ? normalized : DEFAULT_GATEWAYS;
		} catch {
			return DEFAULT_GATEWAYS;
		}
	});
	const [selectedGateway, setSelectedGateway] = React.useState<string>(() => {
		const initial = props.initialGateway ? getGatewayStorageValue(props.initialGateway) : gateways[0];
		return gateways.includes(initial) ? initial : gateways[0];
	});
	const [inputGateway, setInputGateway] = React.useState<string>(() => {
		const initial = props.initialGateway ? getGatewayStorageValue(props.initialGateway) : gateways[0];
		const gateway = gateways.includes(initial) ? initial : gateways[0];
		return getGatewayInputValue(gateway);
	});
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
	const [schemaDocs, setSchemaDocs] = React.useState<GQLSchemaDocs | null>(null);
	const [schemaDocsLoading, setSchemaDocsLoading] = React.useState<boolean>(false);
	const [schemaDocsError, setSchemaDocsError] = React.useState<string | null>(null);
	const wrapperRef = React.useRef<HTMLDivElement>(null);
	const layoutTimeoutRef = React.useRef<any | null>(null);
	const schemaDocsEndpoint = React.useMemo(() => getGatewayGraphqlEndpoint(inputGateway.trim()), [inputGateway]);

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
		() => gateways.map((gateway) => ({ id: gateway, label: gateway })),
		[gateways]
	);

	const activeGatewayOption: SelectOptionType = React.useMemo(() => {
		// Use selectedGateway as-is, even if it's not in the saved list
		return { id: selectedGateway, label: selectedGateway };
	}, [selectedGateway]);

	React.useEffect(() => {
		if (props.initialQuery !== undefined) {
			setQuery(props.initialQuery);
		}
	}, [props.initialQuery]);

	// Only sync from props on initial mount, not on every change
	const initialGatewayRef = React.useRef(props.initialGateway);
	React.useEffect(() => {
		if (initialGatewayRef.current !== undefined) {
			const gateway = getGatewayStorageValue(initialGatewayRef.current);

			if (gateways.includes(gateway)) {
				setSelectedGateway(gateway);
				setInputGateway(getGatewayInputValue(gateway));
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Only run on mount

	// Debounce gateway changes to avoid infinite loops
	const lastReportedGatewayRef = React.useRef(props.initialGateway || gateways[0]);
	React.useEffect(() => {
		const trimmedGateway = inputGateway.trim();
		if (props.onGatewayChange && trimmedGateway && trimmedGateway !== lastReportedGatewayRef.current) {
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
		if (!showDocs || !schemaDocsEndpoint) return;

		let active = true;

		setSchemaDocsLoading(true);
		setSchemaDocsError(null);

		fetchSchemaDocs(schemaDocsEndpoint)
			.then((schema) => {
				if (!active) return;
				setSchemaDocs(schema);
			})
			.catch((e: any) => {
				if (!active) return;
				setSchemaDocs(null);
				setSchemaDocsError(e.message || language.errorFetchingData);
			})
			.finally(() => {
				if (!active) return;
				setSchemaDocsLoading(false);
			});

		return () => {
			active = false;
		};
	}, [showDocs, schemaDocsEndpoint, language.errorFetchingData]);

	const saveCustomGateway = React.useCallback(() => {
		const gateway = getGatewayStorageValue(inputGateway);

		if (gateway && !gateways.includes(gateway)) {
			const updatedGateways = [...gateways, gateway];
			setGateways(updatedGateways);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedGateways));
			setSelectedGateway(gateway);
			setInputGateway(getGatewayInputValue(gateway));
		}
	}, [inputGateway, gateways]);

	const removeGateway = React.useCallback(
		(option: SelectOptionType) => {
			if (gateways.length <= 1) return;

			const updatedGateways = gateways.filter((gateway) => gateway !== option.id);
			const nextGateway = selectedGateway === option.id ? updatedGateways[0] : selectedGateway;

			setGateways(updatedGateways);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedGateways));
			setSelectedGateway(nextGateway);
			setInputGateway(getGatewayInputValue(nextGateway));
		},
		[gateways, selectedGateway]
	);

	// Prepare query for sending - only wrap if not already wrapped
	const prepareQuery = React.useCallback((queryString: string): string => {
		const trimmed = queryString.trim();

		// Remove comments (both # single line and multi-line) to check the actual query structure
		const withoutComments = trimmed
			.replace(/#[^\n]*/g, '') // Remove # comments
			.replace(/"""[\s\S]*?"""/g, '') // Remove """ multi-line comments
			.trim();

		// Check if query already starts with 'query', 'mutation', or 'subscription' keyword
		// Allow for optional query name and optional variable definitions like ($var: Type!)
		const hasWrapper = /^\s*(?:query|mutation|subscription)(?:\s+[A-Za-z][A-Za-z0-9_]*)?(?:\s*\([^)]*\))?\s*\{/.test(
			withoutComments
		);
		const startsWithBrace = /^\s*\{/.test(withoutComments);

		// If it has proper wrapper or starts with {, use as-is (return original with comments)
		if (hasWrapper || startsWithBrace) {
			return trimmed;
		}

		// Otherwise, wrap it with query {}
		return `query { ${trimmed} }`;
	}, []);

	const executeQuery = React.useCallback(
		async (queryOverride?: string) => {
			// Use the override query if provided, otherwise use the state query
			// Handle case where an event object might be passed instead of a string
			const queryToExecute = typeof queryOverride === 'string' ? queryOverride : query;

			if (queryToExecute && typeof queryToExecute === 'string') {
				setResult(null);
				setLoading(true);
				try {
					const trimmedGateway = inputGateway.trim();
					const gatewayUrl = getGatewayGraphqlEndpoint(trimmedGateway);
					const preparedQuery = prepareQuery(queryToExecute);

					// Parse variables if they exist
					let parsedVariables = undefined;
					if (variables.trim() && variables.trim() !== '{}') {
						try {
							parsedVariables = JSON.parse(variables);
							// Only include if it's a non-empty object
							if (parsedVariables && typeof parsedVariables === 'object' && Object.keys(parsedVariables).length > 0) {
							} else {
								parsedVariables = undefined;
							}
						} catch (e) {
							console.error('Invalid variables JSON:', e);
						}
					}

					const body: any = { query: preparedQuery };
					if (parsedVariables) {
						body.variables = parsedVariables;
					}

					const response = await fetch(gatewayUrl, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Codec-Device': 'json@1.0',
						},
						body: JSON.stringify(body),
					});

					const data = await response.json();
					setResult(JSON.stringify(data, null, 2));
				} catch (e: any) {
					console.error(e);
					setResult(JSON.stringify({ error: e.message || language.failedToExecuteQuery }, null, 2));
				}
				setLoading(false);
			}
		},
		[query, inputGateway, prepareQuery, showVariables, variables]
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
							<Button type={'alt3'} label={'Use'} handlePress={() => useFieldQuery(operation, field)} height={30} />
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
			<Modal type="panel" width={680} header={`${language.docs} - GraphQL`} handleClose={() => setShowDocs(false)}>
				<S.DocsPanel>
					<S.DocsEndpoint>
						<span>Gateway</span>
						<p>{schemaDocsEndpoint}</p>
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
						handlePress={saveCustomGateway}
						disabled={!getGatewayStorageValue(inputGateway) || gateways.includes(getGatewayStorageValue(inputGateway))}
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
						handlePress={toggleFullscreen}
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
						handlePress={() => setShowVariables((prev) => !prev)}
						active={showVariables}
						icon={showVariables ? ASSETS.close : ASSETS.code}
						height={32.5}
						width={32.5}
						iconSize={14.5}
						tooltip={language.queryVariables}
					/>
					<Button
						type={'alt1'}
						handlePress={() => setShowDocs(true)}
						active={showDocs}
						icon={ASSETS.docs}
						height={32.5}
						width={32.5}
						iconSize={14.5}
						tooltip={language.docs}
					/>
				</S.InputWrapper>
				<S.ActionsWrapper>
					<Select
						label={''}
						activeOption={activeGatewayOption}
						setActiveOption={(option) => {
							setSelectedGateway(option.id);
							setInputGateway(getGatewayInputValue(option.id));
						}}
						options={gatewayOptions}
						disabled={false}
						handleRemoveOption={removeGateway}
						isOptionRemovable={() => gateways.length > 1}
						removeOptionLabel={language.remove}
					/>
				</S.ActionsWrapper>
			</S.HeaderWrapper>
			<S.Container isFullscreen={isFullscreen}>
				<S.EditorWrapper showVariables={showVariables}>
					<S.QueryEditorWrapper showVariables={showVariables}>
						<Editor
							initialData={query}
							language={'graphql'}
							setEditorData={setQuery}
							handleSubmit={executeQuery}
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
		</S.Wrapper>
	);
}

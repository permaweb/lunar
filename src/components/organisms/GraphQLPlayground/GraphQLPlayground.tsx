import React from 'react';
import { ReactSVG } from 'react-svg';

import { FormField } from 'components/atoms/FormField';
import { IconButton } from 'components/atoms/IconButton';
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
			return stored ? JSON.parse(stored) : DEFAULT_GATEWAYS;
		} catch {
			return DEFAULT_GATEWAYS;
		}
	});
	const [selectedGateway, setSelectedGateway] = React.useState<string>(() => {
		const initial = props.initialGateway || gateways[0];
		return gateways.includes(initial) ? initial : gateways[0];
	});
	const [inputGateway, setInputGateway] = React.useState<string>(() => {
		const initial = props.initialGateway || gateways[0];
		const gateway = gateways.includes(initial) ? initial : gateways[0];
		return `https://${gateway}`;
	});

	const gatewayOptions: SelectOptionType[] = React.useMemo(
		() => gateways.map((gateway) => ({ id: gateway, label: gateway })),
		[gateways]
	);

	const activeGatewayOption: SelectOptionType = React.useMemo(() => {
		// Only show as active if it's in the saved gateways list
		const gateway = gateways.includes(selectedGateway) ? selectedGateway : gateways[0];
		return { id: gateway, label: gateway };
	}, [selectedGateway, gateways]);

	React.useEffect(() => {
		if (props.initialQuery !== undefined) {
			setQuery(props.initialQuery);
		}
	}, [props.initialQuery]);

	React.useEffect(() => {
		if (props.initialGateway !== undefined && gateways.includes(props.initialGateway)) {
			setSelectedGateway(props.initialGateway);
			setInputGateway(`https://${props.initialGateway}`);
		}
	}, [props.initialGateway, gateways]);

	React.useEffect(() => {
		const trimmedGateway = inputGateway.trim().replace(/^https?:\/\//, '');
		if (props.onGatewayChange && trimmedGateway && trimmedGateway !== (props.initialGateway || gateways[0])) {
			props.onGatewayChange(trimmedGateway);
		}
	}, [inputGateway, props.onGatewayChange, props.initialGateway, gateways]);

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

	const saveCustomGateway = React.useCallback(() => {
		const trimmedGateway = inputGateway.trim().replace(/^https?:\/\//, '');
		if (trimmedGateway && !gateways.includes(trimmedGateway)) {
			const updatedGateways = [...gateways, trimmedGateway];
			setGateways(updatedGateways);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedGateways));
			setSelectedGateway(trimmedGateway);
		}
	}, [inputGateway, gateways]);

	// Prepare query for sending - only wrap if not already wrapped
	const prepareQuery = React.useCallback((queryString: string): string => {
		const trimmed = queryString.trim();

		// Remove comments (both # single line and multi-line) to check the actual query structure
		const withoutComments = trimmed
			.replace(/#[^\n]*/g, '') // Remove # comments
			.replace(/"""[\s\S]*?"""/g, '') // Remove """ multi-line comments
			.trim();

		// Check if query already starts with 'query' or 'mutation' keyword or just '{'
		const hasWrapper = /^\s*(?:query|mutation|subscription)\s*(?:[A-Za-z][A-Za-z0-9_]*)?\s*\{/.test(withoutComments);
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
					const trimmedGateway = inputGateway.trim().replace(/^https?:\/\//, '');
					const preparedQuery = prepareQuery(queryToExecute);
					const response = await fetch(`https://${trimmedGateway}/graphql`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ query: preparedQuery }),
					});

					const data = await response.json();
					console.log(data);
					setResult(JSON.stringify(data, null, 2));
				} catch (e: any) {
					console.error(e);
					setResult(JSON.stringify({ error: e.message || 'Failed to execute query' }, null, 2));
				}
				setLoading(false);
			}
		},
		[query, inputGateway, prepareQuery]
	);

	return (
		<S.Wrapper style={{ display: props.active ? 'flex' : 'none' }}>
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
					<IconButton
						type={'alt1'}
						src={ASSETS.write}
						handlePress={saveCustomGateway}
						disabled={!inputGateway.trim() || gateways.includes(inputGateway.trim().replace(/^https?:\/\//, ''))}
						dimensions={{
							wrapper: 32.5,
							icon: 17.5,
						}}
						tooltip={language.save}
					/>
				</S.InputWrapper>
				<S.GatewaysWrapper>
					<S.GatewaysLabel>
						<span>{language.savedGateways || 'Saved Gateways'}</span>
					</S.GatewaysLabel>
					<Select
						label={''}
						activeOption={activeGatewayOption}
						setActiveOption={(option) => {
							setSelectedGateway(option.id);
							setInputGateway(`https://${option.id}`);
						}}
						options={gatewayOptions}
						disabled={false}
					/>
				</S.GatewaysWrapper>
			</S.HeaderWrapper>
			<S.Container>
				<S.EditorWrapper>
					<Editor
						initialData={query}
						language={'graphql'}
						setEditorData={setQuery}
						handleSubmit={executeQuery}
						loading={loading}
						useFixedHeight
						noFullScreen
					/>
				</S.EditorWrapper>
				<S.ResultWrapper>
					<JSONReader
						data={result}
						header={language.response}
						placeholder={loading ? `${language.loading}...` : language.runForResponse}
					/>
				</S.ResultWrapper>
			</S.Container>
		</S.Wrapper>
	);
}

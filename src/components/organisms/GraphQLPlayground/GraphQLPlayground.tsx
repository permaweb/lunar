import React from 'react';
import { ReactSVG } from 'react-svg';

import { Button } from 'components/atoms/Button';
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
const STORAGE_KEY_VARIABLES = (playgroundId: string) => `lunar-gql-variables-${playgroundId}`;
const STORAGE_KEY_SHOW_VARIABLES = (playgroundId: string) => `lunar-gql-show-variables-${playgroundId}`;

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
	const wrapperRef = React.useRef<HTMLDivElement>(null);

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
			setIsFullscreen(!!document.fullscreenElement);
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
					const trimmedGateway = inputGateway.trim().replace(/^https?:\/\//, '');
					const preparedQuery = prepareQuery(queryToExecute);

					// Parse variables if they exist
					let parsedVariables = undefined;
					if (variables.trim() && variables.trim() !== '{}') {
						try {
							parsedVariables = JSON.parse(variables);
							// Only include if it's a non-empty object
							if (parsedVariables && typeof parsedVariables === 'object' && Object.keys(parsedVariables).length > 0) {
								console.log('Including variables:', parsedVariables);
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

					const response = await fetch(`https://${trimmedGateway}/graphql`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(body),
					});

					const data = await response.json();
					setResult(JSON.stringify(data, null, 2));
				} catch (e: any) {
					console.error(e);
					setResult(JSON.stringify({ error: e.message || 'Failed to execute query' }, null, 2));
				}
				setLoading(false);
			}
		},
		[query, inputGateway, prepareQuery, showVariables, variables]
	);

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
					<IconButton
						type={'alt1'}
						src={ASSETS.write}
						handlePress={saveCustomGateway}
						disabled={!inputGateway.trim() || gateways.includes(inputGateway.trim().replace(/^https?:\/\//, ''))}
						dimensions={{
							wrapper: 32.5,
							icon: 15.5,
						}}
						tooltip={language.save}
					/>
					<IconButton
						type={'alt1'}
						src={ASSETS.fullscreen}
						handlePress={toggleFullscreen}
						dimensions={{
							wrapper: 32.5,
							icon: 15.5,
						}}
						tooltip={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
					/>
					<Button
						type={'primary'}
						label={language.queryVariables}
						handlePress={() => setShowVariables((prev) => !prev)}
						active={showVariables}
						icon={showVariables ? ASSETS.close : null}
					/>
				</S.InputWrapper>
				<S.GatewaysWrapper>
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
		</S.Wrapper>
	);
}

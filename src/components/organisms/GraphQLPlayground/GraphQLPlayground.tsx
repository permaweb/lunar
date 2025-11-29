import React from 'react';

import { Button } from 'components/atoms/Button';
import { Editor } from 'components/molecules/Editor';
import { JSONReader } from 'components/molecules/JSONReader';
import { ASSETS } from 'helpers/config';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

const DEFAULT_QUERY = `query Transactions {
  transactions(
    first: 10
    tags: [
      { name: "Data-Protocol", values: ["ao"] }
    ]
  ) {
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

const GATEWAYS = ['ao-search-gateway.goldsky.com', 'arweave-search.goldsky.com', 'arweave.net'];

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
	const [currentGateway, setCurrentGateway] = React.useState<string>(props.initialGateway || GATEWAYS[0]);

	React.useEffect(() => {
		if (props.initialQuery !== undefined) {
			setQuery(props.initialQuery);
		}
	}, [props.initialQuery]);

	React.useEffect(() => {
		if (props.initialGateway !== undefined) {
			setCurrentGateway(props.initialGateway);
		}
	}, [props.initialGateway]);

	React.useEffect(() => {
		if (props.onGatewayChange && currentGateway !== (props.initialGateway || GATEWAYS[0])) {
			props.onGatewayChange(currentGateway);
		}
	}, [currentGateway, props.onGatewayChange, props.initialGateway]);

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
					const preparedQuery = prepareQuery(queryToExecute);
					const response = await fetch(`https://${currentGateway}/graphql`, {
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
		[query, currentGateway, prepareQuery]
	);

	return (
		<S.Wrapper style={{ display: props.active ? 'flex' : 'none' }}>
			<S.HeaderWrapper>
				{GATEWAYS.map((gateway: string) => {
					return (
						<Button
							key={gateway}
							type={'primary'}
							label={gateway}
							handlePress={() => setCurrentGateway(gateway)}
							active={gateway === currentGateway}
							icon={ASSETS.url}
							iconLeftAlign
						/>
					);
				})}
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

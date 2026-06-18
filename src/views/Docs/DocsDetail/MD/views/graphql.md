# GraphQL Playground

The GraphQL Playground runs read-only queries against Arweave-compatible GraphQL gateways. It is useful for searching Arweave blocks and transactions, finding bundle contents, and filtering AO records by tags.

#### Playground Features

The Playground provides:

- Multiple persistent query tabs
- A selectable and editable gateway
- Saved custom gateways
- Query variables
- JSON response display
- Fullscreen mode
- Gateway schema introspection
- One-click query templates generated from schema fields

No wallet connection is required.

#### Default Gateways

Lunar starts with:

- `ao-search-gateway.goldsky.com`
- `arweave-search.goldsky.com`
- `arweave.net`

The first gateway is selected by default. Enter another gateway base URL and save it to add it to the local list.

Lunar appends `/graphql` when needed. Gateways can expose different schemas, indexes, or freshness, so a query that works on one gateway may need adjustment on another.

#### Running a Query

1. Open **GraphQL**.
2. Select or enter a gateway.
3. Write a query in the left editor.
4. Optionally enable Variables and enter a JSON object.
5. Execute the query.
6. Inspect the JSON response on the right.

If the editor contains a bare field selection rather than `query { ... }`, Lunar wraps it in a query operation before sending it.

#### Query Recent Arweave Blocks

```graphql
query RecentBlocks {
	blocks(first: 10, sort: HEIGHT_DESC) {
		edges {
			cursor
			node {
				id
				height
				timestamp
				previous
			}
		}
	}
}
```

The exact block fields and arguments depend on the selected gateway schema.

#### Query Arweave Transactions

```graphql
query RecentTransactions {
	transactions(first: 10, sort: HEIGHT_DESC) {
		edges {
			cursor
			node {
				id
				owner {
					address
				}
				recipient
				quantity {
					ar
					winston
				}
				fee {
					ar
					winston
				}
				data {
					size
					type
				}
				block {
					height
					timestamp
				}
			}
		}
	}
}
```

Leaving out AO tag filters is important when you want general Arweave activity rather than only AO records.

#### Query AO Processes

```graphql
query AOProcesses {
	transactions(
		first: 20
		sort: HEIGHT_DESC
		tags: [{ name: "Data-Protocol", values: ["ao"] }, { name: "Type", values: ["Process"] }]
	) {
		edges {
			node {
				id
				owner {
					address
				}
				tags {
					name
					value
				}
				block {
					height
					timestamp
				}
			}
		}
	}
}
```

Replace `Process` with `Message` or `Assignment` to inspect other AO record types.

#### Query Bundle Contents

```graphql
query BundleContents($bundleId: [ID!]) {
	transactions(bundledIn: $bundleId, first: 50, sort: HEIGHT_DESC) {
		pageInfo {
			hasNextPage
		}
		edges {
			cursor
			node {
				id
				owner {
					address
				}
				recipient
				tags {
					name
					value
				}
			}
		}
	}
}
```

Variables:

```json
{
	"bundleId": ["bundle-transaction-id"]
}
```

#### Query by Owner or Recipient

```graphql
query Activity($owner: String!, $recipient: String!) {
	owned: transactions(owners: [$owner], first: 25) {
		edges {
			node {
				id
			}
		}
	}
	received: transactions(recipients: [$recipient], first: 25) {
		edges {
			node {
				id
			}
		}
	}
}
```

Variables:

```json
{
	"owner": "wallet-address",
	"recipient": "recipient-address"
}
```

Some gateways use `ID` rather than `String` for address arguments. Use the schema panel to confirm the selected gateway's types.

#### Variables

Enable Variables to show a JSON editor below the query. Variable contents and visibility are stored per Playground tab in local browser storage.

The variables value must be a JSON object:

```json
{
	"ids": ["transaction-id"],
	"limit": 25
}
```

Invalid JSON is not sent with the request, so validate the object if a variable-based query returns an unexpected error.

#### Schema Documentation

Open **Docs** in the Playground to introspect the active gateway.

The panel lists:

- Queries
- Mutations, if exposed
- Subscriptions, if exposed
- Arguments and types
- Field descriptions
- Deprecated fields
- Named schema types

Select **Use** beside a root field to generate a starter operation. Required arguments are added as variables with `null` placeholders.

Schema introspection can fail when a gateway disables introspection or does not support the requested codec.

#### Pagination

Transaction connections usually return cursors:

```graphql
query NextPage($after: String) {
	transactions(first: 100, after: $after, sort: HEIGHT_DESC) {
		pageInfo {
			hasNextPage
		}
		edges {
			cursor
			node {
				id
			}
		}
	}
}
```

Use the final edge cursor as the next `after` value until `hasNextPage` is false.

#### Gateway Differences

Use another gateway when:

- A recent record has not been indexed yet.
- An AO-specific gateway exposes fields absent from a general Arweave gateway.
- A query times out or returns a schema error.
- You want to compare indexing results.

The Playground sends requests directly from the browser, so gateway CORS policy and availability also matter.

#### Related Reading

- [Arweave overview](/docs/overview/arweave)
- [AO overview](/docs/overview/ao)
- [Blocks](/docs/views/blocks)
- [Arweave GraphQL guide](https://cookbook.arweave.net/guides/graphql/index.html)

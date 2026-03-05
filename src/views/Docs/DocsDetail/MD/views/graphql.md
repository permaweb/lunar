# GraphQL Playground

The GraphQL Playground provides an interactive interface for querying Arweave and AO network data. Use it to build custom queries, explore transaction data, and extract information for analysis.

#### Overview

The GraphQL Playground allows you to:

- **Query** transactions and blocks from Arweave
- **Filter** by tags, owners, recipients, and more
- **Explore** AO network messages and processes
- **Test** queries with live data
- **Export** results for further analysis
- **Use** multiple gateways for data access

#### Getting Started

**Opening the Playground:**

1. Click **GraphQL** in the sidebar navigation
2. Playground opens with default query
3. Select or add a gateway
4. Modify query as needed
5. Execute with button or Cmd/Ctrl+Enter

**No Wallet Required:**

GraphQL queries are read-only and don't require wallet connection or transaction fees.

#### Interface Components

**Query Editor:**

- **Monaco Editor**: Full-featured code editor
- **Syntax Highlighting**: GraphQL-specific colors
- **Auto-completion**: Suggests fields and types
- **Error Detection**: Highlights syntax errors
- **Line Numbers**: Easy reference

**Variables Panel:**

- **JSON Editor**: Define query variables
- **Syntax Validation**: Checks JSON format
- **Toggle**: Show/hide variables panel
- **Persistence**: Saves per tab

**Response Viewer:**

- **Formatted JSON**: Pretty-printed results
- **Syntax Highlighting**: Color-coded output
- **Collapsible Sections**: Expand/collapse data
- **Copy**: Copy entire response
- **Error Display**: Shows query errors

**Gateway Selector:**

- **Predefined Gateways**: Popular AO and Arweave gateways
- **Custom Gateways**: Add your own URLs
- **Protocol Support**: HTTP and HTTPS
- **Persistence**: Remembers selections

#### Gateway Configuration

**Available Gateways:**

Default gateways include:

- `ao-search-gateway.goldsky.com` - AO network data
- `arweave-search.goldsky.com` - Arweave general data
- `arweave.net` - Official Arweave gateway

**Adding Custom Gateway:**

1. Click **Add Gateway** button
2. Enter gateway URL
3. Include protocol (https://)
4. Save and select

**Gateway Features:**

- Switch between gateways easily
- Test same query on different gateways
- Compare response times
- Fallback options

#### Basic GraphQL Syntax

**Query Structure:**

```graphql
query {
	transactions {
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
			}
		}
	}
}
```

**With Filters:**

```graphql
query {
	transactions(tags: [{ name: "Data-Protocol", values: ["ao"] }], first: 10) {
		edges {
			node {
				id
				tags {
					name
					value
				}
			}
		}
	}
}
```

**With Variables:**

Query:

```graphql
query GetProcess($processId: [String!]) {
	transactions(ids: $processId) {
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
			}
		}
	}
}
```

Variables:

```json
{
	"processId": ["process-id-here"]
}
```

#### Common Query Patterns

**Find AO Processes:**

```graphql
query {
	transactions(tags: [{ name: "Data-Protocol", values: ["ao"] }, { name: "Type", values: ["Process"] }], first: 20) {
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
					timestamp
				}
			}
		}
	}
}
```

**Find AO Messages:**

```graphql
query {
	transactions(tags: [{ name: "Data-Protocol", values: ["ao"] }, { name: "Type", values: ["Message"] }], first: 50) {
		edges {
			node {
				id
				tags {
					name
					value
				}
			}
		}
	}
}
```

**Find Specific Action:**

```graphql
query {
	transactions(
		tags: [{ name: "Data-Protocol", values: ["ao"] }, { name: "Action", values: ["Transfer"] }]
		first: 100
	) {
		edges {
			node {
				id
				tags {
					name
					value
				}
				block {
					timestamp
					height
				}
			}
		}
	}
}
```

**Messages to Process:**

```graphql
query GetMessages($processId: [String!]) {
	transactions(recipients: $processId, tags: [{ name: "Data-Protocol", values: ["ao"] }], first: 50) {
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
			}
		}
	}
}
```

Variables:

```json
{
	"processId": ["your-process-id"]
}
```

**Transactions by Owner:**

```graphql
query GetByOwner($ownerAddress: String!) {
	transactions(owners: [$ownerAddress], tags: [{ name: "Data-Protocol", values: ["ao"] }]) {
		edges {
			node {
				id
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
	"ownerAddress": "wallet-address-here"
}
```

**Time-based Queries:**

```graphql
query RecentTransactions {
	transactions(tags: [{ name: "Data-Protocol", values: ["ao"] }], first: 100, sort: HEIGHT_DESC) {
		edges {
			node {
				id
				block {
					timestamp
					height
				}
			}
		}
	}
}
```

#### Query Parameters

**Pagination:**

- `first: 10` - Limit results to 10
- `after: "cursor"` - Results after cursor
- Use cursors from previous results for next page

**Sorting:**

- `sort: HEIGHT_DESC` - Newest first
- `sort: HEIGHT_ASC` - Oldest first

**Filters:**

**By Tags:**

```graphql
tags: [
  { name: "Tag-Name", values: ["value1", "value2"] }
]
```

**By Owner:**

```graphql
owners: ["address1", "address2"]
```

**By Recipient:**

```graphql
recipients: ["address1", "address2"]
```

**By IDs:**

```graphql
ids: ["id1", "id2"]
```

**By Block:**

```graphql
block: {
  min: 1000000,
  max: 1100000
}
```

#### Using Variables

**Why Variables:**

- Reusable queries
- Cleaner syntax
- Dynamic values
- Type safety

**Defining Variables:**

In query:

```graphql
query GetData($owner: String!, $limit: Int) {
  transactions(
    owners: [$owner]
    first: $limit
  ) {
    # query body
  }
}
```

In variables panel:

```json
{
	"owner": "wallet-address",
	"limit": 50
}
```

**Variable Types:**

- `String` - Text values
- `Int` - Whole numbers
- `Boolean` - true/false
- `[String]` - Array of strings
- `String!` - Required (non-null)

#### Tab Management

**Multiple Tabs:**

- Open multiple queries simultaneously
- Each tab has independent query and variables
- Tabs persist across sessions
- Named based on query name

**Tab Features:**

**Auto-Naming:**

- Tabs named after query name
- Unnamed queries show as "Untitled"
- Example: `query GetProcesses` → tab named "GetProcesses"

**Tab Actions:**

- **+** button to add tab
- **X** to close tab
- Drag to reorder (where supported)
- Clear all tabs option

#### Response Analysis

**Understanding Results:**

```json
{
	"data": {
		"transactions": {
			"edges": [
				{
					"node": {
						"id": "transaction-id",
						"owner": {
							"address": "owner-address"
						},
						"tags": [
							{ "name": "Data-Protocol", "value": "ao" },
							{ "name": "Type", "value": "Process" }
						]
					}
				}
			]
		}
	}
}
```

**Structure:**

- `data` - Successful response data
- `edges` - Array of results
- `node` - Individual transaction
- `cursor` - For pagination

**Errors:**

```json
{
	"errors": [
		{
			"message": "Error description",
			"locations": [{ "line": 2, "column": 5 }]
		}
	]
}
```

#### Best Practices

**Query Optimization:**

- Request only needed fields
- Use pagination (first/after)
- Apply filters to reduce results
- Limit tag array size
- Sort for relevance

**Example - Optimized:**

```graphql
query {
	transactions(tags: [{ name: "Data-Protocol", values: ["ao"] }, { name: "Type", values: ["Process"] }], first: 20) {
		edges {
			node {
				id
				tags {
					name
					value
				}
			}
		}
	}
}
```

**Example - Not Optimized:**

```graphql
query {
	transactions {
		edges {
			node {
				id
				owner {
					address
					key
				}
				recipient
				tags {
					name
					value
				}
				quantity {
					ar
					winston
				}
				fee {
					ar
					winston
				}
				block {
					id
					timestamp
					height
					previous
				}
				parent {
					id
				}
				data {
					size
					type
				}
			}
		}
	}
}
```

**Testing Queries:**

1. Start with simple query
2. Add filters incrementally
3. Verify results at each step
4. Test with different gateways
5. Save working queries

**Variable Usage:**

- Use variables for reusable queries
- Validate JSON in variables panel
- Test with different variable values
- Document expected types

**Gateway Selection:**

- Use AO gateway for AO data
- Use Arweave gateway for general data
- Test multiple gateways if issues
- Add custom gateway if needed

#### Advanced Patterns

**Pagination Loop:**

To get all results:

1. Execute query with `first: 100`
2. Get last cursor from results
3. Use cursor in `after` parameter
4. Repeat until no more results

**Multiple Filters:**

```graphql
query {
	transactions(
		tags: [
			{ name: "Data-Protocol", values: ["ao"] }
			{ name: "Type", values: ["Message"] }
			{ name: "Action", values: ["Transfer", "Balance"] }
		]
		owners: ["wallet-address"]
		first: 50
	) {
		edges {
			node {
				id
				tags {
					name
					value
				}
			}
		}
	}
}
```

**Nested Queries:**

```graphql
query {
	transactions(first: 10) {
		edges {
			node {
				id
				parent {
					id
				}
				bundledIn {
					id
				}
			}
		}
	}
}
```

#### Common Use Cases

**Token Transfers:**

Find all transfers of a specific token:

```graphql
query TokenTransfers($tokenId: [String!]) {
	transactions(recipients: $tokenId, tags: [{ name: "Action", values: ["Transfer"] }], first: 100) {
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
			}
		}
	}
}
```

**Process Activity:**

Monitor a process:

```graphql
query ProcessActivity($processId: [String!]) {
	transactions(recipients: $processId, first: 50, sort: HEIGHT_DESC) {
		edges {
			node {
				id
				tags {
					name
					value
				}
				block {
					timestamp
				}
			}
		}
	}
}
```

**User Activity:**

Track wallet transactions:

```graphql
query UserActivity($wallet: String!) {
	transactions(owners: [$wallet], tags: [{ name: "Data-Protocol", values: ["ao"] }], first: 100) {
		edges {
			node {
				id
				tags {
					name
					value
				}
			}
		}
	}
}
```

#### Keyboard Shortcuts

- **Cmd/Ctrl+Enter**: Execute query
- **Cmd/Ctrl+/**: Toggle comment
- **Cmd/Ctrl+Space**: Trigger auto-completion
- **Cmd/Ctrl+F**: Find in editor
- **Tab**: Indent
- **Shift+Tab**: Unindent

#### Troubleshooting

**No Results:**

- Check filter criteria
- Verify gateway is correct
- Try different gateway
- Remove filters to broaden search
- Check for typos in tag names

**Errors:**

- Validate GraphQL syntax
- Check variable JSON format
- Verify field names are correct
- Ensure required fields included
- Check gateway status

**Slow Queries:**

- Reduce `first` parameter
- Add more specific filters
- Use pagination
- Try different gateway
- Avoid requesting all fields

Remember: The GraphQL Playground is a powerful tool for exploring and analyzing AO network data. Master query building to extract exactly the information you need efficiently.

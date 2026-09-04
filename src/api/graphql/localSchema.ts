import { buildSchema } from 'graphql';

// Documentation for the native arlmdb.js surface, not a remote gateway schema.
export const arLmdbSchema = buildSchema(`
	enum SortOrder { HEIGHT_ASC HEIGHT_DESC }
	input TagFilter { name: String!, values: [String!]!, op: String }
	input BlockFilter { min: Int, max: Int }
	type Owner { address: String, key: String }
	type Tag { name: String!, value: String! }
	type Data { size: String, type: String }
	type Block { id: ID, height: Int, timestamp: Int, previous: ID }
	type Bundle { id: ID }
	type Transaction {
		id: ID!, anchor: String, signature: String, recipient: String,
		owner: Owner, tags: [Tag!], data: Data,
		"Block metadata is not available from the current index."
		block: Block,
		"Parent metadata is not available from the current index."
		bundledIn: Bundle
	}
	type PageInfo { hasNextPage: Boolean! }
	type TransactionEdge { cursor: String!, node: Transaction }
	type TransactionConnection {
		"Exact for a single unwindowed predicate; bounded counts are marked in extensions.arLmdb.count."
		count: Float
		pageInfo: PageInfo!
		edges: [TransactionEdge!]!
	}
	type Query {
		"Search bundled data in the published index. Requires tags, owners, recipients or bundledIn. Pages are capped at 50. IDs, blocks, root aliases and fragments are unsupported."
		transactions(first: Int = 20, after: String, sort: SortOrder = HEIGHT_DESC,
			tags: [TagFilter!], owners: [String!], recipients: [String!], bundledIn: [String!], block: BlockFilter): TransactionConnection
	}
`);

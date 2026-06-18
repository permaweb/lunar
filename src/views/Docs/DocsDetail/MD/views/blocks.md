# Blocks

The Blocks view is Lunar's entry point into the Arweave chain. It lists recent blocks and connects each one to the transactions, bundles, and AO records it contains.

#### Block List

Each row displays:

- Height
- Block hash
- Previous block hash
- Miner or reward address
- Block size
- Transaction count
- Timestamp

Metadata is loaded as rows become visible. A row can therefore briefly show a loading state while Lunar retrieves the complete block header.

#### Opening a Block

Click a row, block height, or block hash to open the block in Explorer.

The block overview includes:

- Independent block hash
- Previous block hash
- Transaction root
- Miner and reward
- Transaction count
- Timestamp and relative age
- Confirmations
- Block size

The transaction list below the overview opens every contained record in Explorer.

#### Filtering by Height

Use **Filter** to set:

- Minimum block height
- Maximum block height
- Both values for a closed range

The minimum cannot be greater than the maximum. Active filters appear in the list header and are also reflected in the URL, making a filtered view shareable.

Lunar stores the last applied block range in local browser storage.

#### Pagination

The list uses cursor pagination. Previous and Next move through the current query, while the page and per-page values describe the active position and page size.

Changing the range or page size resets the cursor history to the first page.

#### CSV Export

**Download** exports the visible page as CSV. The export includes block identifiers, heights, timestamps, previous hashes, miner data, block size, transaction count, and other metadata available for the loaded rows.

The export contains the current page, not every block in the selected range.

#### Block Transactions

Inside Explorer, a block's transaction list can be filtered by:

- Message
- Assignment
- Bundle
- Transaction

The list displays transaction ID, detected type, owner, recipient, data size, and timestamp. Native AR transfers are identified from the transaction quantity, while AO transfers are identified from AO message tags.

#### Searching Directly

You do not need to start in the Blocks view. Enter either of these in the global search or Explorer:

- A decimal block height, such as `1000000`
- A 64-character Arweave block hash

Use the arrow controls in a block's Explorer header to move to the previous or next available height.

#### Related Reading

- [Arweave overview](/docs/overview/arweave)
- [Explorer](/docs/views/explorer)
- [GraphQL](/docs/views/graphql)

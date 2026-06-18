# Introduction

Lunar is an explorer for Arweave and AO. It brings permanent network data and message-driven computation into one interface so you can follow an identifier from its Arweave record to its AO meaning.

Lunar can inspect:

- Arweave blocks, transactions, bundles, data, and wallet activity
- Native AR transfers, fees, confirmations, owners, and recipients
- AO processes, messages, assignments, results, and token transfers
- Relationships between blocks, bundles, transactions, processes, messages, and wallets

#### Arweave and AO Together

Arweave is the permanent data layer. It provides the block history, signed transactions, wallet identities, tags, and retrievable data that make up the permaweb.

AO is the computation layer. Processes receive messages, execute logic, and emit results or more messages. AO records use Arweave-compatible identifiers and are discoverable through gateways and AO services.

Lunar treats these as connected layers:

1. Start with a block height, block hash, transaction ID, process ID, message ID, or wallet address.
2. Inspect the underlying Arweave metadata and data.
3. When the record belongs to AO, continue into process state, message results, related messages, source, or AOS.

See [Arweave](/docs/overview/arweave) and [AO](/docs/overview/ao) for a closer look at each layer.

#### Main Views

- **Blocks** lists recent Arweave blocks, supports height-range filters, and opens each block in Explorer.
- **Explorer** identifies and displays blocks, transactions, bundles, wallets, AO processes, and AO messages.
- **Console** provides an owner-only AOS interface for creating and interacting with AO processes.
- **GraphQL** runs queries against Arweave-compatible gateways and exposes each gateway's schema.
- **Docs** explains the network concepts and the way Lunar maps them into the interface.

#### What You Can Search

The global search and Explorer accept:

- A 43-character transaction ID, data item ID, process ID, message ID, or wallet address
- A decimal Arweave block height
- A 64-character Arweave block hash

Lunar uses record tags and metadata to classify valid 43-character identifiers as a transaction, bundle, wallet, process, or message.

#### Common Workflows

**Investigate a block**

1. Open **Blocks** or search for a block height.
2. Review the block hash, previous block, miner, reward, size, timestamp, and confirmations.
3. Filter the block's transaction list by transaction, bundle, message, or assignment.
4. Open any row in Explorer for the full record.

**Inspect permanent data**

1. Search for a transaction ID.
2. Review status, value, owner, recipient, fee, block, confirmations, size, and tags.
3. Inspect the transaction data rendered according to its content type.
4. Follow links to its block, owner, recipient, or containing bundle.

**Trace AO execution**

1. Open a process or message ID.
2. Use process tags and Source to understand the program.
3. Use Messages and message results to follow execution.
4. Use Read for queries, Write for signed messages, or AOS when you own the process.

#### Data Sources and Availability

Lunar reads from Arweave gateways, GraphQL indexes, and configured AO services. A newly submitted record can be available from one source before another, so a transaction may briefly appear as pending or not yet indexed.

Gateway and AO node availability can also affect which metadata, results, or source records are immediately visible. Refreshing or trying another GraphQL gateway can help distinguish delayed indexing from missing data.

#### Further Reading

- [Arweave](https://arweave.org)
- [Arweave documentation](https://docs.arweave.org)
- [AO](https://ao.arweave.net)
- [AO cookbook](https://cookbook_ao.arweave.net)

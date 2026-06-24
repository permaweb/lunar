# Arweave

Arweave is the permanent data network beneath the permaweb. It stores signed data in an append-only block history and makes that data retrievable through gateways.

Lunar exposes Arweave as a set of connected entities rather than treating every identifier as an AO record.

#### Blocks

An Arweave block groups confirmed transactions at a specific height.

Lunar displays:

- Block height and independent hash
- Previous block hash and transaction root
- Miner or reward address and miner reward
- Block size, transaction count, timestamp, and confirmations
- The transactions contained in the block

You can open a block by decimal height or by its 64-character block hash. The Explorer also provides previous and next block navigation.

The [Blocks view](/docs/views/blocks) is the quickest way to browse recent blocks or constrain the list to a height range.

#### Transactions

An Arweave transaction is a signed record with a 43-character ID. Depending on the transaction, it can include:

- An owner and optional recipient
- An AR quantity and transaction fee
- A set of application-defined tags
- A data payload and content type
- A block height and timestamp after confirmation
- A reference to a containing bundle

For a native AR transfer, the transaction quantity and recipient represent movement of AR on Arweave itself. This is different from an AO token transfer, which is represented by an AO message sent to a token process.

Lunar's transaction overview shows the value, fee, status, block, confirmations, data size, owner, and recipient. Tags and data are displayed alongside the overview.

#### Bundles and Data Items

Bundling groups many signed data items inside one outer Arweave transaction. Lunar recognizes binary bundles through the standard bundle tags:

- `Bundle-Format: binary`
- `Bundle-Version: 2.0.0`

A bundle page shows the outer transaction overview, bundle tags, bundler, item count, and a paginated list of the bundled records. The list can be filtered by transaction, bundle, AO message, or AO assignment.

Bundled data items retain their own IDs, owners, tags, targets, and data. This is why an AO message can be opened directly even when its permanent anchor is an outer bundle transaction.

#### Wallets

An Arweave wallet address is a 43-character identity derived from its public key. The same address can own Arweave transactions and sign AO messages.

When an address has indexed activity but no transaction record of its own, Lunar classifies it as a wallet. The wallet view shows:

- Native AR balance
- AO token balance
- Indexed incoming and outgoing activity
- Links to related transactions, messages, processes, and recipients

See [Wallet Integration](/docs/guides/wallets) for connection and signing behavior.

#### Tags and Content Types

Tags are application metadata attached to transactions and data items. Common examples include:

- `Content-Type`
- `App-Name`
- `App-Version`
- `Data-Protocol`
- `Type`
- `Action`

Lunar uses tags both for display and classification. For example, AO records commonly use `Data-Protocol: ao` plus a `Type` such as `Process`, `Message`, or `Assignment`.

Transaction data is fetched from the configured Arweave gateway. Lunar renders JSON, Markdown, HTML, images, and text according to the available content type; unknown content is shown as text.

#### Confirmations and Indexing

Confirmed transactions include block metadata. Lunar compares the transaction's block height with the current network height to display confirmations and a pending or confirmed status.

A submitted transaction may be retrievable before its block metadata reaches every index. In that interval Lunar may show it as pending, not yet found, or missing some fields. This does not necessarily mean the transaction failed.

#### GraphQL

Arweave GraphQL gateways index blocks and transactions for search. Lunar uses GraphQL for lists, filters, owner and recipient lookups, bundle contents, and AO tag queries.

Use the [GraphQL Playground](/docs/views/graphql) when you need a custom query or want to compare gateway schemas and indexing results.

#### Further Reading

- [Arweave documentation](https://docs.arweave.org)
- [GraphQL guide](https://cookbook.arweave.net/guides/graphql/index.html)
- [ANS-104 bundled data](https://specs.arweave.net/ans-104/)

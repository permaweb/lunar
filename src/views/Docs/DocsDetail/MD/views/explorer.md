# Explorer

Explorer is Lunar's unified inspector for Arweave and AO. It accepts network identifiers, determines what they represent, and opens the appropriate metadata, data, execution, and relationship views.

#### Supported Inputs

Explorer accepts:

- A 43-character transaction, data item, process, message, or wallet identifier
- A decimal Arweave block height
- A 64-character Arweave block hash

For a 43-character identifier, Lunar attempts a direct gateway lookup and then falls back to configured GraphQL indexes. Tags and metadata are used to classify the record.

#### Detected Types

Explorer can display:

- **Block**
- **Transaction**
- **Bundle**
- **Wallet**
- **Process**
- **Message**

AO assignments can appear in block and bundle lists and open as transaction-like records.

The detected type is shown in the Explorer header. Related identifiers throughout the page are clickable and open in Explorer.

#### Common Controls

Each Explorer tab includes controls to:

- Search or replace the active identifier
- Copy the identifier
- Copy the current URL
- Enter fullscreen
- Refresh the record

Explorer supports multiple persistent tabs. Opening a related record adds or selects a tab without losing the current inspection path.

#### Generic Transactions

A native Arweave transaction page shows:

- Pending, confirmed, or not-yet-indexed status
- AR value and estimated USD value
- Owner and recipient
- Fee and estimated USD value
- Timestamp and age
- Block height and confirmations
- Data size
- Tags
- Transaction data

The Data panel uses the transaction content type where available. JSON is shown as structured data, Markdown is rendered, HTML is displayed, images are previewed, and other content is shown as text.

Native AR transfers are recognized from a positive transaction quantity and recipient.

#### Blocks

A block can be opened by height or hash. Its overview includes:

- Height and block hash
- Previous block hash
- Transaction root
- Miner and reward
- Transaction count
- Timestamp
- Confirmations
- Block size

The transaction list supports pagination, CSV download, and filters for messages, assignments, bundles, or other transactions.

Previous and next block controls appear in the header. The next control is disabled when the current block is the latest known height.

#### Bundles

Lunar detects ANS-104 binary bundles from their bundle format and version tags.

A bundle page shows:

- Outer transaction status, value, bundler, fee, block, confirmations, and size
- Bundle format, version, and other tags
- Number of indexed bundled records
- Paginated bundle contents

Bundle contents can be filtered by message, assignment, bundle, or transaction and downloaded as CSV.

#### AO Processes

A process receives additional tabs:

**Overview**

Shows Arweave transaction metadata, owner, AO balance, process tags, and an automatic process read.

**Messages**

Lists messages involving the process. Filters and CSV export help isolate actions, participants, dates, and execution paths.

**Read**

Runs a read-only process query without asking the wallet to sign a new message.

**Write**

Submits a signed message to the process. The connected wallet and the process's own handler rules determine what is authorized.

**Data**

Displays data attached to the process record.

**Source**

Loads available process source or `On-Boot` code.

**AOS**

Appears when the connected wallet address matches the process owner.

#### AO Messages

A message overview combines Arweave and AO information:

- Transaction status, owner, target, fee, block, confirmations, and size
- Action, variant, data protocol, date, scheduled block height, or slot
- Input data and tags
- Computation output or error
- Resulting messages

For `Transfer` messages, Lunar can display the token process, sender, recipient, quantity, execution status, and debit or credit notices.

Click a resulting message to continue following the execution graph.

#### Wallets

When a valid address has indexed owner activity but no transaction record, Lunar presents it as a wallet.

The wallet view includes:

- Native AR balance
- AO token balance
- Indexed incoming and outgoing activity

The wallet does not need to be connected for inspection. Connection is required only for signing actions.

#### Lists, Filters, and Export

Transaction and message lists use cursor pagination. Depending on the view, filters can include:

- Record type
- Action
- Sender
- Recipient
- Date range
- Block height range

List state is reflected in URL parameters where supported. CSV downloads export the currently loaded page rather than the entire result set.

#### Lookup and Indexing Behavior

A record can exist before all sources agree about it. Lunar may retrieve data directly from an Arweave gateway while GraphQL block metadata or AO results are still propagating.

If a known record appears incomplete:

1. Refresh the Explorer tab.
2. Confirm the ID or block hash format.
3. Check the GraphQL Playground with another gateway.
4. For AO messages, confirm the target process and variant.

#### Related Reading

- [Arweave overview](/docs/overview/arweave)
- [AO overview](/docs/overview/ao)
- [Blocks](/docs/views/blocks)
- [Processes](/docs/concepts/processes)
- [Messages](/docs/concepts/messages)

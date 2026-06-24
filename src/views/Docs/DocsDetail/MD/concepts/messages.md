# Messages

Messages are signed inputs to AO processes. They connect AO execution to Arweave-compatible records through IDs, owners, targets, tags, data, and permanent indexing.

#### Message Anatomy

The fields most useful in Lunar are:

- `Id`: the message or data item identifier
- `Owner`: the signing identity when available
- `From-Process`: the logical sending process for process-generated messages
- `Target` or recipient: the process receiving the message
- `Action`: the requested behavior
- `Tags`: protocol and application parameters
- `Data`: the message payload
- `Variant`: the AO network format
- Block, timestamp, slot, or scheduling metadata

Not every source exposes every field immediately. Newly submitted or pushed messages can be retrievable before all scheduling or block metadata has been indexed.

#### Message Flow

A typical AO interaction is:

1. A wallet or process creates a message for a target process.
2. The scheduler orders the message for that process.
3. The process evaluates matching handlers.
4. The computation produces output, an error, state changes, or additional messages.
5. Gateways and AO services make the record and result available for inspection.

Lunar combines the stored message metadata with the computation result where possible.

#### Senders, Owners, and Targets

These identities can differ:

- **Owner** is the cryptographic signer exposed by the record.
- **From-Process** identifies a process that emitted a pushed message.
- **Target** is the process expected to execute the message.
- An application tag such as `Recipient` can name a business-level recipient, such as the recipient of a token transfer.

When tracing behavior, distinguish the transport target from application-specific recipient tags.

#### Message Results

The result panel can include:

- Output data
- Runtime errors
- Process prompt or print output
- Messages emitted during execution
- Transfer notices such as `Debit-Notice`, `Credit-Notice`, or `Transfer-Error`

An empty output is not always a failure. Some handlers update state or emit messages without returning a data payload.

#### Resulting Messages

Resulting messages are the next edges in the execution graph. They can represent:

- Replies to the original sender
- Calls to another process
- Token debit and credit notices
- Application-specific notifications

Open a resulting message in Explorer to continue tracing its target, tags, result, and descendants.

#### AO and Arweave Context

An AO message can be an individually indexed data item inside an Arweave bundle. Its 43-character ID identifies the message itself, while `Bundled-In` can point to the outer transaction that anchored a group of records.

The underlying Arweave context explains ownership, tags, content size, bundle membership, and block inclusion. The AO context explains execution, results, and process-to-process relationships.

#### Token Transfer Messages

AO token processes commonly accept:

```text
Action: Transfer
Recipient: <address>
Quantity: <integer in the token's base unit>
```

Lunar detects transfer messages and can display the token process, sender, recipient, quantity, status, and resulting notices.

This is not a native AR transfer. Native AR value is carried by an Arweave transaction's quantity field rather than an AO `Transfer` action.

#### Related Reading

- [AO overview](/docs/overview/ao)
- [Arweave overview](/docs/overview/arweave)
- [Processes](/docs/concepts/processes)
- [AO message documentation](https://cookbook_ao.arweave.net/concepts/messages.html)

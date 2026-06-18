# AO

AO is a message-oriented computation network built for independently executing processes. Its records are connected to the Arweave ecosystem through permanent data, signed identifiers, tags, and gateway indexes.

Lunar combines AO-specific execution data with the underlying Arweave records so you can inspect both what was stored and what was computed.

#### Processes

A process is a long-lived program with its own state and message history. It receives messages, runs handlers, and can produce output or send more messages.

AO process records commonly identify:

- The process owner
- Module, scheduler, and authority references
- Network `Variant`
- `On-Boot` or source references
- Application metadata such as name and description

In Lunar, a process has dedicated Overview, Messages, Read, Write, Data, and Source tabs. Owners also receive an AOS tab.

See [Processes](/docs/concepts/processes).

#### Messages and Results

A message is an input to a process. Its tags describe routing and intent, while its data carries the payload.

Important message fields include:

- Message ID
- Owner or logical sender
- Target process
- `Action` and additional tags
- Data payload
- Block or scheduler metadata
- Computation result and emitted messages

Lunar resolves the message's target process and network variant before requesting its result. The message page then combines Arweave metadata, AO output, errors, and resulting messages.

See [Messages](/docs/concepts/messages).

#### Assignments

Assignments associate messages with scheduling information. They may appear in block and bundle transaction lists and can be isolated with the Assignment type filter.

Assignments are protocol records rather than process calls a user normally submits directly, but they are useful when tracing ordering and execution.

#### Mainnet and Legacynet

Lunar recognizes AO records by their `Variant` tags and supports both current mainnet and legacy AO records.

The selected variant affects:

- Which scheduler and compute interfaces are used
- How message IDs and results are resolved
- How process output is ordered and displayed

You usually do not need to select a variant manually; Lunar reads it from the process or message tags.

#### AO Token Transfers

An AO token transfer is a message sent to a token process, commonly with:

- `Action: Transfer`
- `Recipient`
- `Quantity`

Lunar can show the token process, sender, recipient, amount, execution status, and resulting debit or credit notices.

This is distinct from a native AR transfer:

- **AR transfer:** value moves in the Arweave transaction quantity field.
- **AO token transfer:** process state changes after an AO message is executed.

#### Interacting with Processes

Lunar provides three interaction surfaces:

- **Read** performs process queries without asking the wallet to sign a new message.
- **Write** submits a signed message to the process.
- **AOS** sends Lua evaluation messages and streams process output for the process owner.

Before writing, inspect the process Source and recent Messages to confirm supported actions, tags, and authorization rules.

#### AOS

AOS is the Lua-oriented operating environment used to interact with AO processes. Lunar includes an owner-only browser console and editor for AOS workflows.

See [AOS](/docs/concepts/aos) and [Console](/docs/views/console).

#### Further Reading

- [AO](https://ao.arweave.net)
- [AO cookbook](https://cookbook_ao.arweave.net)
- [AO concepts](https://cookbook_ao.arweave.net/concepts/index.html)
- [aos repository](https://github.com/permaweb/aos)

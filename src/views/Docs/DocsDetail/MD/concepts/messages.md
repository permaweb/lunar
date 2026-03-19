# Messages

Messages are the fundamental execution records of AO and one of the primary entities you inspect in Lunar.

If processes are the program logic, messages are the concrete inputs and outputs that show what actually happened.

#### Message Structure

AO messages include identity fields, routing fields, protocol tags, and payload data. In Lunar, the most relevant fields for day-to-day inspection are:

- `Id`: unique message/transaction identifier
- `From`: logical sender identity
- `Owner`: signing identity
- `Target` (or recipient context): process receiving execution request
- `Timestamp` and `Block-Height`: ordering and chronology
- `Tags`: protocol and action-specific metadata
- `Data` and output/result payloads

#### Message Execution Flow

> "The `ao` computer takes messages and sends them to Processes in which those Processes can output messages that can be sent to other Processes. The result is a complex system built on simple modular logic containers." - [ao cookbook](https://cookbook_ao.arweave.net)

Lunar makes message flow inspectable:

1. A message is submitted with an `Action` and optional parameters in tags/data.
2. A target process executes matching logic.
3. Output is produced (success, error, or empty response).
4. Optional resulting messages are emitted and linked.

#### Message Types and Relationships

In practice, message analysis in Lunar usually uses three relationship views:

- incoming messages to a process
- outgoing messages emitted by a process
- resulting messages created during a given execution

This allows you to move from a single message to the surrounding interaction graph without leaving Lunar.

#### Actions and Tags

`Action` generally communicates intended behavior, while additional tags define parameters.

Common patterns include:

- `Action: Info`
- `Action: Balance`
- `Action: Transfer` with tags such as `Recipient` and `Quantity`

Process implementations define what is accepted. In Lunar, Source plus historical Messages is usually the most reliable reference for confirming action names, required tags, and expected response shapes.

#### Inspecting Messages in Lunar

![](message.png)

For a specific message, Lunar exposes:

- message identity and routing metadata
- input payload and full tag set
- output payload or error details
- resulting messages and linked follow-on calls

For process-level analysis, message list filters (action, sender, recipient, date range, pagination) are useful for isolating a specific execution path in high-volume streams.

#### Output and Failure Interpretation

Message output in Lunar commonly falls into three broad states:

- success output (returned values or structured payload)
- error output (validation/handler/runtime failure)
- empty output (no explicit return payload)

Resulting messages are often needed to interpret side effects, especially for action types that trigger secondary notices or process-to-process calls.

#### Ethereum-Signed Messages

AO cookbook notes:

> "If the Message ANS-104 DataItem was signed using Ethereum keys, then the value in the `Owner` and `From` fields will be the EIP-55 Ethereum address of the signer."

In Lunar, this affects how sender and owner identities should be interpreted when correlating behavior across address formats.

#### Related AO Reading

For deeper protocol-level details:

- Messages: [https://cookbook_ao.arweave.net/concepts/messages.html](https://cookbook_ao.arweave.net/concepts/messages.html)
- How it Works: [https://cookbook_ao.arweave.net/concepts/how-it-works.html](https://cookbook_ao.arweave.net/concepts/how-it-works.html)
- Processes: [https://cookbook_ao.arweave.net/concepts/processes.html](https://cookbook_ao.arweave.net/concepts/processes.html)
- Concepts index: [https://cookbook_ao.arweave.net/concepts/index.html](https://cookbook_ao.arweave.net/concepts/index.html)

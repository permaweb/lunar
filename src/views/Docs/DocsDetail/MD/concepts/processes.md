# Processes

Processes are the 'computer programs' of AO - the core logic you inspect in Lunar.

In AO, a process is an actor that receives messages, executes logic, and can emit further messages. In Lunar, process pages expose the evidence of that behavior through metadata, source, state interfaces, and message history.

#### Processes in AO and Lunar

![](process.png)

The AO cookbook describes [processes](https://cookbook_ao.arweave.net/concepts/processes.html) as follows:

> "Processes possess the capability to engage in communication via message passing, both receiving and dispatching messages within the network. Additionally, they hold the potential to instantiate further processes, enhancing the network's computational fabric. This dynamic method of data dissemination and interaction within the network is referred to as a 'holographic state', underpinning the shared and persistent state of the network."

For reference, some processes you can inspect in Lunar are:

- [AO token](/explorer/0syT13r0s0tgPmIed95bJnuSqaD29HQNN8D3ElLSrsc/info)
- [Apus fair launch process](/explorer/jHZBsy0SalZ6I5BmYKRUt0AtLsn-FCFhqf_n6AgwGlc/info)
- [Redstone oracle relayer](/explorer/mTnbGv_OlWLS6KJlTqN2s1qlLqinkDwzQ8VnctQ0b0o/info)
- [wAR token](/explorer/xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10/info)

#### Process anatomy in Lunar

When you open a process in Explorer, the main elements available for inspection are:

- process ID and owner
- module, scheduler, and authority references
- protocol and custom tags
- source/on-boot code (where available)
- related incoming and outgoing messages
- read/write interfaces for process interaction

Together, these provide both identity (what this process is) and behavior (what this process does over time).

#### Process execution

A simple example -- getting info about a process:

1. A message is sent to a process with tags such as:
   - `Action: Info`
2. The process matches an `Info` handler.
3. The handler returns process metadata as output.
4. Lunar shows:
   - the input message in `Messages`
   - the output payload in message details
   - any resulting messages, if emitted

In Lunar, this is exposed over the `/explorer/<id>/info` path.

A transfer action follows the same shape with different side effects:

1. Message with `Action: Transfer`, `Recipient`, `Quantity`
2. Process validates and updates state
3. Output confirms or errors
4. Resulting messages may include `Debit-Notice` / `Credit-Notice`

#### Source and handlers

![Handler diagram](handler-diagram.png)

AO cookbook also captures the handler-oriented model:

> "When building a Process with `aos` you have the ability to add `handlers`, these handlers can be added by calling the `Handlers.add` function, passing a \"name\", a \"match\" function, and a \"handle\" function."

An `Info` flow in Lunar usually looks like:

1. In `Read`, send a request with `Action: Info`.
2. The process handler matches on `Info`.
3. The response returns metadata, for example:

```json
{
	"Data-Protocol": "ao",
	"Variant": "ao.TN.1",
	"Type": "Message",
	"Reference": 20335813,
	"TotalSupply": "129769196913862835",
	"MinBurnAmt": 500000000000,
	"BurnFee": 300000000000,
	"X-Origin": null,
	"X-Reference": null,
	"Ticker": "wAR",
	"Denomination": 12,
	"BridgeProcessId": "MysFttDUI1YJKcFwYIyqVWGfFGnetcCp_5TGjdhVgS4",
	"FeeRecipient": "4S58xCqS6uKcrvqb2JlrCWllC2VIBs7qxU15QbWa3ZI",
	"MintFee": 0,
	"Logo": "L99jaxRKQKJt9CqoJtPaieGPEhJD3wNhR4iGqc8amXs",
	"HolderNum": 43018,
	"Name": "Wrapped AR"
}
```

When this works, you can validate the handler contract end-to-end:

- expected action name (`Info`)
- expected response shape (fields present)
- consistency with what Source advertises

In Lunar, the process Source tab provides the handler definition, while Messages/Read show whether real calls are matching and returning as expected.

#### Process metadata and tags

Process tags combine AO protocol identifiers with process-specific metadata. Typical protocol-level tags include:

- `Data-Protocol`
- `Type`
- `Variant`
- `Module`
- `Scheduler`
- `OnBoot`

Custom tags (such as `Name`, `Description`, or version markers) provide additional application context when present.

#### State and Interaction Surfaces

Lunar exposes process interaction across multiple surfaces:

- `Overview`: metadata and reference information
- `Messages`: incoming/outgoing message history
- `Read`: non-state-changing queries
- `Write`: state-changing message submission
- `Data`: raw attached data inspection
- `Source`: process code and handler definitions
- `AOS`: interactive owner-oriented process session

These surfaces represent different views of the same process lifecycle and can be used together to form a complete picture.

#### Related AO Reading

For deeper protocol-level details on processes and execution flow:

- Processes: [https://cookbook_ao.arweave.net/concepts/processes.html](https://cookbook_ao.arweave.net/concepts/processes.html)
- How it Works: [https://cookbook_ao.arweave.net/concepts/how-it-works.html](https://cookbook_ao.arweave.net/concepts/how-it-works.html)
- Messages: [https://cookbook_ao.arweave.net/concepts/messages.html](https://cookbook_ao.arweave.net/concepts/messages.html)
- Concepts index: [https://cookbook_ao.arweave.net/concepts/index.html](https://cookbook_ao.arweave.net/concepts/index.html)

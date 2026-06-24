# Processes

Processes are the programs of AO. Each process owns state, receives messages, executes handlers, and can emit output or additional messages.

Lunar presents a process as both an AO runtime entity and an Arweave-linked record.

#### Process Identity

A process is opened by its 43-character ID. Its indexed record can include:

- Owner address
- `Data-Protocol`
- `Type`
- `Variant`
- `Module`
- `Scheduler`
- `Authority`
- `On-Boot`
- Custom tags such as `Name` or `Description`

The Module defines the execution environment, the Scheduler participates in ordering messages, and the Authority identifies a trusted authority where the selected AO variant uses one.

#### Process Views in Lunar

**Overview**

Shows the transaction status, owner, block metadata, process tags, AO balance, and an automatic process read.

**Messages**

Lists indexed messages involving the process. Filters can narrow the list by action, sender, recipient, date, and other available fields.

**Read**

Runs a process query without submitting a wallet-signed message. Use it to inspect public state or test a supported action.

**Write**

Submits a signed AO message. The target process decides whether the sender, action, tags, and data are valid.

**Data**

Displays the data attached to the process record.

**Source**

Resolves available `On-Boot` or source data so you can inspect handlers and initialization logic.

**AOS**

Appears when the connected wallet address matches the process owner. It provides interactive Lua evaluation and process output.

#### Handlers

AOS processes commonly route messages through handlers. A handler usually has:

1. A name used for organization.
2. A match function that decides whether the message applies.
3. A handle function that reads or changes state and optionally sends responses.

For example, a process may match `Action: Info` and return metadata:

```lua
Handlers.add(
  "info",
  Handlers.utils.hasMatchingTag("Action", "Info"),
  function(msg)
    msg.reply({
      Data = json.encode({
        Name = Name,
        Ticker = Ticker,
        Denomination = Denomination
      })
    })
  end
)
```

Source tells you what the process intends to support. Messages and results tell you how those handlers behave in practice.

#### Reading a Process

A useful inspection sequence is:

1. Confirm `Type`, `Variant`, owner, module, scheduler, and authority in Overview.
2. Inspect Source for handler names and required tags.
3. Review recent Messages for real inputs and outputs.
4. Use Read with a non-mutating action such as `Info` or `Balance`.
5. Use Write only after confirming the expected contract.

#### Process Ownership

Ownership is based on the address recorded as the process owner. Lunar compares that address with the connected Wander wallet before exposing AOS.

Ownership does not automatically grant every application-level action. A process can implement additional authorization rules for administrators, delegates, or specific senders.

#### Network Variants

Lunar reads the process `Variant` to select compatible AO libraries and endpoints. Mainnet and legacy processes can have different scheduling and result formats, but their core process/message model remains the same.

#### Related Reading

- [AO overview](/docs/overview/ao)
- [Messages](/docs/concepts/messages)
- [AOS](/docs/concepts/aos)
- [AO process documentation](https://cookbook_ao.arweave.net/concepts/processes.html)

# AOS

AOS is a Lua-oriented operating environment for AO processes. It provides process state, handlers, messaging helpers, and an interactive evaluation workflow.

Lunar embeds an AOS console and editor for processes owned by the connected wallet.

#### AOS in the Arweave and AO Stack

AOS commands are sent as AO messages to a process. The message is signed by the connected Arweave wallet, evaluated by AO, and can produce output or more messages.

This means an AOS session involves both layers:

- Arweave wallet identity and signed records
- AO process execution, state, handlers, and results

#### Access in Lunar

To use AOS:

1. Connect a Wander wallet.
2. Open **Console** or an owned process in Explorer.
3. Select an existing process or create a named mainnet process.
4. Confirm that the connected address matches the process owner.
5. Send Lua from the console input or editor.

The standalone Console lists indexed processes owned by the connected wallet. The AOS tab in Explorer appears only for an owned process.

#### Console Input

The console sends input with the `Eval` action and raw Lua data.

```lua
State = State or {}
State.Counter = (State.Counter or 0) + 1
return State.Counter
```

Use the Up and Down arrow keys to move through commands entered during the current session. Shift+Enter inserts a line break in the console input.

#### Editor

The editor is intended for longer Lua snippets:

```lua
Handlers.add(
  "hello",
  Handlers.utils.hasMatchingTag("Action", "Hello"),
  function(msg)
    msg.reply({ Data = "Hello from " .. ao.id })
  end
)
```

Submitting the editor contents sends the script to the active process. Output and errors appear in the console.

#### Process Output

Lunar requests the result of each submitted evaluation and also polls process results for new printed output. ANSI color codes are rendered in the terminal.

Output can include:

- Returned data
- Printed text
- AOS prompts
- Runtime errors
- Output produced after another message reaches the process

#### Creating a Process

The Console can create a named AO mainnet process through the connected wallet. After creation, Lunar opens the new process and records its process ID, owner, variant, and scheduler in the local tab state.

Process creation and indexing are asynchronous. If a new process is not immediately discoverable elsewhere, wait for propagation and refresh.

#### Safety

Lua sent through AOS can change process state. Before evaluating code:

- Confirm the process ID and connected wallet.
- Read the existing source and handlers.
- Test small changes first.
- Keep authorization checks inside handlers.
- Avoid loading code you have not reviewed.

#### Further Reading

- [Console](/docs/views/console)
- [Processes](/docs/concepts/processes)
- [aos repository](https://github.com/permaweb/aos)
- [AO cookbook AOS guide](https://cookbook_ao.arweave.net/guides/aos/index.html)

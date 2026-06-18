# Console

The Console is Lunar's browser interface for AOS. It lets an owner create an AO mainnet process, connect to an owned process, send Lua evaluations, and inspect process output.

#### Requirements

- A connected Wander wallet
- Ownership of the process you want to use
- A valid 43-character process ID for an existing process

Lunar compares the process owner with the connected wallet address. A process can be inspected without ownership in Explorer, but AOS execution is owner-only.

#### Process Selection

When no process is active, the Console:

- Lists indexed processes owned by the connected wallet
- Shows each process name or shortened ID and its variant
- Supports Previous and Next pagination
- Accepts a process ID directly
- Opens a panel for creating a named process

The process list is based on owner and `Type: Process` tags, so a newly created process may take time to appear in indexed results.

#### Creating a Process

To create a process:

1. Connect Wander.
2. Open **Console**.
3. Select **Create New Process**.
4. Enter a process name.
5. Approve the wallet request.

Lunar creates an AO mainnet process using the configured scheduler and opens it in the active tab.

Creation is asynchronous. Keep the returned process ID even if gateway indexing has not caught up yet.

#### Connecting to an Existing Process

Enter a process ID or select one from the owned-process list. Lunar loads the process record, checks its owner, reads its `Variant`, and selects the matching AO dependencies.

Mainnet and legacy processes can both be opened when their tags and configured services are available.

#### Console Input

Console input is sent to the process as raw Lua using `Action: Eval`.

```lua
State = State or {}
State.Counter = (State.Counter or 0) + 1
return State.Counter
```

Keyboard behavior:

- **Enter** submits the current input.
- **Shift+Enter** inserts a new line.
- **Arrow Up** moves backward through this session's command history.
- **Arrow Down** moves forward through command history.

Commands beginning with a dot are treated as local console commands. Unsupported local commands are rejected instead of being sent to the process.

#### Editor

The editor is useful for longer Lua programs:

```lua
Handlers.add(
  "balance",
  Handlers.utils.hasMatchingTag("Action", "Balance"),
  function(msg)
    local account = msg.Tags.Recipient or msg.From
    msg.reply({ Data = tostring(Balances[account] or 0) })
  end
)
```

Use the editor action to submit the entire script to the active process. The editor and console share the same process session.

#### Output

After each evaluation, Lunar requests the message result and displays returned output or errors.

While connected, Lunar also polls the process for new printed output. This is useful when another message triggers a handler after your initial command.

The terminal supports ANSI foreground colors and updates the prompt when the process returns a new one.

#### Multiple Tabs

Console tabs are stored in local browser storage. Each tab can track a different process and keeps its own active route.

You can:

- Add a blank tab
- Switch between processes
- Close a tab
- Clear saved tabs
- Open the Console in fullscreen

Command history itself is held for the current mounted session rather than written to permanent network storage.

#### Troubleshooting

**Process remains on Loading AOS**

- Confirm the connected address owns the process.
- Refresh the process record in Explorer.
- Check that the process has a recognized `Variant`.
- Verify the configured AO node or legacy compute endpoint.

**A new process does not appear in the list**

- Use the process ID returned at creation.
- Wait for gateway indexing and refresh.
- Confirm that the owner and `Type: Process` tags are indexed.

**No output appears**

- Some Lua changes do not return or print a value.
- Add `return` or `print` while debugging.
- Check the result for a runtime error.

#### Related Reading

- [AOS](/docs/concepts/aos)
- [Processes](/docs/concepts/processes)
- [Wallet Integration](/docs/guides/wallets)

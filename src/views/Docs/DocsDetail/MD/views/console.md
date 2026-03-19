# Console

![](aos.png)

The Console provides an interactive AOS (Actor Oriented System) terminal for real-time process interaction. It's the primary tool for developing, testing, and managing AOS processes through a Lua command-line interface.

#### Overview

The Console enables you to:

- **Create** new AOS processes
- **Connect** to existing processes you own
- **Execute** Lua commands interactively
- **Develop** handlers and state logic
- **Test** process functionality in real-time
- **Debug** process behavior with immediate feedback

#### Getting Started

**Opening the Console:**

1. Click **Console** in the sidebar navigation
2. Console view opens with process connection options
3. Connect wallet for process creation/access
4. Enter existing process ID or create new

**Requirements:**

- Arweave wallet connection (ArConnect, Othent, or Wander)
- Process ownership for console access
- Sufficient AR balance for new process creation

#### Connecting to a Process

**Existing Process:**

1. Enter the 43-character process ID
2. Click **Connect** or press Enter
3. Lunar verifies you own the process
4. Console loads with process welcome screen

**Creating New Process:**

1. Click **Create New Process** button
2. Wallet prompts for transaction signature
3. Process spawns on AO network
4. Console connects automatically
5. Process ID displayed in header

**Process List:**

- View all your processes
- Shows process ID and variant (Mainnet/Legacynet)
- Click any process to connect
- Pagination for many processes

#### Console Interface

**Main Components:**

**Header:**

- Process ID (copyable)
- Network variant indicator
- Fullscreen toggle
- Editor mode toggle
- Refresh button

**Terminal Area:**

- Welcome splash screen
- Command prompt (`aos>`)
- Output display with colors
- Auto-scrolling
- ANSI color support

**Input Area:**

- Command line at bottom
- Multi-line support
- Command history
- Auto-completion
- Syntax awareness

#### Basic Usage

**Executing Commands:**

Type Lua code and press Enter:

```lua
aos> print("Hello AO")
Hello AO
```

```lua
aos> return 2 + 2
4
```

```lua
aos> State = State or {}
aos> State.Counter = 0
```

**Multi-line Commands:**

The console detects incomplete statements:

```lua
aos> function hello(name)
...>   return "Hello " .. name
...> end
aos> hello("World")
Hello World
```

**Return Values:**

Use `return` to see values:

```lua
aos> return State
{Counter = 0, Name = "My Process"}
```

#### Command History

**Navigation:**

- **Arrow Up**: Previous command
- **Arrow Down**: Next command
- **Home**: First command in history
- **End**: Most recent command

**Features:**

- Persists during session
- Recent commands easily accessible
- Edit previous commands
- Re-execute with Enter

#### Editor Mode

**Switching to Editor:**

1. Click **Editor** toggle button
2. Full code editor appears
3. Write multi-line scripts
4. Execute entire script at once

**Editor Features:**

**Monaco Editor:**

- Syntax highlighting for Lua
- Auto-indentation
- Code completion
- Error detection
- Line numbers

**Execution:**

- Click **Execute** button
- Or use Cmd/Ctrl+Enter
- Entire script runs on process
- Output shown below editor

**Use Cases:**

- Writing complex handlers
- Defining multiple functions
- Large state updates
- Testing complete features

**Example:**

```lua
-- Define state
State = State or {}
State.Balances = State.Balances or {}

-- Add handler
Handlers.add(
  "balance",
  Handlers.utils.hasMatchingTag("Action", "Balance"),
  function(msg)
    local target = msg.Tags.Target or msg.From
    local balance = State.Balances[target] or 0
    Send({Target = msg.From, Data = tostring(balance)})
  end
)

-- Initialize balance
State.Balances["test-address"] = 1000

print("Balance handler added!")
```

#### Common Console Operations

**State Management:**

```lua
-- Initialize state
State = State or {}
State.Counter = 0
State.Name = "My Process"

-- View state
return State

-- Update state
State.Counter = State.Counter + 1
return State.Counter
```

**Adding Handlers:**

```lua
Handlers.add(
  "hello",
  Handlers.utils.hasMatchingTag("Action", "Hello"),
  function(msg)
    print("Received hello from: " .. msg.From)
    Send({Target = msg.From, Data = "Hello back!"})
  end
)
```

**Listing Handlers:**

```lua
-- View all handlers
Handlers.list

-- Remove handler
Handlers.remove("hello")
```

**Sending Messages:**

```lua
-- Send to another process
Send({
  Target = "process-id-here",
  Action = "Info"
})

-- Send with data
Send({
  Target = "process-id-here",
  Action = "Store",
  Data = "Some data to store"
})
```

**Receiving Responses:**

```lua
-- Send and wait for response
Send({Target = "process-id", Action = "Info"})
local response = Receive()
print(response.Data)
```

#### Output Display

**Types of Output:**

**Print Statements:**

```lua
print("Debug message")
print("Balance:", State.Balance)
```

**Return Values:**

```lua
return State.Balance
-- Output: 1000
```

**Errors:**

```lua
error("Something went wrong")
-- Output: Error: Something went wrong
```

**Handler Output:**

- Automatically displayed when messages processed
- Shows handler name and result
- Indicates success or failure

**Colors:**

- **White**: Normal output
- **Green**: Success messages
- **Red**: Errors and failures
- **Yellow**: Warnings
- **Cyan**: System messages
- **Gray**: Comments and info

#### Tab Management

**Multiple Console Tabs:**

Like Explorer, Console supports multiple tabs:

- Open multiple processes simultaneously
- Switch between processes easily
- Independent command history per tab
- Each tab maintains separate state

**Tab Actions:**

- **+** button to add new console tab
- **X** to close current tab
- **Clear All** to remove all tabs
- Tabs persist across sessions

#### Process Management

**Your Processes:**

View and manage all your AOS processes:

- List shows all processes you own
- Process ID and variant displayed
- Click to connect to any process
- Create new from the list view

**Process Information:**

Each console session displays:

- Process ID (copyable)
- Network variant (Mainnet/Legacynet)
- Connection status
- Last message timestamp

#### Best Practices

**Development Workflow:**

1. **Start Simple**: Initialize state first
2. **Test Incrementally**: Add handlers one at a time
3. **Print Debug Info**: Use print() liberally
4. **Verify State**: Check State after operations
5. **Handle Errors**: Use assert() for validation

**Code Organization:**

```lua
-- 1. Initialize state
State = State or {}
State.Value = State.Value or 0

-- 2. Define helpers
function validateInput(value)
  assert(type(value) == "number", "Must be number")
  assert(value > 0, "Must be positive")
end

-- 3. Add handlers
Handlers.add(
  "update",
  Handlers.utils.hasMatchingTag("Action", "Update"),
  function(msg)
    local newValue = tonumber(msg.Tags.Value)
    validateInput(newValue)
    State.Value = newValue
    print("Updated to:", State.Value)
  end
)

-- 4. Test
print("Setup complete!")
```

**Debugging Tips:**

**Check Handler Order:**

```lua
Handlers.list
```

**Test Handler Manually:**

```lua
-- Simulate incoming message
Handlers.evaluate({
  From = "test-sender",
  Action = "Test",
  Tags = {Key = "Value"}
})
```

**Inspect Variables:**

```lua
-- View type
print(type(State.Balance))

-- View contents
for k, v in pairs(State) do
  print(k, "=", v)
end
```

**Error Handling:**

```lua
local success, err = pcall(function()
  -- Code that might fail
  riskyOperation()
end)

if not success then
  print("Error:", err)
end
```

#### Advanced Features

**Working with JSON:**

```lua
local json = require("json")

-- Encode to JSON
local data = {name = "Alice", balance = 1000}
local encoded = json.encode(data)
Send({Target = "process-id", Data = encoded})

-- Decode from JSON
local decoded = json.decode('{"name":"Bob"}')
print(decoded.name) -- Bob
```

**Table Utilities:**

```lua
local utils = require(".utils")

-- Check if value in table
utils.includes({"a", "b", "c"}, "b") -- true

-- Map over table
local doubled = utils.map({1, 2, 3}, function(x) return x * 2 end)
-- {2, 4, 6}

-- Filter table
local evens = utils.filter({1, 2, 3, 4}, function(x) return x % 2 == 0 end)
-- {2, 4}
```

**Cron Handlers:**

```lua
-- Periodic execution
Handlers.add(
  "cron-tick",
  Handlers.utils.hasMatchingTag("Action", "Cron"),
  function(msg)
    State.LastTick = msg.Timestamp
    print("Tick at:", msg.Timestamp)
  end
)
```

**Spawning Processes:**

```lua
-- Create child process
Spawn("module-id", {
  Tags = {
    Name = "Child Process",
    Parent = ao.id
  }
})
```

#### Keyboard Shortcuts

- **Enter**: Execute command
- **Shift+Enter**: New line (multi-line mode)
- **Arrow Up/Down**: Command history
- **Ctrl/Cmd+C**: Cancel current input
- **Ctrl/Cmd+L**: Clear screen
- **Tab**: Auto-complete (where supported)

#### Common Issues

**Can't Connect:**

- Verify you own the process
- Check wallet is connected
- Confirm process ID is correct
- Ensure network connection

**Commands Not Working:**

- Check Lua syntax
- Verify handler names are correct
- Ensure state is initialized
- Look for error messages in output

**No Output:**

- Some commands don't return values
- Check if handler completed
- Use print() for debugging
- Verify Send() targets are correct

**Process Slow:**

- Large state can slow operations
- Reduce print statements in handlers
- Optimize complex loops
- Consider pagination for large data

#### Example Session

Here's a complete example session creating a simple counter:

```lua
aos> -- Initialize state
aos> State = State or {}
aos> State.Counter = 0

aos> -- Add increment handler
aos> Handlers.add(
...>   "increment",
...>   Handlers.utils.hasMatchingTag("Action", "Increment"),
...>   function(msg)
...>     State.Counter = State.Counter + 1
...>     print("Counter:", State.Counter)
...>     Send({Target = msg.From, Data = tostring(State.Counter)})
...>   end
...> )

aos> -- Test manually
aos> Handlers.evaluate({From = "test", Action = "Increment"})
Counter: 1

aos> -- Check state
aos> return State.Counter
1

aos> print("Counter process ready!")
Counter process ready!
```

#### Integration with Explorer

The Console works seamlessly with Explorer:

- Processes created in Console appear in Explorer
- AOS tab in Explorer uses same console
- State changes reflect in both views
- Copy process ID to share

**Workflow:**

1. Create process in Console
2. Copy process ID
3. Open in Explorer to inspect
4. Use AOS tab for continued development
5. Share process ID with others

Remember: The Console is your development environment for AO. Master it to build sophisticated processes efficiently with immediate feedback and powerful debugging capabilities.

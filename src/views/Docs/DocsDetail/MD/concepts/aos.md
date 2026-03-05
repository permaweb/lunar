# AOS (Actor Oriented System)

AOS is the interactive development environment for the AO network. It provides a Lua-based programming interface for creating and controlling processes. Understanding AOS is essential for building applications on AO.

#### What is AOS?

AOS is:

- **Interactive Environment**: Real-time Lua console for process interaction
- **Development Tool**: Write and test handlers on the fly
- **Programming Interface**: Full access to process state and capabilities
- **Message Framework**: Simplified message handling and routing
- **Standard Library**: Common utilities and patterns

#### AOS Processes vs Regular Processes

**AOS Processes:**

- Use the AOS module for enhanced capabilities
- Support interactive console access
- Include standard handler patterns
- Provide helper functions and utilities
- Easier for development and testing

**Regular Processes:**

- Use custom or basic modules
- Limited or no console access
- Custom handler implementation
- Direct message handling only
- More control, more complexity

#### Basic AOS Concepts

**Handlers:**

Handlers are functions that respond to incoming messages based on action or pattern:

```lua
Handlers.add(
  "hello",
  function(msg) return msg.Action == "Hello" end,
  function(msg)
    print("Hello received from " .. msg.From)
    Send({Target = msg.From, Data = "Hello back!"})
  end
)
```

**Structure:**

- **Name**: Identifier for the handler ("hello")
- **Pattern**: Function that determines if handler should run
- **Handler**: Function that executes when pattern matches

**State:**

Global state accessible across all handlers:

```lua
State = State or {}
State.Counter = State.Counter or 0

Handlers.add(
  "increment",
  Handlers.utils.hasMatchingTag("Action", "Increment"),
  function(msg)
    State.Counter = State.Counter + 1
    print("Counter: " .. State.Counter)
  end
)
```

**Send:**

Send messages to other processes:

```lua
Send({
  Target = "process-id",
  Action = "Transfer",
  Recipient = "recipient-address",
  Quantity = "1000"
})
```

**Receive:**

Wait for incoming messages (useful in prompts):

```lua
Send({Target = "process-id", Action = "Info"})
local response = Receive()
print(response.Data)
```

#### Common AOS Commands

**State Management:**

```lua
-- View all state
return State

-- Access specific variable
return State.Balance

-- Modify state
State.Name = "My Process"
```

**Handler Management:**

```lua
-- List all handlers
Handlers.list

-- Remove handler
Handlers.remove("handler-name")

-- Check handler order
Handlers.show("handler-name")
```

**Message Operations:**

```lua
-- Send message
Send({Target = "process-id", Data = "Hello"})

-- Send to multiple targets
for _, target in ipairs(targets) do
  Send({Target = target, Data = "Broadcast"})
end
```

**Utility Functions:**

```lua
-- JSON encoding/decoding
local json = require("json")
local encoded = json.encode({key = "value"})
local decoded = json.decode('{"key":"value"}')

-- Table utilities
local utils = require(".utils")
utils.includes({"a", "b", "c"}, "b") -- true
```

#### OnBoot Handler

OnBoot is special code that runs when a process initializes:

```lua
-- Initialize state
State = State or {}
State.Balance = State.Balance or 0
State.Holders = State.Holders or {}

-- Set up default handlers
Handlers.add(
  "info",
  Handlers.utils.hasMatchingTag("Action", "Info"),
  function(msg)
    Send({
      Target = msg.From,
      Data = json.encode({
        Name = State.Name,
        Balance = State.Balance
      })
    })
  end
)

-- Configuration
Config = {
  MaxTransfer = 1000000000000,
  MinTransfer = 1
}
```

**OnBoot Characteristics:**

- Runs once when process is created
- Sets up initial state and handlers
- Cannot be changed after process creation
- Visible in process Source tab

#### Standard Handler Patterns

**Simple Action Handler:**

```lua
Handlers.add(
  "balance",
  Handlers.utils.hasMatchingTag("Action", "Balance"),
  function(msg)
    local target = msg.Tags.Target or msg.From
    local balance = State.Balances[target] or 0
    Send({Target = msg.From, Data = tostring(balance)})
  end
)
```

**Transfer Handler:**

```lua
Handlers.add(
  "transfer",
  Handlers.utils.hasMatchingTag("Action", "Transfer"),
  function(msg)
    local quantity = tonumber(msg.Tags.Quantity)
    local recipient = msg.Tags.Recipient

    -- Validate
    assert(quantity > 0, "Quantity must be positive")
    assert(recipient, "Recipient required")

    -- Update balances
    State.Balances[msg.From] = State.Balances[msg.From] - quantity
    State.Balances[recipient] = (State.Balances[recipient] or 0) + quantity

    -- Send notices
    Send({Target = msg.From, Action = "Debit-Notice", Quantity = quantity})
    Send({Target = recipient, Action = "Credit-Notice", Quantity = quantity})
  end
)
```

**Info Handler:**

```lua
Handlers.add(
  "info",
  Handlers.utils.hasMatchingTag("Action", "Info"),
  function(msg)
    Send({
      Target = msg.From,
      Data = json.encode({
        Name = State.Name,
        Ticker = State.Ticker,
        TotalSupply = State.TotalSupply,
        Logo = State.Logo
      })
    })
  end
)
```

#### Using the AOS Console in Lunar

**Accessing the Console:**

1. Navigate to **Console** view from sidebar
2. Enter existing process ID or create new process
3. Wallet connection required for owned processes
4. Console loads with process information

**Console Features:**

**Command Execution:**

- Type Lua commands at the prompt
- Press Enter to execute
- View output immediately
- Errors shown in red

**Command History:**

- Arrow Up: Previous command
- Arrow Down: Next command
- Persists during session
- Navigate through history easily

**Multi-line Input:**

- Type complete code blocks
- Console detects incomplete statements
- Supports function definitions
- Indentation preserved

**Editor Mode:**

- Toggle between console and editor
- Write longer scripts
- Syntax highlighting
- Execute entire script

**Output Display:**

- Print statements shown in real-time
- Return values displayed
- Errors highlighted
- ANSI color support

#### Best Practices

**Development Workflow:**

1. **Create Process**: Start with new AOS process
2. **Define State**: Set up initial state structure
3. **Add Handlers**: Create handlers one at a time
4. **Test**: Use console to test each handler
5. **Iterate**: Refine based on testing
6. **Document**: Add comments and descriptions

**Handler Design:**

- **Single Responsibility**: Each handler does one thing well
- **Validation**: Check inputs before processing
- **Error Handling**: Use assert for requirements
- **Responses**: Always send response to message sender
- **Logging**: Use print for debugging

**State Management:**

- **Initialize**: Always use `State = State or {}`
- **Defaults**: Provide sensible default values
- **Consistency**: Keep state structure predictable
- **Cleanup**: Remove unused state data
- **Documentation**: Comment complex state structures

**Security:**

- **Validate Inputs**: Never trust message data blindly
- **Check Permissions**: Verify sender authorization
- **Limit Actions**: Restrict dangerous operations
- **Bounds Checking**: Prevent overflow/underflow
- **Rate Limiting**: Guard against spam

#### Common Patterns

**Token Balance System:**

```lua
State.Balances = State.Balances or {}

-- Balance check
Handlers.add(
  "balance",
  Handlers.utils.hasMatchingTag("Action", "Balance"),
  function(msg)
    local target = msg.Tags.Target or msg.From
    local balance = State.Balances[target] or 0
    Send({Target = msg.From, Data = tostring(balance)})
  end
)

-- Transfer
Handlers.add(
  "transfer",
  Handlers.utils.hasMatchingTag("Action", "Transfer"),
  function(msg)
    local qty = tonumber(msg.Tags.Quantity)
    local recipient = msg.Tags.Recipient

    local senderBalance = State.Balances[msg.From] or 0
    assert(senderBalance >= qty, "Insufficient balance")

    State.Balances[msg.From] = senderBalance - qty
    State.Balances[recipient] = (State.Balances[recipient] or 0) + qty
  end
)
```

**Permission System:**

```lua
State.Owner = State.Owner or msg.Owner
State.Admins = State.Admins or {}

-- Admin check helper
function isAdmin(address)
  return address == State.Owner or State.Admins[address]
end

-- Protected action
Handlers.add(
  "admin-action",
  Handlers.utils.hasMatchingTag("Action", "AdminAction"),
  function(msg)
    assert(isAdmin(msg.From), "Unauthorized")
    -- Perform admin action
  end
)
```

**Data Storage:**

```lua
State.Data = State.Data or {}

-- Store data
Handlers.add(
  "store",
  Handlers.utils.hasMatchingTag("Action", "Store"),
  function(msg)
    local key = msg.Tags.Key
    assert(key, "Key required")
    State.Data[key] = msg.Data
    Send({Target = msg.From, Data = "Stored"})
  end
)

-- Retrieve data
Handlers.add(
  "retrieve",
  Handlers.utils.hasMatchingTag("Action", "Retrieve"),
  function(msg)
    local key = msg.Tags.Key
    local value = State.Data[key] or ""
    Send({Target = msg.From, Data = value})
  end
)
```

#### Debugging Tips

**Print Statements:**

```lua
print("Debug: msg.From = " .. msg.From)
print("Balance: " .. tostring(State.Balance))
```

**Inspect Tables:**

```lua
for key, value in pairs(State) do
  print(key .. " = " .. tostring(value))
end
```

**Error Handling:**

```lua
local success, error = pcall(function()
  -- Code that might error
end)

if not success then
  print("Error: " .. error)
end
```

**Handler Testing:**

```lua
-- Trigger handler manually
Handlers.evaluate({
  From = "test-address",
  Action = "Test",
  Tags = {Key = "Value"}
})
```

#### Advanced Features

**Cron Handlers:**

```lua
Handlers.add(
  "cron-tick",
  Handlers.utils.hasMatchingTag("Action", "Cron"),
  function(msg)
    -- Run periodic task
    State.LastTick = msg.Timestamp
  end
)
```

**Process Spawning:**

```lua
Spawn("module-id", {
  Tags = {
    Name = "Child Process",
    Parent = ao.id
  }
})
```

**Message Batching:**

```lua
local messages = {}
for i = 1, 10 do
  table.insert(messages, {
    Target = "process-id",
    Action = "Update",
    Value = tostring(i)
  })
end

for _, msg in ipairs(messages) do
  Send(msg)
end
```

Remember: AOS is the most powerful tool for building on AO. Master these concepts to create sophisticated processes and applications on the decentralized network.

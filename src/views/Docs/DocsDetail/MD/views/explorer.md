# Explorer

The Explorer is Lunar's most comprehensive view, providing deep inspection and interaction capabilities for processes, messages, and wallets on the AO network. It features a multi-tab interface that lets you explore multiple transactions simultaneously.

#### Overview

The Explorer allows you to:

- **Search** any transaction by its 43-character ID
- **Inspect** processes, messages, and wallets in detail
- **Read** process state without sending transactions
- **Write** messages to processes (requires wallet)
- **Filter** and analyze message flows
- **Navigate** between related transactions seamlessly

#### Getting Started

**Opening the Explorer:**

1. Click **Explorer** in the sidebar navigation
2. A blank tab opens automatically
3. Enter a transaction ID in the search field
4. Press Enter or click the search icon

**Transaction ID Format:**

- 43 characters (Arweave transaction ID)
- Alphanumeric with dashes and underscores
- Example: `process-id-would-be-43-characters-long-here`

**Auto-Detection:**

Lunar automatically detects the transaction type:

- **Process**: Shows process inspection tabs
- **Message**: Shows message details
- **Wallet**: Shows wallet balances and messages

#### Tab Management

**Multiple Tabs:**

- Open multiple transactions simultaneously
- Click **+** button to add new tab
- Click **X** on tab to close it
- Drag tabs to reorder (where supported)

**Tab Features:**

- Persistent across sessions (stored in localStorage)
- Auto-named based on transaction
- Color-coded by type
- Fullscreen mode per tab

**Tab Actions:**

- **Clear All**: Remove all tabs at once
- **Refresh**: Reload current transaction data
- **Fullscreen**: Expand tab to full window
- **Copy ID**: Copy transaction ID to clipboard

#### Process Inspection

When viewing a process, you get multiple specialized tabs:

#### Overview Tab

Displays comprehensive process information:

**Process Metadata:**

- Transaction ID (clickable, copyable)
- Owner address
- Creation timestamp
- Network variant (Mainnet/Legacynet)

**Components:**

- **Module**: Process behavior definition
- **Scheduler**: Message coordination service
- **Authority**: Operation validation service
- Each component displays its transaction ID

**Process Tags:**

- All tags displayed in expandable list
- Standard tags (Data-Protocol, Type, Variant)
- Custom tags (Name, Description, etc.)
- Click to copy tag values

**Process State:**

- Read current state with ProcessRead component
- Shows return value of state queries
- No wallet required
- Formatted output

#### Messages Tab

View and filter all process messages:

**Message List:**

- Incoming messages (to this process)
- Outgoing messages (from this process)
- Chronological ordering
- Pagination support

**Filtering Options:**

**By Action:**

- Select from standard actions (Eval, Transfer, Balance, etc.)
- Add custom actions
- Multiple action selection
- Action color coding

**By Participant:**

- **Recipient**: Filter messages to specific address
- **Sender**: Filter messages from specific address
- Support for both wallet and process addresses

**By Date:**

- Start date: Show messages after this date
- End date: Show messages before this date
- Calendar picker interface
- Combine with other filters

**Results Per Page:**

- Configure pagination (10, 25, 50, 100)
- Preference persists per process
- Navigate with Previous/Next buttons

**Message Display:**

- Message ID (clickable to inspect)
- From/To addresses (clickable to navigate)
- Action label (color-coded)
- Timestamp or relative time
- Click to expand full details

#### Read Tab

Execute read-only operations on the process:

**Purpose:**

- Query process state without transactions
- Test process responses
- No wallet required
- No fees

**Features:**

**Code Editor:**

- Monaco editor with Lua syntax highlighting
- Multi-line code support
- Syntax checking
- Auto-completion

**Action Field:**

- Specify message action (default: Eval)
- Required for proper handling
- Suggestions for common actions

**Additional Tags:**

- Add custom tags to message
- Key-value pairs
- Support process-specific parameters

**Execute Button:**

- Send read message
- Wait for response
- Display result
- Error handling

**Result Display:**

- Formatted JSON output
- Syntax highlighting
- Collapsible sections
- Copy result option

**Common Read Operations:**

```lua
-- View full state
return State

-- Check specific variable
return State.Balance

-- Query balances
return State.Balances

-- Get process info
return {
  Name = State.Name,
  Version = State.Version
}
```

#### Write Tab

Send state-changing messages to the process:

**Requirements:**

- Connected wallet
- Sufficient AR balance for fees
- Proper action and parameters

**Features:**

**Code Editor:**

- Same as Read tab
- Write Lua code or data
- Syntax highlighting
- Multi-line support

**Action Field:**

- Specify action (Transfer, Mint, etc.)
- Must match process handlers
- Case-sensitive

**Additional Tags:**

- Required for many actions
- Example: Recipient, Quantity for Transfer
- Process-specific tags

**Send Button:**

- Signs transaction with wallet
- Submits to network
- Waits for confirmation
- Shows result

**Result Display:**

- Transaction ID
- Process response
- Resulting messages
- Error messages if failed

**Common Write Operations:**

```lua
-- Simple eval
State.Counter = (State.Counter or 0) + 1
return State.Counter
```

For **Transfer**, use tags:

- Action: `Transfer`
- Recipient: `wallet-address`
- Quantity: `1000000000000`

**Best Practices:**

- Always read state first
- Verify action spelling
- Include all required tags
- Test with small amounts
- Check balance before large transfers

#### Data Tab

View raw process data:

**Content Types:**

**JSON:**

- Formatted and syntax highlighted
- Collapsible tree view
- Copy entire structure
- Download as file

**Lua:**

- Syntax highlighting
- View source code
- Copy code blocks
- Export to file

**HTML:**

- Rendered preview
- View source option
- Responsive display
- Full HTML support

**Images:**

- Display embedded images
- PNG, JPG, SVG support
- Zoom and download
- Metadata display

**Text:**

- Plain text display
- Markdown rendering
- Copy content
- Search within text

#### Source Tab

Inspect process source code:

**OnBoot Handler:**

- Initialization code
- Handler definitions
- State setup
- Configuration

**Display Features:**

- Syntax highlighting for Lua
- Line numbers
- Copy code option
- Search within code
- Collapsible sections

**Understanding Source:**

- See available handlers
- Understand actions
- Find required parameters
- Learn process behavior

#### AOS Tab

Interactive console for process owners:

**Requirements:**

- Must be process owner
- Wallet must be connected
- Owner address must match process owner

**Features:**

- Interactive Lua terminal
- Real-time command execution
- Output streaming
- Command history
- ANSI color support

**See Also:**

For detailed AOS usage, see the [Console documentation](../views/console.md) and [AOS concepts](../concepts/aos.md).

#### Message Inspection

When viewing a message (not a process), you see:

**Message Info:**

- Message ID
- From address (clickable)
- To address (clickable)
- Owner address
- Action label
- Timestamp
- Block height

**Message Input:**

- Original message data
- Lua code for Eval messages
- JSON for structured data
- Plain text display
- Copy input content

**Message Output:**

- Process response
- Return values
- Error messages
- Formatted display
- Copy output content

**Resulting Messages:**

- Messages spawned by this message
- Debit/Credit notices from transfers
- Process-to-process messages
- Expandable tree view
- Click to inspect each result

#### Wallet Inspection

When viewing a wallet address, you see:

**Balance Display:**

- **AO Token**: Balance in AO
- **PI Token**: Balance in PI
- **AR Balance**: Arweave balance
- Refresh buttons for each
- Formatted with proper decimals

**Message History:**

- All messages involving this wallet
- Incoming and outgoing
- Filter by action, date, etc.
- Same filtering as process messages

**Transaction List:**

- Transfers sent and received
- Token purchases
- Process interactions
- Complete history

#### Best Practices

**Efficient Exploration:**

- Open related processes in separate tabs
- Use filters to focus on specific messages
- Read before writing to understand state
- Copy transaction IDs for reference
- Fullscreen for detailed analysis

**Safety Tips:**

- Verify process owner before trusting
- Check process source for malicious code
- Start with Read tab to test queries
- Use small amounts for test transfers
- Double-check recipient addresses

**Performance:**

- Close unused tabs
- Limit results per page for faster loading
- Use date filters for large message sets
- Clear all tabs periodically
- Refresh data when needed

**Navigation:**

- Click addresses to navigate to them
- Use browser back/forward buttons
- Open links in new tabs (Ctrl/Cmd+Click)
- Bookmark important processes
- Copy IDs for later reference

#### Common Workflows

**Investigating a Token:**

1. Search for token process ID
2. Check Overview for metadata
3. View Messages tab to see transfers
4. Use Read tab to check your balance
5. Source tab to understand token logic

**Debugging a Process:**

1. Open process in Explorer
2. Check recent messages for errors
3. Use Read tab to query state
4. View Source to understand handlers
5. AOS tab for interactive debugging (if owner)

**Tracking a Transfer:**

1. Find transfer message ID
2. View message details
3. Check resulting messages for Debit/Credit notices
4. Navigate to sender/recipient
5. Verify balances updated

**Analyzing Network Activity:**

1. Open multiple related processes
2. Filter messages by date range
3. Track message flow between processes
4. Export data for further analysis
5. Monitor for patterns

Remember: The Explorer is your window into the AO network. Master its features to effectively inspect, analyze, and interact with decentralized processes and messages.

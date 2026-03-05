# Processes

Processes are the fundamental building blocks of the AO network. They are autonomous actors that maintain state, execute code, and communicate through messages. Think of processes as decentralized programs that run permanently on the Arweave blockchain.

#### What is a Process?

A process in AO is similar to a smart contract, but with key differences:

- **Permanent State**: Process state is stored on Arweave forever
- **Lua Execution**: Processes run Lua code via the AOS environment
- **Message-Driven**: Processes respond to incoming messages
- **Autonomous**: Processes can initiate actions independently
- **Owned**: Each process has an owner who controls it

#### Process Components

Every process consists of several key components:

**Module:**

- Defines the process behavior and capabilities
- Contains the core execution logic
- Determines what handlers are available
- Immutable once set

**Scheduler:**

- Coordinates message delivery to the process
- Ensures message ordering and execution
- Manages process lifecycle
- Examples: `n_XZJhUnmldNFo4dhajoPZWhBXuJk-OcQr5JQ49c4Zo`

**Authority:**

- Validates and signs process operations
- Ensures security and authenticity
- Controls write permissions
- Examples: `YUsEnCSlxvOMxRd1qG6rkaPwMgi3xOorfDfYJoMDndA`

**Owner:**

- Arweave wallet that created the process
- Has special permissions and access
- Can modify process configuration
- Receives process notifications

#### Process Lifecycle

**Creation:**

1. User sends a spawn message with module and scheduler
2. Network validates the spawn request
3. Process is assigned a unique transaction ID
4. Initial state is created on Arweave
5. Process begins accepting messages

**Execution:**

1. Process receives incoming message
2. Scheduler orders and validates messages
3. Module executes handler for message action
4. Process updates internal state
5. Process may send outgoing messages

**Inspection:**

- Anyone can read process state (no wallet required)
- Anyone can view process messages and history
- Anyone can query process data via GraphQL
- Only owner can write without restrictions

#### Process State

Processes maintain internal state that persists across message executions:

**State Components:**

- **Variables**: Data stored by the process (balances, config, etc.)
- **Handlers**: Functions that respond to message actions
- **OnBoot**: Initialization code run when process starts
- **Memory**: Accumulated data from all messages

**Reading State:**

- Use the Explorer's **Read** tab
- Send Eval action: `return State`
- Query specific variables: `return Balance`
- No wallet or transaction required

**Modifying State:**

- Use the Explorer's **Write** tab
- Send message with specific action
- Requires connected wallet
- Transaction fees apply

#### Common Process Types

**Token Processes:**

- Manage fungible token balances
- Support Transfer, Balance, Mint actions
- Track holders and supply
- Examples: AO token, PI token

**Data Storage:**

- Store arbitrary data on-chain
- Provide retrieval handlers
- Version control and updates
- Content addressing

**Application Logic:**

- Implement business rules
- Coordinate multiple processes
- Handle complex workflows
- User interactions

**Registries:**

- Track collections of items
- Provide lookup services
- Maintain directories
- Name services

#### Process Tags

Processes include tags that provide metadata:

**Standard Tags:**

- `Data-Protocol`: "ao" - identifies AO processes
- `Type`: "Process" - distinguishes from messages
- `Variant`: Network variant (ao.N.1, ao.TN.1)
- `Module`: Module transaction ID
- `Scheduler`: Scheduler address
- `OnBoot`: OnBoot handler transaction ID

**Custom Tags:**

- `Name`: Human-readable process name
- `Description`: Process purpose
- `Version`: Process version number
- Application-specific tags

#### Inspecting Processes in Lunar

**Overview Tab:**

- View all process tags and metadata
- See module, scheduler, and authority
- Check owner and creation date
- Read current process state

**Messages Tab:**

- View all incoming and outgoing messages
- Filter by action, sender, recipient, date
- Inspect message inputs and outputs
- Track message flow

**Read Tab:**

- Execute read-only operations
- Query process state
- Test handlers without transactions
- No wallet required

**Write Tab:**

- Send messages to modify state
- Execute state-changing actions
- Requires wallet connection
- Transaction fees apply

**Data Tab:**

- View raw process data
- Support for multiple formats (JSON, Lua, HTML, images)
- Download data locally
- Inspect content type

**Source Tab:**

- View process source code
- See OnBoot initialization
- Understand handlers
- Copy code for reference

**AOS Tab** (owners only):

- Interactive Lua console
- Direct process communication
- Real-time execution
- Full control access

#### Best Practices

**When Reading Processes:**

- Use the Read tab for queries to avoid transaction fees
- Check process state before writing
- Verify process owner and tags
- Review recent messages for activity

**When Writing to Processes:**

- Always read state first to understand current values
- Check required action format in process source
- Verify you have sufficient balance for transactions
- Test with small amounts first

**When Creating Processes:**

- Choose appropriate module for your needs
- Use standard scheduler unless specific requirements
- Set clear name and description tags
- Document your process handlers

**Security Considerations:**

- Verify process owner before trusting
- Check process source code for malicious behavior
- Review message history for suspicious activity
- Be cautious with unknown processes

#### Common Actions

**Eval:**

- Execute Lua code on the process
- Return values from process state
- Used for queries and calculations
- Example: `return Balance`

**Info:**

- Request process information
- Returns process metadata
- Often includes name, version, description

**Balance:**

- Query token balance
- For specific address or total supply
- Returns numeric value

**Transfer:**

- Send tokens to another address
- Requires Recipient and Quantity
- Updates sender and recipient balances

**Custom Actions:**

- Defined by process module
- Specific to process functionality
- Check source code for available actions
- May require specific parameters

Remember: Processes are the core of the AO network. Understanding how they work, how to inspect them, and how to interact with them safely is essential for using Lunar effectively.

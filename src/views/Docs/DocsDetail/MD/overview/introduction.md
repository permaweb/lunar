# Welcome to Lunar

Lunar is a decentralized explorer application that provides a comprehensive interface for discovering, inspecting, and interacting with messages and processes across the [AO network](https://ao.arweave.net). Built on [Arweave](https://arweave.org), Lunar improves traceability for users and provides essential developer utilities for building permaweb applications.

#### What Makes Lunar Unique

**Network Transparency:**

- Real-time visibility into AO network activity
- Comprehensive process and message inspection
- Network metrics and health monitoring
- Support for both Mainnet and Legacynet

**Developer Tools:**

- Interactive AOS console for Lua development
- GraphQL playground for querying network data
- Process state inspection and modification
- Message filtering and analysis

**Decentralized Benefits:**

- Direct interaction with AO network nodes
- No intermediary services required
- Open-source and transparent operation
- Permanent data storage on Arweave

#### Key Features

This documentation will guide you through every aspect of Lunar. You'll learn how to:

**Network Exploration:**

- View network metrics and health status
- Monitor message flow across processes
- Track token transfers and balances
- Analyze network activity trends

**Process Interaction:**

- Inspect process state and metadata
- Read process data without transactions
- Write messages to modify process state
- View process source code and handlers

**AOS Development:**

- Access interactive Lua console
- Create and manage AOS processes
- Execute commands and scripts
- Stream real-time output

**Data Querying:**

- Use GraphQL to query network data
- Filter transactions by tags and owners
- Build custom queries for specific data
- Export results for analysis

**Wallet Integration:**

- Connect Arweave wallets
- View token balances (AO, PI, AR)
- Sign and send transactions
- Monitor wallet activity

#### Getting Started

**First Steps:**

1. **Explore the Landing Page**: View network metrics and health status for AO Mainnet and Legacynet
2. **Connect Your Wallet**: Use ArConnect, Othent, or Wander to enable write operations
3. **Open the Explorer**: Search for any process, message, or wallet by transaction ID
4. **Try the Console**: Create or connect to an AOS process for interactive development
5. **Query with GraphQL**: Use the playground to explore network data

#### Understanding Lunar's Views

Lunar is organized into five main views, accessible from the sidebar navigation:

**Landing:**

- Network overview dashboard
- Mainnet and Legacynet metrics
- Node connection status and health
- Recent network messages
- Available AO nodes list

**Explorer:**

- Multi-tab interface for browsing transactions
- Process inspection (info, messages, read, write, data, source, AOS)
- Message inspection (sender, recipient, action, data, results)
- Wallet inspection (balances, transaction history)
- Advanced message filtering

**Console:**

- Interactive AOS terminal
- Process creation and management
- Lua script execution
- Code editor mode
- Command history and auto-completion

**GraphQL:**

- Interactive query playground
- Multiple gateway support
- Query and variables editors
- Response visualization
- Multi-tab workspace

**Docs:**

- In-app documentation (you are here!)
- Feature guides and tutorials
- Concept explanations
- Best practices and tips

#### Understanding the AO Network

**What is AO?**

AO (Actor Oriented computer) is a decentralized computing network built on Arweave. It enables:

- **Processes**: Autonomous actors that store state and execute code
- **Messages**: Communication between processes and users
- **Permanent Storage**: All data stored immutably on Arweave
- **Lua Execution**: Processes run Lua code via the AOS environment

**Network Variants:**

- **Mainnet (ao.N.1)**: Production network for live applications
- **Legacynet (ao.TN.1)**: Legacy test network for historical data

**Key Components:**

- **Nodes**: Servers that execute process logic and route messages
- **Schedulers**: Coordinate message delivery and process execution
- **Modules**: Define process behavior and capabilities
- **Gateways**: Provide GraphQL interfaces for querying data

#### Wallet Requirements

Some Lunar features require an Arweave wallet:

**Wallet-Required Features:**

- Writing messages to processes
- Creating new AOS processes
- Sending transactions
- Process ownership verification

**Wallet-Free Features:**

- Viewing network metrics
- Reading process state
- Inspecting messages
- GraphQL queries
- Most explorer functionality

**Supported Wallets:**

- ArConnect (browser extension)
- Othent (email-based)
- Wander (mobile app)

#### Navigation Tips

- **Sidebar**: Click the menu icon to toggle the navigation sidebar
- **Tabs**: Explorer, Console, and GraphQL support multiple tabs
- **Search**: Use the explorer search to find any transaction by ID
- **Shortcuts**: Many views support keyboard shortcuts
- **Fullscreen**: Most views can expand to fullscreen mode
- **Settings**: Access network and node configuration via settings panel

This documentation will walk through each component of Lunar to ensure you have all the information needed to explore and build on the AO network. Whether you're a developer building applications, a researcher analyzing network activity, or a user exploring decentralized processes, Lunar provides the tools you need.

# Introduction

Lunar is an interface for exploring and interacting with AO processes, messages and entities.

It centers on entities and relationships you can inspect directly: processes, messages, wallets, and transaction-linked data. In practice, Lunar is useful when you need to move from an ID to context: what this entity is, what it is connected to, and what happened around it.

#### What Lunar Is

Lunar provides:

- Explorer-based inspection of process, message, and wallet records
- Read and write surfaces for process interaction
- Console access for interactive AOS workflows
- GraphQL querying for broader AO/Arweave data retrieval

#### Exploring AO

AO is a decentralized hyperparallel computer built around message flow and process execution. The core framing from the [cookbook](https://cookbook_ao.arweave.net) is:

> "The `ao` computer takes messages and sends them to Processes in which those Processes can output messages that can be sent to other Processes. The result is a complex system built on simple modular logic containers."

AO is built on a few fundamental principles that form its foundation:

- **Two core types**: Messages and Processes - the basic building blocks of the AO ecosystem
- **No shared state, only Holographic State** - a unique approach to distributed computing
- **Decentralized Computer** - enabling truly distributed applications

That maps directly to Lunar's data model. Most screens in Lunar are effectively different ways to inspect either a process, a message, or the relationships between them.

In Lunar, what you see in Explorer and GraphQL is not static data; it is a permanent log of message-driven computation over time.

#### Main Views

- **Explorer**: inspect process, message, and wallet data, including linked history
- **Console**: interactive AOS terminal and process session management
- **GraphQL**: query editor and response viewer for AO/Arweave gateways

#### What You Can Inspect in Lunar

- Process metadata, source, message history, read/write interfaces
- Message input, tags, output, and resulting messages
- Wallet balances and observed transaction participation
- Network-oriented data through configured GraphQL gateways

**Processes**

![](intro-process.png)

> Processes possess the capability to engage in communication via message passing, both receiving and dispatching messages within the network. Additionally, they hold the potential to instantiate further processes, enhancing the network's computational fabric. This dynamic method of data dissemination and interaction within the network is referred to as a 'holographic state', underpinning the shared and persistent state of the network.

**Messages**

![](intro-message.png)

> In ao, every process runs in parallel, creating a highly scalable environment. Traditional direct function calls between processes aren't feasible because each process operates independently and asynchronously. Messaging addresses this by enabling asynchronous communication. Processes send and receive messages rather than directly invoking functions on each other. This method allows for flexible and efficient interaction, where processes can respond to messages, enhancing the system's scalability and responsiveness.

#### Related AO Reading

For protocol-level details, these AO cookbook sections are the relevant companions to Lunar docs:

- Concepts index: [https://cookbook_ao.arweave.net/concepts/index.html](https://cookbook_ao.arweave.net/concepts/index.html)
- How messaging works: [https://cookbook_ao.arweave.net/concepts/how-it-works.html](https://cookbook_ao.arweave.net/concepts/how-it-works.html)
- Processes: [https://cookbook_ao.arweave.net/concepts/processes.html](https://cookbook_ao.arweave.net/concepts/processes.html)
- Messages: [https://cookbook_ao.arweave.net/concepts/messages.html](https://cookbook_ao.arweave.net/concepts/messages.html)

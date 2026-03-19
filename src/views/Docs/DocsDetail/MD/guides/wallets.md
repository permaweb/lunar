# Wallet Integration

Wallets are essential for interacting with the AO network through Lunar. They enable you to sign transactions, create processes, send messages, and prove ownership. This guide covers everything you need to know about using wallets with Lunar.

#### Supported Wallet

**Wander**

- Browser extension wallet for Chrome, Firefox, Brave
- iOS and Android support
- Most popular Arweave wallet
- Local key storage
- Download: [wander.app](https://wander.app)

#### Connecting Your Wallet

1. Install Wander browser extension
2. Create or import wallet
3. Click **Connect Wallet** in Lunar
4. Select **Wander**
5. Approve connection in popup
6. Wallet address appears in header

#### Wallet-Required Features

Some Lunar features require a connected wallet:

**Writing to Processes:**

- Send messages that modify state
- Execute Write operations in Explorer
- Requires AR balance for transaction fees
- Wallet signs each transaction

**Creating Processes:**

- Spawn new AOS processes
- Requires AR balance
- You become the process owner
- Only owners can access AOS console

**AOS Console Access:**

- Interactive terminal requires ownership
- Must own process to connect
- Wallet verifies ownership
- Full control over process

**Token Transfers:**

- Send AO, PI, or other tokens
- Sign transfer transactions
- Specify recipient and amount
- Pay network fees

#### Wallet Permissions

When connecting, Lunar requests these permissions:

**Basic Permissions:**

- **ADDRESS**: View your wallet address
- **SIGN_TRANSACTION**: Sign transactions
- **DISPATCH**: Submit transactions to network

**What Lunar Can Do:**

- View your address
- Request transaction signatures
- Submit signed transactions
- Check AR balance

**What Lunar Cannot Do:**

- Access your private keys
- Sign transactions without approval
- Transfer funds without consent
- Modify wallet settings

**Using Lunar Safely:**

- Verify you're on the correct Lunar URL
- Don't connect wallet to untrusted processes
- Review process source before writing
- Start with small test amounts
- Disconnect wallet when not in use

#### Viewing Balances

Lunar displays multiple token balances:

**AR Balance:**

- Native Arweave token
- Used for transaction fees
- Displayed in AR (not winston)
- Required for network operations

**AO Balance:**

- AO network token
- Displayed with 12 decimal places
- Used for AO ecosystem transactions
- Check in wallet view or process inspector

**PI Balance:**

- Process Intelligence token
- Displayed with 12 decimal places
- Part of AO ecosystem
- Check in wallet view

**Refreshing Balances:**

- Click refresh icon next to balance
- Updates from network
- May take a few seconds
- Shows latest confirmed amount

#### Transaction Signing

**How Signing Works:**

1. You initiate action requiring transaction
2. Lunar prepares transaction data
3. Wallet popup shows transaction details
4. You review and approve/reject
5. Wallet signs with private key
6. Lunar submits to network
7. Confirmation displayed

**What to Review:**

**Process Write:**

- Target process ID
- Action being performed
- Data being sent
- Tags being included

**Token Transfer:**

- Recipient address
- Token amount
- Token type
- Transaction fee

**Process Creation:**

- Module being used
- Scheduler selection
- Initial tags
- Creation fee

**Transaction Fees:**

- All transactions cost AR
- Fee depends on data size
- Shown before signing
- Deducted from AR balance
- Non-refundable once submitted

#### Wallet View Features

**Viewing Your Wallet:**

1. Connect wallet
2. Open Explorer
3. Enter your wallet address
4. View comprehensive wallet info

**Wallet Information:**

**Balances:**

- AR balance from Arweave
- AO token balance
- PI token balance
- Refresh each independently

**Transaction History:**

- All incoming messages
- All outgoing messages
- Filter by action type
- Filter by date range
- Pagination support

**Process Ownership:**

- View processes you own
- Access via Console
- Check process status
- Monitor process activity

#### Disconnecting Wallet

**Manual Disconnect:**

1. Click wallet address in header
2. Select **Disconnect** option
3. Wallet connection removed
4. Wallet-required features disabled

#### Common Issues

**Connection Failed:**

- Ensure wallet extension is installed
- Check wallet is unlocked
- Try refreshing page
- Clear browser cache
- Check for extension updates

**Transaction Rejected:**

- Review transaction details carefully
- Ensure sufficient AR balance
- Check wallet didn't auto-lock
- Verify process permissions
- Try transaction again

**Insufficient Balance:**

- Need AR for transaction fees
- Get AR from exchange
- Or use faucet for testing
- Check actual balance in wallet
- Wait for pending deposits

**Wrong Network:**

- Wander supports mainnet only
- Ensure wallet is on correct network
- Check Lunar network setting
- Processes must match network

**Signature Errors:**

- Wallet may have locked
- Unlock and try again
- Check wallet connection
- Reconnect if needed
- Verify wallet permissions

#### Getting AR Tokens

**For Production (Mainnet):**

- Purchase from cryptocurrency exchange
- Transfer to your wallet
- Ensure sufficient balance for fees

**How Much AR Needed:**

- Typical transaction: 0.0001-0.001 AR
- Depends on data size
- Keep small balance for regular use

#### Advanced Wallet Features

**Custom Wallet Integration:**

For developers wanting to integrate other wallets, Lunar uses standard Arweave wallet APIs:

- `arweaveWallet.connect(permissions)`
- `arweaveWallet.disconnect()`
- `arweaveWallet.getActiveAddress()`
- `arweaveWallet.sign(transaction)`
- `arweaveWallet.dispatch(transaction)`

**Wallet Events:**

Lunar listens for wallet events:

- Account changes
- Connection status
- Network switches
- Permission updates

**Programmatic Usage:**

Via AOS console, you can:

```lua
-- Your address automatically available
print(ao.id) -- Process ID
print(Owner) -- Owner address

-- Sign and send messages
Send({
  Target = "process-id",
  Action = "Transfer",
  Recipient = "recipient-address",
  Quantity = "1000"
})
```

#### Getting Help with Wander wallet

- [Wander knowledge base](https://www.wander.app/help)
- [Wander Discord community](https://discord.com/invite/YGXJbuz44K)

Remember: Your wallet is your identity on the AO network. Protect it carefully, verify all transactions, and never share private keys. With proper wallet security, you can safely build and interact with decentralized processes on AO.

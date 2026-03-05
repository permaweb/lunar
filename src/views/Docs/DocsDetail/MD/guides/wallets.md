# Wallet Integration

Wallets are essential for interacting with the AO network through Lunar. They enable you to sign transactions, create processes, send messages, and prove ownership. This guide covers everything you need to know about using wallets with Lunar.

#### Supported Wallets

Lunar supports three wallet types:

**ArConnect:**

- Browser extension wallet for Chrome, Firefox, Brave
- Most popular Arweave wallet
- Full feature support
- Local key storage
- Download: [arconnect.io](https://arconnect.io)

**Othent:**

- Email-based authentication
- No extension required
- Lower barrier to entry
- Managed key service
- Website: [othent.io](https://othent.io)

**Wander:**

- Mobile wallet app
- iOS and Android support
- QR code connection
- Mobile-first experience
- Download from app stores

#### Connecting Your Wallet

**ArConnect:**

1. Install ArConnect browser extension
2. Create or import wallet
3. Click **Connect Wallet** in Lunar
4. Select **ArConnect**
5. Approve connection in popup
6. Wallet address appears in header

**Othent:**

1. Click **Connect Wallet** in Lunar
2. Select **Othent**
3. Enter email address
4. Check email for verification code
5. Enter code to complete connection
6. Wallet address appears in header

**Wander:**

1. Install Wander app on mobile device
2. Create or import wallet
3. Click **Connect Wallet** in Lunar
4. Select **Wander**
5. Scan QR code with app
6. Approve connection
7. Wallet address appears in header

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

#### Security Best Practices

**Wallet Security:**

- Never share private keys or seed phrases
- Use strong passwords
- Enable 2FA where available
- Keep wallet software updated
- Backup seed phrases securely

**Transaction Verification:**

- Always review transaction details before signing
- Verify recipient addresses
- Check transaction amounts
- Understand what you're signing
- Cancel suspicious requests

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

#### Managing Multiple Wallets

**Switching Wallets:**

ArConnect:

1. Click wallet address in Lunar header
2. Select **Switch Account** in ArConnect
3. Choose different account
4. Lunar updates automatically

Othent:

1. Disconnect current wallet
2. Connect again with different email
3. Enter new verification code

**Use Cases:**

- Testing with different accounts
- Separating personal and development
- Managing multiple projects
- Security isolation

#### Disconnecting Wallet

**Manual Disconnect:**

1. Click wallet address in header
2. Select **Disconnect** option
3. Wallet connection removed
4. Wallet-required features disabled

**When to Disconnect:**

- Finished with write operations
- Leaving computer unattended
- Switching to different wallet
- Security concerns

**After Disconnecting:**

- Read operations still work
- Cannot write to processes
- Cannot create processes
- Cannot sign transactions
- Can reconnect anytime

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

- ArConnect supports mainnet only
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

**For Testing (Testnet):**

- Use Arweave faucet: [faucet.arweave.net](https://faucet.arweave.net)
- Provides small amount for testing
- Free but limited
- Good for development

**For Production (Mainnet):**

- Purchase from cryptocurrency exchange
- Transfer to your wallet
- Use DEX for direct swaps
- Ensure sufficient balance for fees

**How Much AR Needed:**

- Typical transaction: 0.0001-0.001 AR
- Process creation: ~0.001-0.01 AR
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

#### Best Practices Summary

**Security:**

- ✅ Always verify transaction details
- ✅ Keep private keys secure
- ✅ Use hardware wallet for large amounts
- ✅ Enable all available security features
- ❌ Never share seed phrases
- ❌ Don't sign suspicious transactions

**Usage:**

- ✅ Keep sufficient AR balance
- ✅ Test with small amounts first
- ✅ Verify recipient addresses
- ✅ Disconnect when not needed
- ❌ Don't rush through signing
- ❌ Don't ignore warnings

**Development:**

- ✅ Use separate wallet for testing
- ✅ Document required permissions
- ✅ Handle rejection gracefully
- ✅ Provide clear error messages
- ❌ Don't hardcode wallet addresses
- ❌ Don't assume wallet is connected

#### Wallet Comparison

| Feature          | ArConnect         | Othent    | Wander       |
| ---------------- | ----------------- | --------- | ------------ |
| Platform         | Browser Extension | Web-based | Mobile App   |
| Key Storage      | Local             | Managed   | Local        |
| Setup Difficulty | Medium            | Easy      | Easy         |
| Best For         | Power Users       | Beginners | Mobile Users |
| Offline Support  | Yes               | No        | Yes          |
| Custom Tokens    | Yes               | Limited   | Yes          |

#### Getting Help

**ArConnect Issues:**

- Discord: ArConnect community
- Documentation: arconnect.io/docs
- GitHub: ArConnect repo

**Othent Issues:**

- Support: othent.io/support
- Documentation: othent.io/docs
- Discord: Othent community

**Wander Issues:**

- Support: In-app help
- Documentation: wander.app/docs
- Discord: Wander community

**Lunar Wallet Issues:**

- Check Lunar docs first
- Verify wallet connection
- Try different wallet
- Report bugs on GitHub

Remember: Your wallet is your identity on the AO network. Protect it carefully, verify all transactions, and never share private keys. With proper wallet security, you can safely build and interact with decentralized processes on AO.

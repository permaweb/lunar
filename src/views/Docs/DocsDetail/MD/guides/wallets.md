# Wallet Integration

Lunar uses an Arweave wallet as both an Arweave identity and the signer for AO actions. You can browse public Arweave and AO data without connecting; a wallet is required only when Lunar needs your address or signature.

#### Supported Wallet

Lunar currently exposes **Wander** in the connection dialog.

Wander implements the browser `arweaveWallet` API used by Lunar. Install or create a wallet at [wander.app](https://wander.app).

#### Connecting

1. Install and unlock Wander.
2. Select **Connect** in Lunar.
3. Choose **Wander**.
4. Review and approve the requested permissions.
5. Confirm that the expected address appears in Lunar.

Lunar remembers the selected wallet type in local browser storage and attempts to reconnect on a later visit.

#### Requested Permissions

The current integration requests:

- `ACCESS_ADDRESS`
- `ACCESS_PUBLIC_KEY`
- `SIGN_TRANSACTION`
- `DISPATCH`
- `SIGNATURE`

These permissions let Lunar read the active address, create an AO signer, request signatures, and dispatch approved records.

The wallet extension controls private keys and approval behavior. Lunar does not receive your seed phrase or private key.

#### What Requires a Wallet

**AO process writes**

The Write tab submits a signed AO message to a process.

**AOS**

The Console and AOS process tab require a connected wallet whose address matches the process owner.

**Process creation**

Creating a process signs and submits the process record through the AO libraries.

**Profile actions**

Creating or updating a permaweb profile uses the connected identity.

Public exploration, block browsing, GraphQL queries, process reads, transaction data, and message results do not require a wallet.

#### Balances

The connected-wallet menu displays:

- **AR**, read from an Arweave gateway balance endpoint
- **AO**, read from the AO token process

Explorer also displays AO balance for process and wallet identifiers, and AR balance for wallet identifiers.

Balances are converted from their base units using 12 decimal places. Use Refresh when you expect a recent change.

#### Wallets in Explorer

Enter a 43-character wallet address in Explorer to inspect:

- Native AR balance
- AO token balance
- Indexed activity involving the address
- Transactions and messages owned by or related to the address

The address does not have to be the currently connected wallet.

Wallet classification depends on indexed activity. An unused valid address may not have enough indexed data for Lunar to distinguish it from a missing transaction ID.

#### Arweave and AO Signing

The same wallet identity participates in two kinds of activity:

- **Arweave transaction signing** creates a signed Arweave record or dispatches data through compatible infrastructure.
- **AO message signing** creates a signed message for an AO process.

An AO token transfer is not the same as a native AR transfer. Always verify whether the UI is asking you to sign:

- An Arweave transaction with a recipient and AR quantity
- An AO message with a target process and tags such as `Action`, `Recipient`, and `Quantity`

#### Reviewing a Request

Before approving a wallet prompt, verify:

- The active wallet address
- The target process or Arweave recipient
- The action and tags
- The data payload
- The token and base-unit quantity
- Any fee or dispatch information shown by the wallet

For an unfamiliar AO process, inspect its Source and recent Messages first.

#### Disconnecting

Open the wallet menu and select **Disconnect**. Lunar removes the remembered wallet type and asks the browser wallet to disconnect.

Disconnecting does not delete:

- Explorer tabs
- GraphQL tabs
- Saved filters
- Public data

Those are stored separately in local browser storage.

#### Troubleshooting

**Wander does not appear**

- Confirm the extension is installed and enabled.
- Unlock the wallet.
- Refresh after the wallet has loaded.

**Connection is not restored**

- Reopen Wander and approve access again.
- Disconnect from Lunar and reconnect.
- Check whether the active account changed.

**AOS is unavailable for a process**

- Confirm the connected address exactly matches the process owner.
- Wait for a newly created process to be indexed.
- Verify the process has a supported AO `Variant`.

**Balance looks stale**

- Use Refresh beside the balance.
- Allow time for the Arweave transaction or AO message to confirm and execute.
- Compare the record through Explorer and GraphQL.

#### Security

- Never share a seed phrase or private key.
- Read wallet prompts before approving them.
- Verify Lunar's URL.
- Treat process code as untrusted until reviewed.
- Test new process interactions with small quantities.
- Disconnect when using a shared browser.

#### Further Reading

- [Wander](https://wander.app)
- [Wander help](https://www.wander.app/help)
- [Arweave overview](/docs/overview/arweave)
- [AO overview](/docs/overview/ao)

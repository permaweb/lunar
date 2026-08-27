# Lunar

Lunar is an explorer for [Arweave](https://arweave.org) and [AO](https://ao.arweave.net). It provides interfaces for inspecting Arweave blocks, transactions, bundles, data, and wallets alongside AO processes, messages, results, and process interactions.

## Prerequisites

Before using Lunar, ensure the following dependencies are installed:

- Node.js version 18.0 or higher
- `npm`

## Installation

Install dependencies using npm:

`npm install`

## Development

Run the development server:

`npm run start:development`

This will launch the app locally at http://localhost:3000. Port configurations can be modified in `package.json` and `vite.config.js`

## PermawebOS wallet fallback

Lunar uses an installed PermawebOS extension when `window.permawebConnect` is available. Otherwise it keeps the hosted PermawebOS wallet attached in a sandboxed iframe. The frame stays hidden for read-only wallet operations and opens as a full-screen dialog when the wallet needs the user to connect, sign, encrypt, or decrypt.

The default wallet URL is `http://localhost:5173/`. A deployment can use a different dedicated HTTPS origin at build time:

```sh
VITE_PERMAWEBOS_WALLET_URL=https://wallet.example.com/ npm run build
```

The Lunar deployment's Content Security Policy must include the wallet origin in `frame-src`. The wallet deployment must allow the Lunar application origin in its `Content-Security-Policy: frame-ancestors` directive. Keep the two applications on separate origins; the iframe transport rejects same-origin and insecure production URLs. Private keys remain inside the wallet frame and requests use a versioned, exact-origin `postMessage` channel.

## License

ISC

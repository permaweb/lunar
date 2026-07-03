// Paid-route (ao-payment) fallback for uploads whose cost exceeds the sponsored
// recharging-ledger bucket. Mirrors the permaweb-deploy waterfall: quote the
// signed item's byte cost, and — only when the sponsored bucket can't cover it —
// fund the ao-payment ledger for the shortfall via an AO transfer signed by the
// connected browser wallet, then import the deposit. The node's p4 ledger
// waterfall (recharging-ledger -> ao-payment) settles the upload from there.
import {
	AoTokenTransferAdapter,
	discoverHyperbeamAoBundlerProfile,
	HyperbalanceClient,
	type HyperbalanceProfile,
	waitForAoAssignmentSlot,
} from '@permaweb/hyperbalance';

import { createDataItemSigner, message as aoMessage } from '@permaweb/aoconnect';

export type UploadQuote = {
	client: HyperbalanceClient;
	costRaw: bigint;
	profile: HyperbalanceProfile;
};

// The node's settlement charge runs a hair above the byte quote (bundle-encode
// overhead + dynamic-price drift between quote and charge — observed ~0.3%). Size
// funding and the free/paid decision against this padded amount so ao-payment is
// never left marginally short. The surplus stays as reusable ao-payment credit.
export function fundTarget(costRaw: bigint): bigint {
	return (costRaw * BigInt(105)) / BigInt(100);
}

// Native browser `fetch` is brand-checked and throws "Illegal invocation" when
// called with a `this` other than `window` — which hyperbalance's client does
// internally (`this.fetch(...)`). Hand it a bound fetch so every request works.
const browserFetch: typeof globalThis.fetch = globalThis.fetch.bind(globalThis);

// Discover the node's payment profile and quote the AO cost of a signed item of
// `signedBytes`. Both quote and the eventual settlement hit the same
// `~arweave-byte-pricing@1.0` device, so this cost is the authoritative amount.
export async function quoteUpload(nodeUrl: string, signedBytes: number): Promise<UploadQuote> {
	const profile = await discoverHyperbeamAoBundlerProfile({ fetch: browserFetch, nodeUrl });
	const client = new HyperbalanceClient({ fetch: browserFetch, nodeUrl });
	const quote = await client.quoteAuto({
		action: 'hyperbeam-upload',
		params: { bytes: signedBytes },
		profile,
	});
	return { client, costRaw: quote.amount, profile };
}

// Fund the ao-payment ledger so it can cover `quote.costRaw`. ensureCreditAuto
// reads the aggregated balance and the settlement (ao-payment) balance, sizes
// the top-up against the non-additive fallback leg, transfers the AO shortfall
// (wallet-signed) to the node's deposit address, and imports the deposit.
export async function fundUpload(quote: UploadQuote, address: string, stateUrl: string): Promise<void> {
	const wallet = (window as unknown as { arweaveWallet?: unknown }).arweaveWallet;
	if (!wallet) throw new Error('Wallet not available for AO transfer.');

	const signer = createDataItemSigner(wallet);
	const adapter = new AoTokenTransferAdapter({
		inferSender: async () => address,
		message: async ({ data, process, tags }) => aoMessage({ data: data ?? '', process, signer, tags }),
		waitForAssignmentSlot: async (messageId, context) =>
			waitForAoAssignmentSlot({ fetch: browserFetch, messageId, processId: context.processId, stateUrl }),
	});

	await quote.client.ensureCreditAuto({
		minimumBalance: fundTarget(quote.costRaw),
		profile: quote.profile,
		recipient: address,
		transferAdapter: adapter,
	});
}

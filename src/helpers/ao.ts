import { DEFAULT_LEGACY_CU_URL, PROCESSES } from './config';
import { MessageVariantEnum } from './types';

export async function readAoBalance(walletAddress: string) {
	const response = await fetch(`${DEFAULT_LEGACY_CU_URL}/dry-run?process-id=${PROCESSES.ao}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		redirect: 'follow',
		body: JSON.stringify({
			Id: '1234',
			Owner: '1234',
			Target: PROCESSES.ao,
			Data: '1234',
			Tags: [
				{ name: 'Action', value: 'Balance' },
				{ name: 'Recipient', value: walletAddress },
				{ name: 'Data-Protocol', value: 'ao' },
				{ name: 'Type', value: 'Message' },
				{ name: 'Variant', value: MessageVariantEnum.Legacynet },
			],
		}),
	});

	if (!response.ok) throw new Error(`AO balance request failed with status ${response.status}`);

	const parsed = await response.json();
	const message = parsed?.Messages?.[0];

	if (message?.Data !== undefined && message?.Data !== null) return message.Data;

	const balanceTag = message?.Tags?.find((tag: { name: string; value: string }) => tag.name === 'Balance');
	return balanceTag?.value ?? null;
}

import { connect } from '@permaweb/aoconnect';
import PermawebLibs from '@permaweb/libs';

import { DEFAULT_LEGACY_CU_URL, PROCESSES } from 'helpers/config';
import { getARBalanceEndpoint } from 'helpers/endpoints';

const aoBalanceClient = PermawebLibs.init({
	ao: connect({ MODE: 'legacy', CU_URL: DEFAULT_LEGACY_CU_URL }),
});

export function readAoBalance(address: string): Promise<string | null> {
	return aoBalanceClient.readProcess({
		processId: PROCESSES.ao,
		action: 'Balance',
		tags: [{ name: 'Recipient', value: address }],
	});
}

export async function readArBalance(address: string): Promise<string> {
	const response = await fetch(getARBalanceEndpoint(address));
	if (!response.ok) throw new Error(`AR balance request failed with status ${response.status}`);
	return response.text();
}

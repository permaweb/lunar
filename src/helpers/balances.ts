import { connect } from '@permaweb/aoconnect';
import PermawebLibs from '@permaweb/libs';

import { DEFAULT_LEGACY_CU_URL, PROCESSES } from './config';

const aoBalanceLibs = PermawebLibs.init({
	ao: connect({ MODE: 'legacy', CU_URL: DEFAULT_LEGACY_CU_URL }),
});

export function readAoBalance(address: string) {
	return aoBalanceLibs.readProcess({
		processId: PROCESSES.ao,
		action: 'Balance',
		tags: [{ name: 'Recipient', value: address }],
	});
}

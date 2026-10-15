import type { TokenHoldersSnapshot } from '../../src/api/holders';
import { PROCESSES } from '../../src/helpers/config';

export const HOLDER_ADDRESSES = Array.from({ length: 100 }, (_, index) => String(index).padStart(43, 'a'));

export const HOLDERS_SNAPSHOT: TokenHoldersSnapshot & { schema: string } = {
	schema: 'holders@1.0',
	tokenProcess: PROCESSES.ao,
	name: 'AO',
	ticker: 'AO',
	denomination: 12,
	generatedAt: '2026-10-15T15:01:00.380Z',
	lastScannedSlot: 2509333,
	topN: 100,
	totalBalances: 335454,
	totalHolders: 214615,
	totalSupply: '100000000000000000000000',
	holders: HOLDER_ADDRESSES.map((address, index) => ({
		address,
		balance: (900719925474099312345n - BigInt(index) * 1000000000000n).toString(),
	})),
};

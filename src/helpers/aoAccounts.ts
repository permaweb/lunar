import { checksumEthereumAddress, getEthereumOwnerAddress } from './identities';
import type { TagType } from './types';
import { checkValidAddress, checkValidEthereumAddress, getTagValue } from './utils';

export function checkValidAoAccount(address: string | null) {
	return checkValidAddress(address) || checkValidEthereumAddress(address);
}

export { checksumEthereumAddress, getEthereumOwnerAddress };

export function getAoSender(
	transaction:
		| {
				owner?: { address?: string | null; key?: string | null } | null;
				tags?: TagType[] | null;
		  }
		| null
		| undefined
): string | null {
	const reported = transaction?.owner?.address;
	// Explicit identities survive whether or not a query included the signing key.
	const identity = reported && !checkValidAddress(reported) ? checksumEthereumAddress(reported) : null;
	return (
		getTagValue(transaction?.tags ?? [], 'From-Process') ??
		identity ??
		getEthereumOwnerAddress(transaction?.owner?.key) ??
		(transaction?.owner?.address ? checksumEthereumAddress(transaction.owner.address) : null) ??
		null
	);
}

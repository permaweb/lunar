import { expect, it, vi } from 'vitest';

import { MessageVariantEnum } from '../../src/helpers/types';
import { isLegacyMessageSpam, isTrustedLegacyAuthority, resolveResultMessages } from '../../src/helpers/utils';
import { HB_IDENTITY_WITNESSES } from '../fixtures/identities';

const notice = HB_IDENTITY_WITNESSES.trustedNotice;

it.each([notice.address, notice.committer, `did:ar:${notice.address}`])(
	'trusts the captured legacy signer %s only within its configured heights',
	(address) => {
		expect(isTrustedLegacyAuthority(address, notice.blockHeight)).toBe(true);
		expect(isTrustedLegacyAuthority(address, 1953008)).toBe(true);
		expect(isTrustedLegacyAuthority(address, 1953007)).toBe(false);
		expect(isTrustedLegacyAuthority(address, null)).toBe(true);
		expect(
			isLegacyMessageSpam({
				variant: MessageVariantEnum.Legacynet,
				tags: [{ name: 'From-Process', value: notice.fromProcess }],
				ownerAddress: address,
				blockHeight: notice.blockHeight,
			})
		).toBe(false);
	}
);

it.each([null, '', notice.address.toLowerCase(), HB_IDENTITY_WITNESSES.process.committer])(
	'does not trust an invalid, case-changed, or unrelated signer %s',
	(address) => expect(isTrustedLegacyAuthority(address, notice.blockHeight)).toBe(false)
);

it('matches a settled notice when its declared authority and indexed signer use different representations', async () => {
	const recipient = 'kRdpOYaT5pUUiNFDaUymqO1VcybZpAfNPnNdls-A134';
	const tags = [
		{ name: 'Action', value: 'Debit-Notice' },
		{ name: 'Data-Protocol', value: 'ao' },
		{ name: 'Type', value: 'Message' },
		{ name: 'Variant', value: MessageVariantEnum.Legacynet },
		{ name: 'From-Process', value: notice.fromProcess },
		{ name: 'Reference', value: '3479608' },
	];
	const getGQLData = vi.fn().mockResolvedValue({
		data: [{ cursor: null, node: { id: notice.id, owner: { address: notice.address }, recipient, tags } }],
	});
	const result = await resolveResultMessages({
		messages: [{ Target: recipient, Tags: tags }],
		txId: 'sBO6WjuQu9ov9yGlir2QaUr5Nc4HfKbIYdduOxy75Fs',
		fromProcess: notice.fromProcess,
		variant: MessageVariantEnum.Legacynet,
		authority: notice.committer,
		permawebProvider: { legacyApi: { getGQLData, mapFromProcessCase: (messages) => messages } },
	});
	expect(getGQLData).toHaveBeenCalledWith(expect.objectContaining({ owners: [notice.committer] }));
	expect(result[0].node.id).toBe(notice.id);
	expect(result[0].node.owner.address).toBe(notice.address);
});

import { MessageVariantEnum, TagType } from './types';
import { getAoVariantFromTags, getTagValue } from './utils';

/**
 * How a process is scheduled: the HyperBEAM scheduler device it declares (for example `arweave-scheduler@1.0` or
 * `scheduler@1.0`), or the legacy scheduler unit named by a Legacynet process that predates scheduler devices.
 */
export type AoProcessScheduler = { type: 'device'; device: string } | { type: 'legacy' };

export type AoProcessSummary = {
	name: string | null;
	variant: MessageVariantEnum | null;
	owner: string | null;
	scheduler: AoProcessScheduler | null;
};

function getProcessScheduler(tags: TagType[], variant: MessageVariantEnum | null): AoProcessScheduler | null {
	const device = getTagValue(tags, 'Scheduler-Device');
	if (device) return { type: 'device', device: device };
	if (variant === MessageVariantEnum.Legacynet && getTagValue(tags, 'Scheduler')) return { type: 'legacy' };

	return null;
}

export function getAoProcessSummary(
	process: { tags?: TagType[] | null; owner?: { address?: string | null } | null } | null | undefined
): AoProcessSummary {
	const tags = process?.tags ?? [];
	const variant = getAoVariantFromTags(tags) ?? null;

	return {
		name: getTagValue(tags, 'Name') || null,
		variant: variant,
		owner: process?.owner?.address || null,
		scheduler: getProcessScheduler(tags, variant),
	};
}

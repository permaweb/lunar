import { getTagValue } from './utils';

type BundlerTag = {
	name: string;
	value: string;
};

const KNOWN_BUNDLER_LABELS: Record<string, string> = {
	JNC6vBhjHY1EPwV3pEeNmrsgFMxH5d38_LHsZ7jful8: 'Turbo',
};

function getTagValues(tags: BundlerTag[], name: string) {
	return tags.filter((tag) => tag.name.toLowerCase() === name.toLowerCase()).map((tag) => tag.value);
}

export function getBundlerLabel(address: string | null | undefined, tags: BundlerTag[] = []) {
	const appNames = getTagValues(tags, 'App-Name');
	const appNameText = appNames.join(' ').toLowerCase();
	const ownerAppName = getTagValue(tags, 'Owner-App-Name')?.toLowerCase() ?? '';
	const labelSource = `${appNameText} ${ownerAppName}`;

	if (labelSource.includes('turbo')) return 'Turbo';
	if (labelSource.includes('irys') || labelSource.includes('bundlr')) return 'Irys';
	if (
		labelSource.includes('neo-uploader') ||
		labelSource.includes('neo uploader') ||
		labelSource.includes('neouploader')
	) {
		return 'Neo Uploader';
	}

	return address ? KNOWN_BUNDLER_LABELS[address] ?? null : null;
}

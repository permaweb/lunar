import React from 'react';

import { getProfileImageUrl } from 'helpers/profile';

export function useProfileImage(value: string | File | null): string | undefined {
	const [preview, setPreview] = React.useState<string>();
	React.useEffect(() => {
		if (!value || typeof value === 'string') {
			setPreview(getProfileImageUrl(value));
			return;
		}
		const url = URL.createObjectURL(value);
		setPreview(url);
		return () => URL.revokeObjectURL(url);
	}, [value]);
	return preview;
}

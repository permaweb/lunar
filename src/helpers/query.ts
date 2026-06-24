export function getSearchParam(searchParams: URLSearchParams, key: string) {
	const value = searchParams.get(key)?.trim() ?? '';

	return value || null;
}

export function updateSearchParams(
	searchParams: URLSearchParams,
	setSearchParams: (nextInit: URLSearchParams, navigateOptions?: { replace?: boolean }) => void,
	updates: Record<string, string | number | null | undefined>
) {
	const nextParams = new URLSearchParams(searchParams);

	Object.entries(updates).forEach(([key, value]) => {
		if (value === null || value === undefined || value === '') {
			nextParams.delete(key);
		} else {
			nextParams.set(key, value.toString());
		}
	});

	if (nextParams.toString() !== searchParams.toString()) {
		setSearchParams(nextParams, { replace: true });
	}
}

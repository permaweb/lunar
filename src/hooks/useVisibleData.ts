import React from 'react';

type UseVisibleDataArgs<T> = {
	cacheKey: string | number | null | undefined;
	enabled?: boolean;
	fetchData: () => Promise<T>;
	rootMargin?: string;
	threshold?: number;
};

type UseVisibleDataState<T> = {
	data: T | null;
	error: Error | null;
	loaded: boolean;
	loading: boolean;
	visible: boolean;
};

export function useVisibleData<T, TElement extends HTMLElement = HTMLDivElement>(
	args: UseVisibleDataArgs<T>
): UseVisibleDataState<T> & { ref: React.RefObject<TElement> } {
	const ref = React.useRef<TElement | null>(null);
	const fetchDataRef = React.useRef(args.fetchData);
	const loadedKeyRef = React.useRef<string | number | null>(null);
	const loadingKeyRef = React.useRef<string | number | null>(null);

	const [visible, setVisible] = React.useState(false);
	const [state, setState] = React.useState<Omit<UseVisibleDataState<T>, 'visible'>>({
		data: null,
		error: null,
		loaded: false,
		loading: false,
	});

	const enabled = args.enabled ?? true;
	const hasCacheKey = args.cacheKey !== null && args.cacheKey !== undefined;

	React.useEffect(() => {
		fetchDataRef.current = args.fetchData;
	}, [args.fetchData]);

	React.useEffect(() => {
		loadedKeyRef.current = null;
		loadingKeyRef.current = null;
		setVisible(false);
		setState({
			data: null,
			error: null,
			loaded: false,
			loading: false,
		});
	}, [args.cacheKey, enabled]);

	React.useEffect(() => {
		if (!enabled || !hasCacheKey) return;

		const element = ref.current;
		if (!element) return;

		if (!('IntersectionObserver' in window)) {
			setVisible(true);
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{
				rootMargin: args.rootMargin ?? '0px',
				threshold: args.threshold ?? 0.01,
			}
		);

		observer.observe(element);

		return () => observer.disconnect();
	}, [args.cacheKey, args.rootMargin, args.threshold, enabled, hasCacheKey]);

	React.useEffect(() => {
		if (!enabled || !hasCacheKey || !visible) return;
		if (loadedKeyRef.current === args.cacheKey || loadingKeyRef.current === args.cacheKey) return;

		let cancelled = false;
		const activeKey = args.cacheKey as string | number;

		loadingKeyRef.current = activeKey;

		setState((current) => ({
			...current,
			error: null,
			loading: true,
		}));

		fetchDataRef
			.current()
			.then((data) => {
				if (cancelled || loadingKeyRef.current !== activeKey) return;

				loadedKeyRef.current = activeKey;
				loadingKeyRef.current = null;

				setState({
					data: data,
					error: null,
					loaded: true,
					loading: false,
				});
			})
			.catch((e: Error) => {
				if (cancelled || loadingKeyRef.current !== activeKey) return;

				loadedKeyRef.current = activeKey;
				loadingKeyRef.current = null;

				setState({
					data: null,
					error: e,
					loaded: true,
					loading: false,
				});
			});

		return () => {
			cancelled = true;
		};
	}, [args.cacheKey, enabled, hasCacheKey, visible]);

	return {
		...state,
		ref: ref,
		visible: visible,
	};
}

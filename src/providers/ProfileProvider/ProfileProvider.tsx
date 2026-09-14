import React from 'react';

import type { ProfileErrorCode, ProfilePhase, ProfileUpdate } from 'api/profiles';
import { cacheProfile, getCachedProfile, profileApi, ProfileError } from 'api/profiles';

import type { ProfileType } from 'helpers/types';
import { useArweaveProvider } from 'providers/ArweaveProvider';

type ProfileState =
	| { status: 'idle' | 'loading' }
	| { status: 'ready'; data: ProfileType | null }
	| { status: 'submitted'; data: ProfileType }
	| { status: 'stale'; data: ProfileType; error: ProfileErrorCode }
	| { status: 'error'; error: ProfileErrorCode };
interface ProfileContextState {
	profile: ProfileType | null;
	state: ProfileState;
	showProfileManager: boolean;
	setShowProfileManager: (open: boolean) => void;
	refreshProfile: () => void;
	saveProfile: (
		update: ProfileUpdate,
		options: { signal: AbortSignal; onPhase?: (phase: ProfilePhase) => void }
	) => Promise<ProfileType>;
}
const ProfileContext = React.createContext<ProfileContextState>({
	profile: null,
	state: { status: 'idle' },
	showProfileManager: false,
	setShowProfileManager() {},
	refreshProfile() {},
	async saveProfile() {
		throw new ProfileError('wallet-unavailable');
	},
});
export function useProfileProvider(): ProfileContextState {
	return React.useContext(ProfileContext);
}

export default function ProfileProvider(props: { children: React.ReactNode }) {
	const arProvider = useArweaveProvider();
	const [scoped, setScoped] = React.useState<{ address: string | null; state: ProfileState }>({
		address: null,
		state: { status: 'idle' },
	});
	const [showProfileManager, setShowProfileManager] = React.useState(false);
	const [revision, setRevision] = React.useState(0);
	const current = React.useRef({ address: arProvider.walletAddress, wallet: arProvider.wallet });
	const activeRead = React.useRef<AbortController | null>(null);
	current.current = { address: arProvider.walletAddress, wallet: arProvider.wallet };
	React.useEffect(() => setShowProfileManager(false), [arProvider.walletAddress]);
	React.useEffect(() => {
		const address = arProvider.walletAddress;
		if (!address) {
			setScoped({ address: null, state: { status: 'idle' } });
			return;
		}
		const controller = new AbortController();
		activeRead.current = controller;
		const cached = getCachedProfile(address);
		const pending = cached?.submitted ? cached.data : null;
		let known = cached?.data ?? null;
		setScoped({
			address,
			state: pending
				? { status: 'submitted', data: pending }
				: cached
				? { status: 'ready', data: known }
				: { status: 'loading' },
		});
		let timer: ReturnType<typeof setTimeout> | undefined;
		async function read(attempt: number) {
			try {
				const profile = await profileApi.read(address, controller.signal);
				if (controller.signal.aborted) return;
				if (pending && profile?.id !== pending.id) {
					if (attempt < 9) timer = setTimeout(() => void read(attempt + 1), Math.min(1000 * 2 ** attempt, 10_000));
					return;
				}
				known = profile;
				cacheProfile(address, profile);
				setScoped({ address, state: { status: 'ready', data: profile } });
			} catch (error) {
				if (controller.signal.aborted) return;
				const code = error instanceof ProfileError ? error.code : 'unavailable';
				if (!pending)
					setScoped({
						address,
						state: known ? { status: 'stale', data: known, error: code } : { status: 'error', error: code },
					});
			}
		}
		void read(0);
		return () => {
			controller.abort();
			if (timer) clearTimeout(timer);
		};
	}, [arProvider.walletAddress, revision]);
	const saveProfile = React.useCallback(
		async (update: ProfileUpdate, options: { signal: AbortSignal; onPhase?: (phase: ProfilePhase) => void }) => {
			const { address, wallet } = current.current;
			if (!address || !wallet) throw new ProfileError('wallet-unavailable');
			const profile = await profileApi.save(wallet, address, update, options);
			if (current.current.address === address) activeRead.current?.abort();
			cacheProfile(address, profile, true);
			if (current.current.address === address && current.current.wallet === wallet && !options.signal.aborted) {
				setScoped({ address, state: { status: 'submitted', data: profile } });
				setRevision((value) => value + 1);
			}
			return profile;
		},
		[]
	);
	const refreshProfile = React.useCallback(() => setRevision((value) => value + 1), []);
	const state: ProfileState =
		scoped.address === arProvider.walletAddress
			? scoped.state
			: { status: arProvider.walletAddress ? 'loading' : 'idle' };
	const value = React.useMemo(
		() => ({
			profile: 'data' in state ? state.data : null,
			state,
			showProfileManager,
			setShowProfileManager,
			refreshProfile,
			saveProfile,
		}),
		[state, showProfileManager, refreshProfile, saveProfile]
	);
	return <ProfileContext.Provider value={value}>{props.children}</ProfileContext.Provider>;
}

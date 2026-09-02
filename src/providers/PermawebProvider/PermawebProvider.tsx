import React from 'react';

import { createPermawebApis, PermawebApi } from 'api/permaweb';

import { STORAGE } from 'helpers/config';
import { ProfileType } from 'helpers/types';
import { useArweaveProvider } from 'providers/ArweaveProvider';
import { useSettingsProvider } from 'providers/SettingsProvider';

interface PermawebContextState {
	legacyApi: PermawebApi | null;
	mainnetApi: PermawebApi | null;
	profile: ProfileType | null;
	showProfileManager: boolean;
	setShowProfileManager: (toggle: boolean) => void;
	refreshProfile: () => void;
}

const DEFAULT_CONTEXT = {
	legacyApi: null,
	mainnetApi: null,
	profile: null,
	showProfileManager: false,
	setShowProfileManager(_toggle: boolean) {},
	refreshProfile() {},
};

const PermawebContext = React.createContext<PermawebContextState>(DEFAULT_CONTEXT);

export function usePermawebProvider(): PermawebContextState {
	return React.useContext(PermawebContext);
}

export default function PermawebProvider(props: { children: React.ReactNode }) {
	const arProvider = useArweaveProvider();
	const settingsProvider = useSettingsProvider();
	const [legacyApi, setLegacyApi] = React.useState<PermawebApi | null>(null);
	const [mainnetApi, setMainnetApi] = React.useState<PermawebApi | null>(null);

	const [profile, setProfile] = React.useState<ProfileType | null>(null);
	const [showProfileManager, setShowProfileManager] = React.useState<boolean>(false);
	const [refreshProfileTrigger, setRefreshProfileTrigger] = React.useState<boolean>(false);

	React.useEffect(() => {
		try {
			const activeNode = settingsProvider.settings.nodes.find((node) => node.active);
			const apis = createPermawebApis({
				wallet: arProvider.wallet,
				legacyComputeNode: settingsProvider.settings.legacyComputeNode,
				node: activeNode,
			});

			setLegacyApi(apis.legacyApi);
			setMainnetApi(apis.mainnetApi);
		} catch (error) {
			console.error('Error in PermawebProvider initialization:', error);
		}
	}, [arProvider.wallet, settingsProvider.settings.nodes, settingsProvider.settings.legacyComputeNode]);

	React.useEffect(() => {
		(async function () {
			if (arProvider.wallet && arProvider.walletAddress && legacyApi) {
				const cachedProfile = getCachedProfile(arProvider.walletAddress);
				if (cachedProfile) {
					setProfile(cachedProfile);
				}

				try {
					const fetchedProfile = await legacyApi.getProfileByWalletAddress(arProvider.walletAddress);
					setProfile(fetchedProfile);
					cacheProfile(arProvider.walletAddress, fetchedProfile);
				} catch (e: any) {
					console.error(e);
				}
			} else {
				setProfile(null);
			}
		})();
	}, [arProvider.wallet, arProvider.walletAddress, legacyApi]);

	React.useEffect(() => {
		(async function () {
			if (arProvider.wallet && arProvider.walletAddress && legacyApi) {
				const fetchProfileUntilChange = async () => {
					let changeDetected = false;
					let tries = 0;
					const maxTries = 10;

					while (!changeDetected && tries < maxTries) {
						try {
							const existingProfile = profile;
							const newProfile = await legacyApi.getProfileByWalletAddress(arProvider.walletAddress);

							if (JSON.stringify(existingProfile) !== JSON.stringify(newProfile)) {
								setProfile(newProfile);
								cacheProfile(arProvider.walletAddress, newProfile);
								changeDetected = true;
							} else {
								await new Promise((resolve) => setTimeout(resolve, 1000));
								tries++;
							}
						} catch (error) {
							console.error(error);
							break;
						}
					}

					if (!changeDetected) {
						console.warn(`No changes detected after ${maxTries} attempts`);
					}
				};

				await fetchProfileUntilChange();
			}
		})();
	}, [arProvider.wallet, arProvider.walletAddress, legacyApi, refreshProfileTrigger]);

	function getCachedProfile(address: string) {
		const cached = localStorage.getItem(STORAGE.profile(address));
		return cached ? JSON.parse(cached) : null;
	}

	function cacheProfile(address: string, profileData: any) {
		localStorage.setItem(STORAGE.profile(address), JSON.stringify(profileData));
	}

	return (
		<PermawebContext.Provider
			value={{
				legacyApi,
				mainnetApi,
				profile: profile,
				showProfileManager,
				setShowProfileManager,
				refreshProfile: () => setRefreshProfileTrigger((prev) => !prev),
			}}
		>
			{props.children}
		</PermawebContext.Provider>
	);
}

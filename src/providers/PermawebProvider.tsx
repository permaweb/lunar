import React from 'react';

import Arweave from 'arweave';
import { connect, createSigner } from '@permaweb/aoconnect';
import PermawebLibs, { Types } from '@permaweb/libs';

import { Panel } from 'components/atoms/Panel';
import { ProfileManager } from 'components/organisms/ProfileManager';
import { AO_NODE, STORAGE } from 'helpers/config';

import { useArweaveProvider } from './ArweaveProvider';
import { useLanguageProvider } from './LanguageProvider';

interface PermawebContextState {
	deps: { ao: any; arweave: any; signer: any };
	depsMainnet: { ao: any; arweave: any; signer: any };
	libs: any;
	libsMainnet: any;
	profile: Types.ProfileType;
	showProfileManager: boolean;
	setShowProfileManager: (toggle: boolean) => void;
	refreshProfile: () => void;
}

const DEFAULT_CONTEXT = {
	deps: null,
	depsMainnet: null,
	libs: null,
	libsMainnet: null,
	profile: null,
	showProfileManager: false,
	setShowProfileManager(_toggle: boolean) {},
	refreshProfile() {},
};

const PermawebContext = React.createContext<PermawebContextState>(DEFAULT_CONTEXT);

export function usePermawebProvider(): PermawebContextState {
	return React.useContext(PermawebContext);
}

export function PermawebProvider(props: { children: React.ReactNode }) {
	const arProvider = useArweaveProvider();
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const [libs, setLibs] = React.useState<any>(null);
	const [libsMainnet, setLibsMainnet] = React.useState<any>(null);

	const [deps, setDeps] = React.useState<any>(null);
	const [depsMainnet, setDepsMainnet] = React.useState<any>(null);

	const [profile, setProfile] = React.useState<Types.ProfileType | null>(null);
	const [showProfileManager, setShowProfileManager] = React.useState<boolean>(false);
	const [refreshProfileTrigger, setRefreshProfileTrigger] = React.useState<boolean>(false);

	React.useEffect(() => {
		try {
			let signer = null;
			if (arProvider.wallet) signer = createSigner(arProvider.wallet);

			const aoLegacy = connect({ MODE: 'legacy' });

			const configMainnet: any = { MODE: 'mainnet', URL: AO_NODE.url, SCHEDULER: AO_NODE.scheduler };
			if (signer) configMainnet.signer = signer;
			const aoMainnet = connect(configMainnet);

			const dependenciesShared = {
				arweave: Arweave.init({}),
				signer: signer,
				node: { ...AO_NODE },
			};

			const dependenciesLegacy = { ao: aoLegacy, ...dependenciesShared };
			const dependenciesMainnet = { ao: aoMainnet, ...dependenciesShared };

			setDeps(dependenciesLegacy);
			setDepsMainnet(dependenciesMainnet);

			const initializedLibs = PermawebLibs.init(dependenciesLegacy);
			setLibs(initializedLibs);

			const initializedLibsMainnet = PermawebLibs.init(dependenciesMainnet);
			setLibsMainnet(initializedLibsMainnet);
		} catch (error) {
			console.error('Error in PermawebProvider initialization:', error);
		}
	}, [arProvider.wallet]);

	React.useEffect(() => {
		(async function () {
			if (arProvider.wallet && arProvider.walletAddress) {
				const cachedProfile = getCachedProfile(arProvider.walletAddress);
				if (cachedProfile) {
					setProfile(cachedProfile);
				}

				try {
					const fetchedProfile = await libs.getProfileByWalletAddress(arProvider.walletAddress);
					setProfile(fetchedProfile);
					cacheProfile(arProvider.walletAddress, fetchedProfile);
				} catch (e: any) {
					console.error(e);
				}
			} else {
				setProfile(null);
			}
		})();
	}, [arProvider.wallet, arProvider.walletAddress]);

	React.useEffect(() => {
		(async function () {
			if (arProvider.wallet && arProvider.walletAddress) {
				const fetchProfileUntilChange = async () => {
					let changeDetected = false;
					let tries = 0;
					const maxTries = 10;

					while (!changeDetected && tries < maxTries) {
						try {
							const existingProfile = profile;
							const newProfile = await libs.getProfileByWalletAddress(arProvider.walletAddress);

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
	}, [refreshProfileTrigger]);

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
				deps: deps,
				depsMainnet: depsMainnet,
				libs: libs,
				libsMainnet: libsMainnet,
				profile: profile,
				showProfileManager,
				setShowProfileManager,
				refreshProfile: () => setRefreshProfileTrigger((prev) => !prev),
			}}
		>
			{props.children}
			<Panel
				open={showProfileManager}
				header={profile && profile.id ? language.editProfile : `${language.createProfile}!`}
				handleClose={() => setShowProfileManager(false)}
				width={575}
				closeHandlerDisabled
			>
				<ProfileManager
					profile={profile && profile.id ? profile : null}
					handleClose={() => setShowProfileManager(false)}
					handleUpdate={null}
				/>
			</Panel>
		</PermawebContext.Provider>
	);
}

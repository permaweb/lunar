import { Button } from 'components/atoms/Button';
import { Loader } from 'components/atoms/Loader';
import { Modal } from 'components/atoms/Modal';
import { useArweaveProvider } from 'providers/ArweaveProvider';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { useProfileProvider } from 'providers/ProfileProvider';

import { ProfileManager } from '../ProfileManager';

export default function ProfileManagerOverlay() {
	const arProvider = useArweaveProvider();
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const profileProvider = useProfileProvider();

	if (!profileProvider.showProfileManager) return null;

	return (
		<>
			<Modal
				type="panel"
				header={profileProvider.profile?.id ? language.editProfile : language.createProfile}
				onClose={() => profileProvider.setShowProfileManager(false)}
				width={575}
				closeHandlerDisabled
			>
				{profileProvider.state.status === 'loading' ? (
					<Loader relative message={language.profileLoading} />
				) : profileProvider.state.status === 'error' ? (
					<>
						<p role={'alert'}>{language.profileErrors[profileProvider.state.error]}</p>
						<Button type={'alt1'} label={language.refresh} onPress={profileProvider.refreshProfile} />
					</>
				) : (
					<ProfileManager
						key={arProvider.walletAddress}
						profile={profileProvider.profile?.id ? profileProvider.profile : null}
						onClose={() => profileProvider.setShowProfileManager(false)}
						onUpdate={null}
					/>
				)}
			</Modal>
		</>
	);
}

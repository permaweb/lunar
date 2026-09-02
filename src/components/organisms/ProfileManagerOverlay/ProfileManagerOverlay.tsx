import { Modal } from 'components/atoms/Modal';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';

import { ProfileManager } from '../ProfileManager';

export default function ProfileManagerOverlay() {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const permawebProvider = usePermawebProvider();

	if (!permawebProvider.showProfileManager) return null;

	return (
		<>
			<Modal
				type="panel"
				header={permawebProvider.profile?.id ? language.editProfile : language.createProfile}
				onClose={() => permawebProvider.setShowProfileManager(false)}
				width={575}
				closeHandlerDisabled
			>
				<ProfileManager
					profile={permawebProvider.profile?.id ? permawebProvider.profile : null}
					onClose={() => permawebProvider.setShowProfileManager(false)}
					onUpdate={null}
				/>
			</Modal>
		</>
	);
}

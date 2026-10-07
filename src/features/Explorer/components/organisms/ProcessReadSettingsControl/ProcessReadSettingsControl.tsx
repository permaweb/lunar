import React from 'react';

import { Button } from 'components/atoms/Button';
import { Checkbox } from 'components/atoms/Checkbox';
import { Modal } from 'components/atoms/Modal';
import { AoReadSettings } from 'components/organisms/AoReadSettings';
import { ASSETS } from 'helpers/config';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { useProcessReadSettingsProvider } from 'providers/ProcessReadSettingsProvider';

import * as S from './styles';

export default function ProcessReadSettingsControl() {
	const scope = useProcessReadSettingsProvider();
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const [isOpen, setIsOpen] = React.useState(false);
	if (!scope) return null;
	return (
		<>
			<Button
				type="primary"
				icon={ASSETS.settings}
				onPress={() => setIsOpen(true)}
				height={32.5}
				width={32.5}
				iconSize={12.5}
				noMinWidth
				tooltip={language.processReadSettings}
				stopPropagation
				preventDefault
			/>
			{isOpen && (
				<Modal type="panel" width={520} header={language.processReadSettings} onClose={() => setIsOpen(false)}>
					<S.Wrapper>
						<Checkbox
							label={language.useGlobalReadSettings}
							description={language.useGlobalReadSettingsDescription}
							checked={scope.useGlobal}
							disabled={false}
							onSelect={() => scope.onUseGlobalChange(!scope.useGlobal)}
						/>
						<AoReadSettings settings={scope.network} onChange={scope.onNetworkChange} disabled={scope.useGlobal} />
						{scope.hasStorageError && <S.Error role="alert">{language.processReadSettingsSaveError}</S.Error>}
					</S.Wrapper>
				</Modal>
			)}
		</>
	);
}

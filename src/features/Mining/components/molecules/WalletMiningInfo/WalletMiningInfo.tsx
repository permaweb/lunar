import React from 'react';

import { Button } from 'components/atoms/Button';
import { Modal } from 'components/atoms/Modal';
import { ASSETS } from 'helpers/config';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function WalletMiningInfo(props: { updatedAt?: number; isActive: boolean }) {
	const provider = useLanguageProvider();
	const language = provider.object[provider.current];
	const [showInfo, setShowInfo] = React.useState(false);
	return (
		<>
			<Button
				type={'alt1'}
				icon={ASSETS.info}
				tooltip={language.nodeMiningInfo}
				height={32.5}
				width={32.5}
				iconSize={14.5}
				noMinWidth
				onPress={() => setShowInfo(true)}
				active={showInfo}
				stopPropagation
				preventDefault
			/>
			{showInfo && props.isActive && (
				<Modal type={'panel'} width={515} header={language.nodeMiningInfo} onClose={() => setShowInfo(false)}>
					<S.Content>
						<S.Note>{language.walletMiningDescription}</S.Note>
						{props.updatedAt !== undefined && (
							<S.Note>
								{language.walletMiningChecked}: {new Date(props.updatedAt).toLocaleString()}
							</S.Note>
						)}
					</S.Content>
				</Modal>
			)}
		</>
	);
}

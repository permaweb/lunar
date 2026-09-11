import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { Button } from 'components/atoms/Button';
import { Modal } from 'components/atoms/Modal';
import { ASSETS } from 'helpers/config';
import { PINNED_TABS_LIMIT } from 'helpers/pinnedTabs';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePinnedTabsProvider } from 'providers/PinnedTabsProvider';

import * as S from './styles';

const PAGE_SIZE = 25;

export default function PinnedTabsPanel(props: { onClose: () => void }) {
	const navigate = useNavigate();
	const pins = usePinnedTabsProvider();
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const [page, setPage] = React.useState(0);
	const totalPages = Math.max(1, Math.ceil(pins.tabs.length / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages - 1);
	return (
		<Modal type={'panel'} header={language.pinned} width={515} onClose={props.onClose}>
			<S.Content>
				{pins.storageError && <S.Note role={'alert'}>{language.pinsStorageError}</S.Note>}
				{pins.tabs.length === PINNED_TABS_LIMIT && <S.Note role={'status'}>{language.pinsLimit}</S.Note>}
				{!pins.tabs.length && <S.Note>{language.pinsEmpty}</S.Note>}
				<S.List>
					{pins.tabs.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE).map((pin) => (
						<S.Item key={pin.id}>
							<S.Open
								onClick={() => {
									navigate(pin.route);
									props.onClose();
								}}
								title={pin.id}
							>
								<ReactSVG src={ASSETS[pin.type] ?? ASSETS.transaction} />
								<S.Label>
									<span>{pin.label}</span>
									<small>{pin.id}</small>
								</S.Label>
							</S.Open>
							<Button
								type={'alt1'}
								icon={ASSETS.pin}
								iconTone={'yellow'}
								iconFilled
								pressed
								tooltip={language.unpinTab}
								tooltipPosition={'left'}
								height={32.5}
								width={32.5}
								iconSize={14.5}
								noMinWidth
								onPress={() => pins.remove(pin.id)}
							/>
						</S.Item>
					))}
				</S.List>
				{totalPages > 1 && (
					<S.Pagination>
						<Button
							type={'alt3'}
							label={language.previous}
							disabled={currentPage === 0}
							onPress={() => setPage(currentPage - 1)}
						/>
						<S.Note>{language.nodesPage(currentPage + 1, totalPages)}</S.Note>
						<Button
							type={'alt3'}
							label={language.next}
							disabled={currentPage === totalPages - 1}
							onPress={() => setPage(currentPage + 1)}
						/>
					</S.Pagination>
				)}
			</S.Content>
		</Modal>
	);
}

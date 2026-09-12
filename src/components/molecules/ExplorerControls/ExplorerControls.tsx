import React from 'react';
import { ReactSVG } from 'react-svg';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { ASSETS } from 'helpers/config';
import type { PinTarget } from 'helpers/pinnedTabs';
import { normalizePin, PINNED_TABS_LIMIT } from 'helpers/pinnedTabs';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePinnedTabsProvider } from 'providers/PinnedTabsProvider';

import * as S from './styles';

export default function ExplorerControls(props: {
	value: string;
	onValueChange: (value: string) => void;
	valid: boolean;
	loading: boolean;
	onSubmit: () => void;
	isFullscreen: boolean;
	onFullscreen: () => void;
	placeholder?: string;
	actions?: React.ReactNode;
	info?: React.ReactNode;
	pinTarget?: PinTarget;
}) {
	const pins = usePinnedTabsProvider();
	const pin = normalizePin(props.pinTarget);
	const isPinned = !!pin && pins.tabs.some((tab) => tab.id === pin.id);
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const [copied, setCopied] = React.useState<'id' | 'url' | null>(null);
	const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
	React.useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
		},
		[]
	);
	async function handleCopy(type: 'id' | 'url') {
		try {
			await navigator.clipboard.writeText(type === 'id' ? props.value : window.location.href);
			setCopied(type);
			if (timer.current) clearTimeout(timer.current);
			timer.current = setTimeout(() => setCopied(null), 2000);
		} catch (error) {
			console.error('Unable to copy explorer value', error);
		}
	}
	return (
		<S.HeaderWrapper
			onSubmit={(event) => {
				event.preventDefault();
				if (props.valid && !props.loading) props.onSubmit();
			}}
		>
			<S.SearchWrapper>
				<S.SearchInputWrapper>
					<ReactSVG src={ASSETS.search} />
					<FormField
						value={props.value}
						onChange={(event) => props.onValueChange(event.target.value)}
						placeholder={props.placeholder ?? language.explorerSearchInput}
						invalid={{ status: !!props.value && !props.valid, message: null }}
						disabled={props.loading}
						autoFocus
						hideErrorMessage
						sm
					/>
				</S.SearchInputWrapper>
				<Button
					type={'alt1'}
					icon={ASSETS.pin}
					onPress={() => pin && pins.toggle(pin)}
					disabled={!pin || (!isPinned && pins.tabs.length >= PINNED_TABS_LIMIT)}
					pressed={isPinned}
					iconTone={isPinned ? 'yellow' : undefined}
					iconFilled={isPinned}
					height={32.5}
					width={32.5}
					iconSize={12.5}
					noMinWidth
					tooltip={isPinned ? language.unpinTab : language.pinTab}
					stopPropagation
					preventDefault
				/>
				<Button
					type={'alt1'}
					icon={copied === 'id' ? ASSETS.checkmark : ASSETS.copy}
					onPress={() => handleCopy('id')}
					disabled={!props.value}
					height={32.5}
					width={32.5}
					iconSize={12.5}
					noMinWidth
					tooltip={copied === 'id' ? `${language.copied}!` : language.copyId}
					stopPropagation
					preventDefault
				/>
				<Button
					type={'alt1'}
					icon={copied === 'url' ? ASSETS.checkmark : ASSETS.link}
					onPress={() => handleCopy('url')}
					disabled={!props.value}
					height={32.5}
					width={32.5}
					iconSize={12.5}
					noMinWidth
					tooltip={copied === 'url' ? `${language.copied}!` : language.copyFullUrl}
					stopPropagation
					preventDefault
				/>
				<Button
					type={'alt1'}
					icon={ASSETS.fullscreen}
					onPress={props.onFullscreen}
					height={32.5}
					width={32.5}
					iconSize={12.5}
					noMinWidth
					tooltip={props.isFullscreen ? language.exitFullScreen : language.enterFullScreen}
					stopPropagation
					preventDefault
				/>
				<Button
					type={'alt1'}
					icon={ASSETS.refresh}
					onPress={props.onSubmit}
					disabled={props.loading || !props.valid}
					height={32.5}
					width={32.5}
					iconSize={12.5}
					noMinWidth
					tooltip={language.refresh}
					stopPropagation
					preventDefault
				/>
				{props.actions}
			</S.SearchWrapper>
			<S.HeaderActionsWrapper>{props.info}</S.HeaderActionsWrapper>
		</S.HeaderWrapper>
	);
}

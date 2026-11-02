import React from 'react';
import { useLocation } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { getArweaveNodeRoute } from 'helpers/arweaveNode';
import { ASSETS, URLS } from 'helpers/config';
import { parseAccountIdentity } from 'helpers/identities';
import { checkValidAddress, checkValidEthereumAddress, formatCount, getTagValue } from 'helpers/utils';
import { useExplorerNavigation } from 'hooks/useExplorerNavigation';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { store } from 'store';
import { selectTransaction } from 'store/transactions/reducer';

import * as S from './styles';
import { ExplorerLinkProps } from './types';

export default function ExplorerLink(props: ExplorerLinkProps) {
	const { isInAppTabsEnabled, openExplorer } = useExplorerNavigation();
	const location = useLocation();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const [copied, setCopied] = React.useState<boolean>(false);
	const [isModifierKeyPressed, setIsModifierKeyPressed] = React.useState<boolean>(false);
	const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	const value = props.value !== null && props.value !== undefined ? props.value.toString() : '';
	const identity = parseAccountIdentity(value);
	const isCopyOnly = props.type === 'address' && !checkValidAddress(value) && !checkValidEthereumAddress(value);
	const cached =
		props.label === undefined && props.type !== 'block' && props.type !== 'arweave-node'
			? selectTransaction(store.getState(), value)
			: null;
	const cachedName = cached ? getTagValue(cached.node?.tags, 'Name') : null;
	const truncatedName =
		cachedName && props.nameMaxLength && cachedName.length > props.nameMaxLength
			? `${cachedName.slice(0, Math.max(0, props.nameMaxLength - 3))}...`
			: cachedName;

	// Check if the current value is already in the URL (already on this explorer tab)
	const route = props.type === 'arweave-node' ? getArweaveNodeRoute(value) : `${URLS.explorer}${value}`;
	const isCurrentTab = location.pathname === route || location.pathname.startsWith(`${route}/`);
	const isBrowserTabShortcut = !isInAppTabsEnabled && isModifierKeyPressed;
	const actionLabel = isBrowserTabShortcut
		? language.openInNewTab
		: isCurrentTab || isModifierKeyPressed
		? language.copy
		: language.inspect;

	const copyValue = React.useCallback(
		async (e: React.MouseEvent, target = value) => {
			e.preventDefault();
			e.stopPropagation();
			if (!target) return;
			try {
				await navigator.clipboard.writeText(target);
				setCopied(true);
				if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
				copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
			} catch {
				console.error('Unable to copy explorer value');
			}
		},
		[value]
	);

	React.useEffect(() => {
		return () => {
			if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
		};
	}, []);

	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			setIsModifierKeyPressed(e.metaKey || e.ctrlKey);
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			setIsModifierKeyPressed(e.metaKey || e.ctrlKey);
		};

		const resetModifierState = () => {
			setIsModifierKeyPressed(false);
		};

		const handleVisibilityChange = () => {
			if (document.hidden) resetModifierState();
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		window.addEventListener('blur', resetModifierState);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			window.removeEventListener('blur', resetModifierState);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, []);

	const handleMouseModifierState = React.useCallback((e: React.MouseEvent) => {
		setIsModifierKeyPressed(e.metaKey || e.ctrlKey);
	}, []);

	const handleClick = React.useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			if (!isInAppTabsEnabled && (e.metaKey || e.ctrlKey)) return;
			e.preventDefault();
			if (value && !copied) {
				// If already on current tab, only allow copy
				if (isCurrentTab) {
					copyValue(e);
				} else if (e.metaKey || e.ctrlKey) {
					copyValue(e);
				} else {
					if (props.onPress) props.onPress();
					openExplorer(route);
				}
			}
		},
		[value, copied, copyValue, openExplorer, props.onPress, isCurrentTab, isInAppTabsEnabled, route]
	);

	function getLabel() {
		if (props.label !== undefined) return props.label;

		if (props.type === 'block') {
			return formatCount(value);
		}

		if (truncatedName) return truncatedName;

		if (identity) {
			const address = identity.address;
			const label = `${address.slice(0, 5)}...${address.slice(-5)}`;
			return props.wrap ? `(${label})` : label;
		}

		return value;
	}

	if (!value) return <p>-</p>;
	if (isCopyOnly) {
		const address = identity?.address ?? value;
		const copyLabel = identity ? language.copyAddress : language.copyIdentity;
		return (
			<S.Wrapper as="span" $copied={copied} title={value}>
				<S.CopyControl
					type="button"
					title={`${copyLabel}: ${address}`}
					aria-label={`${copyLabel}: ${address}`}
					onClick={(event) => copyValue(event, address)}
				>
					<span aria-live="polite">{copied ? `${language.copied}!` : getLabel()}</span>
				</S.CopyControl>
				{props.showIcon !== false && (
					<S.CopyControl
						type="button"
						title={`${language.copyIdentity}: ${value}`}
						aria-label={`${language.copyIdentity}: ${value}`}
						onClick={copyValue}
						$icon
					>
						<ReactSVG src={ASSETS.copy} aria-hidden="true" />
					</S.CopyControl>
				)}
			</S.Wrapper>
		);
	}

	return (
		<S.Wrapper
			as={'a'}
			href={`#${route}`}
			title={value}
			$copied={copied}
			onClick={handleClick}
			onMouseEnter={handleMouseModifierState}
			onMouseMove={handleMouseModifierState}
		>
			<p title={!copied && truncatedName !== cachedName ? cachedName : undefined}>
				{copied ? `${language.copied}!` : getLabel()}
			</p>
			{props.showIcon !== false && (
				<S.IconWrapper>
					{!copied && (
						<S.Tooltip className={'info'} position={props.tooltipPosition ?? 'top-right'}>
							<span>{actionLabel}</span>
						</S.Tooltip>
					)}
					<ReactSVG
						src={isCurrentTab && !isBrowserTabShortcut ? ASSETS.copy : props.viewIcon ?? ASSETS.newTab}
						onClick={handleClick}
					/>
				</S.IconWrapper>
			)}
		</S.Wrapper>
	);
}

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { getArweaveNodeRoute } from 'helpers/arweaveNode';
import { ASSETS, URLS } from 'helpers/config';
import { checkValidAddress, formatAddress, formatCount, getTagValue } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { store } from 'store';
import { selectTransaction } from 'store/transactions/reducer';

import * as S from './styles';
import { ExplorerLinkProps } from './types';

export default function ExplorerLink(props: ExplorerLinkProps) {
	const navigate = useNavigate();
	const location = useLocation();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const [copied, setCopied] = React.useState<boolean>(false);
	const [isModifierKeyPressed, setIsModifierKeyPressed] = React.useState<boolean>(false);

	const value = props.value !== null && props.value !== undefined ? props.value.toString() : '';
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

	const copyValue = React.useCallback(
		async (e: any) => {
			if (value.length > 0) {
				e.stopPropagation();
				await navigator.clipboard.writeText(value);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			}
		},
		[value]
	);

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
		(e: any) => {
			e.preventDefault();
			e.stopPropagation();
			if (value && !copied) {
				// If already on current tab, only allow copy
				if (isCurrentTab) {
					copyValue(e);
				} else if (e.metaKey || e.ctrlKey) {
					copyValue(e);
				} else {
					if (props.onPress) props.onPress();
					navigate(route);
				}
			}
		},
		[value, copied, copyValue, navigate, props.onPress, isCurrentTab, route]
	);

	function getLabel() {
		if (props.label !== undefined) return props.label;

		if (props.type === 'block') {
			return formatCount(value);
		}

		if (truncatedName) return truncatedName;

		if (checkValidAddress(value)) return formatAddress(value, props.wrap);

		return value;
	}

	if (!value) return <p>-</p>;

	return (
		<S.Wrapper
			as={'a'}
			href={`#${route}`}
			title={value}
			disabled={copied}
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
							<span>{isCurrentTab ? language.copy : isModifierKeyPressed ? language.copy : language.inspect}</span>
						</S.Tooltip>
					)}
					<ReactSVG src={isCurrentTab ? ASSETS.copy : props.viewIcon ?? ASSETS.newTab} onClick={handleClick} />
				</S.IconWrapper>
			)}
		</S.Wrapper>
	);
}

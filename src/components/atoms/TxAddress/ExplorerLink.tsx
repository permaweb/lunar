import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { ASSETS, URLS } from 'helpers/config';
import { checkValidAddress, formatAddress, formatCount, getTagValue } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { store } from 'store';
import { selectTransaction } from 'store/transactions/reducer';

import * as S from './styles';
import { ExplorerLinkProps } from './types';

export default function ExplorerLink(props: ExplorerLinkProps) {
	const navigate = useNavigate();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const [copied, setCopied] = React.useState<boolean>(false);
	const [isModifierKeyPressed, setIsModifierKeyPressed] = React.useState<boolean>(false);

	const value = props.value !== null && props.value !== undefined ? props.value.toString() : '';

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
			if (e.metaKey || e.ctrlKey) {
				setIsModifierKeyPressed(true);
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (!e.metaKey && !e.ctrlKey) {
				setIsModifierKeyPressed(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, []);

	const handleClick = React.useCallback(
		(e: any) => {
			e.stopPropagation();
			if (value && !copied) {
				if (e.metaKey || e.ctrlKey) {
					copyValue(e);
				} else {
					if (props.handlePress) props.handlePress();
					navigate(`${URLS.explorer}${value}`);
				}
			}
		},
		[value, copied, copyValue, navigate, props.handlePress]
	);

	function getLabel() {
		if (props.label !== undefined) return props.label;

		if (props.type === 'block') {
			return formatCount(value);
		}

		const cached = selectTransaction(store.getState(), value);
		if (cached) {
			return getTagValue(cached.node?.tags, 'Name') ?? formatAddress(value, props.wrap);
		}

		if (checkValidAddress(value)) return formatAddress(value, props.wrap);

		return value;
	}

	if (!value) return <p>-</p>;

	return (
		<S.Wrapper disabled={copied} onClick={handleClick}>
			<p>{copied ? `${language.copied}!` : getLabel()}</p>
			{props.showIcon !== false && (
				<S.IconWrapper>
					{!copied && (
						<S.Tooltip className={'info'} position={props.tooltipPosition ?? 'top-right'}>
							<span>{isModifierKeyPressed ? language.copy : language.openInNewTab}</span>
						</S.Tooltip>
					)}
					<ReactSVG src={props.viewIcon ?? ASSETS.newTab} onClick={handleClick} />
				</S.IconWrapper>
			)}
		</S.Wrapper>
	);
}

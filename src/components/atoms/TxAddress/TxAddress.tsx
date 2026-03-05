import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { ASSETS, URLS } from 'helpers/config';
import { formatAddress } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';
import { IProps } from './types';

export default function TxAddress(props: IProps) {
	const navigate = useNavigate();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const [copied, setCopied] = React.useState<boolean>(false);
	const [isModifierKeyPressed, setIsModifierKeyPressed] = React.useState<boolean>(false);

	const copyAddress = React.useCallback(
		async (e: any) => {
			if (props.address) {
				if (props.address.length > 0) {
					e.stopPropagation();
					await navigator.clipboard.writeText(props.address);
					setCopied(true);
					setTimeout(() => setCopied(false), 2000);
				}
			}
		},
		[props.address]
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
			if (props.address && !copied) {
				// Check if cmd (meta) or ctrl key is pressed
				if (e.metaKey || e.ctrlKey) {
					copyAddress(e);
				} else {
					if (props.handlePress) props.handlePress();
					navigate(`${URLS.explorer}${props.address}`);
				}
			}
		},
		[props.address, copied, copyAddress, navigate, props.handlePress]
	);

	return (
		<>
			<S.Wrapper disabled={copied} onClick={handleClick}>
				<p>{copied ? `${language.copied}!` : formatAddress(props.address, props.wrap)}</p>
				<S.IconWrapper>
					{!copied && (
						<S.Tooltip className={'info'} position={props.tooltipPosition ?? 'top-right'}>
							<span>{isModifierKeyPressed ? 'Copy Address' : language.openInNewTab}</span>
						</S.Tooltip>
					)}
					<ReactSVG src={ASSETS.newTab} onClick={handleClick} />
				</S.IconWrapper>
			</S.Wrapper>
		</>
	);
}

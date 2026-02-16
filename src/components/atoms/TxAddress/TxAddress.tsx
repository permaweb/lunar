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

	const openExplorer = React.useCallback(
		(e: any) => {
			e.stopPropagation();
			if (props.address && !copied) {
				navigate(`${URLS.explorer}${props.address}`);
			}
		},
		[props.address, copied]
	);

	return (
		<>
			<S.Wrapper disabled={copied} onClick={copied ? () => {} : (e) => copyAddress(e)}>
				<p>{copied ? `${language.copied}!` : formatAddress(props.address, props.wrap)}</p>
				<S.IconWrapper>
					{!copied && (
						<S.Tooltip className={'info'} position={'top-right'}>
							<span>{language.openInNewTab}</span>
						</S.Tooltip>
					)}
					<ReactSVG src={ASSETS.newTab} onClick={openExplorer} />
				</S.IconWrapper>
			</S.Wrapper>
		</>
	);
}

import React from 'react';
import { ReactSVG } from 'react-svg';

import { ASSETS } from 'helpers/config';
import { language as fallbackLanguage } from 'helpers/language';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';
import { IProps } from './types';

export default function Notification(props: IProps) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider?.object?.[languageProvider.current] ?? fallbackLanguage.en;

	const [show, setShow] = React.useState<boolean>(true);

	function handleClose() {
		setShow(false);
		if (props.callback) props.callback();
	}

	React.useEffect(() => {
		if (show && !props.persistent) {
			const timer = setTimeout(
				() => {
					handleClose();
				},
				props.type === 'warning' ? 10000 : 5000
			);

			return () => clearTimeout(timer);
		}
	}, [show, props.type, props.persistent]);

	return show ? (
		<S.Wrapper warning={props.type === 'warning'} className={'info'}>
			<S.MessageWrapper>
				<S.Icon type={props.type}>
					<ReactSVG
						src={props.type === 'warning' ? ASSETS.warning : props.type === 'info' ? ASSETS.info : ASSETS.checkmark}
					/>
				</S.Icon>
				<S.Message>{props.message}</S.Message>
			</S.MessageWrapper>
			<S.Close onClick={handleClose}>
				<p>{language?.dismiss ?? 'Dismiss'}</p>
			</S.Close>
		</S.Wrapper>
	) : null;
}

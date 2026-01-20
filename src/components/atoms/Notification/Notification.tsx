import React from 'react';
import { ReactSVG } from 'react-svg';

import { ASSETS, DOM } from 'helpers/config';

import { Portal } from '../Portal';

import * as S from './styles';
import { IProps } from './types';

export default function Notification(props: IProps) {
	const [show, setShow] = React.useState<boolean>(true);

	function handleClose() {
		setShow(false);
		if (props.callback) props.callback();
	}

	React.useEffect(() => {
		if (show && props.type !== 'warning') {
			const timer = setTimeout(() => {
				handleClose();
			}, 5000);

			return () => clearTimeout(timer);
		}
	}, [show, props.type]);

	return show ? (
		<Portal node={DOM.notification}>
			<S.Wrapper warning={props.type === 'warning'} className={'info'}>
				<S.MessageWrapper>
					{props.type && (
						<S.Icon warning={props.type === 'warning'}>
							<ReactSVG src={props.type === 'warning' ? ASSETS.warning : ASSETS.checkmark} />
						</S.Icon>
					)}
					<S.Message>{props.message}</S.Message>
				</S.MessageWrapper>
				<S.Close onClick={handleClose}>
					<p>Dismiss</p>
				</S.Close>
			</S.Wrapper>
		</Portal>
	) : null;
}

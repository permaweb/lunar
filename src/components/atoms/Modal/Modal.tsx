import React from 'react';

import { Button } from 'components/atoms/Button';
import { Portal } from 'components/atoms/Portal';
import { ASSETS, DOM } from 'helpers/config';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { CloseHandler } from 'wrappers/CloseHandler';

import * as S from './styles';
import { IProps } from './types';

export default function Modal(props: IProps) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider?.object?.[languageProvider.current] || { close: 'Close' };

	const escFunction = React.useCallback(
		(e: any) => {
			if (e.key === 'Escape' && props.handleClose && !props.closeHandlerDisabled) {
				props.handleClose();
			}
		},
		[props]
	);

	React.useEffect(() => {
		hideDocumentBody();
		return () => {
			showDocumentBody();
		};
	}, []);

	React.useEffect(() => {
		document.addEventListener('keydown', escFunction, false);

		return () => {
			document.removeEventListener('keydown', escFunction, false);
		};
	}, [escFunction]);

	function getBodyClassName() {
		let className = '';
		if (!props.allowOverflow) className += 'scroll-wrapper';
		return className;
	}

	// Determine which components to use based on type
	let Container;
	let Body;
	const modalType = props.type || 'modal';
	switch (modalType) {
		case 'modal':
			Container = S.Container;
			Body = S.Body;
			break;
		case 'panel':
			Container = S.Panel;
			Body = S.PanelBody;
			break;
		default:
			Container = S.Container;
			Body = S.Body;
			break;
	}

	// Create the content
	const content = (
		<>
			{props.header && (
				<S.Header>
					<S.LT>
						<S.Title>{props.header}</S.Title>
					</S.LT>
					{props.handleClose && (
						<S.Close>
							<Button
								type={'alt1'}
								icon={ASSETS.close}
								handlePress={() => props.handleClose()}
								active={false}
								height={30}
								width={30}
								noMinWidth
								iconSize={16}
								tooltip={language.close}
								stopPropagation
								preventDefault
							/>
						</S.Close>
					)}
				</S.Header>
			)}
			<Body className={getBodyClassName()}>{props.children}</Body>
		</>
	);

	// Wrap Panel content with CloseHandler if it's a panel and not disabled
	const containerContent =
		modalType === 'panel' && !props.closeHandlerDisabled ? (
			<Container $noHeader={!props.header} width={props.width} className={'border-wrapper-primary'}>
				<CloseHandler active={true} disabled={false} callback={() => props.handleClose && props.handleClose()}>
					{content}
				</CloseHandler>
			</Container>
		) : (
			<Container $noHeader={!props.header} width={props.width} className={'border-wrapper-primary'}>
				{content}
			</Container>
		);

	return (
		<Portal node={DOM.overlay}>
			<S.Wrapper $noHeader={!props.header} $top={window ? (window as any).pageYOffset : 0}>
				{containerContent}
			</S.Wrapper>
		</Portal>
	);
}

let modalOpenCounter = 0;

const showDocumentBody = () => {
	modalOpenCounter -= 1;
	if (modalOpenCounter === 0) {
		document.body.style.overflowY = 'auto';
	}
};

const hideDocumentBody = () => {
	modalOpenCounter += 1;
	document.body.style.overflowY = 'hidden';
};

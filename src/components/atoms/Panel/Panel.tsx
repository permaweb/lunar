import React from 'react';

import { IconButton } from 'components/atoms/IconButton';
import { Portal } from 'components/atoms/Portal';
import { ASSETS, DOM } from 'helpers/config';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { CloseHandler } from 'wrappers/CloseHandler';

import * as S from './styles';
import { IProps } from './types';

export default function Panel(props: IProps) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const bodyRef = React.useRef<HTMLDivElement>(null);
	const [hasOverflow, setHasOverflow] = React.useState(false);
	const [isFullscreen, setIsFullscreen] = React.useState(false);

	React.useEffect(() => {
		if (props.open) {
			hideDocumentBody();
			return () => {
				showDocumentBody();
			};
		}
	}, [props.open]);

	const escFunction = React.useCallback(
		(e: any) => {
			if (e.key === 'Escape' && props.handleClose && !props.closeHandlerDisabled) {
				props.handleClose();
			}
		},
		[props]
	);

	React.useEffect(() => {
		document.addEventListener('keydown', escFunction, false);

		return () => {
			document.removeEventListener('keydown', escFunction, false);
		};
	}, [escFunction]);

	React.useEffect(() => {
		const checkOverflow = () => {
			if (bodyRef.current) {
				const hasScrollbar = bodyRef.current.scrollHeight > bodyRef.current.clientHeight;
				setHasOverflow(hasScrollbar);
			}
		};

		checkOverflow();
		const observer = new ResizeObserver(checkOverflow);
		if (bodyRef.current) {
			observer.observe(bodyRef.current);
		}

		return () => observer.disconnect();
	}, [props.children, props.open]);

	React.useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(document.fullscreenElement !== null);
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	}, []);

	function getHeader() {
		switch (typeof props.header) {
			case 'string':
				return <S.Title>{props.header}</S.Title>;
			case 'object':
				return props.header;
		}
	}

	function getBody() {
		return (
			<>
				<S.Container open={props.open} noHeader={!props.header} width={props.width} className={'border-wrapper-alt1'}>
					<CloseHandler
						active={props.open && !props.closeHandlerDisabled}
						disabled={!props.open || props.closeHandlerDisabled}
						callback={() => props.handleClose()}
					>
						{props.header && (
							<S.Header>
								<S.LT>{getHeader()}</S.LT>
								{props.handleClose && (
									<S.Close>
										<IconButton
											type={'alt1'}
											warning
											src={ASSETS.close}
											handlePress={() => props.handleClose()}
											active={false}
											dimensions={{
												wrapper: 32.5,
												icon: 16.5,
											}}
											tooltip={language.close}
										/>
									</S.Close>
								)}
							</S.Header>
						)}
						<S.Body hasOverflow={hasOverflow}>
							<S.BodyContent ref={bodyRef} className={'scroll-wrapper'}>
								{props.children}
							</S.BodyContent>
						</S.Body>
					</CloseHandler>
				</S.Container>
			</>
		);
	}

	// If in fullscreen, render directly instead of using portal
	if (isFullscreen) {
		return (
			<>
				{getBody()}
				<S.PanelOverlay open={props.open} />
			</>
		);
	}

	return (
		<Portal node={DOM.overlay}>
			{getBody()}
			<S.PanelOverlay open={props.open} />
		</Portal>
	);
}

let panelOpenCounter = 0;

const showDocumentBody = () => {
	panelOpenCounter -= 1;
	if (panelOpenCounter === 0) {
		document.body.style.overflowY = 'auto';
	}
};

const hideDocumentBody = () => {
	panelOpenCounter += 1;
	document.body.style.overflowY = 'hidden';
};

import React from 'react';

import { Button } from 'components/atoms/Button';
import { Portal } from 'components/atoms/Portal';
import { transitionExitMs } from 'helpers/animations';
import { ASSETS, DOM } from 'helpers/config';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { CloseHandler } from 'wrappers/CloseHandler';

import * as S from './styles';
import { IProps } from './types';

export default function Modal(props: IProps) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider?.object?.[languageProvider.current] || { close: 'Close' };
	const titleId = React.useId();
	const previousFocus = React.useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
	const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
	const [isBodyScrolled, setIsBodyScrolled] = React.useState(false);
	const [isClosing, setIsClosing] = React.useState(false);
	const closeTimeoutRef = React.useRef<number | null>(null);
	React.useEffect(() => {
		if (!container) return;
		const focusable = () =>
			Array.from(
				container.querySelectorAll<HTMLElement>(
					'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
				)
			).filter(
				(element) => element.getAttribute('aria-hidden') !== 'true' && getComputedStyle(element).display !== 'none'
			);
		// Start in the first text field; without one, focus the dialog itself so the close button is not preselected.
		(focusable().find((element) => element.matches('input:not([type="file"])')) ?? container).focus();
		function handleTab(event: KeyboardEvent) {
			if (event.key !== 'Tab') return;
			const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
			if (dialogs[dialogs.length - 1] !== container) return;
			const elements = focusable();
			const first = elements[0] ?? container;
			const last = elements[elements.length - 1] ?? container;
			if (
				event.shiftKey &&
				(document.activeElement === first ||
					document.activeElement === container ||
					!container.contains(document.activeElement))
			) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) {
				event.preventDefault();
				first.focus();
			}
		}
		document.addEventListener('keydown', handleTab);
		return () => {
			document.removeEventListener('keydown', handleTab);
			previousFocus.current?.focus();
		};
	}, [container]);

	// Parents unmount a modal as soon as it closes, so panels slide out first and report the close afterwards.
	const handleClose = React.useCallback(() => {
		if (!props.onClose || closeTimeoutRef.current !== null) return;
		if (props.type !== 'panel' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
			props.onClose();
			return;
		}
		setIsClosing(true);
		closeTimeoutRef.current = window.setTimeout(() => props.onClose(), transitionExitMs);
	}, [props]);

	React.useEffect(() => {
		return () => {
			if (closeTimeoutRef.current !== null) window.clearTimeout(closeTimeoutRef.current);
		};
	}, []);

	const escFunction = React.useCallback(
		(e: any) => {
			if (e.key === 'Escape' && props.onClose && !props.closeHandlerDisabled) {
				handleClose();
			}
		},
		[props.onClose, props.closeHandlerDisabled, handleClose]
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

	function handleBodyScroll(event: React.UIEvent<HTMLDivElement>) {
		setIsBodyScrolled(event.currentTarget.scrollTop > 0);
	}

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
		case 'spotlight':
			Container = S.Spotlight;
			Body = S.SpotlightBody;
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
				<S.Header $scrolled={modalType === 'panel' ? isBodyScrolled : undefined}>
					<S.LT>
						<S.Title id={titleId}>{props.header}</S.Title>
					</S.LT>
					{props.onClose && (
						<S.Close>
							<Button
								type={'alt1'}
								icon={ASSETS.close}
								onPress={handleClose}
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
			<Body className={getBodyClassName()} onScroll={handleBodyScroll}>
				{props.children}
			</Body>
		</>
	);

	// Wrap Panel content with CloseHandler if it's a panel and not disabled
	const containerContent =
		modalType === 'panel' && !props.closeHandlerDisabled ? (
			<Container
				$noHeader={!props.header}
				width={props.width}
				$closing={isClosing}
				className={'border-wrapper-primary'}
			>
				<CloseHandler active={true} disabled={false} callback={handleClose}>
					{content}
				</CloseHandler>
			</Container>
		) : (
			<Container
				$noHeader={!props.header}
				width={props.width}
				$closing={isClosing}
				className={modalType === 'spotlight' ? undefined : 'border-wrapper-primary'}
			>
				{content}
			</Container>
		);

	return (
		<Portal node={DOM.overlay} container={document.fullscreenElement}>
			<S.Wrapper
				ref={setContainer}
				role={'dialog'}
				aria-modal={'true'}
				aria-label={props['aria-label']}
				aria-labelledby={props.header ? titleId : undefined}
				tabIndex={-1}
				$noHeader={!props.header}
				$closing={isClosing}
				$spotlight={modalType === 'spotlight'}
				$top={window ? (window as any).pageYOffset : 0}
				onClick={(event) => {
					if (modalType === 'spotlight' && event.target === event.currentTarget && !props.closeHandlerDisabled) {
						handleClose();
					}
				}}
			>
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

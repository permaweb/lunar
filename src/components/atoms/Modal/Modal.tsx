import React from 'react';

import { Button } from 'components/atoms/Button';
import { Portal } from 'components/atoms/Portal';
import { ASSETS, DOM } from 'helpers/config';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { CloseHandler } from 'wrappers/CloseHandler';

import * as S from './styles';
import { IProps } from './types';

const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal(props: IProps) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider?.object?.[languageProvider.current] || { close: 'Close' };
	const titleId = React.useId();
	const dialogRef = React.useRef<HTMLDivElement | null>(null);
	const restoreFocusRef = React.useRef<HTMLElement | null>(null);

	// Portal content mounts after Modal's effects, so focus when its actual dialog is attached.
	const handleDialogRef = React.useCallback((node: HTMLDivElement | null) => {
		dialogRef.current = node;
		if (node) {
			restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
			(node.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) || node).focus();
		} else if (restoreFocusRef.current?.isConnected) {
			restoreFocusRef.current.focus();
		}
	}, []);

	const escFunction = React.useCallback(
		(e: KeyboardEvent) => {
			const dialog = dialogRef.current;
			const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
			if (!dialog || dialogs[dialogs.length - 1] !== dialog || e.defaultPrevented) return;
			if (e.key === 'Escape' && props.onClose && !props.closeHandlerDisabled) {
				e.preventDefault();
				props.onClose();
			}
			if (e.key === 'Tab') {
				const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
					(element) => !element.closest('[hidden]') && getComputedStyle(element).display !== 'none'
				);
				const first = focusable[0] || dialog;
				const last = focusable[focusable.length - 1] || dialog;
				if (!dialog.contains(document.activeElement) || document.activeElement === dialog) {
					e.preventDefault();
					(e.shiftKey ? last : first).focus();
				} else if (e.shiftKey && document.activeElement === first) {
					e.preventDefault();
					last.focus();
				} else if (!e.shiftKey && document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
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
						<S.Title id={titleId}>{props.header}</S.Title>
					</S.LT>
					{props.onClose && (
						<S.Close>
							<Button
								type={'alt1'}
								icon={ASSETS.close}
								onPress={() => props.onClose()}
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
			<Container
				ref={handleDialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={props.header ? titleId : undefined}
				tabIndex={-1}
				$noHeader={!props.header}
				width={props.width}
				className={'border-wrapper-primary'}
			>
				<CloseHandler active={true} disabled={false} callback={() => props.onClose && props.onClose()}>
					{content}
				</CloseHandler>
			</Container>
		) : (
			<Container
				ref={handleDialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={props.header ? titleId : undefined}
				tabIndex={-1}
				$noHeader={!props.header}
				width={props.width}
				className={'border-wrapper-primary'}
			>
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

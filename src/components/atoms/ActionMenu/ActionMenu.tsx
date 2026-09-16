import React from 'react';
import { ReactSVG } from 'react-svg';

import { Button } from 'components/atoms/Button';
import { ASSETS } from 'helpers/config';

import * as S from './styles';

export type ActionMenuItem = {
	id: string;
	label: string;
	icon?: string;
	onSelect: () => void;
};

export default function ActionMenu(props: {
	label?: string;
	ariaLabel: string;
	icon?: string;
	items: ActionMenuItem[];
}) {
	const menuId = React.useId();
	const triggerId = React.useId();
	const wrapperRef = React.useRef<HTMLDivElement>(null);
	const triggerRef = React.useRef<HTMLButtonElement>(null);
	const menuRef = React.useRef<HTMLDivElement>(null);
	const focusLastRef = React.useRef(false);
	const [isOpen, setIsOpen] = React.useState(false);

	React.useEffect(() => {
		if (!isOpen) return;
		const items = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
		items?.[focusLastRef.current ? items.length - 1 : 0]?.focus();

		function handleOutside(event: Event) {
			if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) setIsOpen(false);
		}

		document.addEventListener('pointerdown', handleOutside);
		document.addEventListener('focusin', handleOutside);
		return () => {
			document.removeEventListener('pointerdown', handleOutside);
			document.removeEventListener('focusin', handleOutside);
		};
	}, [isOpen]);

	function handleClose() {
		setIsOpen(false);
		triggerRef.current?.focus();
	}

	function handleToggle() {
		focusLastRef.current = false;
		setIsOpen((previous) => !previous);
	}

	function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
		event.preventDefault();
		focusLastRef.current = event.key === 'ArrowUp';
		setIsOpen(true);
	}

	function handleMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			handleClose();
			return;
		}
		if (event.key === 'Tab') {
			handleClose();
			return;
		}
		if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
		event.preventDefault();
		const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
		const currentIndex = items.findIndex((item) => item === document.activeElement);
		const nextIndex =
			event.key === 'Home'
				? 0
				: event.key === 'End'
				? items.length - 1
				: (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
		items[nextIndex]?.focus();
	}

	const triggerProps = {
		ref: triggerRef,
		id: triggerId,
		'aria-label': props.ariaLabel,
		'aria-haspopup': 'menu' as const,
		'aria-expanded': isOpen,
		'aria-controls': isOpen ? menuId : undefined,
		onKeyDown: handleTriggerKeyDown,
	};

	return (
		<S.Wrapper ref={wrapperRef}>
			<Button
				{...triggerProps}
				type="primary"
				label={props.label ?? undefined}
				icon={props.icon ?? ASSETS.ellipsisHorizontal}
				onPress={handleToggle}
				height={32}
				width={props.label ? undefined : 32.5}
				iconSize={16}
			/>
			{isOpen && (
				<S.Menu
					ref={menuRef}
					id={menuId}
					role="menu"
					aria-labelledby={triggerId}
					className="border-wrapper-alt4"
					onKeyDown={handleMenuKeyDown}
				>
					{props.items.map((item) => (
						<S.Item
							key={item.id}
							type="button"
							role="menuitem"
							tabIndex={-1}
							onClick={() => {
								handleClose();
								item.onSelect();
							}}
						>
							{item.icon && <ReactSVG src={item.icon} aria-hidden="true" />}
							<span>{item.label}</span>
						</S.Item>
					))}
				</S.Menu>
			)}
		</S.Wrapper>
	);
}

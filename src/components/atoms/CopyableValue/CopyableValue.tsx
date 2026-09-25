import React from 'react';
import ReactDOM from 'react-dom';

import * as S from './styles';

export default function CopyableValue(props: {
	value: string;
	copiedLabel: string;
	tooltipPlacement?: 'top' | 'bottom';
	fullWidth?: boolean;
	tone?: 'default' | 'accent' | 'muted';
}) {
	const tooltipId = React.useId();

	const buttonRef = React.useRef<HTMLButtonElement | null>(null);
	const [copied, setCopied] = React.useState<boolean>(false);
	const [tooltipVisible, setTooltipVisible] = React.useState<boolean>(false);
	const [tooltipPosition, setTooltipPosition] = React.useState<{
		top?: number;
		bottom?: number;
		left?: number;
		right?: number;
		maxWidth: number;
	} | null>(null);
	const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	const updateTooltipPosition = React.useCallback(() => {
		const element = buttonRef.current;
		if (!element) return;

		const rect = element.getBoundingClientRect();
		const viewportPadding = 10;
		const gap = 3.5;
		const minReadableWidth = 160;
		const shouldAlignLeft = rect.right - viewportPadding < minReadableWidth;
		const horizontalPosition = shouldAlignLeft
			? {
					left: Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - viewportPadding)),
					maxWidth: Math.min(400, window.innerWidth - Math.max(viewportPadding, rect.left) - viewportPadding),
			  }
			: {
					right: window.innerWidth - Math.min(rect.right, window.innerWidth - viewportPadding),
					maxWidth: Math.min(400, rect.right - viewportPadding),
			  };

		setTooltipPosition(
			props.tooltipPlacement === 'bottom'
				? { top: rect.bottom + gap, ...horizontalPosition }
				: { bottom: window.innerHeight - rect.top + gap, ...horizontalPosition }
		);
	}, [props.tooltipPlacement]);

	React.useEffect(() => {
		return () => {
			if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
		};
	}, []);

	React.useEffect(() => {
		if (!tooltipVisible) return;

		updateTooltipPosition();
		window.addEventListener('resize', updateTooltipPosition);
		window.addEventListener('scroll', updateTooltipPosition, true);

		return () => {
			window.removeEventListener('resize', updateTooltipPosition);
			window.removeEventListener('scroll', updateTooltipPosition, true);
		};
	}, [tooltipVisible, updateTooltipPosition]);

	async function handleCopy(e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		if (!props.value) return;

		try {
			await navigator.clipboard.writeText(props.value);
		} catch (error) {
			console.error('Unable to copy value', error);
			return;
		}
		setCopied(true);
		setTooltipVisible(true);

		if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
		copyTimeoutRef.current = setTimeout(() => {
			setCopied(false);
			setTooltipVisible(false);
		}, 2000);
	}

	function handleHideTooltip() {
		setTooltipVisible(false);
	}

	function handleShowTooltip() {
		updateTooltipPosition();
		setTooltipVisible(true);
	}

	return (
		<S.Value
			$fullWidth={props.fullWidth}
			$tone={props.tone}
			aria-describedby={tooltipVisible ? tooltipId : undefined}
			onKeyDown={(event) => {
				if (event.key === 'Escape') handleHideTooltip();
			}}
			ref={buttonRef}
			type={'button'}
			onBlur={handleHideTooltip}
			onClick={handleCopy}
			onFocus={handleShowTooltip}
			onMouseEnter={handleShowTooltip}
			onMouseLeave={handleHideTooltip}
			$tooltipVisible={tooltipVisible}
		>
			<p>{props.value}</p>
			{tooltipVisible &&
				tooltipPosition &&
				typeof document !== 'undefined' &&
				ReactDOM.createPortal(
					<S.Tooltip id={tooltipId} role="tooltip" $placement={props.tooltipPlacement} $position={tooltipPosition}>
						{copied ? `${props.copiedLabel}!` : props.value}
					</S.Tooltip>,
					document.body
				)}
		</S.Value>
	);
}

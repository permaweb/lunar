import { ReactSVG } from 'react-svg';

import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';
import { IProps } from './types';

export default function Button(props: IProps) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider?.object?.[languageProvider.current] || { loading: 'Loading' };
	const warning = props.warning || props.type === 'warning';
	const success = !warning && (props.success || props.type === 'success');

	const buttonStyle = getType();
	const StyledButton = buttonStyle.wrapper;
	const StyledIcon = buttonStyle.icon;

	function getType() {
		let buttonObj: {
			wrapper: any;
			icon: any;
		};

		switch (props.type) {
			case 'primary':
				buttonObj = {
					wrapper: S.Primary,
					icon: S.IconPrimary,
				};
				break;
			case 'alt1':
				buttonObj = {
					wrapper: S.Alt1,
					icon: S.IconAlt1,
				};
				break;
			case 'alt2':
				buttonObj = {
					wrapper: S.Alt2,
					icon: S.IconAlt2,
				};
				break;
			case 'alt3':
				buttonObj = {
					wrapper: S.Alt3,
					icon: S.IconAlt3,
				};
				break;
			case 'alt4':
				buttonObj = {
					wrapper: S.Alt4,
					icon: S.IconAlt4,
				};
				break;
			case 'warning':
				buttonObj = {
					wrapper: S.Warning,
					icon: S.IconWarning,
				};
				break;
			case 'success':
				buttonObj = {
					wrapper: S.Success,
					icon: S.IconSuccess,
				};
				break;
			default:
				buttonObj = {
					wrapper: S.Primary,
					icon: S.IconPrimary,
				};
				break;
		}
		return buttonObj;
	}

	function hasLabel() {
		return props.label !== undefined && props.label !== null && props.label !== '';
	}

	function getLabel() {
		const showLabel = hasLabel();

		return (
			<>
				{props.icon && props.iconLeftAlign && (
					<StyledIcon
						warning={warning}
						success={success}
						disabled={props.disabled || false}
						active={props.active || false}
						leftAlign={props.iconLeftAlign}
						noLabel={!showLabel}
						iconSize={props.iconSize}
					>
						<ReactSVG src={props.icon} />
					</StyledIcon>
				)}
				{showLabel && <span>{props.loading ? `${language.loading}...` : props.label}</span>}
				{props.icon && !props.iconLeftAlign && (
					<StyledIcon
						warning={warning}
						success={success}
						disabled={props.disabled || false}
						active={props.active || false}
						leftAlign={props.iconLeftAlign || false}
						noLabel={!showLabel}
						iconSize={props.iconSize}
					>
						<ReactSVG src={props.icon} />
					</StyledIcon>
				)}
			</>
		);
	}

	function handlePress(e: React.MouseEvent) {
		if (props.stopPropagation) e.stopPropagation();
		if (props.preventDefault) e.preventDefault();
		props.handlePress(e);
	}

	function getAction() {
		const iconOnly = !hasLabel() && !!props.icon;

		return (
			<StyledButton
				tabIndex={props.noFocus || props.disabled ? -1 : 0}
				type={props.formSubmit ? 'submit' : 'button'}
				onClick={handlePress}
				onKeyPress={handlePress}
				disabled={props.disabled}
				active={props.active}
				useMaxWidth={props.useMaxWidth}
				noMinWidth={props.noMinWidth}
				fullWidth={props.fullWidth}
				width={props.width}
				height={props.height}
				warning={warning}
				success={success}
				iconOnly={iconOnly}
				padding={props.padding}
				className={props.className || ''}
			>
				{getLabel()}
			</StyledButton>
		);
	}

	function getButton() {
		if (props.tooltip) {
			return (
				<S.Wrapper>
					<S.Tooltip className={'info'} position={props.tooltipPosition || 'bottom'}>
						<span>{props.tooltip}</span>
					</S.Tooltip>
					{getAction()}
				</S.Wrapper>
			);
		} else {
			return getAction();
		}
	}

	return getButton();
}

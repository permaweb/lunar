import { ReactSVG } from 'react-svg';

import * as S from './styles';
import { IProps } from './types';

export default function Button(props: IProps) {
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
			default:
				buttonObj = {
					wrapper: S.Primary,
					icon: S.IconPrimary,
				};
				break;
		}
		return buttonObj;
	}

	function getLabel() {
		return (
			<>
				{props.icon && props.iconLeftAlign && (
					<StyledIcon
						warning={props.warning || false}
						disabled={props.disabled}
						active={props.active}
						leftAlign={props.iconLeftAlign}
					>
						<ReactSVG src={props.icon} />
					</StyledIcon>
				)}
				<span>{props.loading ? `Loading...` : props.label}</span>
				{props.icon && !props.iconLeftAlign && (
					<StyledIcon
						warning={props.warning || false}
						disabled={props.disabled}
						active={props.active}
						leftAlign={props.iconLeftAlign}
					>
						<ReactSVG src={props.icon} />
					</StyledIcon>
				)}
			</>
		);
	}

	function handlePress(e: React.MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		props.handlePress(e);
	}

	function getAction() {
		return (
			<StyledButton
				tabIndex={props.noFocus ? -1 : 0}
				type={props.formSubmit ? 'submit' : 'button'}
				onClick={props.handlePress}
				onKeyPress={handlePress}
				disabled={props.disabled}
				active={props.active}
				useMaxWidth={props.useMaxWidth}
				noMinWidth={props.noMinWidth}
				fullWidth={props.fullWidth}
				width={props.width}
				height={props.height}
				warning={props.warning || false}
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
					<S.Tooltip className={'info'} useBottom={true}>
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

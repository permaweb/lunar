import React from 'react';
import { ReactSVG } from 'react-svg';

import { Modal } from 'components/atoms/Modal';
import { ASSETS } from 'helpers/config';
import { formatRequiredField } from 'helpers/utils';

import { Button } from '../Button';

import * as S from './styles';
import { IProps } from './types';

export default function FormField(props: IProps) {
	const [showTooltip, setShowTooltip] = React.useState<boolean>(false);

	function getValue() {
		if (props.type === 'number') {
			return isNaN(Number(props.value)) ? '' : props.value;
		} else {
			return props.value;
		}
	}

	const input = (
		<S.Input
			aria-label={props.label || props.placeholder || undefined}
			aria-haspopup={props['aria-haspopup']}
			aria-keyshortcuts={props['aria-keyshortcuts']}
			type={props.type ? props.type : 'text'}
			step={props.step ? props.step : '1'}
			value={getValue()}
			onWheel={(e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur()}
			onChange={props.onChange}
			onFocus={props.onFocus}
			onBlur={props.onBlur}
			onClick={props.onClick}
			onKeyDown={props.onKeyDown}
			readOnly={props.readOnly}
			disabled={props.disabled}
			invalid={props.invalid.status}
			placeholder={props.placeholder ? props.placeholder : ''}
			sm={props.sm}
			$large={props.size === 'large'}
			$hasIcon={!!props.icon}
			$hasEndAdornment={!!props.endAdornment}
			autoFocus={props.autoFocus ? props.autoFocus : false}
			data-testid={props.testingCtx}
		/>
	);

	return (
		<>
			{props.tooltip && showTooltip && (
				<Modal header={props.tooltipLabel ? props.tooltipLabel : props.label} onClose={() => setShowTooltip(false)}>
					<S.Tooltip>
						<p>{props.tooltip}</p>
					</S.Tooltip>
				</Modal>
			)}
			<S.Wrapper sm={props.sm}>
				{props.label && (
					<S.TWrapper>
						{props.label && <S.Label>{props.required ? formatRequiredField(props.label) : props.label}</S.Label>}
						{props.tooltip && (
							<Button
								type={'primary'}
								active={false}
								icon={ASSETS.info}
								onPress={() => setShowTooltip(!showTooltip)}
								height={22.5}
								width={22.5}
								noMinWidth
								iconSize={13.5}
								stopPropagation
								preventDefault
							/>
						)}
					</S.TWrapper>
				)}
				{props.icon || props.endAdornment ? (
					<S.Control>
						{props.icon && (
							<S.LeadingIcon $large={props.size === 'large'} aria-hidden={'true'}>
								<ReactSVG src={props.icon} />
							</S.LeadingIcon>
						)}
						{input}
						{props.endAdornment && (
							<S.EndAdornment $large={props.size === 'large'}>{props.endAdornment}</S.EndAdornment>
						)}
					</S.Control>
				) : (
					input
				)}
				{props.endText && (
					<S.EndTextContainer disabled={props.disabled} sm={props.sm}>
						{props.endText && <S.EndText sm={props.sm}>{props.endText}</S.EndText>}
					</S.EndTextContainer>
				)}
				{!props.hideErrorMessage && props.invalid.message && (
					<S.ErrorContainer>{props.invalid.message && <S.Error>{props.invalid.message}</S.Error>}</S.ErrorContainer>
				)}
			</S.Wrapper>
		</>
	);
}

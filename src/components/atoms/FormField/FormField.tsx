import React from 'react';

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

	return (
		<>
			{props.tooltip && showTooltip && (
				<Modal header={props.tooltipLabel ? props.tooltipLabel : props.label} handleClose={() => setShowTooltip(false)}>
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
								handlePress={() => setShowTooltip(!showTooltip)}
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
				<S.Input
					type={props.type ? props.type : 'text'}
					step={props.step ? props.step : '1'}
					value={getValue()}
					onWheel={(e: any) => e.target.blur()}
					onChange={props.onChange}
					onFocus={() => (props.onFocus ? props.onFocus() : {})}
					disabled={props.disabled}
					invalid={props.invalid.status}
					placeholder={props.placeholder ? props.placeholder : ''}
					sm={props.sm}
					autoFocus={props.autoFocus ? props.autoFocus : false}
					data-testid={props.testingCtx}
				/>
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

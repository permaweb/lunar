import { formatRequiredField } from 'helpers/utils';

import * as S from './styles';
import { IProps } from './types';

export default function TextArea(props: IProps) {
	const id = React.useId();
	return (
		<S.Wrapper>
			{props.label && <S.Label htmlFor={id}>{props.required ? formatRequiredField(props.label) : props.label}</S.Label>}
			<S.TextArea
				id={id}
				aria-label={props.label || props.placeholder}
				aria-invalid={props.invalid.status}
				aria-describedby={props.invalid.message ? `${id}-error` : undefined}
				value={props.value}
				onChange={props.onChange}
				onFocus={() => (props.onFocus ? props.onFocus() : {})}
				disabled={props.disabled}
				invalid={props.invalid.status}
				placeholder={props.placeholder ? props.placeholder : ''}
				data-testid={props.testingCtx}
			/>
			{!props.hideErrorMessage && (
				<S.ErrorContainer>
					{props.invalid.message && <S.Error id={`${id}-error`}>{props.invalid.message}</S.Error>}
				</S.ErrorContainer>
			)}
		</S.Wrapper>
	);
}
import React from 'react';

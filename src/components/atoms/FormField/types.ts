import React from 'react';

import { FormFieldType, ValidationType } from 'helpers/types';

export interface IProps {
	value: number | string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onFocus?: () => void;
	onBlur?: () => void;
	invalid: ValidationType;
	disabled: boolean;
	label?: string;
	type?: FormFieldType;
	step?: '1';
	placeholder?: string;
	endText?: string;
	error?: string | null;
	sm?: boolean;
	testingCtx?: string;
	tooltip?: string;
	tooltipLabel?: string;
	autoFocus?: boolean;
	hideErrorMessage?: boolean;
	required?: boolean;
}

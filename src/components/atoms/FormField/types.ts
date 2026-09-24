import React from 'react';

import { FormFieldType, ValidationType } from 'helpers/types';

export interface IProps
	extends Pick<
		React.InputHTMLAttributes<HTMLInputElement>,
		'readOnly' | 'onClick' | 'onKeyDown' | 'aria-haspopup' | 'aria-keyshortcuts'
	> {
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
	size?: 'large';
	icon?: string;
	endAdornment?: React.ReactNode;
	testingCtx?: string;
	tooltip?: string;
	tooltipLabel?: string;
	autoFocus?: boolean;
	hideErrorMessage?: boolean;
	required?: boolean;
}

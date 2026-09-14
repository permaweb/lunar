import React from 'react';

import { ButtonType } from 'helpers/types';

export interface IProps {
	type: ButtonType;
	label?: string | number | React.ReactNode;
	onPress: (e: React.MouseEvent) => void;
	disabled?: boolean;
	active?: boolean;
	loading?: boolean;
	icon?: string;
	iconLeftAlign?: boolean;
	iconSize?: number;
	iconTone?: 'yellow';
	iconFilled?: boolean;
	pressed?: boolean;
	formSubmit?: boolean;
	noFocus?: boolean;
	useMaxWidth?: boolean;
	noMinWidth?: boolean;
	width?: number;
	height?: number;
	fullWidth?: boolean;
	tooltip?: string;
	tooltipPosition?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
	warning?: boolean;
	success?: boolean;
	className?: string;
	padding?: string;
	stopPropagation?: boolean;
	preventDefault?: boolean;
}

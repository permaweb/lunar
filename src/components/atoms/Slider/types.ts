import { ValidationType } from 'helpers/types';

export interface IProps {
	value: number;
	maxValue: number;
	onChange: (e: any) => void;
	invalid: ValidationType;
	label?: string;
	disabled: boolean;
	minValue?: number;
	useFractional?: boolean;
}

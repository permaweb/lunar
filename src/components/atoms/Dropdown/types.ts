import { DropdownOptionType } from 'helpers/types';

export interface IProps {
	label: string;
	options: DropdownOptionType[];
	disabled: boolean;
}

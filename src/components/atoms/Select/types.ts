import { SelectOptionType } from 'helpers/types';

export interface IProps {
	label?: string;
	activeOption: SelectOptionType;
	setActiveOption: (option: SelectOptionType) => void;
	options: SelectOptionType[];
	disabled: boolean;
	handleRemoveOption?: (option: SelectOptionType) => void;
	isOptionRemovable?: (option: SelectOptionType) => boolean;
	removeOptionLabel?: string;
}

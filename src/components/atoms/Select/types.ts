import { SelectOptionType } from 'helpers/types';

export interface IProps {
	label?: string;
	activeOption: SelectOptionType;
	setActiveOption: (option: SelectOptionType) => void;
	options: SelectOptionType[];
	disabled: boolean;
	onRemoveOption?: (option: SelectOptionType) => void;
	isOptionRemovable?: (option: SelectOptionType) => boolean;
	removeOptionLabel?: string;
	top?: number;
	/** `plain` drops the trigger's background, border and padding, leaving only a hover color change. */
	variant?: 'plain';
}

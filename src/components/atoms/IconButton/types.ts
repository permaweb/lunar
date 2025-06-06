import { ButtonType } from 'helpers/types';

export interface IProps {
	src: string;
	type: ButtonType;
	handlePress: any;
	active?: boolean;
	sm?: boolean;
	warning?: boolean;
	disabled?: boolean;
	dimensions?: {
		wrapper: number;
		icon: number;
	};
	tooltip?: string;
	tooltipPosition?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
	className?: string;
	noFocus?: boolean;
}

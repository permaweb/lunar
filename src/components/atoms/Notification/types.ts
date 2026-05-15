export interface IProps {
	message: string;
	callback: () => void | null;
	type: 'success' | 'warning' | 'info';
	persistent?: boolean;
}

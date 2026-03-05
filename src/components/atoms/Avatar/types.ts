export interface IProps {
	owner: any;
	isConnected: boolean;
	dimensions: {
		wrapper: number;
		icon: number;
	};
	callback: () => void | null;
}

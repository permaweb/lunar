import ExplorerLink from './ExplorerLink';
import { IProps } from './types';

export default function TxAddress(props: IProps) {
	return (
		<ExplorerLink
			value={props.address}
			type={'address'}
			wrap={props.wrap}
			viewIcon={props.viewIcon}
			tooltipPosition={props.tooltipPosition}
			handlePress={props.handlePress}
		/>
	);
}

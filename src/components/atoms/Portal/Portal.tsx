import React from 'react';
import ReactDOM from 'react-dom';

import { IProps } from './types';

export default function Portal(props: IProps) {
	const [DOM, setDOM] = React.useState<boolean>(false);
	React.useEffect(() => {
		setDOM(true);
	}, []);
	const container = props.container ?? document.getElementById(props.node);
	return DOM && container ? ReactDOM.createPortal(props.children, container) : null;
}

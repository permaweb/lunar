import React from 'react';

import { DocsDetail } from './DocsDetail';

export default function Docs() {
	React.useEffect(() => {
		document.documentElement.style.overscrollBehavior = 'none';

		return () => {
			document.documentElement.style.overscrollBehavior = 'auto';
		};
	}, []);

	return (
		<>
			<DocsDetail />
		</>
	);
}

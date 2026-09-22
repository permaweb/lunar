import React from 'react';
import { ReactSVG } from 'react-svg';

import { ASSETS } from 'helpers/config';

import * as S from './styles';

const STATUS_ICONS = {
	pending: ASSETS.pending,
	success: ASSETS.success,
	failure: ASSETS.warning,
};

// Decorative status dot. Pair it with visible status text; it carries no accessible name of its own.
export default function StatusIndicator(props: { status: 'pending' | 'success' | 'failure' }): React.ReactElement {
	return (
		<S.Wrapper $status={props.status} aria-hidden={'true'}>
			<ReactSVG src={STATUS_ICONS[props.status]} />
		</S.Wrapper>
	);
}

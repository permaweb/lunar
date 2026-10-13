import React from 'react';
import { ReactSVG } from 'react-svg';

import { ASSETS } from 'helpers/config';

import * as S from './styles';

const STATUS_ICONS = {
	pending: ASSETS.pending,
	success: ASSETS.success,
	failure: ASSETS.warning,
};

export default function StatusIndicator(props: {
	status: 'pending' | 'success' | 'failure';
	icon?: string;
}): React.ReactElement {
	return (
		<S.Wrapper $status={props.status} aria-hidden={'true'}>
			<ReactSVG src={props.icon ?? STATUS_ICONS[props.status]} />
		</S.Wrapper>
	);
}

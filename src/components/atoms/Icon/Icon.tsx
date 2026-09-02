import React from 'react';
import { ReactSVG } from 'react-svg';

import * as S from './styles';

export default function Icon(props: { src: string; size?: number; className?: string }): React.ReactElement {
	return (
		<S.Icon className={props.className} $size={props.size ?? 15} aria-hidden={'true'}>
			<ReactSVG src={props.src} />
		</S.Icon>
	);
}

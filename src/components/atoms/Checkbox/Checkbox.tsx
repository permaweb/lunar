import { ReactSVG } from 'react-svg';

import { ASSETS } from 'helpers/config';

import * as S from './styles';
import { IProps } from './types';

export default function Checkbox(props: IProps) {
	return (
		<S.Wrapper disabled={props.disabled}>
			<S.Input checked={props.checked} disabled={props.disabled} type={'checkbox'} onChange={props.onSelect} />
			{props.checked && <ReactSVG src={ASSETS.checkmark} />}
		</S.Wrapper>
	);
}

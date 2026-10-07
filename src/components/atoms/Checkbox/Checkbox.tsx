import { ReactSVG } from 'react-svg';

import { ASSETS } from 'helpers/config';

import * as S from './styles';

export default function Checkbox(props: {
	checked: boolean;
	onSelect: () => void;
	disabled: boolean;
	label?: string;
	description?: string;
}) {
	const control = (
		<S.Wrapper disabled={props.disabled}>
			<S.Input
				checked={props.checked}
				disabled={props.disabled}
				type={'checkbox'}
				onChange={props.onSelect}
				aria-label={props.label}
			/>
			{props.checked && <ReactSVG src={ASSETS.checkmark} />}
		</S.Wrapper>
	);
	return props.label ? (
		<S.Option $active={props.checked} $disabled={props.disabled}>
			{control}
			<S.OptionText>
				<span>{props.label}</span>
				{props.description && <p>{props.description}</p>}
			</S.OptionText>
		</S.Option>
	) : (
		control
	);
}
